import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';
import { createLegalFilingSchema, stateCodeSchema } from '../../utils/validation.js';
import type { FilingType, FilingStatus, JurisdictionRules } from '../../types/filing.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Supported filing types
const FILING_TYPES: Record<FilingType, { name: string; description: string; basePrice: number }> = {
  divorce: { name: 'Uncontested Divorce', description: 'File for uncontested divorce', basePrice: 149 },
  child_support_mod: { name: 'Child Support Modification', description: 'Modify existing child support order', basePrice: 99 },
  child_support_initial: { name: 'Initial Child Support', description: 'Establish child support order', basePrice: 99 },
  parenting_time: { name: 'Parenting Time Motion', description: 'Modify visitation schedule', basePrice: 79 },
  custody: { name: 'Custody Modification', description: 'Modify custody arrangement', basePrice: 129 },
  name_change: { name: 'Name Change', description: 'Legal name change petition', basePrice: 79 },
  bankruptcy_prep: { name: 'Bankruptcy Preparation', description: 'Prepare bankruptcy forms (Chapter 7/13)', basePrice: 199 },
  parenting_plan: { name: 'Parenting Plan', description: 'Create parenting plan agreement', basePrice: 69 },
  enforcement: { name: 'Enforcement Motion', description: 'Enforce existing court order', basePrice: 89 },
  fee_waiver: { name: 'Fee Waiver Application', description: 'Apply for court fee waiver', basePrice: 0 },
};

// List all filings for user
router.get('/', asyncHandler(async (req, res) => {
  const { status, type, limit = 20, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('legal_filings')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (status) {
    query = query.eq('status', status);
  }

  if (type) {
    query = query.eq('filing_type', type);
  }

  const { data: filings, count, error } = await query;

  if (error) {
    throw new ValidationError('Failed to fetch filings');
  }

  res.json({
    success: true,
    data: {
      filings: filings.map((f) => ({
        id: f.id,
        filingType: f.filing_type,
        filingTypeName: FILING_TYPES[f.filing_type as FilingType]?.name || f.filing_type,
        jurisdictionState: f.jurisdiction_state,
        jurisdictionCounty: f.jurisdiction_county,
        status: f.status,
        caseNumber: f.case_number,
        filingFee: f.filing_fee,
        feeWaiverApplied: f.fee_waiver_applied,
        nextDeadline: f.next_deadline,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
        filedAt: f.filed_at,
      })),
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
      },
    },
  });
}));

// Get available filing types
router.get('/types', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      filingTypes: Object.entries(FILING_TYPES).map(([type, info]) => ({
        type,
        ...info,
      })),
    },
  });
}));

// Get single filing
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: filing, error } = await supabaseAdmin
    .from('legal_filings')
    .select('*, court_forms(*)')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !filing) {
    throw new NotFoundError('Filing');
  }

  res.json({
    success: true,
    data: {
      id: filing.id,
      filingType: filing.filing_type,
      filingTypeName: FILING_TYPES[filing.filing_type as FilingType]?.name,
      jurisdictionState: filing.jurisdiction_state,
      jurisdictionCounty: filing.jurisdiction_county,
      courtName: filing.court_name,
      caseNumber: filing.case_number,
      status: filing.status,
      interviewData: filing.interview_data,
      generatedForms: filing.generated_forms,
      filingChecklist: filing.filing_checklist,
      courtFilingId: filing.court_filing_id,
      filingFee: filing.filing_fee,
      feeWaiverApplied: filing.fee_waiver_applied,
      nextDeadline: filing.next_deadline,
      forms: filing.court_forms,
      createdAt: filing.created_at,
      updatedAt: filing.updated_at,
      filedAt: filing.filed_at,
    },
  });
}));

// Start new filing
router.post('/start', asyncHandler(async (req, res) => {
  const validation = createLegalFilingSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { filingType, jurisdictionState, jurisdictionCounty } = validation.data;

  // Check if filing type is supported
  if (!FILING_TYPES[filingType]) {
    throw new ValidationError('Unsupported filing type');
  }

  // Check subscription tier
  const tier = req.user!.subscriptionTier;
  const price = FILING_TYPES[filingType].basePrice;

  if (tier === 'free' && price > 0) {
    throw new AuthorizationError('Free tier can only access free features. Please upgrade to continue.');
  }

  // Get jurisdiction rules
  const { data: rules } = await supabaseAdmin
    .from('jurisdiction_rules')
    .select('*')
    .eq('state_code', jurisdictionState)
    .eq('filing_type', filingType);

  // Build filing checklist
  const checklist = generateFilingChecklist(filingType, jurisdictionState, rules || []);

  // Estimate filing fee
  const filingFeeRule = rules?.find((r) => r.rule_key === 'filing_fee');
  const filingFee = filingFeeRule?.rule_value as number || 0;

  const { data: filing, error } = await supabaseAdmin
    .from('legal_filings')
    .insert({
      user_id: req.user!.id,
      filing_type: filingType,
      jurisdiction_state: jurisdictionState,
      jurisdiction_county: jurisdictionCounty || null,
      status: 'draft',
      interview_data: {},
      generated_forms: [],
      filing_checklist: checklist,
      filing_fee: filingFee,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to create filing');
  }

  res.status(201).json({
    success: true,
    data: {
      id: filing.id,
      filingType,
      filingTypeName: FILING_TYPES[filingType].name,
      jurisdictionState,
      jurisdictionCounty,
      status: filing.status,
      checklist,
      estimatedFilingFee: filingFee,
      nextStep: 'Complete the filing interview',
    },
  });
}));

// Update filing
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('legal_filings')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Filing');
  }

  if (['filed', 'accepted', 'completed'].includes(existing.status)) {
    throw new ValidationError('Cannot update a filed or completed filing');
  }

  const allowedFields = [
    'jurisdiction_county',
    'court_name',
    'case_number',
    'interview_data',
    'filing_checklist',
    'fee_waiver_applied',
    'next_deadline',
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

  const { data: filing, error } = await supabaseAdmin
    .from('legal_filings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to update filing');
  }

  res.json({
    success: true,
    data: {
      id: filing.id,
      status: filing.status,
      updatedAt: filing.updated_at,
    },
  });
}));

