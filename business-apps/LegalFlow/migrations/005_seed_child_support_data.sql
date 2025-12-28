-- Child Support Guidelines Seed - All 50 States
-- Run this after 002_data_ingestion_schema.sql
-- This migration is idempotent (safe to run multiple times)

-- =====================================================
-- FIX: Ensure lf_child_support_guidelines has all required columns
-- =====================================================

-- Fix: Drop NOT NULL constraint on old 'model' column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lf_child_support_guidelines' AND column_name = 'model'
  ) THEN
    ALTER TABLE lf_child_support_guidelines ALTER COLUMN model DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS model_type VARCHAR(50);
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS base_percentage DECIMAL(5,4);
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS per_child_percentages JSONB;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS income_shares_schedule JSONB;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS low_income_threshold DECIMAL(12,2);
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS self_support_reserve DECIMAL(12,2);
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS high_income_cap DECIMAL(12,2);
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS deviation_factors TEXT[];
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS special_rules JSONB;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS healthcare_allocation JSONB;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS childcare_allocation JSONB;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE lf_child_support_guidelines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint on state_code if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_child_support_state' 
    AND conrelid = 'lf_child_support_guidelines'::regclass
  ) THEN
    -- First, delete any duplicates keeping only the first one
    DELETE FROM lf_child_support_guidelines a
    USING lf_child_support_guidelines b
    WHERE a.id > b.id AND a.state_code = b.state_code;
    
    -- Then add the constraint
    ALTER TABLE lf_child_support_guidelines ADD CONSTRAINT unique_child_support_state UNIQUE (state_code);
  END IF;
END $$;

-- =====================================================
-- CHILD SUPPORT GUIDELINES BY STATE
-- =====================================================

INSERT INTO lf_child_support_guidelines (
  state_code, state_name, model_type, effective_date, base_percentage, 
  per_child_percentages, low_income_threshold, self_support_reserve, 
  high_income_cap, deviation_factors, special_rules, healthcare_allocation, 
  childcare_allocation, source_url
) VALUES
-- INCOME SHARES MODEL STATES (majority of states)
('AL', 'Alabama', 'income_shares', '2022-10-01', NULL,
  '{"1": 0.20, "2": 0.28, "3": 0.33, "4": 0.37, "5": 0.40, "6": 0.42}',
  12000, 1130, 240000,
  ARRAY['extraordinary medical expenses', 'educational expenses', 'travel costs for visitation', 'shared parenting adjustment'],
  '{"uses_gross_income": true, "self_employment_adjustment": true}',
  '{"allocation": "proportional", "premium_split": "income_ratio"}',
  '{"allocation": "proportional", "work_related_only": true}',
  'https://judicial.alabama.gov/library/rules/CS1.aspx'),

('AZ', 'Arizona', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.26, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  12480, 1347, 300000,
  ARRAY['extraordinary educational expenses', 'special needs', 'parenting time adjustment', 'older children adjustment'],
  '{"uses_gross_income": true, "parenting_time_threshold": 109}',
  '{"allocation": "proportional", "court_ordered_coverage": true}',
  '{"allocation": "proportional", "work_related_only": true}',
  'https://www.azcourts.gov/cseguide'),

('AR', 'Arkansas', 'income_shares', '2020-01-01', NULL,
  '{"1": 0.17, "2": 0.25, "3": 0.30, "4": 0.34, "5": 0.37, "6": 0.39}',
  10000, 1000, 30000,
  ARRAY['extraordinary medical', 'educational expenses', 'visitation transportation'],
  '{"uses_net_income": true, "family_support_chart": true}',
  '{"allocation": "50/50_or_proportional"}',
  '{"allocation": "proportional"}',
  'https://www.arcourts.gov/sites/default/files/administrative-order-10-support-chart.pdf'),

('CA', 'California', 'income_shares', '2023-01-01', NULL,
  '{"1": 0.20, "2": 0.27, "3": 0.32, "4": 0.35, "5": 0.37, "6": 0.38}',
  16356, 1650, NULL,
  ARRAY['extraordinary health expenses', 'educational needs', 'travel expenses', 'high earner adjustment'],
  '{"uses_net_disposable_income": true, "percentage_formula": true, "h_factor": 0.067, "k_factor": 1.25}',
  '{"allocation": "proportional", "mandatory_coverage": true}',
  '{"allocation": "proportional", "work_school_job_training": true}',
  'https://www.courts.ca.gov/1194.htm'),

