-- LegalFlow: Legal Document Templates Seed
-- Adds estate planning and business compliance templates
-- Run this in Supabase SQL Editor

INSERT INTO legal_templates (name, category, description, template_schema, ai_prompt_template, premium_only, base_price)
VALUES

-- ============================================================
-- ESTATE PLANNING
-- ============================================================
(
  'Revocable Living Trust',
  'estate_planning',
  'A revocable trust that allows you to transfer assets during your lifetime, avoid probate, and maintain control of assets while living. Fully customizable and amendable.',
  '{
    "fields": [
      {"id": "trustor_name", "label": "Trustor Full Legal Name", "type": "text", "required": true, "placeholder": "e.g. John Michael Smith"},
      {"id": "trustee_name", "label": "Initial Trustee Full Name", "type": "text", "required": true, "placeholder": "e.g. John Michael Smith (often yourself)"},
      {"id": "successor_trustee", "label": "Successor Trustee Full Name", "type": "text", "required": true, "placeholder": "Person who takes over if you cannot serve"},
      {"id": "beneficiaries", "label": "Primary Beneficiaries", "type": "textarea", "required": true, "placeholder": "Name and relationship of each primary beneficiary (one per line)"},
      {"id": "alternate_beneficiaries", "label": "Alternate Beneficiaries", "type": "textarea", "required": false, "placeholder": "If primary beneficiaries predecease you"},
      {"id": "trust_assets", "label": "Assets to Transfer into Trust", "type": "textarea", "required": true, "placeholder": "Describe real property, accounts, investments, etc."},
      {"id": "trust_state", "label": "State Governing This Trust", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "effective_date", "label": "Effective Date", "type": "date", "required": true},
      {"id": "special_provisions", "label": "Special Provisions or Instructions", "type": "textarea", "required": false, "placeholder": "Any special conditions, age requirements, etc."}
    ]
  }',
  'You are an expert estate planning attorney. Draft a complete Revocable Living Trust agreement using the following information. The document should be professional, legally precise, and include all standard trust provisions including: trust creation and name, trust property, trustee powers (comprehensive list), successor trustee provisions, beneficiary distributions, amendment and revocation clauses, and spendthrift provisions. Use formal legal language appropriate for an estate planning document.\n\nTrustor: {{trustor_name}}\nInitial Trustee: {{trustee_name}}\nSuccessor Trustee: {{successor_trustee}}\nPrimary Beneficiaries: {{beneficiaries}}\nAlternate Beneficiaries: {{alternate_beneficiaries}}\nTrust Assets: {{trust_assets}}\nGoverning State: {{trust_state}}\nEffective Date: {{effective_date}}\nSpecial Provisions: {{special_provisions}}\n\nInclude a signature block and notarization section at the end.',
  TRUE,
  299.00
),

(
  'Irrevocable Trust',
  'estate_planning',
  'A permanent trust that removes assets from your taxable estate. Used for Medicaid planning, asset protection, and tax minimization. Cannot be modified after execution.',
  '{
    "fields": [
      {"id": "grantor_name", "label": "Grantor Full Legal Name", "type": "text", "required": true},
      {"id": "trustee_name", "label": "Trustee Full Name", "type": "text", "required": true, "placeholder": "Must be someone other than the grantor"},
      {"id": "successor_trustee", "label": "Successor Trustee Full Name", "type": "text", "required": true},
      {"id": "trust_purpose", "label": "Primary Purpose of Trust", "type": "select", "required": true, "options": ["Asset Protection", "Medicaid Planning", "Estate Tax Reduction", "Special Needs", "Charitable Giving"]},
      {"id": "beneficiaries", "label": "Beneficiaries", "type": "textarea", "required": true, "placeholder": "Full name and relationship for each beneficiary"},
      {"id": "trust_assets", "label": "Assets Transferred to Trust", "type": "textarea", "required": true},
      {"id": "distribution_terms", "label": "Distribution Terms", "type": "textarea", "required": true, "placeholder": "When and how assets are distributed to beneficiaries"},
      {"id": "trust_state", "label": "Governing State", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "effective_date", "label": "Effective Date", "type": "date", "required": true}
    ]
  }',
  'You are an expert estate planning attorney. Draft a complete Irrevocable Trust agreement. This trust is permanent and cannot be revoked or materially altered by the grantor after execution. Include all standard provisions: trust creation, irrevocability clause, trustee powers and limitations, beneficiary provisions, distribution standards, spendthrift clause, and termination provisions. Use formal legal language.\n\nGrantor: {{grantor_name}}\nTrustee: {{trustee_name}}\nSuccessor Trustee: {{successor_trustee}}\nPurpose: {{trust_purpose}}\nBeneficiaries: {{beneficiaries}}\nTrust Assets: {{trust_assets}}\nDistribution Terms: {{distribution_terms}}\nGoverning State: {{trust_state}}\nEffective Date: {{effective_date}}\n\nInclude signature blocks and notarization section.',
  TRUE,
  349.00
),

