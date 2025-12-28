/**
 * Data Ingestion Types
 */

export interface IngestionResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: IngestionError[];
  duration: number;
}

export interface IngestionError {
  record: string;
  error: string;
  details?: unknown;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'irs' | 'state_revenue' | 'court' | 'sos' | 'manual';
  url?: string;
  jurisdiction?: string;
  category: 'tax' | 'child_support' | 'legal' | 'court';
}

// All 50 US States
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

export type StateCode = typeof US_STATES[number]['code'];

// Tax Types
export interface TaxBracket {
  taxYear: number;
  jurisdiction: string;
  filingStatus: string;
  bracketMin: number;
  bracketMax: number | null;
  rate: number;
  flatAmount?: number;
  sourceUrl?: string;
  effectiveDate?: string;
}

export interface TaxDeduction {
  taxYear: number;
  jurisdiction: string;
  deductionType: string;
  deductionName: string;
  filingStatus?: string;
  baseAmount: number;
  additionalAmount?: number;
  phaseOutStart?: number;
  phaseOutEnd?: number;
  phaseOutRate?: number;
  maxAmount?: number;
  eligibilityRules?: Record<string, unknown>;
  sourceUrl?: string;
}

export interface TaxCredit {
  taxYear: number;
  jurisdiction: string;
  creditName: string;
  creditType: 'refundable' | 'nonrefundable' | 'partially_refundable';
  maxAmount?: number;
  amountPerQualifier?: number;
  incomeLimitSingle?: number;
  incomeLimitJoint?: number;
  incomeLimitHoh?: number;
  phaseOutStartSingle?: number;
  phaseOutStartJoint?: number;
  phaseOutRate?: number;
  eligibilityRules?: Record<string, unknown>;
  calculationFormula?: string;
  sourceUrl?: string;
}

export interface StateTaxInfo {
  stateCode: string;
  stateName: string;
  taxYear: number;
  hasIncomeTax: boolean;
  taxType: 'graduated' | 'flat' | 'none';
  flatRate?: number;
  localTaxesApply: boolean;
  reciprocityStates?: string[];
  filingDeadline?: string;
  extensionDeadline?: string;
  minimumFilingRequirement?: number;
  residentDefinition?: string;
  partYearRules?: string;
  nonresidentRules?: string;
  efilingUrl?: string;
  formsUrl?: string;
  revenueDeptUrl?: string;
  revenueDeptPhone?: string;
  sourceUrl?: string;
}

// Child Support Types
export interface ChildSupportGuidelines {
  stateCode: string;
  stateName: string;
  version?: string;
  effectiveDate: string;
  model: 'income_shares' | 'percentage_of_income' | 'melson_formula';
  minimumIncome?: number;
  maximumIncome?: number;
  lowIncomeThreshold?: number;
  selfSupportReserve?: number;
  povertyLevelReference?: number;
  supportSchedule?: SupportScheduleEntry[];
  percentageRates?: PercentageRate[];
  parentingTimeThreshold?: number;
  parentingTimeFormula?: string;
  sharedCustodyFormula?: string;
  splitCustodyFormula?: string;
  healthInsuranceTreatment?: string;
  childCareTreatment?: string;
  extraordinaryExpensesTreatment?: string;
  educationExpensesTreatment?: string;
  recognizedDeviations?: string[];
  ageAdjustmentFactors?: Record<string, number>;
  emancipationAge?: number;
  collegeSupportAvailable?: boolean;
  multipleFamilyAdjustment?: string;
  imputedIncomeRules?: string;
  selfEmploymentRules?: string;
  guidelinesUrl?: string;
  calculatorUrl?: string;
  worksheetUrl?: string;
  statuteCitation?: string;
  sourceUrl?: string;
}

export interface SupportScheduleEntry {
  combinedIncomeMin: number;
  combinedIncomeMax: number;
  children1?: number;
  children2?: number;
  children3?: number;
  children4?: number;
  children5?: number;
  children6Plus?: number;
}

export interface PercentageRate {
  numberOfChildren: number;
  percentage: number;
}

// Business Formation Types
export interface BusinessFormationRequirements {
  stateCode: string;
  entityType: string;
  formationDocument: string;
  filingFee: number;
  expeditedFee?: number;
  expeditedProcessingDays?: number;
  standardProcessingDays?: number;
  namingRequirements?: Record<string, unknown>;
  nameReservationFee?: number;
  nameReservationDays?: number;
  registeredAgentRequired: boolean;
  registeredAgentRequirements?: string;
  annualReportRequired: boolean;
  annualReportFee?: number;
  annualReportDueDate?: string;
  franchiseTax?: number;
  franchiseTaxCalculation?: string;
  operatingAgreementRequired: boolean;
  publicationRequired: boolean;
  publicationRequirements?: string;
  publicationEstimatedCost?: number;
  onlineFilingAvailable: boolean;
  filingPortalUrl?: string;
  sosWebsite?: string;
  formsUrl?: string;
  instructionsUrl?: string;
  sourceUrl?: string;
}

// Jurisdiction Rules Types
export interface JurisdictionRule {
  stateCode: string;
  county?: string;
  courtType: string;
  filingType: string;
  residencyRequirement?: string;
  residencyDurationDays?: number;
  venueRules?: string;
  filingFee?: number;
  serviceFee?: number;
  motionFee?: number;
  feeWaiverAvailable: boolean;
  feeWaiverIncomeThreshold?: number;
  feeWaiverForm?: string;
  requiredForms?: string[];
  optionalForms?: string[];
  waitingPeriodDays?: number;
  mandatoryMediation: boolean;
  parentingClassRequired: boolean;
  coolingOffPeriodDays?: number;
  efilingAvailable: boolean;
  efilingRequired: boolean;
  efilingSystem?: string;
  efilingUrl?: string;
  responseDeadlineDays?: number;
  discoveryDeadlineDays?: number;
  serviceMethods?: string[];
  serviceRules?: string;
  courtWebsite?: string;
  selfHelpUrl?: string;
  formsUrl?: string;
  localRulesUrl?: string;
  instructions?: string;
  tips?: string;
  commonMistakes?: string;
  sourceUrl?: string;
}

