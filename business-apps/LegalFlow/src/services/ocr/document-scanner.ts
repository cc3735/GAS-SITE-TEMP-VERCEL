/**
 * Tax Document OCR Scanner Service
 *
 * @module services/ocr/document-scanner
 * @description Provides OCR (Optical Character Recognition) capabilities for tax documents
 * including W-2, 1099 forms, and other tax-related documents. Uses Google Cloud Vision API
 * for text extraction and custom parsing logic for structured data extraction.
 *
 * @features
 * - W-2 form scanning and data extraction
 * - 1099 form variants (INT, DIV, MISC, NEC, G, R, SSA) scanning
 * - 1098 mortgage interest statement scanning
 * - PDF and image file support (JPEG, PNG, WebP, TIFF)
 * - AI-enhanced data validation and correction suggestions
 * - Confidence scoring for extracted data
 * - Automatic form type detection
 *
 * @requires @google-cloud/vision - Google Cloud Vision API client
 * @requires openai - OpenAI API for AI-enhanced data validation
 *
 * @example
 * ```typescript
 * import { TaxDocumentScanner } from './document-scanner';
 *
 * const scanner = new TaxDocumentScanner();
 * const result = await scanner.scanDocument(fileBuffer, 'image/jpeg');
 *
 * if (result.success) {
 *   console.log('Detected form type:', result.formType);
 *   console.log('Extracted data:', result.data);
 * }
 * ```
 *
 * @version 1.0.0
 * @since 2026-01-12
 */

import vision from '@google-cloud/vision';
import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported tax document types that can be scanned and parsed
 */
export type TaxDocumentType =
  | 'w2'           // Wage and Tax Statement
  | '1099_int'     // Interest Income
  | '1099_div'     // Dividends and Distributions
  | '1099_misc'    // Miscellaneous Income
  | '1099_nec'     // Nonemployee Compensation
  | '1099_g'       // Government Payments
  | '1099_r'       // Retirement Distributions
  | '1099_ssa'     // Social Security Benefits
  | '1098'         // Mortgage Interest Statement
  | '1098_e'       // Student Loan Interest
  | '1098_t'       // Tuition Statement
  | 'unknown';

/**
 * Supported file MIME types for document scanning
 */
export type SupportedMimeType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/tiff'
  | 'application/pdf';

/**
 * W-2 Form extracted data structure
 * Corresponds to IRS Form W-2 fields
 */
export interface W2ExtractedData {
  /** Box a: Employee's Social Security Number (masked for security) */
  employeeSsn?: string;
  /** Box b: Employer Identification Number */
  employerEin?: string;
  /** Box c: Employer's name, address, and ZIP code */
  employerName?: string;
  employerAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  /** Box d: Control number (optional) */
  controlNumber?: string;
  /** Box e & f: Employee's name and address */
  employeeName?: string;
  employeeAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  /** Box 1: Wages, tips, other compensation */
  wagesTipsOther?: number;
  /** Box 2: Federal income tax withheld */
  federalWithheld?: number;
  /** Box 3: Social Security wages */
  socialSecurityWages?: number;
  /** Box 4: Social Security tax withheld */
  socialSecurityWithheld?: number;
  /** Box 5: Medicare wages and tips */
  medicareWages?: number;
  /** Box 6: Medicare tax withheld */
  medicareWithheld?: number;
  /** Box 7: Social Security tips */
  socialSecurityTips?: number;
  /** Box 8: Allocated tips */
  allocatedTips?: number;
  /** Box 10: Dependent care benefits */
  dependentCareBenefits?: number;
  /** Box 11: Nonqualified plans */
  nonqualifiedPlans?: number;
  /** Box 12a-d: Various codes and amounts */
  box12?: Array<{ code: string; amount: number }>;
  /** Box 13: Statutory employee, Retirement plan, Third-party sick pay */
  statutoryEmployee?: boolean;
  retirementPlan?: boolean;
  thirdPartySickPay?: boolean;
  /** Box 14: Other (freeform) */
  otherInfo?: string;
  /** Box 15: State and employer's state ID */
  stateInfo?: Array<{
    state?: string;
    employerStateId?: string;
    stateWages?: number;
    stateWithheld?: number;
    localWages?: number;
    localWithheld?: number;
    localityName?: string;
  }>;
  /** Tax year from the form */
  taxYear?: number;
}

/**
 * 1099-INT Form extracted data structure
 * Corresponds to IRS Form 1099-INT fields
 */
