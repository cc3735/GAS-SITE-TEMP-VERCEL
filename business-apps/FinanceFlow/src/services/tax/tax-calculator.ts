/**
 * Tax Calculator Service
 *
 * @module services/tax/tax-calculator
 * @description Comprehensive tax calculation engine supporting federal and state taxes,
 * multiple tax credits, deductions, and adjustments. Uses database-driven tax brackets,
 * deductions, and credits for accurate calculations.
 *
 * @features
 * - Federal tax calculation with 7 tax brackets
 * - State tax support (flat, progressive, or no income tax)
 * - Multiple tax credits:
 *   - Child Tax Credit
 *   - Child and Dependent Care Credit
 *   - Earned Income Tax Credit (EITC)
 *   - American Opportunity Tax Credit (AOTC)
 *   - Lifetime Learning Credit
 *   - Saver's Credit (Retirement Savings Contribution Credit)
 *   - Residential Energy Credits
 * - Above-the-line deductions (adjustments)
 * - Standard vs. itemized deductions
 * - Self-employment tax calculation
 * - Data caching for performance
 *
 * @version 1.1.0
 * @since 2026-01-12
 */

import { supabaseAdmin } from '../../utils/supabase.js';
import { logger } from '../../utils/logger.js';

export interface TaxBracket {
  minIncome: number;
  maxIncome: number | null;
  rate: number;
  baseTax: number;
}

export interface TaxDeduction {
  type: string;
  filingStatus: string | null;
  amount: number;
  description?: string;
}

export interface TaxCredit {
  type: string;
  maxAmount: number | null;
  phaseOutStart: number | null;
  phaseOutEnd: number | null;
  refundable: boolean;
  eligibilityRules?: Record<string, unknown>;
  calculationRules?: Record<string, unknown>;
}

export interface StateTaxConfig {
  stateCode: string;
  stateName: string;
  hasIncomeTax: boolean;
  taxType: string;
  flatRate: number | null;
  standardDeductionSingle: number | null;
  standardDeductionMarried: number | null;
  standardDeductionHoh: number | null;
  personalExemption: number | null;
  specialRules?: Record<string, unknown>;
}

/**
 * Input parameters for tax calculation
 */
export interface TaxCalculationInput {
  /** Tax year for calculation (e.g., 2024) */
  taxYear: number;
  /** Filing status determines tax brackets and standard deduction */
  filingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
  /** Total gross income before adjustments */
  grossIncome: number;
  /** State code for state tax calculation (e.g., 'CA', 'TX') */
  stateCode?: string;
  /** Above-the-line adjustments (additional to auto-calculated) */
  adjustments?: number;
  /** Total itemized deductions (if using itemized) */
  itemizedDeductions?: number;
  /** Number of qualifying children for Child Tax Credit */
  qualifyingChildren?: number;
  /** Number of other dependents */
  dependents?: number;
  /** Self-employment income (Schedule C) */
  selfEmploymentIncome?: number;
  /** Long-term capital gains */
  capitalGains?: number;
  /** Retirement contributions (401k, IRA, etc.) */
  retirementContributions?: number;
  /** Student loan interest paid */
  studentLoanInterest?: number;
  /** Health Savings Account contributions */
  healthSavingsContributions?: number;
  /** Child care costs for dependent care credit */
  childCareCosts?: number;
  /** Education expenses for education credits */
  educationExpenses?: number;

  // ============================================================================
  // EITC (Earned Income Tax Credit) fields
  // ============================================================================
  /** Earned income (wages + self-employment) for EITC */
  earnedIncome?: number;
  /** Investment income (disqualifies EITC if over $11,000) */
  investmentIncome?: number;
  /** Ages of qualifying children for EITC [array of ages] */
  qualifyingChildrenAges?: number[];

  // ============================================================================
  // Education Credit fields
  // ============================================================================
  /** Number of students eligible for American Opportunity Credit (max 4 years) */
  aotcEligibleStudents?: number;
  /** Tuition and fees paid per student for AOTC */
  tuitionPerStudent?: number;
  /** Is student in first 4 years of postsecondary education? */
  firstFourYearsEducation?: boolean;
  /** Lifetime Learning Credit eligible expenses */
  lifetimeLearningExpenses?: number;

  // ============================================================================
  // Saver's Credit (Retirement Savings Contribution Credit) fields
  // ============================================================================
  /** IRA contributions for Saver's Credit */
  iraContributions?: number;
  /** 401k/403b/457 contributions for Saver's Credit */
  employerPlanContributions?: number;

  // ============================================================================
  // Energy Credit fields
  // ============================================================================
  /** Residential clean energy credit expenses (solar, wind, geothermal) */
  residentialCleanEnergyExpenses?: number;
  /** Energy efficient home improvement expenses */
  energyEfficientImprovements?: number;
  /** Electric vehicle purchase price (for EV credit) */
  electricVehiclePurchase?: number;
  /** Is the EV new or used? */
  evIsNew?: boolean;
  /** EV manufacturer's suggested retail price */
  evMsrp?: number;
}