(
  'Last Will and Testament',
  'estate_planning',
  'A legally binding document that specifies how your assets should be distributed after death, names guardians for minor children, and designates an executor for your estate.',
  '{
    "fields": [
      {"id": "testator_name", "label": "Your Full Legal Name (Testator)", "type": "text", "required": true},
      {"id": "testator_city", "label": "City of Residence", "type": "text", "required": true},
      {"id": "testator_state", "label": "State of Residence", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "executor_name", "label": "Executor Full Name", "type": "text", "required": true, "placeholder": "Person who carries out your will"},
      {"id": "alternate_executor", "label": "Alternate Executor Full Name", "type": "text", "required": false},
      {"id": "spouse_name", "label": "Spouse Full Name (if applicable)", "type": "text", "required": false},
      {"id": "children", "label": "Children (Name and Date of Birth)", "type": "textarea", "required": false, "placeholder": "One per line: e.g. Jane Smith, January 1, 2010"},
      {"id": "guardian_name", "label": "Guardian for Minor Children", "type": "text", "required": false},
      {"id": "primary_beneficiaries", "label": "Primary Beneficiaries and Share", "type": "textarea", "required": true, "placeholder": "e.g. Jane Smith (spouse) - 50%; John Smith (son) - 50%"},
      {"id": "specific_bequests", "label": "Specific Bequests", "type": "textarea", "required": false, "placeholder": "Specific items to specific people (e.g. gold watch to my son)"},
      {"id": "residuary_beneficiary", "label": "Residuary Estate Beneficiary", "type": "text", "required": true, "placeholder": "Who gets everything not specifically mentioned"},
      {"id": "funeral_wishes", "label": "Funeral/Burial Wishes", "type": "textarea", "required": false},
      {"id": "effective_date", "label": "Date of Signing", "type": "date", "required": true}
    ]
  }',
  'You are an expert estate planning attorney. Draft a complete Last Will and Testament. The will must include: declaration of testamentary capacity and revocation of prior wills, appointment of executor and alternate, payment of debts clause, specific bequests, residuary estate clause, guardian designation (if applicable), no-contest clause, and execution requirements. Use formal legal language appropriate for a will.\n\nTestator: {{testator_name}}\nCity/State: {{testator_city}}, {{testator_state}}\nExecutor: {{executor_name}}\nAlternate Executor: {{alternate_executor}}\nSpouse: {{spouse_name}}\nChildren: {{children}}\nGuardian: {{guardian_name}}\nPrimary Beneficiaries: {{primary_beneficiaries}}\nSpecific Bequests: {{specific_bequests}}\nResiduary Beneficiary: {{residuary_beneficiary}}\nFuneral Wishes: {{funeral_wishes}}\nDate: {{effective_date}}\n\nInclude signature block with two witness lines and notarization.',
  FALSE,
  149.00
),