export interface Form1099IntExtractedData {
  /** Payer's name and address */
  payerName?: string;
  payerAddress?: string;
  /** Payer's TIN (EIN or SSN) */
  payerTin?: string;
  /** Recipient's TIN */
  recipientTin?: string;
  /** Recipient's name and address */
  recipientName?: string;
  recipientAddress?: string;
  /** Box 1: Interest income */
  interestIncome?: number;
  /** Box 2: Early withdrawal penalty */
  earlyWithdrawalPenalty?: number;
  /** Box 3: Interest on U.S. Savings Bonds and Treasury obligations */
  usSavingsBondsInterest?: number;
  /** Box 4: Federal income tax withheld */
  federalWithheld?: number;
  /** Box 5: Investment expenses */
  investmentExpenses?: number;
  /** Box 6: Foreign tax paid */
  foreignTaxPaid?: number;
  /** Box 8: Tax-exempt interest */
  taxExemptInterest?: number;
  /** Box 9: Specified private activity bond interest */
  privateActivityBondInterest?: number;
  /** Tax year */
  taxYear?: number;
}

/**
 * 1099-DIV Form extracted data structure
 * Corresponds to IRS Form 1099-DIV fields
 */
export interface Form1099DivExtractedData {
  payerName?: string;
  payerTin?: string;
  recipientName?: string;
  recipientTin?: string;
  /** Box 1a: Total ordinary dividends */
  ordinaryDividends?: number;
  /** Box 1b: Qualified dividends */
  qualifiedDividends?: number;
  /** Box 2a: Total capital gain distributions */
  capitalGainDistributions?: number;
  /** Box 2b: Unrecaptured Section 1250 gain */
  unrecapturedSection1250Gain?: number;
  /** Box 2c: Section 1202 gain */
  section1202Gain?: number;
  /** Box 2d: Collectibles (28%) gain */
  collectiblesGain?: number;
  /** Box 3: Nondividend distributions */
  nondividendDistributions?: number;
  /** Box 4: Federal income tax withheld */
  federalWithheld?: number;
  /** Box 5: Section 199A dividends */
  section199ADividends?: number;
  /** Box 6: Investment expenses */
  investmentExpenses?: number;
  /** Box 7: Foreign tax paid */
  foreignTaxPaid?: number;
  taxYear?: number;
}

/**
 * 1099-NEC Form extracted data structure
 * Corresponds to IRS Form 1099-NEC fields
 */
export interface Form1099NecExtractedData {
  payerName?: string;
  payerAddress?: string;
  payerTin?: string;
  recipientName?: string;
  recipientAddress?: string;
  recipientTin?: string;
  /** Box 1: Nonemployee compensation */
  nonemployeeCompensation?: number;
  /** Box 4: Federal income tax withheld */
  federalWithheld?: number;
  /** State tax information */
  stateInfo?: Array<{
    state?: string;
    stateTaxWithheld?: number;
    statePayerIdNumber?: string;
    stateIncome?: number;
  }>;
  taxYear?: number;
}

/**
 * 1099-MISC Form extracted data structure
 */
export interface Form1099MiscExtractedData {
  payerName?: string;
  payerTin?: string;
  recipientName?: string;
  recipientTin?: string;
  /** Box 1: Rents */
  rents?: number;
  /** Box 2: Royalties */
  royalties?: number;
  /** Box 3: Other income */
  otherIncome?: number;
  /** Box 4: Federal income tax withheld */
  federalWithheld?: number;
  /** Box 5: Fishing boat proceeds */
  fishingBoatProceeds?: number;
  /** Box 6: Medical and health care payments */
  medicalPayments?: number;
  /** Box 10: Crop insurance proceeds */
  cropInsuranceProceeds?: number;
  taxYear?: number;
}

/**
 * 1098 Mortgage Interest Statement extracted data
 */
export interface Form1098ExtractedData {
  lenderName?: string;
  lenderAddress?: string;
  lenderTin?: string;
  borrowerName?: string;
  borrowerAddress?: string;
  borrowerTin?: string;
  /** Box 1: Mortgage interest received */
  mortgageInterest?: number;
  /** Box 2: Outstanding mortgage principal */
  outstandingPrincipal?: number;
  /** Box 3: Mortgage origination date */
  originationDate?: string;
  /** Box 4: Refund of overpaid interest */
  refundOfOverpaidInterest?: number;
  /** Box 5: Mortgage insurance premiums */
  mortgageInsurancePremiums?: number;
  /** Box 6: Points paid on purchase */
  pointsPaid?: number;
  /** Property address */
  propertyAddress?: string;
  taxYear?: number;
}

