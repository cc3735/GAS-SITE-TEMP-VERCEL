import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, optionalAuth } from '../../middleware/auth.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';
import { childSupportCalculationSchema, stateCodeSchema } from '../../utils/validation.js';
import { logger } from '../../utils/logger.js';
import type {
  CalculationInput,
  CalculationResult,
  StateGuidelines,
  ParentData,
  ChildData,
} from '../../types/child-support.js';

const router = Router();

// Cache for state guidelines (refreshed every hour)
let guidelinesCache: Map<string, StateGuidelines> = new Map();
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

// Fetch guidelines from database with caching
async function getStateGuidelines(stateCode: string): Promise<StateGuidelines | null> {
  const now = Date.now();
  
  // Check cache first
  if (now - cacheTimestamp < CACHE_DURATION && guidelinesCache.has(stateCode)) {
    return guidelinesCache.get(stateCode) || null;
  }

  // Fetch from database
  const { data, error } = await supabaseAdmin
    .from('lf_child_support_guidelines')
    .select('*')
    .eq('state_code', stateCode)
    .single();

  if (error || !data) {
    logger.warn(`No guidelines found for state: ${stateCode}`);
    return null;
  }

  // Transform database record to StateGuidelines format
  const guidelines: StateGuidelines = {
    stateCode: data.state_code,
    stateName: data.state_name,
    version: data.effective_date || '2024',
    effectiveDate: data.effective_date || '2024-01-01',
    model: data.model_type as 'income_shares' | 'percentage_of_income' | 'melson_formula',
    minimumIncome: 0,
    maximumIncome: data.high_income_cap || 360000,
    lowIncomeThreshold: data.low_income_threshold || 1000,
    selfSupportReserve: data.self_support_reserve || 1000,
    parentingTimeThreshold: 0,
    parentingTimeAdjustmentFormula: '',
    healthInsuranceTreatment: 'add_on',
    childCareTreatment: 'add_on',
    recognizedDeviations: data.deviation_factors || [],
    guidelinesUrl: data.source_url || '',
    percentageRates: data.per_child_percentages 
      ? Object.entries(data.per_child_percentages).map(([num, pct]) => ({
          numberOfChildren: parseInt(num),
          percentage: (pct as number) * 100,
        }))
      : undefined,
    incomeSharesSchedule: data.income_shares_schedule,
    specialRules: data.special_rules,
    healthcareAllocation: data.healthcare_allocation,
    childcareAllocation: data.childcare_allocation,
  };

  // Update cache
  guidelinesCache.set(stateCode, guidelines);
  cacheTimestamp = now;

  return guidelines;
}

// Fetch all available states from database
async function getAllStates(): Promise<Array<{ code: string; name: string; model: string; guidelinesUrl: string }>> {
  const { data, error } = await supabaseAdmin
    .from('lf_child_support_guidelines')
    .select('state_code, state_name, model_type, source_url')
    .order('state_name');

  if (error || !data) {
    logger.error('Failed to fetch states from database', { error });
    return [];
  }

  return data.map(state => ({
    code: state.state_code,
    name: state.state_name,
    model: state.model_type,
    guidelinesUrl: state.source_url || '',
  }));
}

