/**
 * Bank Statement Upload Routes
 *
 * Handles file uploads for bank statements (PDF/CSV)
 * and processes them to extract transactions
 *
 * @module routes/bookkeeping/bank-statements
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { bankStatementParser } from '../../services/bookkeeping/bank-statement-parser.js';
import { transactionCategorizer } from '../../services/bookkeeping/transaction-categorizer.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';
import { promises as fs } from 'fs';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const upload = multer({
    dest: '/tmp/bank-statements',
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (_req, file, cb) => {
        const allowedTypes = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
        if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV and PDF files are allowed.'));
        }
    },
});

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// BANK STATEMENT UPLOAD
// ============================================================================

/**
 * POST /upload
 * Upload and parse a bank statement file
 */
router.post(
    '/upload',
    upload.single('file'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const file = req.file;

            if (!file) {
                return res.status(400).json({
                    success: false,
                    error: 'No file uploaded',
                });
            }

            logger.info('Processing bank statement upload', {
                userId,
                filename: file.originalname,
                size: file.size,
            });

            // Determine file type
            const fileType = file.originalname.endsWith('.csv') ? 'csv' : 'pdf';

            // Create bank statement record
            const { data: bankStatement, error: createError } = await supabase
                .from('bank_statements')
                .insert({
                    user_id: userId,
                    filename: file.originalname,
                    file_url: file.path, // In production, upload to cloud storage
                    file_type: fileType,
                    file_size: file.size,
                    parsing_status: 'processing',
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (createError || !bankStatement) {
                throw new Error('Failed to create bank statement record');
            }

            // Parse file based on type
            let parseResult;
            if (fileType === 'csv') {
                const fileContent = await fs.readFile(file.path, 'utf-8');
                parseResult = await bankStatementParser.parseCSV(fileContent);
            } else {
                const fileBuffer = await fs.readFile(file.path);
                parseResult = await bankStatementParser.parsePDF(fileBuffer);
            }

            if (!parseResult.success) {
                // Update status to failed
                await supabase
                    .from('bank_statements')
                    .update({
                        parsing_status: 'failed',
                        parsing_error: parseResult.error,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', bankStatement.id);

                return res.status(400).json({
                    success: false,
                    error: parseResult.error || 'Failed to parse bank statement',
                });
            }

            // Store transactions
            const storedCount = await bankStatementParser.storeTransactions(
                userId,
                bankStatement.id,
                parseResult.transactions
            );

            // Update bank statement metadata
            await supabase
                .from('bank_statements')
                .update({
                    total_credits: parseResult.metadata?.totalCredits,
                    total_debits: parseResult.metadata?.totalDebits,
                    statement_start_date: parseResult.metadata?.startDate?.toISOString().split('T')[0],
                    statement_end_date: parseResult.metadata?.endDate?.toISOString().split('T')[0],
                    updated_at: new Date().toISOString(),
                })
                .eq('id', bankStatement.id);

            // Auto-categorize transactions (async, don't wait)
            this.autoCategorizeTransactions(bankStatement.id, userId).catch((error) => {
                logger.error('Error auto-categorizing transactions', { error });
            });

            // Clean up temp file
            try {
                await fs.unlink(file.path);
            } catch (error) {
                logger.warn('Failed to delete temp file', { error });
            }

            res.json({
                success: true,
                data: {
                    id: bankStatement.id,
                    filename: file.originalname,
                    transactionCount: storedCount,
                    dateRange: {
                        start: parseResult.metadata?.startDate?.toISOString().split('T')[0],
                        end: parseResult.metadata?.endDate?.toISOString().split('T')[0],
                    },
                },
                message: `Successfully parsed ${storedCount} transactions`,
            });
        } catch (error) {
            next(error);
        }
    }
);

/**
 * GET /
 * Get all uploaded bank statements
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const { data: statements, error } = await supabase
            .from('bank_statements')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch bank statements');
        }

        res.json({
            success: true,
            data: statements,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /:id/transactions
 * Get transactions from a specific bank statement
 */
router.get('/:id/transactions', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        const { data: transactions, error } = await supabase
            .from('bank_statement_transactions')
            .select('*, transaction_categories(name, category_type, tax_deductible)')
            .eq('bank_statement_id', id)
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch transactions');
        }

        res.json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /:id
 * Delete a bank statement and its transactions
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;
        const { id } = req.params;

        // Verify ownership
        const { data: statement, error: fetchError } = await supabase
            .from('bank_statements')
            .select('file_url')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !statement) {
            return res.status(404).json({
                success: false,
                error: 'Bank statement not found',
            });
        }

        // Delete file if it exists
        try {
            await fs.unlink(statement.file_url);
        } catch (error) {
            logger.warn('Failed to delete file', { error });
        }

        // Delete from database (transactions will be cascade deleted)
        const { error: deleteError } = await supabase
            .from('bank_statements')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (deleteError) {
            throw new Error('Failed to delete bank statement');
        }

        res.json({
            success: true,
            message: 'Bank statement deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// ============================================================================
// HELPER METHODS
// ============================================================================

/**
 * Auto-categorize transactions from a bank statement
 */
async function autoCategorizeTransactions(bankStatementId: string, userId: string): Promise<void> {
    try {
        // Get uncategorized transactions
        const { data: transactions, error } = await supabase
            .from('bank_statement_transactions')
            .select('id, description, amount')
            .eq('bank_statement_id', bankStatementId)
            .eq('user_id', userId)
            .is('category_id', null);

        if (error || !transactions) {
            logger.error('Failed to fetch transactions for auto-categorization', { error });
            return;
        }

        logger.info('Auto-categorizing transactions', {
            bankStatementId,
            count: transactions.length,
        });

        // Categorize in batches
        for (const txn of transactions) {
            try {
                const result = await transactionCategorizer.categorizeTransaction(
                    txn.description,
                    txn.amount
                );

                if (result) {
                    await supabase
                        .from('bank_statement_transactions')
                        .update({
                            category_id: result.categoryId,
                            is_tax_deductible: result.isTaxDeductible,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', txn.id);
                }
            } catch (error) {
                logger.warn('Failed to categorize transaction', { transactionId: txn.id, error });
            }
        }

        logger.info('Auto-categorization complete', { bankStatementId });
    } catch (error) {
        logger.error('Error in auto-categorization', { error });
    }
}

export default router;