/**
 * Generic extracted data type union
 */
export type ExtractedData =
  | W2ExtractedData
  | Form1099IntExtractedData
  | Form1099DivExtractedData
  | Form1099NecExtractedData
  | Form1099MiscExtractedData
  | Form1098ExtractedData
  | Record<string, unknown>;

/**
 * Individual field confidence score
 */
export interface FieldConfidence {
  field: string;
  value: unknown;
  confidence: number;
  suggestedCorrection?: unknown;
  needsReview: boolean;
}

/**
 * OCR scan result structure
 */
export interface ScanResult {
  /** Whether the scan was successful */
  success: boolean;
  /** Error message if scan failed */
  error?: string;
  /** Detected document type */
  formType: TaxDocumentType;
  /** Confidence in form type detection (0-1) */
  formTypeConfidence: number;
  /** Extracted structured data */
  data: ExtractedData;
  /** Raw OCR text output */
  rawText: string;
  /** Field-level confidence scores */
  fieldConfidences: FieldConfidence[];
  /** Overall confidence score (0-1) */
  overallConfidence: number;
  /** Fields that need manual review */
  fieldsNeedingReview: string[];
  /** AI-generated suggestions for correction */
  suggestions: string[];
  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    documentLanguage: string;
    pageCount: number;
  };
}

// ============================================================================
// Tax Document Scanner Class
// ============================================================================

/**
 * Tax Document Scanner Service
 *
 * Provides OCR capabilities for scanning and extracting data from tax documents.
 * Uses Google Cloud Vision API for text extraction and OpenAI for intelligent
 * data parsing and validation.
 */
export class TaxDocumentScanner {
  private visionClient: vision.ImageAnnotatorClient | null = null;
  private openaiClient: OpenAI | null = null;
  private initialized: boolean = false;

  /**
   * Creates a new TaxDocumentScanner instance
   *
   * @param options - Configuration options
   * @param options.googleKeyFile - Path to Google Cloud service account key file
   * @param options.openaiApiKey - OpenAI API key for AI-enhanced parsing
   */
  constructor(options?: {
    googleKeyFile?: string;
    openaiApiKey?: string;
  }) {
    // Initialize Google Cloud Vision client
    try {
      const keyFile = options?.googleKeyFile || process.env.GOOGLE_CLOUD_KEY_FILE;
      if (keyFile) {
        this.visionClient = new vision.ImageAnnotatorClient({
          keyFilename: keyFile,
        });
      } else if (process.env.GOOGLE_CLOUD_CREDENTIALS) {
        // Support inline credentials
        this.visionClient = new vision.ImageAnnotatorClient({
          credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
        });
      }
      logger.info('Google Cloud Vision client initialized');
    } catch (error) {
      logger.warn('Failed to initialize Google Cloud Vision client:', error);
    }

    // Initialize OpenAI client
    try {
      const apiKey = options?.openaiApiKey || config.openai.apiKey;
      if (apiKey) {
        this.openaiClient = new OpenAI({ apiKey });
        logger.info('OpenAI client initialized for document parsing');
      }
    } catch (error) {
      logger.warn('Failed to initialize OpenAI client:', error);
    }

    this.initialized = this.visionClient !== null;
  }