(
  'Healthcare Directive / Living Will',
  'estate_planning',
  'Specifies your medical treatment preferences if you become incapacitated and designates a healthcare proxy to make decisions on your behalf.',
  '{
    "fields": [
      {"id": "principal_name", "label": "Your Full Legal Name", "type": "text", "required": true},
      {"id": "principal_address", "label": "Your Address", "type": "text", "required": true},
      {"id": "agent_name", "label": "Healthcare Agent (Proxy) Full Name", "type": "text", "required": true},
      {"id": "agent_relationship", "label": "Agent Relationship to You", "type": "text", "required": true, "placeholder": "e.g. spouse, daughter, friend"},
      {"id": "agent_phone", "label": "Agent Phone Number", "type": "text", "required": true},
      {"id": "alternate_agent", "label": "Alternate Agent Full Name", "type": "text", "required": false},
      {"id": "life_sustaining", "label": "Life-Sustaining Treatment Preference", "type": "select", "required": true, "options": ["Withhold if terminal and no reasonable recovery", "Continue all treatment as long as possible", "Discussed with agent — follow their judgment"]},
      {"id": "artificial_nutrition", "label": "Artificial Nutrition/Hydration", "type": "select", "required": true, "options": ["Withhold if terminal", "Provide at all times", "Follow agent judgment"]},
      {"id": "organ_donation", "label": "Organ/Tissue Donation", "type": "select", "required": true, "options": ["Yes — any needed organs", "Yes — specific organs only", "No"]},
      {"id": "organ_specifics", "label": "Specific Organs (if applicable)", "type": "text", "required": false},
      {"id": "additional_wishes", "label": "Additional Healthcare Wishes", "type": "textarea", "required": false},
      {"id": "governing_state", "label": "State", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "effective_date", "label": "Date of Signing", "type": "date", "required": true}
    ]
  }',
  'You are an expert estate planning attorney. Draft a complete Advance Healthcare Directive and Healthcare Power of Attorney. Include: declaration of intent, appointment of healthcare agent with full powers enumerated, alternate agent, specific instructions for life-sustaining treatment, artificial nutrition, organ donation, pain management preferences, HIPAA authorization for the agent, and revocation clause. Comply with the requirements of {{governing_state}} state law.\n\nPrincipal: {{principal_name}}\nAddress: {{principal_address}}\nHealthcare Agent: {{agent_name}} ({{agent_relationship}}, {{agent_phone}})\nAlternate Agent: {{alternate_agent}}\nLife-Sustaining Treatment: {{life_sustaining}}\nArtificial Nutrition: {{artificial_nutrition}}\nOrgan Donation: {{organ_donation}} {{organ_specifics}}\nAdditional Wishes: {{additional_wishes}}\nState: {{governing_state}}\nDate: {{effective_date}}\n\nInclude signature block with two witness lines and notarization.',
  FALSE,
  99.00
),

-- ============================================================
-- BUSINESS DOCUMENTS
-- ============================================================
(
  'Annual Meeting Minutes',
  'business',
  'Official record of an annual shareholder or member meeting, documenting attendance, officer elections, financial approvals, and other annual business matters.',
  '{
    "fields": [
      {"id": "company_name", "label": "Company Legal Name", "type": "text", "required": true},
      {"id": "company_state", "label": "State of Formation", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "entity_type", "label": "Entity Type", "type": "select", "required": true, "options": ["LLC", "Corporation (C-Corp)", "Corporation (S-Corp)", "Professional Corporation", "Nonprofit Corporation"]},
      {"id": "meeting_date", "label": "Meeting Date", "type": "date", "required": true},
      {"id": "meeting_time", "label": "Meeting Time", "type": "text", "required": true, "placeholder": "e.g. 10:00 AM EST"},
      {"id": "meeting_location", "label": "Meeting Location", "type": "text", "required": true, "placeholder": "Physical address or virtual platform"},
      {"id": "presiding_officer", "label": "Presiding Officer (Chairperson)", "type": "text", "required": true},
      {"id": "secretary_name", "label": "Secretary/Recorder", "type": "text", "required": true},
      {"id": "members_present", "label": "Members / Shareholders Present", "type": "textarea", "required": true, "placeholder": "One per line: Name, Title/Shares"},
      {"id": "quorum_met", "label": "Was Quorum Met?", "type": "select", "required": true, "options": ["Yes", "No"]},
      {"id": "officers_elected", "label": "Officers Elected or Confirmed", "type": "textarea", "required": false, "placeholder": "e.g. President: Jane Smith; CFO: John Doe"},
      {"id": "financial_report", "label": "Financial Report Summary", "type": "textarea", "required": false, "placeholder": "Summarize financial performance discussed"},
      {"id": "resolutions_adopted", "label": "Resolutions Adopted", "type": "textarea", "required": false, "placeholder": "List each resolution voted on and the outcome"},
      {"id": "old_business", "label": "Old Business Discussed", "type": "textarea", "required": false},
      {"id": "new_business", "label": "New Business Discussed", "type": "textarea", "required": false},
      {"id": "adjournment_time", "label": "Time of Adjournment", "type": "text", "required": false},
      {"id": "next_meeting_date", "label": "Next Meeting Date (if set)", "type": "date", "required": false}
    ]
  }',
  'You are a corporate attorney. Draft formal Annual Meeting Minutes for the following business. The minutes should include: heading with company name and meeting details, call to order, roll call and quorum confirmation, approval of previous minutes, reports (officer and financial), election of officers, old business, new business, resolutions with voting results, and adjournment. Use professional corporate document formatting.\n\nCompany: {{company_name}} ({{entity_type}}, {{company_state}})\nMeeting Date: {{meeting_date}} at {{meeting_time}}\nLocation: {{meeting_location}}\nPresiding Officer: {{presiding_officer}}\nSecretary: {{secretary_name}}\nMembers/Shareholders Present: {{members_present}}\nQuorum Met: {{quorum_met}}\nOfficers Elected/Confirmed: {{officers_elected}}\nFinancial Report: {{financial_report}}\nResolutions: {{resolutions_adopted}}\nOld Business: {{old_business}}\nNew Business: {{new_business}}\nAdjournment Time: {{adjournment_time}}\nNext Meeting: {{next_meeting_date}}\n\nEnd with signature lines for the Secretary and one witness.',
  FALSE,
  49.00
),

