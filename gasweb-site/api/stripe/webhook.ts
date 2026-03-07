// Stripe Webhook — handles payment events (payment success, subscription updates)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ error: 'Stripe webhook not configured.' });
  }

  try {
    const rawBody = await getRawBody(req);
    const sig = req.headers['stripe-signature'] as string;
    const event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);

    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { courseId, userId, purchaseType, creditAmount } = session.metadata || {};

        // TTS credit fulfillment
        if (purchaseType === 'tts_credits' && userId && creditAmount) {
          const amt = parseInt(creditAmount);
          const { data: existing } = await supabase
            .from('tts_credit_balances')
            .select('credits_remaining, credits_purchased')
            .eq('user_id', userId)
            .single();

          if (existing) {
            await supabase.from('tts_credit_balances').update({
              credits_remaining: existing.credits_remaining + amt,
              credits_purchased: existing.credits_purchased + amt,
              updated_at: new Date().toISOString(),
            }).eq('user_id', userId);
          } else {
            await supabase.from('tts_credit_balances').insert({
              user_id: userId,
              credits_remaining: amt,
              credits_purchased: amt,
            });
          }
          break;
        }

        // Course purchase fulfillment (existing)
        if (courseId) {
          await supabase.from('course_purchases').insert({
            course_id: courseId,
            user_email: session.customer_email,
            user_id: userId || null,
            payment_method: 'stripe',
            amount_paid: (session.amount_total || 0) / 100,
            currency: session.currency || 'usd',
            transaction_id: session.payment_intent as string,
            payment_status: 'completed',
            is_subscription: session.mode === 'subscription',
            subscription_id: session.subscription as string || null,
          });

          await supabase.from('course_enrollments').insert({
            course_id: courseId,
            user_email: session.customer_email,
            user_id: userId || null,
            enrollment_type: session.mode === 'subscription' ? 'subscription' : 'purchased',
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await supabase.from('course_purchases')
          .update({ subscription_status: 'cancelled' })
          .eq('subscription_id', subscription.id);
        break;
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ error: error.message });
  }
}
