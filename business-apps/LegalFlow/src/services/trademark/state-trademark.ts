/**
 * State Trademark Service
 *
 * Handles trademark registration for all 50 US states + DC.
 * Each state has unique requirements, filing methods, and fees.
 */

import { logger } from '../../utils/logger.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { generatePDF, PDFSection } from '../pdf/pdf-generator.js';
import stateRequirementsData from '../../data/state-trademark-requirements.json' assert { type: 'json' };
import type {
  TrademarkApplication,
  StateTrademarkRequirements,
  StateFilingMethod,
} from '../../types/trademark.js';

// Type the imported data
const stateRequirements = stateRequirementsData as Record<string, StateTrademarkRequirements>;

// ==================== STATE DATA ACCESS ====================

/**
 * Get all state trademark requirements
 */
export function getAllStateRequirements(): StateTrademarkRequirements[] {
  return Object.values(stateRequirements);
}

/**
 * Get requirements for a specific state
 */
export function getStateRequirements(stateCode: string): StateTrademarkRequirements | null {
  const upperCode = stateCode.toUpperCase();
  return stateRequirements[upperCode] || null;
}

/**
 * Get states by filing method
 */
export function getStatesByFilingMethod(method: StateFilingMethod): StateTrademarkRequirements[] {
  return Object.values(stateRequirements).filter(state => state.filing_method === method);
}

/**
 * Get states with online filing
 */
export function getOnlineFilingStates(): StateTrademarkRequirements[] {
  return Object.values(stateRequirements).filter(
    state => state.filing_method === 'online' || state.filing_method === 'both'
  );
}

/**
 * Get total filing fee for a state application
 */
export function calculateStateFees(
  stateCode: string,
  numberOfClasses: number
): { total: number; breakdown: { description: string; amount: number }[] } {
  const state = getStateRequirements(stateCode);
  if (!state) {
    throw new NotFoundError(`State ${stateCode}`);
  }

  const breakdown: { description: string; amount: number }[] = [];

  // Base filing fee per class
  const baseFee = state.fee_per_class * numberOfClasses;
  breakdown.push({
    description: `Filing fee (${numberOfClasses} class${numberOfClasses > 1 ? 'es' : ''} @ $${state.fee_per_class}/class)`,
    amount: baseFee,
  });

  // Additional fees if any
  if (state.additional_fees) {
    for (const fee of state.additional_fees) {
      breakdown.push({
        description: fee.type,
        amount: fee.amount,
      });
    }
  }

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return { total, breakdown };
}

/**
 * Get renewal information for a state
 */
export function getStateRenewalInfo(stateCode: string): {
  periodYears: number;
  fee: number;
  useAffidavitRequired: boolean;
  useAffidavitFrequency?: number;
} | null {
  const state = getStateRequirements(stateCode);
  if (!state) {
    return null;
  }

  return {
    periodYears: state.renewal_period_years,
    fee: state.renewal_fee,
    useAffidavitRequired: state.use_affidavit_required,
    useAffidavitFrequency: state.use_affidavit_frequency_years,
  };
}

// ==================== STATE APPLICATION DOCUMENT GENERATION ====================

export interface StateApplicationResult {
  pdfBase64: string;
  documentType: 'state_application';
  stateCode: string;
  stateName: string;
  filingMethod: StateFilingMethod;
  portalUrl?: string;
  mailingAddress?: string;
  totalFee: number;
  feeBreakdown: { description: string; amount: number }[];
  requiredForms: string[];
  requiredDocuments: string[];
  generatedAt: string;
  instructions: string[];
}

/**
 * Generate state trademark application document
 */
