import { Router } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../utils/supabase.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config/index.js';
import { ValidationError, PaymentError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

// Stripe product/price IDs (would be configured in Stripe dashboard)
const PRICE_IDS = {
  basic_monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly',
  tax_return_basic: process.env.STRIPE_PRICE_TAX_BASIC || 'price_tax_basic',
  tax_return_premium: process.env.STRIPE_PRICE_TAX_PREMIUM || 'price_tax_premium',
  tax_return_pro: process.env.STRIPE_PRICE_TAX_PRO || 'price_tax_pro',
  legal_document: process.env.STRIPE_PRICE_LEGAL_DOC || 'price_legal_doc',
  legal_filing: process.env.STRIPE_PRICE_LEGAL_FILING || 'price_legal_filing',
};

// Create checkout session for subscription
router.post('/create-checkout-session', authenticate, asyncHandler(async (req, res) => {
  const { tier, successUrl, cancelUrl } = req.body;

  if (!tier || !successUrl || !cancelUrl) {
    throw new ValidationError('Tier, success URL, and cancel URL are required');
  }

  // Get or create Stripe customer
  let stripeCustomerId: string;

  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('email')
    .eq('id', req.user!.id)
    .single();

  // Check if user already has a Stripe customer ID in subscriptions
  const { data: existingSubscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', req.user!.id)
    .single();

  if (existingSubscription?.stripe_subscription_id) {
    // Get customer from existing subscription
    const subscription = await stripe.subscriptions.retrieve(existingSubscription.stripe_subscription_id);
    stripeCustomerId = subscription.customer as string;
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email: profile?.email || req.user!.email,
      metadata: {
        userId: req.user!.id,
      },
    });
    stripeCustomerId = customer.id;
  }

  // Get price ID for tier
  const priceId = tier === 'basic' ? PRICE_IDS.basic_monthly : PRICE_IDS.premium_monthly;

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId: req.user!.id,
      tier,
    },
  });

  res.json({
    success: true,
    data: {
      sessionId: session.id,
      url: session.url,
    },
  });
}));

// Create payment intent for one-time purchase
router.post('/create-payment-intent', authenticate, asyncHandler(async (req, res) => {
  const { amount, serviceType, serviceId, description } = req.body;

  if (!amount || !serviceType) {
    throw new ValidationError('Amount and service type are required');
  }

  // Validate amount
  if (amount < 100) { // Minimum $1.00
    throw new ValidationError('Amount must be at least $1.00');
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount, // Amount in cents
    currency: 'usd',
    metadata: {
      userId: req.user!.id,
      serviceType,
      serviceId: serviceId || '',
    },
    description: description || `LegalFlow ${serviceType}`,
  });

  // Record pending transaction
  await supabaseAdmin.from('transactions').insert({
    user_id: req.user!.id,
    stripe_payment_intent_id: paymentIntent.id,
    amount: amount / 100, // Store in dollars
    service_type: serviceType,
    service_id: serviceId || null,
    status: 'pending',
  });

  res.json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    },
  });
}));

// Get payment history
router.get('/history', authenticate, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const { data: transactions, count, error } = await supabaseAdmin
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (error) {
    throw new ValidationError('Failed to fetch payment history');
  }

  res.json({
    success: true,
    data: {
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        currency: t.currency,
        serviceType: t.service_type,
        status: t.status,
        createdAt: t.created_at,
      })),
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
      },
    },
  });
}));

// Stripe webhook handler
router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    throw new ValidationError('Missing Stripe signature');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    throw new PaymentError('Webhook signature verification failed');
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        const userId = session.metadata?.userId;
        const tier = session.metadata?.tier;

        if (userId && tier) {
          // Create or update subscription record
          await supabaseAdmin.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: session.subscription as string,
            tier,
            status: 'active',
            current_period_start: new Date().toISOString(),
          }, { onConflict: 'user_id' });

          // Update user profile
          await supabaseAdmin
            .from('user_profiles')
            .update({
              subscription_tier: tier,
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Update transaction status
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'completed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', paymentIntent.id);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { data: subRecord } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subRecord) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Update user profile status
        await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_status: subscription.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', subRecord.user_id);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { data: subRecord } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_subscription_id', subscription.id)
        .single();

      if (subRecord) {
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        // Downgrade user to free tier
        await supabaseAdmin
          .from('user_profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', subRecord.user_id);
      }
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}));

export default router;

