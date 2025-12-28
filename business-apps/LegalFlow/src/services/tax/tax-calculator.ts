/**
 * Tax Calculator Service
 * 
 * Uses database-driven tax brackets, deductions, and credits
 * for accurate federal and state tax calculations.
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

export interface TaxCalculationInput {
  taxYear: number;
  filingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
  grossIncome: number;
  stateCode?: string;
  adjustments?: number;
  itemizedDeductions?: number;
  qualifyingChildren?: number;
  dependents?: number;
  selfEmploymentIncome?: number;
  capitalGains?: number;
  retirementContributions?: number;
  studentLoanInterest?: number;
  healthSavingsContributions?: number;
  childCareCosts?: number;
  educationExpenses?: number;
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

