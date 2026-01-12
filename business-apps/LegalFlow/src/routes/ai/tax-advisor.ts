/**
 * AI Tax Advisor Routes
 *
 * Provides endpoints for tax optimization suggestions, deduction discovery,
 * audit risk assessment, tax planning advice, and natural language Q&A.
 *
 * @module routes/ai/tax-advisor
 */

import { Router, Request, Response, NextFunction } from 'express';
import { aiTaxAdvisor, TaxSituation } from '../../services/ai/tax-advisor.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// TAX OPTIMIZATION
// ============================================================================

/**
 * POST /optimize
 * Get tax optimization suggestions based on user's situation
 */
router.post('/optimize', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const situation: TaxSituation = req.body;

    if (!situation.filingStatus || !situation.taxYear) {
      return res.status(400).json({
        success: false,
        error: 'Filing status and tax year are required',
      });
    }

    const suggestions = await aiTaxAdvisor.getOptimizationSuggestions(situation);

    // Calculate total potential savings
    const totalPotentialSavings = suggestions
      .filter((s) => s.potentialSavings !== null)
      .reduce((sum, s) => sum + (s.potentialSavings || 0), 0);

    res.json({
      success: true,
      data: {
        suggestions,
        summary: {
          totalSuggestions: suggestions.length,
          highPriority: suggestions.filter((s) => s.priority === 'high').length,
          totalPotentialSavings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DEDUCTION DISCOVERY
// ============================================================================

/**
 * POST /deductions/discover
 * Discover potential deductions the user may have missed
 */
router.post('/deductions/discover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const situation: TaxSituation = req.body;

    if (!situation.filingStatus || !situation.income) {
      return res.status(400).json({
        success: false,
        error: 'Filing status and income information are required',
      });
    }

    const deductions = await aiTaxAdvisor.discoverDeductions(situation);

    // Separate eligible and ineligible
    const eligible = deductions.filter((d) => d.isEligible);
    const ineligible = deductions.filter((d) => !d.isEligible);

    // Calculate total potential deductions
    const totalPotentialDeductions = eligible.reduce((sum, d) => sum + d.estimatedAmount, 0);

    res.json({
      success: true,
      data: {
        eligible,
        ineligible,
        summary: {
          totalEligible: eligible.length,
          totalIneligible: ineligible.length,
          totalPotentialDeductions,
          estimatedTaxSavings: totalPotentialDeductions * 0.24, // Assume 24% bracket
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AUDIT RISK ASSESSMENT
// ============================================================================

/**
 * POST /audit-risk
 * Assess audit risk based on tax return data
 */
router.post('/audit-risk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const situation: TaxSituation = req.body;

    if (!situation.filingStatus || !situation.income) {
      return res.status(400).json({
        success: false,
        error: 'Filing status and income information are required',
      });
    }

    const assessment = await aiTaxAdvisor.assessAuditRisk(situation);

    res.json({
      success: true,
      data: assessment,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// TAX PLANNING ADVICE
// ============================================================================

/**
 * POST /planning
 * Get year-round tax planning advice
 */
router.post('/planning', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const situation: TaxSituation = req.body;

    if (!situation.filingStatus) {
      return res.status(400).json({
        success: false,
        error: 'Filing status is required',
      });
    }

    const advice = await aiTaxAdvisor.getTaxPlanningAdvice(situation);

    // Group by timeframe
    const groupedAdvice = {
      immediate: advice.filter((a) => a.timeframe === 'immediate'),
      thisQuarter: advice.filter((a) => a.timeframe === 'this_quarter'),
      thisYear: advice.filter((a) => a.timeframe === 'this_year'),
      nextYear: advice.filter((a) => a.timeframe === 'next_year'),
      longTerm: advice.filter((a) => a.timeframe === 'long_term'),
    };

    res.json({
      success: true,
      data: {
        advice,
        groupedByTimeframe: groupedAdvice,
        summary: {
          totalRecommendations: advice.length,
          immediateActions: groupedAdvice.immediate.length,
          categories: [...new Set(advice.map((a) => a.category))],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// NATURAL LANGUAGE Q&A
// ============================================================================

/**
 * POST /ask
 * Answer tax questions in natural language
 */
router.post('/ask', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { question, context, conversationId } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Question is required',
      });
    }

    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Question is too long (max 1000 characters)',
      });
    }

    const answer = await aiTaxAdvisor.answerQuestion({
      question: question.trim(),
      context,
      conversationId,
    });

    res.json({
      success: true,
      data: answer,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /conversations
 * Start a new conversation with the AI Tax Advisor
 */
router.post('/conversations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { taxSituation } = req.body;

    const conversationId = await aiTaxAdvisor.startConversation(userId, taxSituation);

    res.status(201).json({
      success: true,
      data: {
        conversationId,
        message: 'Conversation started. Use this ID to continue the conversation.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// QUICK INSIGHTS
// ============================================================================

/**
 * POST /quick-insights
 * Get quick tax insights based on limited information
 */
router.post('/quick-insights', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { income, filingStatus, state } = req.body;

    if (!income || !filingStatus) {
      return res.status(400).json({
        success: false,
        error: 'Income and filing status are required',
      });
    }

    // Quick calculations
    const standardDeduction = {
      single: 14600,
      married_filing_jointly: 29200,
      married_filing_separately: 14600,
      head_of_household: 21900,
      qualifying_widow: 29200,
    }[filingStatus] || 14600;

    const taxableIncome = Math.max(0, income - standardDeduction);

    // Simplified federal tax calculation
    let federalTax = 0;
    const brackets = [
      { max: 11600, rate: 0.10 },
      { max: 47150, rate: 0.12 },
      { max: 100525, rate: 0.22 },
      { max: 191950, rate: 0.24 },
      { max: 243725, rate: 0.32 },
      { max: 609350, rate: 0.35 },
      { max: Infinity, rate: 0.37 },
    ];

    let remainingIncome = taxableIncome;
    let prevMax = 0;

    for (const bracket of brackets) {
      const bracketIncome = Math.min(remainingIncome, bracket.max - prevMax);
      if (bracketIncome <= 0) break;
      federalTax += bracketIncome * bracket.rate;
      remainingIncome -= bracketIncome;
      prevMax = bracket.max;
    }

    // Determine marginal rate
    let marginalRate = 0.10;
    for (const bracket of brackets) {
      if (taxableIncome <= bracket.max) {
        marginalRate = bracket.rate;
        break;
      }
    }

    // Quick insights
    const insights = [];

    if (income > 50000 && !state) {
      insights.push({
        type: 'tip',
        message: 'Consider contributing to a Traditional IRA to reduce taxable income by up to $7,000',
        potentialSavings: Math.round(7000 * marginalRate),
      });
    }

    if (income > 100000) {
      insights.push({
        type: 'tip',
        message: 'You may benefit from itemizing deductions if you have significant mortgage interest, property taxes, or charitable contributions',
      });
    }

    if (filingStatus === 'married_filing_jointly' && income > 250000) {
      insights.push({
        type: 'warning',
        message: 'You may be subject to the 3.8% Net Investment Income Tax on investment income',
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          grossIncome: income,
          standardDeduction,
          taxableIncome,
          estimatedFederalTax: Math.round(federalTax),
          effectiveRate: income > 0 ? ((federalTax / income) * 100).toFixed(1) + '%' : '0%',
          marginalRate: (marginalRate * 100).toFixed(0) + '%',
        },
        insights,
        disclaimer: 'This is a simplified estimate. Actual tax liability may vary based on your complete tax situation.',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// COMMON QUESTIONS
// ============================================================================

/**
 * GET /common-questions
 * Get frequently asked tax questions
 */
router.get('/common-questions', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      categories: [
        {
          category: 'Filing Basics',
          questions: [
            'What is my filing status?',
            'When is the tax filing deadline?',
            'Should I take the standard deduction or itemize?',
            'What documents do I need to file my taxes?',
          ],
        },
        {
          category: 'Deductions & Credits',
          questions: [
            'What can I deduct on my taxes?',
            'How does the Child Tax Credit work?',
            'Can I deduct student loan interest?',
            'What is the Earned Income Tax Credit?',
          ],
        },
        {
          category: 'Self-Employment',
          questions: [
            'What expenses can I deduct as a freelancer?',
            'How do I calculate self-employment tax?',
            'Do I need to pay quarterly estimated taxes?',
            'Can I deduct my home office?',
          ],
        },
        {
          category: 'Retirement',
          questions: [
            'Should I contribute to a Traditional or Roth IRA?',
            'What is the 401(k) contribution limit?',
            'How are retirement distributions taxed?',
            'What is a Required Minimum Distribution (RMD)?',
          ],
        },
        {
          category: 'Investments',
          questions: [
            'How are capital gains taxed?',
            'What is tax-loss harvesting?',
            'How are dividends taxed?',
            'What is the wash sale rule?',
          ],
        },
        {
          category: 'Life Events',
          questions: [
            'How do I file taxes if I got married this year?',
            'What tax benefits are available for new parents?',
            'How does buying a home affect my taxes?',
            'What happens if I got divorced this year?',
          ],
        },
      ],
    },
  });
});

// ============================================================================
// TAX TERM GLOSSARY
// ============================================================================

/**
 * GET /glossary
 * Get tax term definitions
 */
router.get('/glossary', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      terms: [
        {
          term: 'Adjusted Gross Income (AGI)',
          definition: 'Your gross income minus specific deductions like IRA contributions, student loan interest, and self-employment tax. Many tax benefits are based on AGI.',
        },
        {
          term: 'Standard Deduction',
          definition: 'A fixed dollar amount that reduces your taxable income. For 2024: $14,600 (single), $29,200 (married filing jointly).',
        },
        {
          term: 'Itemized Deductions',
          definition: 'Individual deductions you list on Schedule A, including mortgage interest, state taxes (up to $10,000), charitable contributions, and medical expenses.',
        },
        {
          term: 'Tax Credit',
          definition: 'A dollar-for-dollar reduction in your tax bill. More valuable than deductions because they directly reduce tax owed.',
        },
        {
          term: 'Refundable Credit',
          definition: 'A tax credit that can reduce your tax below zero, resulting in a refund. Examples: EITC, Additional Child Tax Credit.',
        },
        {
          term: 'Marginal Tax Rate',
          definition: 'The tax rate applied to your last dollar of income. The US uses progressive rates from 10% to 37%.',
        },
        {
          term: 'Effective Tax Rate',
          definition: 'Your total tax divided by total income. This is typically lower than your marginal rate due to progressive taxation.',
        },
        {
          term: 'W-4',
          definition: 'Form you give to your employer to determine how much tax to withhold from your paycheck.',
        },
        {
          term: 'Estimated Taxes',
          definition: 'Quarterly tax payments required for self-employed individuals or those without sufficient withholding.',
        },
        {
          term: 'Capital Gains',
          definition: 'Profit from selling an asset. Long-term gains (held over 1 year) are taxed at preferential rates of 0%, 15%, or 20%.',
        },
        {
          term: 'Qualified Dividend',
          definition: 'Dividends taxed at the lower capital gains rates rather than ordinary income rates. Most US company dividends qualify.',
        },
        {
          term: 'Self-Employment Tax',
          definition: 'Social Security and Medicare taxes for self-employed individuals. Rate is 15.3% on net self-employment income.',
        },
        {
          term: 'QBI Deduction',
          definition: 'Qualified Business Income deduction allows eligible self-employed and small business owners to deduct up to 20% of qualified business income.',
        },
        {
          term: 'HSA',
          definition: 'Health Savings Account. Triple tax advantage: contributions are deductible, growth is tax-free, and withdrawals for medical expenses are tax-free.',
        },
        {
          term: 'SALT Deduction',
          definition: 'State and Local Tax deduction for state income taxes and property taxes. Limited to $10,000 total when itemizing.',
        },
      ],
    },
  });
});

// ============================================================================
// HELPFUL RESOURCES
// ============================================================================

/**
 * GET /resources
 * Get links to helpful IRS resources
 */
router.get('/resources', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      resources: [
        {
          category: 'IRS Tools',
          items: [
            { name: 'Where\'s My Refund?', url: 'https://www.irs.gov/refunds', description: 'Check the status of your tax refund' },
            { name: 'IRS Free File', url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free', description: 'Free tax preparation if income under $79,000' },
            { name: 'Tax Withholding Estimator', url: 'https://www.irs.gov/individuals/tax-withholding-estimator', description: 'Check if your W-4 is correct' },
          ],
        },
        {
          category: 'Publications',
          items: [
            { name: 'Publication 17', url: 'https://www.irs.gov/publications/p17', description: 'Your Federal Income Tax guide' },
            { name: 'Publication 334', url: 'https://www.irs.gov/publications/p334', description: 'Tax Guide for Small Business' },
            { name: 'Publication 525', url: 'https://www.irs.gov/publications/p525', description: 'Taxable and Nontaxable Income' },
            { name: 'Publication 590-A', url: 'https://www.irs.gov/publications/p590a', description: 'IRA Contributions' },
          ],
        },
        {
          category: 'Forms',
          items: [
            { name: 'Form 1040', description: 'U.S. Individual Income Tax Return' },
            { name: 'Schedule A', description: 'Itemized Deductions' },
            { name: 'Schedule C', description: 'Profit or Loss from Business' },
            { name: 'Schedule SE', description: 'Self-Employment Tax' },
            { name: 'Form 1040-ES', description: 'Estimated Tax for Individuals' },
          ],
        },
      ],
    },
  });
});

export default router;
