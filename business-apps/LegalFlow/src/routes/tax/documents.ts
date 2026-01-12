/**
 * Tax Documents Route Module
 *
 * @module routes/tax/documents
 * @description Handles tax document management including upload, OCR scanning,
 * data extraction, and document CRUD operations. Supports W-2, 1099 variants,
 * 1098, and other tax-related documents.
 *
 * @features
 * - Document upload with OCR scanning
 * - Automatic form type detection
 * - Structured data extraction from scanned documents
 * - Manual document data entry
 * - Document verification and review workflow
 *
 * @endpoints
 * - GET    /api/tax/documents/:taxReturnId         - List documents for a tax return
 * - GET    /api/tax/documents/:taxReturnId/:id     - Get single document
 * - POST   /api/tax/documents                      - Create/upload document
 * - POST   /api/tax/documents/scan                 - Scan document with OCR
 * - PUT    /api/tax/documents/:documentId          - Update document data
 * - DELETE /api/tax/documents/:documentId          - Delete document
 * - POST   /api/tax/documents/import/w2            - Import W-2 data
 *
 * @version 1.1.0
 * @since 2026-01-12
 */

import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rate-limit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';
import { TaxDocumentScanner, SupportedMimeType, ScanResult } from '../../services/ocr/document-scanner.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// Initialize the OCR scanner
const documentScanner = new TaxDocumentScanner();

// All routes require authentication
router.use(authenticate);

// List documents for a tax return
router.get('/:taxReturnId', asyncHandler(async (req, res) => {
  const { taxReturnId } = req.params;

  // Verify ownership of tax return
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('id')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  const { data: documents, error } = await supabaseAdmin
    .from('tax_documents')
    .select('*')
    .eq('tax_return_id', taxReturnId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new ValidationError('Failed to fetch documents');
  }

  res.json({
    success: true,
    data: documents.map((doc) => ({
      id: doc.id,
      documentType: doc.document_type,
      documentData: doc.document_data,
      fileUrl: doc.file_url,
      verified: doc.verified,
      createdAt: doc.created_at,
    })),
  });
}));

// Get single document
router.get('/:taxReturnId/:documentId', asyncHandler(async (req, res) => {
  const { taxReturnId, documentId } = req.params;

  // Verify ownership of tax return
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('id')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  const { data: document, error } = await supabaseAdmin
    .from('tax_documents')
    .select('*')
    .eq('id', documentId)
    .eq('tax_return_id', taxReturnId)
    .single();

  if (error || !document) {
    throw new NotFoundError('Document');
  }

  res.json({
    success: true,
    data: {
      id: document.id,
      documentType: document.document_type,
      documentData: document.document_data,
      fileUrl: document.file_url,
      verified: document.verified,
      createdAt: document.created_at,
    },
  });
}));

// Upload/create document
router.post('/', uploadLimiter, asyncHandler(async (req, res) => {
  const { taxReturnId, documentType, documentData } = req.body;

  if (!taxReturnId || !documentType) {
    throw new ValidationError('Tax return ID and document type are required');
  }

  // Verify ownership of tax return
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('id, status')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  if (taxReturn.status === 'filed' || taxReturn.status === 'accepted') {
    throw new ValidationError('Cannot add documents to a filed tax return');
  }

  const validDocumentTypes = [
    'w2', '1099_int', '1099_div', '1099_misc', '1099_nec',
    '1099_g', '1099_r', '1099_ssa', '1098', '1098_e', '1098_t',
    'receipt', 'other',
  ];

  if (!validDocumentTypes.includes(documentType)) {
    throw new ValidationError(`Invalid document type. Valid types: ${validDocumentTypes.join(', ')}`);
  }

  const { data: document, error } = await supabaseAdmin
    .from('tax_documents')
    .insert({
      tax_return_id: taxReturnId,
      document_type: documentType,
      document_data: documentData || {},
      verified: false,
    })
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to create document');
  }

  res.status(201).json({
    success: true,
    data: {
      id: document.id,
      documentType: document.document_type,
      documentData: document.document_data,
      verified: document.verified,
      createdAt: document.created_at,
    },
  });
}));

// Update document data
router.put('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { documentData } = req.body;

  // Get document with tax return verification
  const { data: document } = await supabaseAdmin
    .from('tax_documents')
    .select('*, tax_returns!inner(user_id, status)')
    .eq('id', documentId)
    .single();

  if (!document || (document.tax_returns as { user_id: string }).user_id !== req.user!.id) {
    throw new NotFoundError('Document');
  }

  if ((document.tax_returns as { status: string }).status === 'filed') {
    throw new ValidationError('Cannot update documents on a filed tax return');
  }

  const { data: updated, error } = await supabaseAdmin
    .from('tax_documents')
    .update({
      document_data: documentData,
    })
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to update document');
  }

  res.json({
    success: true,
    data: {
      id: updated.id,
      documentType: updated.document_type,
      documentData: updated.document_data,
      verified: updated.verified,
      createdAt: updated.created_at,
    },
  });
}));

