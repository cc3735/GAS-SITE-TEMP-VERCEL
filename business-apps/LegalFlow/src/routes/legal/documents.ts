import { Router } from 'express';
import { supabaseAdmin } from '../../utils/supabase.js';
import { asyncHandler } from '../../middleware/error-handler.js';
import { authenticate, requirePremium } from '../../middleware/auth.js';
import { ValidationError, NotFoundError, AuthorizationError } from '../../utils/errors.js';
import { createLegalDocumentSchema } from '../../utils/validation.js';
import { createLegalDocumentPDF } from '../../services/pdf/pdf-generator.js';
import { generate, isAIAvailable } from '../../services/ai/openai-client.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// List all legal documents for user
router.get('/', asyncHandler(async (req, res) => {
  const { category, status, limit = 20, offset = 0 } = req.query;

  let query = supabaseAdmin
    .from('legal_documents')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user!.id)
    .order('created_at', { ascending: false })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (category) {
    query = query.eq('document_category', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: documents, count, error } = await query;

  if (error) {
    throw new ValidationError('Failed to fetch documents');
  }

  res.json({
    success: true,
    data: {
      documents: documents.map((doc) => ({
        id: doc.id,
        documentType: doc.document_type,
        documentCategory: doc.document_category,
        title: doc.title,
        status: doc.status,
        pdfUrl: doc.pdf_url,
        signatureStatus: doc.signature_status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at,
      })),
      pagination: {
        total: count,
        limit: Number(limit),
        offset: Number(offset),
      },
    },
  });
}));

// Get single document
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { data: document, error } = await supabaseAdmin
    .from('legal_documents')
    .select('*, legal_templates(*)')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (error || !document) {
    throw new NotFoundError('Legal document');
  }

  res.json({
    success: true,
    data: {
      id: document.id,
      documentType: document.document_type,
      documentCategory: document.document_category,
      title: document.title,
      status: document.status,
      documentData: document.document_data,
      aiGeneratedContent: document.ai_generated_content,
      pdfUrl: document.pdf_url,
      signatureStatus: document.signature_status,
      template: document.legal_templates,
      createdAt: document.created_at,
      updatedAt: document.updated_at,
    },
  });
}));

// Create new legal document
router.post('/', asyncHandler(async (req, res) => {
  const validation = createLegalDocumentSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { documentType, documentCategory, title, templateId } = validation.data;

  // Check tier limits
  const tier = req.user!.subscriptionTier;
  if (tier === 'free') {
    throw new AuthorizationError('Free tier cannot create legal documents. Please upgrade to Basic or higher.');
  }

  if (tier === 'basic') {
    // Check monthly limit (5 documents)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from('legal_documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user!.id)
      .gte('created_at', startOfMonth.toISOString());

    if (count && count >= 5) {
      throw new AuthorizationError('Basic tier limit reached (5 documents/month). Please upgrade to Premium.');
    }
  }

  // Verify template if provided
  if (templateId) {
    const { data: template } = await supabaseAdmin
      .from('legal_templates')
      .select('id, premium_only')
      .eq('id', templateId)
      .single();

    if (!template) {
      throw new NotFoundError('Template');
    }

    if (template.premium_only && tier !== 'premium' && tier !== 'pro') {
      throw new AuthorizationError('This template requires Premium tier');
    }
  }

  const { data: document, error } = await supabaseAdmin
    .from('legal_documents')
    .insert({
      user_id: req.user!.id,
      document_type: documentType,
      document_category: documentCategory,
      title,
      template_id: templateId || null,
      status: 'draft',
      document_data: {},
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
      documentCategory: document.document_category,
      title: document.title,
      status: document.status,
      createdAt: document.created_at,
    },
  });
}));

// Update document
router.put('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('legal_documents')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Legal document');
  }

  if (existing.status === 'signed' || existing.status === 'filed') {
    throw new ValidationError('Cannot update a signed or filed document');
  }

  const allowedFields = ['title', 'document_data', 'status'];
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  for (const field of allowedFields) {
    const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    if (req.body[camelField] !== undefined) {
      updateData[field] = req.body[camelField];
    }
  }

  const { data: document, error } = await supabaseAdmin
    .from('legal_documents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to update document');
  }

  res.json({
    success: true,
    data: {
      id: document.id,
      title: document.title,
      status: document.status,
      documentData: document.document_data,
      updatedAt: document.updated_at,
    },
  });
}));