export interface TaxCalculationResult {
  taxYear: number;
  filingStatus: string;
  federal: {
    grossIncome: number;
    adjustments: number;
    adjustedGrossIncome: number;
    deductions: number;
    deductionType: 'standard' | 'itemized';
    exemptions: number;
    taxableIncome: number;
    taxBeforeCredits: number;
    credits: CreditBreakdown[];
    totalCredits: number;
    taxAfterCredits: number;
    effectiveRate: number;
    marginalRate: number;
    bracketBreakdown: BracketBreakdown[];
  };
  state?: {
    stateCode: string;
    stateName: string;
    taxableIncome: number;
    stateTax: number;
    effectiveRate: number;
    taxType: string;
    bracketBreakdown?: BracketBreakdown[];
  };
  total: {
    federalTax: number;
    stateTax: number;
    selfEmploymentTax: number;
    totalTax: number;
    effectiveRate: number;
  };
  withholding?: {
    estimated: number;
    refundOrOwed: number;
  };
}

interface BracketBreakdown {
  rate: number;
  incomeInBracket: number;
  taxInBracket: number;
}

interface CreditBreakdown {
  name: string;
  amount: number;
  refundable: boolean;
}

// Cache for tax data
const taxDataCache: Map<string, unknown> = new Map();
const CACHE_TTL = 3600000; // 1 hour
let cacheTimestamp = 0;

async function getFederalBrackets(taxYear: number, filingStatus: string): Promise<TaxBracket[]> {
  const cacheKey = `federal_brackets_${taxYear}_${filingStatus}`;
  
  if (Date.now() - cacheTimestamp < CACHE_TTL && taxDataCache.has(cacheKey)) {
    return taxDataCache.get(cacheKey) as TaxBracket[];
  }

  const { data, error } = await supabaseAdmin
    .from('lf_federal_tax_brackets')
    .select('*')
    .eq('tax_year', taxYear)
    .eq('filing_status', filingStatus)
    .order('min_income', { ascending: true });

  if (error || !data || data.length === 0) {
    logger.warn('No federal brackets found, using defaults', { taxYear, filingStatus });
    return getDefaultFederalBrackets(filingStatus);
  }

  const brackets = data.map(b => ({
    minIncome: parseFloat(b.min_income),
    maxIncome: b.max_income ? parseFloat(b.max_income) : null,
    rate: parseFloat(b.rate),
    baseTax: parseFloat(b.base_tax || '0'),
  }));

  taxDataCache.set(cacheKey, brackets);
  cacheTimestamp = Date.now();

  return brackets;
}

async function getFederalDeductions(taxYear: number): Promise<TaxDeduction[]> {
  const cacheKey = `federal_deductions_${taxYear}`;
  
  if (Date.now() - cacheTimestamp < CACHE_TTL && taxDataCache.has(cacheKey)) {
    return taxDataCache.get(cacheKey) as TaxDeduction[];
  }

  const { data, error } = await supabaseAdmin
    .from('lf_federal_deductions')
    .select('*')
    .eq('tax_year', taxYear);

  if (error || !data || data.length === 0) {
    logger.warn('No federal deductions found, using defaults', { taxYear });
    return getDefaultDeductions();
  }

  const deductions = data.map(d => ({
    type: d.deduction_type,
    filingStatus: d.filing_status,
    amount: parseFloat(d.amount),
    description: d.description,
  }));

  taxDataCache.set(cacheKey, deductions);
  cacheTimestamp = Date.now();

  return deductions;
}

async function getFederalCredits(taxYear: number): Promise<TaxCredit[]> {
  const cacheKey = `federal_credits_${taxYear}`;
  
  if (Date.now() - cacheTimestamp < CACHE_TTL && taxDataCache.has(cacheKey)) {
    return taxDataCache.get(cacheKey) as TaxCredit[];
  }

  const { data, error } = await supabaseAdmin
    .from('lf_federal_credits')
    .select('*')
    .eq('tax_year', taxYear);

  if (error || !data) {
    logger.warn('No federal credits found', { taxYear });
    return [];
  }

  const credits = data.map(c => ({
    type: c.credit_type,
    maxAmount: c.max_amount ? parseFloat(c.max_amount) : null,
    phaseOutStart: c.phase_out_start ? parseFloat(c.phase_out_start) : null,
    phaseOutEnd: c.phase_out_end ? parseFloat(c.phase_out_end) : null,
    refundable: c.refundable,
    eligibilityRules: c.eligibility_rules,
    calculationRules: c.calculation_rules,
  }));

  taxDataCache.set(cacheKey, credits);
  cacheTimestamp = Date.now();

  return credits;
}

