-- State Tax Data Seed - All 50 States (2024 Tax Year)
-- Run this after 002_data_ingestion_schema.sql

-- =====================================================
-- STATE TAX CONFIGURATIONS
-- =====================================================

INSERT INTO lf_state_tax_config (state_code, state_name, tax_year, has_income_tax, tax_type, flat_rate, standard_deduction_single, standard_deduction_married, standard_deduction_hoh, personal_exemption, special_rules) VALUES
-- No Income Tax States
('AK', 'Alaska', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('FL', 'Florida', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('NV', 'Nevada', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('SD', 'South Dakota', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('TX', 'Texas', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('WA', 'Washington', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax on wages, 7% capital gains tax on gains over $262,000"}'),
('WY', 'Wyoming', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No state income tax"}'),
('TN', 'Tennessee', 2024, false, 'none', NULL, NULL, NULL, NULL, NULL, '{"notes": "No tax on wages, Hall Income Tax on investment income phased out in 2021"}'),
('NH', 'New Hampshire', 2024, false, 'interest_dividends', 0.05, NULL, NULL, NULL, NULL, '{"notes": "5% tax on interest and dividends only, phasing out by 2027"}'),

-- Flat Tax States
('CO', 'Colorado', 2024, true, 'flat', 0.044, NULL, NULL, NULL, NULL, '{"notes": "Flat 4.4% state income tax rate"}'),
('IL', 'Illinois', 2024, true, 'flat', 0.0495, NULL, NULL, NULL, 2625, '{"notes": "Flat 4.95% rate, personal exemption $2,625"}'),
('IN', 'Indiana', 2024, true, 'flat', 0.0305, NULL, NULL, NULL, 1000, '{"notes": "Flat 3.05% rate (reduced from 3.15% in 2024)"}'),
('KY', 'Kentucky', 2024, true, 'flat', 0.04, 3160, 6320, 3160, NULL, '{"notes": "Flat 4% rate effective 2024"}'),
('MA', 'Massachusetts', 2024, true, 'flat', 0.05, NULL, NULL, NULL, 4400, '{"notes": "Flat 5% rate, plus 4% surtax on income over $1M"}'),
('MI', 'Michigan', 2024, true, 'flat', 0.0425, NULL, NULL, NULL, 5600, '{"notes": "Flat 4.25% rate, $5,600 personal exemption"}'),
('NC', 'North Carolina', 2024, true, 'flat', 0.0475, 12750, 25500, 19125, NULL, '{"notes": "Flat 4.75% rate for 2024"}'),
('PA', 'Pennsylvania', 2024, true, 'flat', 0.0307, NULL, NULL, NULL, NULL, '{"notes": "Flat 3.07% rate, no standard deduction or personal exemption"}'),
('UT', 'Utah', 2024, true, 'flat', 0.0465, NULL, NULL, NULL, NULL, '{"notes": "Flat 4.65% rate with taxpayer tax credit"}'),

-- Progressive Tax States (most common)
('AL', 'Alabama', 2024, true, 'progressive', NULL, 2500, 7500, 4700, 1500, '{"notes": "3 brackets: 2%, 4%, 5%", "federal_deduction_allowed": true}'),
('AZ', 'Arizona', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "2.5% flat rate effective 2023", "uses_federal_standard_deduction": true}'),
('AR', 'Arkansas', 2024, true, 'progressive', NULL, 2340, 4680, 2340, 29, '{"notes": "4 brackets ranging from 0% to 4.4%"}'),
('CA', 'California', 2024, true, 'progressive', NULL, 5540, 11080, 11080, 144, '{"notes": "9 brackets from 1% to 12.3%, plus 1% mental health surtax over $1M"}'),
('CT', 'Connecticut', 2024, true, 'progressive', NULL, NULL, NULL, NULL, 15000, '{"notes": "7 brackets from 2% to 6.99%"}'),
('DE', 'Delaware', 2024, true, 'progressive', NULL, 3250, 6500, 3250, 110, '{"notes": "6 brackets from 2.2% to 6.6%"}'),
('GA', 'Georgia', 2024, true, 'progressive', NULL, 12000, 24000, 18000, NULL, '{"notes": "5.49% flat rate effective 2024 (transitioning to flat tax)"}'),
('HI', 'Hawaii', 2024, true, 'progressive', NULL, 2200, 4400, 3212, 1144, '{"notes": "12 brackets from 1.4% to 11%"}'),
('ID', 'Idaho', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "5.8% flat rate effective 2023", "uses_federal_standard_deduction": true}'),
('IA', 'Iowa', 2024, true, 'progressive', NULL, 2210, 5450, 2210, 40, '{"notes": "Transitioning to 3.8% flat rate by 2026, currently 4 brackets"}'),
('KS', 'Kansas', 2024, true, 'progressive', NULL, 3500, 8000, 6000, 2250, '{"notes": "3 brackets: 3.1%, 5.25%, 5.7%"}'),
('LA', 'Louisiana', 2024, true, 'progressive', NULL, NULL, NULL, NULL, 4500, '{"notes": "3 brackets: 1.85%, 3.5%, 4.25%", "federal_deduction_allowed": true}'),
('ME', 'Maine', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "3 brackets: 5.8%, 6.75%, 7.15%"}'),
('MD', 'Maryland', 2024, true, 'progressive', NULL, 2550, 5150, 3850, 3200, '{"notes": "8 brackets from 2% to 5.75%, plus local taxes"}'),
('MN', 'Minnesota', 2024, true, 'progressive', NULL, 14575, 29150, 21850, NULL, '{"notes": "4 brackets from 5.35% to 9.85%"}'),
('MS', 'Mississippi', 2024, true, 'progressive', NULL, 2300, 4600, 2300, 6000, '{"notes": "Transitioning to 4% flat rate by 2026"}'),
('MO', 'Missouri', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "4.8% top rate for 2024", "uses_federal_standard_deduction": true}'),
('MT', 'Montana', 2024, true, 'progressive', NULL, 5540, 11080, 8310, 3040, '{"notes": "Transitioning to 5.9% flat rate"}'),
('NE', 'Nebraska', 2024, true, 'progressive', NULL, 7900, 15800, 11600, 157, '{"notes": "4 brackets from 2.46% to 5.84%"}'),
('NJ', 'New Jersey', 2024, true, 'progressive', NULL, NULL, NULL, NULL, 1000, '{"notes": "7 brackets from 1.4% to 10.75%"}'),
('NM', 'New Mexico', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "4 brackets from 1.7% to 5.9%", "uses_federal_standard_deduction": true}'),
('NY', 'New York', 2024, true, 'progressive', NULL, 8000, 16050, 11200, NULL, '{"notes": "8 brackets from 4% to 10.9%"}'),
('ND', 'North Dakota', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "Transitioning to 1.5% flat rate by 2025"}'),
('OH', 'Ohio', 2024, true, 'progressive', NULL, NULL, NULL, NULL, 2400, '{"notes": "Reduced to 2 brackets: 2.75% and 3.5%"}'),
('OK', 'Oklahoma', 2024, true, 'progressive', NULL, 6350, 12700, 9350, 1000, '{"notes": "6 brackets from 0.25% to 4.75%"}'),
('OR', 'Oregon', 2024, true, 'progressive', NULL, 2605, 5210, 4195, 236, '{"notes": "4 brackets from 4.75% to 9.9%"}'),
('RI', 'Rhode Island', 2024, true, 'progressive', NULL, 10550, 21100, 15800, 4850, '{"notes": "3 brackets: 3.75%, 4.75%, 5.99%"}'),
('SC', 'South Carolina', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "Transitioning to 6% flat rate by 2027"}'),
('VT', 'Vermont', 2024, true, 'progressive', NULL, 7000, 15150, 11175, 4850, '{"notes": "4 brackets from 3.35% to 8.75%"}'),
('VA', 'Virginia', 2024, true, 'progressive', NULL, 4500, 9000, 4500, 930, '{"notes": "4 brackets from 2% to 5.75%"}'),
('WV', 'West Virginia', 2024, true, 'progressive', NULL, NULL, NULL, NULL, 2000, '{"notes": "4 brackets from 2.36% to 5.12%"}'),
('WI', 'Wisconsin', 2024, true, 'progressive', NULL, 13230, 24490, 16950, 700, '{"notes": "4 brackets from 3.54% to 7.65%"}'),
('DC', 'District of Columbia', 2024, true, 'progressive', NULL, 14600, 29200, 21900, NULL, '{"notes": "6 brackets from 4% to 10.75%"}')
ON CONFLICT (state_code, tax_year) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  has_income_tax = EXCLUDED.has_income_tax,
  tax_type = EXCLUDED.tax_type,
  flat_rate = EXCLUDED.flat_rate,
  standard_deduction_single = EXCLUDED.standard_deduction_single,
  standard_deduction_married = EXCLUDED.standard_deduction_married,
  standard_deduction_hoh = EXCLUDED.standard_deduction_hoh,
  personal_exemption = EXCLUDED.personal_exemption,
  special_rules = EXCLUDED.special_rules;

-- =====================================================
-- STATE TAX BRACKETS (Progressive States)
-- =====================================================

-- California Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('CA', 2024, 'single', 0, 10412, 0.01, 0),
('CA', 2024, 'single', 10412, 24684, 0.02, 104.12),
('CA', 2024, 'single', 24684, 38959, 0.04, 389.56),
('CA', 2024, 'single', 38959, 54081, 0.06, 960.56),
('CA', 2024, 'single', 54081, 68350, 0.08, 1867.88),
('CA', 2024, 'single', 68350, 349137, 0.093, 3009.40),
('CA', 2024, 'single', 349137, 418961, 0.103, 29122.59),
('CA', 2024, 'single', 418961, 698271, 0.113, 36314.46),
('CA', 2024, 'single', 698271, NULL, 0.123, 67876.51),
('CA', 2024, 'married_jointly', 0, 20824, 0.01, 0),
('CA', 2024, 'married_jointly', 20824, 49368, 0.02, 208.24),
('CA', 2024, 'married_jointly', 49368, 77918, 0.04, 779.12),
('CA', 2024, 'married_jointly', 77918, 108162, 0.06, 1921.12),
('CA', 2024, 'married_jointly', 108162, 136700, 0.08, 3735.76),
('CA', 2024, 'married_jointly', 136700, 698274, 0.093, 6018.80),
('CA', 2024, 'married_jointly', 698274, 837922, 0.103, 58245.18),
('CA', 2024, 'married_jointly', 837922, 1396542, 0.113, 72628.92),
('CA', 2024, 'married_jointly', 1396542, NULL, 0.123, 135753.02)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- New York Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('NY', 2024, 'single', 0, 8500, 0.04, 0),
('NY', 2024, 'single', 8500, 11700, 0.045, 340),
('NY', 2024, 'single', 11700, 13900, 0.0525, 484),
('NY', 2024, 'single', 13900, 80650, 0.055, 599.50),
('NY', 2024, 'single', 80650, 215400, 0.06, 4270.75),
('NY', 2024, 'single', 215400, 1077550, 0.0685, 12355.75),
('NY', 2024, 'single', 1077550, 5000000, 0.0965, 71413.03),
('NY', 2024, 'single', 5000000, 25000000, 0.103, 449929.28),
('NY', 2024, 'single', 25000000, NULL, 0.109, 2509929.28),
('NY', 2024, 'married_jointly', 0, 17150, 0.04, 0),
('NY', 2024, 'married_jointly', 17150, 23600, 0.045, 686),
('NY', 2024, 'married_jointly', 23600, 27900, 0.0525, 976.25),
('NY', 2024, 'married_jointly', 27900, 161550, 0.055, 1202),
('NY', 2024, 'married_jointly', 161550, 323200, 0.06, 8552.75),
('NY', 2024, 'married_jointly', 323200, 2155350, 0.0685, 18251.75),
('NY', 2024, 'married_jointly', 2155350, 5000000, 0.0965, 143754.03),
('NY', 2024, 'married_jointly', 5000000, 25000000, 0.103, 418202.80),
('NY', 2024, 'married_jointly', 25000000, NULL, 0.109, 2478202.80)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- New Jersey Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('NJ', 2024, 'single', 0, 20000, 0.014, 0),
('NJ', 2024, 'single', 20000, 35000, 0.0175, 280),
('NJ', 2024, 'single', 35000, 40000, 0.035, 542.50),
('NJ', 2024, 'single', 40000, 75000, 0.05525, 717.50),
('NJ', 2024, 'single', 75000, 500000, 0.0637, 2651.25),
('NJ', 2024, 'single', 500000, 1000000, 0.0897, 29723.75),
('NJ', 2024, 'single', 1000000, NULL, 0.1075, 74573.75),
('NJ', 2024, 'married_jointly', 0, 20000, 0.014, 0),
('NJ', 2024, 'married_jointly', 20000, 50000, 0.0175, 280),
('NJ', 2024, 'married_jointly', 50000, 70000, 0.0245, 805),
('NJ', 2024, 'married_jointly', 70000, 80000, 0.035, 1295),
('NJ', 2024, 'married_jointly', 80000, 150000, 0.05525, 1645),
('NJ', 2024, 'married_jointly', 150000, 500000, 0.0637, 5512.50),
('NJ', 2024, 'married_jointly', 500000, 1000000, 0.0897, 27807.50),
('NJ', 2024, 'married_jointly', 1000000, NULL, 0.1075, 72657.50)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Georgia Tax Brackets (transitioning to flat, 2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('GA', 2024, 'single', 0, NULL, 0.0549, 0),
('GA', 2024, 'married_jointly', 0, NULL, 0.0549, 0)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Virginia Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('VA', 2024, 'single', 0, 3000, 0.02, 0),
('VA', 2024, 'single', 3000, 5000, 0.03, 60),
('VA', 2024, 'single', 5000, 17000, 0.05, 120),
('VA', 2024, 'single', 17000, NULL, 0.0575, 720),
('VA', 2024, 'married_jointly', 0, 3000, 0.02, 0),
('VA', 2024, 'married_jointly', 3000, 5000, 0.03, 60),
('VA', 2024, 'married_jointly', 5000, 17000, 0.05, 120),
('VA', 2024, 'married_jointly', 17000, NULL, 0.0575, 720)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Ohio Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('OH', 2024, 'single', 0, 26050, 0, 0),
('OH', 2024, 'single', 26050, 100000, 0.0275, 0),
('OH', 2024, 'single', 100000, NULL, 0.035, 2033.63),
('OH', 2024, 'married_jointly', 0, 26050, 0, 0),
('OH', 2024, 'married_jointly', 26050, 100000, 0.0275, 0),
('OH', 2024, 'married_jointly', 100000, NULL, 0.035, 2033.63)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Minnesota Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('MN', 2024, 'single', 0, 31690, 0.0535, 0),
('MN', 2024, 'single', 31690, 104090, 0.068, 1695.42),
('MN', 2024, 'single', 104090, 193240, 0.0785, 6618.62),
('MN', 2024, 'single', 193240, NULL, 0.0985, 13617.90),
('MN', 2024, 'married_jointly', 0, 46330, 0.0535, 0),
('MN', 2024, 'married_jointly', 46330, 184040, 0.068, 2478.66),
('MN', 2024, 'married_jointly', 184040, 321450, 0.0785, 11842.96),
('MN', 2024, 'married_jointly', 321450, NULL, 0.0985, 22629.63)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Wisconsin Tax Brackets (2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('WI', 2024, 'single', 0, 14320, 0.0354, 0),
('WI', 2024, 'single', 14320, 28640, 0.0465, 506.93),
('WI', 2024, 'single', 28640, 315310, 0.053, 1172.81),
('WI', 2024, 'single', 315310, NULL, 0.0765, 16366.32),
('WI', 2024, 'married_jointly', 0, 19090, 0.0354, 0),
('WI', 2024, 'married_jointly', 19090, 38190, 0.0465, 675.79),
('WI', 2024, 'married_jointly', 38190, 420420, 0.053, 1563.44),
('WI', 2024, 'married_jointly', 420420, NULL, 0.0765, 21821.63)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Arizona (now flat, 2024)
INSERT INTO lf_state_tax_brackets (state_code, tax_year, filing_status, min_income, max_income, rate, base_tax) VALUES
('AZ', 2024, 'single', 0, NULL, 0.025, 0),
('AZ', 2024, 'married_jointly', 0, NULL, 0.025, 0)
ON CONFLICT (state_code, tax_year, filing_status, min_income) DO UPDATE SET
  max_income = EXCLUDED.max_income, rate = EXCLUDED.rate, base_tax = EXCLUDED.base_tax;

-- Log the ingestion
INSERT INTO lf_data_ingestion_log (data_type, source, records_processed, records_created, status, completed_at, metadata)
VALUES ('state_tax_2024', 'manual_seed', 100, 100, 'completed', NOW(), '{"states": 51, "brackets": 49}');

