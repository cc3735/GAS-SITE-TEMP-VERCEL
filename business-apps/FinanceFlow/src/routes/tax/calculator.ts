/**
 * Tax Calculator Routes
 * 
 * Provides endpoints for real-time tax calculations using database-driven
 * federal and state tax brackets, deductions, and credits.
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { optionalAuth, authenticate } from '../../middleware/auth.js';
import { ValidationError, AuthorizationError } from '../../utils/errors.js';
import { calculateTax, getAvailableStates, clearTaxCache } from '../../services/tax/tax-calculator.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import { z } from 'zod';

const router = Router();

// Validation schema for tax calculation input
const taxCalculationSchema = z.object({
  taxYear: z.number().min(2020).max(2030).default(2024),
  filingStatus: z.enum(['single', 'married_jointly', 'married_separately', 'head_of_household']),
  grossIncome: z.number().min(0),
  stateCode: z.string().length(2).optional(),
  adjustments: z.number().min(0).optional(),
  itemizedDeductions: z.number().min(0).optional(),
  qualifyingChildren: z.number().min(0).max(10).optional(),
  dependents: z.number().min(0).max(20).optional(),
  selfEmploymentIncome: z.number().min(0).optional(),
  capitalGains: z.number().min(0).optional(),
  retirementContributions: z.number().min(0).optional(),
  studentLoanInterest: z.number().min(0).optional(),
  healthSavingsContributions: z.number().min(0).optional(),
  childCareCosts: z.number().min(0).optional(),
  educationExpenses: z.number().min(0).optional(),
});

// Calculate federal and state taxes
router.post('/calculate', optionalAuth, asyncHandler(async (req, res) => {
  const validation = taxCalculationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const input = validation.data;

  // Check usage limits for free users
  if (req.user) {
    const tier = req.user.subscriptionTier;
    if (tier === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from('lf_ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('service_type', 'tax_calculation')
        .gte('created_at', startOfMonth.toISOString());

      if (count && count >= 10) {
        throw new AuthorizationError('Free tier limit reached (10 calculations/month). Please upgrade to continue.');
      }
    }
  }

  const result = await calculateTax({
    taxYear: input.taxYear,
    filingStatus: input.filingStatus,
    grossIncome: input.grossIncome,
    stateCode: input.stateCode,
    adjustments: input.adjustments,
    itemizedDeductions: input.itemizedDeductions,
    qualifyingChildren: input.qualifyingChildren,
    dependents: input.dependents,
    selfEmploymentIncome: input.selfEmploymentIncome,
    capitalGains: input.capitalGains,
    retirementContributions: input.retirementContributions,
    studentLoanInterest: input.studentLoanInterest,
    healthSavingsContributions: input.healthSavingsContributions,
    childCareCosts: input.childCareCosts,
    educationExpenses: input.educationExpenses,
  });

  // Log usage if authenticated
  if (req.user) {
    await supabaseAdmin
      .from('lf_ai_usage_logs')
      .insert({
        user_id: req.user.id,
        service_type: 'tax_calculation',
        ai_model: 'tax_calculator_v1',
        prompt_tokens: 0,
        completion_tokens: 0,
        total_cost: 0,
      });
  }

  res.json({
    success: true,
    data: result,
  });
}));

// Get available states for tax year
router.get('/states/:year?', asyncHandler(async (req, res) => {
  const taxYear = parseInt(req.params.year || '2024');
  
  if (isNaN(taxYear) || taxYear < 2020 || taxYear > 2030) {
    throw new ValidationError('Invalid tax year');
  }

  const states = await getAvailableStates(taxYear);

  // Group by income tax status
  const withTax = states.filter(s => s.hasIncomeTax);
  const noTax = states.filter(s => !s.hasIncomeTax);

  res.json({
    success: true,
    data: {
      taxYear,
      statesWithIncomeTax: withTax,
      statesWithoutIncomeTax: noTax,
      totalStates: states.length,
    },
  });
}));

// Get federal tax brackets
router.get('/brackets/federal/:year?', asyncHandler(async (req, res) => {
  const taxYear = parseInt(req.params.year || '2024');
  const { filingStatus } = req.query;

  if (isNaN(taxYear) || taxYear < 2020 || taxYear > 2030) {
    throw new ValidationError('Invalid tax year');
  }

  const statuses = filingStatus 
    ? [filingStatus as string]
    : ['single', 'married_jointly', 'married_separately', 'head_of_household'];

  const results: Record<string, unknown[]> = {};

  for (const status of statuses) {
    const { data } = await supabaseAdmin
      .from('lf_federal_tax_brackets')
      .select('*')
      .eq('tax_year', taxYear)
      .eq('filing_status', status)
      .order('min_income', { ascending: true });

    results[status] = (data || []).map(b => ({
      minIncome: parseFloat(b.min_income),
      maxIncome: b.max_income ? parseFloat(b.max_income) : null,
      rate: parseFloat(b.rate) * 100,
      baseTax: parseFloat(b.base_tax || '0'),
    }));
  }

  res.json({
    success: true,
    data: {
      taxYear,
      brackets: results,
    },
  });
}));

// Get state tax brackets
router.get('/brackets/state/:stateCode/:year?', asyncHandler(async (req, res) => {
  const { stateCode } = req.params;
  const taxYear = parseInt(req.params.year || '2024');
  const { filingStatus } = req.query;

  if (isNaN(taxYear) || taxYear < 2020 || taxYear > 2030) {
    throw new ValidationError('Invalid tax year');
  }

  if (!stateCode || stateCode.length !== 2) {
    throw new ValidationError('Invalid state code');
  }

  // Get state config
  const { data: config } = await supabaseAdmin
    .from('lf_state_tax_config')
    .select('*')
    .eq('state_code', stateCode.toUpperCase())
    .eq('tax_year', taxYear)
    .single();

  if (!config) {
    throw new ValidationError(`No tax data found for ${stateCode} in ${taxYear}`);
  }

  const response: Record<string, unknown> = {
    stateCode: config.state_code,
    stateName: config.state_name,
    taxYear,
    hasIncomeTax: config.has_income_tax,
    taxType: config.tax_type,
    flatRate: config.flat_rate ? parseFloat(config.flat_rate) * 100 : null,
    standardDeductions: {
      single: config.standard_deduction_single ? parseFloat(config.standard_deduction_single) : null,
      marriedJointly: config.standard_deduction_married ? parseFloat(config.standard_deduction_married) : null,
      headOfHousehold: config.standard_deduction_hoh ? parseFloat(config.standard_deduction_hoh) : null,
    },
    personalExemption: config.personal_exemption ? parseFloat(config.personal_exemption) : null,
    specialRules: config.special_rules,
  };

  // Get brackets if progressive
  if (config.tax_type === 'progressive') {
    const statuses = filingStatus 
      ? [filingStatus as string]
      : ['single', 'married_jointly'];

    const brackets: Record<string, unknown[]> = {};

    for (const status of statuses) {
      const { data } = await supabaseAdmin
        .from('lf_state_tax_brackets')
        .select('*')
        .eq('state_code', stateCode.toUpperCase())
        .eq('tax_year', taxYear)
        .eq('filing_status', status)
        .order('min_income', { ascending: true });

      brackets[status] = (data || []).map(b => ({
        minIncome: parseFloat(b.min_income),
        maxIncome: b.max_income ? parseFloat(b.max_income) : null,
        rate: parseFloat(b.rate) * 100,
        baseTax: parseFloat(b.base_tax || '0'),
      }));
    }

    response.brackets = brackets;
  }

  res.json({
    success: true,
    data: response,
  });
}));

// Get federal deductions
router.get('/deductions/:year?', asyncHandler(async (req, res) => {
  const taxYear = parseInt(req.params.year || '2024');

  if (isNaN(taxYear) || taxYear < 2020 || taxYear > 2030) {
    throw new ValidationError('Invalid tax year');
  }

  const { data } = await supabaseAdmin
    .from('lf_federal_deductions')
    .select('*')
    .eq('tax_year', taxYear);

  res.json({
    success: true,
    data: {
      taxYear,
      deductions: (data || []).map(d => ({
        type: d.deduction_type,
        filingStatus: d.filing_status,
        amount: d.amount ? parseFloat(d.amount) : null,
        phaseOutStart: d.phase_out_start ? parseFloat(d.phase_out_start) : null,
        phaseOutEnd: d.phase_out_end ? parseFloat(d.phase_out_end) : null,
        description: d.description,
      })),
    },
  });
}));

// Get federal credits
router.get('/credits/:year?', asyncHandler(async (req, res) => {
  const taxYear = parseInt(req.params.year || '2024');

  if (isNaN(taxYear) || taxYear < 2020 || taxYear > 2030) {
    throw new ValidationError('Invalid tax year');
  }

  const { data } = await supabaseAdmin
    .from('lf_federal_credits')
    .select('*')
    .eq('tax_year', taxYear);

  res.json({
    success: true,
    data: {
      taxYear,
      credits: (data || []).map(c => ({
        type: c.credit_type,
        maxAmount: c.max_amount ? parseFloat(c.max_amount) : null,
        phaseOutStart: c.phase_out_start ? parseFloat(c.phase_out_start) : null,
        phaseOutEnd: c.phase_out_end ? parseFloat(c.phase_out_end) : null,
        refundable: c.refundable,
        description: c.description,
        eligibilityRules: c.eligibility_rules,
        calculationRules: c.calculation_rules,
      })),
    },
  });
}));

// Clear cache (admin only)
router.post('/clear-cache', authenticate, asyncHandler(async (req, res) => {
  if (req.user?.subscriptionTier !== 'enterprise') {
    throw new AuthorizationError('Admin access required');
  }

  clearTaxCache();

  res.json({
    success: true,
    message: 'Tax cache cleared successfully',
  });
}));

export default router;

