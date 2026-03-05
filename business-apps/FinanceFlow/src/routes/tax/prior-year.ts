/**
 * Prior Year Import Routes
 *
 * API endpoints for importing and comparing prior year tax data:
 * - Copy from LegalFlow prior years
 * - Import from external tax software
 * - Year-over-year comparisons
 * - Carryforward tracking
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/async.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { priorYearImportService } from '../../services/tax/prior-year-import.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Prior Year Returns
// ============================================================================

/**
 * @api {get} /api/tax/prior-year/returns List Prior Year Returns
 * @apiName ListPriorYearReturns
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Lists all prior year tax returns available for import.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Array} data.returns List of prior year returns
 */
router.get('/returns', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const result = await priorYearImportService.getPriorYearReturns(userId);

  res.json({
    success: true,
    data: result,
  });
}));

// ============================================================================
// Import Operations
// ============================================================================

/**
 * @api {post} /api/tax/prior-year/copy Copy From Prior Year
 * @apiName CopyFromPriorYear
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Copies data from a prior year LegalFlow return to create
 * a new return. Personal info, dependents, and employer info are copied.
 * Amounts are NOT copied as they change each year.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} priorReturnId ID of the prior year return to copy
 * @apiBody {Number} targetTaxYear Tax year for the new return
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Import results
 * @apiSuccess {Array} data.importedFields Fields that were copied
 * @apiSuccess {Array} data.skippedFields Fields that were not copied
 * @apiSuccess {Array} data.warnings Important notes about the import
 */
router.post('/copy', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { priorReturnId, targetTaxYear } = req.body;

  if (!priorReturnId || !targetTaxYear) {
    throw new ValidationError('Prior return ID and target tax year are required');
  }

  const currentYear = new Date().getFullYear();
  if (targetTaxYear < currentYear - 1 || targetTaxYear > currentYear + 1) {
    throw new ValidationError('Target tax year must be within a valid range');
  }

  const result = await priorYearImportService.copyFromPriorYear(
    userId,
    priorReturnId,
    targetTaxYear
  );

  if (!result.success) {
    throw new ValidationError(result.errors.join(', '));
  }

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @api {post} /api/tax/prior-year/import Import From External
 * @apiName ImportFromExternal
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Imports tax data from external tax software files.
 * Currently supports TurboTax, H&R Block, and TaxAct (coming soon).
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} source Source software (turbotax, hrblock, taxact)
 * @apiBody {String} format File format (tax, pdf, xml)
 * @apiBody {String} content Base64 encoded file content
 * @apiBody {String} filename Original filename
 * @apiBody {Number} targetTaxYear Tax year for the new return
 */
router.post('/import', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { source, format, content, filename, targetTaxYear } = req.body;

  if (!source || !content || !targetTaxYear) {
    throw new ValidationError('Source, content, and target tax year are required');
  }

  const result = await priorYearImportService.importFromExternal(
    userId,
    {
      source,
      format: format || 'tax',
      content,
      filename: filename || 'import.tax',
    },
    targetTaxYear
  );

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * @api {post} /api/tax/prior-year/manual Manual Entry Import
 * @apiName ManualEntryImport
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Manually enter prior year summary data for carryforward
 * calculations and identity verification.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {Number} targetTaxYear Tax year for the new return
 * @apiBody {String} filingStatus Prior year filing status
 * @apiBody {Number} priorYearAGI Prior year AGI (for e-file verification)
 * @apiBody {Array} [carryforwards] Carryforward items
 */
router.post('/manual', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { targetTaxYear, filingStatus, priorYearAGI, carryforwards } = req.body;

  if (!targetTaxYear) {
    throw new ValidationError('Target tax year is required');
  }

  const data = {
    filingStatus,
    summary: {
      agi: priorYearAGI || 0,
      taxableIncome: 0,
      totalTax: 0,
      refundOrOwed: 0,
      isRefund: false,
    },
    carryforwards,
    taxYear: targetTaxYear - 1,
    taxpayerInfo: { firstName: '', lastName: '' },
    income: {
      wages: 0,
      interest: 0,
      dividends: 0,
      businessIncome: 0,
      capitalGains: 0,
      rentalIncome: 0,
      otherIncome: 0,
      totalIncome: 0,
    },
    adjustments: {
      hsaDeduction: 0,
      iraDeduction: 0,
      studentLoanInterest: 0,
      selfEmploymentTax: 0,
      otherAdjustments: 0,
      totalAdjustments: 0,
    },
    deductions: {
      type: 'standard' as const,
      amount: 0,
    },
    credits: {
      childTaxCredit: 0,
      childCareCredit: 0,
      educationCredits: 0,
      earnedIncomeCredit: 0,
      otherCredits: 0,
      totalCredits: 0,
    },
    payments: {
      federalWithholding: 0,
      estimatedPayments: 0,
      otherPayments: 0,
      totalPayments: 0,
    },
  };

  const result = await priorYearImportService.importFromManualEntry(
    userId,
    data,
    targetTaxYear
  );

  res.json({
    success: true,
    data: result,
  });
}));

