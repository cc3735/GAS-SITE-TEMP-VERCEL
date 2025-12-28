// Legal filing automation types

export type FilingType =
  | 'divorce'
  | 'child_support_mod'
  | 'child_support_initial'
  | 'parenting_time'
  | 'custody'
  | 'name_change'
  | 'bankruptcy_prep'
  | 'parenting_plan'
  | 'enforcement'
  | 'fee_waiver';

export type FilingStatus =
  | 'draft'
  | 'interview_in_progress'
  | 'forms_generated'
  | 'ready_to_file'
  | 'filed'
  | 'accepted'
  | 'rejected'
  | 'hearing_scheduled'
  | 'completed'
  | 'cancelled';

export interface FilingInterviewQuestion {
  id: string;
  category: string;
  questionText: string;
  helpText?: string;
  legalContext?: string;
  inputType: 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select' | 'multiselect' | 'boolean' | 'address' | 'person';
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
  dependsOn?: {
    questionId: string;
    value: unknown;
    condition?: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  };
  aiFollowUp?: boolean;
}

export interface FilingInterviewState {
  filingId: string;
  currentCategory: string;
  currentQuestionIndex: number;
  answers: Record<string, FilingInterviewAnswer>;
  completedCategories: string[];
  aiClarifications: AIClarification[];
  estimatedCompletion: number;
}

export interface FilingInterviewAnswer {
  questionId: string;
  value: unknown;
  timestamp: string;
  aiValidated?: boolean;
  validationNotes?: string;
}

export interface AIClarification {
  questionId: string;
  clarificationText: string;
  userResponse?: string;
  resolved: boolean;
}

// Court form types
export interface CourtFormTemplate {
  id: string;
  formNumber: string;
  formName: string;
  state: string;
  county?: string;
  filingTypes: FilingType[];
  requiredFields: FormField[];
  optionalFields: FormField[];
  instructions: string;
  filingFee?: number;
  pdfTemplateUrl?: string;
}

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'currency' | 'checkbox' | 'signature' | 'calculated';
  pdfFieldName: string;
  maxLength?: number;
  calculation?: string;
  sourceQuestionId?: string;
}

export interface GeneratedForm {
  id: string;
  formTemplateId: string;
  formNumber: string;
  formName: string;
  filingSequence: number;
  required: boolean;
  fieldValues: Record<string, unknown>;
  pdfUrl?: string;
  generatedAt: string;
}

// Filing checklist types
export interface FilingChecklist {
  filingId: string;
  items: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  estimatedTimeRemaining: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'preparation' | 'documents' | 'filing' | 'post_filing';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  dependencies?: string[];
  resources?: ChecklistResource[];
}

export interface ChecklistResource {
  type: 'link' | 'document' | 'video' | 'article';
  title: string;
  url: string;
}

// Deadline tracking
export interface FilingDeadline {
  id: string;
  filingId: string;
  title: string;
  description: string;
  dueDate: string;
  type: 'statutory' | 'court_ordered' | 'self_imposed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  remindersSent: ReminderLog[];
  status: 'pending' | 'completed' | 'missed';
}

export interface ReminderLog {
  sentAt: string;
  method: 'email' | 'sms' | 'push';
  acknowledged: boolean;
}

// Jurisdiction rules
export interface JurisdictionRule {
  id: string;
  stateCode: string;
  county?: string;
  filingType: FilingType;
  ruleKey: string;
  ruleValue: unknown;
  description: string;
  sourceUrl?: string;
  lastUpdated: string;
}

export interface JurisdictionRules {
  state: string;
  county?: string;
  filingType: FilingType;
  rules: {
    filingFee: number;
    feeWaiverAvailable: boolean;
    feeWaiverThreshold?: number;
    waitingPeriod?: number;
    waitingPeriodUnit?: 'days' | 'months';
    requiresMediation: boolean;
    mediationCost?: number;
    parentingClassRequired: boolean;
    parentingClassHours?: number;
    residencyRequirement?: string;
    coolingOffPeriod?: number;
    serviceRequirements: string[];
    eFilingAvailable: boolean;
    eFilingSystem?: string;
    additionalRequirements: string[];
  };
}

// E-filing types
export interface EFilingSubmission {
  id: string;
  filingId: string;
  eFilingSystem: string;
  submittedAt: string;
  confirmationNumber?: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'processing';
  rejectionReason?: string;
  documents: EFiledDocument[];
  fees: EFilingFee[];
  totalFees: number;
}

export interface EFiledDocument {
  formId: string;
  formName: string;
  fileSize: number;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
}

export interface EFilingFee {
  type: 'filing' | 'service' | 'convenience';
  amount: number;
  description: string;
}

// Divorce-specific types
export interface DivorceFilingData {
  petitionerInfo: PersonInfo;
  respondentInfo: PersonInfo;
  marriageInfo: {
    marriageDate: string;
    marriageLocation: string;
    separationDate: string;
  };
  grounds: 'no_fault' | 'irreconcilable_differences' | 'incompatibility';
  children: ChildInfo[];
  propertyDivision: PropertyDivision;
  spousalSupport: SpousalSupportRequest;
  isUncontested: boolean;
  respondentServed: boolean;
  respondentAgreed: boolean;
}

export interface PersonInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  ssn?: string;
  address: Address;
  phone?: string;
  email?: string;
  employer?: string;
  occupation?: string;
  monthlyIncome?: number;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export interface ChildInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ssn?: string;
  residesWithParent: 'petitioner' | 'respondent' | 'both';
  specialNeeds?: boolean;
  specialNeedsDescription?: string;
}

export interface PropertyDivision {
  realProperty: Asset[];
  vehicles: Asset[];
  bankAccounts: Asset[];
  retirementAccounts: Asset[];
  debts: Debt[];
  proposedDivision: ProposedAssetDivision[];
}

export interface Asset {
  description: string;
  estimatedValue: number;
  ownershipType: 'joint' | 'petitioner' | 'respondent';
  accountNumber?: string;
}

export interface Debt {
  creditor: string;
  balance: number;
  monthlyPayment: number;
  responsibleParty: 'joint' | 'petitioner' | 'respondent';
}

export interface ProposedAssetDivision {
  assetDescription: string;
  awardedTo: 'petitioner' | 'respondent';
  offsetAmount?: number;
}

export interface SpousalSupportRequest {
  requested: boolean;
  requestedBy?: 'petitioner' | 'respondent';
  monthlyAmount?: number;
  duration?: string;
  justification?: string;
}

// Name change types
export interface NameChangeData {
  currentName: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  proposedName: {
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  reason: string;
  isMinor: boolean;
  minorInfo?: {
    parentOrGuardian: PersonInfo;
    otherParentConsent: boolean;
    otherParentInfo?: PersonInfo;
  };
  hasCriminalHistory: boolean;
  criminalHistoryDetails?: string;
  hasDebts: boolean;
  debtDetails?: string;
  publicationComplete: boolean;
  publicationNewspaper?: string;
  publicationDates?: string[];
}

