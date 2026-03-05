/**
 * E-Filing Routes
 *
 * API endpoints for IRS e-filing functionality:
 * - Validate tax returns for filing
 * - Generate IRS-ready PDF forms
 * - Submit returns for e-filing (future MeF integration)
 * - Track filing status
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { asyncHandler } from '../../middleware/async.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { eFilingService, TaxReturnData, PdfGenerationOptions } from '../../services/tax/e-filing.js';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================================================
// Validation Endpoints
// ============================================================================

/**
 * @api {post} /api/tax/e-filing/validate Validate Tax Return for Filing
 * @apiName ValidateTaxReturn
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Validates a tax return to ensure it's ready for filing.
 * Returns any errors or warnings that need to be addressed.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} taxReturnId UUID of the tax return to validate
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Validation results
 * @apiSuccess {Boolean} data.isValid Whether the return is valid for filing
 * @apiSuccess {Boolean} data.readyToFile Whether the return can be submitted
 * @apiSuccess {Array} data.errors List of validation errors
 * @apiSuccess {Array} data.warnings List of validation warnings
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "isValid": true,
 *         "readyToFile": true,
 *         "errors": [],
 *         "warnings": [
 *           {
 *             "code": "HIGH_WITHHOLDING_RATE",
 *             "field": "income.w2Forms[0].federalWithheld",
 *             "message": "W-2 #1 has unusually high withholding rate (35.5%)"
 *           }
 *         ]
 *       }
 *     }
 *
 * @apiError ValidationError Invalid request parameters
 * @apiError NotFoundError Tax return not found
 * @apiError AuthenticationError Not authenticated
 */
router.post('/validate', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxReturnId } = req.body;

  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

  // Get the tax return with all related data
  const taxReturnData = await getTaxReturnData(taxReturnId, userId);

  if (!taxReturnData) {
    throw new NotFoundError('Tax return not found');
  }

  // Validate the return
  const validation = await eFilingService.validateForFiling(taxReturnData);

  res.json({
    success: true,
    data: validation,
  });
}));

// ============================================================================
// PDF Generation Endpoints
// ============================================================================

/**
 * @api {post} /api/tax/e-filing/generate-pdf Generate IRS-Ready PDF
 * @apiName GeneratePdf
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Generates IRS-ready PDF forms (Form 1040 and applicable schedules)
 * for a tax return. Can be used for manual filing or record keeping.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} taxReturnId UUID of the tax return
 * @apiBody {Boolean} [includeSchedules=true] Include applicable schedule forms
 * @apiBody {Boolean} [includeWorksheets=true] Include calculation worksheets
 * @apiBody {Boolean} [includeInstructions=false] Include form instructions
 * @apiBody {String="print","efile"} [format="print"] Output format
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data PDF generation results
 * @apiSuccess {String} data.pdfBase64 Base64 encoded PDF content
 * @apiSuccess {String} data.filename Suggested filename
 * @apiSuccess {Number} data.pageCount Number of pages in the PDF
 * @apiSuccess {Array} data.forms List of forms included in the PDF
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "pdfBase64": "JVBERi0xLjQKJe...",
 *         "filename": "Form1040_2024_Smith.pdf",
 *         "pageCount": 5,
 *         "forms": ["Form 1040", "Schedule 1", "Schedule C", "Schedule SE"]
 *       }
 *     }
 *
 * @apiError ValidationError Invalid request or return has validation errors
 * @apiError NotFoundError Tax return not found
 */
router.post('/generate-pdf', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const {
    taxReturnId,
    includeSchedules = true,
    includeWorksheets = true,
    includeInstructions = false,
    format = 'print',
  } = req.body;

  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

  // Get the tax return data
  const taxReturnData = await getTaxReturnData(taxReturnId, userId);

  if (!taxReturnData) {
    throw new NotFoundError('Tax return not found');
  }

  // Generate PDF
  const options: PdfGenerationOptions = {
    includeSchedules,
    includeWorksheets,
    includeInstructions,
    format: format as 'print' | 'efile',
  };

  const result = await eFilingService.generatePdf(taxReturnData, options);

  if (!result.success) {
    throw new ValidationError(result.errors?.join(', ') || 'PDF generation failed');
  }

  res.json({
    success: true,
    data: {
      pdfBase64: result.pdfBase64,
      filename: result.filename,
      pageCount: result.pageCount,
      forms: result.forms,
    },
  });
}));

