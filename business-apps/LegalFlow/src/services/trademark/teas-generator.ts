/**
 * TEAS Document Generator
 *
 * Generates USPTO TEAS (Trademark Electronic Application System) documents:
 * - TEAS Plus applications
 * - TEAS Standard applications
 * - Statement of Use
 * - Extension Requests
 * - Section 8 Declarations
 * - Section 9 Renewals
 * - Section 15 Declarations
 */

import { logger } from '../../utils/logger.js';
import { ValidationError } from '../../utils/errors.js';
import { generatePDF, PDFSection } from '../pdf/pdf-generator.js';
import type {
  TrademarkApplication,
  TrademarkDocumentType,
  TEASApplicationType,
  GoodsServicesEntry,
} from '../../types/trademark.js';

// USPTO fee schedule (as of 2024)
const USPTO_FEES = {
  teas_plus_per_class: 250,
  teas_standard_per_class: 350,
  statement_of_use: 100,
  extension_request: 125,
  section_8: 225,
  section_9: 300,
  section_15: 0, // No additional fee if filed with Section 8
  section_8_15_combined: 225,
} as const;

// ==================== DOCUMENT GENERATION ====================

export interface TEASDocumentResult {
  pdfBase64: string;
  pdfUrl?: string;
  documentType: TrademarkDocumentType;
  totalFee: number;
  feeBreakdown: { description: string; amount: number }[];
  generatedAt: string;
  warnings: string[];
  readyToFile: boolean;
}

/**
 * Generate complete TEAS application document
 */
export async function generateTEASApplication(
  application: TrademarkApplication,
  teasType: TEASApplicationType = 'plus'
): Promise<TEASDocumentResult> {
  // Validate application is ready
  const validationErrors = validateApplicationForTEAS(application, teasType);
  if (validationErrors.length > 0) {
    throw new ValidationError(`Application not ready for TEAS: ${validationErrors.join(', ')}`);
  }

  const sections: PDFSection[] = [];
  const warnings: string[] = [];

  // Title page
  sections.push({
    title: `USPTO Trademark Application - TEAS ${teasType === 'plus' ? 'Plus' : 'Standard'}`,
    content: generateTitlePage(application),
  });

  // Section 1: Mark Information
  sections.push({
    title: 'Mark Information',
    content: generateMarkSection(application),
  });

  // Section 2: Applicant Information
  sections.push({
    title: 'Applicant Information',
    content: generateApplicantSection(application),
  });

  // Section 3: Goods and Services
  sections.push({
    title: 'Goods and Services',
    content: generateGoodsServicesSection(application, teasType),
  });

  // Section 4: Basis for Filing
  sections.push({
    title: 'Basis for Filing',
    content: generateBasisSection(application),
  });

  // Section 5: Specimens (if use-based)
  if (application.filing_basis === 'use' && application.specimens.length > 0) {
    sections.push({
      title: 'Specimen Information',
      content: generateSpecimenSection(application),
    });
  }

  // Section 6: Declarations
  sections.push({
    title: 'Declaration',
    content: generateDeclarationSection(application),
  });

  // Section 7: Fee Information
  const feeBreakdown = calculateFees(application, teasType);
  sections.push({
    title: 'Fee Summary',
    content: generateFeeSection(feeBreakdown),
  });

  // Section 8: Filing Instructions
  sections.push({
    title: 'Filing Instructions',
    content: generateFilingInstructions(teasType),
  });

  // Generate PDF
  const pdfBase64 = await generatePDF({
    title: `Trademark Application - ${application.mark_text || 'Design Mark'}`,
    sections,
    metadata: {
      author: 'LegalFlow by GAS',
      subject: 'USPTO Trademark Application',
      keywords: ['trademark', 'USPTO', 'TEAS', application.mark_text || ''].join(', '),
    },
  });

  // Check for warnings
  if (application.filing_basis === 'intent_to_use') {
    warnings.push('Intent-to-use application: You must file a Statement of Use before registration.');
  }
  if (application.goods_services.length > 3) {
    warnings.push(`Multiple classes (${application.goods_services.length}): Higher filing fees apply.`);
  }

  const totalFee = feeBreakdown.reduce((sum, fee) => sum + fee.amount, 0);

  return {
    pdfBase64,
    documentType: teasType === 'plus' ? 'teas_plus' : 'teas_standard',
    totalFee,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings,
    readyToFile: true,
  };
}

/**
 * Generate Statement of Use document
 */
