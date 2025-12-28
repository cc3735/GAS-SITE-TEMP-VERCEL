import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { aiLimiter } from '../../middleware/rate-limit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { generate, isAIAvailable } from '../../services/ai/openai-client.js';
import type { FilingInterviewQuestion, FilingType } from '../../types/filing.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Interview questions by filing type
const INTERVIEW_QUESTIONS: Record<string, FilingInterviewQuestion[]> = {
  name_change: [
    {
      id: 'current_first_name',
      category: 'current_name',
      questionText: 'What is your current legal first name?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'current_middle_name',
      category: 'current_name',
      questionText: 'What is your current legal middle name? (Leave blank if none)',
      inputType: 'text',
    },
    {
      id: 'current_last_name',
      category: 'current_name',
      questionText: 'What is your current legal last name?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'new_first_name',
      category: 'new_name',
      questionText: 'What do you want your new first name to be?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'new_middle_name',
      category: 'new_name',
      questionText: 'What do you want your new middle name to be? (Leave blank if none)',
      inputType: 'text',
    },
    {
      id: 'new_last_name',
      category: 'new_name',
      questionText: 'What do you want your new last name to be?',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'reason_for_change',
      category: 'reason',
      questionText: 'Why do you want to change your name?',
      helpText: 'Common reasons include marriage, divorce, personal preference, or gender identity.',
      inputType: 'textarea',
      validation: { required: true },
    },
    {
      id: 'is_minor',
      category: 'petitioner_info',
      questionText: 'Is this name change for a minor child (under 18)?',
      inputType: 'boolean',
    },
    {
      id: 'other_parent_consent',
      category: 'petitioner_info',
      questionText: 'Does the other parent consent to this name change?',
      helpText: 'If the other parent does not consent, additional steps may be required.',
      inputType: 'select',
      options: [
        { value: 'yes', label: 'Yes, other parent consents' },
        { value: 'no', label: 'No, other parent does not consent' },
        { value: 'na', label: 'Not applicable (sole custody or parental rights terminated)' },
      ],
      dependsOn: { questionId: 'is_minor', value: true },
    },
    {
      id: 'criminal_history',
      category: 'background',
      questionText: 'Have you ever been convicted of a felony?',
      helpText: 'A criminal history may affect your name change petition.',
      inputType: 'boolean',
    },
    {
      id: 'bankruptcy_or_judgments',
      category: 'background',
      questionText: 'Are you currently in bankruptcy or have any outstanding civil judgments?',
      helpText: 'These may need to be disclosed in your petition.',
      inputType: 'boolean',
    },
    {
      id: 'sex_offender_registry',
      category: 'background',
      questionText: 'Are you registered as a sex offender?',
      helpText: 'Sex offender registration may affect your ability to change your name.',
      inputType: 'boolean',
    },
  ],
  child_support_mod: [
    {
      id: 'existing_case_number',
      category: 'case_info',
      questionText: 'What is your existing case number?',
      helpText: 'This can be found on your current child support order.',
      inputType: 'text',
      validation: { required: true },
    },
    {
      id: 'original_order_date',
      category: 'case_info',
      questionText: 'When was the original support order issued?',
      inputType: 'date',
      validation: { required: true },
    },
    {
      id: 'current_monthly_amount',
      category: 'case_info',
      questionText: 'What is the current monthly child support amount?',
      inputType: 'currency',
      validation: { required: true },
    },
    {
      id: 'reason_for_modification',
      category: 'reason',
      questionText: 'Why are you requesting a modification?',
      inputType: 'select',
      options: [
        { value: 'income_change_obligor', label: 'Paying parent\'s income changed' },
        { value: 'income_change_recipient', label: 'Receiving parent\'s income changed' },
        { value: 'custody_change', label: 'Custody arrangement changed' },
        { value: 'child_needs', label: 'Child\'s needs changed (medical, education, etc.)' },
        { value: 'health_insurance', label: 'Health insurance situation changed' },
        { value: 'other', label: 'Other reason' },
      ],
      validation: { required: true },
    },
    {
      id: 'are_you_paying_or_receiving',
      category: 'party_info',
      questionText: 'Are you the parent paying or receiving child support?',
      inputType: 'select',
      options: [
        { value: 'paying', label: 'I pay child support' },
        { value: 'receiving', label: 'I receive child support' },
      ],
      validation: { required: true },
    },
    {
      id: 'your_current_monthly_income',
      category: 'income',
      questionText: 'What is your current gross monthly income?',
      helpText: 'Include all sources: wages, self-employment, investments, etc.',
      inputType: 'currency',
      validation: { required: true },
    },
    {
      id: 'other_parent_monthly_income',
      category: 'income',
      questionText: 'What is the other parent\'s current gross monthly income (if known)?',
      helpText: 'If unknown, enter your best estimate.',
      inputType: 'currency',
    },
    {
      id: 'number_of_children',
      category: 'children',
      questionText: 'How many children are covered by this support order?',
      inputType: 'number',
      validation: { required: true, min: 1, max: 10 },
    },
    {
      id: 'requested_new_amount',
      category: 'request',
      questionText: 'What monthly support amount are you requesting?',
      helpText: 'Use the child support calculator for guidance.',
      inputType: 'currency',
    },
  ],
  divorce: [
    {
      id: 'marriage_date',
      category: 'marriage_info',
      questionText: 'When did you get married?',
      inputType: 'date',
      validation: { required: true },
    },
    {
      id: 'separation_date',
      category: 'marriage_info',
      questionText: 'When did you separate from your spouse?',
      inputType: 'date',
      validation: { required: true },
    },
    {
      id: 'spouse_agrees',
      category: 'agreement',
      questionText: 'Does your spouse agree to the divorce?',
      helpText: 'An uncontested divorce requires both parties to agree.',
      inputType: 'select',
      options: [
        { value: 'yes', label: 'Yes, spouse agrees' },
        { value: 'no', label: 'No, spouse does not agree' },
        { value: 'unknown', label: 'I don\'t know / No contact' },
      ],
      validation: { required: true },
    },
    {
      id: 'have_children',
      category: 'children',
      questionText: 'Do you have any minor children together?',
      inputType: 'boolean',
    },
    {
      id: 'children_count',
      category: 'children',
      questionText: 'How many minor children do you have together?',
      inputType: 'number',
      validation: { min: 1, max: 10 },
      dependsOn: { questionId: 'have_children', value: true },
    },
    {
      id: 'custody_agreement',
      category: 'children',
      questionText: 'Have you agreed on custody arrangements?',
      inputType: 'select',
      options: [
        { value: 'agreed', label: 'Yes, we have agreed' },
        { value: 'not_agreed', label: 'No, we have not agreed' },
        { value: 'working_on_it', label: 'We are still working it out' },
      ],
      dependsOn: { questionId: 'have_children', value: true },
    },
    {
      id: 'property_to_divide',
      category: 'property',
      questionText: 'Do you have property or assets to divide?',
      helpText: 'Include real estate, vehicles, bank accounts, retirement accounts, etc.',
      inputType: 'boolean',
    },
    {
      id: 'debts_to_divide',
      category: 'property',
      questionText: 'Do you have debts to divide?',
      helpText: 'Include credit cards, mortgages, loans, etc.',
      inputType: 'boolean',
    },
    {
      id: 'spousal_support_requested',
      category: 'support',
      questionText: 'Is spousal support (alimony) being requested?',
      inputType: 'select',
      options: [
        { value: 'none', label: 'No spousal support requested' },
        { value: 'i_request', label: 'I am requesting spousal support' },
        { value: 'spouse_requests', label: 'My spouse is requesting spousal support' },
        { value: 'both', label: 'Both parties may request' },
      ],
    },
  ],
};