// Delete document
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify ownership
  const { data: existing } = await supabaseAdmin
    .from('legal_documents')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!existing) {
    throw new NotFoundError('Legal document');
  }

  if (existing.status === 'signed' || existing.status === 'filed') {
    throw new ValidationError('Cannot delete a signed or filed document');
  }

  const { error } = await supabaseAdmin
    .from('legal_documents')
    .delete()
    .eq('id', id);

  if (error) {
    throw new ValidationError('Failed to delete document');
  }

  res.json({
    success: true,
    message: 'Document deleted successfully',
  });
}));

// Generate PDF for document
router.post('/:id/generate-pdf', asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get document with template
  const { data: document } = await supabaseAdmin
    .from('legal_documents')
    .select('*, legal_templates(*)')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!document) {
    throw new NotFoundError('Legal document');
  }

  // Generate content if AI content exists, otherwise use document data
  let content = document.ai_generated_content;

  if (!content) {
    // Build content from document data
    const data = document.document_data as Record<string, unknown>;
    const sections: { heading: string; content: string }[] = [];

    // Simple content builder
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'string') {
        sections.push({
          heading: key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          content: value,
        });
      }
    }

    if (sections.length === 0) {
      throw new ValidationError('Document has no content to generate PDF');
    }

    const pdfBytes = await createLegalDocumentPDF(document.title, sections, {
      author: 'LegalFlow',
      subject: document.document_type,
    });

    // TODO: Upload to Supabase Storage and get URL
    // For now, return base64
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    res.json({
      success: true,
      data: {
        pdfBase64,
        filename: `${document.title.replace(/\s+/g, '_')}.pdf`,
        message: 'PDF generated successfully',
      },
    });
    return;
  }

  // Generate from AI content
  const sections = [{ heading: 'Document', content }];
  const pdfBytes = await createLegalDocumentPDF(document.title, sections, {
    author: 'LegalFlow',
    subject: document.document_type,
  });

  const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

  res.json({
    success: true,
    data: {
      pdfBase64,
      filename: `${document.title.replace(/\s+/g, '_')}.pdf`,
      message: 'PDF generated successfully',
    },
  });
}));

// AI-customize document
router.post('/:id/ai-customize', requirePremium, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { customizations } = req.body;

  if (!isAIAvailable()) {
    throw new ValidationError('AI features are currently unavailable');
  }

  // Get document
  const { data: document } = await supabaseAdmin
    .from('legal_documents')
    .select('*, legal_templates(*)')
    .eq('id', id)
    .eq('user_id', req.user!.id)
    .single();

  if (!document) {
    throw new NotFoundError('Legal document');
  }

  const template = document.legal_templates as { ai_prompt_template?: string; name?: string } | null;
  const basePrompt = template?.ai_prompt_template || 
    `Generate a professional ${document.document_type} document.`;

  const systemPrompt = `You are a legal document drafting assistant. Create professional, legally-sound documents based on user requirements. 

IMPORTANT: 
- Use clear, professional legal language
- Include all necessary clauses for the document type
- Follow standard legal document formatting
- Include appropriate disclaimers where needed`;

  const userPrompt = `${basePrompt}

Document Type: ${document.document_type}
Title: ${document.title}
Current Data: ${JSON.stringify(document.document_data)}

User Customization Request:
${customizations || 'Generate a standard document based on the provided data.'}

Generate the complete document text.`;

  const aiContent = await generate(userPrompt, systemPrompt, {
    userId: req.user!.id,
    serviceType: 'legal_doc',
    serviceId: id,
    maxTokens: 3000,
  });

  // Update document with AI content
  await supabaseAdmin
    .from('legal_documents')
    .update({
      ai_generated_content: aiContent,
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  res.json({
    success: true,
    data: {
      content: aiContent,
      message: 'Document customized with AI successfully',
    },
  });
}));

export default router;

