/**
 * Trademark Types
 *
 * Comprehensive type definitions for the trademark registration workflow
 * supporting both Federal USPTO and all 50 state registrations.
 */

import { Address, PersonInfo, BusinessInfo } from './legal';

// ==================== MARK TYPES ====================

export type MarkType =
  | 'word'           // Standard character mark (text only)
  | 'design'         // Design/logo mark
  | 'combined'       // Word + design combination
  | 'sound'          // Sound mark
  | 'motion'         // Motion mark
  | 'color'          // Color mark
  | 'scent'          // Scent mark (rare)
  | 'other';

export type FilingBasis =
  | 'use'            // Section 1(a) - Currently in use in commerce
  | 'intent_to_use'  // Section 1(b) - Intent to use
  | 'foreign_registration'  // Section 44(e) - Based on foreign registration
  | 'foreign_application';  // Section 44(d) - Based on foreign application

export type OwnerType = 'individual' | 'corporation' | 'llc' | 'partnership' | 'trust' | 'other';

export type JurisdictionType = 'federal' | 'state';

export type TEASApplicationType = 'plus' | 'standard';

export type StateFilingMethod = 'online' | 'mail' | 'both';

// ==================== APPLICATION STATUS ====================

export type TrademarkApplicationStatus =
  | 'draft'           // Initial creation, incomplete
  | 'searching'       // Trademark search in progress
  | 'search_complete' // Search done, awaiting review
  | 'ready'           // Ready for filing
  | 'filed'           // Submitted to USPTO/state
  | 'pending'         // Awaiting examination
  | 'office_action'   // Received office action
  | 'published'       // Published for opposition
  | 'opposition'      // In opposition proceeding
  | 'approved'        // Approved, awaiting registration
  | 'registered'      // Successfully registered
  | 'abandoned'       // Abandoned by applicant or USPTO
  | 'refused';        // Final refusal

// ==================== NICE CLASSIFICATION ====================

export interface NiceClass {
  classNumber: number;
  title: string;
  description: string;
  examples: string[];
  category: 'goods' | 'services';
}

export interface GoodsServicesEntry {
  id: string;
  classNumber: number;
  description: string;  // USPTO-acceptable description
  userDescription?: string;  // Original user input
  aiGenerated: boolean;
  firstUseDate?: string;
  firstCommerceDate?: string;
}

// ==================== TRADEMARK APPLICATION ====================

export interface TrademarkApplication {
  id: string;
  user_id: string;
  organization_id?: string;

  // Jurisdiction
  jurisdiction_type: JurisdictionType;
  jurisdiction_state?: string;  // State code for state trademarks

  // Mark Information
  mark_text?: string;
  mark_type: MarkType;
  mark_image_url?: string;
  mark_description?: string;  // Required for design marks
  mark_color_claim?: string;  // Color claim if applicable
  mark_translation?: string;  // Translation if mark contains foreign words
  mark_transliteration?: string;  // Transliteration if non-Latin characters

  // Owner Information
  owner_type: OwnerType;
  owner_name: string;
  owner_address: Address;
  owner_citizenship?: string;  // For individuals
  owner_state_of_organization?: string;  // For entities
  owner_entity_type?: string;

  // Goods/Services
  goods_services: GoodsServicesEntry[];

  // Filing Basis
  filing_basis: FilingBasis;
  first_use_date?: string;
  first_commerce_date?: string;
  foreign_registration_number?: string;
  foreign_registration_country?: string;
  foreign_registration_date?: string;
  foreign_application_number?: string;
  foreign_application_country?: string;
  foreign_application_date?: string;

  // Specimens
  specimens: SpecimenData[];

  // Declarations
  declarations: DeclarationData;

  // Filing Information
  serial_number?: string;
  registration_number?: string;
  filing_date?: string;
  registration_date?: string;

  // Status & Workflow
  status: TrademarkApplicationStatus;
  interview_data: TrademarkInterviewData;
  current_step: number;

  // AI & Analysis
  ai_suggestions?: TrademarkAISuggestions;
  search_report_id?: string;

  // TEAS specific (federal only)
  teas_application_type?: TEASApplicationType;

  // State specific
  state_filing_method?: StateFilingMethod;
  state_filing_portal_url?: string;

  // Deadlines
  deadlines: TrademarkDeadline[];

  // Metadata
  created_at: string;
  updated_at: string;
}

// ==================== SPECIMEN ====================

export interface SpecimenData {
  id: string;
  file_url: string;
  file_type: 'image' | 'audio' | 'video' | 'pdf' | 'webpage';
  description: string;
  class_number: number;
  ai_analysis?: SpecimenAnalysis;
  uploaded_at: string;
}

export interface SpecimenAnalysis {
  acceptable: boolean;
  issues: string[];
  suggestions: string[];
  confidence_score: number;
  specimen_type_detected: string;
}