async function getStateTaxConfig(stateCode: string, taxYear: number): Promise<StateTaxConfig | null> {
  const cacheKey = `state_config_${stateCode}_${taxYear}`;
  
  if (Date.now() - cacheTimestamp < CACHE_TTL && taxDataCache.has(cacheKey)) {
    return taxDataCache.get(cacheKey) as StateTaxConfig;
  }

  const { data, error } = await supabaseAdmin
    .from('lf_state_tax_config')
    .select('*')
    .eq('state_code', stateCode)
    .eq('tax_year', taxYear)
    .single();

  if (error || !data) {
    logger.warn('No state tax config found', { stateCode, taxYear });
    return null;
  }

  const config: StateTaxConfig = {
    stateCode: data.state_code,
    stateName: data.state_name,
    hasIncomeTax: data.has_income_tax,
    taxType: data.tax_type,
    flatRate: data.flat_rate ? parseFloat(data.flat_rate) : null,
    standardDeductionSingle: data.standard_deduction_single ? parseFloat(data.standard_deduction_single) : null,
    standardDeductionMarried: data.standard_deduction_married ? parseFloat(data.standard_deduction_married) : null,
    standardDeductionHoh: data.standard_deduction_hoh ? parseFloat(data.standard_deduction_hoh) : null,
    personalExemption: data.personal_exemption ? parseFloat(data.personal_exemption) : null,
    specialRules: data.special_rules,
  };

  taxDataCache.set(cacheKey, config);
  cacheTimestamp = Date.now();

  return config;
}

async function getStateBrackets(stateCode: string, taxYear: number, filingStatus: string): Promise<TaxBracket[]> {
  const cacheKey = `state_brackets_${stateCode}_${taxYear}_${filingStatus}`;
  
  if (Date.now() - cacheTimestamp < CACHE_TTL && taxDataCache.has(cacheKey)) {
    return taxDataCache.get(cacheKey) as TaxBracket[];
  }

  const { data, error } = await supabaseAdmin
    .from('lf_state_tax_brackets')
    .select('*')
    .eq('state_code', stateCode)
    .eq('tax_year', taxYear)
    .eq('filing_status', filingStatus)
    .order('min_income', { ascending: true });

  if (error || !data || data.length === 0) {
    return [];
  }

  const brackets = data.map(b => ({
    minIncome: parseFloat(b.min_income),
    maxIncome: b.max_income ? parseFloat(b.max_income) : null,
    rate: parseFloat(b.rate),
    baseTax: parseFloat(b.base_tax || '0'),
  }));

  taxDataCache.set(cacheKey, brackets);
  cacheTimestamp = Date.now();

  return brackets;
}

// Default brackets for 2024 (fallback if database is empty)
function getDefaultFederalBrackets(filingStatus: string): TaxBracket[] {
  const brackets: Record<string, TaxBracket[]> = {
    single: [
      { minIncome: 0, maxIncome: 11600, rate: 0.10, baseTax: 0 },
      { minIncome: 11600, maxIncome: 47150, rate: 0.12, baseTax: 1160 },
      { minIncome: 47150, maxIncome: 100525, rate: 0.22, baseTax: 5426 },
      { minIncome: 100525, maxIncome: 191950, rate: 0.24, baseTax: 17168.50 },
      { minIncome: 191950, maxIncome: 243725, rate: 0.32, baseTax: 39110.50 },
      { minIncome: 243725, maxIncome: 609350, rate: 0.35, baseTax: 55678.50 },
      { minIncome: 609350, maxIncome: null, rate: 0.37, baseTax: 183647.25 },
    ],
    married_jointly: [
      { minIncome: 0, maxIncome: 23200, rate: 0.10, baseTax: 0 },
      { minIncome: 23200, maxIncome: 94300, rate: 0.12, baseTax: 2320 },
      { minIncome: 94300, maxIncome: 201050, rate: 0.22, baseTax: 10852 },
      { minIncome: 201050, maxIncome: 383900, rate: 0.24, baseTax: 34337 },
      { minIncome: 383900, maxIncome: 487450, rate: 0.32, baseTax: 78221 },
      { minIncome: 487450, maxIncome: 731200, rate: 0.35, baseTax: 111357 },
      { minIncome: 731200, maxIncome: null, rate: 0.37, baseTax: 196669.50 },
    ],
    married_separately: [
      { minIncome: 0, maxIncome: 11600, rate: 0.10, baseTax: 0 },
      { minIncome: 11600, maxIncome: 47150, rate: 0.12, baseTax: 1160 },
      { minIncome: 47150, maxIncome: 100525, rate: 0.22, baseTax: 5426 },
      { minIncome: 100525, maxIncome: 191950, rate: 0.24, baseTax: 17168.50 },
      { minIncome: 191950, maxIncome: 243725, rate: 0.32, baseTax: 39110.50 },
      { minIncome: 243725, maxIncome: 365600, rate: 0.35, baseTax: 55678.50 },
      { minIncome: 365600, maxIncome: null, rate: 0.37, baseTax: 98334.75 },
    ],
    head_of_household: [
      { minIncome: 0, maxIncome: 16550, rate: 0.10, baseTax: 0 },
      { minIncome: 16550, maxIncome: 63100, rate: 0.12, baseTax: 1655 },
      { minIncome: 63100, maxIncome: 100500, rate: 0.22, baseTax: 7241 },
      { minIncome: 100500, maxIncome: 191950, rate: 0.24, baseTax: 15469 },
      { minIncome: 191950, maxIncome: 243700, rate: 0.32, baseTax: 37417 },
      { minIncome: 243700, maxIncome: 609350, rate: 0.35, baseTax: 53977 },
      { minIncome: 609350, maxIncome: null, rate: 0.37, baseTax: 181954.50 },
    ],
  };

  return brackets[filingStatus] || brackets.single;
}