// Delete document
router.delete('/:documentId', asyncHandler(async (req, res) => {
  const { documentId } = req.params;

  // Get document with tax return verification
  const { data: document } = await supabaseAdmin
    .from('tax_documents')
    .select('*, tax_returns!inner(user_id, status)')
    .eq('id', documentId)
    .single();

  if (!document || (document.tax_returns as { user_id: string }).user_id !== req.user!.id) {
    throw new NotFoundError('Document');
  }

  if ((document.tax_returns as { status: string }).status === 'filed') {
    throw new ValidationError('Cannot delete documents from a filed tax return');
  }

  const { error } = await supabaseAdmin
    .from('tax_documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    throw new ValidationError('Failed to delete document');
  }

  res.json({
    success: true,
    message: 'Document deleted successfully',
  });
}));

// ============================================================================
// OCR Document Scanning Endpoints
// ============================================================================

/**
 * @api {post} /api/tax/documents/scan Scan Tax Document with OCR
 * @apiName ScanTaxDocument
 * @apiGroup TaxDocuments
 * @apiVersion 1.1.0
 * @apiDescription Scans a tax document (W-2, 1099, 1098, etc.) using OCR and
 * extracts structured data. Supports images (JPEG, PNG, WebP, TIFF) and PDFs.
 *
 * @apiHeader {String} Authorization Bearer token
 * @apiHeader {String} Content-Type multipart/form-data or application/json
 *
 * @apiBody {String} taxReturnId Tax return ID to associate the document with
 * @apiBody {String} [fileBase64] Base64 encoded file content
 * @apiBody {String} [mimeType] MIME type of the file (image/jpeg, application/pdf, etc.)
 * @apiBody {Boolean} [autoSave=false] Whether to automatically save the extracted data
 *
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Scan result data
 * @apiSuccess {String} data.formType Detected form type (w2, 1099_int, etc.)
 * @apiSuccess {Number} data.formTypeConfidence Confidence in form type detection (0-1)
 * @apiSuccess {Object} data.extractedData Structured data extracted from document
 * @apiSuccess {Number} data.overallConfidence Overall extraction confidence (0-1)
 * @apiSuccess {String[]} data.fieldsNeedingReview Fields that may need manual review
 * @apiSuccess {String[]} data.suggestions AI-generated suggestions for corrections
 * @apiSuccess {String} [data.documentId] Document ID if autoSave was enabled
 *
 * @apiError (400) ValidationError Invalid request parameters
 * @apiError (404) NotFoundError Tax return not found
 * @apiError (500) ServerError OCR processing failed
 *
 * @apiExample {json} Request Example:
 *     {
 *       "taxReturnId": "123e4567-e89b-12d3-a456-426614174000",
 *       "fileBase64": "JVBERi0xLjQKJeLjz9M...",
 *       "mimeType": "application/pdf",
 *       "autoSave": true
 *     }
 *
 * @apiSuccessExample {json} Success Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "success": true,
 *       "data": {
 *         "formType": "w2",
 *         "formTypeConfidence": 0.95,
 *         "extractedData": {
 *           "employerEin": "12-3456789",
 *           "employerName": "ACME Corporation",
 *           "wagesTipsOther": 75000.00,
 *           "federalWithheld": 12500.00,
 *           "socialSecurityWages": 75000.00,
 *           "socialSecurityWithheld": 4650.00,
 *           "medicareWages": 75000.00,
 *           "medicareWithheld": 1087.50,
 *           "taxYear": 2024
 *         },
 *         "overallConfidence": 0.87,
 *         "fieldsNeedingReview": ["employerName"],
 *         "suggestions": [
 *           "Please verify the employer name is correct",
 *           "State wage information was not detected - enter manually if applicable"
 *         ],
 *         "documentId": "doc_abc123"
 *       }
 *     }
 */