// Start or resume interview for a filing
router.get('/:filingId/start', asyncHandler(async (req, res) => {
  const { filingId } = req.params;

  // Verify ownership
  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('*')
    .eq('id', filingId)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  const filingType = filing.filing_type as FilingType;
  const questions = INTERVIEW_QUESTIONS[filingType];

  if (!questions) {
    throw new ValidationError(`Interview not available for filing type: ${filingType}`);
  }

  // Get existing answers
  const existingAnswers = (filing.interview_data as Record<string, unknown>) || {};
  
  // Find first unanswered question
  let currentQuestionIndex = 0;
  for (let i = 0; i < questions.length; i++) {
    if (existingAnswers[questions[i].id] === undefined) {
      // Check dependencies
      const q = questions[i];
      if (q.dependsOn) {
        const dependentValue = existingAnswers[q.dependsOn.questionId];
        if (dependentValue !== q.dependsOn.value) {
          continue; // Skip this question
        }
      }
      currentQuestionIndex = i;
      break;
    }
    if (i === questions.length - 1) {
      currentQuestionIndex = questions.length; // All complete
    }
  }

  const isComplete = currentQuestionIndex >= questions.length;
  const currentQuestion = isComplete ? null : questions[currentQuestionIndex];

  // Calculate progress
  const answeredCount = Object.keys(existingAnswers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  res.json({
    success: true,
    data: {
      filingId,
      filingType,
      totalQuestions: questions.length,
      answeredQuestions: answeredCount,
      progress,
      isComplete,
      currentQuestion,
      currentQuestionIndex,
      existingAnswers,
    },
  });
}));

// Submit answer
router.post('/:filingId/answer', asyncHandler(async (req, res) => {
  const { filingId } = req.params;
  const { questionId, value } = req.body;

  if (!questionId) {
    throw new ValidationError('Question ID is required');
  }

  // Verify ownership
  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('*')
    .eq('id', filingId)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  const filingType = filing.filing_type as FilingType;
  const questions = INTERVIEW_QUESTIONS[filingType];

  if (!questions) {
    throw new ValidationError('Interview not available for this filing type');
  }

  // Validate question exists
  const question = questions.find((q) => q.id === questionId);
  if (!question) {
    throw new ValidationError('Invalid question ID');
  }

  // Validate required
  if (question.validation?.required && (value === undefined || value === null || value === '')) {
    throw new ValidationError('This question is required');
  }

  // Store answer
  const interviewData = (filing.interview_data as Record<string, unknown>) || {};
  interviewData[questionId] = value;

  // Find next question
  const currentIndex = questions.findIndex((q) => q.id === questionId);
  let nextQuestion: FilingInterviewQuestion | null = null;
  let nextQuestionIndex = currentIndex + 1;

  while (nextQuestionIndex < questions.length) {
    const candidate = questions[nextQuestionIndex];
    
    // Check dependency
    if (candidate.dependsOn) {
      const dependentValue = interviewData[candidate.dependsOn.questionId];
      if (dependentValue !== candidate.dependsOn.value) {
        nextQuestionIndex++;
        continue;
      }
    }
    
    // Skip if already answered
    if (interviewData[candidate.id] !== undefined) {
      nextQuestionIndex++;
      continue;
    }
    
    nextQuestion = candidate;
    break;
  }

  const isComplete = nextQuestion === null;

  // Update filing
  await supabaseAdmin
    .from('legal_filings')
    .update({
      interview_data: interviewData,
      status: isComplete ? 'forms_generated' : 'interview_in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', filingId);

  const answeredCount = Object.keys(interviewData).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  res.json({
    success: true,
    data: {
      saved: true,
      progress,
      isComplete,
      nextQuestion,
      nextQuestionIndex: nextQuestion ? nextQuestionIndex : null,
    },
  });
}));

// Get AI clarification for a question
router.post('/:filingId/clarify', aiLimiter, asyncHandler(async (req, res) => {
  const { filingId } = req.params;
  const { questionId, userQuestion } = req.body;

  if (!questionId || !userQuestion) {
    throw new ValidationError('Question ID and user question are required');
  }

  // Verify ownership
  const { data: filing } = await supabaseAdmin
    .from('legal_filings')
    .select('filing_type, jurisdiction_state')
    .eq('id', filingId)
    .eq('user_id', req.user!.id)
    .single();

  if (!filing) {
    throw new NotFoundError('Filing');
  }

  if (!isAIAvailable()) {
    res.json({
      success: true,
      data: {
        clarification: 'AI clarification is currently unavailable. Please consult the help text or contact support.',
      },
    });
    return;
  }

  const questions = INTERVIEW_QUESTIONS[filing.filing_type as FilingType] || [];
  const question = questions.find((q) => q.id === questionId);

  const systemPrompt = `You are a legal document preparation assistant helping users understand questions in a legal filing interview.
You are NOT providing legal advice - only clarifying what information is being asked for.
The user is filing a ${filing.filing_type.replace('_', ' ')} in ${filing.jurisdiction_state}.

IMPORTANT: Always remind the user that you are providing general information only, not legal advice.`;

  const userPrompt = `The user is on this interview question:
"${question?.questionText || questionId}"

Help text: ${question?.helpText || 'None'}

The user's question: "${userQuestion}"

Provide a helpful, clear clarification in plain English.`;

  try {
    const clarification = await generate(userPrompt, systemPrompt, {
      userId: req.user!.id,
      serviceType: 'filing',
      serviceId: filingId,
      maxTokens: 300,
    });

    res.json({
      success: true,
      data: {
        clarification,
      },
    });
  } catch {
    res.json({
      success: true,
      data: {
        clarification: 'Unable to generate clarification at this time. Please refer to the help text or contact support.',
      },
    });
  }
}));

// Get all questions for a filing type (for preview/reference)
router.get('/questions/:filingType', asyncHandler(async (req, res) => {
  const { filingType } = req.params;

  const questions = INTERVIEW_QUESTIONS[filingType];

  if (!questions) {
    throw new NotFoundError('Interview questions for this filing type');
  }

  // Group by category
  const categories: Record<string, FilingInterviewQuestion[]> = {};
  for (const q of questions) {
    if (!categories[q.category]) {
      categories[q.category] = [];
    }
    categories[q.category].push(q);
  }

  res.json({
    success: true,
    data: {
      filingType,
      totalQuestions: questions.length,
      categories,
      questions,
    },
  });
}));

export default router;

