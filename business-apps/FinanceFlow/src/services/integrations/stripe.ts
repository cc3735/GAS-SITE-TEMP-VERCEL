/**
 * Stripe Integration Service
 *
 * Handles payment link generation, checkout sessions, and webhook processing
 * for invoice payments (Accounts Receivable).
 *
 * @module services/integrations/stripe
 */

import Stripe from 'stripe';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

let stripeClient: Stripe | null = null;

function getClient(): Stripe {
  if (!stripeClient) {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    stripeClient = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
    });
  }
  return stripeClient;
}

export interface PaymentLinkResult {
  paymentLinkUrl: string;
  paymentLinkId: string;
}

export interface CheckoutSessionResult {
  sessionUrl: string;
  sessionId: string;
}

/**
 * Create a Stripe Payment Link for an AR invoice.
 */
export async function createPaymentLink(arRecord: {
  id: string;
  client_name: string;
  amount: number;
  amount_received: number;
  description?: string;
  invoice_number?: string;
}): Promise<PaymentLinkResult> {
  const stripe = getClient();
  const balanceDue = arRecord.amount - arRecord.amount_received;

  if (balanceDue <= 0) {
    throw new Error('Invoice is already fully paid');
  }

  // Create a price for this invoice
  const price = await stripe.prices.create({
    unit_amount: Math.round(balanceDue * 100), // cents
    currency: 'usd',
    product_data: {
      name: arRecord.invoice_number
        ? `Invoice #${arRecord.invoice_number}`
        : `Invoice for ${arRecord.client_name}`,
      metadata: { ar_id: arRecord.id },
    },
  });

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { ar_id: arRecord.id },
    after_completion: { type: 'redirect', redirect: { url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/financeflow/invoicing?paid=${arRecord.id}` } },
  });

  logger.info('Created Stripe payment link', { arId: arRecord.id, linkId: paymentLink.id });

  return {
    paymentLinkUrl: paymentLink.url,
    paymentLinkId: paymentLink.id,
  };
}

/**
 * Create a Stripe Checkout Session for an AR invoice.
 */
export async function createCheckoutSession(
  arRecord: {
    id: string;
    client_name: string;
    amount: number;
    amount_received: number;
    description?: string;
    invoice_number?: string;
    client_email?: string;
  },
  successUrl?: string,
  cancelUrl?: string,
): Promise<CheckoutSessionResult> {
  const stripe = getClient();
  const balanceDue = arRecord.amount - arRecord.amount_received;

  if (balanceDue <= 0) {
    throw new Error('Invoice is already fully paid');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: arRecord.client_email || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(balanceDue * 100),
          product_data: {
            name: arRecord.invoice_number
              ? `Invoice #${arRecord.invoice_number}`
              : `Invoice for ${arRecord.client_name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: { ar_id: arRecord.id },
    success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/financeflow/invoicing?paid=${arRecord.id}`,
    cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/financeflow/invoicing`,
  });

  logger.info('Created Stripe checkout session', { arId: arRecord.id, sessionId: session.id });

  return {
    sessionUrl: session.url!,
    sessionId: session.id,
  };
}

/**
 * Construct and verify a Stripe webhook event from a raw request body.
 */
export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string,
): Stripe.Event {
  const stripe = getClient();
  if (!config.stripe.webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }
  return stripe.webhooks.constructEvent(payload, signature, config.stripe.webhookSecret);
}

/**
 * Retrieve a payment intent by ID.
 */
export async function retrievePaymentIntent(id: string) {
  const stripe = getClient();
  return stripe.paymentIntents.retrieve(id);
}

/**
 * Check if Stripe is configured and ready.
 */
export function isConfigured(): boolean {
  return !!config.stripe.secretKey;
}
