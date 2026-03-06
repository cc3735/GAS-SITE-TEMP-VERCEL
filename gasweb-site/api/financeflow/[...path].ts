// FinanceFlow catch-all — routes /api/financeflow/* to the FinanceFlow Express app
//
// Prerequisites:
// 1. Run `npm install` in business-apps/FinanceFlow/
// 2. Set env vars: OPENAI_API_KEY, STRIPE_SECRET_KEY, PLAID_CLIENT_ID, PLAID_SECRET, ZOHO_BOOKS_TOKEN, JWT_SECRET, ENCRYPTION_KEY
// 3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamic import to avoid build errors when dependencies aren't installed
    const { default: app } = await import('../../../business-apps/FinanceFlow/src/index');

    // Rewrite URL: /api/financeflow/tax/returns → /api/tax/returns
    const originalUrl = req.url || '';
    req.url = originalUrl.replace(/^\/api\/financeflow/, '/api');

    return app(req, res);
  } catch (error: any) {
    console.error('FinanceFlow backend error:', error);
    return res.status(503).json({
      error: 'FinanceFlow backend not available',
      message: error.message,
      hint: 'Run `npm install` in business-apps/FinanceFlow/ and set required env vars',
    });
  }
}