// Get basic support obligation based on state model
function getBasicSupportObligation(
  combinedIncome: number,
  numberOfChildren: number,
  guidelines: StateGuidelines
): number {
  // Percentage of income model (TX, MS, ND, NV, WI)
  if (guidelines.model === 'percentage_of_income' && guidelines.percentageRates) {
    const rate = guidelines.percentageRates.find(
      (r) => r.numberOfChildren === Math.min(numberOfChildren, 6)
    );
    return combinedIncome * ((rate?.percentage || 20) / 100);
  }

  // Melson formula (DE) - simplified implementation
  if (guidelines.model === 'melson_formula') {
    const selfSupportReserve = guidelines.selfSupportReserve || 1255;
    const availableIncome = Math.max(0, combinedIncome - selfSupportReserve * 2);
    const basePercentages: Record<number, number> = {
      1: 0.17, 2: 0.25, 3: 0.30, 4: 0.34, 5: 0.37, 6: 0.39,
    };
    return availableIncome * (basePercentages[Math.min(numberOfChildren, 6)] || 0.39);
  }

  // Income shares model (most states) - use percentage rates if available
  if (guidelines.percentageRates) {
    const rate = guidelines.percentageRates.find(
      (r) => r.numberOfChildren === Math.min(numberOfChildren, 6)
    );
    if (rate) {
      return combinedIncome * (rate.percentage / 100);
    }
  }

  // Default income shares calculation
  const basePercentages: Record<number, number> = {
    1: 0.20,
    2: 0.28,
    3: 0.32,
    4: 0.35,
    5: 0.37,
    6: 0.38,
  };

  let percentage = basePercentages[Math.min(numberOfChildren, 6)] || 0.38;
  
  // Adjust for high income (simplified)
  if (combinedIncome > 15000) {
    percentage *= 0.90;
  } else if (combinedIncome > 10000) {
    percentage *= 0.95;
  }

  return combinedIncome * percentage;
}