  /**
   * Checks if the scanner is properly initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Scans a tax document and extracts structured data
   *
   * @param fileBuffer - The document file as a Buffer
   * @param mimeType - The MIME type of the document
   * @returns Promise resolving to scan results
   *
   * @example
   * ```typescript
   * const scanner = new TaxDocumentScanner();
   * const buffer = fs.readFileSync('w2-form.pdf');
   * const result = await scanner.scanDocument(buffer, 'application/pdf');
   * ```
   */
  public async scanDocument(
    fileBuffer: Buffer,
    mimeType: SupportedMimeType
  ): Promise<ScanResult> {
    const startTime = Date.now();
    logger.info(`Starting document scan, mimeType: ${mimeType}, size: ${fileBuffer.length} bytes`);

    // Default error result
    const errorResult = (error: string): ScanResult => ({
      success: false,
      error,
      formType: 'unknown',
      formTypeConfidence: 0,
      data: {},
      rawText: '',
      fieldConfidences: [],
      overallConfidence: 0,
      fieldsNeedingReview: [],
      suggestions: [],
      metadata: {
        processingTimeMs: Date.now() - startTime,
        documentLanguage: 'en',
        pageCount: 0,
      },
    });

    if (!this.visionClient) {
      return errorResult('OCR service not initialized. Please configure Google Cloud Vision API.');
    }

    try {
      // Perform OCR based on document type
      let rawText: string;
      let pageCount = 1;

      if (mimeType === 'application/pdf') {
        const ocrResult = await this.processPdf(fileBuffer);
        rawText = ocrResult.text;
        pageCount = ocrResult.pageCount;
      } else {
        rawText = await this.processImage(fileBuffer);
      }

      if (!rawText || rawText.trim().length === 0) {
        return errorResult('No text could be extracted from the document. Please ensure the document is clear and readable.');
      }

      // Detect form type
      const { formType, confidence: formTypeConfidence } = this.detectFormType(rawText);
      logger.info(`Detected form type: ${formType} (confidence: ${formTypeConfidence})`);

      // Extract structured data based on form type
      const { data, fieldConfidences } = await this.extractData(rawText, formType);

      // Identify fields needing review
      const fieldsNeedingReview = fieldConfidences
        .filter(f => f.needsReview)
        .map(f => f.field);

      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(fieldConfidences, formTypeConfidence);

      // Generate AI suggestions if available
      const suggestions = await this.generateSuggestions(rawText, formType, data, fieldConfidences);

      const result: ScanResult = {
        success: true,
        formType,
        formTypeConfidence,
        data,
        rawText,
        fieldConfidences,
        overallConfidence,
        fieldsNeedingReview,
        suggestions,
        metadata: {
          processingTimeMs: Date.now() - startTime,
          documentLanguage: 'en',
          pageCount,
        },
      };

      logger.info(`Document scan completed in ${result.metadata.processingTimeMs}ms, confidence: ${overallConfidence}`);
      return result;

    } catch (error) {
      logger.error('Document scan failed:', error);
      return errorResult(error instanceof Error ? error.message : 'Unknown error during document scanning');
    }
  }

  /**
   * Process an image file with Google Cloud Vision
   */
  private async processImage(imageBuffer: Buffer): Promise<string> {
    if (!this.visionClient) throw new Error('Vision client not initialized');

    const [result] = await this.visionClient.textDetection({
      image: { content: imageBuffer.toString('base64') },
    });

    return result.fullTextAnnotation?.text || '';
  }

  /**
   * Process a PDF file with Google Cloud Vision
   */
  private async processPdf(pdfBuffer: Buffer): Promise<{ text: string; pageCount: number }> {
    if (!this.visionClient) throw new Error('Vision client not initialized');

    const [result] = await this.visionClient.documentTextDetection({
      image: { content: pdfBuffer.toString('base64') },
    });

    const pageCount = result.fullTextAnnotation?.pages?.length || 1;
    const text = result.fullTextAnnotation?.text || '';

    return { text, pageCount };
  }