router.post('/scan', uploadLimiter, asyncHandler(async (req, res) => {
  const { taxReturnId, fileBase64, mimeType, autoSave = false } = req.body;

  // Validate required fields
  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

  if (!fileBase64) {
    throw new ValidationError('File content (fileBase64) is required');
  }

  if (!mimeType) {
    throw new ValidationError('MIME type is required');
  }

  // Validate MIME type
  const supportedMimeTypes: SupportedMimeType[] = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'application/pdf',
  ];

  if (!supportedMimeTypes.includes(mimeType as SupportedMimeType)) {
    throw new ValidationError(
      `Unsupported file type. Supported types: ${supportedMimeTypes.join(', ')}`
    );
  }

  // Verify ownership of tax return
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('id, status')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  if (taxReturn.status === 'filed' || taxReturn.status === 'accepted') {
    throw new ValidationError('Cannot add documents to a filed tax return');
  }

  // Check if OCR scanner is initialized
  if (!documentScanner.isInitialized()) {
    throw new ValidationError(
      'OCR service is not available. Please configure Google Cloud Vision API credentials.'
    );
  }

  // Convert base64 to buffer
  const fileBuffer = Buffer.from(fileBase64, 'base64');

  // Log scan attempt
  logger.info(`Starting OCR scan for tax return ${taxReturnId}, file size: ${fileBuffer.length} bytes`);

  // Perform OCR scan
  const scanResult: ScanResult = await documentScanner.scanDocument(
    fileBuffer,
    mimeType as SupportedMimeType
  );

  if (!scanResult.success) {
    logger.error(`OCR scan failed: ${scanResult.error}`);
    throw new ValidationError(scanResult.error || 'OCR scanning failed');
  }

  // Prepare response data
  const responseData: Record<string, unknown> = {
    formType: scanResult.formType,
    formTypeConfidence: scanResult.formTypeConfidence,
    extractedData: scanResult.data,
    overallConfidence: scanResult.overallConfidence,
    fieldsNeedingReview: scanResult.fieldsNeedingReview,
    suggestions: scanResult.suggestions,
    fieldConfidences: scanResult.fieldConfidences,
    metadata: scanResult.metadata,
  };

  // Auto-save document if requested
  if (autoSave && scanResult.formType !== 'unknown') {
    const { data: savedDocument, error: saveError } = await supabaseAdmin
      .from('tax_documents')
      .insert({
        tax_return_id: taxReturnId,
        document_type: scanResult.formType,
        document_data: scanResult.data,
        ocr_raw_text: scanResult.rawText,
        ocr_confidence: scanResult.overallConfidence,
        ocr_needs_review: scanResult.fieldsNeedingReview.length > 0,
        verified: false,
      })
      .select()
      .single();

    if (saveError) {
      logger.warn(`Failed to auto-save scanned document: ${saveError.message}`);
    } else {
      responseData.documentId = savedDocument.id;
      responseData.autoSaved = true;
      logger.info(`Auto-saved scanned document: ${savedDocument.id}`);
    }
  }

  res.json({
    success: true,
    data: responseData,
  });
}));

/**
 * @api {get} /api/tax/documents/scan/status Check OCR Service Status
 * @apiName CheckOCRStatus
 * @apiGroup TaxDocuments
 * @apiVersion 1.1.0
 * @apiDescription Checks if the OCR scanning service is available and properly configured.
 *
 * @apiSuccess {Boolean} success Indicates successful operation
 * @apiSuccess {Object} data Service status data
 * @apiSuccess {Boolean} data.ocrAvailable Whether OCR service is available
 * @apiSuccess {String[]} data.supportedFormats List of supported file formats
 * @apiSuccess {String[]} data.supportedDocumentTypes List of supported tax document types
 */
router.get('/scan/status', asyncHandler(async (_req, res) => {
  const isAvailable = documentScanner.isInitialized();

  res.json({
    success: true,
    data: {
      ocrAvailable: isAvailable,
      supportedFormats: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'application/pdf',
      ],
      supportedDocumentTypes: [
        'w2',
        '1099_int',
        '1099_div',
        '1099_misc',
        '1099_nec',
        '1099_g',
        '1099_r',
        '1099_ssa',
        '1098',
        '1098_e',
        '1098_t',
      ],
      message: isAvailable
        ? 'OCR service is ready to scan documents'
        : 'OCR service not configured. Please set up Google Cloud Vision API credentials.',
    },
  });
}));

/**
 * @api {post} /api/tax/documents/scan/validate Validate Scanned Data
 * @apiName ValidateScannedData
 * @apiGroup TaxDocuments
 * @apiVersion 1.1.0
 * @apiDescription Validates user-corrected data against expected formats and ranges
 * for the specified document type.
 */
