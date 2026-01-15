/**
 * Trademark Workflow Service
 *
 * Multi-step interview workflow for trademark applications.
 * Guides users through the complete trademark registration process
 * with AI assistance at each step.
 */

import { logger } from '../../utils/logger.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import * as trademarkAI from './trademark-ai.js';
import type {
  TrademarkApplication,
  TrademarkApplicationStatus,
  TrademarkInterviewData,
  InterviewQuestion,
  AIClarification,
  GoodsServicesEntry,
  SpecimenData,
  DeclarationData,
  MarkType,
  FilingBasis,
  OwnerType,
  JurisdictionType,
  TEASApplicationType,
} from '../../types/trademark.js';
import type { Address } from '../../types/legal.js';
import niceClasses from '../../data/nice-classes.json' assert { type: 'json' };

// ==================== WORKFLOW STEPS ====================

export const WORKFLOW_STEPS = [
  { id: 'jurisdiction', name: 'Jurisdiction', description: 'Choose federal or state registration' },
  { id: 'mark_info', name: 'Mark Information', description: 'Describe your trademark' },
  { id: 'owner_info', name: 'Owner Information', description: 'Applicant details' },
  { id: 'goods_services', name: 'Goods & Services', description: 'Classify your goods/services' },
  { id: 'filing_basis', name: 'Filing Basis', description: 'Use in commerce or intent-to-use' },
  { id: 'specimen', name: 'Specimens', description: 'Evidence of trademark use' },
  { id: 'declaration', name: 'Declarations', description: 'Required sworn statements' },
  { id: 'review', name: 'Review & Submit', description: 'Final review before filing' },
] as const;

export type WorkflowStep = typeof WORKFLOW_STEPS[number]['id'];

// ==================== INTERVIEW QUESTIONS ====================

/**
 * Get all interview questions for the trademark workflow
 */