(
  'Special Meeting Minutes',
  'business',
  'Official minutes for a special (non-annual) meeting of members, shareholders, or directors called to address a specific matter such as a major transaction or amendment.',
  '{
    "fields": [
      {"id": "company_name", "label": "Company Legal Name", "type": "text", "required": true},
      {"id": "company_state", "label": "State of Formation", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "entity_type", "label": "Entity Type", "type": "select", "required": true, "options": ["LLC", "Corporation (C-Corp)", "Corporation (S-Corp)", "Nonprofit Corporation"]},
      {"id": "meeting_purpose", "label": "Purpose of Special Meeting", "type": "text", "required": true, "placeholder": "e.g. Approval of acquisition of ABC Corp"},
      {"id": "meeting_date", "label": "Meeting Date", "type": "date", "required": true},
      {"id": "meeting_time", "label": "Meeting Time", "type": "text", "required": true},
      {"id": "meeting_location", "label": "Location", "type": "text", "required": true},
      {"id": "presiding_officer", "label": "Presiding Officer", "type": "text", "required": true},
      {"id": "secretary_name", "label": "Secretary/Recorder", "type": "text", "required": true},
      {"id": "attendees", "label": "Attendees", "type": "textarea", "required": true, "placeholder": "Name and title/share percentage for each"},
      {"id": "quorum_met", "label": "Was Quorum Met?", "type": "select", "required": true, "options": ["Yes", "No"]},
      {"id": "matters_discussed", "label": "Matters Discussed and Actions Taken", "type": "textarea", "required": true},
      {"id": "resolutions_adopted", "label": "Resolutions Adopted", "type": "textarea", "required": true, "placeholder": "Each resolution, the vote count, and outcome"},
      {"id": "adjournment_time", "label": "Adjournment Time", "type": "text", "required": false}
    ]
  }',
  'You are a corporate attorney. Draft formal Special Meeting Minutes. Include: heading with company name and special meeting designation, notice of meeting purpose, call to order, attendance and quorum verification, discussion of the specific matter(s) for which the meeting was called, resolutions with voting details (for/against/abstain), and adjournment. Format professionally.\n\nCompany: {{company_name}} ({{entity_type}}, {{company_state}})\nPurpose: {{meeting_purpose}}\nDate/Time: {{meeting_date}} at {{meeting_time}}\nLocation: {{meeting_location}}\nPresiding: {{presiding_officer}}\nSecretary: {{secretary_name}}\nAttendees: {{attendees}}\nQuorum: {{quorum_met}}\nMatters Discussed: {{matters_discussed}}\nResolutions: {{resolutions_adopted}}\nAdjournment: {{adjournment_time}}\n\nEnd with signature lines for Secretary and Presiding Officer.',
  FALSE,
  49.00
),