// Calculate adjusted income
function calculateAdjustedIncome(parent: ParentData): number {
  let adjusted = parent.grossMonthlyIncome + (parent.otherIncome || 0);
  
  // Apply deductions
  for (const deduction of parent.deductions || []) {
    adjusted -= deduction.amount;
  }

  // Deduct other child support paid
  adjusted -= parent.otherChildSupport || 0;

  return Math.max(0, adjusted);
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Calculate child support (public - limited per month for free users)
router.post('/calculate', optionalAuth, asyncHandler(async (req, res) => {
  const validation = childSupportCalculationSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const input = validation.data as unknown as CalculationInput;
  const { stateCode, parent1Data, parent2Data, childrenData } = input;

  // Fetch state guidelines from database
  const guidelines = await getStateGuidelines(stateCode);
  if (!guidelines) {
    // Get available states for error message
    const availableStates = await getAllStates();
    const stateList = availableStates.map(s => s.code).join(', ');
    throw new ValidationError(
      `State ${stateCode} is not currently supported. Supported states: ${stateList || 'Please run database migrations to seed state data.'}`
    );
  }

  // Check usage limits for free users
  if (req.user) {
    const tier = req.user.subscriptionTier;
    if (tier === 'free') {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabaseAdmin
        .from('lf_child_support_calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (count && count >= 5) {
        throw new AuthorizationError('Free tier limit reached (5 calculations/month). Please upgrade to continue.');
      }
    }
  }

  // Calculate adjusted incomes
  const parent1Adjusted = calculateAdjustedIncome(parent1Data as ParentData);
  const parent2Adjusted = calculateAdjustedIncome(parent2Data as ParentData);
  const combinedIncome = parent1Adjusted + parent2Adjusted;

  // Calculate income percentages
  const parent1Percentage = combinedIncome > 0 ? parent1Adjusted / combinedIncome : 0.5;
  const parent2Percentage = combinedIncome > 0 ? parent2Adjusted / combinedIncome : 0.5;

  // Calculate basic support obligation
  const numberOfChildren = childrenData.length;
  const basicSupport = getBasicSupportObligation(combinedIncome, numberOfChildren, guidelines);

  // Calculate add-ons
  let healthInsuranceAddOn = 0;
  let childCareAddOn = 0;

  for (const child of childrenData as ChildData[]) {
    if (child.healthInsuranceCost) {
      healthInsuranceAddOn += child.healthInsuranceCost;
    }
    if (child.childCareCost) {
      childCareAddOn += child.childCareCost;
    }
  }

  // Add parent health insurance costs (portion for children)
  healthInsuranceAddOn += (parent1Data.healthInsuranceCost || 0) + (parent2Data.healthInsuranceCost || 0);

  // Add parent childcare costs
  childCareAddOn += (parent1Data.childCareCost || 0) + (parent2Data.childCareCost || 0);

  const totalSupport = basicSupport + healthInsuranceAddOn + childCareAddOn;

  // Calculate parenting time percentages
  const parent1Overnights = parent1Data.overnightsPerYear || 0;
  const parent2Overnights = parent2Data.overnightsPerYear || 365 - parent1Overnights;
  const parent1OvernightPct = parent1Overnights / 365;
  const parent2OvernightPct = parent2Overnights / 365;

  // Calculate each parent's obligation
  const parent1Obligation = totalSupport * parent1Percentage;
  const parent2Obligation = totalSupport * parent2Percentage;

  // Determine who pays (parent with less custody time pays the other)
  let netSupportAmount: number;
  let payingParent: 'parent1' | 'parent2';

  if (parent1OvernightPct < parent2OvernightPct) {
    // Parent 1 has less time, likely pays
    netSupportAmount = parent1Obligation - (parent2Obligation * (parent1OvernightPct / parent2OvernightPct));
    payingParent = 'parent1';
  } else {
    // Parent 2 has less time, likely pays
    netSupportAmount = parent2Obligation - (parent1Obligation * (parent2OvernightPct / parent1OvernightPct));
    payingParent = 'parent2';
  }

  // Ensure positive amount
  if (netSupportAmount < 0) {
    netSupportAmount = Math.abs(netSupportAmount);
    payingParent = payingParent === 'parent1' ? 'parent2' : 'parent1';
  }

  // Round to nearest dollar
  netSupportAmount = Math.round(netSupportAmount);

  // Build result
  const result: CalculationResult = {
    stateCode,
    guidelinesVersion: guidelines.version,
    calculatedAt: new Date().toISOString(),
    parent1AdjustedIncome: Math.round(parent1Adjusted),
    parent2AdjustedIncome: Math.round(parent2Adjusted),
    combinedIncome: Math.round(combinedIncome),
    parent1IncomePercentage: Math.round(parent1Percentage * 100),
    parent2IncomePercentage: Math.round(parent2Percentage * 100),
    basicSupportObligation: Math.round(basicSupport),
    healthInsuranceAddOn: Math.round(healthInsuranceAddOn),
    childCareAddOn: Math.round(childCareAddOn),
    otherAddOns: 0,
    totalSupportObligation: Math.round(totalSupport),
    parent1OvernightPercentage: Math.round(parent1OvernightPct * 100),
    parent2OvernightPercentage: Math.round(parent2OvernightPct * 100),
    parentingTimeAdjustment: 0,
    parent1Obligation: Math.round(parent1Obligation),
    parent2Obligation: Math.round(parent2Obligation),
    netSupportAmount,
    payingParent,
    perChildBreakdown: childrenData.map((child: ChildData, index: number) => ({
      childName: child.name || `Child ${index + 1}`,
      childAge: calculateAge(child.dateOfBirth),
      baseSupportAmount: Math.round(basicSupport / numberOfChildren),
      healthInsuranceShare: Math.round(healthInsuranceAddOn / numberOfChildren),
      childCareShare: Math.round(childCareAddOn / numberOfChildren),
      otherExpensesShare: 0,
      totalForChild: Math.round(totalSupport / numberOfChildren),
    })),
    warnings: [],
    notes: [
      `Calculation based on ${guidelines.stateName} ${guidelines.model.replace(/_/g, ' ')} model`,
      'This is an estimate based on state guidelines',
      'Actual court-ordered amount may differ',
      'Consult an attorney for legal advice',
    ],
  };

  // Add warnings
  if (guidelines.maximumIncome && combinedIncome > guidelines.maximumIncome) {
    result.warnings.push(`Combined monthly income exceeds guideline maximum ($${guidelines.maximumIncome.toLocaleString()}) - court discretion applies`);
  }

  if (guidelines.lowIncomeThreshold && (parent1Adjusted < guidelines.lowIncomeThreshold || parent2Adjusted < guidelines.lowIncomeThreshold)) {
    result.warnings.push('One or both parents below low-income threshold - adjustments may apply');
  }

  // Save calculation if user is authenticated
  if (req.user) {
    const { data: saved } = await supabaseAdmin
      .from('lf_child_support_calculations')
      .insert({
        user_id: req.user.id,
        state_code: stateCode,
        calculation_type: input.calculationType,
        parent1_data: parent1Data,
        parent2_data: parent2Data,
        children_data: childrenData,
        calculation_result: result,
        guidelines_version: guidelines.version,
        legal_filing_id: input.legalFilingId || null,
      })
      .select('id')
      .single();

    result.id = saved?.id;
  }

  res.json({
    success: true,
    data: {
      result,
      guidelines: {
        state: guidelines.stateName,
        model: guidelines.model,
        guidelinesUrl: guidelines.guidelinesUrl,
        recognizedDeviations: guidelines.recognizedDeviations,
      },
    },
  });
}));

// Get calculation history
router.get('/calculations', authenticate, asyncHandler(async (req, res) => {
  const { limit = 20, offset = 0 } = req.query;

  const { data: calculations, count, error } = await supabaseAdmin
    .from('lf_child_support_calculations')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (error) {
    throw new ValidationError('Failed to fetch calculations');
  }

  res.json({
    success: true,
    data: {
      calculations: (calculations || []).map((c) => ({
        id: c.id,
        stateCode: c.state_code,
        calculationType: c.calculation_type,
        result: c.calculation_result,
        createdAt: c.created_at,
        linkedFilingId: c.legal_filing_id,
      })),
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
      },
    },
  });
}));

