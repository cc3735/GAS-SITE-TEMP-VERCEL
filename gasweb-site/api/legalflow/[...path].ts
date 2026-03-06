// LegalFlow catch-all — routes /api/legalflow/* to the LegalFlow Express app
//
// Prerequisites:
// 1. Run `npm install` in business-apps/LegalFlow/
// 2. Set env vars: OPENAI_API_KEY, STRIPE_SECRET_KEY, GOOGLE_CLOUD_API_KEY, JWT_SECRET, ENCRYPTION_KEY
// 3. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Dynamic import to avoid build errors when dependencies aren't installed
    const { default: app } = await import('../../../business-apps/LegalFlow/src/index');

    // Rewrite URL: /api/legalflow/legal/documents → /api/legal/documents
    const originalUrl = req.url || '';
    req.url = originalUrl.replace(/^\/api\/legalflow/, '/api');

    return app(req, res);
  } catch (error: any) {
    console.error('LegalFlow backend error:', error);
    return res.status(503).json({
      error: 'LegalFlow backend not available',
      message: error.message,
      hint: 'Run `npm install` in business-apps/LegalFlow/ and set required env vars',
    });
  }
}
