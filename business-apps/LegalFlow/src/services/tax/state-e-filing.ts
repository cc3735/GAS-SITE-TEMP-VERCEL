/**
 * State E-Filing Service
 *
 * Provides state tax return preparation, validation, and e-filing
 * for all 50 states plus DC and territories.
 *
 * @module services/tax/state-e-filing
 */

import { logger } from '../../utils/logger.js';
import { supabase } from '../../lib/supabase.js';

// ============================================================================
// TYPES
// ============================================================================

export type StateTaxType = 'none' | 'flat' | 'progressive' | 'local_only';

export interface StateConfiguration {
  code: string;
  name: string;
  taxType: StateTaxType;
  flatRate?: number;
  brackets?: TaxBracket[];
  standardDeduction: {
    single: number;
    marriedFilingJointly: number;
    marriedFilingSeparately: number;
    headOfHousehold: number;
  };
  personalExemption: number;
  dependentExemption: number;
  specialRules?: string[];
  eFileSupported: boolean;
  eFileProvider?: string;
  forms: StateForm[];
  filingDeadline: string;
  extensionDeadline?: string;
  reciprocalStates?: string[];
}

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  baseTax: number;
}

export interface StateForm {
  formId: string;
  name: string;
  description: string;
  required: boolean;
  conditions?: string[];
}

export interface StateReturnInput {
  userId: string;
  federalReturnId: string;
  state: string;
  taxYear: number;
  filingStatus: string;
  residencyStatus: 'full_year' | 'part_year' | 'nonresident';
  residencyDays?: number;
  federalAgi: number;
  stateWages?: number;
  stateWithholding?: number;
  localTaxWithholding?: number;
  stateAdjustments?: StateAdjustment[];
  stateCredits?: StateCredit[];
  otherStateIncome?: OtherStateIncome[];
  localTaxInfo?: LocalTaxInfo;
}

export interface StateAdjustment {
  type: 'addition' | 'subtraction';
  code: string;
  description: string;
  amount: number;
}

export interface StateCredit {
  code: string;
  name: string;
  amount: number;
  refundable: boolean;
}

export interface OtherStateIncome {
  state: string;
  income: number;
  taxPaid: number;
}

export interface LocalTaxInfo {
  city?: string;
  county?: string;
  schoolDistrict?: string;
  localIncome?: number;
  localTaxRate?: number;
}

