/**
 * State E-Filing Routes
 *
 * Provides endpoints for state tax return preparation, calculation,
 * validation, and e-filing for all 50 states.
 *
 * @module routes/tax/state-e-filing
 */

import { Router, Request, Response, NextFunction } from 'express';
import { stateEFilingService, StateReturnInput } from '../../services/tax/state-e-filing.js';
import { authenticate } from '../../middleware/auth.js';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// STATE INFORMATION
// ============================================================================

/**
 * GET /states
 * Get all state configurations
 */
router.get('/states', async (_req: Request, res: Response) => {
  const states = stateEFilingService.getAllStateConfigs();

  // Sort alphabetically by name
  const sortedStates = states.sort((a, b) => a.name.localeCompare(b.name));

  res.json({
    success: true,
    data: {
      states: sortedStates.map((s) => ({
        code: s.code,
        name: s.name,
        taxType: s.taxType,
        flatRate: s.flatRate,
        eFileSupported: s.eFileSupported,
        filingDeadline: s.filingDeadline,
        hasLocalTax: s.specialRules?.some((r) => r.toLowerCase().includes('local')) || false,
      })),
      totalStates: sortedStates.length,
      eFileStates: sortedStates.filter((s) => s.eFileSupported).length,
      noTaxStates: sortedStates.filter((s) => s.taxType === 'none').length,
    },
  });
});

/**
 * GET /states/:stateCode
 * Get detailed configuration for a specific state
 */
router.get('/states/:stateCode', async (req: Request, res: Response) => {
  const { stateCode } = req.params;

  const config = stateEFilingService.getStateConfig(stateCode);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: `State not found: ${stateCode}`,
    });
  }

  res.json({
    success: true,
    data: config,
  });
});

/**
 * GET /states/efile
 * Get states that support e-filing
 */
router.get('/states/efile', async (_req: Request, res: Response) => {
  const efileStates = stateEFilingService.getEFileStates();

  res.json({
    success: true,
    data: {
      states: efileStates.map((s) => ({
        code: s.code,
        name: s.name,
        taxType: s.taxType,
        eFileProvider: s.eFileProvider,
      })),
      count: efileStates.length,
    },
  });
});

/**
 * GET /states/no-tax
 * Get states with no income tax
 */
router.get('/states/no-tax', async (_req: Request, res: Response) => {
  const noTaxStates = stateEFilingService.getNoTaxStates();

  res.json({
    success: true,
    data: {
      states: noTaxStates.map((s) => ({
        code: s.code,
        name: s.name,
        specialRules: s.specialRules,
      })),
      count: noTaxStates.length,
      note: 'These states do not have a general income tax. Some may have taxes on specific income types.',
    },
  });
});

/**
 * GET /states/:stateCode/reciprocal
 * Get reciprocal tax agreements for a state
 */
router.get('/states/:stateCode/reciprocal', async (req: Request, res: Response) => {
  const { stateCode } = req.params;

  const config = stateEFilingService.getStateConfig(stateCode);

  if (!config) {
    return res.status(404).json({
      success: false,
      error: `State not found: ${stateCode}`,
    });
  }

  res.json({
    success: true,
    data: {
      state: config.code,
      stateName: config.name,
      reciprocalStates: config.reciprocalStates || [],
      explanation:
        'If you live in this state but work in a reciprocal state, you only need to pay taxes to your state of residence.',
    },
  });
});

// ============================================================================
// STATE RETURN CALCULATION
// ============================================================================

/**
 * POST /calculate
 * Calculate state tax return
 */
