-- Business Formation Requirements Seed - All 50 States
-- Run this after 002_data_ingestion_schema.sql
-- This migration is idempotent (safe to run multiple times)

-- =====================================================
-- FIX: Ensure lf_business_formation_requirements has all required columns
-- =====================================================
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS state_name VARCHAR(100);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS filing_fee DECIMAL(10,2);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS annual_report_fee DECIMAL(10,2);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS franchise_tax DECIMAL(10,2);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS formation_document VARCHAR(255);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS required_fields JSONB;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS registered_agent_required BOOLEAN DEFAULT TRUE;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS operating_agreement_required BOOLEAN DEFAULT FALSE;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS publication_required BOOLEAN DEFAULT FALSE;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS processing_time VARCHAR(50);
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS online_filing_available BOOLEAN DEFAULT TRUE;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS filing_url TEXT;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS special_requirements JSONB;
ALTER TABLE lf_business_formation_requirements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_business_formation' 
    AND conrelid = 'lf_business_formation_requirements'::regclass
  ) THEN
    DELETE FROM lf_business_formation_requirements a
    USING lf_business_formation_requirements b
    WHERE a.id > b.id AND a.state_code = b.state_code AND a.entity_type = b.entity_type;
    
    ALTER TABLE lf_business_formation_requirements ADD CONSTRAINT unique_business_formation UNIQUE (state_code, entity_type);
  END IF;
END $$;

-- =====================================================
-- LLC FORMATION REQUIREMENTS BY STATE
-- =====================================================