export async function generateStateApplication(
  application: TrademarkApplication
): Promise<StateApplicationResult> {
  if (application.jurisdiction_type !== 'state' || !application.jurisdiction_state) {
    throw new ValidationError('Application must be a state trademark application');
  }

  const stateCode = application.jurisdiction_state;
  const state = getStateRequirements(stateCode);

  if (!state) {
    throw new NotFoundError(`State requirements for ${stateCode}`);
  }

  // Validate application completeness
  const errors = validateStateApplication(application, state);
  if (errors.length > 0) {
    throw new ValidationError(`Application incomplete: ${errors.join(', ')}`);
  }

  const sections: PDFSection[] = [];

  // Title and header
  sections.push({
    title: `${state.state_name} Trademark Application`,
    content: generateStateHeader(application, state),
  });

  // Applicant Information
  sections.push({
    title: 'Applicant Information',
    content: generateApplicantInfo(application),
  });

  // Mark Information
  sections.push({
    title: 'Mark Information',
    content: generateMarkInfo(application),
  });

  // Goods and Services
  sections.push({
    title: 'Goods and Services',
    content: generateGoodsServices(application),
  });

  // Use Information
  sections.push({
    title: 'Use Information',
    content: generateUseInfo(application),
  });

  // Declaration (state-specific)
  sections.push({
    title: 'Declaration',
    content: generateStateDeclaration(application, state),
  });

  // Filing Fee Information
  const fees = calculateStateFees(stateCode, application.goods_services.length);
  sections.push({
    title: 'Fee Information',
    content: generateFeeInfo(fees, state),
  });

  // Filing Instructions
  const instructions = generateStateFilingInstructions(state);
  sections.push({
    title: 'Filing Instructions',
    content: instructions.join('\n\n'),
  });

  // Generate PDF
  const pdfBase64 = await generatePDF({
    title: `${state.state_name} Trademark Application - ${application.mark_text || 'Design Mark'}`,
    sections,
    metadata: {
      author: 'LegalFlow by GAS',
      subject: `${state.state_name} State Trademark Application`,
      keywords: ['trademark', state.state_name, application.mark_text || ''].join(', '),
    },
  });

  // Format mailing address if needed
  let mailingAddress: string | undefined;
  if (state.mailing_address) {
    const addr = state.mailing_address;
    mailingAddress = [
      addr.street,
      `${addr.city}, ${addr.state} ${addr.zipCode}`,
    ].join('\n');
  }

  return {
    pdfBase64,
    documentType: 'state_application',
    stateCode: state.state_code,
    stateName: state.state_name,
    filingMethod: state.filing_method,
    portalUrl: state.portal_url,
    mailingAddress,
    totalFee: fees.total,
    feeBreakdown: fees.breakdown,
    requiredForms: state.required_forms,
    requiredDocuments: state.required_documents,
    generatedAt: new Date().toISOString(),
    instructions,
  };
}

/**
 * Generate state renewal document
 */