  /**
   * Detect the type of tax form from OCR text
   */
  private detectFormType(text: string): { formType: TaxDocumentType; confidence: number } {
    const upperText = text.toUpperCase();

    // Form detection patterns with confidence weights
    const patterns: Array<{ type: TaxDocumentType; patterns: RegExp[]; weight: number }> = [
      {
        type: 'w2',
        patterns: [
          /WAGE AND TAX STATEMENT/i,
          /FORM\s*W-?2\b/i,
          /EMPLOYER('S)?\s+IDENTIFICATION\s+NUMBER/i,
          /WAGES,?\s*TIPS,?\s*(OTHER|AND)\s*COMPENSATION/i,
          /FEDERAL\s+INCOME\s+TAX\s+WITHHELD/i,
          /SOCIAL\s+SECURITY\s+WAGES/i,
        ],
        weight: 1.0,
      },
      {
        type: '1099_int',
        patterns: [
          /1099-INT/i,
          /INTEREST\s+INCOME/i,
          /FORM\s*1099.*INT/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_div',
        patterns: [
          /1099-DIV/i,
          /DIVIDENDS\s+AND\s+DISTRIBUTIONS/i,
          /FORM\s*1099.*DIV/i,
          /ORDINARY\s+DIVIDENDS/i,
          /QUALIFIED\s+DIVIDENDS/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_nec',
        patterns: [
          /1099-NEC/i,
          /NONEMPLOYEE\s+COMPENSATION/i,
          /FORM\s*1099.*NEC/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_misc',
        patterns: [
          /1099-MISC/i,
          /MISCELLANEOUS\s+INCOME/i,
          /FORM\s*1099.*MISC/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_g',
        patterns: [
          /1099-G/i,
          /CERTAIN\s+GOVERNMENT\s+PAYMENTS/i,
          /UNEMPLOYMENT\s+COMPENSATION/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_r',
        patterns: [
          /1099-R/i,
          /DISTRIBUTIONS\s+FROM\s+PENSIONS/i,
          /RETIREMENT\s+.*DISTRIBUTIONS/i,
        ],
        weight: 0.9,
      },
      {
        type: '1099_ssa',
        patterns: [
          /SSA-1099/i,
          /SOCIAL\s+SECURITY\s+BENEFIT\s+STATEMENT/i,
        ],
        weight: 0.9,
      },
      {
        type: '1098',
        patterns: [
          /1098\b/i,
          /MORTGAGE\s+INTEREST\s+STATEMENT/i,
          /MORTGAGE\s+INTEREST\s+RECEIVED/i,
        ],
        weight: 0.9,
      },
      {
        type: '1098_e',
        patterns: [
          /1098-E/i,
          /STUDENT\s+LOAN\s+INTEREST/i,
        ],
        weight: 0.9,
      },
      {
        type: '1098_t',
        patterns: [
          /1098-T/i,
          /TUITION\s+STATEMENT/i,
          /QUALIFIED\s+TUITION/i,
        ],
        weight: 0.9,
      },
    ];

    let bestMatch: TaxDocumentType = 'unknown';
    let bestScore = 0;

    for (const { type, patterns, weight } of patterns) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (pattern.test(upperText)) {
          matchCount++;
        }
      }
      const score = (matchCount / patterns.length) * weight;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
      }
    }

    // Minimum confidence threshold
    const confidence = Math.min(bestScore * 1.2, 1.0);
    if (confidence < 0.3) {
      return { formType: 'unknown', confidence: 0 };
    }

    return { formType: bestMatch, confidence };
  }

  /**
   * Extract structured data from OCR text based on form type
   */
  private async extractData(
    text: string,
    formType: TaxDocumentType
  ): Promise<{ data: ExtractedData; fieldConfidences: FieldConfidence[] }> {
    switch (formType) {
      case 'w2':
        return this.extractW2Data(text);
      case '1099_int':
        return this.extract1099IntData(text);
      case '1099_div':
        return this.extract1099DivData(text);
      case '1099_nec':
        return this.extract1099NecData(text);
      case '1099_misc':
        return this.extract1099MiscData(text);
      case '1098':
        return this.extract1098Data(text);
      default:
        return this.extractGenericData(text);
    }
  }

  /**
   * Extract W-2 data from OCR text
   */
  private extractW2Data(text: string): { data: W2ExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: W2ExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    // Helper function to add field with confidence
    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Extract EIN (pattern: XX-XXXXXXX)
    const einMatch = text.match(/\b(\d{2})-?(\d{7})\b/);
    if (einMatch) {
      data.employerEin = `${einMatch[1]}-${einMatch[2]}`;
      addField('employerEin', data.employerEin, 0.9);
    }

    // Extract tax year
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      data.taxYear = parseInt(yearMatch[1], 10);
      addField('taxYear', data.taxYear, 0.85);
    }

    // Extract wages (Box 1)
    const wagesPatterns = [
      /WAGES[,\s]+TIPS[,\s]+(?:OTHER|AND)\s+COMPENSATION[:\s]*\$?([\d,]+\.?\d*)/i,
      /(?:BOX\s*)?1[:\s]+\$?([\d,]+\.?\d*)/i,
      /(?:1\s+)?(?:WAGES)[:\s]*\$?([\d,]+\.?\d*)/i,
    ];
    for (const pattern of wagesPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.wagesTipsOther = this.parseAmount(match[1]);
        addField('wagesTipsOther', data.wagesTipsOther, 0.85);
        break;
      }
    }

    // Extract federal withheld (Box 2)
    const fedWithheldPatterns = [
      /FEDERAL\s+INCOME\s+TAX\s+WITHHELD[:\s]*\$?([\d,]+\.?\d*)/i,
      /(?:BOX\s*)?2[:\s]+\$?([\d,]+\.?\d*)/i,
    ];
    for (const pattern of fedWithheldPatterns) {
      const match = text.match(pattern);
      if (match) {
        data.federalWithheld = this.parseAmount(match[1]);
        addField('federalWithheld', data.federalWithheld, 0.85);
        break;
      }
    }

    // Extract Social Security wages (Box 3)
    const ssWagesMatch = text.match(/SOCIAL\s+SECURITY\s+WAGES[:\s]*\$?([\d,]+\.?\d*)/i);
    if (ssWagesMatch) {
      data.socialSecurityWages = this.parseAmount(ssWagesMatch[1]);
      addField('socialSecurityWages', data.socialSecurityWages, 0.85);
    }

    // Extract Social Security withheld (Box 4)
    const ssWithheldMatch = text.match(/SOCIAL\s+SECURITY\s+TAX\s+WITHHELD[:\s]*\$?([\d,]+\.?\d*)/i);
    if (ssWithheldMatch) {
      data.socialSecurityWithheld = this.parseAmount(ssWithheldMatch[1]);
      addField('socialSecurityWithheld', data.socialSecurityWithheld, 0.85);
    }

    // Extract Medicare wages (Box 5)
    const medWagesMatch = text.match(/MEDICARE\s+WAGES\s+(?:AND\s+TIPS)?[:\s]*\$?([\d,]+\.?\d*)/i);
    if (medWagesMatch) {
      data.medicareWages = this.parseAmount(medWagesMatch[1]);
      addField('medicareWages', data.medicareWages, 0.85);
    }

    // Extract Medicare withheld (Box 6)
    const medWithheldMatch = text.match(/MEDICARE\s+TAX\s+WITHHELD[:\s]*\$?([\d,]+\.?\d*)/i);
    if (medWithheldMatch) {
      data.medicareWithheld = this.parseAmount(medWithheldMatch[1]);
      addField('medicareWithheld', data.medicareWithheld, 0.85);
    }

    // Try to extract employer name (usually first prominent text)
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    // Look for employer name after EIN or in first few lines
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i];
      // Skip if line looks like a form title or number
      if (line.match(/W-2|STATEMENT|FORM|20\d{2}|^\d+$/i)) continue;
      // If line looks like a company name (mix of letters, possibly with Inc, LLC, etc.)
      if (line.match(/^[A-Z][A-Za-z\s&.,'-]+(?:INC|LLC|CORP|CO|COMPANY)?\.?$/i)) {
        data.employerName = line;
        addField('employerName', data.employerName, 0.7, true); // Lower confidence, needs review
        break;
      }
    }

    // Add fields that might be missing
    if (!data.wagesTipsOther) addField('wagesTipsOther', null, 0, true);
    if (!data.federalWithheld) addField('federalWithheld', null, 0, true);
    if (!data.employerEin) addField('employerEin', null, 0, true);

    return { data, fieldConfidences };
  }

  /**
   * Extract 1099-INT data
   */
  private extract1099IntData(text: string): { data: Form1099IntExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: Form1099IntExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Interest income (Box 1)
    const interestMatch = text.match(/INTEREST\s+INCOME[:\s]*\$?([\d,]+\.?\d*)/i);
    if (interestMatch) {
      data.interestIncome = this.parseAmount(interestMatch[1]);
      addField('interestIncome', data.interestIncome, 0.85);
    }

    // Federal withheld (Box 4)
    const fedWithheldMatch = text.match(/FEDERAL\s+(?:INCOME\s+)?TAX\s+WITHHELD[:\s]*\$?([\d,]+\.?\d*)/i);
    if (fedWithheldMatch) {
      data.federalWithheld = this.parseAmount(fedWithheldMatch[1]);
      addField('federalWithheld', data.federalWithheld, 0.85);
    }

    // Tax year
    const yearMatch = text.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      data.taxYear = parseInt(yearMatch[1], 10);
      addField('taxYear', data.taxYear, 0.85);
    }

    return { data, fieldConfidences };
  }