INSERT INTO lf_business_formation_requirements (
  state_code, state_name, entity_type, filing_fee, annual_report_fee, 
  franchise_tax, formation_document, required_fields, registered_agent_required,
  operating_agreement_required, publication_required, processing_time, 
  online_filing_available, filing_url, special_requirements
) VALUES
('AL', 'Alabama', 'LLC', 200, 50, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true, "purpose": false}', true, false, false, '7-10 business days', true, 'https://sos.alabama.gov/business-services', NULL),
('AK', 'Alaska', 'LLC', 250, 100, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "dissolution_date": false}', true, false, false, '10-15 business days', true, 'https://www.commerce.alaska.gov/web/cbpl/corporations', NULL),
('AZ', 'Arizona', 'LLC', 50, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "member_managed_or_manager_managed": true, "statutory_agent": true}', true, false, true, '1-2 business days', true, 'https://azsos.gov/business', '{"publication_requirement": "Publish in newspaper for 3 consecutive weeks within 60 days"}'),
('AR', 'Arkansas', 'LLC', 45, 150, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '1-2 business days', true, 'https://www.sos.arkansas.gov/business-commercial-services-bcs', NULL),
('CA', 'California', 'LLC', 70, 0, 800, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "management_structure": true}', true, true, false, '3-5 business days', true, 'https://bizfileonline.sos.ca.gov/', '{"franchise_tax": "Minimum $800 annually, due within 3 months of formation and annually by April 15", "statement_of_information": "Due within 90 days and biennially"}'),
('CO', 'Colorado', 'LLC', 50, 25, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "principal_office": true}', true, false, false, 'Same day', true, 'https://www.sos.state.co.us/biz/', NULL),
('CT', 'Connecticut', 'LLC', 120, 80, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "business_address": true}', true, false, false, '3-5 business days', true, 'https://portal.ct.gov/sots', NULL),
('DE', 'Delaware', 'LLC', 90, 300, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true}', true, false, false, 'Same day', true, 'https://corp.delaware.gov/', '{"notes": "Popular for business-friendly laws, Court of Chancery"}'),
('FL', 'Florida', 'LLC', 125, 138.75, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "principal_address": true, "mailing_address": true}', true, false, false, '2-3 business days', true, 'https://dos.myflorida.com/sunbiz/', NULL),
('GA', 'Georgia', 'LLC', 100, 50, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "principal_office": true}', true, false, true, '7-10 business days', true, 'https://sos.ga.gov/corporations-division', '{"publication_requirement": "Publish in county newspaper for 2 consecutive weeks"}'),
('HI', 'Hawaii', 'LLC', 50, 15, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://cca.hawaii.gov/breg/', NULL),
('ID', 'Idaho', 'LLC', 100, 0, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "mailing_address": true}', true, false, false, '3-5 business days', true, 'https://sos.idaho.gov/business/', NULL),
('IL', 'Illinois', 'LLC', 150, 75, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "purpose": false}', true, false, false, '5-10 business days', true, 'https://www.ilsos.gov/departments/business_services/', NULL),
('IN', 'Indiana', 'LLC', 95, 32, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://www.in.gov/sos/business/', NULL),
('IA', 'Iowa', 'LLC', 50, 60, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://sos.iowa.gov/business/', NULL),
('KS', 'Kansas', 'LLC', 160, 55, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://www.sos.ks.gov/business/', NULL),
('KY', 'Kentucky', 'LLC', 40, 15, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "principal_office": true}', true, false, false, '4-6 business days', true, 'https://www.sos.ky.gov/bus/', NULL),
('LA', 'Louisiana', 'LLC', 100, 35, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "purpose": true}', true, false, false, '5-7 business days', true, 'https://www.sos.la.gov/BusinessServices/', NULL),
('ME', 'Maine', 'LLC', 175, 85, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.maine.gov/sos/cec/corp/', NULL),
('MD', 'Maryland', 'LLC', 100, 300, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "purpose": true}', true, false, false, '7-10 business days', true, 'https://sdat.maryland.gov/', NULL),
('MA', 'Massachusetts', 'LLC', 500, 500, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "fiscal_year_end": true}', true, false, false, '5-10 business days', true, 'https://www.sec.state.ma.us/cor/', NULL),
('MI', 'Michigan', 'LLC', 50, 25, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "duration": false}', true, false, false, '3-5 business days', true, 'https://www.michigan.gov/lara/', NULL),
('MN', 'Minnesota', 'LLC', 155, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.sos.state.mn.us/business-liens/', NULL),
('MS', 'Mississippi', 'LLC', 50, 0, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.sos.ms.gov/business-services/', NULL),
('MO', 'Missouri', 'LLC', 50, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "purpose": false}', true, false, false, '3-5 business days', true, 'https://www.sos.mo.gov/business', NULL),
('MT', 'Montana', 'LLC', 70, 20, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://sosmt.gov/business/', NULL),
('NE', 'Nebraska', 'LLC', 105, 26, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, true, '3-5 business days', true, 'https://sos.nebraska.gov/business-services', '{"publication_requirement": "Not required but recommended"}'),
('NV', 'Nevada', 'LLC', 425, 350, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "managers_or_members": false}', true, false, false, '1-2 business days', true, 'https://www.nvsos.gov/sos/', '{"notes": "No state income tax, strong privacy protections, annual list required"}'),
('NH', 'New Hampshire', 'LLC', 100, 100, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.sos.nh.gov/corporation-division', NULL),
('NJ', 'New Jersey', 'LLC', 125, 75, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://www.state.nj.us/treasury/revenue/', NULL),
('NM', 'New Mexico', 'LLC', 50, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "duration": false}', true, false, false, '5-10 business days', true, 'https://www.sos.state.nm.us/business-services/', NULL),
('NY', 'New York', 'LLC', 200, 9, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "county_of_office": true}', true, true, true, '5-7 business days', true, 'https://www.dos.ny.gov/corps/', '{"publication_requirement": "Must publish in 2 newspapers for 6 consecutive weeks within 120 days", "publication_cost": "Varies by county, $50-$2000+"}'),
('NC', 'North Carolina', 'LLC', 125, 200, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "principal_office": true}', true, false, false, '3-5 business days', true, 'https://www.sosnc.gov/divisions/business_registration', NULL),
('ND', 'North Dakota', 'LLC', 135, 50, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://sos.nd.gov/business/', NULL),
('OH', 'Ohio', 'LLC', 99, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://www.sos.state.oh.us/businesses/', NULL),
('OK', 'Oklahoma', 'LLC', 100, 25, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "duration": false}', true, false, false, '5-7 business days', true, 'https://www.sos.ok.gov/business/', NULL),
('OR', 'Oregon', 'LLC', 100, 100, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "mailing_address": true}', true, false, false, '5-7 business days', true, 'https://sos.oregon.gov/business/', NULL),
('PA', 'Pennsylvania', 'LLC', 125, 70, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, true, '7-10 business days', true, 'https://www.dos.pa.gov/BusinessCharities/', '{"publication_requirement": "Publish in 2 newspapers in county of registered office"}'),
('RI', 'Rhode Island', 'LLC', 150, 50, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.sos.ri.gov/divisions/business-services', NULL),
('SC', 'South Carolina', 'LLC', 110, 0, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://sos.sc.gov/online-filings', NULL),
('SD', 'South Dakota', 'LLC', 150, 50, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://sdsos.gov/business-services/', NULL),
('TN', 'Tennessee', 'LLC', 300, 300, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true, "principal_address": true}', true, false, false, '3-5 business days', true, 'https://sos.tn.gov/business-services', NULL),
('TX', 'Texas', 'LLC', 300, 0, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true, "governing_authority": true, "purpose": true}', true, false, false, '3-5 business days', true, 'https://www.sos.texas.gov/corp/', '{"franchise_tax": "No tax for businesses under $2.47M revenue threshold"}'),
('UT', 'Utah', 'LLC', 54, 20, NULL, 'Certificate of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, 'Same day', true, 'https://corporations.utah.gov/', NULL),
('VT', 'Vermont', 'LLC', 125, 35, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://sos.vermont.gov/corporations/', NULL),
('VA', 'Virginia', 'LLC', 100, 50, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, 'Same day', true, 'https://www.scc.virginia.gov/clk/', NULL),
('WA', 'Washington', 'LLC', 180, 71, NULL, 'Certificate of Formation', '{"llc_name": true, "registered_agent": true, "organizer": true, "effective_date": false}', true, false, false, '3-5 business days', true, 'https://www.sos.wa.gov/corps/', NULL),
('WV', 'West Virginia', 'LLC', 100, 25, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://sos.wv.gov/business/', NULL),
('WI', 'Wisconsin', 'LLC', 130, 25, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '5-7 business days', true, 'https://www.wdfi.org/corporations/', NULL),
('WY', 'Wyoming', 'LLC', 100, 60, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, 'Same day', true, 'https://soswy.state.wy.us/business/', '{"notes": "No state income tax, strong asset protection, minimal reporting"}'),
('DC', 'District of Columbia', 'LLC', 220, 300, NULL, 'Articles of Organization', '{"llc_name": true, "registered_agent": true, "organizer": true}', true, false, false, '3-5 business days', true, 'https://dcra.dc.gov/service/register-business', NULL)
ON CONFLICT (state_code, entity_type) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  filing_fee = EXCLUDED.filing_fee,
  annual_report_fee = EXCLUDED.annual_report_fee,
  franchise_tax = EXCLUDED.franchise_tax,
  formation_document = EXCLUDED.formation_document,
  required_fields = EXCLUDED.required_fields,
  registered_agent_required = EXCLUDED.registered_agent_required,
  operating_agreement_required = EXCLUDED.operating_agreement_required,
  publication_required = EXCLUDED.publication_required,
  processing_time = EXCLUDED.processing_time,
  online_filing_available = EXCLUDED.online_filing_available,
  filing_url = EXCLUDED.filing_url,
  special_requirements = EXCLUDED.special_requirements,
  updated_at = NOW();

-- =====================================================
-- CORPORATION FORMATION REQUIREMENTS BY STATE
-- =====================================================

INSERT INTO lf_business_formation_requirements (
  state_code, state_name, entity_type, filing_fee, annual_report_fee, 
  franchise_tax, formation_document, required_fields, registered_agent_required,
  operating_agreement_required, publication_required, processing_time, 
  online_filing_available, filing_url, special_requirements
) VALUES
('AL', 'Alabama', 'Corporation', 200, 100, NULL, 'Certificate of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, false, '7-10 business days', true, 'https://sos.alabama.gov/business-services', NULL),
('AK', 'Alaska', 'Corporation', 250, 100, 100, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, false, '10-15 business days', true, 'https://www.commerce.alaska.gov/web/cbpl/corporations', NULL),
('AZ', 'Arizona', 'Corporation', 60, 45, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "directors": true}', true, false, true, '1-2 business days', true, 'https://azsos.gov/business', '{"publication_requirement": "Publish in newspaper for 3 consecutive weeks within 60 days"}'),
('CA', 'California', 'Corporation', 100, 25, 800, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "purpose": true}', true, false, false, '3-5 business days', true, 'https://bizfileonline.sos.ca.gov/', '{"franchise_tax": "Minimum $800 annually"}'),
('DE', 'Delaware', 'Corporation', 89, 225, NULL, 'Certificate of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, false, 'Same day', true, 'https://corp.delaware.gov/', '{"notes": "Most popular state for incorporation, business-friendly laws"}'),
('FL', 'Florida', 'Corporation', 78.75, 150, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "directors": true}', true, false, false, '2-3 business days', true, 'https://dos.myflorida.com/sunbiz/', NULL),
('GA', 'Georgia', 'Corporation', 100, 50, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, true, '7-10 business days', true, 'https://sos.ga.gov/corporations-division', NULL),
('IL', 'Illinois', 'Corporation', 150, 75, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, false, '5-10 business days', true, 'https://www.ilsos.gov/departments/business_services/', NULL),
('NV', 'Nevada', 'Corporation', 725, 650, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "directors": true}', true, false, false, '1-2 business days', true, 'https://www.nvsos.gov/sos/', '{"notes": "No state income tax, strong privacy, no franchise tax based on shares"}'),
('NY', 'New York', 'Corporation', 125, 9, NULL, 'Certificate of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "county_of_office": true}', true, false, true, '5-7 business days', true, 'https://www.dos.ny.gov/corps/', '{"publication_requirement": "Must publish in 2 newspapers for 6 consecutive weeks"}'),
('TX', 'Texas', 'Corporation', 300, 0, NULL, 'Certificate of Formation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true, "directors": true, "purpose": true}', true, false, false, '3-5 business days', true, 'https://www.sos.texas.gov/corp/', '{"franchise_tax": "Based on margin, threshold applies"}'),
('WY', 'Wyoming', 'Corporation', 100, 60, NULL, 'Articles of Incorporation', '{"corp_name": true, "registered_agent": true, "incorporator": true, "shares_authorized": true}', true, false, false, 'Same day', true, 'https://soswy.state.wy.us/business/', '{"notes": "No state income tax, strong privacy, low fees"}')
ON CONFLICT (state_code, entity_type) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  filing_fee = EXCLUDED.filing_fee,
  annual_report_fee = EXCLUDED.annual_report_fee,
  franchise_tax = EXCLUDED.franchise_tax,
  formation_document = EXCLUDED.formation_document,
  required_fields = EXCLUDED.required_fields,
  registered_agent_required = EXCLUDED.registered_agent_required,
  operating_agreement_required = EXCLUDED.operating_agreement_required,
  publication_required = EXCLUDED.publication_required,
  processing_time = EXCLUDED.processing_time,
  online_filing_available = EXCLUDED.online_filing_available,
  filing_url = EXCLUDED.filing_url,
  special_requirements = EXCLUDED.special_requirements,
  updated_at = NOW();

-- Log the ingestion
INSERT INTO lf_data_ingestion_log (data_type, source, records_processed, records_created, status, completed_at, metadata)
VALUES ('business_formation', 'manual_seed', 63, 63, 'completed', NOW(), '{"llc_states": 51, "corporation_states": 12}');