export function getInterviewQuestions(): InterviewQuestion[] {
  return [
    // Step 1: Jurisdiction
    {
      id: 'jurisdiction_type',
      step: 0,
      category: 'mark_info',
      question: 'Where do you want to register your trademark?',
      type: 'select',
      required: true,
      helpText: 'Federal registration provides nationwide protection. State registration is limited to that state.',
      options: [
        { value: 'federal', label: 'Federal (USPTO) - Nationwide Protection' },
        { value: 'state', label: 'State - Single State Protection' },
      ],
      aiAssisted: false,
    },
    {
      id: 'jurisdiction_state',
      step: 0,
      category: 'mark_info',
      question: 'Which state do you want to register in?',
      type: 'select',
      required: true,
      helpText: 'Select the state where you want trademark protection.',
      options: getStateOptions(),
      conditionalOn: { field: 'jurisdiction_type', value: 'state' },
      aiAssisted: false,
    },

    // Step 2: Mark Information
    {
      id: 'mark_type',
      step: 1,
      category: 'mark_info',
      question: 'What type of trademark do you want to register?',
      type: 'select',
      required: true,
      helpText: 'Most trademarks are word marks (text only) or design marks (logos).',
      options: [
        { value: 'word', label: 'Word Mark (Text Only)' },
        { value: 'design', label: 'Design Mark (Logo/Image)' },
        { value: 'combined', label: 'Combined (Text + Design)' },
        { value: 'sound', label: 'Sound Mark' },
        { value: 'motion', label: 'Motion Mark' },
        { value: 'color', label: 'Color Mark' },
        { value: 'other', label: 'Other' },
      ],
      aiAssisted: false,
    },
    {
      id: 'mark_text',
      step: 1,
      category: 'mark_info',
      question: 'Enter the text of your trademark',
      type: 'text',
      required: true,
      helpText: 'Enter the exact wording of your trademark. Use standard characters (no stylization).',
      validation: {
        minLength: 1,
        maxLength: 250,
      },
      conditionalOn: { field: 'mark_type', value: ['word', 'combined'] },
      aiAssisted: true,
    },
    {
      id: 'mark_image',
      step: 1,
      category: 'mark_info',
      question: 'Upload your trademark design',
      type: 'file',
      required: true,
      helpText: 'Upload a clear image of your logo or design mark. JPEG or PNG format, minimum 250x250 pixels.',
      conditionalOn: { field: 'mark_type', value: ['design', 'combined', 'motion'] },
      aiAssisted: false,
    },
    {
      id: 'mark_description',
      step: 1,
      category: 'mark_info',
      question: 'Describe your trademark design',
      type: 'textarea',
      required: true,
      helpText: 'Describe all elements of your design mark, including colors if you want to claim them.',
      validation: {
        minLength: 10,
        maxLength: 1000,
      },
      conditionalOn: { field: 'mark_type', value: ['design', 'combined', 'sound', 'motion', 'color', 'other'] },
      aiAssisted: true,
    },
    {
      id: 'mark_color_claim',
      step: 1,
      category: 'mark_info',
      question: 'Do you want to claim specific colors as part of your mark?',
      type: 'select',
      required: true,
      helpText: 'If you claim colors, your registration only covers the mark with those exact colors.',
      options: [
        { value: 'no', label: 'No - Register in any color' },
        { value: 'yes', label: 'Yes - Claim specific colors' },
      ],
      conditionalOn: { field: 'mark_type', value: ['design', 'combined'] },
      aiAssisted: false,
    },
    {
      id: 'mark_colors',
      step: 1,
      category: 'mark_info',
      question: 'List the colors you are claiming',
      type: 'text',
      required: true,
      helpText: 'Example: "The color(s) red, blue, and white is/are claimed as a feature of the mark."',
      conditionalOn: { field: 'mark_color_claim', value: 'yes' },
      aiAssisted: true,
    },
    {
      id: 'mark_translation',
      step: 1,
      category: 'mark_info',
      question: 'Does your mark contain foreign words? If so, provide translation.',
      type: 'text',
      required: false,
      helpText: 'If your mark includes non-English words, provide their English translation.',
      aiAssisted: false,
    },
    {
      id: 'mark_transliteration',
      step: 1,
      category: 'mark_info',
      question: 'Does your mark contain non-Latin characters? If so, provide transliteration.',
      type: 'text',
      required: false,
      helpText: 'If your mark includes characters from other alphabets (e.g., Chinese, Arabic), provide the phonetic transliteration.',
      aiAssisted: false,
    },

    // Step 3: Owner Information
    {
      id: 'owner_type',
      step: 2,
      category: 'owner_info',
      question: 'Who is the owner of this trademark?',
      type: 'select',
      required: true,
      helpText: 'Select the legal entity that will own the trademark registration.',
      options: [
        { value: 'individual', label: 'Individual Person' },
        { value: 'corporation', label: 'Corporation' },
        { value: 'llc', label: 'Limited Liability Company (LLC)' },
        { value: 'partnership', label: 'Partnership' },
        { value: 'trust', label: 'Trust' },
        { value: 'other', label: 'Other Entity Type' },
      ],
      aiAssisted: false,
    },
    {
      id: 'owner_name',
      step: 2,
      category: 'owner_info',
      question: 'Enter the full legal name of the trademark owner',
      type: 'text',
      required: true,
      helpText: 'For individuals, enter full name. For businesses, enter the exact legal name.',
      validation: {
        minLength: 2,
        maxLength: 200,
      },
      aiAssisted: false,
    },
    {
      id: 'owner_citizenship',
      step: 2,
      category: 'owner_info',
      question: 'Country of citizenship',
      type: 'text',
      required: true,
      helpText: 'Enter the country of citizenship for the individual owner.',
      conditionalOn: { field: 'owner_type', value: 'individual' },
      aiAssisted: false,
    },
    {
      id: 'owner_state_of_organization',
      step: 2,
      category: 'owner_info',
      question: 'State/Country of organization',
      type: 'text',
      required: true,
      helpText: 'Enter the state or country where the business entity was formed.',
      conditionalOn: { field: 'owner_type', value: ['corporation', 'llc', 'partnership', 'trust', 'other'] },
      aiAssisted: false,
    },
    {
      id: 'owner_entity_type',
      step: 2,
      category: 'owner_info',
      question: 'Specify the entity type',
      type: 'text',
      required: true,
      helpText: 'Describe the type of entity (e.g., "Delaware Corporation", "California LLC").',
      conditionalOn: { field: 'owner_type', value: 'other' },
      aiAssisted: false,
    },
    {
      id: 'owner_address',
      step: 2,
      category: 'owner_info',
      question: 'Owner address',
      type: 'address',
      required: true,
      helpText: 'Enter the complete mailing address of the trademark owner.',
      aiAssisted: false,
    },

    // Step 4: Goods & Services
    {
      id: 'goods_services_description',
      step: 3,
      category: 'goods_services',
      question: 'Describe the goods or services you will use this trademark for',
      type: 'textarea',
      required: true,
      helpText: 'Describe what products you sell or services you provide under this trademark. Our AI will help format this for USPTO requirements.',
      validation: {
        minLength: 10,
        maxLength: 2000,
      },
      aiAssisted: true,
      aiGenerated: true,
    },
    {
      id: 'goods_services_classes',
      step: 3,
      category: 'goods_services',
      question: 'Select the Nice Classification classes for your goods/services',
      type: 'multiselect',
      required: true,
      helpText: 'Based on your description, select all applicable classes. Filing fees apply per class.',
      options: niceClasses.map((c: any) => ({
        value: String(c.classNumber),
        label: `Class ${c.classNumber}: ${c.title}`,
      })),
      aiAssisted: true,
    },

    // Step 5: Filing Basis
    {
      id: 'filing_basis',
      step: 4,
      category: 'filing_basis',
      question: 'What is the basis for your trademark application?',
      type: 'select',
      required: true,
      helpText: 'Select based on whether you are currently using the mark in commerce or intend to use it in the future.',
      options: [
        { value: 'use', label: 'Currently Using in Commerce (Section 1(a))' },
        { value: 'intent_to_use', label: 'Intent to Use (Section 1(b))' },
        { value: 'foreign_registration', label: 'Based on Foreign Registration (Section 44(e))' },
        { value: 'foreign_application', label: 'Based on Foreign Application (Section 44(d))' },
      ],
      aiAssisted: false,
    },
    {
      id: 'first_use_date',
      step: 4,
      category: 'filing_basis',
      question: 'Date of first use anywhere',
      type: 'date',
      required: true,
      helpText: 'When did you first use this mark on the goods/services? This can be before interstate commerce.',
      conditionalOn: { field: 'filing_basis', value: 'use' },
      aiAssisted: false,
    },
    {
      id: 'first_commerce_date',
      step: 4,
      category: 'filing_basis',
      question: 'Date of first use in interstate commerce',
      type: 'date',
      required: true,
      helpText: 'When did you first use the mark in commerce between states or with a foreign country?',
      conditionalOn: { field: 'filing_basis', value: 'use' },
      aiAssisted: false,
    },
    {
      id: 'foreign_registration_country',
      step: 4,
      category: 'filing_basis',
      question: 'Country of foreign registration',
      type: 'text',
      required: true,
      helpText: 'Enter the country where you have an existing trademark registration.',
      conditionalOn: { field: 'filing_basis', value: 'foreign_registration' },
      aiAssisted: false,
    },
    {
      id: 'foreign_registration_number',
      step: 4,
      category: 'filing_basis',
      question: 'Foreign registration number',
      type: 'text',
      required: true,
      conditionalOn: { field: 'filing_basis', value: 'foreign_registration' },
      aiAssisted: false,
    },
    {
      id: 'foreign_registration_date',
      step: 4,
      category: 'filing_basis',
      question: 'Foreign registration date',
      type: 'date',
      required: true,
      conditionalOn: { field: 'filing_basis', value: 'foreign_registration' },
      aiAssisted: false,
    },
    {
      id: 'foreign_application_country',
      step: 4,
      category: 'filing_basis',
      question: 'Country of foreign application',
      type: 'text',
      required: true,
      conditionalOn: { field: 'filing_basis', value: 'foreign_application' },
      aiAssisted: false,
    },
    {
      id: 'foreign_application_number',
      step: 4,
      category: 'filing_basis',
      question: 'Foreign application number',
      type: 'text',
      required: true,
      conditionalOn: { field: 'filing_basis', value: 'foreign_application' },
      aiAssisted: false,
    },
    {
      id: 'foreign_application_date',
      step: 4,
      category: 'filing_basis',
      question: 'Foreign application filing date',
      type: 'date',
      required: true,
      helpText: 'Must be within 6 months of this application to claim priority.',
      conditionalOn: { field: 'filing_basis', value: 'foreign_application' },
      aiAssisted: false,
    },

    // Step 6: Specimens
    {
      id: 'specimen_upload',
      step: 5,
      category: 'specimen',
      question: 'Upload specimen showing your mark in use',
      type: 'file',
      required: true,
      helpText: 'For goods: labels, tags, or packaging. For services: advertising or website screenshots.',
      conditionalOn: { field: 'filing_basis', value: 'use' },
      aiAssisted: true,
    },
    {
      id: 'specimen_description',
      step: 5,
      category: 'specimen',
      question: 'Describe the specimen',
      type: 'text',
      required: true,
      helpText: 'Briefly describe what the specimen shows (e.g., "product label", "website homepage").',
      conditionalOn: { field: 'filing_basis', value: 'use' },
      aiAssisted: false,
    },

    // Step 7: Declarations
    {
      id: 'declaration_accuracy',
      step: 6,
      category: 'declaration',
      question: 'I declare that all statements in this application are true.',
      type: 'checkbox',
      required: true,
      helpText: 'Required declaration of accuracy.',
      aiAssisted: false,
    },
    {
      id: 'declaration_use',
      step: 6,
      category: 'declaration',
      question: 'I declare that the mark is in use in commerce.',
      type: 'checkbox',
      required: true,
      helpText: 'Declaration required for use-based applications.',
      conditionalOn: { field: 'filing_basis', value: 'use' },
      aiAssisted: false,
    },
    {
      id: 'declaration_intent',
      step: 6,
      category: 'declaration',
      question: 'I have a bona fide intention to use the mark in commerce.',
      type: 'checkbox',
      required: true,
      helpText: 'Declaration required for intent-to-use applications.',
      conditionalOn: { field: 'filing_basis', value: 'intent_to_use' },
      aiAssisted: false,
    },
    {
      id: 'signatory_name',
      step: 6,
      category: 'declaration',
      question: 'Full name of person signing',
      type: 'text',
      required: true,
      helpText: 'Enter the full legal name of the person signing the application.',
      aiAssisted: false,
    },
    {
      id: 'signatory_title',
      step: 6,
      category: 'declaration',
      question: 'Title/Position',
      type: 'text',
      required: false,
      helpText: 'If signing on behalf of a company, enter your title (e.g., CEO, President).',
      conditionalOn: { field: 'owner_type', value: ['corporation', 'llc', 'partnership', 'trust', 'other'] },
      aiAssisted: false,
    },
    {
      id: 'signatory_position',
      step: 6,
      category: 'declaration',
      question: 'In what capacity are you signing?',
      type: 'select',
      required: true,
      options: [
        { value: 'owner', label: 'Owner/Applicant' },
        { value: 'officer', label: 'Officer of Company' },
        { value: 'attorney', label: 'Attorney of Record' },
        { value: 'authorized_representative', label: 'Authorized Representative' },
      ],
      aiAssisted: false,
    },
    {
      id: 'electronic_signature',
      step: 6,
      category: 'declaration',
      question: 'Electronic signature',
      type: 'signature',
      required: true,
      helpText: 'Type your name between forward slashes (e.g., /John Smith/).',
      aiAssisted: false,
    },

    // Step 8: Review (no questions, just displays summary)
  ];
}

