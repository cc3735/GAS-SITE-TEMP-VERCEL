/**
 * Admin Data Management Routes
 * 
 * Provides endpoints for managing data updates, monitoring
 * ingestion status, and triggering manual updates.
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { AuthorizationError, ValidationError } from '../../utils/errors.js';
import { dataUpdateScheduler } from '../../services/data-updates/scheduler.js';
import { supabaseAdmin } from '../../utils/supabase.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Middleware to check admin access
const requireAdmin = asyncHandler(async (req, _res, next) => {
  // In production, implement proper role-based access control
  // For now, check if user has enterprise tier
  if (req.user?.subscriptionTier !== 'enterprise') {
    throw new AuthorizationError('Admin access required');
  }
  next();
});

router.use(requireAdmin);

// Get data update schedule status
router.get('/schedule', asyncHandler(async (_req, res) => {
  const schedules = dataUpdateScheduler.getScheduleStatus();

  res.json({
    success: true,
    data: {
      schedules,
      schedulerRunning: true, // Would be dynamic in production
    },
  });
}));

// Update schedule for a data type
router.put('/schedule/:dataType', asyncHandler(async (req, res) => {
  const { dataType } = req.params;
  const { frequency, enabled } = req.body;

  const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annually'];
  if (frequency && !validFrequencies.includes(frequency)) {
    throw new ValidationError(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
  }

  dataUpdateScheduler.updateSchedule(dataType, {
    ...(frequency && { frequency }),
    ...(typeof enabled === 'boolean' && { enabled }),
  });

  const schedules = dataUpdateScheduler.getScheduleStatus();
  const updated = schedules.find(s => s.dataType === dataType);

  res.json({
    success: true,
    data: updated,
  });
}));

// Trigger manual update
router.post('/update/:dataType', asyncHandler(async (req, res) => {
  const { dataType } = req.params;

  const validTypes = ['federal_tax', 'state_tax', 'child_support', 'business_formation', 'filing_requirements'];
  if (!validTypes.includes(dataType)) {
    throw new ValidationError(`Invalid data type. Must be one of: ${validTypes.join(', ')}`);
  }

  const result = await dataUpdateScheduler.triggerUpdate(dataType);

  res.json({
    success: true,
    data: result,
  });
}));

// Get update history
router.get('/history', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = await dataUpdateScheduler.getUpdateHistory(limit);

  res.json({
    success: true,
    data: {
      history,
      totalRecords: history.length,
    },
  });
}));

// Get data statistics
router.get('/stats', asyncHandler(async (_req, res) => {
  // Fetch counts from all data tables
  const queries = [
    supabaseAdmin.from('lf_federal_tax_brackets').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_federal_deductions').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_federal_credits').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_state_tax_config').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_state_tax_brackets').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_child_support_guidelines').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_business_formation_requirements').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_filing_requirements').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('lf_legal_templates').select('*', { count: 'exact', head: true }),
  ];

  const results = await Promise.all(queries);

  const stats = {
    federalTaxBrackets: results[0].count || 0,
    federalDeductions: results[1].count || 0,
    federalCredits: results[2].count || 0,
    stateTaxConfigs: results[3].count || 0,
    stateTaxBrackets: results[4].count || 0,
    childSupportGuidelines: results[5].count || 0,
    businessFormationReqs: results[6].count || 0,
    filingRequirements: results[7].count || 0,
    legalTemplates: results[8].count || 0,
    totalRecords: results.reduce((sum, r) => sum + (r.count || 0), 0),
  };

  res.json({
    success: true,
    data: stats,
  });
}));

// Get data coverage summary
router.get('/coverage', asyncHandler(async (_req, res) => {
  // Check which states have data for each category
  const [childSupport, stateTax, businessFormation, filingReqs] = await Promise.all([
    supabaseAdmin.from('lf_child_support_guidelines').select('state_code, state_name'),
    supabaseAdmin.from('lf_state_tax_config').select('state_code, state_name, has_income_tax'),
    supabaseAdmin.from('lf_business_formation_requirements').select('state_code, entity_type').eq('entity_type', 'LLC'),
    supabaseAdmin.from('lf_filing_requirements').select('state_code').eq('filing_type', 'divorce'),
  ]);

  res.json({
    success: true,
    data: {
      childSupport: {
        statesWithData: childSupport.data?.length || 0,
        states: childSupport.data?.map(s => s.state_code) || [],
      },
      stateTax: {
        statesWithData: stateTax.data?.length || 0,
        statesWithIncomeTax: stateTax.data?.filter(s => s.has_income_tax).length || 0,
        statesWithNoTax: stateTax.data?.filter(s => !s.has_income_tax).length || 0,
      },
      businessFormation: {
        statesWithLLCData: businessFormation.data?.length || 0,
      },
      divorceFilings: {
        statesWithData: filingReqs.data?.length || 0,
      },
    },
  });
}));

// Export data as JSON
router.get('/export/:dataType', asyncHandler(async (req, res) => {
  const { dataType } = req.params;

  let data;
  let tableName: string;

  switch (dataType) {
    case 'federal_tax_brackets':
      tableName = 'lf_federal_tax_brackets';
      break;
    case 'federal_deductions':
      tableName = 'lf_federal_deductions';
      break;
    case 'federal_credits':
      tableName = 'lf_federal_credits';
      break;
    case 'state_tax_config':
      tableName = 'lf_state_tax_config';
      break;
    case 'child_support':
      tableName = 'lf_child_support_guidelines';
      break;
    case 'business_formation':
      tableName = 'lf_business_formation_requirements';
      break;
    case 'filing_requirements':
      tableName = 'lf_filing_requirements';
      break;
    default:
      throw new ValidationError('Invalid data type for export');
  }

  const result = await supabaseAdmin
    .from(tableName)
    .select('*')
    .order('created_at', { ascending: false });

  data = result.data;

  res.json({
    success: true,
    data: {
      dataType,
      exportedAt: new Date().toISOString(),
      recordCount: data?.length || 0,
      records: data,
    },
  });
}));

// Clear cache for all services
router.post('/clear-cache', asyncHandler(async (_req, res) => {
  // Import and clear caches from various services
  const { clearTaxCache } = await import('../../services/tax/tax-calculator.js');
  clearTaxCache();

  res.json({
    success: true,
    message: 'All caches cleared successfully',
    clearedAt: new Date().toISOString(),
  });
}));

export default router;