// Get single calculation
router.get('/calculations/:id', authenticate, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: calculation, error } = await supabaseAdmin
    .from('lf_child_support_calculations')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !calculation) {
    throw new NotFoundError('Calculation');
  }

  res.json({
    success: true,
    data: {
      id: calculation.id,
      stateCode: calculation.state_code,
      calculationType: calculation.calculation_type,
      parent1Data: calculation.parent1_data,
      parent2Data: calculation.parent2_data,
      childrenData: calculation.children_data,
      result: calculation.calculation_result,
      guidelinesVersion: calculation.guidelines_version,
      createdAt: calculation.created_at,
    },
  });
}));

// Get state guidelines
router.get('/guidelines/:state', asyncHandler(async (req, res) => {
  const { state } = req.params;

  const stateValidation = stateCodeSchema.safeParse(state.toUpperCase());
  if (!stateValidation.success) {
    throw new ValidationError('Invalid state code');
  }

  const guidelines = await getStateGuidelines(state.toUpperCase());

  if (!guidelines) {
    const availableStates = await getAllStates();
    throw new NotFoundError(
      `Guidelines for state ${state}. Available states: ${availableStates.map(s => s.code).join(', ')}`
    );
  }

  res.json({
    success: true,
    data: guidelines,
  });
}));

// Get all supported states
router.get('/states', asyncHandler(async (_req, res) => {
  const states = await getAllStates();

  res.json({
    success: true,
    data: {
      states,
      totalStates: states.length,
    },
  });
}));

// Clear cache endpoint (admin only - useful for after data updates)
router.post('/clear-cache', authenticate, asyncHandler(async (req, res) => {
  // Check if user is admin (simplified - in production, use proper role check)
  if (req.user?.subscriptionTier !== 'enterprise') {
    throw new AuthorizationError('Admin access required');
  }

  guidelinesCache.clear();
  cacheTimestamp = 0;

  logger.info('Child support guidelines cache cleared');

  res.json({
    success: true,
    message: 'Cache cleared successfully',
  });
}));

export default router;