router.post('/scan/validate', asyncHandler(async (req, res) => {
  const { documentType, data } = req.body;

  if (!documentType || !data) {
    throw new ValidationError('Document type and data are required');
  }

  const validationErrors: Array<{ field: string; message: string }> = [];
  const warnings: Array<{ field: string; message: string }> = [];

  // W-2 specific validations
  if (documentType === 'w2') {
    // Validate EIN format
    if (data.employerEin && !/^\d{2}-\d{7}$/.test(data.employerEin)) {
      validationErrors.push({
        field: 'employerEin',
        message: 'Employer EIN must be in format XX-XXXXXXX',
      });
    }

    // Validate wages relationships
    if (data.wagesTipsOther && data.socialSecurityWages) {
      // Social Security wages cannot exceed annual limit
      const sswLimit = 168600; // 2024 limit
      if (data.socialSecurityWages > sswLimit) {
        warnings.push({
          field: 'socialSecurityWages',
          message: `Social Security wages exceed the ${new Date().getFullYear()} limit of $${sswLimit.toLocaleString()}`,
        });
      }
    }

    // Validate withholding relationships
    if (data.federalWithheld && data.wagesTipsOther) {
      const withholdingRate = data.federalWithheld / data.wagesTipsOther;
      if (withholdingRate > 0.5) {
        warnings.push({
          field: 'federalWithheld',
          message: 'Federal withholding appears unusually high (>50% of wages)',
        });
      }
    }

    // Validate Social Security tax (should be 6.2% of SS wages up to limit)
    if (data.socialSecurityWages && data.socialSecurityWithheld) {
      const expectedSSTax = Math.min(data.socialSecurityWages, 168600) * 0.062;
      const variance = Math.abs(data.socialSecurityWithheld - expectedSSTax);
      if (variance > 10) {
        warnings.push({
          field: 'socialSecurityWithheld',
          message: `Social Security tax withheld ($${data.socialSecurityWithheld}) differs from expected ($${expectedSSTax.toFixed(2)})`,
        });
      }
    }

    // Validate Medicare tax (should be 1.45% of Medicare wages)
    if (data.medicareWages && data.medicareWithheld) {
      const expectedMedicareTax = data.medicareWages * 0.0145;
      const variance = Math.abs(data.medicareWithheld - expectedMedicareTax);
      if (variance > 10) {
        warnings.push({
          field: 'medicareWithheld',
          message: `Medicare tax withheld ($${data.medicareWithheld}) differs from expected ($${expectedMedicareTax.toFixed(2)})`,
        });
      }
    }
  }

  // 1099-NEC specific validations
  if (documentType === '1099_nec') {
    if (data.nonemployeeCompensation && data.nonemployeeCompensation < 600) {
      warnings.push({
        field: 'nonemployeeCompensation',
        message: '1099-NEC is typically only issued for payments of $600 or more',
      });
    }
  }

  res.json({
    success: true,
    data: {
      isValid: validationErrors.length === 0,
      validationErrors,
      warnings,
    },
  });
}));

// ============================================================================
// W-2 Import Endpoint (Plaid Integration Placeholder)
// ============================================================================

/**
 * @api {post} /api/tax/documents/import/w2 Import W-2 Data
 * @apiName ImportW2Data
 * @apiGroup TaxDocuments
 * @apiVersion 1.0.0
 * @apiDescription Imports W-2 data from external sources. Currently supports
 * OCR scanning with future Plaid/payroll integration planned.
 */
router.post('/import/w2', asyncHandler(async (req, res) => {
  const { taxReturnId, employerEin } = req.body;

  if (!taxReturnId) {
    throw new ValidationError('Tax return ID is required');
  }

  // Verify ownership
  const { data: taxReturn } = await supabaseAdmin
    .from('tax_returns')
    .select('id')
    .eq('id', taxReturnId)
    .eq('user_id', req.user!.id)
    .single();

  if (!taxReturn) {
    throw new NotFoundError('Tax return');
  }

  // Check if OCR is available as an alternative
  const ocrAvailable = documentScanner.isInitialized();

  res.json({
    success: true,
    message: 'Direct W-2 import from payroll providers coming soon.',
    data: {
      importAvailable: false,
      manualEntryRequired: !ocrAvailable,
      ocrScanAvailable: ocrAvailable,
      alternativeOptions: [
        ocrAvailable ? {
          method: 'ocr_scan',
          description: 'Upload a photo or PDF of your W-2 form',
          endpoint: '/api/tax/documents/scan',
        } : null,
        {
          method: 'manual_entry',
          description: 'Manually enter your W-2 information',
          endpoint: '/api/tax/documents',
        },
      ].filter(Boolean),
      comingSoon: [
        'Direct import from ADP, Paychex, and other payroll providers',
        'Plaid income verification integration',
        'IRS transcript retrieval',
      ],
    },
  });
}));

export default router;

