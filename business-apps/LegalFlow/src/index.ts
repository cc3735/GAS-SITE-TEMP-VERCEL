import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { generalLimiter } from './middleware/rate-limit.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import mfaRoutes from './routes/mfa.js';
import legalDocumentsRoutes from './routes/legal/documents.js';
import legalTemplatesRoutes from './routes/legal/templates.js';
import legalBusinessRoutes from './routes/legal/business-formation.js';
import filingRoutes from './routes/filing/filings.js';
import filingInterviewRoutes from './routes/filing/interview.js';
import childSupportRoutes from './routes/child-support/calculator.js';
import paymentsRoutes from './routes/payments.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import adminDataRoutes from './routes/admin/data-management.js';
import collaborationPortalRoutes from './routes/collaboration/portal.js';
import expandedLegalRoutes from './routes/legal/expanded-services.js';
import technicalAdminRoutes from './routes/admin/technical.js';
import trademarkRoutes from './routes/legal/trademark.js';

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
    service: 'LegalFlow API',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    note: 'Financial services have been moved to FinanceFlow (port 3003)',
  });
});

// API Routes — Auth & Users
app.use('/api/auth', authRoutes);
app.use('/api/mfa', mfaRoutes);
app.use('/api/users', userRoutes);

// API Routes — Legal Documents
app.use('/api/legal/documents', legalDocumentsRoutes);
app.use('/api/legal/templates', legalTemplatesRoutes);
app.use('/api/legal/business', legalBusinessRoutes);
app.use('/api/legal/expanded', expandedLegalRoutes);
app.use('/api/legal/trademark', trademarkRoutes);

// API Routes — Court Filings
app.use('/api/filing', filingRoutes);
app.use('/api/filing/interview', filingInterviewRoutes);

// API Routes — Child Support
app.use('/api/child-support', childSupportRoutes);

// API Routes — Payments & Subscriptions
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);

// API Routes — Admin & Collaboration
app.use('/api/admin/data', adminDataRoutes);
app.use('/api/admin/technical', technicalAdminRoutes);
app.use('/api/collaboration', collaborationPortalRoutes);

// Legal disclaimer endpoint
app.get('/api/disclaimer', (_req, res) => {
  res.json({
    disclaimer: `
IMPORTANT LEGAL NOTICE

LegalFlow provides document preparation services only.

THIS IS NOT LEGAL ADVICE. This service does not provide legal advice. We are not a law firm and cannot represent you in court or provide legal counsel.

By using this service, you acknowledge that:
1. You understand this is a document preparation service, not a law firm
2. For complex legal matters, you should consult with a licensed attorney
3. We cannot guarantee the accuracy or completeness of any documents
4. Laws vary by jurisdiction and change frequently
5. You are responsible for reviewing all documents before filing

If you have questions about whether this service is right for your situation, please consult with a licensed professional in your jurisdiction.
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
  logger.info(`🚀 LegalFlow API server running on port ${port}`);
  logger.info(`📚 Environment: ${config.nodeEnv}`);
  logger.info(`🔐 Auth: Supabase + JWT`);
  logger.info(`💳 Payments: Stripe`);
  logger.info(`🤖 AI: OpenAI ${config.openai.model}`);
});

export default app;