function getDefaultDeductions(): TaxDeduction[] {
  return [
    { type: 'standard_deduction', filingStatus: 'single', amount: 14600 },
    { type: 'standard_deduction', filingStatus: 'married_jointly', amount: 29200 },
    { type: 'standard_deduction', filingStatus: 'married_separately', amount: 14600 },
    { type: 'standard_deduction', filingStatus: 'head_of_household', amount: 21900 },
  ];
}

// ============================================================================
// Credit Calculation Helper Functions
// ============================================================================

/**
 * Calculate Earned Income Tax Credit (EITC)
 *
 * @description The EITC is a refundable tax credit for low to moderate income workers.
 * The credit amount depends on earned income, filing status, and number of qualifying children.
 *
 * @param input - Tax calculation input
 * @param agi - Adjusted Gross Income
 * @returns EITC amount and eligibility info
 */
function calculateEITC(
  input: TaxCalculationInput,
  agi: number
): { amount: number; eligible: boolean; reason?: string } {
  const { filingStatus, qualifyingChildren = 0, earnedIncome, investmentIncome = 0 } = input;

  // Investment income limit for 2024: $11,000
  if (investmentIncome > 11000) {
    return { amount: 0, eligible: false, reason: 'Investment income exceeds $11,000 limit' };
  }

  // Use earned income or gross income if not specified
  const earned = earnedIncome ?? input.grossIncome;

  // EITC income limits and max credits for 2024
  // Format: { maxCredit, earnedIncomeLimit, agiLimit }
  const eitcLimits: Record<string, Record<number, { maxCredit: number; phaseInEnd: number; phaseOutStart: number; phaseOutEnd: number }>> = {
    single: {
      0: { maxCredit: 632, phaseInEnd: 7840, phaseOutStart: 9800, phaseOutEnd: 18591 },
      1: { maxCredit: 4213, phaseInEnd: 11750, phaseOutStart: 21560, phaseOutEnd: 49084 },
      2: { maxCredit: 6960, phaseInEnd: 16510, phaseOutStart: 21560, phaseOutEnd: 55768 },
      3: { maxCredit: 7830, phaseInEnd: 16510, phaseOutStart: 21560, phaseOutEnd: 59899 },
    },
    married_jointly: {
      0: { maxCredit: 632, phaseInEnd: 7840, phaseOutStart: 16370, phaseOutEnd: 25511 },
      1: { maxCredit: 4213, phaseInEnd: 11750, phaseOutStart: 28120, phaseOutEnd: 56004 },
      2: { maxCredit: 6960, phaseInEnd: 16510, phaseOutStart: 28120, phaseOutEnd: 62688 },
      3: { maxCredit: 7830, phaseInEnd: 16510, phaseOutStart: 28120, phaseOutEnd: 66819 },
    },
  };

  // Head of household and married separately use single limits
  const statusKey = filingStatus === 'married_jointly' ? 'married_jointly' : 'single';
  const childCount = Math.min(qualifyingChildren, 3);
  const limits = eitcLimits[statusKey][childCount];

  if (!limits) {
    return { amount: 0, eligible: false, reason: 'Invalid filing status or children count' };
  }

  // Check if income is within limits
  const incomeToUse = Math.max(earned, agi);
  if (incomeToUse > limits.phaseOutEnd) {
    return { amount: 0, eligible: false, reason: 'Income exceeds EITC limits' };
  }

  // Calculate credit
  let credit = 0;

  if (earned <= limits.phaseInEnd) {
    // Phase-in: credit increases with earned income
    const phaseInRate = limits.maxCredit / limits.phaseInEnd;
    credit = Math.round(earned * phaseInRate);
  } else if (incomeToUse <= limits.phaseOutStart) {
    // Plateau: maximum credit
    credit = limits.maxCredit;
  } else if (incomeToUse <= limits.phaseOutEnd) {
    // Phase-out: credit decreases
    const phaseOutRate = limits.maxCredit / (limits.phaseOutEnd - limits.phaseOutStart);
    credit = Math.round(limits.maxCredit - (incomeToUse - limits.phaseOutStart) * phaseOutRate);
  }

  credit = Math.max(0, Math.min(credit, limits.maxCredit));

  return { amount: credit, eligible: credit > 0 };
}

/**
 * Calculate American Opportunity Tax Credit (AOTC)
 *
 * @description The AOTC is worth up to $2,500 per eligible student for the first 4 years
 * of postsecondary education. 40% of the credit (up to $1,000) is refundable.
 *
 * @param input - Tax calculation input
 * @param agi - Adjusted Gross Income
 * @returns AOTC breakdown (refundable and nonrefundable portions)
 */