export async function generateStateRenewal(
  application: TrademarkApplication
): Promise<StateApplicationResult> {
  if (!application.jurisdiction_state) {
    throw new ValidationError('State code is required');
  }

  if (!application.registration_number) {
    throw new ValidationError('Registration number is required for renewal');
  }

  const stateCode = application.jurisdiction_state;
  const state = getStateRequirements(stateCode);

  if (!state) {
    throw new NotFoundError(`State requirements for ${stateCode}`);
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: `${state.state_name} Trademark Renewal Application`,
    content: `
State: ${state.state_name}
Registration Number: ${application.registration_number}
Mark: ${application.mark_text || '[Design Mark]'}
Owner: ${application.owner_name}
    `.trim(),
  });

  sections.push({
    title: 'Renewal Information',
    content: `
This application is filed to renew the above-referenced trademark registration.

Registration Date: ${application.registration_date || '[Required]'}
Renewal Period: ${state.renewal_period_years} years
Renewal Fee: $${state.renewal_fee}

The mark continues to be in use in commerce in ${state.state_name}.
    `.trim(),
  });

  sections.push({
    title: 'Goods and Services (Still in Use)',
    content: application.goods_services.map(gs =>
      `Class ${gs.classNumber}: ${gs.description}`
    ).join('\n'),
  });

  if (state.use_affidavit_required) {
    sections.push({
      title: 'Affidavit of Continued Use',
      content: `
The undersigned declares under penalty of perjury that the mark shown in the registration
identified above is in use in commerce in the State of ${state.state_name} on or in
connection with all goods/services listed above.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
      `.trim(),
    });
  }

  const instructions = [
    `File this renewal with the ${state.state_name} Secretary of State.`,
    state.filing_method === 'online'
      ? `File online at: ${state.portal_url}`
      : `Mail to: ${state.mailing_address?.street}, ${state.mailing_address?.city}, ${state.mailing_address?.state} ${state.mailing_address?.zipCode}`,
    `Pay the renewal fee of $${state.renewal_fee}.`,
  ];

  sections.push({
    title: 'Filing Instructions',
    content: instructions.join('\n'),
  });

  const pdfBase64 = await generatePDF({
    title: `${state.state_name} Trademark Renewal`,
    sections,
  });

  return {
    pdfBase64,
    documentType: 'state_application',
    stateCode: state.state_code,
    stateName: state.state_name,
    filingMethod: state.filing_method,
    portalUrl: state.portal_url,
    totalFee: state.renewal_fee,
    feeBreakdown: [{ description: 'Renewal fee', amount: state.renewal_fee }],
    requiredForms: state.required_forms,
    requiredDocuments: state.required_documents,
    generatedAt: new Date().toISOString(),
    instructions,
  };
}

// ==================== MULTI-STATE FILING ====================

/**
 * Generate applications for multiple states
 */
