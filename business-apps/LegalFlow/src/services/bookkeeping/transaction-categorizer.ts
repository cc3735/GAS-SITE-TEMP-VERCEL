/**
 * Transaction Categorizer Service
 *
 * AI-powered transaction categorization using OpenAI
 * with rule-based fallback for common patterns
 *
 * @module services/bookkeeping/transaction-categorizer
 */

import { openai } from '../../lib/openai.js';
import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

export interface CategorizationResult {
    categoryId: string;
    categoryName: string;
    confidence: number;
    isTaxDeductible: boolean;
    reasoning?: string;
}

export class TransactionCategorizer {
    private categoryCache: Map<string, any> = new Map();

    /**
     * Categorize a transaction using AI
     */
    async categorizeTransaction(
        description: string,
        amount: number,
        merchantName?: string
    ): Promise<CategorizationResult | null> {
        try {
            // First, try rule-based categorization
            const ruleBasedResult = this.ruleBasedCategorization(description, merchantName);
            if (ruleBasedResult && ruleBasedResult.confidence > 0.8) {
                return ruleBasedResult;
            }

            // If rule-based is not confident, use AI
            const aiResult = await this.aiCategorization(description, amount, merchantName);
            if (aiResult) {
                return aiResult;
            }

            // Fallback to rule-based even if confidence is low
            return ruleBasedResult;
        } catch (error) {
            logger.error('Error categorizing transaction', { error });
            return null;
        }
    }

    /**
     * Rule-based categorization for common patterns
     */
    private ruleBasedCategorization(
        description: string,
        merchantName?: string
    ): CategorizationResult | null {
        const desc = description.toLowerCase();
        const merchant = merchantName?.toLowerCase() || '';

        // Business expenses
        if (
            desc.includes('office depot') ||
            desc.includes('staples') ||
            merchant.includes('office')
        ) {
            return this.getCategoryByName('Office Supplies', 0.9);
        }

        if (
            desc.includes('aws') ||
            desc.includes('google cloud') ||
            desc.includes('azure') ||
            desc.includes('software') ||
            merchant.includes('saas')
        ) {
            return this.getCategoryByName('Software & Subscriptions', 0.85);
        }

        // Travel
        if (
            desc.includes('airline') ||
            desc.includes('hotel') ||
            desc.includes('uber') ||
            desc.includes('lyft') ||
            merchant.includes('travel')
        ) {
            return this.getCategoryByName('Travel', 0.85);
        }

        // Food
        if (
            desc.includes('restaurant') ||
            desc.includes('cafe') ||
            desc.includes('coffee') ||
            merchant.includes('food')
        ) {
            return this.getCategoryByName('Dining Out', 0.8);
        }

        if (
            desc.includes('grocery') ||
            desc.includes('supermarket') ||
            desc.includes('whole foods') ||
            desc.includes('trader joe')
        ) {
            return this.getCategoryByName('Groceries', 0.85);
        }

        // Medical
        if (
            desc.includes('pharmacy') ||
            desc.includes('cvs') ||
            desc.includes('walgreens') ||
            desc.includes('medical') ||
            desc.includes('doctor')
        ) {
            return this.getCategoryByName('Medical & Healthcare', 0.8);
        }

        // Utilities
        if (
            desc.includes('electric') ||
            desc.includes('gas company') ||
            desc.includes('water') ||
            desc.includes('internet') ||
            desc.includes('phone')
        ) {
            return this.getCategoryByName('Personal Utilities', 0.85);
        }

        // Transfers
        if (
            desc.includes('transfer') ||
            desc.includes('payment') ||
            desc.includes('credit card')
        ) {
            return this.getCategoryByName('Credit Card Payment', 0.75);
        }

        // Default to Personal if no match
        return this.getCategoryByName('Personal', 0.5);
    }

    /**
     * AI-powered categorization using OpenAI
     */
    private async aiCategorization(
        description: string,
        amount: number,
        merchantName?: string
    ): Promise<CategorizationResult | null> {
        try {
            // Get all categories
            const categories = await this.getAllCategories();
            const categoryList = categories
                .map((c) => `- ${c.name} (${c.category_type}, tax_deductible: ${c.tax_deductible})`)
                .join('\n');

            const prompt = `You are a financial categorization expert. Categorize the following transaction into one of the provided categories.

Transaction Details:
- Description: ${description}
- Amount: $${Math.abs(amount).toFixed(2)}
${merchantName ? `- Merchant: ${merchantName}` : ''}

Available Categories:
${categoryList}

Please respond with ONLY a JSON object in this exact format:
{
  "categoryName": "exact category name from the list",
  "confidence": 0.0-1.0,
  "isTaxDeductible": true/false,
  "reasoning": "brief explanation"
}`;

            const response = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a financial expert that categorizes transactions accurately. Always respond with valid JSON only.',
                    },
                    { role: 'user', content: prompt },
                ],
                temperature: 0.3,
                max_tokens: 200,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) return null;

            // Parse JSON response
            const result = JSON.parse(content);

            // Find category ID
            const category = categories.find((c) => c.name === result.categoryName);
            if (!category) return null;

            return {
                categoryId: category.id,
                categoryName: category.name,
                confidence: result.confidence,
                isTaxDeductible: result.isTaxDeductible,
                reasoning: result.reasoning,
            };
        } catch (error) {
            logger.warn('AI categorization failed', { error });
            return null;
        }
    }

    /**
     * Get category by name
     */
    private getCategoryByName(name: string, confidence: number): CategorizationResult | null {
        // This would query the database in production
        // For now, return a placeholder
        return {
            categoryId: 'placeholder',
            categoryName: name,
            confidence,
            isTaxDeductible: name.includes('Business') || name.includes('Medical'),
        };
    }

    /**
     * Get all categories from database
     */
    private async getAllCategories(): Promise<any[]> {
        // Check cache first
        if (this.categoryCache.size > 0) {
            return Array.from(this.categoryCache.values());
        }

        const { data, error } = await supabase
            .from('transaction_categories')
            .select('id, name, category_type, tax_deductible')
            .order('display_order');

        if (error) {
            logger.error('Error fetching categories', { error });
            return [];
        }

        // Cache categories
        for (const category of data || []) {
            this.categoryCache.set(category.name, category);
        }

        return data || [];
    }

    /**
     * Batch categorize multiple transactions
     */
    async batchCategorize(
        transactions: Array<{
            id: string;
            description: string;
            amount: number;
            merchantName?: string;
        }>
    ): Promise<Map<string, CategorizationResult>> {
        const results = new Map<string, CategorizationResult>();

        for (const txn of transactions) {
            const result = await this.categorizeTransaction(
                txn.description,
                txn.amount,
                txn.merchantName
            );
            if (result) {
                results.set(txn.id, result);
            }
        }

        return results;
    }
}

// Export singleton instance
export const transactionCategorizer = new TransactionCategorizer();
