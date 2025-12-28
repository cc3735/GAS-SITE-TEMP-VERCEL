// Child support calculator types

export type CalculationType = 'initial' | 'modification' | 'enforcement';

export interface ParentData {
  name?: string;
  grossMonthlyIncome: number;
  otherIncome: number;
  healthInsuranceCost: number;
  childCareCost: number;
  otherChildSupport: number;
  overnightsPerYear: number;
  deductions: Deduction[];
}

export interface Deduction {
  type: DeductionType;
  amount: number;
  description?: string;
}

export type DeductionType =
  | 'union_dues'
  | 'mandatory_retirement'
  | 'health_insurance_self'
  | 'prior_child_support'
  | 'prior_spousal_support'
  | 'self_employment_tax'
  | 'other_court_ordered';

export interface ChildData {
  name?: string;
  dateOfBirth: string;
  age?: number;
  specialNeeds: boolean;
  specialNeedsDescription?: string;
  healthInsuranceCoveredBy: 'parent1' | 'parent2' | 'both' | 'none';
  healthInsuranceCost?: number;
  childCareCost?: number;
  educationCost?: number;
  otherExpenses?: number;
}

export interface CalculationInput {
  stateCode: string;
  calculationType: CalculationType;
  parent1Data: ParentData;
  parent2Data: ParentData;
  childrenData: ChildData[];
  legalFilingId?: string;
}

export interface CalculationResult {
  id?: string;
  stateCode: string;
  guidelinesVersion: string;
  calculatedAt: string;
  
  // Income calculations
  parent1AdjustedIncome: number;
  parent2AdjustedIncome: number;
  combinedIncome: number;
  parent1IncomePercentage: number;
  parent2IncomePercentage: number;
  
  // Child-related calculations
  basicSupportObligation: number;
  healthInsuranceAddOn: number;
  childCareAddOn: number;
  otherAddOns: number;
  totalSupportObligation: number;
  
  // Parenting time adjustments
  parent1OvernightPercentage: number;
  parent2OvernightPercentage: number;
  parentingTimeAdjustment: number;
  
  // Final amounts
  parent1Obligation: number;
  parent2Obligation: number;
  netSupportAmount: number;
  payingParent: 'parent1' | 'parent2';
  
  // Breakdown by child
  perChildBreakdown: ChildSupportBreakdown[];
  
  // Additional details
  deviationFactors?: DeviationFactor[];
  warnings: string[];
  notes: string[];
}

export interface ChildSupportBreakdown {
  childName?: string;
  childAge: number;
  baseSupportAmount: number;
  healthInsuranceShare: number;
  childCareShare: number;
  otherExpensesShare: number;
  totalForChild: number;
}

export interface DeviationFactor {
  factor: string;
  impact: 'increase' | 'decrease';
  amount?: number;
  percentage?: number;
  description: string;
}

// State-specific guidelines
export interface StateGuidelines {
  stateCode: string;
  stateName: string;
  version: string;
  effectiveDate: string;
  model: 'income_shares' | 'percentage_of_income' | 'melson_formula';
  
  // Income thresholds
  minimumIncome: number;
  maximumIncome: number;
  lowIncomeThreshold: number;
  selfSupportReserve: number;
  
  // Basic support schedule (for income shares model)
  supportSchedule?: SupportScheduleEntry[];
  
  // Percentage rates (for percentage model)
  percentageRates?: PercentageRate[];
  
  // Adjustments
  parentingTimeThreshold: number;
  parentingTimeAdjustmentFormula: string;
  
  // Add-ons treatment
  healthInsuranceTreatment: 'add_on' | 'deviation' | 'included';
  childCareTreatment: 'add_on' | 'deviation' | 'included';
  
  // Special rules
  sharedCustodyFormula?: string;
  splitCustodyFormula?: string;
  multipleChildrenAdjustment?: number[];
  
  // Deviation factors recognized
  recognizedDeviations: string[];
  
  // Links and resources
  guidelinesUrl: string;
  calculatorUrl?: string;
  worksheetUrl?: string;
}

export interface SupportScheduleEntry {
  combinedIncomeMin: number;
  combinedIncomeMax: number;
  oneChild: number;
  twoChildren: number;
  threeChildren: number;
  fourChildren: number;
  fiveChildren: number;
  sixPlusChildren: number;
}

export interface PercentageRate {
  numberOfChildren: number;
  percentage: number;
  maxIncome?: number;
}

// Modification analysis
export interface ModificationAnalysis {
  currentOrderAmount: number;
  currentOrderDate: string;
  proposedAmount: number;
  changeAmount: number;
  changePercentage: number;
  meetsThreshold: boolean;
  thresholdPercentage: number;
  thresholdAmount: number;
  materialChangeFactors: MaterialChangeFactor[];
  recommendation: 'proceed' | 'may_proceed' | 'unlikely_to_succeed';
  reasoning: string;
}

export interface MaterialChangeFactor {
  factor: string;
  description: string;
  documentationNeeded: string[];
  strength: 'strong' | 'moderate' | 'weak';
}

// Historical tracking
export interface CalculationHistory {
  calculations: CalculationSummary[];
  totalCalculations: number;
  mostRecent: string;
}

export interface CalculationSummary {
  id: string;
  stateCode: string;
  calculationType: CalculationType;
  netSupportAmount: number;
  payingParent: 'parent1' | 'parent2';
  numberOfChildren: number;
  calculatedAt: string;
  linkedFilingId?: string;
}

// Arrears calculation
export interface ArrearsCalculation {
  orderedAmount: number;
  orderStartDate: string;
  payments: PaymentRecord[];
  totalOrdered: number;
  totalPaid: number;
  totalArrears: number;
  interestRate?: number;
  interestAccrued?: number;
  totalOwed: number;
}

export interface PaymentRecord {
  date: string;
  amount: number;
  source: 'direct' | 'wage_withholding' | 'tax_intercept' | 'other';
  notes?: string;
}

// Constants for common state guidelines
export const STATE_GUIDELINES_INFO: Record<string, { model: string; name: string }> = {
  CA: { model: 'income_shares', name: 'California' },
  TX: { model: 'percentage_of_income', name: 'Texas' },
  FL: { model: 'income_shares', name: 'Florida' },
  NY: { model: 'income_shares', name: 'New York' },
  IL: { model: 'income_shares', name: 'Illinois' },
};

