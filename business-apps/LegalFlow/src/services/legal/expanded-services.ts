/**
 * Expanded Legal Services
 *
 * Provides document preparation for divorce, power of attorney, healthcare directives,
 * tenant/landlord agreements, employment contracts, and real estate documents.
 *
 * @module services/legal/expanded-services
 */

import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

// ============================================================================
// TYPES
// ============================================================================

export type LegalServiceCategory =
  | 'family_law'
  | 'estate_planning'
  | 'real_estate'
  | 'employment'
  | 'business'
  | 'general';

export type DocumentStatus = 'draft' | 'review' | 'ready' | 'signed' | 'filed';

export interface LegalDocumentTemplate {
  id: string;
  category: LegalServiceCategory;
  name: string;
  description: string;
  requiredFields: TemplateField[];
  optionalFields?: TemplateField[];
  stateSpecific: boolean;
  supportedStates?: string[];
  filingRequired: boolean;
  filingFee?: number;
  disclaimers: string[];
  instructions: string[];
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'address' | 'boolean' | 'textarea' | 'signature';
  required: boolean;
  options?: string[];
  validation?: string;
  helpText?: string;
}

export interface LegalDocument {
  id: string;
  userId: string;
  templateId: string;
  category: LegalServiceCategory;
  documentType: string;
  title: string;
  status: DocumentStatus;
  data: Record<string, any>;
  state?: string;
  pdfUrl?: string;
  signatureRequired: boolean;
  signatures?: DocumentSignature[];
  filingInfo?: FilingInfo;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentSignature {
  signerId: string;
  signerName: string;
  signerRole: string;
  signedAt?: Date;
  signatureData?: string;
}

export interface FilingInfo {
  filingRequired: boolean;
  filingLocation?: string;
  filingFee?: number;
  filedAt?: Date;
  caseNumber?: string;
  status?: 'pending' | 'filed' | 'accepted' | 'rejected';
}

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

export const LEGAL_TEMPLATES: Record<string, LegalDocumentTemplate> = {
  // ========== FAMILY LAW ==========
  divorce_petition: {
    id: 'divorce_petition',
    category: 'family_law',
    name: 'Divorce Petition',
    description: 'Initial petition to start divorce proceedings',
    requiredFields: [
      { name: 'petitioner_name', label: 'Petitioner Full Legal Name', type: 'text', required: true },
      { name: 'petitioner_address', label: 'Petitioner Address', type: 'address', required: true },
      { name: 'respondent_name', label: 'Respondent Full Legal Name', type: 'text', required: true },
      { name: 'respondent_address', label: 'Respondent Address', type: 'address', required: true },
      { name: 'marriage_date', label: 'Date of Marriage', type: 'date', required: true },
      { name: 'marriage_location', label: 'Place of Marriage', type: 'text', required: true },
      { name: 'separation_date', label: 'Date of Separation', type: 'date', required: true },
      { name: 'grounds', label: 'Grounds for Divorce', type: 'select', required: true, options: ['Irreconcilable differences', 'Incompatibility', 'Living separate and apart', 'Other'] },
      { name: 'children', label: 'Minor Children', type: 'boolean', required: true },
      { name: 'property_division', label: 'Property to be Divided', type: 'select', required: true, options: ['Yes', 'No', 'Already divided'] },
    ],
    optionalFields: [
      { name: 'child_names', label: 'Names and Ages of Minor Children', type: 'textarea', required: false },
      { name: 'spousal_support', label: 'Requesting Spousal Support', type: 'boolean', required: false },
      { name: 'child_custody', label: 'Custody Arrangement Requested', type: 'select', required: false, options: ['Sole custody - Petitioner', 'Sole custody - Respondent', 'Joint custody', 'To be determined'] },
    ],
    stateSpecific: true,
    filingRequired: true,
    filingFee: 350,
    disclaimers: [
      'This service provides document preparation only, not legal representation.',
      'You are responsible for filing the documents with the appropriate court.',
      'Consult an attorney for complex divorce matters.',
    ],
    instructions: [
      'Complete all required information',
      'Review the petition carefully before signing',
      'File the original with the court clerk',
      'Serve a copy on your spouse according to state rules',
    ],
  },

  divorce_settlement: {
    id: 'divorce_settlement',
    category: 'family_law',
    name: 'Marital Settlement Agreement',
    description: 'Agreement dividing property, debts, and custody arrangements',
    requiredFields: [
      { name: 'petitioner_name', label: 'Spouse 1 Full Name', type: 'text', required: true },
      { name: 'respondent_name', label: 'Spouse 2 Full Name', type: 'text', required: true },
      { name: 'marriage_date', label: 'Date of Marriage', type: 'date', required: true },
      { name: 'separation_date', label: 'Date of Separation', type: 'date', required: true },
      { name: 'real_property', label: 'Real Property Division', type: 'textarea', required: true, helpText: 'List all real estate and how it will be divided' },
      { name: 'personal_property', label: 'Personal Property Division', type: 'textarea', required: true },
      { name: 'debts', label: 'Debt Division', type: 'textarea', required: true },
      { name: 'spousal_support', label: 'Spousal Support Terms', type: 'textarea', required: true },
    ],
    optionalFields: [
      { name: 'child_custody', label: 'Child Custody Arrangement', type: 'textarea', required: false },
      { name: 'child_support', label: 'Child Support Terms', type: 'textarea', required: false },
      { name: 'retirement_accounts', label: 'Retirement Account Division', type: 'textarea', required: false },
      { name: 'insurance', label: 'Insurance Provisions', type: 'textarea', required: false },
    ],
    stateSpecific: true,
    filingRequired: true,
    disclaimers: [
      'Both parties should review this agreement carefully.',
      'Consider consulting with separate attorneys.',
      'This becomes a binding legal document once signed and filed.',
    ],
    instructions: [
      'Both spouses must agree to all terms',
      'Sign in front of a notary public',
      'File with the divorce petition or as part of final judgment',
    ],
  },

  child_custody_agreement: {
    id: 'child_custody_agreement',
    category: 'family_law',
    name: 'Child Custody Agreement',
    description: 'Parenting plan for custody and visitation arrangements',
    requiredFields: [
      { name: 'parent1_name', label: 'Parent 1 Full Name', type: 'text', required: true },
      { name: 'parent1_address', label: 'Parent 1 Address', type: 'address', required: true },
      { name: 'parent2_name', label: 'Parent 2 Full Name', type: 'text', required: true },
      { name: 'parent2_address', label: 'Parent 2 Address', type: 'address', required: true },
      { name: 'children', label: 'Children Names and DOBs', type: 'textarea', required: true },
      { name: 'legal_custody', label: 'Legal Custody', type: 'select', required: true, options: ['Joint legal custody', 'Sole - Parent 1', 'Sole - Parent 2'] },
      { name: 'physical_custody', label: 'Physical Custody', type: 'select', required: true, options: ['Joint physical custody', 'Primary - Parent 1', 'Primary - Parent 2'] },
      { name: 'visitation_schedule', label: 'Regular Visitation Schedule', type: 'textarea', required: true },
      { name: 'holiday_schedule', label: 'Holiday Schedule', type: 'textarea', required: true },
    ],
    stateSpecific: true,
    filingRequired: true,
    disclaimers: [
      'Child custody orders are modifiable based on the best interests of the child.',
      'Both parents are encouraged to maintain open communication.',
    ],
    instructions: [
      'Create a detailed parenting schedule',
      'Include provisions for holidays and school breaks',
      'Both parents must sign',
      'File with the court for enforcement',
    ],
  },

  // ========== ESTATE PLANNING ==========
  power_of_attorney_financial: {
    id: 'power_of_attorney_financial',
    category: 'estate_planning',
    name: 'Financial Power of Attorney',
    description: 'Authorize someone to handle your financial affairs',
    requiredFields: [
      { name: 'principal_name', label: 'Principal Full Name', type: 'text', required: true },
      { name: 'principal_address', label: 'Principal Address', type: 'address', required: true },
      { name: 'principal_dob', label: 'Principal Date of Birth', type: 'date', required: true },
      { name: 'agent_name', label: 'Agent Full Name', type: 'text', required: true },
      { name: 'agent_address', label: 'Agent Address', type: 'address', required: true },
      { name: 'agent_relationship', label: 'Relationship to Principal', type: 'text', required: true },
      { name: 'poa_type', label: 'Type of Power of Attorney', type: 'select', required: true, options: ['Durable (continues if incapacitated)', 'Springing (effective upon incapacity)', 'Limited (specific purpose)', 'General'] },
      { name: 'effective_date', label: 'Effective Date', type: 'select', required: true, options: ['Immediately', 'Upon incapacity'] },
    ],
    optionalFields: [
      { name: 'powers_granted', label: 'Specific Powers Granted', type: 'textarea', required: false },
      { name: 'limitations', label: 'Limitations on Authority', type: 'textarea', required: false },
      { name: 'successor_agent', label: 'Successor Agent Name', type: 'text', required: false },
      { name: 'expiration_date', label: 'Expiration Date', type: 'date', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'This document grants significant authority over your finances.',
      'Choose your agent carefully.',
      'Some institutions may require their own POA forms.',
    ],
    instructions: [
      'Must be signed while mentally competent',
      'Most states require notarization',
      'Some states require witnesses',
      'Provide copies to your agent and financial institutions',
    ],
  },

  power_of_attorney_healthcare: {
    id: 'power_of_attorney_healthcare',
    category: 'estate_planning',
    name: 'Healthcare Power of Attorney',
    description: 'Authorize someone to make medical decisions if you cannot',
    requiredFields: [
      { name: 'principal_name', label: 'Principal Full Name', type: 'text', required: true },
      { name: 'principal_address', label: 'Principal Address', type: 'address', required: true },
      { name: 'principal_dob', label: 'Principal Date of Birth', type: 'date', required: true },
      { name: 'agent_name', label: 'Healthcare Agent Full Name', type: 'text', required: true },
      { name: 'agent_address', label: 'Agent Address', type: 'address', required: true },
      { name: 'agent_phone', label: 'Agent Phone Number', type: 'text', required: true },
      { name: 'agent_relationship', label: 'Relationship', type: 'text', required: true },
    ],
    optionalFields: [
      { name: 'successor_agent', label: 'Successor Agent', type: 'text', required: false },
      { name: 'treatment_preferences', label: 'Treatment Preferences', type: 'textarea', required: false },
      { name: 'organ_donation', label: 'Organ Donation Wishes', type: 'select', required: false, options: ['Yes, I wish to donate', 'No', 'Specific organs only'] },
      { name: 'religious_considerations', label: 'Religious Considerations', type: 'textarea', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'This document only becomes effective when you cannot make decisions.',
      'Your agent should understand your healthcare wishes.',
    ],
    instructions: [
      'Discuss your wishes with your agent',
      'Keep original in a safe but accessible place',
      'Give copies to your doctor and hospital',
      'Review and update periodically',
    ],
  },

  living_will: {
    id: 'living_will',
    category: 'estate_planning',
    name: 'Living Will / Advance Directive',
    description: 'Specify your wishes for end-of-life medical treatment',
    requiredFields: [
      { name: 'declarant_name', label: 'Your Full Name', type: 'text', required: true },
      { name: 'declarant_address', label: 'Your Address', type: 'address', required: true },
      { name: 'declarant_dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'terminal_condition', label: 'If Terminal Condition', type: 'select', required: true, options: ['Withhold life-sustaining treatment', 'Provide all treatment possible', 'Specific instructions'] },
      { name: 'permanent_unconscious', label: 'If Permanently Unconscious', type: 'select', required: true, options: ['Withhold life-sustaining treatment', 'Provide all treatment possible', 'Specific instructions'] },
      { name: 'artificial_nutrition', label: 'Artificial Nutrition/Hydration', type: 'select', required: true, options: ['Withhold', 'Provide', 'Agent to decide'] },
      { name: 'pain_management', label: 'Pain Management', type: 'select', required: true, options: ['Maximum comfort care even if hastens death', 'Only if not life-shortening', 'Other'] },
    ],
    optionalFields: [
      { name: 'other_instructions', label: 'Other Instructions', type: 'textarea', required: false },
      { name: 'religious_considerations', label: 'Religious/Spiritual Considerations', type: 'textarea', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'This document expresses your wishes for end-of-life care.',
      'It does not authorize euthanasia or assisted suicide.',
      'You can revoke this document at any time.',
    ],
    instructions: [
      'Sign while mentally competent',
      'Most states require witnesses and/or notarization',
      'Give copies to your doctor and family',
      'Keep original accessible',
    ],
  },

  simple_will: {
    id: 'simple_will',
    category: 'estate_planning',
    name: 'Simple Will',
    description: 'Basic last will and testament for straightforward estates',
    requiredFields: [
      { name: 'testator_name', label: 'Your Full Legal Name', type: 'text', required: true },
      { name: 'testator_address', label: 'Your Address', type: 'address', required: true },
      { name: 'testator_dob', label: 'Date of Birth', type: 'date', required: true },
      { name: 'executor_name', label: 'Executor Name', type: 'text', required: true },
      { name: 'executor_address', label: 'Executor Address', type: 'address', required: true },
      { name: 'residuary_beneficiary', label: 'Residuary Beneficiary', type: 'text', required: true, helpText: 'Who receives everything not specifically given away' },
      { name: 'residuary_relationship', label: 'Relationship to Beneficiary', type: 'text', required: true },
    ],
    optionalFields: [
      { name: 'specific_gifts', label: 'Specific Gifts', type: 'textarea', required: false, helpText: 'List specific items and who receives them' },
      { name: 'alternate_executor', label: 'Alternate Executor', type: 'text', required: false },
      { name: 'guardian_for_minors', label: 'Guardian for Minor Children', type: 'text', required: false },
      { name: 'pet_provisions', label: 'Pet Care Provisions', type: 'textarea', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'A simple will may not be appropriate for complex estates.',
      'Consider consulting an estate planning attorney.',
      'This will should be stored safely and your executor should know its location.',
    ],
    instructions: [
      'Must be signed in front of two witnesses',
      'Witnesses cannot be beneficiaries',
      'Consider having it notarized',
      'Store safely and tell your executor where it is',
    ],
  },

  // ========== REAL ESTATE ==========
  residential_lease: {
    id: 'residential_lease',
    category: 'real_estate',
    name: 'Residential Lease Agreement',
    description: 'Standard rental agreement for residential property',
    requiredFields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'landlord_address', label: 'Landlord Address', type: 'address', required: true },
      { name: 'tenant_name', label: 'Tenant Name(s)', type: 'text', required: true },
      { name: 'property_address', label: 'Rental Property Address', type: 'address', required: true },
      { name: 'lease_start', label: 'Lease Start Date', type: 'date', required: true },
      { name: 'lease_end', label: 'Lease End Date', type: 'date', required: true },
      { name: 'monthly_rent', label: 'Monthly Rent Amount', type: 'number', required: true },
      { name: 'due_date', label: 'Rent Due Day of Month', type: 'number', required: true },
      { name: 'security_deposit', label: 'Security Deposit Amount', type: 'number', required: true },
      { name: 'late_fee', label: 'Late Fee Amount', type: 'number', required: true },
    ],
    optionalFields: [
      { name: 'utilities_included', label: 'Utilities Included', type: 'textarea', required: false },
      { name: 'pets_allowed', label: 'Pets Allowed', type: 'boolean', required: false },
      { name: 'pet_deposit', label: 'Pet Deposit', type: 'number', required: false },
      { name: 'parking', label: 'Parking Provisions', type: 'textarea', required: false },
      { name: 'maintenance_responsibilities', label: 'Maintenance Responsibilities', type: 'textarea', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'State and local laws may require specific lease provisions.',
      'Security deposit limits vary by state.',
      'Both parties should keep signed copies.',
    ],
    instructions: [
      'Both landlord and tenant must sign',
      'Complete move-in inspection',
      'Document property condition with photos',
      'Keep signed copy for your records',
    ],
  },

  eviction_notice: {
    id: 'eviction_notice',
    category: 'real_estate',
    name: 'Eviction Notice',
    description: 'Notice to tenant to vacate or cure lease violation',
    requiredFields: [
      { name: 'landlord_name', label: 'Landlord Name', type: 'text', required: true },
      { name: 'tenant_name', label: 'Tenant Name', type: 'text', required: true },
      { name: 'property_address', label: 'Property Address', type: 'address', required: true },
      { name: 'notice_type', label: 'Type of Notice', type: 'select', required: true, options: ['Pay Rent or Quit', 'Cure or Quit', 'Unconditional Quit', '30-Day Notice', '60-Day Notice'] },
      { name: 'days_to_comply', label: 'Days to Comply', type: 'number', required: true },
      { name: 'reason', label: 'Reason for Eviction', type: 'textarea', required: true },
      { name: 'amount_owed', label: 'Amount Owed (if applicable)', type: 'number', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'Eviction procedures must follow state law exactly.',
      'Improper notice can invalidate eviction.',
      'Consider consulting an attorney.',
    ],
    instructions: [
      'Serve notice according to state requirements',
      'Keep proof of service',
      'Wait required time period before filing eviction',
    ],
  },

  // ========== EMPLOYMENT ==========
  employment_contract: {
    id: 'employment_contract',
    category: 'employment',
    name: 'Employment Agreement',
    description: 'Contract between employer and employee',
    requiredFields: [
      { name: 'employer_name', label: 'Employer/Company Name', type: 'text', required: true },
      { name: 'employer_address', label: 'Employer Address', type: 'address', required: true },
      { name: 'employee_name', label: 'Employee Name', type: 'text', required: true },
      { name: 'employee_address', label: 'Employee Address', type: 'address', required: true },
      { name: 'job_title', label: 'Job Title', type: 'text', required: true },
      { name: 'job_duties', label: 'Job Duties/Responsibilities', type: 'textarea', required: true },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'employment_type', label: 'Employment Type', type: 'select', required: true, options: ['Full-time', 'Part-time', 'Contract', 'Temporary'] },
      { name: 'compensation', label: 'Compensation (Salary/Hourly Rate)', type: 'text', required: true },
      { name: 'pay_frequency', label: 'Pay Frequency', type: 'select', required: true, options: ['Weekly', 'Bi-weekly', 'Semi-monthly', 'Monthly'] },
    ],
    optionalFields: [
      { name: 'benefits', label: 'Benefits', type: 'textarea', required: false },
      { name: 'vacation_days', label: 'Vacation Days', type: 'number', required: false },
      { name: 'sick_days', label: 'Sick Days', type: 'number', required: false },
      { name: 'probation_period', label: 'Probation Period', type: 'text', required: false },
      { name: 'termination_notice', label: 'Termination Notice Period', type: 'text', required: false },
      { name: 'non_compete', label: 'Non-Compete Clause', type: 'boolean', required: false },
      { name: 'confidentiality', label: 'Confidentiality Clause', type: 'boolean', required: false },
    ],
    stateSpecific: true,
    filingRequired: false,
    disclaimers: [
      'Employment terms must comply with federal and state labor laws.',
      'Minimum wage and overtime rules may apply.',
      'Non-compete clauses may not be enforceable in all states.',
    ],
    instructions: [
      'Both parties should sign',
      'Employee should receive a copy',
      'Keep on file for duration of employment',
    ],
  },

  independent_contractor: {
    id: 'independent_contractor',
    category: 'employment',
    name: 'Independent Contractor Agreement',
    description: 'Contract for freelance or contract work',
    requiredFields: [
      { name: 'client_name', label: 'Client/Company Name', type: 'text', required: true },
      { name: 'client_address', label: 'Client Address', type: 'address', required: true },
      { name: 'contractor_name', label: 'Contractor Name', type: 'text', required: true },
      { name: 'contractor_address', label: 'Contractor Address', type: 'address', required: true },
      { name: 'services', label: 'Services to be Performed', type: 'textarea', required: true },
      { name: 'compensation', label: 'Compensation Terms', type: 'textarea', required: true },
      { name: 'payment_terms', label: 'Payment Terms', type: 'select', required: true, options: ['Upon completion', 'Net 15', 'Net 30', 'Monthly', 'Milestone-based'] },
      { name: 'start_date', label: 'Start Date', type: 'date', required: true },
      { name: 'end_date', label: 'End Date', type: 'date', required: false },
    ],
    optionalFields: [
      { name: 'deliverables', label: 'Specific Deliverables', type: 'textarea', required: false },
      { name: 'expenses', label: 'Expense Reimbursement', type: 'textarea', required: false },
      { name: 'intellectual_property', label: 'Intellectual Property Rights', type: 'select', required: false, options: ['Work for hire - client owns', 'Contractor retains rights with license to client', 'Joint ownership'] },
      { name: 'termination', label: 'Termination Provisions', type: 'textarea', required: false },
    ],
    stateSpecific: false,
    filingRequired: false,
    disclaimers: [
      'Contractor is responsible for their own taxes.',
      'Misclassification of employees can result in penalties.',
      'Review IRS guidelines for contractor vs employee status.',
    ],
    instructions: [
      'Ensure contractor status is legitimate under IRS rules',
      'Both parties should sign',
      'Client should issue 1099 if payments exceed $600/year',
    ],
  },

  nda: {
    id: 'nda',
    category: 'business',
    name: 'Non-Disclosure Agreement (NDA)',
    description: 'Confidentiality agreement to protect sensitive information',
    requiredFields: [
      { name: 'disclosing_party', label: 'Disclosing Party Name', type: 'text', required: true },
      { name: 'disclosing_address', label: 'Disclosing Party Address', type: 'address', required: true },
      { name: 'receiving_party', label: 'Receiving Party Name', type: 'text', required: true },
      { name: 'receiving_address', label: 'Receiving Party Address', type: 'address', required: true },
      { name: 'nda_type', label: 'Agreement Type', type: 'select', required: true, options: ['One-way (Unilateral)', 'Mutual (Bilateral)'] },
      { name: 'confidential_info', label: 'Description of Confidential Information', type: 'textarea', required: true },
      { name: 'purpose', label: 'Purpose of Disclosure', type: 'textarea', required: true },
      { name: 'term', label: 'Confidentiality Period', type: 'select', required: true, options: ['1 year', '2 years', '3 years', '5 years', 'Indefinite'] },
    ],
    optionalFields: [
      { name: 'exclusions', label: 'Excluded Information', type: 'textarea', required: false },
      { name: 'return_of_materials', label: 'Return of Materials', type: 'boolean', required: false },
    ],
    stateSpecific: false,
    filingRequired: false,
    disclaimers: [
      'NDAs should be signed before disclosing confidential information.',
      'Terms should be reasonable and specific.',
    ],
    instructions: [
      'Sign before sharing confidential information',
      'Both parties should keep signed copies',
      'Mark confidential materials clearly',
    ],
  },
};

// ============================================================================
// EXPANDED LEGAL SERVICES
// ============================================================================

export class ExpandedLegalServices {
  /**
   * Get all available templates
   */
  getAllTemplates(): LegalDocumentTemplate[] {
    return Object.values(LEGAL_TEMPLATES);
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: LegalServiceCategory): LegalDocumentTemplate[] {
    return Object.values(LEGAL_TEMPLATES).filter((t) => t.category === category);
  }

  /**
   * Get a specific template
   */
  getTemplate(templateId: string): LegalDocumentTemplate | null {
    return LEGAL_TEMPLATES[templateId] || null;
  }

  /**
   * Get templates available for a specific state
   */
  getTemplatesForState(state: string): LegalDocumentTemplate[] {
    return Object.values(LEGAL_TEMPLATES).filter((t) => {
      if (!t.stateSpecific) return true;
      if (!t.supportedStates) return true; // Supported in all states
      return t.supportedStates.includes(state);
    });
  }

  /**
   * Create a new legal document
   */
  async createDocument(
    userId: string,
    templateId: string,
    data: Record<string, any>,
    state?: string
  ): Promise<LegalDocument> {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Validate required fields
    const missingFields = template.requiredFields
      .filter((f) => f.required && !data[f.name])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const document: LegalDocument = {
      id: `legal-${templateId}-${Date.now()}`,
      userId,
      templateId,
      category: template.category,
      documentType: templateId,
      title: `${template.name} - ${new Date().toLocaleDateString()}`,
      status: 'draft',
      data,
      state,
      signatureRequired: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save to database
    const { error } = await supabase.from('legal_documents').insert({
      id: document.id,
      user_id: document.userId,
      template_id: document.templateId,
      category: document.category,
      document_type: document.documentType,
      title: document.title,
      status: document.status,
      data: document.data,
      state: document.state,
      signature_required: document.signatureRequired,
      created_at: document.createdAt.toISOString(),
      updated_at: document.updatedAt.toISOString(),
    });

    if (error) {
      logger.error('Error creating legal document', { error });
      throw new Error('Failed to create document');
    }

    return document;
  }

  /**
   * Update a legal document
   */
  async updateDocument(
    documentId: string,
    userId: string,
    updates: Partial<Pick<LegalDocument, 'data' | 'status' | 'title'>>
  ): Promise<LegalDocument> {
    const { data: existing, error: fetchError } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      throw new Error('Document not found');
    }

    const { error: updateError } = await supabase
      .from('legal_documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error('Failed to update document');
    }

    return {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    } as LegalDocument;
  }

  /**
   * Generate PDF for a legal document
   */
  async generatePdf(documentId: string, userId: string): Promise<string> {
    const { data: doc, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !doc) {
      throw new Error('Document not found');
    }

    const template = this.getTemplate(doc.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    // In production, this would use a PDF generation library
    // like PDFKit, Puppeteer, or a third-party service
    logger.info('Generating PDF for legal document', { documentId });

    const pdfUrl = `/api/legal/documents/${documentId}/pdf`;

    // Update document with PDF URL
    await supabase
      .from('legal_documents')
      .update({
        pdf_url: pdfUrl,
        status: doc.status === 'draft' ? 'review' : doc.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId);

    return pdfUrl;
  }

  /**
   * Get user's documents
   */
  async getUserDocuments(
    userId: string,
    options?: { category?: LegalServiceCategory; status?: DocumentStatus }
  ): Promise<LegalDocument[]> {
    let query = supabase
      .from('legal_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.category) {
      query = query.eq('category', options.category);
    }

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch documents');
    }

    return (data || []).map(this.mapDocument);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string, userId: string): Promise<LegalDocument | null> {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    return this.mapDocument(data);
  }

  /**
   * Delete a draft document
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('legal_documents')
      .select('status')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      throw new Error('Document not found');
    }

    if (existing.status !== 'draft') {
      throw new Error('Only draft documents can be deleted');
    }

    await supabase.from('legal_documents').delete().eq('id', documentId);
  }

  /**
   * Get document categories
   */
  getCategories(): { category: LegalServiceCategory; name: string; description: string }[] {
    return [
      { category: 'family_law', name: 'Family Law', description: 'Divorce, custody, and family matters' },
      { category: 'estate_planning', name: 'Estate Planning', description: 'Wills, POA, and advance directives' },
      { category: 'real_estate', name: 'Real Estate', description: 'Leases, landlord-tenant documents' },
      { category: 'employment', name: 'Employment', description: 'Employment contracts and HR documents' },
      { category: 'business', name: 'Business', description: 'NDAs, contracts, and business agreements' },
      { category: 'general', name: 'General', description: 'Other legal documents' },
    ];
  }

  private mapDocument(row: any): LegalDocument {
    return {
      id: row.id,
      userId: row.user_id,
      templateId: row.template_id,
      category: row.category,
      documentType: row.document_type,
      title: row.title,
      status: row.status,
      data: row.data,
      state: row.state,
      pdfUrl: row.pdf_url,
      signatureRequired: row.signature_required,
      signatures: row.signatures,
      filingInfo: row.filing_info,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

// Export singleton
export const expandedLegalServices = new ExpandedLegalServices();
