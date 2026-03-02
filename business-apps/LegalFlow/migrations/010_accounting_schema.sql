-- Migration: 010_accounting_schema.sql

-- Enum for account types
CREATE TYPE account_type AS ENUM (
    'asset',
    'liability',
    'equity',
    'revenue',
    'expense'
);

-- Chart of Accounts table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES user_businesses(id) ON DELETE CASCADE,
    account_number text,
    name text NOT NULL,
    type account_type NOT NULL,
    description text,
    balance numeric(19, 4) NOT NULL DEFAULT 0.00,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(business_id, account_number)
);

-- Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES user_businesses(id) ON DELETE CASCADE,
    date date NOT NULL,
    description text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enum for journal entry item types
CREATE TYPE journal_entry_item_type AS ENUM (
    'debit',
    'credit'
);

-- Journal Entry Items table
CREATE TABLE IF NOT EXISTS journal_entry_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id uuid NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id uuid NOT NULL REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    type journal_entry_item_type NOT NULL,
    amount numeric(19, 4) NOT NULL,
    description text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_business_id ON chart_of_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_business_id ON journal_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_journal_entry_id ON journal_entry_items(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_items_account_id ON journal_entry_items(account_id);

-- RLS Policies
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own chart of accounts" ON chart_of_accounts
    FOR ALL
    USING (business_id IN (SELECT id FROM user_businesses WHERE user_id = auth.uid()));

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journal entries" ON journal_entries
    FOR ALL
    USING (business_id IN (SELECT id FROM user_businesses WHERE user_id = auth.uid()));

ALTER TABLE journal_entry_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own journal entry items" ON journal_entry_items
    FOR ALL
    USING (journal_entry_id IN (SELECT id FROM journal_entries WHERE business_id IN (SELECT id FROM user_businesses WHERE user_id = auth.uid())));
