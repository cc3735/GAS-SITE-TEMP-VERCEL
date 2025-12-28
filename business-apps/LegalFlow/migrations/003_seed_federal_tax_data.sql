-- Federal Tax Data Seed - 2024 Tax Year
-- Run this after 002_data_ingestion_schema.sql
-- This migration is idempotent (safe to run multiple times)

-- =====================================================
-- FIX: Ensure lf_tax_forms table has all required columns
-- (handles cases where table existed from previous migration)
-- =====================================================

-- Add all potentially missing columns using ALTER TABLE ADD COLUMN IF NOT EXISTS
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS form_type VARCHAR(50);
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS is_federal BOOLEAN DEFAULT TRUE;
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS state_code VARCHAR(2);
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS field_schema JSONB;
ALTER TABLE lf_tax_forms ADD COLUMN IF NOT EXISTS instructions_url TEXT;

-- Create partial unique index for federal forms (where state_code IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_lf_tax_forms_federal_unique 
ON lf_tax_forms (form_number, tax_year) WHERE state_code IS NULL;

-- =====================================================
-- 2024 FEDERAL TAX BRACKETS
-- =====================================================

-- Single Filers
INSERT INTO lf_federal_tax_brackets (tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'single', 0, 11600, 0.10, 0),
(2024, 'single', 11600, 47150, 0.12, 1160),
(2024, 'single', 47150, 100525, 0.22, 5426),
(2024, 'single', 100525, 191950, 0.24, 17168.50),
(2024, 'single', 191950, 243725, 0.32, 39110.50),
(2024, 'single', 243725, 609350, 0.35, 55678.50),
(2024, 'single', 609350, NULL, 0.37, 183647.25)
ON CONFLICT (tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income,
  rate = EXCLUDED.rate,
  base_tax = EXCLUDED.base_tax;

-- Married Filing Jointly
INSERT INTO lf_federal_tax_brackets (tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'married_jointly', 0, 23200, 0.10, 0),
(2024, 'married_jointly', 23200, 94300, 0.12, 2320),
(2024, 'married_jointly', 94300, 201050, 0.22, 10852),
(2024, 'married_jointly', 201050, 383900, 0.24, 34337),
(2024, 'married_jointly', 383900, 487450, 0.32, 78221),
(2024, 'married_jointly', 487450, 731200, 0.35, 111357),
(2024, 'married_jointly', 731200, NULL, 0.37, 196669.50)
ON CONFLICT (tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income,
  rate = EXCLUDED.rate,
  base_tax = EXCLUDED.base_tax;

-- Married Filing Separately
INSERT INTO lf_federal_tax_brackets (tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'married_separately', 0, 11600, 0.10, 0),
(2024, 'married_separately', 11600, 47150, 0.12, 1160),
(2024, 'married_separately', 47150, 100525, 0.22, 5426),
(2024, 'married_separately', 100525, 191950, 0.24, 17168.50),
(2024, 'married_separately', 191950, 243725, 0.32, 39110.50),
(2024, 'married_separately', 243725, 365600, 0.35, 55678.50),
(2024, 'married_separately', 365600, NULL, 0.37, 98334.75)
ON CONFLICT (tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income,
  rate = EXCLUDED.rate,
  base_tax = EXCLUDED.base_tax;

-- Head of Household
INSERT INTO lf_federal_tax_brackets (tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
(2024, 'head_of_household', 0, 16550, 0.10, 0),
(2024, 'head_of_household', 16550, 63100, 0.12, 1655),
(2024, 'head_of_household', 63100, 100500, 0.22, 7241),
(2024, 'head_of_household', 100500, 191950, 0.24, 15469),
(2024, 'head_of_household', 191950, 243700, 0.32, 37417),
(2024, 'head_of_household', 243700, 609350, 0.35, 53977),
(2024, 'head_of_household', 609350, NULL, 0.37, 181954.50)
ON CONFLICT (tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income,
  rate = EXCLUDED.rate,
  base_tax = EXCLUDED.base_tax;

-- =====================================================
-- 2024 STANDARD DEDUCTIONS
-- =====================================================

INSERT INTO lf_federal_deductions (tax_year, deduction_type, filing_status, amount, description) VALUES
(2024, 'standard_deduction', 'single', 14600, 'Standard deduction for single filers'),
(2024, 'standard_deduction', 'married_jointly', 29200, 'Standard deduction for married filing jointly'),
(2024, 'standard_deduction', 'married_separately', 14600, 'Standard deduction for married filing separately'),
(2024, 'standard_deduction', 'head_of_household', 21900, 'Standard deduction for head of household'),
(2024, 'additional_standard_65_blind', 'single', 1950, 'Additional standard deduction for 65+ or blind (single/HOH)'),
(2024, 'additional_standard_65_blind', 'married_jointly', 1550, 'Additional standard deduction for 65+ or blind (married)'),
(2024, 'personal_exemption', NULL, 0, 'Personal exemptions suspended through 2025'),
(2024, 'salt_cap', NULL, 10000, 'State and local tax deduction cap'),
(2024, 'mortgage_interest_limit', NULL, 750000, 'Mortgage debt limit for interest deduction'),
(2024, 'charitable_cash_agi_limit', NULL, 0.60, 'Cash charitable contribution AGI limit (60%)'),
(2024, 'medical_expense_floor', NULL, 0.075, 'Medical expense deduction floor (7.5% of AGI)')
ON CONFLICT (tax_year, deduction_type, filing_status) DO UPDATE SET
  amount = EXCLUDED.amount,
  description = EXCLUDED.description;

-- =====================================================
-- 2024 TAX CREDITS
-- =====================================================

INSERT INTO lf_federal_credits (tax_year, credit_type, max_amount, phase_out_start, phase_out_end, refundable, description, eligibility_rules, calculation_rules) VALUES
(2024, 'child_tax_credit', 2000, 200000, 240000, false, 'Child Tax Credit per qualifying child under 17', 
  '{"age_limit": 17, "citizenship": "us_or_resident", "relationship": ["child", "stepchild", "foster_child", "sibling", "niece_nephew"], "residency": "more_than_half_year", "support": "not_self_supporting", "ssn_required": true}',
  '{"base_amount": 2000, "refundable_portion": 1700, "phase_out_rate": 0.05, "phase_out_threshold_single": 200000, "phase_out_threshold_married": 400000}'
),
(2024, 'earned_income_credit', 7830, NULL, NULL, true, 'Earned Income Tax Credit - max for 3+ children',
  '{"earned_income_required": true, "investment_income_limit": 11600, "filing_status_excluded": ["married_separately"], "age_limits_no_children": {"min": 25, "max": 65}}',
  '{"no_children": {"max": 632, "phase_in_end": 7840, "phase_out_start": 9800, "phase_out_end": 17640}, "one_child": {"max": 4213, "phase_in_end": 11750, "phase_out_start": 21560, "phase_out_end": 49084}, "two_children": {"max": 6960, "phase_in_end": 16510, "phase_out_start": 21560, "phase_out_end": 55768}, "three_plus_children": {"max": 7830, "phase_in_end": 16510, "phase_out_start": 21560, "phase_out_end": 59899}}'
),
(2024, 'child_dependent_care', 3000, NULL, NULL, false, 'Child and Dependent Care Credit - max for one qualifying individual',
  '{"qualifying_individual": true, "earned_income_required": true, "care_provider_info_required": true}',
  '{"one_qualifying": {"max_expenses": 3000}, "two_or_more": {"max_expenses": 6000}, "credit_percentage_range": {"min": 0.20, "max": 0.35}, "agi_threshold": 15000}'
),
(2024, 'american_opportunity', 2500, 80000, 90000, true, 'American Opportunity Tax Credit for higher education',
  '{"enrollment": "at_least_half_time", "degree_program": true, "first_four_years": true, "no_felony_drug_conviction": true}',
  '{"max_credit": 2500, "qualified_expenses_100": 2000, "qualified_expenses_25": 2000, "refundable_portion": 0.40, "phase_out_single": {"start": 80000, "end": 90000}, "phase_out_married": {"start": 160000, "end": 180000}}'
),
(2024, 'lifetime_learning', 2000, 80000, 90000, false, 'Lifetime Learning Credit for education expenses',
  '{"enrolled_eligible_institution": true, "no_year_limit": true}',
  '{"max_credit": 2000, "credit_rate": 0.20, "max_qualified_expenses": 10000, "phase_out_single": {"start": 80000, "end": 90000}, "phase_out_married": {"start": 160000, "end": 180000}}'
),
(2024, 'saver_credit', 1000, NULL, NULL, false, 'Retirement Savings Contributions Credit',
  '{"age_min": 18, "not_student": true, "not_dependent": true, "retirement_contribution_required": true}',
  '{"max_contribution_base": 2000, "credit_rates": {"50_percent": {"single_max_agi": 23000, "hoh_max_agi": 34500, "married_max_agi": 46000}, "20_percent": {"single_max_agi": 25000, "hoh_max_agi": 37500, "married_max_agi": 50000}, "10_percent": {"single_max_agi": 38250, "hoh_max_agi": 57375, "married_max_agi": 76500}}}'
),
(2024, 'adoption_credit', 16810, 252150, 292150, false, 'Adoption Credit for qualified adoption expenses',
  '{"qualified_adoption_expenses": true, "child_under_18_or_disabled": true}',
  '{"max_credit": 16810, "phase_out_start": 252150, "phase_out_end": 292150}'
),
(2024, 'ev_credit', 7500, NULL, NULL, false, 'Clean Vehicle Credit for new electric vehicles',
  '{"new_vehicle": true, "battery_capacity_min_kwh": 7, "final_assembly_north_america": true, "msrp_limits": {"van_suv_truck": 80000, "other": 55000}, "income_limits": {"single": 150000, "hoh": 225000, "married": 300000}}',
  '{"max_credit": 7500, "battery_components_portion": 3750, "critical_minerals_portion": 3750}'
),
(2024, 'used_ev_credit', 4000, NULL, NULL, false, 'Clean Vehicle Credit for used electric vehicles',
  '{"used_vehicle": true, "model_year_at_least_2_years_old": true, "sale_price_max": 25000, "income_limits": {"single": 75000, "hoh": 112500, "married": 150000}}',
  '{"max_credit": 4000, "credit_rate": 0.30}'
),
(2024, 'residential_energy', NULL, NULL, NULL, false, 'Residential Clean Energy Credit',
  '{"qualified_property": ["solar_electric", "solar_water_heating", "fuel_cells", "small_wind", "geothermal", "battery_storage"]}',
  '{"credit_rate": 0.30, "no_max_for_most": true, "fuel_cell_limit_per_kw": 500}'
),
(2024, 'premium_tax_credit', NULL, NULL, NULL, true, 'Premium Tax Credit for health insurance marketplace',
  '{"marketplace_coverage": true, "not_eligible_other_coverage": true, "income_100_to_400_fpl": true}',
  '{"benchmark_plan": "second_lowest_silver", "contribution_percentage_by_income": true}'
)
ON CONFLICT (tax_year, credit_type) DO UPDATE SET
  max_amount = EXCLUDED.max_amount,
  phase_out_start = EXCLUDED.phase_out_start,
  phase_out_end = EXCLUDED.phase_out_end,
  refundable = EXCLUDED.refundable,
  description = EXCLUDED.description,
  eligibility_rules = EXCLUDED.eligibility_rules,
  calculation_rules = EXCLUDED.calculation_rules;

-- =====================================================
-- COMMON FEDERAL TAX FORMS
-- =====================================================

INSERT INTO lf_tax_forms (form_number, form_name, tax_year, form_type, is_federal, description) VALUES
('1040', 'U.S. Individual Income Tax Return', 2024, 'primary', true, 'Main individual income tax return form'),
('1040-SR', 'U.S. Tax Return for Seniors', 2024, 'primary', true, 'Simplified tax return for seniors 65 and older'),
('Schedule 1', 'Additional Income and Adjustments to Income', 2024, 'schedule', true, 'Report additional income sources and above-the-line deductions'),
('Schedule 2', 'Additional Taxes', 2024, 'schedule', true, 'Report additional taxes like AMT, self-employment tax'),
('Schedule 3', 'Additional Credits and Payments', 2024, 'schedule', true, 'Report nonrefundable and refundable credits'),
('Schedule A', 'Itemized Deductions', 2024, 'schedule', true, 'Report itemized deductions'),
('Schedule B', 'Interest and Ordinary Dividends', 2024, 'schedule', true, 'Report interest and dividend income over $1,500'),
('Schedule C', 'Profit or Loss From Business', 2024, 'schedule', true, 'Report self-employment income and expenses'),
('Schedule D', 'Capital Gains and Losses', 2024, 'schedule', true, 'Report capital gains and losses from investments'),
('Schedule E', 'Supplemental Income and Loss', 2024, 'schedule', true, 'Report rental, royalty, partnership, S corp income'),
('Schedule SE', 'Self-Employment Tax', 2024, 'schedule', true, 'Calculate self-employment tax'),
('Schedule EIC', 'Earned Income Credit', 2024, 'schedule', true, 'Claim earned income credit with qualifying children'),
('Form 8812', 'Credits for Qualifying Children and Other Dependents', 2024, 'credit', true, 'Calculate child tax credit and credit for other dependents'),
('Form 8863', 'Education Credits', 2024, 'credit', true, 'Claim American Opportunity and Lifetime Learning credits'),
('Form 8880', 'Credit for Qualified Retirement Savings Contributions', 2024, 'credit', true, 'Claim retirement savings contribution credit'),
('Form 2441', 'Child and Dependent Care Expenses', 2024, 'credit', true, 'Claim child and dependent care credit'),
('Form 8962', 'Premium Tax Credit', 2024, 'credit', true, 'Reconcile advance premium tax credit'),
('Form 8936', 'Clean Vehicle Credits', 2024, 'credit', true, 'Claim clean vehicle credits'),
('Form 5695', 'Residential Energy Credits', 2024, 'credit', true, 'Claim residential clean energy and efficiency credits'),
('W-2', 'Wage and Tax Statement', 2024, 'information', true, 'Reports wages and tax withholding from employer'),
('1099-INT', 'Interest Income', 2024, 'information', true, 'Reports interest income from banks and investments'),
('1099-DIV', 'Dividends and Distributions', 2024, 'information', true, 'Reports dividend income and capital gain distributions'),
('1099-B', 'Proceeds from Broker Transactions', 2024, 'information', true, 'Reports sales of stocks, bonds, and other securities'),
('1099-MISC', 'Miscellaneous Information', 2024, 'information', true, 'Reports miscellaneous income like rents and royalties'),
('1099-NEC', 'Nonemployee Compensation', 2024, 'information', true, 'Reports independent contractor income'),
('1099-G', 'Government Payments', 2024, 'information', true, 'Reports unemployment compensation and state tax refunds'),
('1099-R', 'Distributions from Retirement Plans', 2024, 'information', true, 'Reports distributions from pensions, IRAs, and annuities'),
('1099-K', 'Payment Card and Third Party Transactions', 2024, 'information', true, 'Reports payments received through payment processors'),
('1098', 'Mortgage Interest Statement', 2024, 'information', true, 'Reports mortgage interest paid'),
('1098-T', 'Tuition Statement', 2024, 'information', true, 'Reports tuition payments for education credits'),
('1098-E', 'Student Loan Interest Statement', 2024, 'information', true, 'Reports student loan interest paid')
ON CONFLICT (form_number, tax_year) WHERE state_code IS NULL DO UPDATE SET
  form_name = EXCLUDED.form_name,
  form_type = EXCLUDED.form_type,
  is_federal = EXCLUDED.is_federal,
  description = EXCLUDED.description;

-- Log the ingestion
INSERT INTO lf_data_ingestion_log (data_type, source, records_processed, records_created, status, completed_at, metadata)
VALUES ('federal_tax_2024', 'manual_seed', 70, 70, 'completed', NOW(), '{"brackets": 28, "deductions": 11, "credits": 11, "forms": 30}');

