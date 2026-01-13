/**
 * Business Tax Routes
 *
 * API endpoints for business tax functionality:
 * - Schedule C (Sole Proprietor)
 * - Form 1065 (Partnership)
 * - Form 1120-S (S-Corporation)
 * - Quarterly estimated taxes
 * - Self-employment tax calculations
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/async.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import {
  businessTaxService,
  businessTaxCalculator,
  BusinessEntityType,
  ScheduleCData,
} from '../../services/tax/business-tax.js';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Business Return Management
// ============================================================================

/**
 * @api {post} /api/tax/business/returns Create Business Tax Return
 * @apiName CreateBusinessReturn
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 *
 * @apiDescription Creates a new business tax return for the specified entity type.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} entityType Type of business entity
 * @apiBody {Number} taxYear Tax year for the return
 * @apiBody {String} businessName Name of the business
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Created return information
 */
router.post('/returns', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { entityType, taxYear, businessName } = req.body;

  if (!entityType || !taxYear || !businessName) {
    throw new ValidationError('Entity type, tax year, and business name are required');
  }

  const validEntityTypes: BusinessEntityType[] = [
    'sole_proprietorship',
    'single_member_llc',
    'partnership',
    'multi_member_llc',
    's_corporation',
    'c_corporation',
  ];

  if (!validEntityTypes.includes(entityType)) {
    throw new ValidationError(`Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`);
  }

  const result = await businessTaxService.createBusinessReturn(
    userId,
    entityType,
    taxYear,
    businessName
  );

  res.status(201).json({
    success: true,
    data: result,
  });
}));

/**
 * @api {get} /api/tax/business/returns List Business Tax Returns
 * @apiName ListBusinessReturns
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/returns', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxYear } = req.query;

  let query = supabase
    .from('business_tax_returns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (taxYear) {
    query = query.eq('tax_year', parseInt(taxYear as string));
  }

  const { data: returns, error } = await query;

  if (error) {
    logger.error('Failed to list business returns:', error);
    throw new Error('Failed to retrieve business returns');
  }

  res.json({
    success: true,
    data: {
      returns: returns.map(r => ({
        id: r.id,
        businessName: r.business_name,
        entityType: r.entity_type,
        formType: r.form_type,
        taxYear: r.tax_year,
        status: r.status,
        netProfit: r.net_profit,
        selfEmploymentTax: r.self_employment_tax,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    },
  });
}));

/**
 * @api {get} /api/tax/business/returns/:id Get Business Tax Return
 * @apiName GetBusinessReturn
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/returns/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const { data: returnData, error } = await supabase
    .from('business_tax_returns')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !returnData) {
    throw new NotFoundError('Business return not found');
  }

  res.json({
    success: true,
    data: {
      id: returnData.id,
      businessName: returnData.business_name,
      entityType: returnData.entity_type,
      formType: returnData.form_type,
      taxYear: returnData.tax_year,
      status: returnData.status,
      businessAddress: returnData.business_address,
      businessCode: returnData.business_code,
      businessDescription: returnData.business_description,
      accountingMethod: returnData.accounting_method,
      ein: returnData.ein,
      grossReceipts: returnData.gross_receipts,
      returns: returnData.returns_allowances,
      otherIncome: returnData.other_income,
      cogs: returnData.cogs,
      expenses: returnData.expenses,
      vehicleInfo: returnData.vehicle_info,
      homeOffice: returnData.home_office,
      netProfit: returnData.net_profit,
      selfEmploymentTax: returnData.self_employment_tax,
      qbiDeduction: returnData.qbi_deduction,
      quarterlyEstimates: returnData.quarterly_estimates,
      createdAt: returnData.created_at,
      updatedAt: returnData.updated_at,
    },
  });
}));

/**
 * @api {put} /api/tax/business/returns/:id Update Business Tax Return
 * @apiName UpdateBusinessReturn
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.put('/returns/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const updates = req.body;

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('business_tax_returns')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    throw new NotFoundError('Business return not found');
  }

  // Map camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  const fieldMapping: Record<string, string> = {
    businessName: 'business_name',
    businessAddress: 'business_address',
    businessCode: 'business_code',
    businessDescription: 'business_description',
    accountingMethod: 'accounting_method',
    ein: 'ein',
    grossReceipts: 'gross_receipts',
    returns: 'returns_allowances',
    otherIncome: 'other_income',
    cogs: 'cogs',
    expenses: 'expenses',
    vehicleInfo: 'vehicle_info',
    homeOffice: 'home_office',
    status: 'status',
  };

  for (const [key, value] of Object.entries(updates)) {
    if (fieldMapping[key]) {
      dbUpdates[fieldMapping[key]] = value;
    }
  }

  const { data: updated, error } = await supabase
    .from('business_tax_returns')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update business return:', error);
    throw new Error('Failed to update business return');
  }

  res.json({
    success: true,
    data: {
      id: updated.id,
      businessName: updated.business_name,
      status: updated.status,
      updatedAt: updated.updated_at,
    },
  });
}));

/**
 * @api {delete} /api/tax/business/returns/:id Delete Business Tax Return
 * @apiName DeleteBusinessReturn
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.delete('/returns/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const { error } = await supabase
    .from('business_tax_returns')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete business return:', error);
    throw new Error('Failed to delete business return');
  }

  res.json({
    success: true,
    message: 'Business return deleted',
  });
}));

// ============================================================================
// Calculations
// ============================================================================

/**
 * @api {post} /api/tax/business/returns/:id/calculate Calculate Business Tax
 * @apiName CalculateBusinessTax
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 *
 * @apiDescription Calculates Schedule C, self-employment tax, and quarterly estimates.
 */
