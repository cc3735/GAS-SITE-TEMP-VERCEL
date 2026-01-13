-- LegalFlow Bookkeeping Module Schema
-- Migration 008: Adds bookkeeping functionality with Plaid transaction sync and bank statement uploads
-- This migration is idempotent (safe to run multiple times)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PLAID LINKED ACCOUNTS
-- =====================================================
CREATE TABLE IF NOT EXISTS plaid_linked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  item_id VARCHAR(255) NOT NULL UNIQUE,
  access_token TEXT NOT NULL, -- Encrypted
  institution_id VARCHAR(255),
  institution_name VARCHAR(255),
  accounts JSONB, -- Array of account details
  products TEXT[], -- Plaid products enabled
  status VARCHAR(50) DEFAULT 'active', -- active, requires_reauth, disconnected, error
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTION CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS transaction_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  parent_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  category_type VARCHAR(50) NOT NULL, -- income, expense, transfer
  tax_deductible BOOLEAN DEFAULT FALSE,
  tax_category VARCHAR(100), -- business_expense, medical, charitable, etc.
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  display_order INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT TRUE, -- System categories can't be deleted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PLAID TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS plaid_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  linked_account_id UUID NOT NULL REFERENCES plaid_linked_accounts(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) NOT NULL, -- Plaid transaction ID
  account_id VARCHAR(255) NOT NULL, -- Plaid account ID
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  name VARCHAR(255), -- Transaction name/description
  merchant_name VARCHAR(255),
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  plaid_category TEXT[], -- Original Plaid categories
  pending BOOLEAN DEFAULT FALSE,
  payment_channel VARCHAR(50), -- online, in store, other
  transaction_type VARCHAR(50), -- place, special, unresolved
  location JSONB, -- Address, city, state, zip, lat, lon
  payment_meta JSONB, -- Payment method details
  notes TEXT, -- User notes
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  tax_year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_plaid_transaction') THEN
    ALTER TABLE plaid_transactions ADD CONSTRAINT unique_plaid_transaction UNIQUE (linked_account_id, transaction_id);
  END IF;
END $$;

-- =====================================================
-- BANK STATEMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(10) NOT NULL, -- pdf, csv
  file_size INTEGER,
  institution_name VARCHAR(255),
  account_number_last4 VARCHAR(4),
  statement_start_date DATE,
  statement_end_date DATE,
  parsing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  parsing_error TEXT,
  transaction_count INTEGER DEFAULT 0,
  total_credits DECIMAL(12,2),
  total_debits DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BANK STATEMENT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_statement_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description VARCHAR(500),
  amount DECIMAL(12,2) NOT NULL,
  balance DECIMAL(12,2),
  category_id UUID REFERENCES transaction_categories(id) ON DELETE SET NULL,
  notes TEXT,
  is_tax_deductible BOOLEAN DEFAULT FALSE,
  tax_year INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE, -- Flagged if similar to Plaid transaction
  duplicate_of_transaction_id UUID REFERENCES plaid_transactions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BOOKKEEPING SUMMARIES (Cached aggregations)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookkeeping_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  period_type VARCHAR(20) NOT NULL, -- monthly, quarterly, annual
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_income DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  net_income DECIMAL(12,2) DEFAULT 0,
  total_tax_deductible DECIMAL(12,2) DEFAULT 0,
  category_breakdown JSONB, -- { category_id: amount }
  transaction_count INTEGER DEFAULT 0,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_summary_period') THEN
    ALTER TABLE bookkeeping_summaries ADD CONSTRAINT unique_summary_period UNIQUE (user_id, period_type, period_start, period_end);
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_plaid_linked_accounts_user_id ON plaid_linked_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_linked_accounts_item_id ON plaid_linked_accounts(item_id);
CREATE INDEX IF NOT EXISTS idx_plaid_linked_accounts_status ON plaid_linked_accounts(status);

CREATE INDEX IF NOT EXISTS idx_transaction_categories_parent_id ON transaction_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_transaction_categories_type ON transaction_categories(category_type);

