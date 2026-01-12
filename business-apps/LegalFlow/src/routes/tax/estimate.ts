/**
 * Tax Refund Estimator Routes
 *
 * @module routes/tax/estimate
 * @description Provides real-time tax refund/liability estimation as users enter data.
 * Supports "what-if" scenarios for tax planning decisions.
 *
 * @features
 * - Real-time refund/liability estimates
 * - What-if scenario comparisons
 * - Tax optimization suggestions
 * - Prior year comparison (when available)
 * - Estimated quarterly payments calculation
 *
 * @endpoints
 * - POST /api/tax/estimate           - Calculate real-time estimate
 * - POST /api/tax/estimate/what-if   - Compare scenarios
 * - POST /api/tax/estimate/quarterly - Calculate quarterly estimates
 * - GET  /api/tax/estimate/:returnId - Get estimate for saved return
 *
 * @version 1.0.0
 * @since 2026-01-12
 */

import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { calculateTax, TaxCalculationInput, TaxCalculationResult } from '../../services/tax/tax-calculator.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Interfaces
// ============================================================================

/**
 * Estimate request with partial tax data
 */
interface EstimateRequest {
  taxYear?: number;
  filingStatus: 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';
  wages?: number;
  selfEmploymentIncome?: number;
  interestIncome?: number;
  dividendIncome?: number;
  capitalGains?: number;
  otherIncome?: number;
  federalWithheld?: number;
  stateWithheld?: number;
  stateCode?: string;
  qualifyingChildren?: number;
  dependents?: number;
  childCareCosts?: number;
  retirementContributions?: number;
  studentLoanInterest?: number;
  healthSavingsContributions?: number;
  itemizedDeductions?: number;
  educationExpenses?: number;
  aotcEligibleStudents?: number;
  tuitionPerStudent?: number;
  residentialCleanEnergyExpenses?: number;
  energyEfficientImprovements?: number;
}

/**
 * Tax optimization suggestion
 */
