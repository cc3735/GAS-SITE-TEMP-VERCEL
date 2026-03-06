// PayPal Capture Payment — captures an approved PayPal order
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const PAYPAL_API_BASE = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Failed to get PayPal access token');
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    return res.status(503).json({ error: 'PayPal not configured.' });
  }

  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'Missing orderId' });

    const accessToken = await getPayPalAccessToken();

    const captureRes = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    const captureData = await captureRes.json();

    if (captureData.status === 'COMPLETED') {
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
      const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

      const courseId = captureData.purchase_units?.[0]?.reference_id;
      const email = captureData.payer?.email_address;

      if (courseId && email) {
        await supabase.from('course_purchases').insert({
          course_id: courseId,
          user_email: email,
          payment_method: 'paypal',
          amount_paid: parseFloat(capture?.amount?.value || '0'),
          currency: capture?.amount?.currency_code || 'USD',
          transaction_id: capture?.id || orderId,
          payment_status: 'completed',
        });

        await supabase.from('course_enrollments').insert({
          course_id: courseId,
          user_email: email,
          enrollment_type: 'purchased',
        });
      }

      return res.status(200).json({ transactionId: capture?.id || orderId, status: 'completed' });
    }

    return res.status(400).json({ error: 'Payment not completed', status: captureData.status });
  } catch (error: any) {
    console.error('PayPal capture error:', error);
    return res.status(500).json({ error: error.message || 'Failed to capture payment' });
  }
}