function calculateAOTC(
  input: TaxCalculationInput,
  agi: number
): { nonrefundable: number; refundable: number; claimed: boolean } {
  const { filingStatus, aotcEligibleStudents = 0, tuitionPerStudent = 0, firstFourYearsEducation = true } = input;

  if (aotcEligibleStudents === 0 || tuitionPerStudent === 0 || !firstFourYearsEducation) {
    return { nonrefundable: 0, refundable: 0, claimed: false };
  }

  // AGI limits for 2024
  const limits = filingStatus === 'married_jointly'
    ? { phaseOutStart: 160000, phaseOutEnd: 180000 }
    : { phaseOutStart: 80000, phaseOutEnd: 90000 };

  if (agi >= limits.phaseOutEnd) {
    return { nonrefundable: 0, refundable: 0, claimed: false };
  }

  // Calculate credit per student
  // 100% of first $2,000 + 25% of next $2,000 = max $2,500
  const expensesPerStudent = Math.min(tuitionPerStudent, 4000);
  let creditPerStudent = 0;
  if (expensesPerStudent <= 2000) {
    creditPerStudent = expensesPerStudent;
  } else {
    creditPerStudent = 2000 + (expensesPerStudent - 2000) * 0.25;
  }

  // Total credit before phase-out
  let totalCredit = Math.round(creditPerStudent * aotcEligibleStudents);

  // Apply phase-out
  if (agi > limits.phaseOutStart) {
    const phaseOutRatio = (agi - limits.phaseOutStart) / (limits.phaseOutEnd - limits.phaseOutStart);
    totalCredit = Math.round(totalCredit * (1 - phaseOutRatio));
  }

  // 40% is refundable (up to $1,000 per student)
  const refundable = Math.min(Math.round(totalCredit * 0.40), 1000 * aotcEligibleStudents);
  const nonrefundable = totalCredit - refundable;

  return { nonrefundable, refundable, claimed: totalCredit > 0 };
}

/**
 * Calculate Lifetime Learning Credit
 *
 * @description The LLC is worth up to $2,000 per tax return (20% of first $10,000 in expenses).
 * Unlike AOTC, it's available for any year of postsecondary education and is nonrefundable.
 *
 * @param input - Tax calculation input
 * @param agi - Adjusted Gross Income
 * @returns LLC amount
 */
function calculateLifetimeLearningCredit(
  input: TaxCalculationInput,
  agi: number
): { amount: number } {
  const { filingStatus, lifetimeLearningExpenses = 0 } = input;

  if (lifetimeLearningExpenses === 0) {
    return { amount: 0 };
  }

  // AGI limits for 2024
  const limits = filingStatus === 'married_jointly'
    ? { phaseOutStart: 160000, phaseOutEnd: 180000 }
    : { phaseOutStart: 80000, phaseOutEnd: 90000 };

  if (agi >= limits.phaseOutEnd) {
    return { amount: 0 };
  }

  // 20% of first $10,000 = max $2,000
  let credit = Math.round(Math.min(lifetimeLearningExpenses, 10000) * 0.20);

  // Apply phase-out
  if (agi > limits.phaseOutStart) {
    const phaseOutRatio = (agi - limits.phaseOutStart) / (limits.phaseOutEnd - limits.phaseOutStart);
    credit = Math.round(credit * (1 - phaseOutRatio));
  }

  return { amount: Math.max(0, credit) };
}

/**
 * Calculate Saver's Credit (Retirement Savings Contribution Credit)
 *
 * @description The Saver's Credit rewards low to moderate income taxpayers for contributing
 * to retirement accounts. Credit rates: 50%, 20%, or 10% of contributions up to $2,000
 * ($4,000 if married filing jointly).
 *
 * @param input - Tax calculation input
 * @param agi - Adjusted Gross Income
 * @returns Saver's Credit amount
 */
function calculateSaversCredit(
  input: TaxCalculationInput,
  agi: number
): { amount: number; rate: number } {
  const { filingStatus, iraContributions = 0, employerPlanContributions = 0, retirementContributions = 0 } = input;

  // Total contributions (use separate fields or fallback to retirementContributions)
  const totalContributions = (iraContributions + employerPlanContributions) || retirementContributions;

  if (totalContributions === 0) {
    return { amount: 0, rate: 0 };
  }

  // AGI limits for 2024 by filing status
  const limits: Record<string, Array<{ maxAgi: number; rate: number }>> = {
    single: [
      { maxAgi: 23000, rate: 0.50 },
      { maxAgi: 25000, rate: 0.20 },
      { maxAgi: 38250, rate: 0.10 },
    ],
    married_jointly: [
      { maxAgi: 46000, rate: 0.50 },
      { maxAgi: 50000, rate: 0.20 },
      { maxAgi: 76500, rate: 0.10 },
    ],
    head_of_household: [
      { maxAgi: 34500, rate: 0.50 },
      { maxAgi: 37500, rate: 0.20 },
      { maxAgi: 57375, rate: 0.10 },
    ],
    married_separately: [
      { maxAgi: 23000, rate: 0.50 },
      { maxAgi: 25000, rate: 0.20 },
      { maxAgi: 38250, rate: 0.10 },
    ],
  };

  const statusLimits = limits[filingStatus] || limits.single;

  // Find applicable rate
  let creditRate = 0;
  for (const limit of statusLimits) {
    if (agi <= limit.maxAgi) {
      creditRate = limit.rate;
      break;
    }
  }

  if (creditRate === 0) {
    return { amount: 0, rate: 0 };
  }

  // Max contribution eligible: $2,000 ($4,000 MFJ)
  const maxContribution = filingStatus === 'married_jointly' ? 4000 : 2000;
  const eligibleContributions = Math.min(totalContributions, maxContribution);

  const credit = Math.round(eligibleContributions * creditRate);

  return { amount: credit, rate: creditRate };
}