export async function generateMultiStateApplications(
  application: TrademarkApplication,
  stateCodes: string[]
): Promise<{
  applications: StateApplicationResult[];
  totalFee: number;
  errors: { stateCode: string; error: string }[];
}> {
  const results: StateApplicationResult[] = [];
  const errors: { stateCode: string; error: string }[] = [];
  let totalFee = 0;

  for (const stateCode of stateCodes) {
    try {
      const stateApp = {
        ...application,
        jurisdiction_type: 'state' as const,
        jurisdiction_state: stateCode,
      };

      const result = await generateStateApplication(stateApp);
      results.push(result);
      totalFee += result.totalFee;
    } catch (error) {
      errors.push({
        stateCode,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return {
    applications: results,
    totalFee,
    errors,
  };
}

/**
 * Get recommended states for registration based on business locations
 */
export function getRecommendedStates(
  primaryState: string,
  businessOperationStates: string[]
): {
  recommended: string[];
  optional: string[];
  reasoning: string;
} {
  const allStates = new Set([primaryState, ...businessOperationStates]);
  const recommended = Array.from(allStates);

  // Get bordering states as optional (simplified logic)
  const borderingStates: Record<string, string[]> = {
    'CA': ['OR', 'NV', 'AZ'],
    'TX': ['NM', 'OK', 'AR', 'LA'],
    'NY': ['NJ', 'PA', 'CT', 'MA', 'VT'],
    'FL': ['GA', 'AL'],
    // Add more as needed
  };

  const optional: string[] = [];
  for (const state of recommended) {
    const bordering = borderingStates[state] || [];
    for (const border of bordering) {
      if (!recommended.includes(border) && !optional.includes(border)) {
        optional.push(border);
      }
    }
  }

  return {
    recommended,
    optional: optional.slice(0, 5), // Limit to 5 suggestions
    reasoning: `State trademark registration provides protection in ${recommended.join(', ')}. Consider neighboring states if you plan to expand.`,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate state application completeness
 */
function validateStateApplication(
  application: TrademarkApplication,
  state: StateTrademarkRequirements
): string[] {
  const errors: string[] = [];

  if (!application.mark_text && application.mark_type === 'word') {
    errors.push('Mark text is required');
  }

  if (!application.owner_name) {
    errors.push('Owner name is required');
  }

  if (!application.owner_address) {
    errors.push('Owner address is required');
  }

  if (!application.goods_services || application.goods_services.length === 0) {
    errors.push('At least one class of goods/services is required');
  }

  if (state.specimen_required && (!application.specimens || application.specimens.length === 0)) {
    errors.push('Specimen is required for this state');
  }

  if (!application.declarations.signatory_name) {
    errors.push('Signatory name is required');
  }

  return errors;
}

/**
 * Generate state-specific header
 */
function generateStateHeader(
  application: TrademarkApplication,
  state: StateTrademarkRequirements
): string {
  return `
STATE OF ${state.state_name.toUpperCase()}
SECRETARY OF STATE
TRADEMARK APPLICATION

Application Type: New Registration
Mark: ${application.mark_text || '[Design Mark - See Attached]'}
Mark Type: ${formatMarkType(application.mark_type)}

Applicant: ${application.owner_name}
Number of Classes: ${application.goods_services.length}

Date Prepared: ${new Date().toLocaleDateString()}
  `.trim();
}

/**
 * Generate applicant information section
 */
function generateApplicantInfo(application: TrademarkApplication): string {
  const addr = application.owner_address;
  return `
Name: ${application.owner_name}
Entity Type: ${formatOwnerType(application.owner_type)}

Mailing Address:
${addr.street}
${addr.city}, ${addr.state} ${addr.zipCode}
${addr.country || 'United States'}

${application.owner_type === 'individual' && application.owner_citizenship
    ? `Country of Citizenship: ${application.owner_citizenship}`
    : ''}
${application.owner_type !== 'individual' && application.owner_state_of_organization
    ? `State of Organization: ${application.owner_state_of_organization}`
    : ''}
  `.trim();
}

/**
 * Generate mark information section
 */
function generateMarkInfo(application: TrademarkApplication): string {
  let content = '';

  content += `Mark: ${application.mark_text || '[Design Mark]'}\n`;
  content += `Mark Type: ${formatMarkType(application.mark_type)}\n`;

  if (application.mark_description) {
    content += `\nDescription: ${application.mark_description}\n`;
  }

  if (application.mark_color_claim) {
    content += `\nColor Claim: ${application.mark_color_claim}\n`;
  }

  return content.trim();
}

/**
 * Generate goods and services section
 */
function generateGoodsServices(application: TrademarkApplication): string {
  return application.goods_services.map(gs => `
Class ${gs.classNumber}:
${gs.description}
  `.trim()).join('\n\n');
}

/**
 * Generate use information section
 */
function generateUseInfo(application: TrademarkApplication): string {
  if (application.filing_basis === 'intent_to_use') {
    return `
The applicant intends to use the mark in commerce in this state.

Note: A statement of use may be required before registration is granted.
    `.trim();
  }

  return `
Date of First Use Anywhere: ${application.first_use_date || '[Required]'}
Date of First Use in Commerce: ${application.first_commerce_date || '[Required]'}

The mark is currently in use on or in connection with the goods/services listed above.
  `.trim();
}

/**
 * Generate state-specific declaration
 */
function generateStateDeclaration(
  application: TrademarkApplication,
  state: StateTrademarkRequirements
): string {
  return `
DECLARATION

The undersigned declares:

1. That the applicant is the owner of the mark and is entitled to use the mark
   in the State of ${state.state_name};

2. That the mark is in use in commerce in ${state.state_name} (or the applicant
   has a bona fide intention to use the mark in commerce);

3. That to the best of the undersigned's knowledge, no other person has the right
   to use this mark in commerce in ${state.state_name} on the same or similar
   goods/services;

4. That all statements made herein are true to the best of the undersigned's
   knowledge and belief.

The undersigned acknowledges that willful false statements are punishable by law.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Print Name: ${application.declarations.signatory_name}
${application.declarations.signatory_title ? `Title: ${application.declarations.signatory_title}` : ''}
Date: ${new Date().toISOString().split('T')[0]}
  `.trim();
}

/**
 * Generate fee information section
 */
function generateFeeInfo(
  fees: { total: number; breakdown: { description: string; amount: number }[] },
  state: StateTrademarkRequirements
): string {
  const feeList = fees.breakdown.map(f => `  ${f.description}: $${f.amount.toFixed(2)}`).join('\n');

  return `
${feeList}

TOTAL: $${fees.total.toFixed(2)}

Payment Instructions:
${state.filing_method === 'online'
    ? 'Pay online when submitting through the state portal.'
    : 'Include a check payable to the Secretary of State.'}
  `.trim();
}

/**
 * Generate state-specific filing instructions
 */
function generateStateFilingInstructions(state: StateTrademarkRequirements): string[] {
  const instructions: string[] = [];

  if (state.filing_method === 'online') {
    instructions.push(
      `FILE ONLINE: Submit your application through the ${state.state_name} Secretary of State portal.`,
      `Portal URL: ${state.portal_url}`,
      'Have the following ready: credit card for payment, digital copies of any specimens.'
    );
  } else if (state.filing_method === 'mail') {
    const addr = state.mailing_address;
    instructions.push(
      `MAIL APPLICATION: Send your completed application to:`,
      `${state.state_name} Secretary of State`,
      addr ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}` : '[Address on file]',
      `Include a check for $${state.fee_per_class} per class, payable to the Secretary of State.`
    );
  } else {
    instructions.push(
      'This state accepts both online and mail filings.',
      `Online: ${state.portal_url}`,
      'Mail: See address on the Secretary of State website.'
    );
  }

  // Required forms
  if (state.required_forms.length > 0) {
    instructions.push(`Required Forms: ${state.required_forms.join(', ')}`);
  }

  // Required documents
  if (state.required_documents.length > 0) {
    instructions.push(`Required Documents: ${state.required_documents.join(', ')}`);
  }

  // Specimen requirement
  if (state.specimen_required) {
    instructions.push('A specimen showing the mark in use is REQUIRED for this state.');
  }

  // Notes
  if (state.notes) {
    instructions.push(`Note: ${state.notes}`);
  }

  return instructions;
}

// Formatting helpers
function formatMarkType(type: string): string {
  const types: Record<string, string> = {
    word: 'Word Mark',
    design: 'Design Mark',
    combined: 'Combined Word and Design',
    sound: 'Sound Mark',
    motion: 'Motion Mark',
    color: 'Color Mark',
    other: 'Other',
  };
  return types[type] || type;
}

function formatOwnerType(type: string): string {
  const types: Record<string, string> = {
    individual: 'Individual',
    corporation: 'Corporation',
    llc: 'Limited Liability Company',
    partnership: 'Partnership',
    trust: 'Trust',
    other: 'Other Entity',
  };
  return types[type] || type;
}

// ==================== STATE SEARCH ====================

/**
 * Search state trademark database
 * Note: Most states don't have public APIs, so this is a placeholder
 * for future integration with individual state databases
 */
export async function searchStateDatabase(
  stateCode: string,
  searchTerm: string
): Promise<{
  results: any[];
  searchUrl: string;
  notes: string;
}> {
  const state = getStateRequirements(stateCode);
  if (!state) {
    throw new NotFoundError(`State ${stateCode}`);
  }

  // Most states require manual search through their portal
  logger.info(`State trademark search requested for ${stateCode}: ${searchTerm}`);

  return {
    results: [],
    searchUrl: state.portal_url || `https://www.${stateCode.toLowerCase()}.gov/sos/`,
    notes: `State trademark searches for ${state.state_name} must be conducted through the Secretary of State website. Most states do not provide public APIs for trademark searches.`,
  };
}

export default {
  getAllStateRequirements,
  getStateRequirements,
  getStatesByFilingMethod,
  getOnlineFilingStates,
  calculateStateFees,
  getStateRenewalInfo,
  generateStateApplication,
  generateStateRenewal,
  generateMultiStateApplications,
  getRecommendedStates,
  searchStateDatabase,
};