// ==================== DECLARATIONS ====================

export interface DeclarationData {
  declaration_accuracy: boolean;
  declaration_use?: boolean;  // For use-based applications
  declaration_intent?: boolean;  // For ITU applications
  declaration_foreign?: boolean;  // For foreign-based applications
  signatory_name: string;
  signatory_title?: string;
  signatory_position?: 'owner' | 'officer' | 'attorney' | 'authorized_representative';
  signature_date?: string;
  electronic_signature?: string;
}

// ==================== INTERVIEW ====================

export interface TrademarkInterviewData {
  completed_steps: string[];
  answers: Record<string, any>;
  ai_clarifications: AIClarification[];
  started_at?: string;
  completed_at?: string;
}

export interface AIClarification {
  question_id: string;
  user_question: string;
  ai_response: string;
  asked_at: string;
}

export interface InterviewQuestion {
  id: string;
  step: number;
  category: 'mark_info' | 'owner_info' | 'goods_services' | 'filing_basis' | 'specimen' | 'declaration' | 'review';
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect' | 'file' | 'date' | 'checkbox' | 'address' | 'signature';
  required: boolean;
  helpText?: string;
  options?: { value: string; label: string }[];
  validation?: InterviewValidation;
  conditionalOn?: {
    field: string;
    value: string | string[] | boolean;
  };
  aiAssisted?: boolean;
  aiGenerated?: boolean;
}

export interface InterviewValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternError?: string;
  customValidator?: string;
}

// ==================== SEARCH ====================

export interface TrademarkSearchRequest {
  term: string;
  search_type: 'exact' | 'phonetic' | 'design_code' | 'combined';
  jurisdiction?: JurisdictionType;
  state?: string;
  class_filter?: number[];
  status_filter?: string[];
  owner_filter?: string;
  date_range?: {
    from?: string;
    to?: string;
  };
}

export interface TrademarkSearchResult {
  serial_number: string;
  registration_number?: string;
  mark_literal?: string;
  mark_drawing_code?: string;
  owner_name: string;
  owner_address?: string;
  status: string;
  status_date?: string;
  filing_date: string;
  registration_date?: string;
  goods_services: string;
  classes: number[];
  attorneys?: string;
  correspondent?: string;
  design_codes?: string[];
  similarity_score: number;  // 0-100
  similarity_type: 'exact' | 'phonetic' | 'visual' | 'conceptual';
  source: 'uspto' | 'trademarknow' | 'corsearch' | 'state';
}

export interface TrademarkSearchReport {
  id: string;
  user_id: string;
  trademark_application_id?: string;
  search_term: string;
  search_type: TrademarkSearchRequest['search_type'];
  jurisdiction_type: JurisdictionType;
  jurisdiction_state?: string;
  results: TrademarkSearchResult[];
  result_count: number;
  ai_analysis?: SearchAIAnalysis;
  risk_score: number;  // 0-100
  recommendations: string[];
  search_provider: 'uspto' | 'trademarknow' | 'corsearch';
  fallback_used: boolean;
  created_at: string;
}

export interface SearchAIAnalysis {
  overall_risk: 'low' | 'medium' | 'high';
  risk_score: number;
  proceed_recommendation: 'proceed' | 'caution' | 'avoid';
  conflicts: ConflictAnalysis[];
  summary: string;
  detailed_analysis: string;
}

export interface ConflictAnalysis {
  conflicting_mark: string;
  serial_number: string;
  owner: string;
  similarity_type: string;
  similarity_score: number;
  risk_level: 'low' | 'medium' | 'high';
  analysis: string;
  mitigation_suggestions: string[];
}

// ==================== AI SERVICES ====================

export interface TrademarkAISuggestions {
  mark_strength: MarkStrengthAnalysis;
  goods_descriptions: GoodsDescriptionSuggestion[];
  specimen_guidance?: string[];
  filing_recommendations: string[];
  potential_issues: string[];
  generated_at: string;
}

export interface MarkStrengthAnalysis {
  category: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
  score: number;  // 0-100
  analysis: string;
  recommendations: string[];
  similar_marks_warning?: string;
}

export interface GoodsDescriptionSuggestion {
  class_number: number;
  user_input: string;
  suggested_description: string;
  alternative_descriptions: string[];
  warnings: string[];
  id_manual_url?: string;  // Link to USPTO ID Manual
}

// ==================== DEADLINES ====================

export interface TrademarkDeadline {
  id: string;
  trademark_application_id: string;
  user_id: string;
  deadline_type: DeadlineType;
  description: string;
  due_date: string;
  reminder_days: number[];  // Days before due date to send reminders
  reminder_sent: boolean[];
  completed: boolean;
  completed_at?: string;
  created_at: string;
}

