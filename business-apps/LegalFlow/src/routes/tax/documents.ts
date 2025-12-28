import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rate-limit.js';
import { ValidationError, NotFoundError } from '../../utils/errors.js';

const router = Router();

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

// Import W-2 data (placeholder for Plaid integration)
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

  // TODO: Integrate with Plaid for actual W-2 import
  // For now, return placeholder

  res.json({
    success: true,
    message: 'W-2 import feature coming soon. Please manually enter your W-2 data.',
    data: {
      importAvailable: false,
      manualEntryRequired: true,
    },
  });
}));

export default router;

