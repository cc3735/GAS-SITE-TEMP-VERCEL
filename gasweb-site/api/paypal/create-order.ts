// PayPal Create Order — creates a PayPal order for course purchases
import type { VercelRequest, VercelResponse } from '@vercel/node';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET env vars.' });
  }

  try {
    const { courseId, amount, currency, email } = req.body;
    if (!courseId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: courseId, amount' });
    }

    const accessToken = await getPayPalAccessToken();

    const orderRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: courseId,
          description: `Course: ${courseId}`,
          amount: {
            currency_code: (currency || 'USD').toUpperCase(),
            value: amount.toFixed(2),
          },
        }],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: `${req.headers.origin}/education/success`,
              cancel_url: `${req.headers.origin}/education?cancelled=true`,
            },
          },
        },
      }),
    });

    const order = await orderRes.json();
    const approvalLink = order.links?.find((l: any) => l.rel === 'approve' || l.rel === 'payer-action');

    return res.status(200).json({
      orderId: order.id,
      approvalUrl: approvalLink?.href || null,
      status: order.status,
    });
  } catch (error: any) {
    console.error('PayPal create order error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create PayPal order' });
  }
}
