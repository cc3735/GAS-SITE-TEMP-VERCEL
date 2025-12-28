-- LegalFlow Data Ingestion Schema
-- Migration 002: Tables for tax data, child support, and jurisdiction rules

-- =====================================================
-- FEDERAL TAX DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_federal_tax_brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_year INTEGER NOT NULL,
  filing_status VARCHAR(50) NOT NULL,
  min_income DECIMAL(12,2) NOT NULL,
  max_income DECIMAL(12,2),
  rate DECIMAL(5,4) NOT NULL,
  base_tax DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_federal_bracket UNIQUE (tax_year, filing_status, min_income)
);

CREATE TABLE IF NOT EXISTS lf_federal_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_year INTEGER NOT NULL,
  deduction_type VARCHAR(100) NOT NULL,
  filing_status VARCHAR(50),
  amount DECIMAL(12,2),
  phase_out_start DECIMAL(12,2),
  phase_out_end DECIMAL(12,2),
  description TEXT,
  eligibility_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_federal_deduction UNIQUE (tax_year, deduction_type, filing_status)
);

CREATE TABLE IF NOT EXISTS lf_federal_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tax_year INTEGER NOT NULL,
  credit_type VARCHAR(100) NOT NULL,
  max_amount DECIMAL(12,2),
  phase_out_start DECIMAL(12,2),
  phase_out_end DECIMAL(12,2),
  refundable BOOLEAN DEFAULT FALSE,
  description TEXT,
  eligibility_rules JSONB,
  calculation_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_federal_credit UNIQUE (tax_year, credit_type)
);

CREATE TABLE IF NOT EXISTS lf_tax_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_number VARCHAR(50) NOT NULL,
  form_name VARCHAR(255) NOT NULL,
  tax_year INTEGER NOT NULL,
  form_type VARCHAR(50),
  is_federal BOOLEAN DEFAULT TRUE,
  state_code VARCHAR(2),
  description TEXT,
  field_schema JSONB,
  instructions_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_tax_form UNIQUE (form_number, tax_year, state_code)
);

-- =====================================================
-- STATE TAX DATA
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_state_tax_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  tax_year INTEGER NOT NULL,
  has_income_tax BOOLEAN DEFAULT TRUE,
  tax_type VARCHAR(50),
  flat_rate DECIMAL(5,4),
  standard_deduction_single DECIMAL(12,2),
  standard_deduction_married DECIMAL(12,2),
  standard_deduction_hoh DECIMAL(12,2),
  personal_exemption DECIMAL(12,2),
  dependent_exemption DECIMAL(12,2),
  special_rules JSONB,
  filing_requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_state_tax_config UNIQUE (state_code, tax_year)
);

CREATE TABLE IF NOT EXISTS lf_state_tax_brackets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  tax_year INTEGER NOT NULL,
  filing_status VARCHAR(50) NOT NULL,
  min_income DECIMAL(12,2) NOT NULL,
  max_income DECIMAL(12,2),
  rate DECIMAL(5,4) NOT NULL,
  base_tax DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_state_bracket UNIQUE (state_code, tax_year, filing_status, min_income)
);

CREATE TABLE IF NOT EXISTS lf_state_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  tax_year INTEGER NOT NULL,
  credit_type VARCHAR(100) NOT NULL,
  max_amount DECIMAL(12,2),
  refundable BOOLEAN DEFAULT FALSE,
  description TEXT,
  eligibility_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_state_credit UNIQUE (state_code, tax_year, credit_type)
);

-- =====================================================
-- CHILD SUPPORT GUIDELINES
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_child_support_guidelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  model_type VARCHAR(50) NOT NULL,
  effective_date DATE,
  base_percentage DECIMAL(5,4),
  per_child_percentages JSONB,
  income_shares_schedule JSONB,
  low_income_threshold DECIMAL(12,2),
  self_support_reserve DECIMAL(12,2),
  high_income_cap DECIMAL(12,2),
  deviation_factors TEXT[],
  special_rules JSONB,
  healthcare_allocation JSONB,
  childcare_allocation JSONB,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_child_support_state UNIQUE (state_code)
);

CREATE TABLE IF NOT EXISTS lf_child_support_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  combined_income_min DECIMAL(12,2) NOT NULL,
  combined_income_max DECIMAL(12,2),
  one_child DECIMAL(12,2),
  two_children DECIMAL(12,2),
  three_children DECIMAL(12,2),
  four_children DECIMAL(12,2),
  five_children DECIMAL(12,2),
  six_children DECIMAL(12,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_support_schedule UNIQUE (state_code, combined_income_min)
);

-- =====================================================
-- BUSINESS FORMATION REQUIREMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_business_formation_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  filing_fee DECIMAL(10,2),
  annual_report_fee DECIMAL(10,2),
  franchise_tax DECIMAL(10,2),
  formation_document VARCHAR(255),
  required_fields JSONB,
  registered_agent_required BOOLEAN DEFAULT TRUE,
  operating_agreement_required BOOLEAN DEFAULT FALSE,
  publication_required BOOLEAN DEFAULT FALSE,
  processing_time VARCHAR(50),
  online_filing_available BOOLEAN DEFAULT TRUE,
  filing_url TEXT,
  special_requirements JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_business_formation UNIQUE (state_code, entity_type)
);