(
  'Board Resolution',
  'business',
  'A formal written record of a decision or action authorized by the board of directors or managers. Used for banking authority, real estate transactions, contracts, and major business decisions.',
  '{
    "fields": [
      {"id": "company_name", "label": "Company Legal Name", "type": "text", "required": true},
      {"id": "company_state", "label": "State of Formation", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "entity_type", "label": "Entity Type", "type": "select", "required": true, "options": ["LLC", "Corporation", "Nonprofit Corporation"]},
      {"id": "resolution_type", "label": "Type of Resolution", "type": "select", "required": true, "options": ["Banking Authority", "Real Estate Transaction", "Contract Authorization", "Officer Appointment", "Equity Issuance", "Loan Authorization", "Amendment of Governing Documents", "Dissolution", "Custom"]},
      {"id": "resolution_date", "label": "Date of Resolution", "type": "date", "required": true},
      {"id": "directors_members", "label": "Directors / Managers Approving", "type": "textarea", "required": true, "placeholder": "Name and title of each approving director/manager"},
      {"id": "resolution_subject", "label": "Resolution Subject", "type": "text", "required": true, "placeholder": "Brief description (e.g. Authorization to Open Bank Account at Chase Bank)"},
      {"id": "resolution_details", "label": "Resolution Details", "type": "textarea", "required": true, "placeholder": "Full description of what is being authorized, including specific terms, amounts, parties, etc."},
      {"id": "authorized_officer", "label": "Authorized Officer(s) to Act", "type": "text", "required": false, "placeholder": "Name and title of person(s) authorized to implement the resolution"},
      {"id": "effective_date", "label": "Effective Date", "type": "date", "required": true},
      {"id": "expiration_date", "label": "Expiration Date (if applicable)", "type": "date", "required": false}
    ]
  }',
  'You are a corporate attorney. Draft a formal Board Resolution (or Manager Resolution for an LLC). The document must include: title, recitals (WHEREAS clauses explaining the background and need), resolved clauses (RESOLVED, that...) stating the exact authorization, certification that the resolution was duly adopted by the required vote, and officer certification language. Format as a standalone certified resolution suitable for presentation to banks, courts, or third parties.\n\nCompany: {{company_name}} ({{entity_type}}, {{company_state}})\nResolution Type: {{resolution_type}}\nDate: {{resolution_date}}\nApproving Directors/Managers: {{directors_members}}\nSubject: {{resolution_subject}}\nDetails: {{resolution_details}}\nAuthorized Officer: {{authorized_officer}}\nEffective Date: {{effective_date}}\nExpiration: {{expiration_date}}\n\nInclude a secretary/manager certification at the end with signature line.',
  FALSE,
  79.00
),

(
  'Consent in Lieu of Meeting',
  'business',
  'A unanimous written consent allowing members, shareholders, or directors to take formal corporate action without holding a physical meeting. Ideal for routine approvals.',
  '{
    "fields": [
      {"id": "company_name", "label": "Company Legal Name", "type": "text", "required": true},
      {"id": "company_state", "label": "State of Formation", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "entity_type", "label": "Entity Type", "type": "select", "required": true, "options": ["LLC (Members)", "LLC (Managers)", "Corporation (Shareholders)", "Corporation (Directors)"]},
      {"id": "consent_date", "label": "Date of Consent", "type": "date", "required": true},
      {"id": "action_description", "label": "Action Being Approved", "type": "textarea", "required": true, "placeholder": "Describe the specific action, transaction, or authorization being approved"},
      {"id": "resolved_clauses", "label": "RESOLVED Clauses", "type": "textarea", "required": true, "placeholder": "Each specific RESOLVED clause on its own line"},
      {"id": "signatories", "label": "All Signing Members/Shareholders/Directors", "type": "textarea", "required": true, "placeholder": "Full name and ownership % or title (one per line) — must be unanimous"}
    ]
  }',
  'You are a corporate attorney. Draft a Unanimous Written Consent in Lieu of Meeting. This document must: reference the authority under the company's operating agreement/bylaws and state law; state the action being approved; include formal RESOLVED clauses; state that this consent is in lieu of a meeting; and provide signature blocks for all members/shareholders/directors who must sign. The consent must be unanimous.\n\nCompany: {{company_name}} ({{entity_type}}, {{company_state}})\nDate: {{consent_date}}\nAction: {{action_description}}\nRESOLVED Clauses: {{resolved_clauses}}\nSignatories: {{signatories}}\n\nInclude separate signature lines for each signatory with name, title, date, and percentage interest.',
  FALSE,
  49.00
),