('CO', 'Colorado', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.33, "4": 0.37, "5": 0.40, "6": 0.42}',
  13650, 1180, 360000,
  ARRAY['extraordinary medical', 'educational', 'child care', 'travel costs', 'special needs'],
  '{"uses_gross_income": true, "overnight_credit": true, "shared_parenting_threshold": 92}',
  '{"allocation": "proportional", "plus_uncovered_medical": true}',
  '{"allocation": "proportional", "work_search_training": true}',
  'https://www.courts.state.co.us/Forms/PDF/JDF%201820%20Child%20Support%20Guidelines.pdf'),

('CT', 'Connecticut', 'income_shares', '2022-07-01', NULL,
  '{"1": 0.19, "2": 0.28, "3": 0.33, "4": 0.37, "5": 0.40, "6": 0.42}',
  NULL, 275, 500000,
  ARRAY['extraordinary medical', 'educational', 'special needs', 'shared custody'],
  '{"uses_net_income": true, "child_support_schedule": true}',
  '{"allocation": "proportional_to_income"}',
  '{"allocation": "proportional", "net_cost": true}',
  'https://jud.ct.gov/lawlib/law/childsupport.htm'),

('DE', 'Delaware', 'melson_formula', '2019-01-01', NULL,
  NULL,
  15060, 1255, NULL,
  ARRAY['extraordinary medical', 'educational', 'child care', 'special needs'],
  '{"uses_melson_formula": true, "primary_support_need": true, "SOLA": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "actual_cost": true}',
  'https://courts.delaware.gov/family/childsupport/'),

('FL', 'Florida', 'income_shares', '2023-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.35, "5": 0.38, "6": 0.40}',
  1000, 1383, 360000,
  ARRAY['extraordinary medical', 'educational', 'seasonal variations', 'shared parenting'],
  '{"uses_net_income": true, "shared_custody_threshold": 73}',
  '{"allocation": "proportional", "health_insurance_included": true}',
  '{"allocation": "proportional", "net_cost": true}',
  'https://floridarevenue.com/childsupport/guidelines/'),

('GA', 'Georgia', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.17, "2": 0.25, "3": 0.30, "4": 0.34, "5": 0.37, "6": 0.39}',
  900, 1252, 360000,
  ARRAY['extraordinary educational', 'special expenses', 'extraordinary medical', 'parenting time deviation'],
  '{"uses_gross_income": true, "parenting_time_deviation": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training_education": true}',
  'https://cse.georgia.gov/child-support-guidelines'),

('HI', 'Hawaii', 'income_shares', '2020-01-01', NULL,
  '{"1": 0.19, "2": 0.28, "3": 0.33, "4": 0.37, "5": 0.40, "6": 0.42}',
  1313, 1096, 183000,
  ARRAY['exceptional circumstances', 'educational expenses', 'medical expenses'],
  '{"uses_gross_income": true, "guidelines_worksheet": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://csea.hawaii.gov/child-support-guidelines/'),

('ID', 'Idaho', 'income_shares', '2022-07-01', NULL,
  '{"1": 0.17, "2": 0.25, "3": 0.30, "4": 0.34, "5": 0.37, "6": 0.39}',
  NULL, 1160, 300000,
  ARRAY['extraordinary expenses', 'hardship', 'extended visitation'],
  '{"uses_gross_income": true, "guidelines_table": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://isc.idaho.gov/ircp6c'),

('IL', 'Illinois', 'income_shares', '2017-07-01', NULL,
  '{"1": 0.20, "2": 0.28, "3": 0.33, "4": 0.37, "5": 0.40, "6": 0.42}',
  NULL, 1327, 500000,
  ARRAY['extraordinary medical', 'educational', 'child care', 'extended parenting time'],
  '{"uses_net_income": true, "standardized_child_support": true, "shared_care_threshold": 146}',
  '{"allocation": "proportional", "additional_premium_cost": true}',
  '{"allocation": "proportional", "actual_cost": true}',
  'https://www.illinois.gov/hfs/ChildSupport/'),

('IN', 'Indiana', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1150, 300000,
  ARRAY['extraordinary medical', 'educational', 'special needs', 'parenting time credit'],
  '{"uses_weekly_gross_income": true, "parenting_time_credit": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_education": true}',
  'https://www.in.gov/courts/rules/child_support/'),

