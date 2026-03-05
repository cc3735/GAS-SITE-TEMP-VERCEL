-- Add Zoho Books sync columns to AP/AR tables and create sync log
-- ================================================================

-- Zoho invoice ID on accounts_receivable
ALTER TABLE accounts_receivable
  ADD COLUMN IF NOT EXISTS zoho_invoice_id TEXT;

-- Zoho bill ID on accounts_payable
ALTER TABLE accounts_payable
  ADD COLUMN IF NOT EXISTS zoho_bill_id TEXT;

-- Indexes for Zoho lookups
CREATE INDEX IF NOT EXISTS idx_ar_zoho_invoice_id ON accounts_receivable (zoho_invoice_id) WHERE zoho_invoice_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ap_zoho_bill_id ON accounts_payable (zoho_bill_id) WHERE zoho_bill_id IS NOT NULL;

-- Zoho sync log
CREATE TABLE IF NOT EXISTS zoho_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL,            -- 'invoices', 'bills', 'contacts', 'chart_of_accounts', 'full'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_zoho_sync_log_user ON zoho_sync_log (user_id, created_at DESC);

-- RLS
ALTER TABLE zoho_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sync logs"
  ON zoho_sync_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync logs"
  ON zoho_sync_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync logs"
  ON zoho_sync_log FOR UPDATE
  USING (auth.uid() = user_id);