  /**
   * Extract 1099-DIV data
   */
  private extract1099DivData(text: string): { data: Form1099DivExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: Form1099DivExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Ordinary dividends (Box 1a)
    const ordinaryMatch = text.match(/(?:TOTAL\s+)?ORDINARY\s+DIVIDENDS[:\s]*\$?([\d,]+\.?\d*)/i);
    if (ordinaryMatch) {
      data.ordinaryDividends = this.parseAmount(ordinaryMatch[1]);
      addField('ordinaryDividends', data.ordinaryDividends, 0.85);
    }

    // Qualified dividends (Box 1b)
    const qualifiedMatch = text.match(/QUALIFIED\s+DIVIDENDS[:\s]*\$?([\d,]+\.?\d*)/i);
    if (qualifiedMatch) {
      data.qualifiedDividends = this.parseAmount(qualifiedMatch[1]);
      addField('qualifiedDividends', data.qualifiedDividends, 0.85);
    }

    // Capital gain distributions (Box 2a)
    const capitalMatch = text.match(/(?:TOTAL\s+)?CAPITAL\s+GAIN\s+DIST[:\s]*\$?([\d,]+\.?\d*)/i);
    if (capitalMatch) {
      data.capitalGainDistributions = this.parseAmount(capitalMatch[1]);
      addField('capitalGainDistributions', data.capitalGainDistributions, 0.85);
    }

    return { data, fieldConfidences };
  }