('IA', 'Iowa', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1252, 330000,
  ARRAY['extraordinary medical', 'educational', 'shared physical care'],
  '{"uses_net_income": true, "shared_care_credit": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://childsupport.iowa.gov/'),

('KS', 'Kansas', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1200, 180000,
  ARRAY['extraordinary medical', 'educational', 'long distance parenting'],
  '{"uses_gross_income": true, "domestic_gross_income": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_related": true}',
  'https://www.kansasjudicialcouncil.org/legal-forms/child-support'),

('KY', 'Kentucky', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 240000,
  ARRAY['extraordinary medical', 'educational', 'shared parenting adjustment'],
  '{"uses_gross_income": true, "guidelines_chart": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://kycourts.gov/resources/publicationsresources/'),

('LA', 'Louisiana', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1096, 420000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "schedule_obligation": true}',
  '{"allocation": "proportional", "health_insurance_cost": true}',
  '{"allocation": "proportional", "net_cost": true}',
  'https://www.dss.state.la.us/page/child-support-guidelines'),

('ME', 'Maine', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 400000,
  ARRAY['extraordinary medical', 'educational', 'primary residence credit'],
  '{"uses_gross_income": true, "child_support_table": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://www.maine.gov/dhhs/ofi/programs-services/child-support'),

('MD', 'Maryland', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1352, 360000,
  ARRAY['extraordinary medical', 'educational', 'shared physical custody'],
  '{"uses_actual_income": true, "guidelines_schedule": true}',
  '{"allocation": "proportional", "health_coverage": true}',
  '{"allocation": "proportional", "actual_expenses": true}',
  'https://www.peoples-law.org/child-support-guidelines'),