/**
 * Get state options for dropdown
 */
function getStateOptions(): { value: string; label: string }[] {
  const states = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
  ];
  return states;
}

// ==================== APPLICATION MANAGEMENT ====================

/**
 * Create a new trademark application
 */
export async function createApplication(
  userId: string,
  organizationId?: string
): Promise<TrademarkApplication> {
  const application: TrademarkApplication = {
    id: crypto.randomUUID(),
    user_id: userId,
    organization_id: organizationId,
    jurisdiction_type: 'federal',
    mark_type: 'word',
    owner_type: 'individual',
    owner_name: '',
    owner_address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
    },
    goods_services: [],
    filing_basis: 'use',
    specimens: [],
    declarations: {
      declaration_accuracy: false,
      signatory_name: '',
    },
    status: 'draft',
    interview_data: {
      completed_steps: [],
      answers: {},
      ai_clarifications: [],
    },
    current_step: 0,
    deadlines: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin.from('trademark_applications').insert({
      id: application.id,
      user_id: userId,
      organization_id: organizationId,
      jurisdiction_type: application.jurisdiction_type,
      mark_type: application.mark_type,
      owner_type: application.owner_type,
      owner_name: application.owner_name,
      owner_address: application.owner_address,
      goods_services: application.goods_services,
      filing_basis: application.filing_basis,
      specimens: application.specimens,
      declarations: application.declarations,
      status: application.status,
      interview_data: application.interview_data,
      current_step: application.current_step,
      deadlines: application.deadlines,
      created_at: application.created_at,
      updated_at: application.updated_at,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Failed to create trademark application:', error);
    throw error;
  }

  return application;
}

/**
 * Get application by ID
 */
export async function getApplication(
  applicationId: string,
  userId: string
): Promise<TrademarkApplication | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('trademark_applications')
      .select('*')
      .eq('id', applicationId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TrademarkApplication;
  } catch (error) {
    logger.error('Failed to get trademark application:', error);
    return null;
  }
}