// ============================================================================
// E-Filing Submission Endpoints
// ============================================================================

/**
 * @api {post} /api/tax/e-filing/submit Submit Tax Return for E-Filing
 * @apiName SubmitEFiling
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Submits a tax return for IRS e-filing. Currently generates
 * a submission record for future MeF integration. Returns will be marked
 * as "pending_review" until direct e-filing is implemented.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiBody {String} taxReturnId UUID of the tax return to submit
 * @apiBody {String="federal","state"} [filingType="federal"] Type of filing
 * @apiBody {String} [stateCode] State code for state filing
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Submission results
 * @apiSuccess {String} data.submissionId Submission tracking ID
 * @apiSuccess {String} data.status Current submission status
 * @apiSuccess {String} data.message Status message
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "submissionId": "sub_abc123",
 *         "status": "pending_review",
 *         "message": "Your return has been submitted for review. Direct IRS e-filing will be available soon."
 *       }
 *     }
 *
 * @apiError ValidationError Return has validation errors
 * @apiError NotFoundError Tax return not found
 */
router.post('/submit', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxReturnId, filingType = 'federal', stateCode } = req.body;

  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

  // Get the tax return data
  const taxReturnData = await getTaxReturnData(taxReturnId, userId);

  if (!taxReturnData) {
    throw new NotFoundError('Tax return not found');
  }

  // Validate before submission
  const validation = await eFilingService.validateForFiling(taxReturnData);

  if (!validation.isValid) {
    throw new ValidationError(
      'Tax return has validation errors that must be fixed before filing: ' +
      validation.errors.map(e => e.message).join('; ')
    );
  }

  // Submit for e-filing
  const result = await eFilingService.submitForEFiling(taxReturnId, userId);

  if (!result.success) {
    throw new ValidationError(result.errors?.join(', ') || 'E-filing submission failed');
  }

  // Update tax return status
  await supabase
    .from('tax_returns')
    .update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taxReturnId)
    .eq('user_id', userId);

  res.json({
    success: true,
    data: {
      submissionId: result.submissionId,
      status: 'pending_review',
      message: 'Your return has been submitted for review. Direct IRS e-filing will be available soon. In the meantime, you can download the PDF to file manually.',
    },
  });
}));

/**
 * @api {get} /api/tax/e-filing/status/:submissionId Check E-Filing Status
 * @apiName CheckEFilingStatus
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Checks the status of a previously submitted e-filing.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiParam {String} submissionId The submission ID to check
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Submission status
 * @apiSuccess {String} data.status Current status
 * @apiSuccess {String} data.confirmationNumber IRS confirmation (if accepted)
 * @apiSuccess {Date} data.submittedAt When the return was submitted
 * @apiSuccess {Date} data.acceptedAt When the return was accepted (if applicable)
 * @apiSuccess {String} data.rejectionReason Rejection reason (if rejected)
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "id": "sub_abc123",
 *         "status": "accepted",
 *         "confirmationNumber": "IRS-2024-123456789",
 *         "submittedAt": "2024-02-15T10:30:00Z",
 *         "acceptedAt": "2024-02-15T14:45:00Z"
 *       }
 *     }
 *
 * @apiError NotFoundError Submission not found
 */
router.get('/status/:submissionId', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { submissionId } = req.params;

  const submission = await eFilingService.checkFilingStatus(submissionId);

  if (!submission || submission.userId !== userId) {
    throw new NotFoundError('Submission not found');
  }

  res.json({
    success: true,
    data: {
      id: submission.id,
      taxReturnId: submission.taxReturnId,
      status: submission.status,
      filingType: submission.filingType,
      stateCode: submission.stateCode,
      confirmationNumber: submission.confirmationNumber,
      submittedAt: submission.submittedAt,
      acceptedAt: submission.acceptedAt,
      rejectedAt: submission.rejectedAt,
      rejectionReason: submission.rejectionReason,
    },
  });
}));