export async function generateStatementOfUse(
  application: TrademarkApplication
): Promise<TEASDocumentResult> {
  if (application.filing_basis !== 'intent_to_use') {
    throw new ValidationError('Statement of Use is only for Intent-to-Use applications');
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: 'Statement of Use / Amendment to Allege Use',
    content: `
Serial Number: ${application.serial_number || '[To be assigned]'}
Mark: ${application.mark_text || '[Design Mark]'}
Applicant: ${application.owner_name}

This Statement of Use is filed in connection with the above-identified application.
    `.trim(),
  });

  sections.push({
    title: 'Declaration of Use',
    content: `
The applicant is using the mark in commerce on or in connection with all of the goods/services
listed in the application.

For each class listed, the applicant submits one specimen showing the mark as used on or
in connection with the goods/services, and declares that the specimen is a true copy of
the mark as used in commerce.
    `.trim(),
  });

  // Add goods/services with use dates
  sections.push({
    title: 'Goods/Services and Use Information',
    content: application.goods_services.map(gs => `
Class ${gs.classNumber}:
  Description: ${gs.description}
  First Use Date: ${gs.firstUseDate || application.first_use_date || '[Required]'}
  First Commerce Date: ${gs.firstCommerceDate || application.first_commerce_date || '[Required]'}
    `.trim()).join('\n\n'),
  });

  // Specimen information
  sections.push({
    title: 'Specimen Information',
    content: application.specimens.map((spec, idx) => `
Specimen ${idx + 1}:
  Type: ${spec.file_type}
  Description: ${spec.description}
  For Class: ${spec.class_number}
    `.trim()).join('\n\n'),
  });

  // Declaration
  sections.push({
    title: 'Declaration',
    content: generateSOUDeclaration(application),
  });

  const feeBreakdown = [
    { description: 'Statement of Use fee', amount: USPTO_FEES.statement_of_use },
  ];

  const pdfBase64 = await generatePDF({
    title: 'Statement of Use',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'statement_of_use',
    totalFee: USPTO_FEES.statement_of_use,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings: [],
    readyToFile: true,
  };
}

/**
 * Generate Extension Request
 */
export async function generateExtensionRequest(
  application: TrademarkApplication,
  extensionNumber: number = 1
): Promise<TEASDocumentResult> {
  if (extensionNumber < 1 || extensionNumber > 5) {
    throw new ValidationError('Extension number must be between 1 and 5');
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: 'Request for Extension of Time to File Statement of Use',
    content: `
Serial Number: ${application.serial_number || '[Required]'}
Mark: ${application.mark_text || '[Design Mark]'}
Applicant: ${application.owner_name}

Extension Request Number: ${extensionNumber} of 5

The applicant requests a six-month extension of time to file a Statement of Use under
Trademark Act Section 1(d)(2).
    `.trim(),
  });

  sections.push({
    title: 'Showing of Good Cause',
    content: `
The applicant has a continued bona fide intention to use the mark in commerce on or in
connection with all goods and/or services listed in the Notice of Allowance, but has not
yet been able to file a Statement of Use because:

[Applicant should specify ongoing efforts to make use of the mark]

The applicant has made the following ongoing efforts to use the mark in commerce:
- [Describe efforts]
    `.trim(),
  });

  sections.push({
    title: 'Declaration',
    content: `
The undersigned, being hereby warned that willful false statements and the like are
punishable by fine or imprisonment, or both, under 18 U.S.C. § 1001, and that such
willful false statements may jeopardize the validity of the application or any
resulting registration, declares that all statements made of his/her own knowledge
are true, and that all statements made on information and belief are believed to be true.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${application.declarations.signature_date || new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
    `.trim(),
  });

  const feeBreakdown = [
    { description: `Extension Request #${extensionNumber}`, amount: USPTO_FEES.extension_request },
  ];

  const pdfBase64 = await generatePDF({
    title: 'Extension Request',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'extension_request',
    totalFee: USPTO_FEES.extension_request,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings: extensionNumber >= 4 ? ['This is extension #' + extensionNumber + '. Only one more extension available.'] : [],
    readyToFile: true,
  };
}

/**
 * Generate Section 8 Declaration (Affidavit of Continued Use)
 */