/**
 * Update application
 */
export async function updateApplication(
  applicationId: string,
  userId: string,
  updates: Partial<TrademarkApplication>
): Promise<TrademarkApplication> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const updatedApplication = {
    ...application,
    ...updates,
    updated_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabaseAdmin
      .from('trademark_applications')
      .update({
        ...updates,
        updated_at: updatedApplication.updated_at,
      })
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Failed to update trademark application:', error);
    throw error;
  }

  return updatedApplication;
}

/**
 * Delete application (only drafts)
 */
export async function deleteApplication(
  applicationId: string,
  userId: string
): Promise<boolean> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  if (application.status !== 'draft') {
    throw new ValidationError('Only draft applications can be deleted');
  }

  try {
    const { error } = await supabaseAdmin
      .from('trademark_applications')
      .delete()
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    logger.error('Failed to delete trademark application:', error);
    throw error;
  }
}

/**
 * List user's applications
 */
export async function listApplications(
  userId: string,
  options: {
    status?: TrademarkApplicationStatus;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ applications: TrademarkApplication[]; total: number }> {
  try {
    let query = supabaseAdmin
      .from('trademark_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      applications: (data || []) as TrademarkApplication[],
      total: count || 0,
    };
  } catch (error) {
    logger.error('Failed to list trademark applications:', error);
    return { applications: [], total: 0 };
  }
}

// ==================== INTERVIEW WORKFLOW ====================

/**
 * Get current interview state
 */
export async function getInterviewState(
  applicationId: string,
  userId: string
): Promise<{
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
  currentQuestions: InterviewQuestion[];
  answers: Record<string, any>;
  progress: number;
}> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const allQuestions = getInterviewQuestions();
  const currentQuestions = getQuestionsForStep(
    application.current_step,
    allQuestions,
    application.interview_data.answers
  );

  const completedSteps = application.interview_data.completed_steps;
  const progress = Math.round((completedSteps.length / WORKFLOW_STEPS.length) * 100);

  return {
    currentStep: application.current_step,
    totalSteps: WORKFLOW_STEPS.length,
    completedSteps,
    currentQuestions,
    answers: application.interview_data.answers,
    progress,
  };
}