/**
 * @api {get} /api/tax/e-filing/submissions List E-Filing Submissions
 * @apiName ListEFilingSubmissions
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Lists all e-filing submissions for the current user.
 *
 * @apiHeader {String} Authorization Bearer token
 *
 * @apiQuery {Number} [taxYear] Filter by tax year
 * @apiQuery {String} [status] Filter by status
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Array} data.submissions List of submissions
 */
router.get('/submissions', asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taxYear, status } = req.query;

  let query = supabase
    .from('e_filing_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (taxYear) {
    query = query.eq('tax_year', parseInt(taxYear as string));
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: submissions, error } = await query;

  if (error) {
    logger.error('Failed to list submissions:', error);
    throw new Error('Failed to retrieve submissions');
  }

  res.json({
    success: true,
    data: {
      submissions: submissions.map(s => ({
        id: s.id,
        taxReturnId: s.tax_return_id,
        taxYear: s.tax_year,
        filingType: s.filing_type,
        stateCode: s.state_code,
        status: s.status,
        confirmationNumber: s.confirmation_number,
        submittedAt: s.submitted_at,
        acceptedAt: s.accepted_at,
        rejectedAt: s.rejected_at,
        createdAt: s.created_at,
      })),
    },
  });
}));

// ============================================================================
// Information Endpoints
// ============================================================================

/**
 * @api {get} /api/tax/e-filing/requirements Get E-Filing Requirements
 * @apiName GetEFilingRequirements
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Returns the requirements and deadlines for e-filing.
 *
 * @apiSuccess {Boolean} success Operation success status
 * @apiSuccess {Object} data Requirements information
 */
router.get('/requirements', asyncHandler(async (_req, res) => {
  const currentYear = new Date().getFullYear();
  const taxYear = currentYear - 1;

  res.json({
    success: true,
    data: {
      taxYear,
      federalDeadline: `${currentYear}-04-15`,
      extensionDeadline: `${currentYear}-10-15`,
      requirements: [
        {
          id: 'ssn',
          description: 'Valid Social Security Number for all taxpayers and dependents',
          required: true,
        },
        {
          id: 'w2',
          description: 'W-2 forms from all employers',
          required: true,
        },
        {
          id: '1099',
          description: '1099 forms for interest, dividends, and other income',
          required: false,
        },
        {
          id: 'address',
          description: 'Current mailing address',
          required: true,
        },
        {
          id: 'bank',
          description: 'Bank account information for direct deposit (optional)',
          required: false,
        },
        {
          id: 'prior_agi',
          description: 'Prior year AGI or Self-Select PIN for identity verification',
          required: true,
        },
      ],
      supportedForms: [
        'Form 1040',
        'Schedule 1 (Additional Income and Adjustments)',
        'Schedule 2 (Additional Taxes)',
        'Schedule 3 (Additional Credits and Payments)',
        'Schedule A (Itemized Deductions)',
        'Schedule C (Profit or Loss from Business)',
        'Schedule SE (Self-Employment Tax)',
        'Schedule EIC (Earned Income Credit)',
      ],
      efilingStatus: {
        directIRS: false,
        pdfGeneration: true,
        message: 'Direct IRS e-filing coming soon. Currently supports PDF generation for manual filing.',
      },
    },
  });
}));

/**
 * @api {get} /api/tax/e-filing/deadlines Get Filing Deadlines
 * @apiName GetFilingDeadlines
 * @apiGroup E-Filing
 * @apiVersion 1.0.0
 *
 * @apiDescription Returns all important tax filing deadlines.
 */
router.get('/deadlines', asyncHandler(async (_req, res) => {
  const currentYear = new Date().getFullYear();

  res.json({
    success: true,
    data: {
      deadlines: [
        {
          name: 'Federal Tax Return Due',
          date: `${currentYear}-04-15`,
          description: 'Deadline for filing federal income tax returns',
          type: 'federal',
        },
        {
          name: 'Q1 Estimated Tax Payment',
          date: `${currentYear}-04-15`,
          description: 'First quarter estimated tax payment due',
          type: 'estimated',
        },
        {
          name: 'Q2 Estimated Tax Payment',
          date: `${currentYear}-06-15`,
          description: 'Second quarter estimated tax payment due',
          type: 'estimated',
        },
        {
          name: 'Q3 Estimated Tax Payment',
          date: `${currentYear}-09-15`,
          description: 'Third quarter estimated tax payment due',
          type: 'estimated',
        },
        {
          name: 'Extension Deadline',
          date: `${currentYear}-10-15`,
          description: 'Deadline for extended federal returns',
          type: 'extension',
        },
        {
          name: 'Q4 Estimated Tax Payment',
          date: `${currentYear + 1}-01-15`,
          description: 'Fourth quarter estimated tax payment due',
          type: 'estimated',
        },
      ],
    },
  });
}));

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get full tax return data with all related information
 */
