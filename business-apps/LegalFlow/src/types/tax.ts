// Tax-specific types

export type FilingStatus =
  | 'single'
  | 'married_joint'
  | 'married_separate'
  | 'head_of_household'
  | 'qualifying_widow';

export type TaxReturnStatus =
  | 'draft'
  | 'in_progress'
  | 'completed'
  | 'filed'
  | 'accepted'
  | 'rejected';

export type DocumentType =
  | 'w2'
  | '1099_int'
  | '1099_div'
  | '1099_misc'
  | '1099_nec'
  | '1099_g'
  | '1099_r'
  | '1099_ssa'
  | '1098'
  | '1098_e'
  | '1098_t'
  | 'receipt'
  | 'other';

export interface W2Data {
  employerEin: string;
  employerName: string;
  employerAddress: Address;
  wages: number;
  federalWithheld: number;
  socialSecurityWages: number;
  socialSecurityWithheld: number;
  medicareWages: number;
  medicareWithheld: number;
  stateWages?: number;
  stateWithheld?: number;
  localWages?: number;
  localWithheld?: number;
}

export interface Form1099Data {
  payerName: string;
  payerTin: string;
  amount: number;
  federalWithheld?: number;
  stateWithheld?: number;
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface TaxpayerInfo {
  firstName: string;
  lastName: string;
  middleInitial?: string;
  ssn: string;
  dateOfBirth: string;
  occupation?: string;
  address: Address;
  phone?: string;
  email?: string;
}

export interface SpouseInfo extends TaxpayerInfo {
  // Same as TaxpayerInfo
}

export interface DependentInfo {
  firstName: string;
  lastName: string;
  ssn: string;
  relationship: string;
  dateOfBirth: string;
  monthsLivedWithYou: number;
  isQualifyingChild: boolean;
  isQualifyingRelative: boolean;
  childTaxCreditEligible: boolean;
  earnedIncomeCredit: boolean;
}

export interface IncomeData {
  wages: number;
  taxableInterest: number;
  taxExemptInterest: number;
  ordinaryDividends: number;
  qualifiedDividends: number;
  irsRefund?: number;
  alimonyReceived?: number;
  businessIncome?: number;
  capitalGains?: number;
  otherGains?: number;
  iraDistributions?: number;
  pensionAnnuities?: number;
  rentalIncome?: number;
  farmIncome?: number;
  unemploymentCompensation?: number;
  socialSecurityBenefits?: number;
  otherIncome?: number;
}

export interface DeductionData {
  standardDeduction: number;
  itemizedDeductions?: ItemizedDeductions;
  useStandardDeduction: boolean;
}

export interface ItemizedDeductions {
  medicalExpenses: number;
  stateLocalTaxes: number;
  realEstateTaxes: number;
  personalPropertyTaxes: number;
  mortgageInterest: number;
  mortgageInsurance: number;
  charitableCash: number;
  charitableNonCash: number;
  casualtyLosses: number;
  otherItemized: number;
}

export interface CreditData {
  childTaxCredit: number;
  earnedIncomeCredit: number;
  educationCredits: number;
  foreignTaxCredit: number;
  childCareCredit: number;
  retirementSavingsCredit: number;
  energyCredits: number;
  otherCredits: number;
}

export interface TaxCalculation {
  totalIncome: number;
  adjustments: number;
  adjustedGrossIncome: number;
  deductions: number;
  taxableIncome: number;
  taxBeforeCredits: number;
  credits: number;
  totalTax: number;
  withholdings: number;
  estimatedPayments: number;
  refundOrOwed: number;
  isRefund: boolean;
}

export interface TaxInterviewQuestion {
  id: string;
  section: string;
  questionText: string;
  helpText?: string;
  inputType: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date' | 'address';
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
  };
}

export interface TaxInterviewAnswer {
  questionId: string;
  value: unknown;
  timestamp: string;
}

export interface TaxInterviewState {
  currentSection: string;
  currentQuestionIndex: number;
  answers: Record<string, TaxInterviewAnswer>;
  completedSections: string[];
  aiSuggestions: AISuggestion[];
}

export interface AISuggestion {
  type: 'deduction' | 'credit' | 'warning' | 'tip';
  title: string;
  description: string;
  estimatedValue?: number;
  actionRequired?: boolean;
  relatedQuestions?: string[];
}

export interface RefundEstimate {
  federalRefund: number;
  stateRefunds: Record<string, number>;
  totalRefund: number;
  confidence: 'low' | 'medium' | 'high';
  missingInfo: string[];
  lastCalculated: string;
}

// Federal tax brackets for 2024
export const FEDERAL_TAX_BRACKETS_2024 = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  qualifying_widow: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
} as const;

// Standard deductions for 2024
export const STANDARD_DEDUCTIONS_2024 = {
  single: 14600,
  married_joint: 29200,
  married_separate: 14600,
  head_of_household: 21900,
  qualifying_widow: 29200,
} as const;