interface TaxSuggestion {
  type: 'deduction' | 'credit' | 'adjustment' | 'planning';
  title: string;
  description: string;
  potentialSavings: number;
  actionRequired: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Refund estimate response
 */
interface EstimateResponse {
  estimate: {
    federalTax: number;
    stateTax: number;
    totalTax: number;
    totalWithheld: number;
    refundOrOwed: number;
    isRefund: boolean;
    effectiveRate: number;
    marginalRate: number;
  };
  breakdown: {
    grossIncome: number;
    adjustments: number;
    adjustedGrossIncome: number;
    deductions: number;
    deductionType: 'standard' | 'itemized';
    taxableIncome: number;
    credits: Array<{ name: string; amount: number; refundable: boolean }>;
    totalCredits: number;
  };
  suggestions: TaxSuggestion[];
  confidence: 'low' | 'medium' | 'high';
  missingInfo: string[];
  lastUpdated: string;
}

// ============================================================================
// Routes
// ============================================================================

/**
 * @api {post} /api/tax/estimate Real-time Tax Estimate
 * @apiName GetTaxEstimate
 * @apiGroup TaxEstimate
 * @apiVersion 1.0.0
 * @apiDescription Calculates a real-time tax refund or liability estimate
 * based on the provided income and deduction data.
 *
 * @apiBody {String} filingStatus Filing status (required)
 * @apiBody {Number} [wages] W-2 wages
 * @apiBody {Number} [selfEmploymentIncome] Self-employment income
 * @apiBody {Number} [federalWithheld] Federal tax withheld
 * @apiBody {Number} [stateWithheld] State tax withheld
 * @apiBody {Number} [qualifyingChildren] Number of qualifying children
 * ... (other fields)
 *
 * @apiSuccess {Object} estimate Tax estimate summary
 * @apiSuccess {Object} breakdown Detailed breakdown
 * @apiSuccess {Array} suggestions Tax optimization suggestions
 */
router.post('/', asyncHandler(async (req, res) => {
  const data: EstimateRequest = req.body;

  // Validate required fields
  if (!data.filingStatus) {
    throw new ValidationError('Filing status is required');
  }

  const validFilingStatuses = ['single', 'married_jointly', 'married_separately', 'head_of_household'];
  if (!validFilingStatuses.includes(data.filingStatus)) {
    throw new ValidationError(`Invalid filing status. Valid options: ${validFilingStatuses.join(', ')}`);
  }

  // Calculate gross income from components
  const grossIncome = (
    (data.wages || 0) +
    (data.selfEmploymentIncome || 0) +
    (data.interestIncome || 0) +
    (data.dividendIncome || 0) +
    (data.capitalGains || 0) +
    (data.otherIncome || 0)
  );

  // Check for minimum data
  const missingInfo: string[] = [];
  if (grossIncome === 0) {
    missingInfo.push('No income entered yet');
  }
  if (!data.federalWithheld && grossIncome > 0) {
    missingInfo.push('Federal withholding not entered');
  }

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'high';
  if (missingInfo.length > 2) confidence = 'low';
  else if (missingInfo.length > 0) confidence = 'medium';

  // Build calculation input
  const calcInput: TaxCalculationInput = {
    taxYear: data.taxYear || new Date().getFullYear(),
    filingStatus: data.filingStatus,
    grossIncome,
    stateCode: data.stateCode,
    selfEmploymentIncome: data.selfEmploymentIncome,
    capitalGains: data.capitalGains,
    retirementContributions: data.retirementContributions,
    studentLoanInterest: data.studentLoanInterest,
    healthSavingsContributions: data.healthSavingsContributions,
    qualifyingChildren: data.qualifyingChildren,
    dependents: data.dependents,
    childCareCosts: data.childCareCosts,
    itemizedDeductions: data.itemizedDeductions,
    educationExpenses: data.educationExpenses,
    aotcEligibleStudents: data.aotcEligibleStudents,
    tuitionPerStudent: data.tuitionPerStudent,
    residentialCleanEnergyExpenses: data.residentialCleanEnergyExpenses,
    energyEfficientImprovements: data.energyEfficientImprovements,
  };

  // Calculate tax
  const result: TaxCalculationResult = await calculateTax(calcInput);

  // Calculate refund/owed
  const totalWithheld = (data.federalWithheld || 0) + (data.stateWithheld || 0);
  const refundOrOwed = totalWithheld - result.total.totalTax;
  const isRefund = refundOrOwed > 0;

  // Generate suggestions
  const suggestions = generateSuggestions(data, result);

  // Build response
  const response: EstimateResponse = {
    estimate: {
      federalTax: result.total.federalTax,
      stateTax: result.total.stateTax,
      totalTax: result.total.totalTax,
      totalWithheld,
      refundOrOwed: Math.abs(refundOrOwed),
      isRefund,
      effectiveRate: result.total.effectiveRate,
      marginalRate: result.federal.marginalRate,
    },
    breakdown: {
      grossIncome: result.federal.grossIncome,
      adjustments: result.federal.adjustments,
      adjustedGrossIncome: result.federal.adjustedGrossIncome,
      deductions: result.federal.deductions,
      deductionType: result.federal.deductionType,
      taxableIncome: result.federal.taxableIncome,
      credits: result.federal.credits,
      totalCredits: result.federal.totalCredits,
    },
    suggestions,
    confidence,
    missingInfo,
    lastUpdated: new Date().toISOString(),
  };

  res.json({
    success: true,
    data: response,
  });
}));

/**
 * @api {post} /api/tax/estimate/what-if What-If Scenario Comparison
 * @apiName WhatIfScenario
 * @apiGroup TaxEstimate
 * @apiVersion 1.0.0
 * @apiDescription Compares different tax scenarios to help with financial decisions.
 *
 * @apiBody {Object} baseline Current tax situation
 * @apiBody {Array} scenarios Array of alternative scenarios to compare
 */
router.post('/what-if', asyncHandler(async (req, res) => {
  const { baseline, scenarios } = req.body;

  if (!baseline || !scenarios || !Array.isArray(scenarios)) {
    throw new ValidationError('Baseline and scenarios array are required');
  }

  if (scenarios.length > 5) {
    throw new ValidationError('Maximum 5 scenarios can be compared at once');
  }

  // Calculate baseline
  const baselineGrossIncome = calculateGrossIncome(baseline);
  const baselineResult = await calculateTax({
    taxYear: baseline.taxYear || new Date().getFullYear(),
    filingStatus: baseline.filingStatus || 'single',
    grossIncome: baselineGrossIncome,
    ...mapEstimateToCalcInput(baseline),
  });

  const baselineWithheld = (baseline.federalWithheld || 0) + (baseline.stateWithheld || 0);
  const baselineRefund = baselineWithheld - baselineResult.total.totalTax;

  // Calculate each scenario
  const scenarioResults = await Promise.all(
    scenarios.map(async (scenario: EstimateRequest & { name?: string }, index: number) => {
      const scenarioGrossIncome = calculateGrossIncome(scenario);
      const result = await calculateTax({
        taxYear: scenario.taxYear || baseline.taxYear || new Date().getFullYear(),
        filingStatus: scenario.filingStatus || baseline.filingStatus || 'single',
        grossIncome: scenarioGrossIncome,
        ...mapEstimateToCalcInput(scenario),
      });

      const withheld = (scenario.federalWithheld ?? baseline.federalWithheld ?? 0) +
                      (scenario.stateWithheld ?? baseline.stateWithheld ?? 0);
      const refund = withheld - result.total.totalTax;

      return {
        name: scenario.name || `Scenario ${index + 1}`,
        totalTax: result.total.totalTax,
        totalWithheld: withheld,
        refundOrOwed: Math.abs(refund),
        isRefund: refund > 0,
        effectiveRate: result.total.effectiveRate,
        differenceFromBaseline: refund - baselineRefund,
        percentChange: baselineRefund !== 0
          ? ((refund - baselineRefund) / Math.abs(baselineRefund)) * 100
          : 0,
      };
    })
  );

  res.json({
    success: true,
    data: {
      baseline: {
        name: 'Current Situation',
        totalTax: baselineResult.total.totalTax,
        totalWithheld: baselineWithheld,
        refundOrOwed: Math.abs(baselineRefund),
        isRefund: baselineRefund > 0,
        effectiveRate: baselineResult.total.effectiveRate,
      },
      scenarios: scenarioResults,
      bestScenario: scenarioResults.reduce((best, current) =>
        current.differenceFromBaseline > best.differenceFromBaseline ? current : best
      ),
    },
  });
}));

/**
 * @api {post} /api/tax/estimate/quarterly Quarterly Estimated Tax
 * @apiName QuarterlyEstimate
 * @apiGroup TaxEstimate
 * @apiVersion 1.0.0
 * @apiDescription Calculates quarterly estimated tax payments needed to avoid penalties.
 */
router.post('/quarterly', asyncHandler(async (req, res) => {
  const data: EstimateRequest & { priorYearTax?: number } = req.body;

  const grossIncome = calculateGrossIncome(data);
  const result = await calculateTax({
    taxYear: data.taxYear || new Date().getFullYear(),
    filingStatus: data.filingStatus || 'single',
    grossIncome,
    ...mapEstimateToCalcInput(data),
  });

  // Calculate required quarterly payments
  // Safe harbor: Lesser of 90% of current year tax or 100% of prior year tax (110% if AGI > $150k)
  const currentYearTax = result.total.totalTax;
  const priorYearTax = data.priorYearTax || 0;
  const agiThreshold = data.filingStatus === 'married_jointly' ? 150000 : 75000;
  const priorYearMultiplier = result.federal.adjustedGrossIncome > agiThreshold ? 1.10 : 1.00;

  const safeHarborOptions = {
    currentYear90: currentYearTax * 0.90,
    priorYear100: priorYearTax * priorYearMultiplier,
  };

  const requiredAnnual = priorYearTax > 0
    ? Math.min(safeHarborOptions.currentYear90, safeHarborOptions.priorYear100)
    : safeHarborOptions.currentYear90;

  const quarterlyPayment = Math.ceil(requiredAnnual / 4);

  // Quarterly due dates (typically April 15, June 15, Sept 15, Jan 15)
  const year = data.taxYear || new Date().getFullYear();
  const dueDates = [
    `${year}-04-15`,
    `${year}-06-15`,
    `${year}-09-15`,
    `${year + 1}-01-15`,
  ];

  res.json({
    success: true,
    data: {
      estimatedAnnualTax: currentYearTax,
      safeHarborAmount: requiredAnnual,
      quarterlyPayment,
      totalAnnualPayments: quarterlyPayment * 4,
      quarters: dueDates.map((date, index) => ({
        quarter: index + 1,
        dueDate: date,
        amount: quarterlyPayment,
      })),
      method: priorYearTax > 0 ? 'Safe harbor (prior year method)' : '90% of current year tax',
      notes: [
        'Payments are due by the dates shown to avoid underpayment penalties',
        'If income is uneven throughout the year, consider the annualized income method',
        'State quarterly payments may also be required',
      ],
    },
  });
}));

/**
 * @api {get} /api/tax/estimate/:returnId Get Estimate for Saved Return
 * @apiName GetReturnEstimate
 * @apiGroup TaxEstimate
 * @apiVersion 1.0.0
 * @apiDescription Retrieves a tax estimate for a saved tax return.
 */
router.get('/:returnId', asyncHandler(async (req, res) => {
  const { returnId } = req.params;

  // Fetch tax return with documents
  const { data: taxReturn, error } = await supabaseAdmin
    .from('tax_returns')
    .select('*, tax_documents(*)')
    .eq('id', returnId)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !taxReturn) {
    throw new NotFoundError('Tax return');
  }

  // Build estimate from saved data
  const formsData = taxReturn.forms_data || {};

  // Extract data from forms
  const wages = formsData.income?.wages || 0;
  const selfEmploymentIncome = formsData.income?.selfEmployment || 0;
  const federalWithheld = formsData.withholding?.federal || 0;
  const stateWithheld = formsData.withholding?.state || 0;

  const grossIncome = (
    wages +
    selfEmploymentIncome +
    (formsData.income?.interest || 0) +
    (formsData.income?.dividends || 0) +
    (formsData.income?.capitalGains || 0) +
    (formsData.income?.other || 0)
  );

  const calcInput: TaxCalculationInput = {
    taxYear: taxReturn.tax_year,
    filingStatus: taxReturn.filing_status || 'single',
    grossIncome,
    selfEmploymentIncome,
    retirementContributions: formsData.adjustments?.retirement || 0,
    studentLoanInterest: formsData.adjustments?.studentLoan || 0,
    healthSavingsContributions: formsData.adjustments?.hsa || 0,
    qualifyingChildren: formsData.dependents?.qualifyingChildren || 0,
    itemizedDeductions: formsData.deductions?.itemized || 0,
  };

  const result = await calculateTax(calcInput);

  const totalWithheld = federalWithheld + stateWithheld;
  const refundOrOwed = totalWithheld - result.total.totalTax;

  res.json({
    success: true,
    data: {
      taxReturnId: returnId,
      taxYear: taxReturn.tax_year,
      status: taxReturn.status,
      estimate: {
        federalTax: result.total.federalTax,
        stateTax: result.total.stateTax,
        totalTax: result.total.totalTax,
        totalWithheld,
        refundOrOwed: Math.abs(refundOrOwed),
        isRefund: refundOrOwed > 0,
        effectiveRate: result.total.effectiveRate,
      },
      completeness: calculateCompleteness(formsData),
      lastUpdated: taxReturn.updated_at,
    },
  });
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate gross income from estimate request components
 */
function calculateGrossIncome(data: EstimateRequest): number {
  return (
    (data.wages || 0) +
    (data.selfEmploymentIncome || 0) +
    (data.interestIncome || 0) +
    (data.dividendIncome || 0) +
    (data.capitalGains || 0) +
    (data.otherIncome || 0)
  );
}

/**
 * Map estimate request to calculation input
 */
function mapEstimateToCalcInput(data: EstimateRequest): Partial<TaxCalculationInput> {
  return {
    stateCode: data.stateCode,
    selfEmploymentIncome: data.selfEmploymentIncome,
    capitalGains: data.capitalGains,
    retirementContributions: data.retirementContributions,
    studentLoanInterest: data.studentLoanInterest,
    healthSavingsContributions: data.healthSavingsContributions,
    qualifyingChildren: data.qualifyingChildren,
    dependents: data.dependents,
    childCareCosts: data.childCareCosts,
    itemizedDeductions: data.itemizedDeductions,
    educationExpenses: data.educationExpenses,
    aotcEligibleStudents: data.aotcEligibleStudents,
    tuitionPerStudent: data.tuitionPerStudent,
    residentialCleanEnergyExpenses: data.residentialCleanEnergyExpenses,
    energyEfficientImprovements: data.energyEfficientImprovements,
  };
}

/**
 * Generate tax optimization suggestions
 */
function generateSuggestions(data: EstimateRequest, result: TaxCalculationResult): TaxSuggestion[] {
  const suggestions: TaxSuggestion[] = [];
  const agi = result.federal.adjustedGrossIncome;

  // Retirement contribution suggestion
  const currentRetirement = data.retirementContributions || 0;
  const maxRetirement = 23000; // 401k limit 2024
  if (currentRetirement < maxRetirement && agi > 50000) {
    const additionalContribution = Math.min(maxRetirement - currentRetirement, agi * 0.1);
    const potentialSavings = Math.round(additionalContribution * (result.federal.marginalRate / 100));
    if (potentialSavings > 100) {
      suggestions.push({
        type: 'adjustment',
        title: 'Increase Retirement Contributions',
        description: `Contributing an additional $${additionalContribution.toLocaleString()} to your 401(k) could reduce your taxable income.`,
        potentialSavings,
        actionRequired: 'Increase 401(k) or IRA contributions before year-end',
        priority: potentialSavings > 1000 ? 'high' : 'medium',
      });
    }
  }

  // HSA contribution suggestion
  const currentHSA = data.healthSavingsContributions || 0;
  const maxHSA = data.filingStatus === 'married_jointly' ? 8300 : 4150;
  if (currentHSA < maxHSA && agi > 30000) {
    const additionalHSA = maxHSA - currentHSA;
    const potentialSavings = Math.round(additionalHSA * (result.federal.marginalRate / 100));
    if (potentialSavings > 50) {
      suggestions.push({
        type: 'adjustment',
        title: 'Maximize HSA Contributions',
        description: `If eligible for an HSA, contributing the full $${maxHSA.toLocaleString()} can provide triple tax benefits.`,
        potentialSavings,
        actionRequired: 'Verify HSA eligibility and contribute before April 15',
        priority: 'medium',
      });
    }
  }

  // Itemized vs Standard deduction
  const standardDeduction = result.federal.deductions;
  const itemized = data.itemizedDeductions || 0;
  if (itemized > 0 && itemized < standardDeduction * 0.9) {
    suggestions.push({
      type: 'deduction',
      title: 'Consider Standard Deduction',
      description: `Your itemized deductions ($${itemized.toLocaleString()}) are below the standard deduction ($${standardDeduction.toLocaleString()}). Using the standard deduction could be better.`,
      potentialSavings: Math.round((standardDeduction - itemized) * (result.federal.marginalRate / 100)),
      actionRequired: 'Review and compare deduction methods',
      priority: 'low',
    });
  }

  // Child Tax Credit reminder
  if ((data.qualifyingChildren || 0) === 0 && agi < 100000) {
    suggestions.push({
      type: 'credit',
      title: 'Verify Dependent Information',
      description: 'Make sure all qualifying children and dependents are claimed. The Child Tax Credit can be worth up to $2,000 per child.',
      potentialSavings: 2000,
      actionRequired: 'Review dependent eligibility rules',
      priority: 'medium',
    });
  }

  // Education credit reminder
  if ((data.educationExpenses || 0) > 0 && (data.aotcEligibleStudents || 0) === 0) {
    suggestions.push({
      type: 'credit',
      title: 'Claim Education Credits',
      description: 'You have education expenses but no education credits entered. The American Opportunity Credit can be worth up to $2,500 per student.',
      potentialSavings: 2500,
      actionRequired: 'Enter eligible students and expenses',
      priority: 'high',
    });
  }

  // Withholding adjustment suggestion
  const totalWithheld = (data.federalWithheld || 0) + (data.stateWithheld || 0);
  const totalTax = result.total.totalTax;
  const refund = totalWithheld - totalTax;

  if (refund > 2000) {
    suggestions.push({
      type: 'planning',
      title: 'Adjust Your Withholding',
      description: `You're on track for a ${`$${Math.abs(refund).toLocaleString()}`} refund. Consider adjusting your W-4 to receive more in each paycheck.`,
      potentialSavings: 0,
      actionRequired: 'Submit updated W-4 to employer',
      priority: 'low',
    });
  } else if (refund < -1000) {
    suggestions.push({
      type: 'planning',
      title: 'Increase Withholding',
      description: `You may owe ${`$${Math.abs(refund).toLocaleString()}`}. Consider increasing your withholding to avoid a large tax bill.`,
      potentialSavings: 0,
      actionRequired: 'Submit updated W-4 to employer or make estimated payments',
      priority: 'high',
    });
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
}

/**
 * Calculate return completeness percentage
 */
function calculateCompleteness(formsData: Record<string, unknown>): number {
  const sections = ['income', 'withholding', 'adjustments', 'deductions', 'dependents', 'credits'];
  let completedSections = 0;

  for (const section of sections) {
    if (formsData[section] && Object.keys(formsData[section] as object).length > 0) {
      completedSections++;
    }
  }

  return Math.round((completedSections / sections.length) * 100);
}

export default router;