/**
 * Get questions for a specific step, respecting conditional logic
 */
function getQuestionsForStep(
  stepIndex: number,
  allQuestions: InterviewQuestion[],
  answers: Record<string, any>
): InterviewQuestion[] {
  return allQuestions.filter(q => {
    // Filter by step
    if (q.step !== stepIndex) return false;

    // Check conditional visibility
    if (q.conditionalOn) {
      const conditionValue = answers[q.conditionalOn.field];
      if (Array.isArray(q.conditionalOn.value)) {
        if (!q.conditionalOn.value.includes(conditionValue)) {
          return false;
        }
      } else if (conditionValue !== q.conditionalOn.value) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Submit answer for an interview question
 */
export async function submitAnswer(
  applicationId: string,
  userId: string,
  questionId: string,
  answer: any
): Promise<{
  success: boolean;
  aiSuggestion?: any;
  validationErrors?: string[];
  nextQuestion?: InterviewQuestion;
}> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const allQuestions = getInterviewQuestions();
  const question = allQuestions.find(q => q.id === questionId);

  if (!question) {
    throw new ValidationError('Invalid question ID');
  }

  // Validate answer
  const validationErrors = validateAnswer(question, answer);
  if (validationErrors.length > 0) {
    return { success: false, validationErrors };
  }

  // Update answers
  const updatedAnswers = {
    ...application.interview_data.answers,
    [questionId]: answer,
  };

  // Update application with answer
  await updateApplicationFromAnswers(application, updatedAnswers, userId);

  // Get AI suggestion if question is AI-assisted
  let aiSuggestion;
  if (question.aiAssisted) {
    aiSuggestion = await getAISuggestionForQuestion(question, answer, updatedAnswers, userId);
  }

  // Check if step is complete
  const currentQuestions = getQuestionsForStep(
    application.current_step,
    allQuestions,
    updatedAnswers
  );
  const requiredQuestions = currentQuestions.filter(q => q.required);
  const allAnswered = requiredQuestions.every(q => updatedAnswers[q.id] !== undefined);

  // Get next question or indicate step complete
  const nextQuestion = currentQuestions.find(q =>
    q.id !== questionId && updatedAnswers[q.id] === undefined && q.required
  );

  return {
    success: true,
    aiSuggestion,
    nextQuestion,
  };
}

/**
 * Validate an answer against question requirements
 */
function validateAnswer(question: InterviewQuestion, answer: any): string[] {
  const errors: string[] = [];

  if (question.required && (answer === undefined || answer === null || answer === '')) {
    errors.push('This field is required');
    return errors;
  }

  if (question.validation) {
    if (question.validation.minLength && typeof answer === 'string' && answer.length < question.validation.minLength) {
      errors.push(`Minimum length is ${question.validation.minLength} characters`);
    }
    if (question.validation.maxLength && typeof answer === 'string' && answer.length > question.validation.maxLength) {
      errors.push(`Maximum length is ${question.validation.maxLength} characters`);
    }
    if (question.validation.pattern) {
      const regex = new RegExp(question.validation.pattern);
      if (!regex.test(answer)) {
        errors.push(question.validation.patternError || 'Invalid format');
      }
    }
  }

  return errors;
}

/**
 * Update application fields based on interview answers
 */
async function updateApplicationFromAnswers(
  application: TrademarkApplication,
  answers: Record<string, any>,
  userId: string
): Promise<void> {
  const updates: Partial<TrademarkApplication> = {
    interview_data: {
      ...application.interview_data,
      answers,
    },
  };

  // Map answers to application fields
  if (answers.jurisdiction_type) {
    updates.jurisdiction_type = answers.jurisdiction_type as JurisdictionType;
  }
  if (answers.jurisdiction_state) {
    updates.jurisdiction_state = answers.jurisdiction_state;
  }
  if (answers.mark_type) {
    updates.mark_type = answers.mark_type as MarkType;
  }
  if (answers.mark_text) {
    updates.mark_text = answers.mark_text;
  }
  if (answers.mark_description) {
    updates.mark_description = answers.mark_description;
  }
  if (answers.mark_colors) {
    updates.mark_color_claim = answers.mark_colors;
  }
  if (answers.mark_translation) {
    updates.mark_translation = answers.mark_translation;
  }
  if (answers.mark_transliteration) {
    updates.mark_transliteration = answers.mark_transliteration;
  }
  if (answers.owner_type) {
    updates.owner_type = answers.owner_type as OwnerType;
  }
  if (answers.owner_name) {
    updates.owner_name = answers.owner_name;
  }
  if (answers.owner_address) {
    updates.owner_address = answers.owner_address as Address;
  }
  if (answers.owner_citizenship) {
    updates.owner_citizenship = answers.owner_citizenship;
  }
  if (answers.owner_state_of_organization) {
    updates.owner_state_of_organization = answers.owner_state_of_organization;
  }
  if (answers.filing_basis) {
    updates.filing_basis = answers.filing_basis as FilingBasis;
  }
  if (answers.first_use_date) {
    updates.first_use_date = answers.first_use_date;
  }
  if (answers.first_commerce_date) {
    updates.first_commerce_date = answers.first_commerce_date;
  }

  await updateApplication(application.id, userId, updates);
}

/**
 * Get AI suggestion for a question
 */
async function getAISuggestionForQuestion(
  question: InterviewQuestion,
  answer: any,
  allAnswers: Record<string, any>,
  userId: string
): Promise<any> {
  try {
    switch (question.id) {
      case 'mark_text':
        // Analyze mark strength
        return await trademarkAI.analyzeMarkStrength(
          answer,
          allAnswers.goods_services_description,
          userId
        );

      case 'goods_services_description':
        // Suggest Nice classes
        return await trademarkAI.suggestNiceClasses(answer, userId);

      case 'mark_description':
      case 'mark_colors':
        // Provide description suggestions
        return {
          tip: 'Be specific about all visual elements including colors, shapes, and placement.',
        };

      default:
        return null;
    }
  } catch (error) {
    logger.error('Failed to get AI suggestion:', error);
    return null;
  }
}

/**
 * Move to next step
 */
export async function nextStep(
  applicationId: string,
  userId: string
): Promise<{
  success: boolean;
  newStep: number;
  errors?: string[];
}> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const allQuestions = getInterviewQuestions();
  const currentQuestions = getQuestionsForStep(
    application.current_step,
    allQuestions,
    application.interview_data.answers
  );

  // Validate all required questions are answered
  const errors: string[] = [];
  for (const question of currentQuestions) {
    if (question.required) {
      const answer = application.interview_data.answers[question.id];
      if (answer === undefined || answer === null || answer === '') {
        errors.push(`Please answer: ${question.question}`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, newStep: application.current_step, errors };
  }

  // Mark current step as complete
  const currentStepId = WORKFLOW_STEPS[application.current_step]?.id;
  const completedSteps = [...application.interview_data.completed_steps];
  if (currentStepId && !completedSteps.includes(currentStepId)) {
    completedSteps.push(currentStepId);
  }

  // Move to next step
  const newStep = Math.min(application.current_step + 1, WORKFLOW_STEPS.length - 1);

  await updateApplication(application.id, userId, {
    current_step: newStep,
    interview_data: {
      ...application.interview_data,
      completed_steps: completedSteps,
    },
  });

  return { success: true, newStep };
}

/**
 * Move to previous step
 */
export async function previousStep(
  applicationId: string,
  userId: string
): Promise<{ success: boolean; newStep: number }> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const newStep = Math.max(application.current_step - 1, 0);

  await updateApplication(application.id, userId, {
    current_step: newStep,
  });

  return { success: true, newStep };
}

/**
 * Jump to a specific step
 */
export async function goToStep(
  applicationId: string,
  userId: string,
  stepIndex: number
): Promise<{ success: boolean; newStep: number }> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  if (stepIndex < 0 || stepIndex >= WORKFLOW_STEPS.length) {
    throw new ValidationError('Invalid step index');
  }

  await updateApplication(application.id, userId, {
    current_step: stepIndex,
  });

  return { success: true, newStep: stepIndex };
}

/**
 * Get AI clarification for a question
 */
export async function getClarification(
  applicationId: string,
  userId: string,
  questionId: string,
  userQuestion: string
): Promise<string> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  const allQuestions = getInterviewQuestions();
  const question = allQuestions.find(q => q.id === questionId);

  if (!question) {
    throw new ValidationError('Invalid question ID');
  }

  const clarification = await trademarkAI.clarifyInterviewQuestion(
    questionId,
    question.question,
    userQuestion,
    application.interview_data.answers,
    userId
  );

  // Save clarification to interview data
  const newClarification: AIClarification = {
    question_id: questionId,
    user_question: userQuestion,
    ai_response: clarification,
    asked_at: new Date().toISOString(),
  };

  await updateApplication(application.id, userId, {
    interview_data: {
      ...application.interview_data,
      ai_clarifications: [
        ...application.interview_data.ai_clarifications,
        newClarification,
      ],
    },
  });

  return clarification;
}

/**
 * Complete the interview and prepare for filing
 */
export async function completeInterview(
  applicationId: string,
  userId: string
): Promise<{
  success: boolean;
  application: TrademarkApplication;
  errors?: string[];
  aiSuggestions?: any;
}> {
  const application = await getApplication(applicationId, userId);
  if (!application) {
    throw new NotFoundError('Trademark application');
  }

  // Validate all steps are complete
  const errors: string[] = [];
  const allQuestions = getInterviewQuestions();

  for (let step = 0; step < WORKFLOW_STEPS.length - 1; step++) {
    const stepQuestions = getQuestionsForStep(
      step,
      allQuestions,
      application.interview_data.answers
    );

    for (const question of stepQuestions) {
      if (question.required) {
        const answer = application.interview_data.answers[question.id];
        if (answer === undefined || answer === null || answer === '') {
          errors.push(`Step ${step + 1}: Please answer "${question.question}"`);
        }
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, application, errors };
  }

  // Generate comprehensive AI suggestions
  const aiSuggestions = await trademarkAI.generateApplicationSuggestions(
    application.mark_text || '',
    application.mark_type,
    application.goods_services,
    application.filing_basis,
    userId
  );

  // Update application status
  const updatedApplication = await updateApplication(application.id, userId, {
    status: 'ready',
    ai_suggestions: aiSuggestions,
    interview_data: {
      ...application.interview_data,
      completed_at: new Date().toISOString(),
      completed_steps: WORKFLOW_STEPS.map(s => s.id),
    },
  });

  return {
    success: true,
    application: updatedApplication,
    aiSuggestions,
  };
}

export default {
  WORKFLOW_STEPS,
  getInterviewQuestions,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
  listApplications,
  getInterviewState,
  submitAnswer,
  nextStep,
  previousStep,
  goToStep,
  getClarification,
  completeInterview,
};