/**
 * Calculate Clean Vehicle Credit (EV Credit)
 *
 * @description The Clean Vehicle Credit provides up to $7,500 for new qualifying EVs
 * and up to $4,000 for used EVs. Subject to income limits and vehicle price caps.
 *
 * @param input - Tax calculation input
 * @param agi - Adjusted Gross Income (uses prior year for determination)
 * @returns EV credit amount
 */
function calculateEVCredit(
  input: TaxCalculationInput,
  agi: number
): { amount: number } {
  const { filingStatus, electricVehiclePurchase = 0, evIsNew = true, evMsrp = 0 } = input;

  if (electricVehiclePurchase === 0) {
    return { amount: 0 };
  }

  // AGI limits for 2024
  const agiLimits: Record<string, { new: number; used: number }> = {
    single: { new: 150000, used: 75000 },
    married_jointly: { new: 300000, used: 150000 },
    head_of_household: { new: 225000, used: 112500 },
    married_separately: { new: 150000, used: 75000 },
  };

  const limits = agiLimits[filingStatus] || agiLimits.single;
  const agiLimit = evIsNew ? limits.new : limits.used;

  if (agi > agiLimit) {
    return { amount: 0 };
  }

  if (evIsNew) {
    // New EV: up to $7,500
    // MSRP limits: SUVs/trucks: $80,000, others: $55,000
    const msrpLimit = evMsrp > 0 && evMsrp <= 80000 ? 80000 : 55000;
    if (evMsrp > msrpLimit) {
      return { amount: 0 };
    }
    // Credit is up to $7,500 (split: $3,750 battery component + $3,750 critical minerals)
    // For simplicity, assume full credit if vehicle qualifies
    return { amount: 7500 };
  } else {
    // Used EV: lesser of $4,000 or 30% of sale price
    const maxCredit = 4000;
    const percentageCredit = Math.round(electricVehiclePurchase * 0.30);
    return { amount: Math.min(maxCredit, percentageCredit) };
  }
}

// ============================================================================
// Tax Bracket Calculation
// ============================================================================

function calculateTaxWithBrackets(taxableIncome: number, brackets: TaxBracket[]): { tax: number; breakdown: BracketBreakdown[]; marginalRate: number } {
  let totalTax = 0;
  const breakdown: BracketBreakdown[] = [];
  let marginalRate = 0;

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.minIncome) break;

    const bracketMax = bracket.maxIncome ?? Infinity;
    const incomeInBracket = Math.min(taxableIncome, bracketMax) - bracket.minIncome;
    
    if (incomeInBracket > 0) {
      const taxInBracket = incomeInBracket * bracket.rate;
      totalTax += taxInBracket;
      marginalRate = bracket.rate;
      
      breakdown.push({
        rate: bracket.rate * 100,
        incomeInBracket: Math.round(incomeInBracket),
        taxInBracket: Math.round(taxInBracket * 100) / 100,
      });
    }
  }

  return { tax: Math.round(totalTax * 100) / 100, breakdown, marginalRate };
}

