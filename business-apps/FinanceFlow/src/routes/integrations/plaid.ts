/**
 * Plaid Integration Routes
 *
 * Provides endpoints for Plaid Link integration, account management,
 * tax document import, investment tracking, and direct deposit setup.
 *
 * @module routes/integrations/plaid
 */

import { Router, Request, Response, NextFunction } from 'express';
import { plaidService, PlaidProduct, AccountType } from '../../services/integrations/plaid.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// PLAID LINK
// ============================================================================

/**
 * POST /link/token
 * Create a Link token for Plaid Link initialization
 */
router.post('/link/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { products, accountTypes, redirectUri } = req.body;

    // Default to transactions and investments
    const requestedProducts: PlaidProduct[] = products || ['transactions', 'investments'];

    const linkToken = await plaidService.createLinkToken({
      userId,
      products: requestedProducts,
      accountTypes: accountTypes as AccountType[],
      redirectUri,
    });

    res.json({
      success: true,
      data: linkToken,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /link/exchange
 * Exchange public token for access token after successful Link flow
 */
router.post('/link/exchange', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { publicToken, institutionId, institutionName } = req.body;

    if (!publicToken) {
      return res.status(400).json({
        success: false,
        error: 'Public token is required',
      });
    }

    const result = await plaidService.exchangePublicToken({
      publicToken,
      userId,
      institutionId,
      institutionName,
    });

    res.json({
      success: true,
      data: {
        itemId: result.itemId,
        message: 'Account linked successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ACCOUNT MANAGEMENT
// ============================================================================

/**
 * GET /accounts
 * Get all linked accounts for the current user
 */
router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const accounts = await plaidService.getLinkedAccounts(userId);

    // Remove sensitive data (access tokens)
    const safeAccounts = accounts.map((account) => ({
      id: account.id,
      institutionId: account.institutionId,
      institutionName: account.institutionName,
      accounts: account.accounts,
      products: account.products,
      status: account.status,
      lastSync: account.lastSync,
      createdAt: account.createdAt,
    }));

    res.json({
      success: true,
      data: safeAccounts,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /accounts/:accountId/refresh
 * Refresh account balances
 */
router.post('/accounts/:accountId/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    const accounts = await plaidService.refreshAccountBalances(accountId, userId);

    res.json({
      success: true,
      data: accounts,
      message: 'Account balances refreshed',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /accounts/:accountId
 * Unlink an account
 */
router.delete('/accounts/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    await plaidService.unlinkAccount(accountId, userId);

    res.json({
      success: true,
      message: 'Account unlinked successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TAX DOCUMENT IMPORT
// ============================================================================

/**
 * POST /tax-documents/import
 * Import tax documents (1099-INT, 1099-DIV) from linked accounts
 */
router.post('/tax-documents/import', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { taxYear } = req.body;

    const year = taxYear || new Date().getFullYear() - 1;

    const [documents1099INT, documents1099DIV] = await Promise.all([
      plaidService.import1099INT(userId, year),
      plaidService.import1099DIV(userId, year),
    ]);

    res.json({
      success: true,
      data: {
        taxYear: year,
        imported: {
          '1099-INT': documents1099INT.length,
          '1099-DIV': documents1099DIV.length,
        },
        documents: {
          '1099-INT': documents1099INT,
          '1099-DIV': documents1099DIV,
        },
      },
      message: `Imported ${documents1099INT.length + documents1099DIV.length} tax documents`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tax-documents/:taxYear
 * Get all imported tax documents for a tax year
 */
router.get('/tax-documents/:taxYear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const taxYear = parseInt(req.params.taxYear);

    if (isNaN(taxYear) || taxYear < 2000 || taxYear > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tax year',
      });
    }

    const documents = await plaidService.getTaxDocuments(userId, taxYear);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /tax-documents/:taxYear/summary
 * Get summary of imported tax documents for a tax year
 */
router.get('/tax-documents/:taxYear/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const taxYear = parseInt(req.params.taxYear);

    if (isNaN(taxYear) || taxYear < 2000 || taxYear > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tax year',
      });
    }

    const summary = await plaidService.getTaxDocumentSummary(userId, taxYear);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// INVESTMENT TRACKING
// ============================================================================

/**
 * GET /investments/holdings
 * Get investment holdings for all linked accounts
 */
router.get('/investments/holdings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const holdings = await plaidService.getInvestmentHoldings(userId);

    // Calculate totals
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalCostBasis = holdings
      .filter((h) => h.costBasis !== undefined)
      .reduce((sum, h) => sum + (h.costBasis || 0), 0);
    const totalUnrealizedGainLoss = holdings
      .filter((h) => h.unrealizedGainLoss !== undefined)
      .reduce((sum, h) => sum + (h.unrealizedGainLoss || 0), 0);

    res.json({
      success: true,
      data: {
        holdings,
        summary: {
          totalHoldings: holdings.length,
          totalValue,
          totalCostBasis,
          totalUnrealizedGainLoss,
          totalUnrealizedGainLossPercent:
            totalCostBasis > 0 ? (totalUnrealizedGainLoss / totalCostBasis) * 100 : 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /investments/transactions
 * Get investment transactions for all linked accounts
 */
router.get('/investments/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Default to current year
    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const transactions = await plaidService.getInvestmentTransactions(userId, start, end);

    res.json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /investments/cost-basis/:taxYear
 * Calculate cost basis and capital gains for a tax year
 */
router.get('/investments/cost-basis/:taxYear', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const taxYear = parseInt(req.params.taxYear);

    if (isNaN(taxYear) || taxYear < 2000 || taxYear > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tax year',
      });
    }

    const costBasis = await plaidService.calculateCostBasis(userId, taxYear);

    res.json({
      success: true,
      data: {
        taxYear,
        ...costBasis,
        taxImplication: {
          shortTermRate: '10-37% (ordinary income rates)',
          longTermRate: '0%, 15%, or 20% (depending on income)',
          netInvestmentIncomeTax: costBasis.totalGainLoss > 0 ? '3.8% (if applicable)' : 'N/A',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DIRECT DEPOSIT
// ============================================================================

/**
 * GET /direct-deposit/:accountId
 * Get direct deposit information for tax refund setup
 */
router.get('/direct-deposit/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    const directDeposit = await plaidService.getDirectDepositInfo(userId, accountId);

    if (!directDeposit) {
      return res.status(404).json({
        success: false,
        error: 'Direct deposit info not available for this account',
      });
    }

    // Mask account number for security
    const maskedAccountNumber = directDeposit.accountNumber.slice(-4).padStart(
      directDeposit.accountNumber.length,
      '*'
    );

    res.json({
      success: true,
      data: {
        ...directDeposit,
        accountNumber: maskedAccountNumber,
        // Include full number in a secure way for form submission
        accountNumberLast4: directDeposit.accountNumber.slice(-4),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /direct-deposit/:accountId/verify
 * Verify and return full direct deposit info (for form submission)
 */
router.get('/direct-deposit/:accountId/verify', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { accountId } = req.params;

    const directDeposit = await plaidService.getDirectDepositInfo(userId, accountId);

    if (!directDeposit) {
      return res.status(404).json({
        success: false,
        error: 'Direct deposit info not available for this account',
      });
    }

    res.json({
      success: true,
      data: directDeposit,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// INSTITUTION SEARCH
// ============================================================================

/**
 * GET /institutions/search
 * Search for financial institutions
 */
router.get('/institutions/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query, products } = req.query;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const productList = products
      ? (products as string).split(',') as PlaidProduct[]
      : undefined;

    const institutions = await plaidService.searchInstitutions(query, productList);

    res.json({
      success: true,
      data: institutions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /institutions/:institutionId
 * Get institution details by ID
 */
router.get('/institutions/:institutionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { institutionId } = req.params;

    const institution = await plaidService.getInstitution(institutionId);

    if (!institution) {
      return res.status(404).json({
        success: false,
        error: 'Institution not found',
      });
    }

    res.json({
      success: true,
      data: institution,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// WEBHOOKS
// ============================================================================

/**
 * POST /webhook
 * Handle Plaid webhook events
 */
router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // In production, verify webhook signature
    // const signature = req.headers['plaid-verification'];

    const payload = req.body;

    await plaidService.handleWebhook(payload);

    res.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error', { error });
    // Always return 200 to acknowledge receipt
    res.json({ success: true });
  }
});

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * GET /supported-products
 * Get list of supported Plaid products
 */
router.get('/supported-products', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      products: [
        {
          id: 'transactions',
          name: 'Transactions',
          description: 'Access to transaction history',
          taxRelevant: false,
        },
        {
          id: 'auth',
          name: 'Auth',
          description: 'Account and routing numbers for direct deposit',
          taxRelevant: true,
        },
        {
          id: 'identity',
          name: 'Identity',
          description: 'Account holder identity verification',
          taxRelevant: false,
        },
        {
          id: 'investments',
          name: 'Investments',
          description: 'Investment holdings, transactions, and cost basis',
          taxRelevant: true,
        },
        {
          id: 'liabilities',
          name: 'Liabilities',
          description: 'Loan and credit card details',
          taxRelevant: false,
        },
        {
          id: 'assets',
          name: 'Assets',
          description: 'Asset reports for mortgage applications',
          taxRelevant: false,
        },
      ],
      taxDocuments: [
        {
          type: '1099-INT',
          name: 'Interest Income',
          description: 'Interest earned from bank accounts, CDs, bonds',
          autoImport: true,
        },
        {
          type: '1099-DIV',
          name: 'Dividend Income',
          description: 'Dividends from stocks, mutual funds, ETFs',
          autoImport: true,
        },
        {
          type: '1099-B',
          name: 'Broker Transactions',
          description: 'Stock sales and cost basis (via cost basis calculation)',
          autoImport: false,
          note: 'Cost basis available through investment holdings',
        },
      ],
    },
  });
});

/**
 * GET /status
 * Check Plaid integration status
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const accounts = await plaidService.getLinkedAccounts(userId);

    const activeAccounts = accounts.filter((a) => a.status === 'active');
    const needsReauth = accounts.filter((a) => a.status === 'requires_reauth');

    res.json({
      success: true,
      data: {
        linked: accounts.length > 0,
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        needsReauth: needsReauth.length,
        institutions: accounts.map((a) => ({
          name: a.institutionName,
          status: a.status,
          lastSync: a.lastSync,
          accounts: a.accounts.length,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
