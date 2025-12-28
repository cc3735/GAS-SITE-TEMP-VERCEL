import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { NotFoundError, ValidationError } from '../../utils/errors.js';
import {
  FEDERAL_TAX_BRACKETS_2024,
  STANDARD_DEDUCTIONS_2024,
  type FilingStatus,
  type TaxCalculation,
  type RefundEstimate,
} from '../../types/tax.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Calculate federal tax based on taxable income and filing status
function calculateFederalTax(taxableIncome: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_TAX_BRACKETS_2024[filingStatus];
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of brackets) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );
    tax += taxableInBracket * bracket.rate;
    remainingIncome -= taxableInBracket;
  }

  return Math.round(tax * 100) / 100;
}

// Get refund estimate for a tax return
router.get('/:taxReturnId/refund-estimate', asyncHandler(async (req, res) => {
  const { taxReturnId } = req.params;

  // Verify ownership
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('*')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  const formsData = taxReturn.forms_data || {};
  const answers = formsData.interviewState?.answers || {};
  const missingInfo: string[] = [];

  // Determine filing status
  const filingStatus = (taxReturn.filing_status || answers.filing_status?.value || 'single') as FilingStatus;

  // Get income data (from answers or documents)
  let totalIncome = taxReturn.total_income || 0;
  
  if (!totalIncome) {
    // Try to calculate from documents
    const { data: documents } = await supabaseAdmin
      .from('tax_documents')
      .select('document_type, document_data')
      .eq('tax_return_id', taxReturnId);

    if (documents) {
      for (const doc of documents) {
        const data = doc.document_data as Record<string, unknown>;
        if (doc.document_type === 'w2') {
          totalIncome += (data.wages as number) || 0;
        } else if (doc.document_type?.startsWith('1099')) {
          totalIncome += (data.amount as number) || 0;
        }
      }
    }

    if (totalIncome === 0) {
      missingInfo.push('Income information');
    }
  }

  // Get withholdings
  let totalWithholdings = 0;
  const { data: documents } = await supabaseAdmin
    .from('tax_documents')
    .select('document_type, document_data')
    .eq('tax_return_id', taxReturnId);

  if (documents) {
    for (const doc of documents) {
      const data = doc.document_data as Record<string, unknown>;
      if (doc.document_type === 'w2') {
        totalWithholdings += (data.federalWithheld as number) || 0;
      } else if (doc.document_type?.startsWith('1099')) {
        totalWithholdings += (data.federalWithheld as number) || 0;
      }
    }
  }

  if (totalWithholdings === 0 && totalIncome > 0) {
    missingInfo.push('Tax withholding information');
  }

  // Calculate deductions
  const standardDeduction = STANDARD_DEDUCTIONS_2024[filingStatus];
  const deductions = taxReturn.forms_data?.itemizedDeductions || standardDeduction;

  // Calculate taxable income
  const taxableIncome = Math.max(0, totalIncome - deductions);

  // Calculate tax
  const federalTax = calculateFederalTax(taxableIncome, filingStatus);

  // Calculate credits (simplified)
  let totalCredits = 0;
  
  // Child Tax Credit estimate
  const dependentsCount = answers.dependents_count?.value as number || 0;
  const hasQualifyingChildren = answers.has_qualifying_children?.value === true;
  if (hasQualifyingChildren && dependentsCount > 0) {
    totalCredits += Math.min(dependentsCount, 3) * 2000; // $2000 per child, max 3
  }

  // Final calculations
  const totalTax = Math.max(0, federalTax - totalCredits);
  const refundOrOwed = totalWithholdings - totalTax;

  // Determine confidence level
  let confidence: 'low' | 'medium' | 'high' = 'high';
  if (missingInfo.length > 0) {
    confidence = missingInfo.length > 1 ? 'low' : 'medium';
  }

  const estimate: RefundEstimate = {
    federalRefund: refundOrOwed > 0 ? refundOrOwed : 0,
    stateRefunds: {}, // TODO: Add state calculations
    totalRefund: refundOrOwed > 0 ? refundOrOwed : 0,
    confidence,
    missingInfo,
    lastCalculated: new Date().toISOString(),
  };

  // Include calculation breakdown
  const calculation: TaxCalculation = {
    totalIncome,
    adjustments: 0,
    adjustedGrossIncome: totalIncome,
    deductions,
    taxableIncome,
    taxBeforeCredits: federalTax,
    credits: totalCredits,
    totalTax,
    withholdings: totalWithholdings,
    estimatedPayments: 0,
    refundOrOwed,
    isRefund: refundOrOwed > 0,
  };

  res.json({
    success: true,
    data: {
      estimate,
      calculation,
      filingStatus,
      taxYear: taxReturn.tax_year,
    },
  });
}));

// Validate tax return before filing
router.post('/:taxReturnId/validate', asyncHandler(async (req, res) => {
  const { taxReturnId } = req.params;

  // Verify ownership
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('*')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!taxReturn.filing_status) {
    errors.push('Filing status is required');
  }

  if (!taxReturn.total_income && taxReturn.total_income !== 0) {
    errors.push('Income information is required');
  }

  // Get documents
  const { data: documents } = await supabaseAdmin
    .from('tax_documents')
    .select('*')
    .eq('tax_return_id', taxReturnId);

  if (!documents || documents.length === 0) {
    warnings.push('No income documents (W-2, 1099) have been added');
  }

  // Check interview completion
  const interviewState = taxReturn.forms_data?.interviewState;
  if (!interviewState || interviewState.completedSections?.length < 5) {
    errors.push('Tax interview must be completed');
  }

  // Get user profile for SSN check
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('ssn_encrypted, first_name, last_name, address')
    .eq('id', req.user!.id)
    .single();

  if (!profile?.ssn_encrypted) {
    errors.push('Social Security Number is required for filing');
  }

  if (!profile?.first_name || !profile?.last_name) {
    errors.push('Full name is required for filing');
  }

  if (!profile?.address) {
    errors.push('Address is required for filing');
  }

  // Check for suspicious values
  if (taxReturn.total_income && taxReturn.total_income < 0) {
    errors.push('Total income cannot be negative');
  }

  if (taxReturn.refund_amount && taxReturn.refund_amount > 50000) {
    warnings.push('Large refund amount detected - please verify your information');
  }

  const isValid = errors.length === 0;

  res.json({
    success: true,
    data: {
      isValid,
      canFile: isValid,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    },
  });
}));

// Get tax brackets and deduction info
router.get('/reference/brackets', asyncHandler(async (req, res) => {
  const { filingStatus = 'single', taxYear = 2024 } = req.query;

  if (taxYear !== '2024' && taxYear !== 2024) {
    throw new ValidationError('Only 2024 tax year is currently supported');
  }

  const status = filingStatus as FilingStatus;
  const brackets = FEDERAL_TAX_BRACKETS_2024[status];
  const standardDeduction = STANDARD_DEDUCTIONS_2024[status];

  if (!brackets) {
    throw new ValidationError('Invalid filing status');
  }

  res.json({
    success: true,
    data: {
      taxYear: 2024,
      filingStatus: status,
      brackets: brackets.map((b) => ({
        min: b.min,
        max: b.max === Infinity ? 'and above' : b.max,
        rate: `${(b.rate * 100).toFixed(0)}%`,
      })),
      standardDeduction,
      notes: [
        'These are federal tax brackets only',
        'State taxes are calculated separately',
        'Your actual tax may vary based on deductions and credits',
      ],
    },
  });
}));

export default router;