export type DeadlineType =
  | 'office_action_response'   // 6 months to respond
  | 'statement_of_use'         // 6 months + extensions
  | 'extension_request'        // Before SOU deadline
  | 'section_8_declaration'    // Between 5th and 6th year
  | 'section_9_renewal'        // Every 10 years
  | 'section_15_declaration'   // After 5 years continuous use
  | 'opposition_period'        // 30 days after publication
  | 'state_renewal'            // Varies by state
  | 'custom';

// ==================== STATE REQUIREMENTS ====================

export interface StateTrademarkRequirements {
  state_code: string;
  state_name: string;
  filing_method: StateFilingMethod;
  portal_url?: string;
  mailing_address?: Address;
  fee_per_class: number;
  additional_fees?: {
    type: string;
    amount: number;
  }[];
  renewal_period_years: number;
  renewal_fee: number;
  required_forms: string[];
  required_documents: string[];
  specimen_required: boolean;
  use_affidavit_required: boolean;
  use_affidavit_frequency_years?: number;
  assignment_recording_available: boolean;
  assignment_recording_fee?: number;
  notes?: string;
  last_updated: string;
}

// ==================== DOCUMENT TEMPLATES ====================

export interface TrademarkDocumentTemplate {
  id: string;
  name: string;
  template_type: TrademarkDocumentType;
  description: string;
  price: number;
  premium_only: boolean;
  ai_prompt_template: string;
  sections: TrademarkTemplateSection[];
  applicable_jurisdictions: JurisdictionType[];
  applicable_states?: string[];
}

export type TrademarkDocumentType =
  | 'teas_plus'
  | 'teas_standard'
  | 'statement_of_use'
  | 'extension_request'
  | 'section_8_declaration'
  | 'section_9_renewal'
  | 'section_15_declaration'
  | 'assignment_agreement'
  | 'license_agreement'
  | 'cease_desist'
  | 'office_action_response'
  | 'state_application';

export interface TrademarkTemplateSection {
  id: string;
  title: string;
  content_template: string;
  fields: string[];
  optional: boolean;
  conditional_on?: {
    field: string;
    value: any;
  };
}

// ==================== API RESPONSES ====================

export interface TrademarkSearchResponse {
  success: boolean;
  data: {
    report: TrademarkSearchReport;
    ai_analysis?: SearchAIAnalysis;
  };
  provider_used: string;
  fallback_used: boolean;
}

export interface TrademarkApplicationResponse {
  success: boolean;
  data: TrademarkApplication;
  message?: string;
}

export interface TrademarkDocumentResponse {
  success: boolean;
  data: {
    pdf_url?: string;
    pdf_base64?: string;
    document_type: TrademarkDocumentType;
    generated_at: string;
  };
  message?: string;
}

export interface NiceClassificationResponse {
  success: boolean;
  data: {
    classes: NiceClass[];
    total: number;
  };
}

export interface GoodsDescriptionResponse {
  success: boolean;
  data: GoodsDescriptionSuggestion;
}

export interface SpecimenAnalysisResponse {
  success: boolean;
  data: SpecimenAnalysis;
}

export interface StateRequirementsResponse {
  success: boolean;
  data: StateTrademarkRequirements | StateTrademarkRequirements[];
}

// ==================== SUBSCRIPTION LIMITS ====================

export interface TrademarkSubscriptionLimits {
  federal_searches_per_month: number;
  state_searches_per_month: number;
  ai_conflict_analysis: boolean;
  full_application_workflow: boolean;
  basic_ai_generation: boolean;
  advanced_ai_generation: boolean;
  specimen_analysis: boolean;
  office_action_help: boolean;
  deadline_tracking: boolean;
  multi_state_filing: boolean;
}

export const TRADEMARK_TIER_LIMITS: Record<string, TrademarkSubscriptionLimits> = {
  free: {
    federal_searches_per_month: 1,
    state_searches_per_month: 0,
    ai_conflict_analysis: false,
    full_application_workflow: false,  // Draft only
    basic_ai_generation: false,
    advanced_ai_generation: false,
    specimen_analysis: false,
    office_action_help: false,
    deadline_tracking: false,
    multi_state_filing: false
  },
  basic: {
    federal_searches_per_month: 10,
    state_searches_per_month: 5,
    ai_conflict_analysis: true,
    full_application_workflow: true,
    basic_ai_generation: true,
    advanced_ai_generation: false,
    specimen_analysis: false,
    office_action_help: false,
    deadline_tracking: true,
    multi_state_filing: false
  },
  premium: {
    federal_searches_per_month: -1,  // Unlimited
    state_searches_per_month: -1,    // Unlimited
    ai_conflict_analysis: true,
    full_application_workflow: true,
    basic_ai_generation: true,
    advanced_ai_generation: true,
    specimen_analysis: true,
    office_action_help: true,
    deadline_tracking: true,
    multi_state_filing: true
  }
};
