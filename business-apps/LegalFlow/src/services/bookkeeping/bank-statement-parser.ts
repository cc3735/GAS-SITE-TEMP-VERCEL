/**
 * Bank Statement Parser Service
 *
 * Handles parsing of uploaded bank statements (PDF and CSV formats)
 * Extracts transactions and normalizes them for storage
 *
 * @module services/bookkeeping/bank-statement-parser
 */

import { parse } from 'csv-parse/sync';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

export interface ParsedTransaction {
    date: Date;
    description: string;
    amount: number;
    balance?: number;
}

export interface ParseResult {
    success: boolean;
    transactions: ParsedTransaction[];
    error?: string;
    metadata?: {
        totalCredits: number;
        totalDebits: number;
        startDate?: Date;
        endDate?: Date;
    };
}

export class BankStatementParser {
    /**
     * Parse a CSV bank statement
     */
    async parseCSV(fileContent: string): Promise<ParseResult> {
        try {
            logger.info('Parsing CSV bank statement');

            // Try to parse CSV with different delimiter options
            let records: any[];
            try {
                records = parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    relax_column_count: true,
                });
            } catch {
                // Try with semicolon delimiter
                records = parse(fileContent, {
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    delimiter: ';',
                    relax_column_count: true,
                });
            }

            if (!records || records.length === 0) {
                return {
                    success: false,
                    transactions: [],
                    error: 'No data found in CSV file',
                };
            }

            // Detect column names (different banks use different formats)
            const firstRow = records[0];
            const columnMapping = this.detectCSVColumns(Object.keys(firstRow));

            if (!columnMapping.date || !columnMapping.amount) {
                return {
                    success: false,
                    transactions: [],
                    error: 'Could not detect required columns (date and amount)',
                };
            }

            const transactions: ParsedTransaction[] = [];
            let totalCredits = 0;
            let totalDebits = 0;

            for (const record of records) {
                try {
                    const dateStr = record[columnMapping.date];
                    const amountStr = record[columnMapping.amount];
                    const description = record[columnMapping.description] || 'Unknown';
                    const balanceStr = columnMapping.balance ? record[columnMapping.balance] : undefined;

                    if (!dateStr || !amountStr) continue;

                    // Parse date
                    const date = this.parseDate(dateStr);
                    if (!date) continue;

                    // Parse amount
                    const amount = this.parseAmount(amountStr);
                    if (isNaN(amount)) continue;

                    // Parse balance if available
                    const balance = balanceStr ? this.parseAmount(balanceStr) : undefined;

                    transactions.push({
                        date,
                        description: description.trim(),
                        amount,
                        balance,
                    });

                    if (amount > 0) {
                        totalCredits += amount;
                    } else {
                        totalDebits += Math.abs(amount);
                    }
                } catch (error) {
                    logger.warn('Error parsing CSV row', { error, record });
                }
            }

            // Sort by date
            transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

            return {
                success: true,
                transactions,
                metadata: {
                    totalCredits,
                    totalDebits,
                    startDate: transactions[0]?.date,
                    endDate: transactions[transactions.length - 1]?.date,
                },
            };
        } catch (error) {
            logger.error('Error parsing CSV', { error });
            return {
                success: false,
                transactions: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Parse a PDF bank statement (using OCR)
     */
    async parsePDF(fileBuffer: Buffer): Promise<ParseResult> {
        try {
            logger.info('Parsing PDF bank statement');

            // For now, return a placeholder
            // In production, you would use pdf-lib and Google Cloud Vision OCR
            // to extract text and parse transactions

            return {
                success: false,
                transactions: [],
                error: 'PDF parsing not yet implemented. Please use CSV format or contact support.',
            };

            // TODO: Implement PDF parsing
            // 1. Extract text using Google Cloud Vision OCR
            // 2. Parse text to identify transaction patterns
            // 3. Extract date, description, amount for each transaction
            // 4. Return parsed transactions
        } catch (error) {
            logger.error('Error parsing PDF', { error });
            return {
                success: false,
                transactions: [],
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Store parsed transactions in database
     */
    async storeTransactions(
        userId: string,
        bankStatementId: string,
        transactions: ParsedTransaction[]
    ): Promise<number> {
        let storedCount = 0;

        for (const txn of transactions) {
            try {
                const { error } = await supabase.from('bank_statement_transactions').insert({
                    user_id: userId,
                    bank_statement_id: bankStatementId,
                    date: txn.date.toISOString().split('T')[0],
                    description: txn.description,
                    amount: txn.amount,
                    balance: txn.balance,
                    tax_year: txn.date.getFullYear(),
                    created_at: new Date().toISOString(),
                });

                if (!error) {
                    storedCount++;
                }
            } catch (error) {
                logger.warn('Error storing transaction', { error });
            }
        }

        // Update bank statement with transaction count
        await supabase
            .from('bank_statements')
            .update({
                transaction_count: storedCount,
                parsing_status: 'completed',
                updated_at: new Date().toISOString(),
            })
            .eq('id', bankStatementId);

        return storedCount;
    }

    /**
     * Detect CSV column names from headers
     */
    private detectCSVColumns(headers: string[]): {
        date?: string;
        description?: string;
        amount?: string;
        balance?: string;
    } {
        const mapping: any = {};

        const lowerHeaders = headers.map((h) => h.toLowerCase());

        // Detect date column
        const datePatterns = ['date', 'transaction date', 'post date', 'posting date', 'trans date'];
        for (const pattern of datePatterns) {
            const index = lowerHeaders.findIndex((h) => h.includes(pattern));
            if (index !== -1) {
                mapping.date = headers[index];
                break;
            }
        }

        // Detect description column
        const descPatterns = ['description', 'memo', 'details', 'transaction', 'payee', 'merchant'];
        for (const pattern of descPatterns) {
            const index = lowerHeaders.findIndex((h) => h.includes(pattern));
            if (index !== -1) {
                mapping.description = headers[index];
                break;
            }
        }

        // Detect amount column
        const amountPatterns = ['amount', 'debit', 'credit', 'value', 'transaction amount'];
        for (const pattern of amountPatterns) {
            const index = lowerHeaders.findIndex((h) => h.includes(pattern));
            if (index !== -1) {
                mapping.amount = headers[index];
                break;
            }
        }

        // Detect balance column
        const balancePatterns = ['balance', 'running balance', 'account balance'];
        for (const pattern of balancePatterns) {
            const index = lowerHeaders.findIndex((h) => h.includes(pattern));
            if (index !== -1) {
                mapping.balance = headers[index];
                break;
            }
        }

        return mapping;
    }

    /**
     * Parse date string to Date object
     */
    private parseDate(dateStr: string): Date | null {
        try {
            // Try various date formats
            const formats = [
                // MM/DD/YYYY
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
                // YYYY-MM-DD
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
                // DD/MM/YYYY
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
            ];

            for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) {
                        return date;
                    }
                }
            }

            // Try native Date parsing as fallback
            const date = new Date(dateStr);
            return isNaN(date.getTime()) ? null : date;
        } catch {
            return null;
        }
    }

    /**
     * Parse amount string to number
     */
    private parseAmount(amountStr: string): number {
        try {
            // Remove currency symbols, commas, and spaces
            let cleaned = amountStr.replace(/[$,\s]/g, '');

            // Handle parentheses for negative numbers
            if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
                cleaned = '-' + cleaned.slice(1, -1);
            }

            return parseFloat(cleaned);
        } catch {
            return NaN;
        }
    }
}

// Export singleton instance
export const bankStatementParser = new BankStatementParser();