CREATE INDEX IF NOT EXISTS idx_plaid_transactions_user_id ON plaid_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_linked_account_id ON plaid_transactions(linked_account_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_date ON plaid_transactions(date);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_category_id ON plaid_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_plaid_transactions_tax_year ON plaid_transactions(tax_year);

CREATE INDEX IF NOT EXISTS idx_bank_statements_user_id ON bank_statements(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_statements_status ON bank_statements(parsing_status);

CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_user_id ON bank_statement_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_statement_id ON bank_statement_transactions(bank_statement_id);
CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_date ON bank_statement_transactions(date);
CREATE INDEX IF NOT EXISTS idx_bank_statement_transactions_category_id ON bank_statement_transactions(category_id);

CREATE INDEX IF NOT EXISTS idx_bookkeeping_summaries_user_id ON bookkeeping_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_bookkeeping_summaries_period ON bookkeeping_summaries(period_type, period_start, period_end);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE plaid_linked_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE plaid_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookkeeping_summaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (makes migration idempotent)
DROP POLICY IF EXISTS "Users can view own linked accounts" ON plaid_linked_accounts;
DROP POLICY IF EXISTS "Users can manage own linked accounts" ON plaid_linked_accounts;
DROP POLICY IF EXISTS "Anyone can view transaction categories" ON transaction_categories;
DROP POLICY IF EXISTS "Users can view own transactions" ON plaid_transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON plaid_transactions;
DROP POLICY IF EXISTS "Users can view own bank statements" ON bank_statements;
DROP POLICY IF EXISTS "Users can manage own bank statements" ON bank_statements;
DROP POLICY IF EXISTS "Users can view own statement transactions" ON bank_statement_transactions;
DROP POLICY IF EXISTS "Users can manage own statement transactions" ON bank_statement_transactions;
DROP POLICY IF EXISTS "Users can view own summaries" ON bookkeeping_summaries;

-- Plaid Linked Accounts
CREATE POLICY "Users can view own linked accounts" ON plaid_linked_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own linked accounts" ON plaid_linked_accounts
  FOR ALL USING (auth.uid() = user_id);

-- Transaction Categories (public read-only)
CREATE POLICY "Anyone can view transaction categories" ON transaction_categories
  FOR SELECT USING (true);

-- Plaid Transactions
CREATE POLICY "Users can view own transactions" ON plaid_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own transactions" ON plaid_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Bank Statements
CREATE POLICY "Users can view own bank statements" ON bank_statements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bank statements" ON bank_statements
  FOR ALL USING (auth.uid() = user_id);

-- Bank Statement Transactions
CREATE POLICY "Users can view own statement transactions" ON bank_statement_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own statement transactions" ON bank_statement_transactions
  FOR ALL USING (auth.uid() = user_id);

-- Bookkeeping Summaries
CREATE POLICY "Users can view own summaries" ON bookkeeping_summaries
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Drop existing triggers first (makes migration idempotent)
DROP TRIGGER IF EXISTS update_plaid_linked_accounts_updated_at ON plaid_linked_accounts;
DROP TRIGGER IF EXISTS update_plaid_transactions_updated_at ON plaid_transactions;
DROP TRIGGER IF EXISTS update_bank_statements_updated_at ON bank_statements;
DROP TRIGGER IF EXISTS update_bank_statement_transactions_updated_at ON bank_statement_transactions;

CREATE TRIGGER update_plaid_linked_accounts_updated_at
  BEFORE UPDATE ON plaid_linked_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plaid_transactions_updated_at
  BEFORE UPDATE ON plaid_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON bank_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_statement_transactions_updated_at
  BEFORE UPDATE ON bank_statement_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: TRANSACTION CATEGORIES
-- =====================================================

-- Insert default transaction categories
INSERT INTO transaction_categories (name, parent_id, category_type, tax_deductible, tax_category, description, icon, color, display_order, is_system) VALUES
  -- Income Categories
  ('Income', NULL, 'income', FALSE, NULL, 'All income sources', 'dollar-sign', '#10b981', 1, TRUE),
  ('Salary/Wages', (SELECT id FROM transaction_categories WHERE name = 'Income'), 'income', FALSE, 'wages', 'Employment income', 'briefcase', '#10b981', 1, TRUE),
  ('Business Income', (SELECT id FROM transaction_categories WHERE name = 'Income'), 'income', FALSE, 'business_income', 'Self-employment and business revenue', 'building', '#10b981', 2, TRUE),
  ('Investment Income', (SELECT id FROM transaction_categories WHERE name = 'Income'), 'income', FALSE, 'investment_income', 'Dividends, interest, capital gains', 'trending-up', '#10b981', 3, TRUE),
  ('Rental Income', (SELECT id FROM transaction_categories WHERE name = 'Income'), 'income', FALSE, 'rental_income', 'Property rental income', 'home', '#10b981', 4, TRUE),
  ('Other Income', (SELECT id FROM transaction_categories WHERE name = 'Income'), 'income', FALSE, 'other_income', 'Miscellaneous income', 'plus-circle', '#10b981', 5, TRUE),
  
  -- Expense Categories
  ('Expenses', NULL, 'expense', FALSE, NULL, 'All expenses', 'credit-card', '#ef4444', 2, TRUE),
  
  -- Business Expenses (Tax Deductible)
  ('Business Expenses', (SELECT id FROM transaction_categories WHERE name = 'Expenses'), 'expense', TRUE, 'business_expense', 'Deductible business expenses', 'briefcase', '#f59e0b', 1, TRUE),
  ('Office Supplies', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Office supplies and equipment', 'package', '#f59e0b', 1, TRUE),
  ('Travel', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Business travel expenses', 'plane', '#f59e0b', 2, TRUE),
  ('Meals & Entertainment', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Business meals (50% deductible)', 'coffee', '#f59e0b', 3, TRUE),
  ('Advertising', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Marketing and advertising', 'megaphone', '#f59e0b', 4, TRUE),
  ('Professional Services', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Legal, accounting, consulting', 'users', '#f59e0b', 5, TRUE),
  ('Software & Subscriptions', (SELECT id FROM transaction_categories WHERE name = 'Business Expenses'), 'expense', TRUE, 'business_expense', 'Business software and tools', 'monitor', '#f59e0b', 6, TRUE),
  
  -- Medical Expenses (Potentially Deductible)
  ('Medical & Healthcare', (SELECT id FROM transaction_categories WHERE name = 'Expenses'), 'expense', TRUE, 'medical', 'Medical expenses (if > 7.5% AGI)', 'heart', '#ec4899', 2, TRUE),
  ('Doctor Visits', (SELECT id FROM transaction_categories WHERE name = 'Medical & Healthcare'), 'expense', TRUE, 'medical', 'Doctor and specialist visits', 'stethoscope', '#ec4899', 1, TRUE),
  ('Prescriptions', (SELECT id FROM transaction_categories WHERE name = 'Medical & Healthcare'), 'expense', TRUE, 'medical', 'Prescription medications', 'pill', '#ec4899', 2, TRUE),
  ('Health Insurance', (SELECT id FROM transaction_categories WHERE name = 'Medical & Healthcare'), 'expense', TRUE, 'medical', 'Health insurance premiums', 'shield', '#ec4899', 3, TRUE),
  
  -- Charitable Contributions (Tax Deductible)
  ('Charitable Donations', (SELECT id FROM transaction_categories WHERE name = 'Expenses'), 'expense', TRUE, 'charitable', 'Donations to qualified charities', 'heart-handshake', '#8b5cf6', 3, TRUE),
  
  -- Home Office (Potentially Deductible)
  ('Home Office', (SELECT id FROM transaction_categories WHERE name = 'Expenses'), 'expense', TRUE, 'home_office', 'Home office expenses', 'home', '#3b82f6', 4, TRUE),
  ('Rent/Mortgage', (SELECT id FROM transaction_categories WHERE name = 'Home Office'), 'expense', TRUE, 'home_office', 'Portion for home office', 'key', '#3b82f6', 1, TRUE),
  ('Utilities', (SELECT id FROM transaction_categories WHERE name = 'Home Office'), 'expense', TRUE, 'home_office', 'Portion for home office', 'zap', '#3b82f6', 2, TRUE),
  
  -- Personal Expenses (Not Deductible)
  ('Personal', (SELECT id FROM transaction_categories WHERE name = 'Expenses'), 'expense', FALSE, NULL, 'Personal expenses', 'user', '#6b7280', 5, TRUE),
  ('Groceries', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Food and groceries', 'shopping-cart', '#6b7280', 1, TRUE),
  ('Dining Out', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Restaurants and dining', 'utensils', '#6b7280', 2, TRUE),
  ('Transportation', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Gas, parking, public transit', 'car', '#6b7280', 3, TRUE),
  ('Entertainment', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Movies, events, hobbies', 'film', '#6b7280', 4, TRUE),
  ('Shopping', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Clothing, personal items', 'shopping-bag', '#6b7280', 5, TRUE),
  ('Housing', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Personal rent/mortgage', 'home', '#6b7280', 6, TRUE),
  ('Personal Utilities', (SELECT id FROM transaction_categories WHERE name = 'Personal'), 'expense', FALSE, NULL, 'Personal utilities', 'zap', '#6b7280', 7, TRUE),
  
  -- Transfers
  ('Transfers', NULL, 'transfer', FALSE, NULL, 'Account transfers', 'arrow-right-left', '#64748b', 3, TRUE),
  ('Credit Card Payment', (SELECT id FROM transaction_categories WHERE name = 'Transfers'), 'transfer', FALSE, NULL, 'Credit card payments', 'credit-card', '#64748b', 1, TRUE),
  ('Savings', (SELECT id FROM transaction_categories WHERE name = 'Transfers'), 'transfer', FALSE, NULL, 'Transfers to savings', 'piggy-bank', '#64748b', 2, TRUE),
  ('Investment', (SELECT id FROM transaction_categories WHERE name = 'Transfers'), 'transfer', FALSE, NULL, 'Investment contributions', 'trending-up', '#64748b', 3, TRUE)
ON CONFLICT (name) DO NOTHING;