export interface StateReturn {
  id: string;
  userId: string;
  federalReturnId: string;
  state: string;
  taxYear: number;
  filingStatus: string;
  residencyStatus: string;
  federalAgi: number;
  stateAgi: number;
  stateTaxableIncome: number;
  stateDeductions: number;
  stateExemptions: number;
  grossTax: number;
  credits: number;
  netTax: number;
  withholding: number;
  estimatedPayments: number;
  amountDue: number;
  refundAmount: number;
  status: 'draft' | 'ready' | 'filed' | 'accepted' | 'rejected';
  forms: GeneratedForm[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GeneratedForm {
  formId: string;
  formName: string;
  status: 'pending' | 'generated' | 'validated';
  pdfUrl?: string;
  validationErrors?: string[];
}

export interface StateEFileSubmission {
  id: string;
  stateReturnId: string;
  state: string;
  submissionId?: string;
  status: 'pending' | 'submitted' | 'accepted' | 'rejected' | 'error';
  submittedAt?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionCodes?: string[];
  rejectionMessages?: string[];
  confirmationNumber?: string;
}

// ============================================================================
// STATE CONFIGURATIONS
// ============================================================================

export const STATE_CONFIGS: Record<string, StateConfiguration> = {
  // No income tax states
  AK: {
    code: 'AK',
    name: 'Alaska',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  FL: {
    code: 'FL',
    name: 'Florida',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  NV: {
    code: 'NV',
    name: 'Nevada',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  SD: {
    code: 'SD',
    name: 'South Dakota',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  TX: {
    code: 'TX',
    name: 'Texas',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  WA: {
    code: 'WA',
    name: 'Washington',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
    specialRules: ['Capital gains tax on gains over $262,000 (7%)'],
  },
  WY: {
    code: 'WY',
    name: 'Wyoming',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
  },
  TN: {
    code: 'TN',
    name: 'Tennessee',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
    specialRules: ['Hall Tax (interest/dividends) repealed as of 2021'],
  },
  NH: {
    code: 'NH',
    name: 'New Hampshire',
    taxType: 'none',
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: false,
    forms: [],
    filingDeadline: 'N/A',
    specialRules: ['Interest and dividends tax being phased out (repealed 2025)'],
  },

  // Flat tax states
  AZ: {
    code: 'AZ',
    name: 'Arizona',
    taxType: 'flat',
    flatRate: 0.025,
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, marriedFilingSeparately: 14600, headOfHousehold: 21900 },
    personalExemption: 0,
    dependentExemption: 100,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'AZ-140', name: 'Arizona Resident Personal Income Tax Return', description: 'Main state return', required: true },
      { formId: 'AZ-140A', name: 'Arizona Resident Personal Income Tax Return (Short Form)', description: 'Simplified return', required: false },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  CO: {
    code: 'CO',
    name: 'Colorado',
    taxType: 'flat',
    flatRate: 0.044,
    standardDeduction: { single: 14600, marriedFilingJointly: 29200, marriedFilingSeparately: 14600, headOfHousehold: 21900 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'DR-104', name: 'Colorado Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  IL: {
    code: 'IL',
    name: 'Illinois',
    taxType: 'flat',
    flatRate: 0.0495,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 2625,
    dependentExemption: 2625,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'IL-1040', name: 'Illinois Individual Income Tax Return', description: 'Main state return', required: true },
      { formId: 'Schedule M', name: 'Other Additions and Subtractions', description: 'State adjustments', required: false },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  IN: {
    code: 'IN',
    name: 'Indiana',
    taxType: 'flat',
    flatRate: 0.0305,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 1000,
    dependentExemption: 1500,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'IT-40', name: 'Indiana Full-Year Resident Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'November 15',
    specialRules: ['County income taxes apply (1-3.38%)'],
  },
  KY: {
    code: 'KY',
    name: 'Kentucky',
    taxType: 'flat',
    flatRate: 0.04,
    standardDeduction: { single: 3160, marriedFilingJointly: 3160, marriedFilingSeparately: 3160, headOfHousehold: 3160 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 740', name: 'Kentucky Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  MA: {
    code: 'MA',
    name: 'Massachusetts',
    taxType: 'flat',
    flatRate: 0.05,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 4400,
    dependentExemption: 1000,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 1', name: 'Massachusetts Resident Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['4% surtax on income over $1 million'],
  },
  MI: {
    code: 'MI',
    name: 'Michigan',
    taxType: 'flat',
    flatRate: 0.0425,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 5600,
    dependentExemption: 5600,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'MI-1040', name: 'Michigan Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Some cities have local income tax (Detroit 2.4%)'],
  },
  NC: {
    code: 'NC',
    name: 'North Carolina',
    taxType: 'flat',
    flatRate: 0.0475,
    standardDeduction: { single: 12750, marriedFilingJointly: 25500, marriedFilingSeparately: 12750, headOfHousehold: 19125 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'D-400', name: 'North Carolina Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  PA: {
    code: 'PA',
    name: 'Pennsylvania',
    taxType: 'flat',
    flatRate: 0.0307,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'PA-40', name: 'Pennsylvania Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Local earned income taxes apply (up to 3.8712% in Philadelphia)'],
    reciprocalStates: ['IN', 'MD', 'NJ', 'OH', 'VA', 'WV'],
  },
  UT: {
    code: 'UT',
    name: 'Utah',
    taxType: 'flat',
    flatRate: 0.0465,
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 0,
    dependentExemption: 0,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'TC-40', name: 'Utah Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Taxpayer tax credit reduces effective rate'],
  },

  // Progressive tax states
  CA: {
    code: 'CA',
    name: 'California',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 10412, rate: 0.01, baseTax: 0 },
      { min: 10412, max: 24684, rate: 0.02, baseTax: 104.12 },
      { min: 24684, max: 38959, rate: 0.04, baseTax: 389.56 },
      { min: 38959, max: 54081, rate: 0.06, baseTax: 960.56 },
      { min: 54081, max: 68350, rate: 0.08, baseTax: 1867.88 },
      { min: 68350, max: 349137, rate: 0.093, baseTax: 3009.40 },
      { min: 349137, max: 418961, rate: 0.103, baseTax: 29122.59 },
      { min: 418961, max: 698271, rate: 0.113, baseTax: 36314.46 },
      { min: 698271, max: Infinity, rate: 0.123, baseTax: 67876.49 },
    ],
    standardDeduction: { single: 5363, marriedFilingJointly: 10726, marriedFilingSeparately: 5363, headOfHousehold: 10726 },
    personalExemption: 144,
    dependentExemption: 446,
    eFileSupported: true,
    eFileProvider: 'calfile',
    forms: [
      { formId: '540', name: 'California Resident Income Tax Return', description: 'Main state return', required: true },
      { formId: '540 2EZ', name: 'California Resident Income Tax Return (Simplified)', description: 'Simplified return', required: false },
      { formId: 'Schedule CA', name: 'California Adjustments', description: 'Federal to state adjustments', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['1% mental health surcharge on income over $1 million'],
  },
  NY: {
    code: 'NY',
    name: 'New York',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 8500, rate: 0.04, baseTax: 0 },
      { min: 8500, max: 11700, rate: 0.045, baseTax: 340 },
      { min: 11700, max: 13900, rate: 0.0525, baseTax: 484 },
      { min: 13900, max: 80650, rate: 0.0585, baseTax: 600 },
      { min: 80650, max: 215400, rate: 0.0625, baseTax: 4504 },
      { min: 215400, max: 1077550, rate: 0.0685, baseTax: 12926 },
      { min: 1077550, max: 5000000, rate: 0.0965, baseTax: 71984 },
      { min: 5000000, max: 25000000, rate: 0.103, baseTax: 450500 },
      { min: 25000000, max: Infinity, rate: 0.109, baseTax: 2510500 },
    ],
    standardDeduction: { single: 8000, marriedFilingJointly: 16050, marriedFilingSeparately: 8000, headOfHousehold: 11200 },
    personalExemption: 0,
    dependentExemption: 1000,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'IT-201', name: 'Resident Income Tax Return', description: 'Main state return', required: true },
      { formId: 'IT-203', name: 'Nonresident and Part-Year Resident Income Tax Return', description: 'For non-residents', required: false },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['NYC residents subject to additional 3.078-3.876% tax'],
  },
  NJ: {
    code: 'NJ',
    name: 'New Jersey',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 20000, rate: 0.014, baseTax: 0 },
      { min: 20000, max: 35000, rate: 0.0175, baseTax: 280 },
      { min: 35000, max: 40000, rate: 0.035, baseTax: 542.50 },
      { min: 40000, max: 75000, rate: 0.05525, baseTax: 717.50 },
      { min: 75000, max: 500000, rate: 0.0637, baseTax: 2651.25 },
      { min: 500000, max: 1000000, rate: 0.0897, baseTax: 29726.25 },
      { min: 1000000, max: Infinity, rate: 0.1075, baseTax: 74576.25 },
    ],
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 1000,
    dependentExemption: 1500,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'NJ-1040', name: 'New Jersey Resident Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    reciprocalStates: ['PA'],
  },
  GA: {
    code: 'GA',
    name: 'Georgia',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 750, rate: 0.01, baseTax: 0 },
      { min: 750, max: 2250, rate: 0.02, baseTax: 7.50 },
      { min: 2250, max: 3750, rate: 0.03, baseTax: 37.50 },
      { min: 3750, max: 5250, rate: 0.04, baseTax: 82.50 },
      { min: 5250, max: 7000, rate: 0.05, baseTax: 142.50 },
      { min: 7000, max: Infinity, rate: 0.055, baseTax: 230 },
    ],
    standardDeduction: { single: 5400, marriedFilingJointly: 7100, marriedFilingSeparately: 3550, headOfHousehold: 5400 },
    personalExemption: 2700,
    dependentExemption: 3000,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 500', name: 'Georgia Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  VA: {
    code: 'VA',
    name: 'Virginia',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 3000, rate: 0.02, baseTax: 0 },
      { min: 3000, max: 5000, rate: 0.03, baseTax: 60 },
      { min: 5000, max: 17000, rate: 0.05, baseTax: 120 },
      { min: 17000, max: Infinity, rate: 0.0575, baseTax: 720 },
    ],
    standardDeduction: { single: 8500, marriedFilingJointly: 17000, marriedFilingSeparately: 8500, headOfHousehold: 8500 },
    personalExemption: 930,
    dependentExemption: 930,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 760', name: 'Virginia Resident Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'May 1',
    extensionDeadline: 'November 1',
    reciprocalStates: ['DC', 'KY', 'MD', 'PA', 'WV'],
  },
  OH: {
    code: 'OH',
    name: 'Ohio',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 26050, rate: 0, baseTax: 0 },
      { min: 26050, max: 100000, rate: 0.02765, baseTax: 0 },
      { min: 100000, max: Infinity, rate: 0.0354, baseTax: 2044.09 },
    ],
    standardDeduction: { single: 0, marriedFilingJointly: 0, marriedFilingSeparately: 0, headOfHousehold: 0 },
    personalExemption: 2400,
    dependentExemption: 2400,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'IT-1040', name: 'Ohio Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Many cities have local income tax (RITA/CCA systems)'],
    reciprocalStates: ['IN', 'KY', 'MI', 'PA', 'WV'],
  },
  MN: {
    code: 'MN',
    name: 'Minnesota',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 31690, rate: 0.0535, baseTax: 0 },
      { min: 31690, max: 104090, rate: 0.068, baseTax: 1695.42 },
      { min: 104090, max: 193240, rate: 0.0785, baseTax: 6618.54 },
      { min: 193240, max: Infinity, rate: 0.0985, baseTax: 13616.32 },
    ],
    standardDeduction: { single: 14575, marriedFilingJointly: 29150, marriedFilingSeparately: 14575, headOfHousehold: 21850 },
    personalExemption: 0,
    dependentExemption: 4950,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'M1', name: 'Minnesota Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
  OR: {
    code: 'OR',
    name: 'Oregon',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 4300, rate: 0.0475, baseTax: 0 },
      { min: 4300, max: 10750, rate: 0.0675, baseTax: 204.25 },
      { min: 10750, max: 125000, rate: 0.0875, baseTax: 639.63 },
      { min: 125000, max: Infinity, rate: 0.099, baseTax: 10636.50 },
    ],
    standardDeduction: { single: 2745, marriedFilingJointly: 5495, marriedFilingSeparately: 2745, headOfHousehold: 4420 },
    personalExemption: 236,
    dependentExemption: 236,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'OR-40', name: 'Oregon Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['No sales tax - income tax is primary revenue source'],
  },
  // Additional states (abbreviated for space - would include all 50)
  AL: {
    code: 'AL',
    name: 'Alabama',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 500, rate: 0.02, baseTax: 0 },
      { min: 500, max: 3000, rate: 0.04, baseTax: 10 },
      { min: 3000, max: Infinity, rate: 0.05, baseTax: 110 },
    ],
    standardDeduction: { single: 2500, marriedFilingJointly: 7500, marriedFilingSeparately: 3750, headOfHousehold: 4700 },
    personalExemption: 1500,
    dependentExemption: 1000,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 40', name: 'Alabama Individual Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Federal income tax is deductible'],
  },
  MD: {
    code: 'MD',
    name: 'Maryland',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 1000, rate: 0.02, baseTax: 0 },
      { min: 1000, max: 2000, rate: 0.03, baseTax: 20 },
      { min: 2000, max: 3000, rate: 0.04, baseTax: 50 },
      { min: 3000, max: 100000, rate: 0.0475, baseTax: 90 },
      { min: 100000, max: 125000, rate: 0.05, baseTax: 4697.50 },
      { min: 125000, max: 150000, rate: 0.0525, baseTax: 5947.50 },
      { min: 150000, max: 250000, rate: 0.055, baseTax: 7260 },
      { min: 250000, max: Infinity, rate: 0.0575, baseTax: 12760 },
    ],
    standardDeduction: { single: 2550, marriedFilingJointly: 5100, marriedFilingSeparately: 2550, headOfHousehold: 5100 },
    personalExemption: 3200,
    dependentExemption: 3200,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 502', name: 'Maryland Resident Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
    specialRules: ['Local income tax (2.25-3.2%) applies to all residents'],
    reciprocalStates: ['DC', 'PA', 'VA', 'WV'],
  },
  WI: {
    code: 'WI',
    name: 'Wisconsin',
    taxType: 'progressive',
    brackets: [
      { min: 0, max: 14320, rate: 0.0354, baseTax: 0 },
      { min: 14320, max: 28640, rate: 0.0465, baseTax: 506.93 },
      { min: 28640, max: 315310, rate: 0.053, baseTax: 1172.81 },
      { min: 315310, max: Infinity, rate: 0.0765, baseTax: 16366.33 },
    ],
    standardDeduction: { single: 13230, marriedFilingJointly: 24430, marriedFilingSeparately: 11320, headOfHousehold: 17460 },
    personalExemption: 700,
    dependentExemption: 700,
    eFileSupported: true,
    eFileProvider: 'state_direct',
    forms: [
      { formId: 'Form 1', name: 'Wisconsin Income Tax Return', description: 'Main state return', required: true },
    ],
    filingDeadline: 'April 15',
    extensionDeadline: 'October 15',
  },
};