  /**
   * Extract 1099-NEC data
   */
  private extract1099NecData(text: string): { data: Form1099NecExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: Form1099NecExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Nonemployee compensation (Box 1)
    const necMatch = text.match(/NONEMPLOYEE\s+COMPENSATION[:\s]*\$?([\d,]+\.?\d*)/i);
    if (necMatch) {
      data.nonemployeeCompensation = this.parseAmount(necMatch[1]);
      addField('nonemployeeCompensation', data.nonemployeeCompensation, 0.85);
    }

    // Federal withheld (Box 4)
    const fedWithheldMatch = text.match(/FEDERAL\s+(?:INCOME\s+)?TAX\s+WITHHELD[:\s]*\$?([\d,]+\.?\d*)/i);
    if (fedWithheldMatch) {
      data.federalWithheld = this.parseAmount(fedWithheldMatch[1]);
      addField('federalWithheld', data.federalWithheld, 0.85);
    }

    return { data, fieldConfidences };
  }

  /**
   * Extract 1099-MISC data
   */
  private extract1099MiscData(text: string): { data: Form1099MiscExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: Form1099MiscExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Rents (Box 1)
    const rentsMatch = text.match(/RENTS[:\s]*\$?([\d,]+\.?\d*)/i);
    if (rentsMatch) {
      data.rents = this.parseAmount(rentsMatch[1]);
      addField('rents', data.rents, 0.85);
    }

    // Royalties (Box 2)
    const royaltiesMatch = text.match(/ROYALTIES[:\s]*\$?([\d,]+\.?\d*)/i);
    if (royaltiesMatch) {
      data.royalties = this.parseAmount(royaltiesMatch[1]);
      addField('royalties', data.royalties, 0.85);
    }

    // Other income (Box 3)
    const otherMatch = text.match(/OTHER\s+INCOME[:\s]*\$?([\d,]+\.?\d*)/i);
    if (otherMatch) {
      data.otherIncome = this.parseAmount(otherMatch[1]);
      addField('otherIncome', data.otherIncome, 0.85);
    }

    return { data, fieldConfidences };
  }

  /**
   * Extract 1098 mortgage interest data
   */
  private extract1098Data(text: string): { data: Form1098ExtractedData; fieldConfidences: FieldConfidence[] } {
    const data: Form1098ExtractedData = {};
    const fieldConfidences: FieldConfidence[] = [];

    const addField = (field: string, value: unknown, confidence: number, needsReview: boolean = false) => {
      fieldConfidences.push({ field, value, confidence, needsReview });
    };

    // Mortgage interest (Box 1)
    const interestMatch = text.match(/MORTGAGE\s+INTEREST\s+(?:RECEIVED)?[:\s]*\$?([\d,]+\.?\d*)/i);
    if (interestMatch) {
      data.mortgageInterest = this.parseAmount(interestMatch[1]);
      addField('mortgageInterest', data.mortgageInterest, 0.85);
    }

    // Outstanding principal (Box 2)
    const principalMatch = text.match(/(?:OUTSTANDING\s+)?(?:MORTGAGE\s+)?PRINCIPAL[:\s]*\$?([\d,]+\.?\d*)/i);
    if (principalMatch) {
      data.outstandingPrincipal = this.parseAmount(principalMatch[1]);
      addField('outstandingPrincipal', data.outstandingPrincipal, 0.85);
    }

    // Points paid (Box 6)
    const pointsMatch = text.match(/POINTS\s+(?:PAID)?[:\s]*\$?([\d,]+\.?\d*)/i);
    if (pointsMatch) {
      data.pointsPaid = this.parseAmount(pointsMatch[1]);
      addField('pointsPaid', data.pointsPaid, 0.85);
    }

    return { data, fieldConfidences };
  }