// ============================================================================
// Comparison
// ============================================================================

/**
 * @api {get} /api/tax/prior-year/compare/:priorId/:currentId Compare Years
 * @apiName CompareYears
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Compares two tax years to show changes in income, deductions,
 * credits, and overall tax liability.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiParam {String} priorId Prior year return ID
 * @apiParam {String} currentId Current year return ID
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Year comparison results
 * @apiSuccess {Array} data.changes Detailed changes by category
 * @apiSuccess {Object} data.summary Summary of changes
 */
router.get('/compare/:priorId/:currentId', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { priorId, currentId } = req.params;

  const comparison = await priorYearImportService.compareYears(
    userId,
    priorId,
    currentId
  );

  if (!comparison) {
    throw new NotFoundError('Unable to compare returns. Check return IDs.');
  }

  res.json({
    success: true,
    data: comparison,
  });
}));

// ============================================================================
// Carryforwards
// ============================================================================

/**
 * @api {get} /api/tax/prior-year/carryforwards Get Carryforwards
 * @apiName GetCarryforwards
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Gets all available carryforward items from prior years.
 */
router.get('/carryforwards', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxYear } = req.query;

  // Get returns with carryforwards
  const { data: returns, error } = await import('../../lib/supabase.js').then(m =>
    m.supabase
      .from('tax_returns')
      .select('tax_year, carryforwards')
      .eq('user_id', userId)
      .not('carryforwards', 'is', null)
      .order('tax_year', { ascending: false })
  );

  if (error) {
    logger.error('Failed to get carryforwards:', error);
    throw new Error('Failed to retrieve carryforwards');
  }

  // Flatten and filter carryforwards
  const allCarryforwards = returns.flatMap(r =>
    (r.carryforwards || []).map((cf: Record<string, unknown>) => ({
      ...cf,
      fromTaxYear: r.tax_year,
    }))
  );

  // Filter out expired items
  const currentYear = parseInt(taxYear as string) || new Date().getFullYear();
  const activeCarryforwards = allCarryforwards.filter(
    (cf: Record<string, unknown>) =>
      !cf.expirationYear || (cf.expirationYear as number) >= currentYear
  );

  res.json({
    success: true,
    data: {
      carryforwards: activeCarryforwards,
      types: [
        {
          type: 'capital_loss',
          name: 'Capital Loss Carryforward',
          description: 'Net capital losses exceeding $3,000 annual limit',
          expiration: 'No expiration',
        },
        {
          type: 'nol',
          name: 'Net Operating Loss',
          description: 'Business losses that exceeded income',
          expiration: 'Indefinite (post-2017) or 20 years',
        },
        {
          type: 'charitable_contribution',
          name: 'Charitable Contribution',
          description: 'Contributions exceeding AGI limits',
          expiration: '5 years',
        },
        {
          type: 'passive_loss',
          name: 'Passive Activity Loss',
          description: 'Suspended losses from passive activities',
          expiration: 'Until activity is disposed',
        },
        {
          type: 'foreign_tax_credit',
          name: 'Foreign Tax Credit',
          description: 'Unused foreign tax credits',
          expiration: '10 years',
        },
      ],
    },
  });
}));

// ============================================================================
// Reference Data
// ============================================================================

/**
 * @api {get} /api/tax/prior-year/import-formats Get Import Formats
 * @apiName GetImportFormats
 * @apiGroup PriorYear
 * @apiVersion 1.0.0
 *
 * @apiDescription Gets supported import sources and file formats.
 */
router.get('/import-formats', asyncHandler(async (_req, res) => {
  const formats = priorYearImportService.getSupportedFormats();

  res.json({
    success: true,
    data: {
      formats,
    },
  });
}));

export default router;
