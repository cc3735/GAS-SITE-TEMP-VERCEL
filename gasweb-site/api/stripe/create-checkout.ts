// Stripe Checkout Session — creates a Stripe Checkout session for course purchases
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-12-18.acacia' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({ error: 'Stripe not configured. Set STRIPE_SECRET_KEY env var.' });
  }

  try {
    const { courseId, amount, currency, email, userId, isSubscription, couponCode, successUrl, cancelUrl, purchaseType, creditAmount, price } = req.body;

    // TTS credit purchase flow
    if (purchaseType === 'tts_credits') {
      if (!creditAmount || !price || !email || !userId) {
        return res.status(400).json({ error: 'Missing required fields for credit purchase' });
      }

      const creditSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        mode: 'payment',
        metadata: { purchaseType: 'tts_credits', userId, creditAmount: String(creditAmount) },
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: `HD Audio Credits — ${Number(creditAmount).toLocaleString()} characters` },
            unit_amount: Math.round(price),
          },
          quantity: 1,
        }],
        success_url: successUrl || `${req.headers.origin}/portal/courses?credits_purchased=true`,
        cancel_url: cancelUrl || `${req.headers.origin}/portal/courses?cancelled=true`,
      });

      return res.status(200).json({ url: creditSession.url, sessionId: creditSession.id });
    }

    // Course purchase flow (existing)
    if (!courseId || !amount || !email) {
      return res.status(400).json({ error: 'Missing required fields: courseId, amount, email' });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer_email: email,
      metadata: { courseId, userId: userId || '', couponCode: couponCode || '' },
      success_url: successUrl || `${req.headers.origin}/education/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${req.headers.origin}/education?cancelled=true`,
    };

    if (isSubscription) {
      sessionParams.mode = 'subscription';
      sessionParams.line_items = [{
        price_data: {
          currency: currency || 'usd',
          product_data: { name: `Course Subscription: ${courseId}` },
          unit_amount: Math.round(amount * 100),
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }];
    } else {
      sessionParams.mode = 'payment';
      sessionParams.line_items = [{
        price_data: {
          currency: currency || 'usd',
          product_data: { name: `Course: ${courseId}` },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}
