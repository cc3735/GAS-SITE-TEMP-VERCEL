import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';
import { createTaxReturnSchema, taxYearSchema } from '../../utils/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all tax returns for user
router.get('/', asyncHandler(async (req, res) => {
  const { data: returns, error } = await supabaseAdmin
    .from('tax_returns')
    .select('*')
    .eq('user_id', req.user!.id)
    .order('tax_year', { ascending: false });

  if (error) {
    throw new ValidationError('Failed to fetch tax returns');
  }

  res.json({
    success: true,
    data: returns.map((r) => ({
      id: r.id,
      taxYear: r.tax_year,
      filingStatus: r.filing_status,
      status: r.status,
      totalIncome: r.total_income,
      adjustedGrossIncome: r.adjusted_gross_income,
      taxableIncome: r.taxable_income,
      totalTax: r.total_tax,
      refundAmount: r.refund_amount,
      paymentAmount: r.payment_amount,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      filedAt: r.filed_at,
    })),
  });
}));

// Get single tax return
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: taxReturn, error } = await supabaseAdmin
    .from('tax_returns')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !taxReturn) {
    throw new NotFoundError('Tax return');
  }

  res.json({
    success: true,
    data: {
      id: taxReturn.id,
      taxYear: taxReturn.tax_year,
      filingStatus: taxReturn.filing_status,
      status: taxReturn.status,
      federalReturnId: taxReturn.federal_return_id,
      stateReturnIds: taxReturn.state_return_ids,
      totalIncome: taxReturn.total_income,
      adjustedGrossIncome: taxReturn.adjusted_gross_income,
      taxableIncome: taxReturn.taxable_income,
      totalTax: taxReturn.total_tax,
      refundAmount: taxReturn.refund_amount,
      paymentAmount: taxReturn.payment_amount,
      formsData: taxReturn.forms_data,
      aiSuggestions: taxReturn.ai_suggestions,
      createdAt: taxReturn.created_at,
      updatedAt: taxReturn.updated_at,
      filedAt: taxReturn.filed_at,
    },
  });
}));

// Create new tax return
router.post('/', asyncHandler(async (req, res) => {
  const validation = createTaxReturnSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { taxYear, filingStatus } = validation.data;

  // Check if user already has a return for this year
  const { data: existing } = await supabaseAdmin
    .from('tax_returns')
    .select('id')
    .eq('user_id', req.user!.id)
    .eq('tax_year', taxYear)
    .single();

  if (existing) {
    throw new ValidationError(`You already have a tax return for ${taxYear}`);
  }

  // Check subscription tier for tax year limits
  const tier = req.user!.subscriptionTier;
  if (tier === 'free') {
    // Free tier: 1 return per year
    const currentYear = new Date().getFullYear();
    const { count } = await supabaseAdmin
      .from('tax_returns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id)
      .gte('tax_year', currentYear - 1);

    if (count && count >= 1) {
      throw new AuthorizationError('Free tier allows only 1 tax return. Please upgrade to continue.');
    }
  }

  const { data: taxReturn, error } = await supabaseAdmin
    .from('tax_returns')
    .insert({
      user_id: req.user!.id,
      tax_year: taxYear,
      filing_status: filingStatus || null,
      status: 'draft',
      forms_data: {},
      ai_suggestions: [],
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to create tax return');
  }

  res.status(201).json({
    success: true,
    data: {
      id: taxReturn.id,
      taxYear: taxReturn.tax_year,
      filingStatus: taxReturn.filing_status,
      status: taxReturn.status,
      createdAt: taxReturn.created_at,
    },
  });
}));

// Update tax return
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('tax_returns')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Tax return');
  }

  // Cannot update filed returns
  if (existing.status === 'filed' || existing.status === 'accepted') {
    throw new ValidationError('Cannot update a filed tax return');
  }

  const allowedFields = [
    'filing_status',
    'total_income',
    'adjusted_gross_income',
    'taxable_income',
    'total_tax',
    'refund_amount',
    'payment_amount',
    'forms_data',
    'ai_suggestions',
    'status',
  ];

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (req.body[camelField] !== undefined) {
      updateData[field] = req.body[camelField];
    }
  }

  const { data: taxReturn, error } = await supabaseAdmin
    .from('tax_returns')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to update tax return');
  }

  res.json({
    success: true,
    data: {
      id: taxReturn.id,
      taxYear: taxReturn.tax_year,
      filingStatus: taxReturn.filing_status,
      status: taxReturn.status,
      totalIncome: taxReturn.total_income,
      adjustedGrossIncome: taxReturn.adjusted_gross_income,
      taxableIncome: taxReturn.taxable_income,
      totalTax: taxReturn.total_tax,
      refundAmount: taxReturn.refund_amount,
      paymentAmount: taxReturn.payment_amount,
      updatedAt: taxReturn.updated_at,
    },
  });
}));

// Delete tax return
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('tax_returns')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Tax return');
  }

  // Cannot delete filed returns
  if (existing.status === 'filed' || existing.status === 'accepted') {
    throw new ValidationError('Cannot delete a filed tax return');
  }

  const { error } = await supabaseAdmin
    .from('tax_returns')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ValidationError('Failed to delete tax return');
  }

  res.json({
    success: true,
    message: 'Tax return deleted successfully',
  });
}));

// File tax return (placeholder - would integrate with IRS API)
router.post('/:id/file', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership and status
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  if (taxReturn.status !== 'completed') {
    throw new ValidationError('Tax return must be completed before filing');
  }

  // TODO: Integrate with IRS e-file API
  // For now, just update status

  const { data: updated, error } = await supabaseAdmin
    .from('tax_returns')
    .update({
      status: 'filed',
      filed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to file tax return');
  }

  res.json({
    success: true,
    message: 'Tax return filed successfully',
    data: {
      id: updated.id,
      status: updated.status,
      filedAt: updated.filed_at,
    },
  });
}));

export default router;