export async function generateSection8Declaration(
  application: TrademarkApplication
): Promise<TEASDocumentResult> {
  if (!application.registration_number) {
    throw new ValidationError('Section 8 Declaration requires a registration number');
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: 'Declaration of Use of Mark Under Section 8',
    content: `
Registration Number: ${application.registration_number}
Mark: ${application.mark_text || '[Design Mark]'}
Owner: ${application.owner_name}

The owner of the above-identified registration declares that the mark is in use in
commerce on or in connection with all goods/services listed in the registration,
as evidenced by the attached specimen(s).
    `.trim(),
  });

  sections.push({
    title: 'Goods/Services Still in Use',
    content: application.goods_services.map(gs =>
      `Class ${gs.classNumber}: ${gs.description}`
    ).join('\n'),
  });

  sections.push({
    title: 'Declaration',
    content: generateSection8DeclarationText(application),
  });

  const feeBreakdown = [
    { description: 'Section 8 Declaration fee', amount: USPTO_FEES.section_8 },
  ];

  const pdfBase64 = await generatePDF({
    title: 'Section 8 Declaration of Continued Use',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'section_8_declaration',
    totalFee: USPTO_FEES.section_8,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings: [],
    readyToFile: true,
  };
}

/**
 * Generate Section 9 Renewal
 */
export async function generateSection9Renewal(
  application: TrademarkApplication
): Promise<TEASDocumentResult> {
  if (!application.registration_number) {
    throw new ValidationError('Section 9 Renewal requires a registration number');
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: 'Application for Renewal of Registration Under Section 9',
    content: `
Registration Number: ${application.registration_number}
Mark: ${application.mark_text || '[Design Mark]'}
Owner: ${application.owner_name}

The owner of the above-identified registration requests renewal of the registration
under Section 9 of the Trademark Act.
    `.trim(),
  });

  sections.push({
    title: 'Goods/Services for Renewal',
    content: application.goods_services.map(gs =>
      `Class ${gs.classNumber}: ${gs.description}`
    ).join('\n'),
  });

  sections.push({
    title: 'Declaration',
    content: generateSection9DeclarationText(application),
  });

  const feeBreakdown = [
    { description: 'Section 9 Renewal fee', amount: USPTO_FEES.section_9 },
  ];

  const pdfBase64 = await generatePDF({
    title: 'Section 9 Trademark Renewal',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'section_9_renewal',
    totalFee: USPTO_FEES.section_9,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings: [],
    readyToFile: true,
  };
}

/**
 * Generate Section 15 Declaration (Incontestability)
 */
