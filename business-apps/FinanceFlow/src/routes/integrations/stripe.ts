/**
 * Stripe Payment Routes
 *
 * Handles payment link generation, checkout sessions, and webhook events
 * for accounts receivable invoices.
 *
 * @module routes/integrations/stripe
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { supabase } from '../../lib/supabase.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import * as stripeService from '../../services/integrations/stripe.js';

const router = Router();

// ─── Authenticated routes ────────────────────────────────────────────────────

/**
 * POST /payment-link/:arId
 * Generate a Stripe Payment Link for an AR invoice.
 */
router.post('/payment-link/:arId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { arId } = req.params;

    // Fetch the AR record (verify ownership)
    const { data: ar, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', arId)
      .eq('user_id', (req as any).user.id)
      .single();

    if (error || !ar) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    if (ar.status === 'paid') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Invoice is already paid' } });
    }

    const result = await stripeService.createPaymentLink(ar);

    // Store the payment link URL on the AR record
    await supabase
      .from('accounts_receivable')
      .update({ payment_link_url: result.paymentLinkUrl })
      .eq('id', arId);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /checkout-session/:arId
 * Create a Stripe Checkout Session for an AR invoice.
 */
router.post('/checkout-session/:arId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { arId } = req.params;
    const { successUrl, cancelUrl } = req.body;

    const { data: ar, error } = await supabase
      .from('accounts_receivable')
      .select('*')
      .eq('id', arId)
      .eq('user_id', (req as any).user.id)
      .single();

    if (error || !ar) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    if (ar.status === 'paid') {
      return res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Invoice is already paid' } });
    }

    const result = await stripeService.createCheckoutSession(ar, successUrl, cancelUrl);

    // Store the session ID
    await supabase
      .from('accounts_receivable')
      .update({ stripe_checkout_session_id: result.sessionId })
      .eq('id', arId);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /payment-status/:arId
 * Check payment status for an AR invoice.
 */
router.get('/payment-status/:arId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { arId } = req.params;

    const { data: ar, error } = await supabase
      .from('accounts_receivable')
      .select('id, amount, amount_received, status, stripe_payment_intent_id, payment_link_url')
      .eq('id', arId)
      .eq('user_id', (req as any).user.id)
      .single();

    if (error || !ar) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Invoice not found' } });
    }

    const balanceDue = ar.amount - ar.amount_received;

    res.json({
      success: true,
      data: {
        status: ar.status,
        amount: ar.amount,
        amountReceived: ar.amount_received,
        balanceDue,
        hasPaymentLink: !!ar.payment_link_url,
        paymentLinkUrl: ar.payment_link_url,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /status
 * Check if Stripe is configured.
 */
router.get('/status', authenticate, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { configured: stripeService.isConfigured() },
  });
});

export default router;

// ─── Webhook handler (exported separately for raw body mounting) ─────────────

/**
 * Stripe webhook handler — must receive raw body for signature verification.
 * Mounted directly in index.ts BEFORE express.json().
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;
  try {
    event = stripeService.constructWebhookEvent(req.body, signature);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed', { error: err });
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const arId = session.metadata?.ar_id;
        if (!arId) break;

        const amountPaid = (session.amount_total || 0) / 100;
        const paymentIntentId = session.payment_intent;

        // Update the AR record
        const { data: ar } = await supabase
          .from('accounts_receivable')
          .select('amount, amount_received, user_id')
          .eq('id', arId)
          .single();

        if (ar) {
          const newAmountReceived = Number(ar.amount_received) + amountPaid;
          const newStatus = newAmountReceived >= Number(ar.amount) ? 'paid' : 'partial';

          await supabase
            .from('accounts_receivable')
            .update({
              amount_received: newAmountReceived,
              status: newStatus,
              stripe_payment_intent_id: paymentIntentId,
              received_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
            })
            .eq('id', arId);

          // Record in payment history
          await supabase.from('payment_history').insert({
            user_id: ar.user_id,
            record_type: 'ar',
            record_id: arId,
            amount: amountPaid,
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntentId,
            notes: `Stripe checkout session ${session.id}`,
          });

          logger.info('Stripe payment recorded for AR', { arId, amount: amountPaid, status: newStatus });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Handle payment intents from payment links
        const paymentIntent = event.data.object as any;
        const arId = paymentIntent.metadata?.ar_id;
        if (!arId) break;

        const amountPaid = (paymentIntent.amount_received || 0) / 100;

        const { data: ar } = await supabase
          .from('accounts_receivable')
          .select('amount, amount_received, user_id, stripe_payment_intent_id')
          .eq('id', arId)
          .single();

        // Skip if already processed (idempotency)
        if (ar && ar.stripe_payment_intent_id !== paymentIntent.id) {
          const newAmountReceived = Number(ar.amount_received) + amountPaid;
          const newStatus = newAmountReceived >= Number(ar.amount) ? 'paid' : 'partial';

          await supabase
            .from('accounts_receivable')
            .update({
              amount_received: newAmountReceived,
              status: newStatus,
              stripe_payment_intent_id: paymentIntent.id,
              received_date: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : undefined,
            })
            .eq('id', arId);

          await supabase.from('payment_history').insert({
            user_id: ar.user_id,
            record_type: 'ar',
            record_id: arId,
            amount: amountPaid,
            payment_method: 'stripe',
            stripe_payment_intent_id: paymentIntent.id,
            notes: `Stripe payment intent ${paymentIntent.id}`,
          });

          logger.info('Stripe payment intent recorded for AR', { arId, amount: amountPaid });
        }
        break;
      }

      default:
        logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('Stripe webhook processing error', { error: err, eventType: event.type });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