router.post('/calculate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const input: StateReturnInput = {
      ...req.body,
      userId,
    };

    // Validate required fields
    if (!input.state || !input.taxYear || !input.filingStatus || !input.federalReturnId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: state, taxYear, filingStatus, federalReturnId',
      });
    }

    const stateReturn = stateEFilingService.calculateStateTax(input);

    res.json({
      success: true,
      data: {
        return: stateReturn,
        summary: {
          state: stateReturn.state,
          stateTaxableIncome: stateReturn.stateTaxableIncome,
          grossTax: stateReturn.grossTax,
          credits: stateReturn.credits,
          netTax: stateReturn.netTax,
          withholding: stateReturn.withholding,
          amountDue: stateReturn.amountDue,
          refundAmount: stateReturn.refundAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /calculate/multi-state
 * Calculate returns for multiple states
 */
router.post('/calculate/multi-state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { states, commonData } = req.body;

    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one state is required',
      });
    }

    const returns = [];
    let totalTax = 0;
    let totalRefund = 0;
    let totalDue = 0;

    for (const stateData of states) {
      const input: StateReturnInput = {
        ...commonData,
        ...stateData,
        userId,
      };

      try {
        const stateReturn = stateEFilingService.calculateStateTax(input);
        returns.push(stateReturn);
        totalTax += stateReturn.netTax;
        totalRefund += stateReturn.refundAmount;
        totalDue += stateReturn.amountDue;
      } catch (err: any) {
        returns.push({
          state: stateData.state,
          error: err.message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        returns,
        summary: {
          statesProcessed: returns.length,
          totalStateTax: totalTax,
          totalRefund,
          totalDue,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /calculate/other-state-credit
 * Calculate credit for taxes paid to other states
 */
router.post('/calculate/other-state-credit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const input: StateReturnInput = {
      ...req.body,
      userId,
    };

    if (!input.state || !input.otherStateIncome) {
      return res.status(400).json({
        success: false,
        error: 'Resident state and other state income information required',
      });
    }

    const credit = stateEFilingService.calculateOtherStateCredit(input);

    res.json({
      success: true,
      data: {
        residentState: input.state,
        otherStates: input.otherStateIncome,
        creditAmount: credit,
        explanation:
          'This credit reduces your resident state tax by the amount of tax paid to other states, limited to what you would owe on that income in your resident state.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// STATE RETURN MANAGEMENT
// ============================================================================

/**
 * POST /returns
 * Create and save a state tax return
 */
router.post('/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const input: StateReturnInput = {
      ...req.body,
      userId,
    };

    // Calculate return
    const stateReturn = stateEFilingService.calculateStateTax(input);

    // Save to database
    const { error } = await supabase.from('state_tax_returns').insert({
      id: stateReturn.id,
      user_id: userId,
      federal_return_id: stateReturn.federalReturnId,
      state: stateReturn.state,
      tax_year: stateReturn.taxYear,
      filing_status: stateReturn.filingStatus,
      residency_status: stateReturn.residencyStatus,
      federal_agi: stateReturn.federalAgi,
      state_agi: stateReturn.stateAgi,
      state_taxable_income: stateReturn.stateTaxableIncome,
      state_deductions: stateReturn.stateDeductions,
      state_exemptions: stateReturn.stateExemptions,
      gross_tax: stateReturn.grossTax,
      credits: stateReturn.credits,
      net_tax: stateReturn.netTax,
      withholding: stateReturn.withholding,
      estimated_payments: stateReturn.estimatedPayments,
      amount_due: stateReturn.amountDue,
      refund_amount: stateReturn.refundAmount,
      status: stateReturn.status,
      forms: stateReturn.forms,
      created_at: stateReturn.createdAt.toISOString(),
      updated_at: stateReturn.updatedAt.toISOString(),
    });

    if (error) {
      logger.error('Error saving state return', { error });
      throw new Error('Failed to save state return');
    }

    res.status(201).json({
      success: true,
      data: stateReturn,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /returns
 * Get all state returns for the current user
 */
router.get('/returns', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { taxYear, state } = req.query;

    let query = supabase
      .from('state_tax_returns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (taxYear) {
      query = query.eq('tax_year', parseInt(taxYear as string));
    }

    if (state) {
      query = query.eq('state', state);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Failed to fetch state returns');
    }

    res.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /returns/:returnId
 * Get a specific state return
 */
router.get('/returns/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { returnId } = req.params;

    const { data, error } = await supabase
      .from('state_tax_returns')
      .select('*')
      .eq('id', returnId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'State return not found',
      });
    }

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /returns/:returnId
 * Delete a state return
 */
router.delete('/returns/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { returnId } = req.params;

    // Check if return exists and belongs to user
    const { data: existing } = await supabase
      .from('state_tax_returns')
      .select('id, status')
      .eq('id', returnId)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'State return not found',
      });
    }

    if (existing.status === 'filed' || existing.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete a filed return',
      });
    }

    await supabase.from('state_tax_returns').delete().eq('id', returnId);

    res.json({
      success: true,
      message: 'State return deleted',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// E-FILING
// ============================================================================

/**
 * POST /efile/validate/:returnId
 * Validate a state return for e-filing
 */
router.post('/efile/validate/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { returnId } = req.params;

    // Load return
    const { data, error } = await supabase
      .from('state_tax_returns')
      .select('*')
      .eq('id', returnId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'State return not found',
      });
    }

    // Validate
    const validation = stateEFilingService.validateForEFiling(data as any);

    res.json({
      success: true,
      data: {
        isValid: validation.isValid,
        errors: validation.errors,
        returnId,
        state: data.state,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /efile/submit/:returnId
 * Submit a state return for e-filing
 */
router.post('/efile/submit/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { returnId } = req.params;

    const submission = await stateEFilingService.submitForEFiling(returnId, userId);

    res.json({
      success: true,
      data: submission,
      message: `State return submitted for e-filing. Submission ID: ${submission.submissionId}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /efile/status/:submissionId
 * Check e-file status
 */
router.get('/efile/status/:submissionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { submissionId } = req.params;

    const submission = await stateEFilingService.checkEFileStatus(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
      });
    }

    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /efile/submissions
 * Get all e-file submissions for the current user
 */
router.get('/efile/submissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // Get all state returns for user
    const { data: returns } = await supabase
      .from('state_tax_returns')
      .select('id')
      .eq('user_id', userId);

    if (!returns || returns.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const returnIds = returns.map((r) => r.id);

    // Get submissions for those returns
    const { data: submissions } = await supabase
      .from('state_efile_submissions')
      .select('*')
      .in('state_return_id', returnIds)
      .order('submitted_at', { ascending: false });

    res.json({
      success: true,
      data: submissions || [],
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TAX ESTIMATOR
// ============================================================================

/**
 * POST /estimate
 * Quick state tax estimate without creating a return
 */
router.post('/estimate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      state,
      filingStatus,
      federalAgi,
      stateWages,
      stateWithholding,
    } = req.body;

    if (!state || !filingStatus || federalAgi === undefined) {
      return res.status(400).json({
        success: false,
        error: 'State, filing status, and federal AGI are required',
      });
    }

    const config = stateEFilingService.getStateConfig(state);
    if (!config) {
      return res.status(404).json({
        success: false,
        error: `Unknown state: ${state}`,
      });
    }

    // Quick calculation
    const input: StateReturnInput = {
      userId: 'estimate',
      federalReturnId: 'estimate',
      state,
      taxYear: new Date().getFullYear(),
      filingStatus,
      residencyStatus: 'full_year',
      federalAgi,
      stateWages,
      stateWithholding,
    };

    const estimate = stateEFilingService.calculateStateTax(input);

    res.json({
      success: true,
      data: {
        state: config.name,
        stateCode: config.code,
        taxType: config.taxType,
        estimate: {
          stateAgi: estimate.stateAgi,
          stateDeductions: estimate.stateDeductions,
          stateTaxableIncome: estimate.stateTaxableIncome,
          grossTax: estimate.grossTax,
          netTax: estimate.netTax,
          effectiveRate: estimate.federalAgi > 0 ? ((estimate.netTax / estimate.federalAgi) * 100).toFixed(2) + '%' : '0%',
          withholding: estimate.withholding,
          estimatedRefund: estimate.refundAmount,
          estimatedDue: estimate.amountDue,
        },
        disclaimer: 'This is an estimate only. Actual tax may vary based on your complete tax situation.',
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /estimate/compare
 * Compare state taxes across multiple states
 */
router.post('/estimate/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { states, filingStatus, federalAgi } = req.body;

    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one state is required',
      });
    }

    const comparisons = [];

    for (const state of states) {
      const config = stateEFilingService.getStateConfig(state);
      if (!config) continue;

      const input: StateReturnInput = {
        userId: 'estimate',
        federalReturnId: 'estimate',
        state,
        taxYear: new Date().getFullYear(),
        filingStatus,
        residencyStatus: 'full_year',
        federalAgi,
      };

      try {
        const estimate = stateEFilingService.calculateStateTax(input);
        comparisons.push({
          state: config.name,
          stateCode: config.code,
          taxType: config.taxType,
          netTax: estimate.netTax,
          effectiveRate: federalAgi > 0 ? (estimate.netTax / federalAgi) * 100 : 0,
        });
      } catch {
        comparisons.push({
          state: config.name,
          stateCode: config.code,
          taxType: config.taxType,
          netTax: null,
          effectiveRate: null,
          error: 'Calculation error',
        });
      }
    }

    // Sort by tax amount
    comparisons.sort((a, b) => (a.netTax || 0) - (b.netTax || 0));

    res.json({
      success: true,
      data: {
        federalAgi,
        filingStatus,
        comparisons,
        lowestTax: comparisons[0],
        highestTax: comparisons[comparisons.length - 1],
        potentialSavings: (comparisons[comparisons.length - 1]?.netTax || 0) - (comparisons[0]?.netTax || 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