// Delete filing
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: existing } = await supabaseAdmin
    .from('legal_filings')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Filing');
  }

  if (['filed', 'accepted'].includes(existing.status)) {
    throw new ValidationError('Cannot delete a filed filing');
  }

  const { error } = await supabaseAdmin
    .from('legal_filings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ValidationError('Failed to delete filing');
  }

  res.json({
    success: true,
    message: 'Filing deleted successfully',
  });
}));

// Get filing status
router.get('/:id/status', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('id, status, court_filing_id, next_deadline, filing_checklist, updated_at')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  // TODO: If court_filing_id exists, check with e-filing system for real-time status

  res.json({
    success: true,
    data: {
      id: filing.id,
      status: filing.status,
      courtFilingId: filing.court_filing_id,
      nextDeadline: filing.next_deadline,
      checklist: filing.filing_checklist,
      lastUpdated: filing.updated_at,
    },
  });
}));

// Get generated forms for a filing
router.get('/:id/forms', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  const { data: forms } = await supabaseAdmin
    .from('court_forms')
    .select('*')
    .eq('legal_filing_id', id)
    .order('filing_sequence');

  res.json({
    success: true,
    data: {
      forms: forms?.map((f) => ({
        id: f.id,
        formName: f.form_name,
        formType: f.form_type,
        filingSequence: f.filing_sequence,
        required: f.required,
        pdfUrl: f.pdf_url,
        createdAt: f.created_at,
      })) || [],
    },
  });
}));

// Generate forms for filing
router.post('/:id/generate-forms', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('*')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  if (!filing.interview_data || Object.keys(filing.interview_data as object).length === 0) {
    throw new ValidationError('Complete the interview before generating forms');
  }

  // TODO: Generate actual court forms based on filing type and jurisdiction
  // For now, return placeholder

  res.json({
    success: true,
    data: {
      message: 'Form generation initiated',
      status: 'processing',
      estimatedTime: '2-5 minutes',
      note: 'Forms will be available in the forms tab once generated',
    },
  });
}));

// Helper function to generate filing checklist
function generateFilingChecklist(
  filingType: FilingType,
  state: string,
  rules: Array<{ rule_key: string | null; rule_value: unknown }>
): Array<{ id: string; title: string; description: string; status: string }> {
  const baseChecklist = [
    { id: 'interview', title: 'Complete Interview', description: 'Answer all required questions', status: 'pending' },
    { id: 'review', title: 'Review Information', description: 'Verify all information is correct', status: 'pending' },
    { id: 'generate_forms', title: 'Generate Forms', description: 'Generate court-ready documents', status: 'pending' },
    { id: 'review_forms', title: 'Review Forms', description: 'Review generated forms for accuracy', status: 'pending' },
  ];

  // Add type-specific items
  switch (filingType) {
    case 'divorce':
      baseChecklist.push(
        { id: 'serve_spouse', title: 'Serve Spouse', description: 'Serve documents to other party', status: 'pending' },
        { id: 'waiting_period', title: 'Waiting Period', description: 'Wait for mandatory waiting period', status: 'pending' }
      );
      break;
    case 'name_change':
      baseChecklist.push(
        { id: 'publication', title: 'Publish Notice', description: 'Publish name change in newspaper (if required)', status: 'pending' },
        { id: 'background_check', title: 'Background Check', description: 'Pass required background check', status: 'pending' }
      );
      break;
  }

  // Add mediation if required
  const mediationRule = rules.find((r) => r.rule_key === 'requires_mediation');
  if (mediationRule?.rule_value === true) {
    baseChecklist.push(
      { id: 'mediation', title: 'Complete Mediation', description: 'Attend required mediation session', status: 'pending' }
    );
  }

  // Final steps
  baseChecklist.push(
    { id: 'file', title: 'File with Court', description: 'Submit documents to the court', status: 'pending' },
    { id: 'hearing', title: 'Attend Hearing', description: 'Attend court hearing (if required)', status: 'pending' }
  );

  return baseChecklist;
}

export default router;

