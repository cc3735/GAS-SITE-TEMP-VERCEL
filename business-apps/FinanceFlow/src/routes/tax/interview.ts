import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, requirePremium } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rate-limit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { generate, generateJSON, isAIAvailable } from '../../services/ai/openai-client.js';
import type { TaxInterviewQuestion, TaxInterviewState, AISuggestion } from '../../types/tax.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Tax interview questions by section
const INTERVIEW_SECTIONS = [
  'personal_info',
  'filing_status',
  'income',
  'deductions',
  'credits',
  'review',
];

const BASE_QUESTIONS: Record<string, TaxInterviewQuestion[]> = {
  personal_info: [
    {
      id: 'first_name',
      section: 'personal_info',
      questionText: 'What is your first name?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'last_name',
      section: 'personal_info',
      questionText: 'What is your last name?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'date_of_birth',
      section: 'personal_info',
      questionText: 'What is your date of birth?',
      inputType: 'date',
      validation: { required: true },
    },
    {
      id: 'occupation',
      section: 'personal_info',
      questionText: 'What is your occupation?',
      inputType: 'text',
    },
  ],
  filing_status: [
    {
      id: 'filing_status',
      section: 'filing_status',
      questionText: 'What is your filing status?',
      helpText: 'Your filing status determines your tax rates and standard deduction amount.',
      inputType: 'select',
      options: [
        { value: 'single', label: 'Single' },
        { value: 'married_joint', label: 'Married Filing Jointly' },
        { value: 'married_separate', label: 'Married Filing Separately' },
        { value: 'head_of_household', label: 'Head of Household' },
        { value: 'qualifying_widow', label: 'Qualifying Widow(er)' },
      ],
      validation: { required: true },
    },
    {
      id: 'spouse_info_needed',
      section: 'filing_status',
      questionText: 'We\'ll need your spouse\'s information for joint filing.',
      inputType: 'boolean',
      dependsOn: { questionId: 'filing_status', value: 'married_joint' },
    },
    {
      id: 'dependents_count',
      section: 'filing_status',
      questionText: 'How many dependents do you have?',
      helpText: 'Include children and other qualifying relatives you support.',
      inputType: 'number',
      validation: { min: 0, max: 20 },
    },
  ],
  income: [
    {
      id: 'had_w2_income',
      section: 'income',
      questionText: 'Did you receive any W-2 income from an employer in 2024?',
      inputType: 'boolean',
    },
    {
      id: 'had_1099_income',
      section: 'income',
      questionText: 'Did you receive any 1099 income (freelance, contract, or other)?',
      inputType: 'boolean',
    },
    {
      id: 'had_interest_income',
      section: 'income',
      questionText: 'Did you earn any interest income from bank accounts or investments?',
      inputType: 'boolean',
    },
    {
      id: 'had_dividend_income',
      section: 'income',
      questionText: 'Did you receive any dividend income from stocks or mutual funds?',
      inputType: 'boolean',
    },
    {
      id: 'had_capital_gains',
      section: 'income',
      questionText: 'Did you sell any stocks, bonds, or other investments?',
      inputType: 'boolean',
    },
    {
      id: 'had_rental_income',
      section: 'income',
      questionText: 'Did you receive any rental income from property you own?',
      inputType: 'boolean',
    },
    {
      id: 'had_business_income',
      section: 'income',
      questionText: 'Did you have income from a business you own?',
      inputType: 'boolean',
    },
  ],
  deductions: [
    {
      id: 'deduction_preference',
      section: 'deductions',
      questionText: 'How would you like to handle deductions?',
      helpText: 'Most people benefit from the standard deduction, but we can check if itemizing saves you more.',
      inputType: 'select',
      options: [
        { value: 'standard', label: 'Take the standard deduction' },
        { value: 'itemize', label: 'Itemize deductions' },
        { value: 'help_decide', label: 'Help me decide' },
      ],
    },
    {
      id: 'paid_mortgage_interest',
      section: 'deductions',
      questionText: 'Did you pay mortgage interest on your home?',
      inputType: 'boolean',
      dependsOn: { questionId: 'deduction_preference', value: 'itemize' },
    },
    {
      id: 'paid_property_taxes',
      section: 'deductions',
      questionText: 'Did you pay property taxes?',
      inputType: 'boolean',
      dependsOn: { questionId: 'deduction_preference', value: 'itemize' },
    },
    {
      id: 'charitable_donations',
      section: 'deductions',
      questionText: 'Did you make any charitable donations?',
      inputType: 'boolean',
    },
    {
      id: 'medical_expenses',
      section: 'deductions',
      questionText: 'Did you have significant medical expenses (more than 7.5% of your income)?',
      inputType: 'boolean',
      dependsOn: { questionId: 'deduction_preference', value: 'itemize' },
    },
  ],
  credits: [
    {
      id: 'has_qualifying_children',
      section: 'credits',
      questionText: 'Do you have children under 17 who lived with you for more than half the year?',
      helpText: 'You may qualify for the Child Tax Credit.',
      inputType: 'boolean',
    },
    {
      id: 'paid_childcare',
      section: 'credits',
      questionText: 'Did you pay for childcare while you worked or looked for work?',
      helpText: 'You may qualify for the Child and Dependent Care Credit.',
      inputType: 'boolean',
    },
    {
      id: 'education_expenses',
      section: 'credits',
      questionText: 'Did you pay for college tuition or other higher education expenses?',
      helpText: 'You may qualify for education credits like the American Opportunity Credit.',
      inputType: 'boolean',
    },
    {
      id: 'retirement_contributions',
      section: 'credits',
      questionText: 'Did you contribute to a retirement account (IRA, 401k)?',
      helpText: 'You may qualify for the Retirement Savings Contribution Credit.',
      inputType: 'boolean',
    },
    {
      id: 'energy_improvements',
      section: 'credits',
      questionText: 'Did you make any energy-efficient improvements to your home?',
      helpText: 'Solar panels, energy-efficient windows, etc. may qualify for credits.',
      inputType: 'boolean',
    },
  ],
  review: [
    {
      id: 'confirm_accuracy',
      section: 'review',
      questionText: 'Have you reviewed all your information and confirmed it is accurate?',
      inputType: 'boolean',
      validation: { required: true },
    },
  ],
};

