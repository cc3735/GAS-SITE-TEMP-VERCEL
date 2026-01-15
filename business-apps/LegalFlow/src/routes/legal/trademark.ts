/**
 * Trademark Routes
 *
 * API endpoints for the trademark registration workflow.
 * Supports both Federal (USPTO) and State trademark registrations.
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, requireTier } from '../../middleware/auth.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';
import { logger } from '../../utils/logger.js';

// Services
import * as trademarkSearch from '../../services/trademark/trademark-search.js';
import * as trademarkAI from '../../services/trademark/trademark-ai.js';
import * as trademarkWorkflow from '../../services/trademark/trademark-workflow.js';
import * as teasGenerator from '../../services/trademark/teas-generator.js';
import * as stateService from '../../services/trademark/state-trademark.js';

// Types
import type {
  TrademarkSearchRequest,
  TEASApplicationType,
  JurisdictionType,
  TRADEMARK_TIER_LIMITS,
} from '../../types/trademark.js';

// Import Nice classes for classification endpoint
import niceClasses from '../../data/nice-classes.json' assert { type: 'json' };

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== SEARCH ENDPOINTS ====================

/**
 * POST /api/legal/trademark/search
 * Search USPTO database (with third-party fallback)
 */
router.post('/search', asyncHandler(async (req, res) => {
  const { term, searchType = 'exact', jurisdiction = 'federal', state, classFilter, statusFilter } = req.body;

  if (!term || term.length < 2) {
    throw new ValidationError('Search term must be at least 2 characters');
  }

  // Check search limits based on tier
  const tier = req.user!.subscriptionTier;
  await checkSearchLimits(req.user!.id, tier, jurisdiction);

  const searchRequest: TrademarkSearchRequest = {
    term,
    search_type: searchType,
    jurisdiction,
    state,
    class_filter: classFilter,
    status_filter: statusFilter,
  };

  const report = await trademarkSearch.searchTrademarks(searchRequest, req.user!.id);

  res.json({
    success: true,
    data: {
      report,
      resultCount: report.result_count,
      riskScore: report.risk_score,
      recommendations: report.recommendations,
      provider: report.search_provider,
      fallbackUsed: report.fallback_used,
    },
  });
}));

/**
 * GET /api/legal/trademark/search/:id
 * Get a specific search report
 */
router.get('/search/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const report = await trademarkSearch.getSearchReport(id);

  if (!report || report.user_id !== req.user!.id) {
    throw new NotFoundError('Search report');
  }

  res.json({
    success: true,
    data: report,
  });
}));

/**
 * POST /api/legal/trademark/search/:id/ai-analysis
 * Run AI conflict analysis on search results
 */
router.post('/search/:id/ai-analysis', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { goodsServices } = req.body;

  const report = await trademarkSearch.getSearchReport(id);

  if (!report || report.user_id !== req.user!.id) {
    throw new NotFoundError('Search report');
  }

  const analysis = await trademarkAI.analyzeConflictRisk(
    report.search_term,
    goodsServices || '',
    report.results,
    req.user!.id
  );

  res.json({
    success: true,
    data: analysis,
  });
}));

/**
 * GET /api/legal/trademark/search/history
 * Get user's search history
 */
router.get('/search/history', asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;

  const history = await trademarkSearch.getSearchHistory(
    req.user!.id,
    Number(limit)
  );

  res.json({
    success: true,
    data: history,
  });
}));

// ==================== APPLICATION ENDPOINTS ====================

/**
 * GET /api/legal/trademark/applications
 * List user's trademark applications
 */
router.get('/applications', asyncHandler(async (req, res) => {
  const { status, limit = 20, offset = 0 } = req.query;

  const result = await trademarkWorkflow.listApplications(req.user!.id, {
    status: status as any,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({
    success: true,
    data: {
      applications: result.applications,
      pagination: {
        total: result.total,
        limit: Number(limit),
        offset: Number(offset),
      },
    },
  });
}));

/**
 * POST /api/legal/trademark/applications
 * Create new trademark application
 */
router.post('/applications', asyncHandler(async (req, res) => {
  // Check if user can create applications
  const tier = req.user!.subscriptionTier;
  if (tier === 'free') {
    // Free tier can create drafts but not file
    // Allow creation for now
  }

  const application = await trademarkWorkflow.createApplication(
    req.user!.id,
    req.body.organizationId
  );

  res.status(201).json({
    success: true,
    data: application,
  });
}));

/**
 * GET /api/legal/trademark/applications/:id
 * Get application details
 */
router.get('/applications/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);

  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  res.json({
    success: true,
    data: application,
  });
}));

/**
 * PUT /api/legal/trademark/applications/:id
 * Update application
 */