(
  'LLC Operating Agreement',
  'business',
  'The foundational governing document for an LLC that defines ownership percentages, management structure, voting rights, profit distributions, and member responsibilities.',
  '{
    "fields": [
      {"id": "company_name", "label": "LLC Legal Name (include LLC)", "type": "text", "required": true},
      {"id": "company_state", "label": "State of Formation", "type": "select", "required": true, "options": "US_STATES"},
      {"id": "formation_date", "label": "Date of Formation", "type": "date", "required": true},
      {"id": "principal_office", "label": "Principal Office Address", "type": "text", "required": true},
      {"id": "registered_agent", "label": "Registered Agent Name and Address", "type": "text", "required": true},
      {"id": "management_type", "label": "Management Structure", "type": "select", "required": true, "options": ["Member-Managed", "Manager-Managed"]},
      {"id": "managers", "label": "Manager(s) (if Manager-Managed)", "type": "textarea", "required": false, "placeholder": "Full name and address of each manager"},
      {"id": "members", "label": "Members, Ownership % and Capital Contributions", "type": "textarea", "required": true, "placeholder": "Name, address, ownership %, initial contribution (one per line)"},
      {"id": "profit_distribution", "label": "Profit Distribution Method", "type": "select", "required": true, "options": ["Pro Rata to Membership Interest", "As Determined by Managers", "Custom (describe below)"]},
      {"id": "distribution_custom", "label": "Custom Distribution Details", "type": "textarea", "required": false},
      {"id": "voting_rights", "label": "Voting Rights", "type": "select", "required": true, "options": ["Pro Rata to Membership Interest", "One Vote Per Member", "Custom (describe below)"]},
      {"id": "voting_custom", "label": "Custom Voting Details", "type": "textarea", "required": false},
      {"id": "transfer_restrictions", "label": "Transfer Restrictions", "type": "select", "required": true, "options": ["Unanimous consent required", "Majority consent required", "Right of first refusal", "Freely transferable"]},
      {"id": "dissolution_trigger", "label": "Events Triggering Dissolution", "type": "textarea", "required": false, "placeholder": "e.g. unanimous vote, death of sole member, etc."},
      {"id": "tax_election", "label": "Tax Classification", "type": "select", "required": true, "options": ["Disregarded Entity (single member)", "Partnership (multi-member default)", "S-Corporation election", "C-Corporation election"]},
      {"id": "fiscal_year_end", "label": "Fiscal Year End", "type": "select", "required": true, "options": ["December 31", "March 31", "June 30", "September 30", "Other"]},
      {"id": "special_provisions", "label": "Special Provisions", "type": "textarea", "required": false}
    ]
  }',
  'You are a business law attorney. Draft a comprehensive LLC Operating Agreement. Include all standard provisions: company formation and name, purpose, term, principal office, registered agent, membership interests and capital contributions, management (member-managed or manager-managed), meetings and voting, profit/loss allocation and distributions, accounting and records, transfer restrictions and right of first refusal, member withdrawal and buyout, dissolution and winding up, indemnification, dispute resolution, tax matters, and miscellaneous provisions (severability, entire agreement, governing law). The agreement should be thorough and protect all members.\n\nLLC Name: {{company_name}}\nState: {{company_state}}\nFormed: {{formation_date}}\nPrincipal Office: {{principal_office}}\nRegistered Agent: {{registered_agent}}\nManagement: {{management_type}}\nManagers: {{managers}}\nMembers: {{members}}\nProfit Distribution: {{profit_distribution}} {{distribution_custom}}\nVoting: {{voting_rights}} {{voting_custom}}\nTransfer Restrictions: {{transfer_restrictions}}\nDissolution: {{dissolution_trigger}}\nTax Election: {{tax_election}}\nFiscal Year End: {{fiscal_year_end}}\nSpecial Provisions: {{special_provisions}}\n\nEnd with signature blocks for all members and a notarization section.',
  TRUE,
  199.00
)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  template_schema = EXCLUDED.template_schema,
  ai_prompt_template = EXCLUDED.ai_prompt_template,
  premium_only = EXCLUDED.premium_only,
  base_price = EXCLUDED.base_price;
