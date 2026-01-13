/**
 * Bookkeeping Routes
 *
 * Main bookkeeping endpoints for transaction management,
 * account syncing, and financial summaries
 *
 * @module routes/bookkeeping/bookkeeping
 */

import { Router, Request, Response, NextFunction } from 'express';
import { plaidService } from '../../services/integrations/plaid.js';
import { transactionCategorizer } from '../../services/bookkeeping/transaction-categorizer.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// LINKED ACCOUNTS
// ============================================================================

/**
 * GET /accounts
 * Get all linked bank accounts for the current user
 */
router.get('/accounts', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const accounts = await plaidService.getLinkedAccounts(userId);

        res.json({
            success: true,
            data: accounts.map((acc) => ({
                id: acc.id,
                institutionName: acc.institutionName,
                institutionId: acc.institutionId,
                accounts: acc.accounts,
                status: acc.status,
                lastSync: acc.lastSync,
                createdAt: acc.createdAt,
            })),
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /accounts/sync
 * Sync transactions from a linked account
 */
router.post('/accounts/sync', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { linkedAccountId, startDate, endDate } = req.body;

        if (!linkedAccountId) {
            return res.status(400).json({
                success: false,
                error: 'linkedAccountId is required',
            });
        }

        // Default to last 90 days if not specified
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const syncedCount = await plaidService.syncTransactions(userId, linkedAccountId, start, end);

        res.json({
            success: true,
            data: {
                syncedCount,
                startDate: start.toISOString().split('T')[0],
                endDate: end.toISOString().split('T')[0],
            },
            message: `Synced ${syncedCount} transactions`,
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// TRANSACTIONS
// ============================================================================

/**
 * GET /transactions
 * Get transactions with filtering and pagination
 */
router.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const {
            startDate,
            endDate,
            categoryId,
            minAmount,
            maxAmount,
            searchQuery,
            limit,
            offset,
        } = req.query;

        const filters: any = {};
        if (startDate) filters.startDate = new Date(startDate as string);
        if (endDate) filters.endDate = new Date(endDate as string);
        if (categoryId) filters.categoryId = categoryId as string;
        if (minAmount) filters.minAmount = parseFloat(minAmount as string);
        if (maxAmount) filters.maxAmount = parseFloat(maxAmount as string);
        if (searchQuery) filters.searchQuery = searchQuery as string;
        if (limit) filters.limit = parseInt(limit as string);
        if (offset) filters.offset = parseInt(offset as string);

        const result = await plaidService.getTransactions(userId, filters);

        res.json({
            success: true,
            data: result.transactions,
            pagination: {
                total: result.total,
                limit: filters.limit || 50,
                offset: filters.offset || 0,
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /transactions/:id/category
 * Update transaction category
 */
router.put(
    '/transactions/:id/category',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { id } = req.params;
            const { categoryId } = req.body;

            if (!categoryId) {
                return res.status(400).json({
                    success: false,
                    error: 'categoryId is required',
                });
            }

            await plaidService.categorizeTransaction(id, categoryId, userId);

            res.json({
                success: true,
                message: 'Transaction category updated',
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * POST /transactions/:id/auto-categorize
 * Auto-categorize a transaction using AI
 */
router.post(
    '/transactions/:id/auto-categorize',
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const { id } = req.params;

            // Get transaction
            const { data: transaction, error } = await supabase
                .from('plaid_transactions')
                .select('*')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (error || !transaction) {
                return res.status(404).json({
                    success: false,
                    error: 'Transaction not found',
                });
            }

            // Categorize using AI
            const result = await transactionCategorizer.categorizeTransaction(
                transaction.name,
                transaction.amount,
                transaction.merchant_name
            );

            if (!result) {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to categorize transaction',
                });
            }

            // Update transaction
            await plaidService.categorizeTransaction(id, result.categoryId, userId);

            res.json({
                success: true,
                data: result,
                message: 'Transaction auto-categorized',
            });
        } catch (error) {
            next(error);
        }
    }
);

// ============================================================================
// FINANCIAL SUMMARY
// ============================================================================

/**
 * GET /summary
 * Get financial summary for a date range
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { startDate, endDate } = req.query;

        // Default to current month if not specified
        const now = new Date();
        const start = startDate
            ? new Date(startDate as string)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate as string) : new Date();

        const summary = await plaidService.getBookkeepingSummary(userId, start, end);

        res.json({
            success: true,
            data: {
                ...summary,
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

// ============================================================================
// TRANSACTION CATEGORIES
// ============================================================================

/**
 * GET /categories
 * Get all transaction categories
 */
router.get('/categories', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { data: categories, error } = await supabase
            .from('transaction_categories')
            .select('*')
            .order('display_order');

        if (error) {
            throw new Error('Failed to fetch categories');
        }

        // Build category tree
        const categoryMap = new Map();
        const rootCategories: any[] = [];

        for (const category of categories || []) {
            categoryMap.set(category.id, { ...category, children: [] });
        }

        for (const category of categories || []) {
            if (category.parent_id) {
                const parent = categoryMap.get(category.parent_id);
                if (parent) {
                    parent.children.push(categoryMap.get(category.id));
                }
            } else {
                rootCategories.push(categoryMap.get(category.id));
            }
        }

        res.json({
            success: true,
            data: rootCategories,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
