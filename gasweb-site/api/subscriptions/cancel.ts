// Subscription Cancellation — cancels a Stripe subscription
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured.' });
  }

  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });

    // Cancel at period end (graceful cancellation)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update database
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    await supabase.from('course_purchases')
      .update({
        subscription_status: 'cancelling',
        subscription_expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscriptionId);

    return res.status(200).json({
      success: true,
      cancelAt: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error: any) {
    console.error('Subscription cancel error:', error);
    return res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
  }
}
