import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';

// Import routes
import taxReturnsRoutes from './routes/tax/returns.js';
import taxInterviewRoutes from './routes/tax/interview.js';
import taxDocumentsRoutes from './routes/tax/documents.js';
import taxCalculationsRoutes from './routes/tax/calculations.js';
import taxCalculatorRoutes from './routes/tax/calculator.js';
import taxEstimateRoutes from './routes/tax/estimate.js';
import eFilingRoutes from './routes/tax/e-filing.js';
import businessTaxRoutes from './routes/tax/business.js';
import priorYearRoutes from './routes/tax/prior-year.js';
import stateEFilingRoutes from './routes/tax/state-e-filing.js';
import bookkeepingRoutes from './routes/bookkeeping/bookkeeping.js';
import bankStatementsRoutes from './routes/bookkeeping/bank-statements.js';
import apArRoutes from './routes/bookkeeping/ap-ar.js';
import accountingRoutes from './routes/accounting.js';
import plaidRoutes from './routes/integrations/plaid.js';
import stripeRoutes, { stripeWebhookHandler } from './routes/integrations/stripe.js';
import zohoBooksRoutes from './routes/integrations/zoho-books.js';
import aiTaxAdvisorRoutes from './routes/ai/tax-advisor.js';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: config.isDev ? false : undefined,
}));

// CORS
app.use(cors({
  origin: config.isDev
    ? ['http://localhost:5173', 'http://localhost:3000']
    : process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
}));

// Stripe webhook needs raw body for signature verification (before JSON parser)
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'FinanceFlow API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes — Tax
app.use('/api/tax/returns', taxReturnsRoutes);
app.use('/api/tax/interview', taxInterviewRoutes);
app.use('/api/tax/documents', taxDocumentsRoutes);
app.use('/api/tax/calculations', taxCalculationsRoutes);
app.use('/api/tax/calculator', taxCalculatorRoutes);
app.use('/api/tax/estimate', taxEstimateRoutes);
app.use('/api/tax/e-filing', eFilingRoutes);
app.use('/api/tax/business', businessTaxRoutes);
app.use('/api/tax/prior-year', priorYearRoutes);
app.use('/api/tax/state', stateEFilingRoutes);

// API Routes — Bookkeeping & Accounting
app.use('/api/bookkeeping', bookkeepingRoutes);
app.use('/api/bookkeeping/statements', bankStatementsRoutes);
app.use('/api/bookkeeping', apArRoutes);
app.use('/api/accounting', accountingRoutes);

// API Routes — Integrations
app.use('/api/plaid', plaidRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/zoho-books', zohoBooksRoutes);

// API Routes — AI
app.use('/api/ai/tax-advisor', aiTaxAdvisorRoutes);

// Disclaimer endpoint
app.get('/api/disclaimer', (_req, res) => {
  res.json({
    disclaimer: `
IMPORTANT NOTICE

FinanceFlow provides tax preparation and financial management services.

THIS IS NOT TAX ADVICE. This service provides document preparation and calculation tools only. We are not a CPA firm and cannot provide professional tax advice.

By using this service, you acknowledge that:
1. You understand this is a tax preparation and bookkeeping tool, not a CPA firm
2. For complex tax matters, you should consult with a licensed CPA or tax professional
3. We cannot guarantee the accuracy or completeness of any calculations
4. Tax laws vary by jurisdiction and change frequently
5. You are responsible for reviewing all documents before filing
6. E-filing is subject to IRS and state agency acceptance

If you have questions about whether this service is right for your situation, please consult with a licensed tax professional.
    `.trim(),
    lastUpdated: '2024-01-01',
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
const port = config.port;

app.listen(port, () => {
  logger.info(`🚀 FinanceFlow API server running on port ${port}`);
  logger.info(`📚 Environment: ${config.nodeEnv}`);
  logger.info(`🔐 Auth: Supabase + JWT`);
  logger.info(`💳 Payments: Stripe`);
  logger.info(`🤖 AI: OpenAI ${config.openai.model}`);
  logger.info(`🏦 Banking: Plaid`);
  logger.info(`📖 Accounting: Zoho Books`);
});

export default app;