  /**
   * Extract generic data for unknown form types
   */
  private extractGenericData(text: string): { data: Record<string, unknown>; fieldConfidences: FieldConfidence[] } {
    const data: Record<string, unknown> = {};
    const fieldConfidences: FieldConfidence[] = [];

    // Try to extract any monetary amounts
    const amountMatches = text.matchAll(/\$\s*([\d,]+\.?\d*)/g);
    const amounts: number[] = [];
    for (const match of amountMatches) {
      amounts.push(this.parseAmount(match[1]));
    }
    if (amounts.length > 0) {
      data.extractedAmounts = amounts;
      fieldConfidences.push({
        field: 'extractedAmounts',
        value: amounts,
        confidence: 0.5,
        needsReview: true,
      });
    }

    // Try to extract any EINs or SSNs (partially masked)
    const tinMatches = text.matchAll(/\b(\d{2})-?(\d{7})\b/g);
    const tins: string[] = [];
    for (const match of tinMatches) {
      tins.push(`${match[1]}-${match[2]}`);
    }
    if (tins.length > 0) {
      data.extractedTins = tins;
      fieldConfidences.push({
        field: 'extractedTins',
        value: tins,
        confidence: 0.6,
        needsReview: true,
      });
    }

    return { data, fieldConfidences };
  }

  /**
   * Parse a string amount to number
   */
  private parseAmount(amountStr: string): number {
    if (!amountStr) return 0;
    const cleaned = amountStr.replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(fieldConfidences: FieldConfidence[], formTypeConfidence: number): number {
    if (fieldConfidences.length === 0) {
      return formTypeConfidence * 0.5;
    }

    const avgFieldConfidence = fieldConfidences.reduce((sum, f) => sum + f.confidence, 0) / fieldConfidences.length;
    const reviewPenalty = fieldConfidences.filter(f => f.needsReview).length / fieldConfidences.length;

    return Math.round((formTypeConfidence * 0.3 + avgFieldConfidence * 0.7 - reviewPenalty * 0.2) * 100) / 100;
  }

  /**
   * Generate AI suggestions for data corrections
   */
  private async generateSuggestions(
    rawText: string,
    formType: TaxDocumentType,
    data: ExtractedData,
    fieldConfidences: FieldConfidence[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Add basic validation suggestions
    const fieldsNeedingReview = fieldConfidences.filter(f => f.needsReview);
    if (fieldsNeedingReview.length > 0) {
      suggestions.push(`Please review the following fields that may need correction: ${fieldsNeedingReview.map(f => f.field).join(', ')}`);
    }

    // If OpenAI is available, get AI suggestions
    if (this.openaiClient && formType !== 'unknown') {
      try {
        const completion = await this.openaiClient.chat.completions.create({
          model: config.openai.model,
          messages: [
            {
              role: 'system',
              content: `You are a tax document validation assistant. Review the extracted data from a ${formType.toUpperCase()} form and provide brief validation suggestions. Focus on common errors and missing critical fields. Be concise - max 3 suggestions.`,
            },
            {
              role: 'user',
              content: `Extracted data: ${JSON.stringify(data, null, 2)}\n\nFields with low confidence: ${fieldsNeedingReview.map(f => f.field).join(', ')}`,
            },
          ],
          max_tokens: 200,
          temperature: 0.3,
        });

        const aiSuggestion = completion.choices[0]?.message?.content;
        if (aiSuggestion) {
          suggestions.push(...aiSuggestion.split('\n').filter(s => s.trim().length > 0).slice(0, 3));
        }
      } catch (error) {
        logger.warn('Failed to get AI suggestions:', error);
      }
    }

    return suggestions;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Creates a new TaxDocumentScanner instance with default configuration
 *
 * @returns Configured TaxDocumentScanner instance
 */
export function createScanner(): TaxDocumentScanner {
  return new TaxDocumentScanner();
}

/**
 * Convenience function to scan a single document
 *
 * @param fileBuffer - Document file buffer
 * @param mimeType - Document MIME type
 * @returns Scan result
 */
export async function scanTaxDocument(
  fileBuffer: Buffer,
  mimeType: SupportedMimeType
): Promise<ScanResult> {
  const scanner = createScanner();
  return scanner.scanDocument(fileBuffer, mimeType);
}

export default {
  TaxDocumentScanner,
  createScanner,
  scanTaxDocument,
};