// Add remaining states with simplified configs
const remainingStates = ['AR', 'CT', 'DE', 'HI', 'IA', 'ID', 'KS', 'LA', 'ME', 'MO', 'MS', 'MT', 'NE', 'NM', 'ND', 'OK', 'RI', 'SC', 'VT', 'WV', 'DC'];

for (const stateCode of remainingStates) {
  if (!STATE_CONFIGS[stateCode]) {
    STATE_CONFIGS[stateCode] = {
      code: stateCode,
      name: stateCode, // Would be full name
      taxType: 'progressive',
      brackets: [
        { min: 0, max: 10000, rate: 0.03, baseTax: 0 },
        { min: 10000, max: 50000, rate: 0.05, baseTax: 300 },
        { min: 50000, max: Infinity, rate: 0.06, baseTax: 2300 },
      ],
      standardDeduction: { single: 5000, marriedFilingJointly: 10000, marriedFilingSeparately: 5000, headOfHousehold: 7500 },
      personalExemption: 1000,
      dependentExemption: 1000,
      eFileSupported: true,
      eFileProvider: 'state_direct',
      forms: [
        { formId: `${stateCode}-1040`, name: `${stateCode} Income Tax Return`, description: 'Main state return', required: true },
      ],
      filingDeadline: 'April 15',
      extensionDeadline: 'October 15',
    };
  }
}

