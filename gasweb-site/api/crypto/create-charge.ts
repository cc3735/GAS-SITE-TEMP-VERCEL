// Crypto Payment — creates a Coinbase Commerce charge for course purchases
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.COINBASE_COMMERCE_API_KEY) {
    return res.status(503).json({ error: 'Crypto payments not configured. Set COINBASE_COMMERCE_API_KEY env var.' });
  }

  try {
    const { courseId, amount, currency, email, name, description } = req.body;
    if (!courseId || !amount) {
      return res.status(400).json({ error: 'Missing required fields: courseId, amount' });
    }

    const chargeRes = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': process.env.COINBASE_COMMERCE_API_KEY,
        'X-CC-Version': '2018-03-22',
      },
      body: JSON.stringify({
        name: name || `Course: ${courseId}`,
        description: description || `Purchase of course ${courseId}`,
        pricing_type: 'fixed_price',
        local_price: {
          amount: amount.toString(),
          currency: (currency || 'USD').toUpperCase(),
        },
        metadata: { courseId, email },
        redirect_url: `${req.headers.origin}/education/success`,
        cancel_url: `${req.headers.origin}/education?cancelled=true`,
      }),
    });

    const charge = await chargeRes.json();

    return res.status(200).json({
      chargeId: charge.data?.id,
      hostedUrl: charge.data?.hosted_url,
      expiresAt: charge.data?.expires_at,
    });
  } catch (error: any) {
    console.error('Crypto charge error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create crypto charge' });
  }
}