router.put('/applications/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await trademarkWorkflow.updateApplication(
    id,
    req.user!.id,
    req.body
  );

  res.json({
    success: true,
    data: application,
  });
}));

/**
 * DELETE /api/legal/trademark/applications/:id
 * Delete draft application
 */
router.delete('/applications/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  await trademarkWorkflow.deleteApplication(id, req.user!.id);

  res.json({
    success: true,
    message: 'Application deleted',
  });
}));

// ==================== INTERVIEW/WORKFLOW ENDPOINTS ====================

/**
 * GET /api/legal/trademark/applications/:id/interview
 * Get current interview state
 */
router.get('/applications/:id/interview', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const state = await trademarkWorkflow.getInterviewState(id, req.user!.id);

  res.json({
    success: true,
    data: {
      ...state,
      steps: trademarkWorkflow.WORKFLOW_STEPS,
    },
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/interview/answer
 * Submit answer to interview question
 */
router.post('/applications/:id/interview/answer', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionId, answer } = req.body;

  if (!questionId) {
    throw new ValidationError('Question ID is required');
  }

  const result = await trademarkWorkflow.submitAnswer(
    id,
    req.user!.id,
    questionId,
    answer
  );

  res.json({
    success: result.success,
    data: {
      aiSuggestion: result.aiSuggestion,
      nextQuestion: result.nextQuestion,
    },
    errors: result.validationErrors,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/interview/clarify
 * Get AI clarification for a question
 */
router.post('/applications/:id/interview/clarify', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { questionId, userQuestion } = req.body;

  if (!questionId || !userQuestion) {
    throw new ValidationError('Question ID and user question are required');
  }

  const clarification = await trademarkWorkflow.getClarification(
    id,
    req.user!.id,
    questionId,
    userQuestion
  );

  res.json({
    success: true,
    data: {
      clarification,
    },
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/interview/next
 * Move to next step
 */
router.post('/applications/:id/interview/next', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await trademarkWorkflow.nextStep(id, req.user!.id);

  res.json({
    success: result.success,
    data: {
      newStep: result.newStep,
    },
    errors: result.errors,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/interview/previous
 * Move to previous step
 */
router.post('/applications/:id/interview/previous', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await trademarkWorkflow.previousStep(id, req.user!.id);

  res.json({
    success: true,
    data: {
      newStep: result.newStep,
    },
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/interview/complete
 * Complete the interview
 */
router.post('/applications/:id/interview/complete', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await trademarkWorkflow.completeInterview(id, req.user!.id);

  res.json({
    success: result.success,
    data: {
      application: result.application,
      aiSuggestions: result.aiSuggestions,
    },
    errors: result.errors,
  });
}));

// ==================== DOCUMENT GENERATION ENDPOINTS ====================

/**
 * POST /api/legal/trademark/applications/:id/generate-documents
 * Generate all filing documents
 */
router.post('/applications/:id/generate-documents', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teasType = 'plus' } = req.body;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  let result;

  if (application.jurisdiction_type === 'federal') {
    result = await teasGenerator.generateTEASApplication(
      application,
      teasType as TEASApplicationType
    );
  } else {
    result = await stateService.generateStateApplication(application);
  }

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/generate-pdf
 * Generate filing PDF
 */
router.post('/applications/:id/generate-pdf', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { documentType, teasType = 'plus' } = req.body;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  let result;

  switch (documentType) {
    case 'teas_application':
      result = await teasGenerator.generateTEASApplication(application, teasType);
      break;
    case 'statement_of_use':
      result = await teasGenerator.generateStatementOfUse(application);
      break;
    case 'extension_request':
      result = await teasGenerator.generateExtensionRequest(application);
      break;
    case 'section_8':
      result = await teasGenerator.generateSection8Declaration(application);
      break;
    case 'section_9':
      result = await teasGenerator.generateSection9Renewal(application);
      break;
    case 'section_15':
      result = await teasGenerator.generateSection15Declaration(application);
      break;
    case 'state_application':
      result = await stateService.generateStateApplication(application);
      break;
    case 'state_renewal':
      result = await stateService.generateStateRenewal(application);
      break;
    default:
      throw new ValidationError('Invalid document type');
  }

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/ai-enhance
 * Get AI enhancements for application
 */
router.post('/applications/:id/ai-enhance', requireTier(['premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const suggestions = await trademarkAI.generateApplicationSuggestions(
    application.mark_text || '',
    application.mark_type,
    application.goods_services,
    application.filing_basis,
    req.user!.id
  );

  // Update application with suggestions
  await trademarkWorkflow.updateApplication(id, req.user!.id, {
    ai_suggestions: suggestions,
  });

  res.json({
    success: true,
    data: suggestions,
  });
}));

// ==================== SPECIMEN ENDPOINTS ====================

/**
 * POST /api/legal/trademark/applications/:id/specimens
 * Upload specimen
 */
router.post('/applications/:id/specimens', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { fileUrl, fileType, description, classNumber } = req.body;

  if (!fileUrl || !description || !classNumber) {
    throw new ValidationError('File URL, description, and class number are required');
  }

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const specimen = {
    id: crypto.randomUUID(),
    file_url: fileUrl,
    file_type: fileType || 'image',
    description,
    class_number: classNumber,
    uploaded_at: new Date().toISOString(),
  };

  await trademarkWorkflow.updateApplication(id, req.user!.id, {
    specimens: [...application.specimens, specimen],
  });

  res.json({
    success: true,
    data: specimen,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/analyze-specimen
 * AI analysis of specimen
 */
router.post('/applications/:id/analyze-specimen', requireTier(['premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { specimenUrl, specimenDescription } = req.body;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const analysis = await trademarkAI.analyzeSpecimen(
    specimenUrl,
    specimenDescription,
    application.mark_type,
    application.mark_text || '',
    application.goods_services,
    req.user!.id
  );

  res.json({
    success: true,
    data: analysis,
  });
}));

/**
 * GET /api/legal/trademark/applications/:id/filing-checklist
 * Get filing checklist
 */
router.get('/applications/:id/filing-checklist', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const checklist = generateFilingChecklist(application);

  res.json({
    success: true,
    data: checklist,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/submit
 * Mark application as ready to file
 */
router.post('/applications/:id/submit', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  if (application.status !== 'ready') {
    throw new ValidationError('Application must be complete before submission');
  }

  await trademarkWorkflow.updateApplication(id, req.user!.id, {
    status: 'filed',
    filing_date: new Date().toISOString(),
  });

  res.json({
    success: true,
    message: 'Application marked as filed. Please complete filing through USPTO/state portal.',
  });
}));

// ==================== CLASSIFICATION ENDPOINTS ====================

/**
 * GET /api/legal/trademark/nice-classes
 * List all 45 Nice classification classes
 */
router.get('/nice-classes', asyncHandler(async (_req, res) => {
  res.json({
    success: true,
    data: {
      classes: niceClasses,
      total: niceClasses.length,
    },
  });
}));

/**
 * POST /api/legal/trademark/classify
 * AI classification suggestion
 */
router.post('/classify', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description) {
    throw new ValidationError('Description is required');
  }

  const result = await trademarkAI.suggestNiceClasses(description, req.user!.id);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/describe-goods
 * AI goods/services description generator
 */
router.post('/describe-goods', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { userDescription, classNumber } = req.body;

  if (!userDescription || !classNumber) {
    throw new ValidationError('User description and class number are required');
  }

  const result = await trademarkAI.generateGoodsDescription(
    userDescription,
    classNumber,
    req.user!.id
  );

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/analyze-mark
 * Analyze mark strength
 */
router.post('/analyze-mark', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { markText, goodsServices } = req.body;

  if (!markText) {
    throw new ValidationError('Mark text is required');
  }

  const analysis = await trademarkAI.analyzeMarkStrength(
    markText,
    goodsServices,
    req.user!.id
  );

  res.json({
    success: true,
    data: analysis,
  });
}));

// ==================== STATE TRADEMARK ENDPOINTS ====================

/**
 * GET /api/legal/trademark/states
 * List all 50 states + requirements
 */
router.get('/states', asyncHandler(async (_req, res) => {
  const states = stateService.getAllStateRequirements();

  res.json({
    success: true,
    data: {
      states,
      total: states.length,
      byFilingMethod: {
        online: stateService.getStatesByFilingMethod('online').length,
        mail: stateService.getStatesByFilingMethod('mail').length,
        both: stateService.getStatesByFilingMethod('both').length,
      },
    },
  });
}));

/**
 * GET /api/legal/trademark/states/:state
 * Get specific state requirements
 */
router.get('/states/:state', asyncHandler(async (req, res) => {
  const { state } = req.params;

  const requirements = stateService.getStateRequirements(state);

  if (!requirements) {
    throw new NotFoundError(`State ${state}`);
  }

  res.json({
    success: true,
    data: requirements,
  });
}));

/**
 * POST /api/legal/trademark/states/:state/search
 * Search state trademark database
 */
router.post('/states/:state/search', requireTier(['basic', 'premium', 'pro']), asyncHandler(async (req, res) => {
  const { state } = req.params;
  const { term } = req.body;

  if (!term) {
    throw new ValidationError('Search term is required');
  }

  const result = await stateService.searchStateDatabase(state, term);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/applications/:id/generate-state-forms
 * Generate state-specific forms
 */
router.post('/applications/:id/generate-state-forms', requireTier(['premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { stateCodes } = req.body;

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  if (!stateCodes || !Array.isArray(stateCodes) || stateCodes.length === 0) {
    throw new ValidationError('State codes array is required');
  }

  const result = await stateService.generateMultiStateApplications(application, stateCodes);

  res.json({
    success: true,
    data: result,
  });
}));

/**
 * POST /api/legal/trademark/states/calculate-fees
 * Calculate fees for multiple states
 */
router.post('/states/calculate-fees', asyncHandler(async (req, res) => {
  const { stateCodes, numberOfClasses = 1 } = req.body;

  if (!stateCodes || !Array.isArray(stateCodes)) {
    throw new ValidationError('State codes array is required');
  }

  const feesByState: Record<string, { total: number; breakdown: any[] }> = {};
  let grandTotal = 0;

  for (const stateCode of stateCodes) {
    try {
      const fees = stateService.calculateStateFees(stateCode, numberOfClasses);
      feesByState[stateCode] = fees;
      grandTotal += fees.total;
    } catch {
      feesByState[stateCode] = { total: 0, breakdown: [] };
    }
  }

  res.json({
    success: true,
    data: {
      feesByState,
      grandTotal,
      numberOfClasses,
    },
  });
}));

// ==================== OFFICE ACTION ENDPOINTS ====================

/**
 * POST /api/legal/trademark/applications/:id/office-action-help
 * Get AI help for office action response
 */
router.post('/applications/:id/office-action-help', requireTier(['premium', 'pro']), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { officeActionText } = req.body;

  if (!officeActionText) {
    throw new ValidationError('Office action text is required');
  }

  const application = await trademarkWorkflow.getApplication(id, req.user!.id);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const response = await trademarkAI.generateOfficeActionResponse(
    officeActionText,
    {
      markText: application.mark_text || '',
      markType: application.mark_type,
      goodsServices: application.goods_services,
      filingBasis: application.filing_basis,
    },
    req.user!.id
  );

  res.json({
    success: true,
    data: response,
  });
}));

// ==================== HELPER FUNCTIONS ====================

/**
 * Check search limits based on tier
 */
async function checkSearchLimits(
  userId: string,
  tier: string,
  jurisdiction: JurisdictionType
): Promise<void> {
  const limits: Record<string, { federal: number; state: number }> = {
    free: { federal: 1, state: 0 },
    basic: { federal: 10, state: 5 },
    premium: { federal: -1, state: -1 },
    pro: { federal: -1, state: -1 },
  };

  const tierLimits = limits[tier] || limits.free;
  const limit = jurisdiction === 'federal' ? tierLimits.federal : tierLimits.state;

  if (limit === -1) return; // Unlimited

  if (limit === 0) {
    throw new AuthorizationError(
      `${jurisdiction === 'state' ? 'State' : 'Federal'} trademark search is not available on the ${tier} tier`
    );
  }

  // Check monthly usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const history = await trademarkSearch.getSearchHistory(userId, 100);
  const monthlySearches = history.filter(report => {
    const reportDate = new Date(report.created_at);
    return reportDate >= startOfMonth && report.jurisdiction_type === jurisdiction;
  });

  if (monthlySearches.length >= limit) {
    throw new AuthorizationError(
      `${tier} tier limit reached (${limit} ${jurisdiction} searches/month). Please upgrade for more searches.`
    );
  }
}

/**
 * Generate filing checklist for application
 */
function generateFilingChecklist(application: any): {
  item: string;
  complete: boolean;
  required: boolean;
}[] {
  const checklist = [
    {
      item: 'Mark information complete',
      complete: !!(application.mark_text || application.mark_image_url),
      required: true,
    },
    {
      item: 'Owner information complete',
      complete: !!(application.owner_name && application.owner_address?.street),
      required: true,
    },
    {
      item: 'Goods/services identified',
      complete: application.goods_services?.length > 0,
      required: true,
    },
    {
      item: 'Filing basis selected',
      complete: !!application.filing_basis,
      required: true,
    },
    {
      item: 'Specimen uploaded',
      complete: application.specimens?.length > 0,
      required: application.filing_basis === 'use',
    },
    {
      item: 'Declaration signed',
      complete: !!(application.declarations?.signatory_name && application.declarations?.electronic_signature),
      required: true,
    },
    {
      item: 'AI suggestions reviewed',
      complete: !!application.ai_suggestions,
      required: false,
    },
  ];

  return checklist;
}

export default router;