export async function generateSection15Declaration(
  application: TrademarkApplication
): Promise<TEASDocumentResult> {
  if (!application.registration_number) {
    throw new ValidationError('Section 15 Declaration requires a registration number');
  }

  const sections: PDFSection[] = [];

  sections.push({
    title: 'Declaration of Incontestability Under Section 15',
    content: `
Registration Number: ${application.registration_number}
Mark: ${application.mark_text || '[Design Mark]'}
Owner: ${application.owner_name}

The owner of the above-identified registration declares that the mark has been in
continuous use in commerce for a consecutive period of five years after the date
of registration, and is still in use in commerce.
    `.trim(),
  });

  sections.push({
    title: 'Claim of Incontestability',
    content: `
The registrant hereby claims that the right to use the mark in commerce has become
incontestable under Section 15 of the Trademark Act based on the following:

1. There has been no final decision adverse to the registrant's claim of ownership
   of such mark for such goods or services, or to the registrant's right to register
   the same or to keep the same on the register;

2. There is no proceeding involving said rights pending in the Patent and Trademark
   Office or in a court and not finally disposed of; and

3. The mark has not become the generic name of the goods/services.
    `.trim(),
  });

  sections.push({
    title: 'Declaration',
    content: generateSection15DeclarationText(application),
  });

  const feeBreakdown = [
    { description: 'Section 15 Declaration fee', amount: USPTO_FEES.section_15 },
  ];

  const pdfBase64 = await generatePDF({
    title: 'Section 15 Declaration of Incontestability',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'section_15_declaration',
    totalFee: USPTO_FEES.section_15,
    feeBreakdown,
    generatedAt: new Date().toISOString(),
    warnings: ['Section 15 must be filed after 5 years of continuous use.'],
    readyToFile: true,
  };
}

/**
 * Generate Office Action Response
 */
export async function generateOfficeActionResponse(
  application: TrademarkApplication,
  officeActionDetails: {
    issueType: string;
    responseContent: string;
    arguments: string[];
    evidence?: string[];
  }
): Promise<TEASDocumentResult> {
  const sections: PDFSection[] = [];

  sections.push({
    title: 'Response to Office Action',
    content: `
Serial Number: ${application.serial_number || '[Required]'}
Mark: ${application.mark_text || '[Design Mark]'}
Applicant: ${application.owner_name}

This response is filed in reply to the Office Action dated [DATE].
    `.trim(),
  });

  sections.push({
    title: 'Issue Addressed',
    content: officeActionDetails.issueType,
  });

  sections.push({
    title: 'Response',
    content: officeActionDetails.responseContent,
  });

  sections.push({
    title: 'Arguments',
    content: officeActionDetails.arguments.map((arg, i) => `${i + 1}. ${arg}`).join('\n\n'),
  });

  if (officeActionDetails.evidence && officeActionDetails.evidence.length > 0) {
    sections.push({
      title: 'Evidence Submitted',
      content: officeActionDetails.evidence.map((ev, i) => `Exhibit ${i + 1}: ${ev}`).join('\n'),
    });
  }

  sections.push({
    title: 'Declaration',
    content: `
The undersigned, being hereby warned that willful false statements and the like are
punishable by fine or imprisonment, or both, under 18 U.S.C. § 1001, and that such
willful false statements may jeopardize the validity of the application or any
resulting registration, declares that all statements made of his/her own knowledge
are true, and that all statements made on information and belief are believed to be true.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
    `.trim(),
  });

  const pdfBase64 = await generatePDF({
    title: 'Office Action Response',
    sections,
  });

  return {
    pdfBase64,
    documentType: 'office_action_response',
    totalFee: 0, // No fee for response
    feeBreakdown: [],
    generatedAt: new Date().toISOString(),
    warnings: ['Office Action responses must be filed within 6 months of the issue date.'],
    readyToFile: true,
  };
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Validate application is complete for TEAS filing
 */
function validateApplicationForTEAS(
  application: TrademarkApplication,
  teasType: TEASApplicationType
): string[] {
  const errors: string[] = [];

  if (!application.mark_text && application.mark_type === 'word') {
    errors.push('Mark text is required for word marks');
  }

  if (!application.owner_name) {
    errors.push('Owner name is required');
  }

  if (!application.owner_address || !application.owner_address.street) {
    errors.push('Owner address is required');
  }

  if (!application.goods_services || application.goods_services.length === 0) {
    errors.push('At least one class of goods/services is required');
  }

  if (!application.filing_basis) {
    errors.push('Filing basis is required');
  }

  if (application.filing_basis === 'use') {
    if (!application.first_use_date) {
      errors.push('First use date is required for use-based applications');
    }
    if (!application.first_commerce_date) {
      errors.push('First commerce date is required for use-based applications');
    }
    if (!application.specimens || application.specimens.length === 0) {
      errors.push('At least one specimen is required for use-based applications');
    }
  }

  if (!application.declarations.declaration_accuracy) {
    errors.push('Accuracy declaration is required');
  }

  if (!application.declarations.signatory_name) {
    errors.push('Signatory name is required');
  }

  if (teasType === 'plus') {
    // TEAS Plus has stricter requirements
    for (const gs of application.goods_services) {
      if (gs.description && gs.description.length > 500) {
        errors.push(`Class ${gs.classNumber}: Description may be too long for TEAS Plus`);
      }
    }
  }

  return errors;
}

/**
 * Calculate filing fees
 */
function calculateFees(
  application: TrademarkApplication,
  teasType: TEASApplicationType
): { description: string; amount: number }[] {
  const fees: { description: string; amount: number }[] = [];
  const classCount = application.goods_services.length;
  const feePerClass = teasType === 'plus'
    ? USPTO_FEES.teas_plus_per_class
    : USPTO_FEES.teas_standard_per_class;

  fees.push({
    description: `TEAS ${teasType === 'plus' ? 'Plus' : 'Standard'} filing fee (${classCount} class${classCount > 1 ? 'es' : ''})`,
    amount: feePerClass * classCount,
  });

  return fees;
}

/**
 * Generate title page content
 */
function generateTitlePage(application: TrademarkApplication): string {
  return `
Application Type: Initial Trademark Application
Jurisdiction: Federal (USPTO)
Filing Method: TEAS (Trademark Electronic Application System)

Mark: ${application.mark_text || '[Design Mark - See Attached Image]'}
Mark Type: ${formatMarkType(application.mark_type)}

Applicant: ${application.owner_name}
Filing Basis: ${formatFilingBasis(application.filing_basis)}

Number of Classes: ${application.goods_services.length}

Prepared By: LegalFlow by GAS
Date: ${new Date().toLocaleDateString()}
  `.trim();
}

/**
 * Generate mark section content
 */
function generateMarkSection(application: TrademarkApplication): string {
  let content = `Mark Type: ${formatMarkType(application.mark_type)}\n\n`;

  if (application.mark_text) {
    content += `Mark Text: ${application.mark_text}\n\n`;
  }

  if (application.mark_description) {
    content += `Mark Description: ${application.mark_description}\n\n`;
  }

  if (application.mark_color_claim) {
    content += `Color Claim: ${application.mark_color_claim}\n\n`;
  }

  if (application.mark_translation) {
    content += `Translation: ${application.mark_translation}\n\n`;
  }

  if (application.mark_transliteration) {
    content += `Transliteration: ${application.mark_transliteration}\n\n`;
  }

  return content.trim();
}

/**
 * Generate applicant section content
 */
function generateApplicantSection(application: TrademarkApplication): string {
  const addr = application.owner_address;
  return `
Owner Name: ${application.owner_name}
Owner Type: ${formatOwnerType(application.owner_type)}

Address:
${addr.street}
${addr.city}, ${addr.state} ${addr.zipCode}
${addr.country || 'United States'}

${application.owner_type === 'individual' && application.owner_citizenship
    ? `Country of Citizenship: ${application.owner_citizenship}`
    : ''}
${application.owner_type !== 'individual' && application.owner_state_of_organization
    ? `State/Country of Organization: ${application.owner_state_of_organization}`
    : ''}
  `.trim();
}

/**
 * Generate goods and services section
 */
function generateGoodsServicesSection(
  application: TrademarkApplication,
  teasType: TEASApplicationType
): string {
  return application.goods_services.map(gs => `
Class ${gs.classNumber}:
Description: ${gs.description}
${gs.firstUseDate ? `First Use Date: ${gs.firstUseDate}` : ''}
${gs.firstCommerceDate ? `First Commerce Date: ${gs.firstCommerceDate}` : ''}
  `.trim()).join('\n\n');
}

/**
 * Generate filing basis section
 */
function generateBasisSection(application: TrademarkApplication): string {
  let content = `Filing Basis: ${formatFilingBasis(application.filing_basis)}\n\n`;

  switch (application.filing_basis) {
    case 'use':
      content += `Date of First Use Anywhere: ${application.first_use_date || '[Required]'}\n`;
      content += `Date of First Use in Commerce: ${application.first_commerce_date || '[Required]'}\n`;
      break;
    case 'intent_to_use':
      content += `The applicant has a bona fide intention to use the mark in commerce.\n`;
      break;
    case 'foreign_registration':
      content += `Country: ${application.foreign_registration_country || '[Required]'}\n`;
      content += `Registration Number: ${application.foreign_registration_number || '[Required]'}\n`;
      content += `Registration Date: ${application.foreign_registration_date || '[Required]'}\n`;
      break;
    case 'foreign_application':
      content += `Country: ${application.foreign_application_country || '[Required]'}\n`;
      content += `Application Number: ${application.foreign_application_number || '[Required]'}\n`;
      content += `Application Date: ${application.foreign_application_date || '[Required]'}\n`;
      break;
  }

  return content.trim();
}

/**
 * Generate specimen section
 */
function generateSpecimenSection(application: TrademarkApplication): string {
  if (application.specimens.length === 0) {
    return 'No specimens attached.';
  }

  return application.specimens.map((spec, idx) => `
Specimen ${idx + 1}:
  Type: ${spec.file_type}
  Description: ${spec.description}
  For Class: ${spec.class_number}
  File: ${spec.file_url}
  `.trim()).join('\n\n');
}

/**
 * Generate declaration section
 */
function generateDeclarationSection(application: TrademarkApplication): string {
  return `
The undersigned, being hereby warned that willful false statements and the like so made
are punishable by fine or imprisonment, or both, under 18 U.S.C. Section 1001, and that
such willful false statements, and the like, may jeopardize the validity of the application
or any resulting registration, declares that he/she is properly authorized to execute this
application on behalf of the applicant; he/she believes the applicant to be the owner of
the trademark/service mark sought to be registered; to the best of his/her knowledge and
belief no other person, firm, corporation, or association has the right to use the mark
in commerce, either in the identical form thereof or in such near resemblance thereto
as to be likely, when used on or in connection with the goods/services of such other person,
to cause confusion, or to cause mistake, or to deceive; and that all statements made of
his/her own knowledge are true and that all statements made on information and belief
are believed to be true.

${application.filing_basis === 'use' ? `
The signatory believes that the applicant is the owner of the trademark/service mark
sought to be registered, that the mark is in use in commerce, and that the specimen(s)
shows the mark as used on or in connection with the goods/services.
` : ''}

${application.filing_basis === 'intent_to_use' ? `
The signatory has a bona fide intention to use the mark in commerce on or in connection
with the identified goods/services.
` : ''}

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${application.declarations.signature_date || new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
${application.declarations.signatory_title ? `Title: ${application.declarations.signatory_title}` : ''}
  `.trim();
}

/**
 * Generate fee section
 */
function generateFeeSection(fees: { description: string; amount: number }[]): string {
  const total = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const feeList = fees.map(fee => `${fee.description}: $${fee.amount.toFixed(2)}`).join('\n');

  return `
${feeList}

TOTAL FEE: $${total.toFixed(2)}

Payment must be made at the time of filing through the USPTO TEAS system.
Accepted payment methods: Credit card, deposit account, or EFT.
  `.trim();
}

/**
 * Generate filing instructions
 */
function generateFilingInstructions(teasType: TEASApplicationType): string {
  return `
FILING INSTRUCTIONS

This document has been prepared for filing through the USPTO TEAS system.

Steps to file:
1. Go to https://www.uspto.gov/trademarks/apply
2. Select "TEAS ${teasType === 'plus' ? 'Plus' : 'Standard'}" application
3. Enter the information exactly as shown in this document
4. Upload any required specimen files
5. Pay the required filing fee
6. Submit the application and save your confirmation number

Important Notes:
- Keep a copy of this document and your filing confirmation
- You will receive a serial number within 24-48 hours
- Monitor your application status at TSDR (Trademark Status & Document Retrieval)
- Respond to any Office Actions within 6 months of issue date

For questions, contact the Trademark Assistance Center: 1-800-786-9199
  `.trim();
}

// Declaration generators
function generateSOUDeclaration(application: TrademarkApplication): string {
  return `
The undersigned, being hereby warned that willful false statements and the like so made
are punishable by fine or imprisonment, or both, under 18 U.S.C. Section 1001, and that
such willful false statements may jeopardify the validity of the application or any resulting
registration, declares that:

1. The mark is now in use in commerce;
2. The specimen shows the mark as used on or in connection with the goods/services; and
3. All statements made of his/her own knowledge are true and all statements made on
   information and belief are believed to be true.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
  `.trim();
}

function generateSection8DeclarationText(application: TrademarkApplication): string {
  return `
The undersigned declares that the mark is in use in commerce and that the specimen(s)
submitted herewith show the mark as used on or in connection with the goods/services.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
  `.trim();
}

function generateSection9DeclarationText(application: TrademarkApplication): string {
  return `
The owner requests that the registration be renewed for the goods/services identified above.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
  `.trim();
}

function generateSection15DeclarationText(application: TrademarkApplication): string {
  return `
The undersigned declares that the mark has been in continuous use in commerce for a
period of at least five consecutive years after the date of registration and is still
in use in commerce, and that there has been no final decision adverse to the owner's
claim of ownership, and that there is no proceeding pending in the Patent and Trademark
Office or in a court and not finally disposed of.

Signature: ${application.declarations.electronic_signature || '/_________________/'}
Date: ${new Date().toISOString().split('T')[0]}
Name: ${application.declarations.signatory_name}
  `.trim();
}

// Formatting helpers
function formatMarkType(type: string): string {
  const types: Record<string, string> = {
    word: 'Standard Character (Word) Mark',
    design: 'Design Mark',
    combined: 'Combined Word and Design Mark',
    sound: 'Sound Mark',
    motion: 'Motion Mark',
    color: 'Color Mark',
    scent: 'Scent Mark',
    other: 'Other Mark Type',
  };
  return types[type] || type;
}

function formatFilingBasis(basis: string): string {
  const bases: Record<string, string> = {
    use: 'Section 1(a) - Use in Commerce',
    intent_to_use: 'Section 1(b) - Intent to Use',
    foreign_registration: 'Section 44(e) - Foreign Registration',
    foreign_application: 'Section 44(d) - Foreign Application',
  };
  return bases[basis] || basis;
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

export default {
  generateTEASApplication,
  generateStatementOfUse,
  generateExtensionRequest,
  generateSection8Declaration,
  generateSection9Renewal,
  generateSection15Declaration,
  generateOfficeActionResponse,
  USPTO_FEES,
};
