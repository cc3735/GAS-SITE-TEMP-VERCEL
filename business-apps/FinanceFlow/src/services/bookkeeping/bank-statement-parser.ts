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
import { openai } from '../../lib/openai.js';

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
     * Parse a PDF bank statement using pdf-parse + OpenAI GPT-4
     */
    async parsePDF(fileBuffer: Buffer): Promise<ParseResult> {
        try {
            logger.info('Parsing PDF bank statement');

            // Dynamically import pdf-parse (CommonJS module)
            const pdfParse = await import('pdf-parse');
            const pdfData = await pdfParse.default(fileBuffer);
            const rawText = pdfData.text;

            if (!rawText || rawText.trim().length < 50) {
                return {
                    success: false,
                    transactions: [],
                    error: 'Could not extract text from PDF. The file may be image-based or password-protected.',
                };
            }

            logger.info('PDF text extracted', { chars: rawText.length });

            // Use GPT-4 to extract structured transactions from raw text
            const transactions = await this.extractTransactionsWithAI(rawText);

            if (transactions.length === 0) {
                return {
                    success: false,
                    transactions: [],
                    error: 'No transactions could be identified in this PDF. Please verify it is a bank statement.',
                };
            }

            let totalCredits = 0;
            let totalDebits = 0;
            for (const txn of transactions) {
                if (txn.amount > 0) totalCredits += txn.amount;
                else totalDebits += Math.abs(txn.amount);
            }

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
            logger.error('Error parsing PDF', { error });
            return {
                success: false,
                transactions: [],
                error: error instanceof Error ? error.message : 'Unknown error parsing PDF',
            };
        }
    }

    /**
     * Use OpenAI GPT-4 to extract transactions from raw PDF text
     */
    private async extractTransactionsWithAI(rawText: string): Promise<ParsedTransaction[]> {
        try {
            // Truncate to ~15k chars to stay within token limits
            const truncatedText = rawText.slice(0, 15000);

            const prompt = `Extract all bank transactions from the following bank statement text.

Return ONLY a valid JSON array. Each element must have exactly these fields:
- "date": string in YYYY-MM-DD format
- "description": string (merchant/payee name or memo)
- "amount": number (positive for credits/deposits, negative for debits/charges/withdrawals)

If no transactions are found, return [].

Bank statement text:
${truncatedText}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a financial data extraction specialist. Extract transaction data from bank statements and return clean JSON only. No markdown, no explanation.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.1,
                max_tokens: 4000,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return [];

            // Strip any markdown code fences if present
            const cleaned = content.replace(/```(?:json)?\n?/g, '').trim();

            const raw: Array<{ date: string; description: string; amount: number }> =
                JSON.parse(cleaned);

            return raw
                .map((item) => {
                    const date = this.parseDate(item.date);
                    if (!date || typeof item.amount !== 'number') return null;
                    return {
                        date,
                        description: String(item.description).trim(),
                        amount: item.amount,
                    };
                })
                .filter((t): t is ParsedTransaction => t !== null)
                .sort((a, b) => a.date.getTime() - b.date.getTime());
        } catch (error) {
            logger.error('AI transaction extraction failed', { error });
            return [];
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