async function getTaxReturnData(taxReturnId: string, userId: string): Promise<TaxReturnData | null> {
  // Get main tax return
  const { data: taxReturn, error: returnError } = await supabase
    .from('tax_returns')
    .select('*')
    .eq('id', taxReturnId)
    .eq('user_id', userId)
    .single();

  if (returnError || !taxReturn) {
    return null;
  }

  // Get user profile for taxpayer info
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  // Get dependents
  const { data: dependents } = await supabase
    .from('tax_dependents')
    .select('*')
    .eq('tax_return_id', taxReturnId);

  // Get W-2 forms
  const { data: w2Forms } = await supabase
    .from('tax_w2_forms')
    .select('*')
    .eq('tax_return_id', taxReturnId);

  // Get 1099 forms
  const { data: form1099s } = await supabase
    .from('tax_1099_forms')
    .select('*')
    .eq('tax_return_id', taxReturnId);

  // Build the complete tax return data object
  const taxReturnData: TaxReturnData = {
    id: taxReturn.id,
    userId: taxReturn.user_id,
    taxYear: taxReturn.tax_year,
    filingStatus: taxReturn.filing_status || 'single',

    taxpayerInfo: {
      firstName: profile?.first_name || '',
      middleInitial: profile?.middle_initial,
      lastName: profile?.last_name || '',
      ssn: profile?.ssn || '',
      dateOfBirth: profile?.date_of_birth || '',
      occupation: profile?.occupation,
      phoneNumber: profile?.phone_number,
      email: profile?.email,
      address: {
        street1: profile?.address_street1 || '',
        street2: profile?.address_street2,
        city: profile?.address_city || '',
        state: profile?.address_state || '',
        zipCode: profile?.address_zip || '',
      },
    },

    spouseInfo: taxReturn.spouse_info ? {
      firstName: taxReturn.spouse_info.first_name || '',
      lastName: taxReturn.spouse_info.last_name || '',
      ssn: taxReturn.spouse_info.ssn || '',
      dateOfBirth: taxReturn.spouse_info.date_of_birth || '',
      address: {
        street1: profile?.address_street1 || '',
        city: profile?.address_city || '',
        state: profile?.address_state || '',
        zipCode: profile?.address_zip || '',
      },
    } : undefined,

    dependents: (dependents || []).map(d => ({
      firstName: d.first_name,
      lastName: d.last_name,
      ssn: d.ssn,
      relationship: d.relationship,
      dateOfBirth: d.date_of_birth,
      monthsLivedWithYou: d.months_lived || 12,
      qualifiesForChildTaxCredit: d.qualifies_ctc || false,
      qualifiesForEITC: d.qualifies_eitc || false,
    })),

    income: {
      wages: taxReturn.income_wages || 0,
      salaries: taxReturn.income_salaries || 0,
      tips: taxReturn.income_tips || 0,
      interestIncome: taxReturn.income_interest || 0,
      dividendIncome: taxReturn.income_dividends || 0,
      qualifiedDividends: taxReturn.income_qualified_dividends || 0,
      taxableRefunds: taxReturn.income_taxable_refunds || 0,
      alimonyReceived: taxReturn.income_alimony || 0,
      businessIncome: taxReturn.income_business || 0,
      capitalGains: taxReturn.income_capital_gains || 0,
      capitalLosses: taxReturn.income_capital_losses || 0,
      otherGains: taxReturn.income_other_gains || 0,
      iraDistributions: taxReturn.income_ira || 0,
      pensionsAnnuities: taxReturn.income_pensions || 0,
      rentalRealEstate: taxReturn.income_rental || 0,
      socialSecurityBenefits: taxReturn.income_social_security || 0,
      otherIncome: taxReturn.income_other || 0,
      w2Forms: (w2Forms || []).map(w => ({
        employerEin: w.employer_ein,
        employerName: w.employer_name,
        employerAddress: {
          street1: w.employer_address || '',
          city: w.employer_city || '',
          state: w.employer_state || '',
          zipCode: w.employer_zip || '',
        },
        wages: w.wages || 0,
        federalWithheld: w.federal_withheld || 0,
        socialSecurityWages: w.ss_wages || 0,
        socialSecurityWithheld: w.ss_withheld || 0,
        medicareWages: w.medicare_wages || 0,
        medicareWithheld: w.medicare_withheld || 0,
      })),
      form1099s: (form1099s || []).map(f => ({
        type: f.form_type,
        payerName: f.payer_name,
        payerEin: f.payer_ein,
        amount: f.amount || 0,
        federalWithheld: f.federal_withheld,
        stateWithheld: f.state_withheld,
      })),
    },

    deductions: {
      useStandardDeduction: taxReturn.use_standard_deduction !== false,
      standardDeductionAmount: taxReturn.standard_deduction_amount,
      itemizedDeductions: taxReturn.itemized_deductions ? {
        medicalExpenses: taxReturn.itemized_deductions.medical || 0,
        stateLocalTaxes: taxReturn.itemized_deductions.salt || 0,
        realEstateTaxes: taxReturn.itemized_deductions.real_estate_taxes || 0,
        personalPropertyTaxes: taxReturn.itemized_deductions.personal_property || 0,
        mortgageInterest: taxReturn.itemized_deductions.mortgage_interest || 0,
        mortgageInsurancePremiums: taxReturn.itemized_deductions.mortgage_insurance || 0,
        charitableCash: taxReturn.itemized_deductions.charitable_cash || 0,
        charitableNonCash: taxReturn.itemized_deductions.charitable_noncash || 0,
        casualtyLosses: taxReturn.itemized_deductions.casualty || 0,
        miscDeductions: taxReturn.itemized_deductions.misc || 0,
      } : undefined,
      adjustmentsToIncome: {
        educatorExpenses: taxReturn.adjustments?.educator_expenses || 0,
        hsaDeduction: taxReturn.adjustments?.hsa || 0,
        movingExpenses: taxReturn.adjustments?.moving || 0,
        selfEmploymentTax: taxReturn.adjustments?.self_employment_tax || 0,
        selfEmployedHealthInsurance: taxReturn.adjustments?.self_employed_health || 0,
        sepSimpleIra: taxReturn.adjustments?.sep_simple || 0,
        selfEmployedRetirement: taxReturn.adjustments?.self_employed_retirement || 0,
        earlyWithdrawalPenalty: taxReturn.adjustments?.early_withdrawal || 0,
        alimonyPaid: taxReturn.adjustments?.alimony_paid || 0,
        iraDeduction: taxReturn.adjustments?.ira || 0,
        studentLoanInterest: taxReturn.adjustments?.student_loan_interest || 0,
      },
    },

    credits: {
      childTaxCredit: taxReturn.credits?.child_tax_credit || 0,
      additionalChildTaxCredit: taxReturn.credits?.additional_ctc || 0,
      childDependentCareCredit: taxReturn.credits?.child_care || 0,
      educationCredits: taxReturn.credits?.education || 0,
      retirementSavingsCredit: taxReturn.credits?.savers || 0,
      residentialEnergyCredit: taxReturn.credits?.energy || 0,
      foreignTaxCredit: taxReturn.credits?.foreign_tax || 0,
      earnedIncomeCredit: taxReturn.credits?.eitc || 0,
      otherCredits: taxReturn.credits?.other || 0,
    },

    payments: {
      federalWithholding: taxReturn.payments_federal_withheld || 0,
      estimatedTaxPayments: taxReturn.payments_estimated || 0,
      amountPaidWithExtension: taxReturn.payments_extension || 0,
      excessSocialSecurity: taxReturn.payments_excess_ss || 0,
      otherPayments: taxReturn.payments_other || 0,
    },

    bankInfo: taxReturn.bank_info ? {
      routingNumber: taxReturn.bank_info.routing_number,
      accountNumber: taxReturn.bank_info.account_number,
      accountType: taxReturn.bank_info.account_type,
      bankName: taxReturn.bank_info.bank_name,
    } : undefined,
  };

  return taxReturnData;
}

export default router;