router.post('/returns/:id/calculate', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { id } = req.params;

  // Verify ownership
  const { data: returnData, error } = await supabase
    .from('business_tax_returns')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !returnData) {
    throw new NotFoundError('Business return not found');
  }

  // Calculate based on form type
  let result;

  if (returnData.form_type === 'schedule_c') {
    result = await businessTaxService.calculateScheduleC(id);
  } else {
    throw new ValidationError(`Calculation for ${returnData.form_type} not yet implemented`);
  }

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @api {post} /api/tax/business/calculate/schedule-c Calculate Schedule C Preview
 * @apiName CalculateScheduleCPreview
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 *
 * @apiDescription Preview Schedule C calculation without saving.
 */
router.post('/calculate/schedule-c', asyncHandler(async (req, res) => {
  const data: ScheduleCData = req.body;

  if (!data.businessName || data.grossReceipts === undefined) {
    throw new ValidationError('Business name and gross receipts are required');
  }

  // Ensure expenses object exists
  if (!data.expenses) {
    data.expenses = {
      advertising: 0,
      carAndTruck: 0,
      commissions: 0,
      contractLabor: 0,
      depletion: 0,
      depreciation: 0,
      employeeBenefits: 0,
      insurance: 0,
      interestMortgage: 0,
      interestOther: 0,
      legal: 0,
      officeExpense: 0,
      pensionPlans: 0,
      rentVehicles: 0,
      rentOther: 0,
      repairs: 0,
      supplies: 0,
      taxes: 0,
      travel: 0,
      deductibleMeals: 0,
      utilities: 0,
      wages: 0,
      otherExpenses: [],
    };
  }

  const result = businessTaxCalculator.calculateScheduleC(data);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @api {post} /api/tax/business/calculate/self-employment-tax Calculate SE Tax
 * @apiName CalculateSETax
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 *
 * @apiDescription Calculate self-employment tax for a given net income.
 */
router.post('/calculate/self-employment-tax', asyncHandler(async (req, res) => {
  const { netSelfEmploymentIncome } = req.body;

  if (netSelfEmploymentIncome === undefined) {
    throw new ValidationError('Net self-employment income is required');
  }

  const seTax = businessTaxCalculator.calculateSelfEmploymentTax(netSelfEmploymentIncome);
  const seTaxDeduction = seTax / 2;
  const netEarnings = netSelfEmploymentIncome * 0.9235;

  res.json({
    success: true,
    data: {
      netSelfEmploymentIncome,
      netEarnings,
      selfEmploymentTax: seTax,
      selfEmploymentTaxDeduction: seTaxDeduction,
      breakdown: {
        socialSecurityPortion: Math.min(netEarnings, 168600) * 0.124,
        medicarePortion: netEarnings * 0.029,
        additionalMedicare: Math.max(0, netEarnings - 200000) * 0.009,
      },
    },
  });
}));

/**
 * @api {post} /api/tax/business/calculate/qbi Calculate QBI Deduction
 * @apiName CalculateQBI
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.post('/calculate/qbi', asyncHandler(async (req, res) => {
  const { qualifiedBusinessIncome, entityType, taxableIncomeBeforeQBI } = req.body;

  if (qualifiedBusinessIncome === undefined) {
    throw new ValidationError('Qualified business income is required');
  }

  const qbiDeduction = businessTaxCalculator.calculateQBIDeduction(
    qualifiedBusinessIncome,
    entityType || 'sole_proprietorship',
    taxableIncomeBeforeQBI
  );

  res.json({
    success: true,
    data: {
      qualifiedBusinessIncome,
      qbiDeduction,
      deductionRate: 0.20,
      note: 'This is a simplified calculation. Complex situations may have additional limitations.',
    },
  });
}));

// ============================================================================
// Quarterly Estimated Taxes
// ============================================================================

/**
 * @api {get} /api/tax/business/quarterly-estimates Get Quarterly Estimates
 * @apiName GetQuarterlyEstimates
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/quarterly-estimates', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const taxYear = parseInt(req.query.taxYear as string) || new Date().getFullYear();

  const estimates = await businessTaxService.getQuarterlyEstimates(userId, taxYear);

  res.json({
    success: true,
    data: {
      taxYear,
      estimates,
    },
  });
}));

/**
 * @api {post} /api/tax/business/quarterly-estimates/calculate Calculate Quarterly Estimates
 * @apiName CalculateQuarterlyEstimates
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.post('/quarterly-estimates/calculate', asyncHandler(async (req, res) => {
  const { estimatedNetIncome, estimatedIncomeTax } = req.body;

  if (estimatedNetIncome === undefined) {
    throw new ValidationError('Estimated net income is required');
  }

  const seTax = businessTaxCalculator.calculateSelfEmploymentTax(estimatedNetIncome);
  const quarterlyEstimates = businessTaxCalculator.calculateQuarterlyEstimates(
    estimatedNetIncome,
    seTax,
    estimatedIncomeTax
  );

  res.json({
    success: true,
    data: {
      estimatedNetIncome,
      selfEmploymentTax: seTax,
      estimatedIncomeTax: estimatedIncomeTax || 0,
      totalAnnualTax: seTax + (estimatedIncomeTax || 0),
      quarterlyEstimates,
    },
  });
}));

/**
 * @api {post} /api/tax/business/quarterly-estimates/record Record Payment
 * @apiName RecordQuarterlyPayment
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.post('/quarterly-estimates/record', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxYear, quarter, amountPaid, paidDate, confirmationNumber } = req.body;

  if (!taxYear || !quarter || !amountPaid || !paidDate) {
    throw new ValidationError('Tax year, quarter, amount paid, and paid date are required');
  }

  if (quarter < 1 || quarter > 4) {
    throw new ValidationError('Quarter must be 1, 2, 3, or 4');
  }

  await businessTaxService.recordQuarterlyPayment(
    userId,
    taxYear,
    quarter as 1 | 2 | 3 | 4,
    amountPaid,
    new Date(paidDate),
    confirmationNumber
  );

  res.json({
    success: true,
    message: 'Payment recorded successfully',
  });
}));

// ============================================================================
// Summary and Reports
// ============================================================================

/**
 * @api {get} /api/tax/business/summary Get Business Tax Summary
 * @apiName GetBusinessTaxSummary
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/summary', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const taxYear = parseInt(req.query.taxYear as string) || new Date().getFullYear();

  const summary = await businessTaxService.getBusinessTaxSummary(userId, taxYear);

  res.json({
    success: true,
    data: {
      taxYear,
      ...summary,
    },
  });
}));

// ============================================================================
// Reference Data
// ============================================================================

/**
 * @api {get} /api/tax/business/entity-types Get Entity Types
 * @apiName GetEntityTypes
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/entity-types', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      entityTypes: [
        {
          type: 'sole_proprietorship',
          name: 'Sole Proprietorship',
          description: 'Unincorporated business owned by one person',
          taxForm: 'Schedule C (Form 1040)',
          selfEmploymentTax: true,
        },
        {
          type: 'single_member_llc',
          name: 'Single-Member LLC',
          description: 'LLC with one owner, treated as sole proprietorship for tax purposes',
          taxForm: 'Schedule C (Form 1040)',
          selfEmploymentTax: true,
        },
        {
          type: 'partnership',
          name: 'Partnership',
          description: 'Business owned by two or more partners',
          taxForm: 'Form 1065',
          selfEmploymentTax: true,
        },
        {
          type: 'multi_member_llc',
          name: 'Multi-Member LLC',
          description: 'LLC with multiple owners, treated as partnership for tax purposes',
          taxForm: 'Form 1065',
          selfEmploymentTax: true,
        },
        {
          type: 's_corporation',
          name: 'S Corporation',
          description: 'Corporation that passes income to shareholders',
          taxForm: 'Form 1120-S',
          selfEmploymentTax: false,
          note: 'Shareholders must take reasonable salary',
        },
        {
          type: 'c_corporation',
          name: 'C Corporation',
          description: 'Standard corporation, taxed at corporate level',
          taxForm: 'Form 1120',
          selfEmploymentTax: false,
          note: 'Subject to double taxation',
        },
      ],
    },
  });
}));

/**
 * @api {get} /api/tax/business/expense-categories Get Expense Categories
 * @apiName GetExpenseCategories
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/expense-categories', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        { key: 'advertising', name: 'Advertising', line: 8 },
        { key: 'carAndTruck', name: 'Car and Truck Expenses', line: 9 },
        { key: 'commissions', name: 'Commissions and Fees', line: 10 },
        { key: 'contractLabor', name: 'Contract Labor', line: 11 },
        { key: 'depletion', name: 'Depletion', line: 12 },
        { key: 'depreciation', name: 'Depreciation', line: 13 },
        { key: 'employeeBenefits', name: 'Employee Benefit Programs', line: 14 },
        { key: 'insurance', name: 'Insurance (other than health)', line: 15 },
        { key: 'interestMortgage', name: 'Interest (Mortgage)', line: '16a' },
        { key: 'interestOther', name: 'Interest (Other)', line: '16b' },
        { key: 'legal', name: 'Legal and Professional Services', line: 17 },
        { key: 'officeExpense', name: 'Office Expense', line: 18 },
        { key: 'pensionPlans', name: 'Pension and Profit-Sharing Plans', line: 19 },
        { key: 'rentVehicles', name: 'Rent (Vehicles, Equipment)', line: '20a' },
        { key: 'rentOther', name: 'Rent (Other)', line: '20b' },
        { key: 'repairs', name: 'Repairs and Maintenance', line: 21 },
        { key: 'supplies', name: 'Supplies', line: 22 },
        { key: 'taxes', name: 'Taxes and Licenses', line: 23 },
        { key: 'travel', name: 'Travel', line: '24a' },
        { key: 'deductibleMeals', name: 'Deductible Meals (50%)', line: '24b' },
        { key: 'utilities', name: 'Utilities', line: 25 },
        { key: 'wages', name: 'Wages', line: 26 },
        { key: 'otherExpenses', name: 'Other Expenses', line: 27 },
      ],
    },
  });
}));

/**
 * @api {get} /api/tax/business/mileage-rate Get Standard Mileage Rate
 * @apiName GetMileageRate
 * @apiGroup BusinessTax
 * @apiVersion 1.0.0
 */
router.get('/mileage-rate', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      year: 2024,
      businessRate: 0.67,
      medicalMovingRate: 0.21,
      charityRate: 0.14,
      note: 'Rates are per mile. Business rate for 2024 is 67 cents per mile.',
    },
  });
}));

export default router;
