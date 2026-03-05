/**
 * Database types for FinanceFlow
 *
 * These are placeholder types. Regenerate from Supabase with:
 *   npm run db:generate
 */

export interface Database {
  public: {
    Tables: Record<string, unknown>;
  };
}

export interface ChartOfAccount {
  id: string;
  business_id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_number?: string;
  description?: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  business_id: string;
  date: string;
  description: string;
  reference_number?: string;
  status: 'draft' | 'posted' | 'voided';
  items: JournalEntryItem[];
  created_at: string;
  updated_at: string;
}

export interface JournalEntryItem {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  description?: string;
}