export async function calculateTax(input: TaxCalculationInput): Promise<TaxCalculationResult> {
  const { taxYear, filingStatus, grossIncome, stateCode } = input;

  // Fetch federal tax data
  const [brackets, deductions, credits] = await Promise.all([
    getFederalBrackets(taxYear, filingStatus),
    getFederalDeductions(taxYear),
    getFederalCredits(taxYear),
  ]);

  // Calculate adjustments (above-the-line deductions)
  let totalAdjustments = input.adjustments || 0;
  
  if (input.studentLoanInterest) {
    totalAdjustments += Math.min(input.studentLoanInterest, 2500);
  }
  if (input.healthSavingsContributions) {
    const hsaLimit = filingStatus === 'married_jointly' ? 8300 : 4150;
    totalAdjustments += Math.min(input.healthSavingsContributions, hsaLimit);
  }
  if (input.retirementContributions) {
    totalAdjustments += Math.min(input.retirementContributions, 23000); // 401k limit
  }

  const adjustedGrossIncome = grossIncome - totalAdjustments;

  // Determine standard vs itemized deductions
  const standardDeduction = deductions.find(
    d => d.type === 'standard_deduction' && d.filingStatus === filingStatus
  )?.amount || 14600;

  const itemizedTotal = input.itemizedDeductions || 0;
  const deductionAmount = Math.max(standardDeduction, itemizedTotal);
  const deductionType = itemizedTotal > standardDeduction ? 'itemized' : 'standard';

  // Calculate taxable income
  const taxableIncome = Math.max(0, adjustedGrossIncome - deductionAmount);

  // Calculate tax using brackets
  const { tax: taxBeforeCredits, breakdown: bracketBreakdown, marginalRate } = calculateTaxWithBrackets(taxableIncome, brackets);

  // Calculate credits
  const creditBreakdown: CreditBreakdown[] = [];
  let totalCredits = 0;

  // Child Tax Credit
  if (input.qualifyingChildren && input.qualifyingChildren > 0) {
    const ctcCredit = credits.find(c => c.type === 'child_tax_credit');
    if (ctcCredit && ctcCredit.maxAmount) {
      const phaseOutThreshold = filingStatus === 'married_jointly' ? 400000 : 200000;
      let ctcAmount = input.qualifyingChildren * ctcCredit.maxAmount;
      
      if (adjustedGrossIncome > phaseOutThreshold) {
        const phaseOutReduction = Math.ceil((adjustedGrossIncome - phaseOutThreshold) / 1000) * 50;
        ctcAmount = Math.max(0, ctcAmount - phaseOutReduction);
      }
      
      creditBreakdown.push({ name: 'Child Tax Credit', amount: ctcAmount, refundable: false });
      totalCredits += ctcAmount;
    }
  }

  // Child and Dependent Care Credit
  if (input.childCareCosts && input.childCareCosts > 0) {
    const maxExpenses = (input.qualifyingChildren || 1) >= 2 ? 6000 : 3000;
    const expenses = Math.min(input.childCareCosts, maxExpenses);
    let creditRate = 0.35;
    if (adjustedGrossIncome > 15000) {
      creditRate = Math.max(0.20, 0.35 - (Math.ceil((adjustedGrossIncome - 15000) / 2000) * 0.01));
    }
    const childCareCredit = Math.round(expenses * creditRate);
    creditBreakdown.push({ name: 'Child and Dependent Care Credit', amount: childCareCredit, refundable: false });
    totalCredits += childCareCredit;
  }

  // ============================================================================
  // Earned Income Tax Credit (EITC) - Refundable
  // ============================================================================
  const eitcResult = calculateEITC(input, adjustedGrossIncome);
  if (eitcResult.amount > 0) {
    creditBreakdown.push({
      name: 'Earned Income Tax Credit (EITC)',
      amount: eitcResult.amount,
      refundable: true, // EITC is refundable
    });
    totalCredits += eitcResult.amount;
  }

  // ============================================================================
  // American Opportunity Tax Credit (AOTC) - Partially Refundable
  // ============================================================================
  const aotcResult = calculateAOTC(input, adjustedGrossIncome);
  if (aotcResult.nonrefundable > 0) {
    creditBreakdown.push({
      name: 'American Opportunity Tax Credit',
      amount: aotcResult.nonrefundable,
      refundable: false,
    });
    totalCredits += aotcResult.nonrefundable;
  }
  if (aotcResult.refundable > 0) {
    creditBreakdown.push({
      name: 'American Opportunity Tax Credit (Refundable)',
      amount: aotcResult.refundable,
      refundable: true,
    });
    totalCredits += aotcResult.refundable;
  }

  // ============================================================================
  // Lifetime Learning Credit - Nonrefundable
  // ============================================================================
  // Only calculate if not claiming AOTC (can't claim both for same student)
  if (!aotcResult.claimed && input.lifetimeLearningExpenses && input.lifetimeLearningExpenses > 0) {
    const llcResult = calculateLifetimeLearningCredit(input, adjustedGrossIncome);
    if (llcResult.amount > 0) {
      creditBreakdown.push({
        name: 'Lifetime Learning Credit',
        amount: llcResult.amount,
        refundable: false,
      });
      totalCredits += llcResult.amount;
    }
  }

  // ============================================================================
  // Saver's Credit (Retirement Savings Contribution Credit) - Nonrefundable
  // ============================================================================
  const saversResult = calculateSaversCredit(input, adjustedGrossIncome);
  if (saversResult.amount > 0) {
    creditBreakdown.push({
      name: "Saver's Credit",
      amount: saversResult.amount,
      refundable: false,
    });
    totalCredits += saversResult.amount;
  }

  // ============================================================================
  // Residential Clean Energy Credit - Nonrefundable
  // ============================================================================
  if (input.residentialCleanEnergyExpenses && input.residentialCleanEnergyExpenses > 0) {
    // 30% of qualified expenses (no cap for most systems)
    const cleanEnergyCredit = Math.round(input.residentialCleanEnergyExpenses * 0.30);
    creditBreakdown.push({
      name: 'Residential Clean Energy Credit',
      amount: cleanEnergyCredit,
      refundable: false,
    });
    totalCredits += cleanEnergyCredit;
  }

  // ============================================================================
  // Energy Efficient Home Improvement Credit - Nonrefundable
  // ============================================================================
  if (input.energyEfficientImprovements && input.energyEfficientImprovements > 0) {
    // 30% of qualified expenses, up to $3,200/year max
    const maxCredit = 3200;
    const improvementCredit = Math.min(
      Math.round(input.energyEfficientImprovements * 0.30),
      maxCredit
    );
    creditBreakdown.push({
      name: 'Energy Efficient Home Improvement Credit',
      amount: improvementCredit,
      refundable: false,
    });
    totalCredits += improvementCredit;
  }

  // ============================================================================
  // Clean Vehicle Credit (EV Credit) - Nonrefundable
  // ============================================================================
  const evResult = calculateEVCredit(input, adjustedGrossIncome);
  if (evResult.amount > 0) {
    creditBreakdown.push({
      name: 'Clean Vehicle Credit',
      amount: evResult.amount,
      refundable: false,
    });
    totalCredits += evResult.amount;
  }

  // Calculate tax after credits (nonrefundable limited to tax liability)
  const nonrefundableCredits = creditBreakdown.filter(c => !c.refundable).reduce((sum, c) => sum + c.amount, 0);
  const refundableCredits = creditBreakdown.filter(c => c.refundable).reduce((sum, c) => sum + c.amount, 0);
  
  const taxAfterCredits = Math.max(0, taxBeforeCredits - nonrefundableCredits) - refundableCredits;

  // Self-employment tax
  let selfEmploymentTax = 0;
  if (input.selfEmploymentIncome && input.selfEmploymentIncome > 400) {
    const seNetIncome = input.selfEmploymentIncome * 0.9235;
    selfEmploymentTax = Math.round(seNetIncome * 0.153 * 100) / 100;
  }

  // Federal result
  const federalTax = Math.max(0, taxAfterCredits + selfEmploymentTax);
  const effectiveRate = grossIncome > 0 ? (federalTax / grossIncome) * 100 : 0;

  // State tax calculation
  let stateResult: TaxCalculationResult['state'];
  let stateTax = 0;

  if (stateCode) {
    const stateConfig = await getStateTaxConfig(stateCode, taxYear);
    
    if (stateConfig && stateConfig.hasIncomeTax) {
      let stateDeduction = 0;
      switch (filingStatus) {
        case 'married_jointly':
          stateDeduction = stateConfig.standardDeductionMarried || 0;
          break;
        case 'head_of_household':
          stateDeduction = stateConfig.standardDeductionHoh || stateConfig.standardDeductionSingle || 0;
          break;
        default:
          stateDeduction = stateConfig.standardDeductionSingle || 0;
      }

      const stateTaxableIncome = Math.max(0, adjustedGrossIncome - stateDeduction);

      if (stateConfig.taxType === 'flat' && stateConfig.flatRate) {
        stateTax = Math.round(stateTaxableIncome * stateConfig.flatRate * 100) / 100;
        stateResult = {
          stateCode: stateConfig.stateCode,
          stateName: stateConfig.stateName,
          taxableIncome: Math.round(stateTaxableIncome),
          stateTax,
          effectiveRate: adjustedGrossIncome > 0 ? (stateTax / adjustedGrossIncome) * 100 : 0,
          taxType: 'flat',
        };
      } else if (stateConfig.taxType === 'progressive') {
        const stateBrackets = await getStateBrackets(stateCode, taxYear, filingStatus);
        if (stateBrackets.length > 0) {
          const { tax, breakdown } = calculateTaxWithBrackets(stateTaxableIncome, stateBrackets);
          stateTax = tax;
          stateResult = {
            stateCode: stateConfig.stateCode,
            stateName: stateConfig.stateName,
            taxableIncome: Math.round(stateTaxableIncome),
            stateTax,
            effectiveRate: adjustedGrossIncome > 0 ? (stateTax / adjustedGrossIncome) * 100 : 0,
            taxType: 'progressive',
            bracketBreakdown: breakdown,
          };
        }
      } else if (stateConfig.taxType === 'none') {
        stateResult = {
          stateCode: stateConfig.stateCode,
          stateName: stateConfig.stateName,
          taxableIncome: 0,
          stateTax: 0,
          effectiveRate: 0,
          taxType: 'none',
        };
      }
    }
  }

  // Total calculation
  const totalTax = federalTax + stateTax;
  const totalEffectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    taxYear,
    filingStatus,
    federal: {
      grossIncome: Math.round(grossIncome),
      adjustments: Math.round(totalAdjustments),
      adjustedGrossIncome: Math.round(adjustedGrossIncome),
      deductions: Math.round(deductionAmount),
      deductionType,
      exemptions: 0,
      taxableIncome: Math.round(taxableIncome),
      taxBeforeCredits: Math.round(taxBeforeCredits * 100) / 100,
      credits: creditBreakdown,
      totalCredits: Math.round(totalCredits),
      taxAfterCredits: Math.round(taxAfterCredits * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      marginalRate: Math.round(marginalRate * 100),
      bracketBreakdown,
    },
    state: stateResult,
    total: {
      federalTax: Math.round(federalTax * 100) / 100,
      stateTax: Math.round(stateTax * 100) / 100,
      selfEmploymentTax: Math.round(selfEmploymentTax * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      effectiveRate: Math.round(totalEffectiveRate * 100) / 100,
    },
  };
}

export async function getAvailableStates(taxYear: number): Promise<Array<{ code: string; name: string; hasIncomeTax: boolean; taxType: string }>> {
  const { data, error } = await supabaseAdmin
    .from('lf_state_tax_config')
    .select('state_code, state_name, has_income_tax, tax_type')
    .eq('tax_year', taxYear)
    .order('state_name');

  if (error || !data) {
    return [];
  }

  return data.map(s => ({
    code: s.state_code,
    name: s.state_name,
    hasIncomeTax: s.has_income_tax,
    taxType: s.tax_type,
  }));
}

export function clearTaxCache(): void {
  taxDataCache.clear();
  cacheTimestamp = 0;
  logger.info('Tax calculator cache cleared');
}