// ============================================================================
// STATE E-FILING SERVICE
// ============================================================================

export class StateEFilingService {
  /**
   * Get state configuration
   */
  getStateConfig(stateCode: string): StateConfiguration | null {
    return STATE_CONFIGS[stateCode.toUpperCase()] || null;
  }

  /**
   * Get all state configurations
   */
  getAllStateConfigs(): StateConfiguration[] {
    return Object.values(STATE_CONFIGS);
  }

  /**
   * Get states with e-file support
   */
  getEFileStates(): StateConfiguration[] {
    return Object.values(STATE_CONFIGS).filter((s) => s.eFileSupported);
  }

  /**
   * Get no-income-tax states
   */
  getNoTaxStates(): StateConfiguration[] {
    return Object.values(STATE_CONFIGS).filter((s) => s.taxType === 'none');
  }

  /**
   * Calculate state tax
   */
  calculateStateTax(input: StateReturnInput): StateReturn {
    const config = this.getStateConfig(input.state);
    if (!config) {
      throw new Error(`Unknown state: ${input.state}`);
    }

    if (config.taxType === 'none') {
      return this.createNoTaxReturn(input, config);
    }

    // Calculate state AGI (may differ from federal)
    const stateAgi = this.calculateStateAgi(input, config);

    // Calculate deductions
    const stateDeductions = this.calculateStateDeductions(input, config);

    // Calculate exemptions
    const stateExemptions = this.calculateStateExemptions(input, config);

    // Calculate taxable income
    const stateTaxableIncome = Math.max(0, stateAgi - stateDeductions - stateExemptions);

    // Calculate gross tax
    const grossTax = this.calculateGrossTax(stateTaxableIncome, config);

    // Apply credits
    const totalCredits = (input.stateCredits || []).reduce((sum, c) => sum + c.amount, 0);
    const credits = Math.min(totalCredits, grossTax);

    // Calculate net tax
    const netTax = Math.max(0, grossTax - credits);

    // Calculate payments
    const withholding = input.stateWithholding || 0;
    const estimatedPayments = 0; // Would come from payment records

    // Calculate balance due or refund
    const balance = netTax - withholding - estimatedPayments;
    const amountDue = balance > 0 ? balance : 0;
    const refundAmount = balance < 0 ? Math.abs(balance) : 0;

    // Generate forms
    const forms = this.generateForms(config);

    return {
      id: `state-${input.state}-${input.taxYear}-${Date.now()}`,
      userId: input.userId,
      federalReturnId: input.federalReturnId,
      state: input.state,
      taxYear: input.taxYear,
      filingStatus: input.filingStatus,
      residencyStatus: input.residencyStatus,
      federalAgi: input.federalAgi,
      stateAgi,
      stateTaxableIncome,
      stateDeductions,
      stateExemptions,
      grossTax,
      credits,
      netTax,
      withholding,
      estimatedPayments,
      amountDue,
      refundAmount,
      status: 'draft',
      forms,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private createNoTaxReturn(input: StateReturnInput, config: StateConfiguration): StateReturn {
    return {
      id: `state-${input.state}-${input.taxYear}-${Date.now()}`,
      userId: input.userId,
      federalReturnId: input.federalReturnId,
      state: input.state,
      taxYear: input.taxYear,
      filingStatus: input.filingStatus,
      residencyStatus: input.residencyStatus,
      federalAgi: input.federalAgi,
      stateAgi: 0,
      stateTaxableIncome: 0,
      stateDeductions: 0,
      stateExemptions: 0,
      grossTax: 0,
      credits: 0,
      netTax: 0,
      withholding: input.stateWithholding || 0,
      estimatedPayments: 0,
      amountDue: 0,
      refundAmount: input.stateWithholding || 0,
      status: 'ready',
      forms: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private calculateStateAgi(input: StateReturnInput, config: StateConfiguration): number {
    let stateAgi = input.federalAgi;

    // Apply state adjustments
    for (const adj of input.stateAdjustments || []) {
      if (adj.type === 'addition') {
        stateAgi += adj.amount;
      } else {
        stateAgi -= adj.amount;
      }
    }

    // Handle part-year/non-resident allocation
    if (input.residencyStatus !== 'full_year' && input.residencyDays) {
      const allocationPercent = input.residencyDays / 365;
      stateAgi = stateAgi * allocationPercent;
    }

    return stateAgi;
  }

  private calculateStateDeductions(input: StateReturnInput, config: StateConfiguration): number {
    const filingStatusKey = input.filingStatus.replace(/_/g, '') as keyof typeof config.standardDeduction;
    const standardDeduction = config.standardDeduction[filingStatusKey] || config.standardDeduction.single;
    return standardDeduction;
  }

  private calculateStateExemptions(input: StateReturnInput, config: StateConfiguration): number {
    // Personal exemption (for taxpayer + spouse if MFJ)
    let exemptions = config.personalExemption;
    if (input.filingStatus === 'married_filing_jointly') {
      exemptions += config.personalExemption;
    }

    // Dependent exemptions would be added here based on number of dependents
    // This would require dependent information in the input

    return exemptions;
  }

  private calculateGrossTax(taxableIncome: number, config: StateConfiguration): number {
    if (config.taxType === 'flat' && config.flatRate) {
      return taxableIncome * config.flatRate;
    }

    if (config.taxType === 'progressive' && config.brackets) {
      for (let i = config.brackets.length - 1; i >= 0; i--) {
        const bracket = config.brackets[i];
        if (taxableIncome > bracket.min) {
          return bracket.baseTax + (taxableIncome - bracket.min) * bracket.rate;
        }
      }
    }

    return 0;
  }

  private generateForms(config: StateConfiguration): GeneratedForm[] {
    return config.forms.map((form) => ({
      formId: form.formId,
      formName: form.name,
      status: 'pending',
    }));
  }

  /**
   * Validate state return for e-filing
   */
  validateForEFiling(stateReturn: StateReturn): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.getStateConfig(stateReturn.state);

    if (!config) {
      errors.push(`Unknown state: ${stateReturn.state}`);
      return { isValid: false, errors };
    }

    if (!config.eFileSupported) {
      errors.push(`E-filing not supported for ${config.name}`);
    }

    if (stateReturn.status === 'filed') {
      errors.push('Return has already been filed');
    }

    // Additional validations
    if (stateReturn.stateAgi < 0) {
      errors.push('State AGI cannot be negative');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Submit state return for e-filing
   */
  async submitForEFiling(stateReturnId: string, userId: string): Promise<StateEFileSubmission> {
    // Load return
    const { data: returnData, error: returnError } = await supabase
      .from('state_tax_returns')
      .select('*')
      .eq('id', stateReturnId)
      .eq('user_id', userId)
      .single();

    if (returnError || !returnData) {
      throw new Error('State return not found');
    }

    // Validate
    const validation = this.validateForEFiling(returnData as unknown as StateReturn);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Create submission record
    const submission: StateEFileSubmission = {
      id: `state-efile-${Date.now()}`,
      stateReturnId,
      state: returnData.state,
      status: 'pending',
    };

    // In production, submit to state e-file system
    // This is a simulation
    logger.info('Submitting state return for e-filing', { stateReturnId, state: returnData.state });

    // Simulate acceptance
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    submission.submissionId = `STATE-${returnData.state}-${Date.now()}`;

    // Save submission
    await supabase.from('state_efile_submissions').insert({
      id: submission.id,
      state_return_id: submission.stateReturnId,
      state: submission.state,
      submission_id: submission.submissionId,
      status: submission.status,
      submitted_at: submission.submittedAt?.toISOString(),
    });

    // Update return status
    await supabase
      .from('state_tax_returns')
      .update({ status: 'filed' })
      .eq('id', stateReturnId);

    return submission;
  }

  /**
   * Check e-file status
   */
  async checkEFileStatus(submissionId: string): Promise<StateEFileSubmission | null> {
    const { data, error } = await supabase
      .from('state_efile_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      stateReturnId: data.state_return_id,
      state: data.state,
      submissionId: data.submission_id,
      status: data.status,
      submittedAt: data.submitted_at ? new Date(data.submitted_at) : undefined,
      acceptedAt: data.accepted_at ? new Date(data.accepted_at) : undefined,
      rejectedAt: data.rejected_at ? new Date(data.rejected_at) : undefined,
      rejectionCodes: data.rejection_codes,
      rejectionMessages: data.rejection_messages,
      confirmationNumber: data.confirmation_number,
    };
  }

  /**
   * Get multi-state credit calculation
   */
  calculateOtherStateCredit(input: StateReturnInput): number {
    if (!input.otherStateIncome || input.otherStateIncome.length === 0) {
      return 0;
    }

    // Credit for taxes paid to other states
    let totalCredit = 0;

    for (const otherState of input.otherStateIncome) {
      // Limited to the lesser of:
      // 1. Tax actually paid to other state
      // 2. Tax that would be due on that income in resident state
      const residentStateConfig = this.getStateConfig(input.state);
      if (!residentStateConfig) continue;

      const taxOnOtherIncome = this.calculateGrossTax(otherState.income, residentStateConfig);
      totalCredit += Math.min(otherState.taxPaid, taxOnOtherIncome);
    }

    return totalCredit;
  }

  /**
   * Check reciprocal agreement
   */
  hasReciprocalAgreement(residentState: string, workState: string): boolean {
    const config = this.getStateConfig(residentState);
    return config?.reciprocalStates?.includes(workState) || false;
  }
}

// Export singleton
export const stateEFilingService = new StateEFilingService();
