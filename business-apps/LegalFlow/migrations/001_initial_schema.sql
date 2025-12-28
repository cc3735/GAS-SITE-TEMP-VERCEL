-- LegalFlow Initial Database Schema
-- Run this migration in your Supabase SQL Editor
-- This migration is idempotent (safe to run multiple times)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USER PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  date_of_birth DATE,
  ssn_encrypted TEXT,
  address JSONB,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TAX FILING MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  filing_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'draft',
  federal_return_id VARCHAR(100),
  state_return_ids JSONB,
  total_income DECIMAL(12,2),
  adjusted_gross_income DECIMAL(12,2),
  taxable_income DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  payment_amount DECIMAL(12,2),
  forms_data JSONB,
  ai_suggestions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filed_at TIMESTAMPTZ
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_user_tax_year') THEN
    ALTER TABLE tax_returns ADD CONSTRAINT unique_user_tax_year UNIQUE (user_id, tax_year);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS tax_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_return_id UUID NOT NULL REFERENCES tax_returns(id) ON DELETE CASCADE,
  document_type VARCHAR(50),
  document_data JSONB,
  file_url TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LEGAL DOCUMENTS MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50),
  description TEXT,
  template_schema JSONB,
  ai_prompt_template TEXT,
  state_specific BOOLEAN DEFAULT FALSE,
  applicable_states TEXT[],
  premium_only BOOLEAN DEFAULT FALSE,
  base_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_category VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  template_id UUID REFERENCES legal_templates(id) ON DELETE SET NULL,
  document_data JSONB,
  ai_generated_content TEXT,
  pdf_url TEXT,
  signature_status VARCHAR(50),
  docu_sign_envelope_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LEGAL FILING AUTOMATION MODULE
-- =====================================================
CREATE TABLE IF NOT EXISTS legal_filings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  filing_type VARCHAR(100) NOT NULL,
  jurisdiction_state VARCHAR(2) NOT NULL,
  jurisdiction_county VARCHAR(100),
  court_name VARCHAR(255),
  case_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'draft',
  interview_data JSONB,
  generated_forms JSONB,
  filing_checklist JSONB,
  court_filing_id VARCHAR(255),
  filing_fee DECIMAL(10,2),
  fee_waiver_applied BOOLEAN DEFAULT FALSE,
  next_deadline DATE,
  reminders_sent JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  filed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS court_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legal_filing_id UUID NOT NULL REFERENCES legal_filings(id) ON DELETE CASCADE,
  form_name VARCHAR(255),
  form_type VARCHAR(100),
  jurisdiction_state VARCHAR(2),
  jurisdiction_county VARCHAR(100),
  form_data JSONB,
  pdf_url TEXT,
  filing_sequence INTEGER,
  required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jurisdiction_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  filing_type VARCHAR(100),
  rule_key VARCHAR(100),
  rule_value JSONB,
  description TEXT,
  source_url TEXT,
  last_updated DATE
);

-- Add constraint only if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_jurisdiction_rule') THEN
    ALTER TABLE jurisdiction_rules ADD CONSTRAINT unique_jurisdiction_rule UNIQUE (state_code, county, filing_type, rule_key);
  END IF;
END $$;

-- =====================================================
-- CHILD SUPPORT CALCULATOR
-- =====================================================
CREATE TABLE IF NOT EXISTS child_support_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  legal_filing_id UUID REFERENCES legal_filings(id) ON DELETE SET NULL,
  state_code VARCHAR(2) NOT NULL,
  calculation_type VARCHAR(50),
  parent1_data JSONB,
  parent2_data JSONB,
  children_data JSONB,
  calculation_result JSONB,
  guidelines_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PAYMENTS AND SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  service_type VARCHAR(100),
  service_id UUID,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AI USAGE TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  service_type VARCHAR(100),
  service_id UUID,
  ai_model VARCHAR(50),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_cost DECIMAL(10,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tax_returns_user_id ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_tax_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_documents_return_id ON tax_documents(tax_return_id);

CREATE INDEX IF NOT EXISTS idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_documents_category ON legal_documents(document_category);
CREATE INDEX IF NOT EXISTS idx_legal_templates_category ON legal_templates(category);

CREATE INDEX IF NOT EXISTS idx_legal_filings_user_id ON legal_filings(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_filings_type ON legal_filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_legal_filings_state ON legal_filings(jurisdiction_state);
CREATE INDEX IF NOT EXISTS idx_court_forms_filing_id ON court_forms(legal_filing_id);

CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_state ON jurisdiction_rules(state_code);
CREATE INDEX IF NOT EXISTS idx_jurisdiction_rules_type ON jurisdiction_rules(filing_type);

CREATE INDEX IF NOT EXISTS idx_child_support_user_id ON child_support_calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_child_support_state ON child_support_calculations(state_code);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_logs(user_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_support_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jurisdiction_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (makes migration idempotent)
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own tax returns" ON tax_returns;
DROP POLICY IF EXISTS "Users can manage own tax returns" ON tax_returns;
DROP POLICY IF EXISTS "Users can view own tax documents" ON tax_documents;
DROP POLICY IF EXISTS "Users can manage own tax documents" ON tax_documents;
DROP POLICY IF EXISTS "Users can view own legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can manage own legal documents" ON legal_documents;
DROP POLICY IF EXISTS "Users can view own legal filings" ON legal_filings;
DROP POLICY IF EXISTS "Users can manage own legal filings" ON legal_filings;
DROP POLICY IF EXISTS "Users can view own court forms" ON court_forms;
DROP POLICY IF EXISTS "Users can view own child support calculations" ON child_support_calculations;
DROP POLICY IF EXISTS "Users can manage own child support calculations" ON child_support_calculations;
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own AI usage" ON ai_usage_logs;
DROP POLICY IF EXISTS "Anyone can view legal templates" ON legal_templates;
DROP POLICY IF EXISTS "Anyone can view jurisdiction rules" ON jurisdiction_rules;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own tax returns" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tax returns" ON tax_returns
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own tax documents" ON tax_documents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM tax_returns WHERE id = tax_documents.tax_return_id
    )
  );

CREATE POLICY "Users can manage own tax documents" ON tax_documents
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM tax_returns WHERE id = tax_documents.tax_return_id
    )
  );

CREATE POLICY "Users can view own legal documents" ON legal_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own legal documents" ON legal_documents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own legal filings" ON legal_filings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own legal filings" ON legal_filings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own court forms" ON court_forms
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM legal_filings WHERE id = court_forms.legal_filing_id
    )
  );

CREATE POLICY "Users can view own child support calculations" ON child_support_calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own child support calculations" ON child_support_calculations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own AI usage" ON ai_usage_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Legal templates are public (read-only for all authenticated users)
CREATE POLICY "Anyone can view legal templates" ON legal_templates
  FOR SELECT USING (true);

-- Jurisdiction rules are public (read-only)
CREATE POLICY "Anyone can view jurisdiction rules" ON jurisdiction_rules
  FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers first (makes migration idempotent)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_tax_returns_updated_at ON tax_returns;
DROP TRIGGER IF EXISTS update_legal_documents_updated_at ON legal_documents;
DROP TRIGGER IF EXISTS update_legal_filings_updated_at ON legal_filings;
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_returns_updated_at
  BEFORE UPDATE ON tax_returns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON legal_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_filings_updated_at
  BEFORE UPDATE ON legal_filings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION TO CREATE USER PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