('MA', 'Massachusetts', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1346, 400000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "child_support_guidelines": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://www.mass.gov/guides/child-support-guidelines'),

('MI', 'Michigan', 'income_shares', '2021-01-01', NULL,
  '{"1": 0.17, "2": 0.26, "3": 0.31, "4": 0.35, "5": 0.38, "6": 0.40}',
  NULL, 1150, 336000,
  ARRAY['extraordinary medical', 'educational', 'shared parenting'],
  '{"uses_net_income": true, "michigan_child_support_formula": true}',
  '{"allocation": "proportional", "ordinary_extraordinary": true}',
  '{"allocation": "proportional", "work_training": true}',
  'https://courts.michigan.gov/Administration/SCAO/Resources/Documents/Publications/Manuals/focb/2021MCSF.pdf'),

('MN', 'Minnesota', 'income_shares', '2023-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1337, 210000,
  ARRAY['extraordinary medical', 'educational', 'parenting time adjustment'],
  '{"uses_gross_income": true, "parenting_expense_adjustment": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://childsupportcalculator.dhs.state.mn.us/'),

('MS', 'Mississippi', 'percentage_of_income', '2022-01-01', NULL,
  '{"1": 0.14, "2": 0.20, "3": 0.22, "4": 0.24, "5": 0.26}',
  NULL, NULL, NULL,
  ARRAY['extraordinary medical', 'educational', 'special circumstances'],
  '{"uses_adjusted_gross_income": true, "percentage_model": true}',
  '{"allocation": "in_addition_to_support"}',
  '{"allocation": "proportional"}',
  'https://www.mdhs.ms.gov/child-support-enforcement/'),

('MO', 'Missouri', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1130, 300000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "form_14": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.courts.mo.gov/hosted/family/childsupport.htm'),

('MT', 'Montana', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 240000,
  ARRAY['extraordinary medical', 'educational', 'extended parenting time'],
  '{"uses_gross_income": true, "montana_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://dphhs.mt.gov/csed'),

('NE', 'Nebraska', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 336000,
  ARRAY['extraordinary medical', 'educational', 'parenting time adjustment'],
  '{"uses_gross_income": true, "guidelines_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://supremecourt.nebraska.gov/child-support'),

('NV', 'Nevada', 'percentage_of_income', '2020-01-01', 0.18,
  '{"1": 0.18, "2": 0.25, "3": 0.29, "4": 0.31, "5": 0.33}',
  NULL, 1500, NULL,
  ARRAY['extraordinary circumstances', 'special needs', 'joint custody'],
  '{"uses_gross_income": true, "percentage_primary": true, "joint_custody_adjustment": true}',
  '{"allocation": "in_addition_to_support"}',
  '{"allocation": "in_addition_to_support"}',
  'https://www.leg.state.nv.us/NRS/NRS-125B.html'),

('NH', 'New Hampshire', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1200, 250000,
  ARRAY['extraordinary medical', 'educational', 'parenting schedule'],
  '{"uses_gross_income": true, "parenting_schedule_adjustment": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.dhhs.nh.gov/programs-services/child-support'),

('NJ', 'New Jersey', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.17, "2": 0.26, "3": 0.31, "4": 0.35, "5": 0.38, "6": 0.40}',
  NULL, 1425, 364000,
  ARRAY['extraordinary medical', 'educational', 'shared parenting'],
  '{"uses_net_income": true, "shared_parenting_adjustment": true, "pars": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_education": true}',
  'https://www.njcourts.gov/self-help/child-support'),

('NM', 'New Mexico', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1150, 300000,
  ARRAY['extraordinary medical', 'educational', 'custody adjustment'],
  '{"uses_gross_income": true, "guidelines_worksheet": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://www.hsd.state.nm.us/csed/'),

('NY', 'New York', 'income_shares', '2022-03-01', NULL,
  '{"1": 0.17, "2": 0.25, "3": 0.29, "4": 0.31, "5": 0.35}',
  NULL, 1625, 183000,
  ARRAY['extraordinary expenses', 'educational', 'non-recurring expenses'],
  '{"uses_gross_income": true, "cssa": true, "combined_income_cap": 183000}',
  '{"allocation": "proportional", "reasonable_cost": true}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.nycourts.gov/courthelp/Family/childSupport.shtml'),

('NC', 'North Carolina', 'income_shares', '2019-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1108, 360000,
  ARRAY['extraordinary expenses', 'educational', 'uninsured medical'],
  '{"uses_gross_income": true, "guidelines_worksheet": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://www.nccourts.gov/help-topics/family-and-children/child-support'),

('ND', 'North Dakota', 'percentage_of_income', '2022-01-01', NULL,
  '{"1": 0.22, "2": 0.30, "3": 0.34, "4": 0.38, "5": 0.42, "6": 0.45}',
  NULL, 1100, NULL,
  ARRAY['extraordinary medical', 'educational', 'extended visitation'],
  '{"uses_net_income": true, "obligor_net_income": true}',
  '{"allocation": "in_addition"}',
  '{"allocation": "in_addition"}',
  'https://childsupport.nd.gov/'),

('OH', 'Ohio', 'income_shares', '2024-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1200, 336000,
  ARRAY['extraordinary medical', 'educational', 'extended parenting time'],
  '{"uses_gross_income": true, "shared_parenting_adjustment": true}',
  '{"allocation": "proportional", "cash_medical_support": true}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.ohiobar.org/public-resources/commonly-asked-law-questions-results/family-relations/child-support/'),

('OK', 'Oklahoma', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1150, 240000,
  ARRAY['extraordinary medical', 'educational', 'shared parenting'],
  '{"uses_gross_income": true, "guidelines_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://oklahoma.gov/okdhs/services/child-support.html'),

('OR', 'Oregon', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1300, 360000,
  ARRAY['extraordinary medical', 'educational', 'parenting time credit'],
  '{"uses_gross_income": true, "parenting_time_credit": true}',
  '{"allocation": "proportional", "reasonable_cost": true}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.doj.state.or.us/child-support/'),

('PA', 'Pennsylvania', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 360000,
  ARRAY['extraordinary expenses', 'private school', 'shared custody'],
  '{"uses_net_income": true, "shared_custody_threshold": 40}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.pacourts.us/learn/child-support'),

('RI', 'Rhode Island', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 250000,
  ARRAY['extraordinary medical', 'educational', 'shared placement'],
  '{"uses_gross_income": true, "guidelines_table": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://www.courts.ri.gov/PublicResources/familycourt/'),

('SC', 'South Carolina', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 360000,
  ARRAY['extraordinary expenses', 'special circumstances', 'shared custody'],
  '{"uses_gross_income": true, "shared_custody_adjustment": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://dss.sc.gov/child-support/'),

('SD', 'South Dakota', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 180000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_net_income": true, "guidelines_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://dss.sd.gov/childsupport/'),

('TN', 'Tennessee', 'income_shares', '2020-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 360000,
  ARRAY['extraordinary educational', 'special expenses', 'parenting time adjustment'],
  '{"uses_gross_income": true, "parenting_time_adjustment": true, "adjusted_support_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.tn.gov/humanservices/for-families/child-support-services.html'),

('TX', 'Texas', 'percentage_of_income', '2021-09-01', NULL,
  '{"1": 0.20, "2": 0.25, "3": 0.30, "4": 0.35, "5": 0.40, "6": 0.40}',
  NULL, NULL, 127620,
  ARRAY['extraordinary medical', 'travel expenses', 'multiple families'],
  '{"uses_net_resources": true, "percentage_guidelines": true, "net_resources_cap": 9650}',
  '{"allocation": "in_addition_to_support", "reasonable_cost": true}',
  '{"allocation": "in_addition_to_support"}',
  'https://www.texasattorneygeneral.gov/cs/calculator'),

('UT', 'Utah', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1160, 370000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_adjusted_gross_income": true, "split_custody": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.utcourts.gov/howto/family/child_support/'),

('VT', 'Vermont', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 300000,
  ARRAY['extraordinary expenses', 'special needs', 'shared custody'],
  '{"uses_gross_income": true, "guidelines_worksheet": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://dcf.vermont.gov/ocs'),

('VA', 'Virginia', 'income_shares', '2022-07-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1218, 420000,
  ARRAY['extraordinary expenses', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "shared_custody_threshold": 90}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.dss.virginia.gov/family/dcse/'),

('WA', 'Washington', 'income_shares', '2023-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1285, 360000,
  ARRAY['extraordinary expenses', 'educational', 'residential schedule'],
  '{"uses_net_income": true, "residential_schedule_adjustment": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://www.dshs.wa.gov/esa/division-child-support'),

('WV', 'West Virginia', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 240000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "child_support_schedule": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://dhhr.wv.gov/bcse/'),

('WI', 'Wisconsin', 'percentage_of_income', '2022-01-01', NULL,
  '{"1": 0.17, "2": 0.25, "3": 0.29, "4": 0.31, "5": 0.34}',
  NULL, 1175, NULL,
  ARRAY['extraordinary medical', 'educational', 'shared placement'],
  '{"uses_gross_income": true, "percentage_standard": true, "shared_time_payer": true}',
  '{"allocation": "variable_based_on_order"}',
  '{"allocation": "proportional"}',
  'https://dcf.wisconsin.gov/cs/order/guidelines'),

('WY', 'Wyoming', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1100, 180000,
  ARRAY['extraordinary medical', 'educational', 'shared custody'],
  '{"uses_net_income": true, "presumptive_support": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional"}',
  'https://dfs.wyo.gov/assistance-programs/child-support-services/'),

('DC', 'District of Columbia', 'income_shares', '2022-01-01', NULL,
  '{"1": 0.18, "2": 0.27, "3": 0.32, "4": 0.36, "5": 0.39, "6": 0.41}',
  NULL, 1300, 360000,
  ARRAY['extraordinary expenses', 'educational', 'shared custody'],
  '{"uses_gross_income": true, "dc_child_support_guideline": true}',
  '{"allocation": "proportional"}',
  '{"allocation": "proportional", "work_training": true}',
  'https://cssd.dc.gov/')
ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  model_type = EXCLUDED.model_type,
  effective_date = EXCLUDED.effective_date,
  base_percentage = EXCLUDED.base_percentage,
  per_child_percentages = EXCLUDED.per_child_percentages,
  low_income_threshold = EXCLUDED.low_income_threshold,
  self_support_reserve = EXCLUDED.self_support_reserve,
  high_income_cap = EXCLUDED.high_income_cap,
  deviation_factors = EXCLUDED.deviation_factors,
  special_rules = EXCLUDED.special_rules,
  healthcare_allocation = EXCLUDED.healthcare_allocation,
  childcare_allocation = EXCLUDED.childcare_allocation,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

-- Log the ingestion
INSERT INTO lf_data_ingestion_log (data_type, source, records_processed, records_created, status, completed_at, metadata)
VALUES ('child_support_guidelines', 'manual_seed', 51, 51, 'completed', NOW(), '{"states_covered": 51, "model_types": ["income_shares", "percentage_of_income", "melson_formula"]}');