-- =====================================================
-- ENHANCED JURISDICTION RULES
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_filing_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code VARCHAR(2) NOT NULL,
  county VARCHAR(100),
  filing_type VARCHAR(100) NOT NULL,
  filing_fee DECIMAL(10,2),
  fee_waiver_available BOOLEAN DEFAULT TRUE,
  residency_requirement VARCHAR(255),
  waiting_period_days INTEGER,
  mandatory_mediation BOOLEAN DEFAULT FALSE,
  mandatory_parenting_class BOOLEAN DEFAULT FALSE,
  required_forms TEXT[],
  service_requirements JSONB,
  efiling_available BOOLEAN DEFAULT FALSE,
  efiling_system VARCHAR(100),
  special_rules JSONB,
  source_url TEXT,
  last_verified DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_filing_req UNIQUE (state_code, county, filing_type)
);

-- =====================================================
-- DATA INGESTION TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS lf_data_ingestion_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data_type VARCHAR(100) NOT NULL,
  source VARCHAR(255),
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_lf_federal_brackets_year ON lf_federal_tax_brackets(tax_year);
CREATE INDEX IF NOT EXISTS idx_lf_federal_brackets_status ON lf_federal_tax_brackets(filing_status);
CREATE INDEX IF NOT EXISTS idx_lf_federal_deductions_year ON lf_federal_deductions(tax_year);
CREATE INDEX IF NOT EXISTS idx_lf_federal_credits_year ON lf_federal_credits(tax_year);
CREATE INDEX IF NOT EXISTS idx_lf_tax_forms_number ON lf_tax_forms(form_number);
CREATE INDEX IF NOT EXISTS idx_lf_tax_forms_year ON lf_tax_forms(tax_year);

CREATE INDEX IF NOT EXISTS idx_lf_state_tax_state ON lf_state_tax_config(state_code);
CREATE INDEX IF NOT EXISTS idx_lf_state_tax_year ON lf_state_tax_config(tax_year);
CREATE INDEX IF NOT EXISTS idx_lf_state_brackets_state ON lf_state_tax_brackets(state_code);

CREATE INDEX IF NOT EXISTS idx_lf_cs_guidelines_state ON lf_child_support_guidelines(state_code);
CREATE INDEX IF NOT EXISTS idx_lf_cs_schedules_state ON lf_child_support_schedules(state_code);

CREATE INDEX IF NOT EXISTS idx_lf_business_formation_state ON lf_business_formation_requirements(state_code);
CREATE INDEX IF NOT EXISTS idx_lf_business_formation_type ON lf_business_formation_requirements(entity_type);

CREATE INDEX IF NOT EXISTS idx_lf_filing_req_state ON lf_filing_requirements(state_code);
CREATE INDEX IF NOT EXISTS idx_lf_filing_req_type ON lf_filing_requirements(filing_type);

CREATE INDEX IF NOT EXISTS idx_lf_ingestion_log_type ON lf_data_ingestion_log(data_type);
CREATE INDEX IF NOT EXISTS idx_lf_ingestion_log_status ON lf_data_ingestion_log(status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
-- These tables are reference data - read-only for authenticated users
ALTER TABLE lf_federal_tax_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_federal_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_federal_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_tax_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_state_tax_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_state_tax_brackets ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_state_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_child_support_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_child_support_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_business_formation_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE lf_filing_requirements ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data
CREATE POLICY "Public read federal brackets" ON lf_federal_tax_brackets FOR SELECT USING (true);
CREATE POLICY "Public read federal deductions" ON lf_federal_deductions FOR SELECT USING (true);
CREATE POLICY "Public read federal credits" ON lf_federal_credits FOR SELECT USING (true);
CREATE POLICY "Public read tax forms" ON lf_tax_forms FOR SELECT USING (true);
CREATE POLICY "Public read state tax config" ON lf_state_tax_config FOR SELECT USING (true);
CREATE POLICY "Public read state brackets" ON lf_state_tax_brackets FOR SELECT USING (true);
CREATE POLICY "Public read state credits" ON lf_state_credits FOR SELECT USING (true);
CREATE POLICY "Public read cs guidelines" ON lf_child_support_guidelines FOR SELECT USING (true);
CREATE POLICY "Public read cs schedules" ON lf_child_support_schedules FOR SELECT USING (true);
CREATE POLICY "Public read business formation" ON lf_business_formation_requirements FOR SELECT USING (true);
CREATE POLICY "Public read filing requirements" ON lf_filing_requirements FOR SELECT USING (true);

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE TRIGGER update_lf_state_tax_config_updated_at
  BEFORE UPDATE ON lf_state_tax_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lf_child_support_guidelines_updated_at
  BEFORE UPDATE ON lf_child_support_guidelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lf_business_formation_updated_at
  BEFORE UPDATE ON lf_business_formation_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lf_filing_requirements_updated_at
  BEFORE UPDATE ON lf_filing_requirements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

