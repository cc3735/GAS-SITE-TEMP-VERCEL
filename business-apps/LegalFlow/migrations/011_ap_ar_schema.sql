-- Migration 011: Accounts Payable and Accounts Receivable
-- Creates tables for tracking money owed to vendors (AP) and money owed by clients (AR)

-- Accounts Payable: bills the business owes to vendors/suppliers
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES user_businesses(id) ON DELETE SET NULL,

    vendor_name TEXT NOT NULL,
    vendor_email TEXT,
    vendor_phone TEXT,

    invoice_number TEXT,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),

    due_date DATE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_date DATE,

    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'partial', 'paid', 'overdue', 'voided')),

    category TEXT,              -- e.g. "Office Supplies", "Rent", "Utilities"
    tax_deductible BOOLEAN DEFAULT false,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accounts Receivable: invoices the business has sent to clients
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES user_businesses(id) ON DELETE SET NULL,

    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT,

    invoice_number TEXT,
    description TEXT,
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    amount_received DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount_received >= 0),

    due_date DATE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_date DATE,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'written_off')),

    category TEXT,              -- e.g. "Services", "Products", "Consulting"
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ap_user_id         ON accounts_payable(user_id);
CREATE INDEX IF NOT EXISTS idx_ap_business_id     ON accounts_payable(business_id);
CREATE INDEX IF NOT EXISTS idx_ap_status          ON accounts_payable(status);
CREATE INDEX IF NOT EXISTS idx_ap_due_date        ON accounts_payable(due_date);

CREATE INDEX IF NOT EXISTS idx_ar_user_id         ON accounts_receivable(user_id);
CREATE INDEX IF NOT EXISTS idx_ar_business_id     ON accounts_receivable(business_id);
CREATE INDEX IF NOT EXISTS idx_ar_status          ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_ar_due_date        ON accounts_receivable(due_date);

-- Row-level security
ALTER TABLE accounts_payable ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

-- Users can only see their own records
CREATE POLICY "ap_user_isolation" ON accounts_payable
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "ar_user_isolation" ON accounts_receivable
    FOR ALL USING (auth.uid() = user_id);

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_ap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ap_updated_at_trigger
    BEFORE UPDATE ON accounts_payable
    FOR EACH ROW EXECUTE FUNCTION update_ap_updated_at();

CREATE TRIGGER ar_updated_at_trigger
    BEFORE UPDATE ON accounts_receivable
    FOR EACH ROW EXECUTE FUNCTION update_ap_updated_at();

-- Auto-mark overdue records (can be run via a cron or on-read)
-- View for convenience
CREATE OR REPLACE VIEW ap_with_computed_status AS
SELECT
    *,
    CASE
        WHEN status = 'paid' THEN 'paid'
        WHEN status = 'voided' THEN 'voided'
        WHEN due_date < CURRENT_DATE AND amount_paid < amount THEN 'overdue'
        ELSE status
    END AS computed_status,
    (amount - amount_paid) AS balance_due,
    CASE WHEN due_date IS NOT NULL THEN (due_date - CURRENT_DATE) END AS days_until_due
FROM accounts_payable;

CREATE OR REPLACE VIEW ar_with_computed_status AS
SELECT
    *,
    CASE
        WHEN status IN ('paid', 'written_off') THEN status
        WHEN due_date < CURRENT_DATE AND amount_received < amount THEN 'overdue'
        ELSE status
    END AS computed_status,
    (amount - amount_received) AS balance_owed,
    CASE WHEN due_date IS NOT NULL THEN (due_date - CURRENT_DATE) END AS days_until_due
FROM accounts_receivable;
