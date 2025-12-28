// Legal document types

export type DocumentCategory = 'business' | 'estate' | 'trademark' | 'contract';

export type DocumentStatus = 'draft' | 'in_progress' | 'completed' | 'signed' | 'filed';

export type BusinessEntityType = 'llc' | 'corporation' | 's_corp' | 'partnership' | 'sole_proprietorship' | 'dba';

export type EstateDocumentType = 'will' | 'living_will' | 'revocable_trust' | 'irrevocable_trust' | 'power_of_attorney_financial' | 'power_of_attorney_healthcare';

export type ContractType = 'nda' | 'employment' | 'independent_contractor' | 'lease' | 'service_agreement' | 'partnership' | 'operating_agreement' | 'buy_sell' | 'custom';

// Template schema for form fields
export interface TemplateField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'address' | 'person';
  required: boolean;
  helpText?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  conditionalOn?: {
    field: string;
    value: unknown;
  };
}

export interface TemplateSection {
  id: string;
  title: string;
  description?: string;
  fields: TemplateField[];
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category: DocumentCategory;
  description: string;
  sections: TemplateSection[];
  aiPromptTemplate: string;
  stateSpecific: boolean;
  applicableStates?: string[];
  premiumOnly: boolean;
  basePrice: number;
}

// Business formation types
export interface BusinessFormationData {
  entityType: BusinessEntityType;
  businessName: string;
  businessPurpose: string;
  state: string;
  registeredAgent: {
    name: string;
    address: Address;
  };
  members?: MemberInfo[];
  managers?: ManagerInfo[];
  initialCapital?: number;
  fiscalYearEnd?: string;
  einApplication?: boolean;
}

export interface MemberInfo {
  name: string;
  address: Address;
  ownershipPercentage: number;
  capitalContribution: number;
  votingRights: boolean;
}

export interface ManagerInfo {
  name: string;
  title: string;
  address: Address;
  responsibilities: string[];
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

// Estate planning types
export interface WillData {
  testator: PersonInfo;
  executor: PersonInfo;
  alternateExecutor?: PersonInfo;
  beneficiaries: BeneficiaryInfo[];
  specificBequests: SpecificBequest[];
  residuaryBeneficiary: string;
  guardianForMinors?: PersonInfo;
  alternateGuardian?: PersonInfo;
  petGuardian?: PersonInfo;
  specialInstructions?: string;
  disinheritances?: string[];
  noContestClause: boolean;
}

export interface PersonInfo {
  firstName: string;
  lastName: string;
  middleName?: string;
  relationship?: string;
  address: Address;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
}

export interface BeneficiaryInfo extends PersonInfo {
  sharePercentage: number;
  contingentBeneficiary?: PersonInfo;
  perStirpes: boolean;
}

export interface SpecificBequest {
  item: string;
  description: string;
  beneficiary: string;
  alternateDisposition?: string;
}

export interface TrustData {
  trustName: string;
  trustType: 'revocable' | 'irrevocable';
  grantor: PersonInfo;
  trustees: PersonInfo[];
  successorTrustees: PersonInfo[];
  beneficiaries: TrustBeneficiaryInfo[];
  assets: TrustAsset[];
  distributionSchedule: DistributionRule[];
  spendthriftProvision: boolean;
  revocationRights?: string;
}

export interface TrustBeneficiaryInfo extends BeneficiaryInfo {
  trustTerms?: string;
  ageRestrictions?: number[];
}

export interface TrustAsset {
  type: 'real_estate' | 'bank_account' | 'investment' | 'life_insurance' | 'personal_property' | 'other';
  description: string;
  estimatedValue: number;
  ownership: string;
}

export interface DistributionRule {
  type: 'income' | 'principal' | 'discretionary';
  frequency: 'monthly' | 'quarterly' | 'annually' | 'at_discretion';
  amount?: number;
  percentage?: number;
  conditions?: string;
}

export interface PowerOfAttorneyData {
  type: 'financial' | 'healthcare';
  principal: PersonInfo;
  agents: PersonInfo[];
  powers: string[];
  limitations?: string[];
  effectiveDate: 'immediate' | 'upon_incapacity';
  durability: 'durable' | 'non_durable';
  healthcareDirectives?: HealthcareDirective[];
}

export interface HealthcareDirective {
  directive: string;
  preference: 'yes' | 'no' | 'agent_decides';
  additionalInstructions?: string;
}

// Trademark types
export interface TrademarkSearchResult {
  serialNumber: string;
  registrationNumber?: string;
  markLiteral: string;
  owner: string;
  status: string;
  filingDate: string;
  registrationDate?: string;
  goodsServices: string;
  similarityScore: number;
}

export interface TrademarkApplicationData {
  mark: string;
  markType: 'standard_character' | 'design' | 'sound' | 'other';
  owner: PersonInfo | BusinessInfo;
  goodsServices: GoodsServicesClass[];
  basisForFiling: 'use_in_commerce' | 'intent_to_use' | 'foreign_registration';
  firstUseDate?: string;
  firstUseInCommerceDate?: string;
  specimen?: string;
}

export interface BusinessInfo {
  name: string;
  entityType: BusinessEntityType;
  stateOfIncorporation: string;
  address: Address;
}

export interface GoodsServicesClass {
  classNumber: number;
  description: string;
}

// Contract types
export interface ContractData {
  contractType: ContractType;
  parties: ContractParty[];
  effectiveDate: string;
  termLength?: string;
  terminationClause?: string;
  governingLaw: string;
  disputeResolution: 'litigation' | 'arbitration' | 'mediation';
  confidentialityClause: boolean;
  nonCompeteClause?: NonCompeteClause;
  indemnificationClause: boolean;
  customClauses?: CustomClause[];
}

export interface ContractParty {
  role: string;
  name: string;
  type: 'individual' | 'business';
  address: Address;
  signatoryName?: string;
  signatoryTitle?: string;
}

export interface NonCompeteClause {
  duration: string;
  geographicScope: string;
  restrictedActivities: string[];
}

export interface CustomClause {
  title: string;
  content: string;
  position?: number;
}

// AI-generated content
export interface AIDocumentSuggestion {
  type: 'clause' | 'warning' | 'improvement' | 'missing';
  section: string;
  title: string;
  description: string;
  suggestedText?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DocumentReview {
  documentId: string;
  overallScore: number;
  completeness: number;
  legalSoundness: number;
  suggestions: AIDocumentSuggestion[];
  warnings: string[];
  reviewedAt: string;
}