// Start or resume interview
router.post('/start', asyncHandler(async (req, res) => {
  const { taxReturnId } = req.body;

  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

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

  // Get or create interview state
  let interviewState: TaxInterviewState = taxReturn.forms_data?.interviewState || {
    currentSection: INTERVIEW_SECTIONS[0],
    currentQuestionIndex: 0,
    answers: {},
    completedSections: [],
    aiSuggestions: [],
  };

  // Get current question
  const currentSection = interviewState.currentSection;
  const questions = BASE_QUESTIONS[currentSection] || [];
  const currentQuestion = questions[interviewState.currentQuestionIndex];

  res.json({
    success: true,
    data: {
      taxReturnId,
      interviewState: {
        currentSection,
        currentQuestionIndex: interviewState.currentQuestionIndex,
        totalSections: INTERVIEW_SECTIONS.length,
        completedSections: interviewState.completedSections,
        progress: Math.round(
          (interviewState.completedSections.length / INTERVIEW_SECTIONS.length) * 100
        ),
      },
      currentQuestion,
      previousAnswers: interviewState.answers,
    },
  });
}));

// Submit answer and get next question
router.post('/answer', asyncHandler(async (req, res) => {
  const { taxReturnId, questionId, value } = req.body;

  if (!taxReturnId || !questionId) {
    throw new ValidationError('Tax return ID and question ID are required');
  }

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

  // Get interview state
  let interviewState: TaxInterviewState = taxReturn.forms_data?.interviewState || {
    currentSection: INTERVIEW_SECTIONS[0],
    currentQuestionIndex: 0,
    answers: {},
    completedSections: [],
    aiSuggestions: [],
  };

  // Store answer
  interviewState.answers[questionId] = {
    questionId,
    value,
    timestamp: new Date().toISOString(),
  };

  // Get current section questions
  const currentSection = interviewState.currentSection;
  const questions = BASE_QUESTIONS[currentSection] || [];

  // Move to next question or section
  let nextQuestion: TaxInterviewQuestion | null = null;
  let nextQuestionIndex = interviewState.currentQuestionIndex + 1;

  // Find next applicable question (considering dependencies)
  while (nextQuestionIndex < questions.length) {
    const candidate = questions[nextQuestionIndex];
    
    if (candidate.dependsOn) {
      const dependentAnswer = interviewState.answers[candidate.dependsOn.questionId];
      if (dependentAnswer?.value !== candidate.dependsOn.value) {
        nextQuestionIndex++;
        continue;
      }
    }
    
    nextQuestion = candidate;
    break;
  }

  if (nextQuestion) {
    interviewState.currentQuestionIndex = nextQuestionIndex;
  } else {
    // Section complete, move to next section
    if (!interviewState.completedSections.includes(currentSection)) {
      interviewState.completedSections.push(currentSection);
    }

    const currentSectionIndex = INTERVIEW_SECTIONS.indexOf(currentSection);
    const nextSectionIndex = currentSectionIndex + 1;

    if (nextSectionIndex < INTERVIEW_SECTIONS.length) {
      interviewState.currentSection = INTERVIEW_SECTIONS[nextSectionIndex];
      interviewState.currentQuestionIndex = 0;
      nextQuestion = BASE_QUESTIONS[interviewState.currentSection]?.[0] || null;
    }
  }

  // Update tax return with interview state
  const formsData = taxReturn.forms_data || {};
  formsData.interviewState = interviewState;

  await supabaseAdmin
    .from('tax_returns')
    .update({
      forms_data: formsData,
      status: interviewState.completedSections.length === INTERVIEW_SECTIONS.length 
        ? 'completed' 
        : 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', taxReturnId);

  const isComplete = interviewState.completedSections.length === INTERVIEW_SECTIONS.length;

  res.json({
    success: true,
    data: {
      saved: true,
      interviewState: {
        currentSection: interviewState.currentSection,
        currentQuestionIndex: interviewState.currentQuestionIndex,
        totalSections: INTERVIEW_SECTIONS.length,
        completedSections: interviewState.completedSections,
        progress: Math.round(
          (interviewState.completedSections.length / INTERVIEW_SECTIONS.length) * 100
        ),
        isComplete,
      },
      nextQuestion,
    },
  });
}));

// Get AI suggestions based on answers
router.get('/suggestions/:taxReturnId', aiLimiter, asyncHandler(async (req, res) => {
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

  const interviewState: TaxInterviewState = taxReturn.forms_data?.interviewState;

  if (!interviewState || Object.keys(interviewState.answers).length < 5) {
    res.json({
      success: true,
      data: {
        suggestions: [],
        message: 'Complete more of the interview to receive AI suggestions',
      },
    });
    return;
  }

  // Check if AI is available
  if (!isAIAvailable()) {
    res.json({
      success: true,
      data: {
        suggestions: [],
        message: 'AI suggestions are currently unavailable',
      },
    });
    return;
  }

  // Generate AI suggestions
  const systemPrompt = `You are a tax preparation assistant helping analyze a user's tax situation to suggest potential deductions and credits they may be eligible for.

Based on the user's interview answers, provide specific, actionable suggestions for:
1. Deductions they may have missed
2. Credits they may qualify for
3. Warnings about potential issues
4. Tips to maximize their refund

Return a JSON array of suggestions with this structure:
{
  "type": "deduction" | "credit" | "warning" | "tip",
  "title": "Short title",
  "description": "Detailed explanation",
  "estimatedValue": number or null,
  "actionRequired": boolean
}`;

  const userPrompt = `Here are the user's tax interview answers:
${JSON.stringify(interviewState.answers, null, 2)}

Tax Year: ${taxReturn.tax_year}
Filing Status: ${taxReturn.filing_status || 'Not yet determined'}

Analyze these answers and provide relevant suggestions.`;

  try {
    const suggestions = await generateJSON<AISuggestion[]>(userPrompt, systemPrompt, {
      userId: req.user!.id,
      serviceType: 'tax',
      serviceId: taxReturnId,
    });

    // Store suggestions in tax return
    const formsData = taxReturn.forms_data || {};
    formsData.interviewState = {
      ...interviewState,
      aiSuggestions: suggestions,
    };

    await supabaseAdmin
      .from('tax_returns')
      .update({
        forms_data: formsData,
        ai_suggestions: suggestions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taxReturnId);

    res.json({
      success: true,
      data: {
        suggestions,
      },
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        suggestions: [],
        message: 'Could not generate suggestions at this time',
      },
    });
  }
}));

// Get interview questions for a section
router.get('/questions/:section', asyncHandler(async (req, res) => {
  const { section } = req.params;

  if (!INTERVIEW_SECTIONS.includes(section)) {
    throw new ValidationError('Invalid section');
  }

  const questions = BASE_QUESTIONS[section] || [];

  res.json({
    success: true,
    data: {
      section,
      questions,
      sectionIndex: INTERVIEW_SECTIONS.indexOf(section),
      totalSections: INTERVIEW_SECTIONS.length,
    },
  });
}));

export default router;

