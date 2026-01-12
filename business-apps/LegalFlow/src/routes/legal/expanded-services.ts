/**
 * Expanded Legal Services Routes
 *
 * Provides endpoints for expanded legal document preparation including
 * divorce, power of attorney, healthcare directives, leases, and employment contracts.
 *
 * @module routes/legal/expanded-services
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  expandedLegalServices,
  LegalServiceCategory,
  DocumentStatus
} from '../../services/legal/expanded-services.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// TEMPLATE MANAGEMENT
// ============================================================================

/**
 * GET /templates
 * Get all available document templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  const { category, state } = req.query;

  let templates = expandedLegalServices.getAllTemplates();

  if (category) {
    templates = templates.filter((t) => t.category === category);
  }

  if (state) {
    templates = expandedLegalServices.getTemplatesForState(state as string);
    if (category) {
      templates = templates.filter((t) => t.category === category);
    }
  }

  res.json({
    success: true,
    data: {
      templates: templates.map((t) => ({
        id: t.id,
        category: t.category,
        name: t.name,
        description: t.description,
        stateSpecific: t.stateSpecific,
        filingRequired: t.filingRequired,
        filingFee: t.filingFee,
      })),
      count: templates.length,
    },
  });
});

/**
 * GET /templates/:templateId
 * Get a specific template with full details
 */
router.get('/templates/:templateId', async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const template = expandedLegalServices.getTemplate(templateId);

  if (!template) {
    return res.status(404).json({
      success: false,
      error: `Template not found: ${templateId}`,
    });
  }

  res.json({
    success: true,
    data: template,
  });
});

/**
 * GET /categories
 * Get all document categories
 */
router.get('/categories', async (_req: Request, res: Response) => {
  const categories = expandedLegalServices.getCategories();

  // Count templates per category
  const allTemplates = expandedLegalServices.getAllTemplates();
  const categoriesWithCounts = categories.map((cat) => ({
    ...cat,
    templateCount: allTemplates.filter((t) => t.category === cat.category).length,
  }));

  res.json({
    success: true,
    data: categoriesWithCounts,
  });
});

/**
 * GET /categories/:category/templates
 * Get templates for a specific category
 */
router.get('/categories/:category/templates', async (req: Request, res: Response) => {
  const { category } = req.params;

  const templates = expandedLegalServices.getTemplatesByCategory(category as LegalServiceCategory);

  if (templates.length === 0) {
    return res.status(404).json({
      success: false,
      error: `No templates found for category: ${category}`,
    });
  }

  res.json({
    success: true,
    data: templates,
  });
});

// ============================================================================
// DOCUMENT MANAGEMENT
// ============================================================================

/**
 * POST /documents
 * Create a new legal document
 */
router.post('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { templateId, data, state } = req.body;

    if (!templateId || !data) {
      return res.status(400).json({
        success: false,
        error: 'Template ID and document data are required',
      });
    }

    const document = await expandedLegalServices.createDocument(userId, templateId, data, state);

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document created successfully',
    });
  } catch (error: any) {
    if (error.message.includes('Missing required fields')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
});

/**
 * GET /documents
 * Get all documents for the current user
 */
router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { category, status } = req.query;

    const documents = await expandedLegalServices.getUserDocuments(userId, {
      category: category as LegalServiceCategory,
      status: status as DocumentStatus,
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /documents/:documentId
 * Get a specific document
 */
router.get('/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId } = req.params;

    const document = await expandedLegalServices.getDocument(documentId, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
      });
    }

    // Get template info
    const template = expandedLegalServices.getTemplate(document.templateId);

    res.json({
      success: true,
      data: {
        document,
        template: template
          ? {
              name: template.name,
              category: template.category,
              instructions: template.instructions,
              disclaimers: template.disclaimers,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /documents/:documentId
 * Update a document
 */
router.put('/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId } = req.params;
    const { data, status, title } = req.body;

    const document = await expandedLegalServices.updateDocument(documentId, userId, {
      data,
      status,
      title,
    });

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /documents/:documentId
 * Delete a draft document
 */
router.delete('/documents/:documentId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId } = req.params;

    await expandedLegalServices.deleteDocument(documentId, userId);

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    if (error.message.includes('Only draft')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
});

// ============================================================================
// PDF GENERATION
// ============================================================================

/**
 * POST /documents/:documentId/generate-pdf
 * Generate PDF for a document
 */
router.post('/documents/:documentId/generate-pdf', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { documentId } = req.params;

    const pdfUrl = await expandedLegalServices.generatePdf(documentId, userId);

    res.json({
      success: true,
      data: {
        pdfUrl,
        message: 'PDF generated successfully',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// FILING INFORMATION
// ============================================================================

/**
 * GET /filing-info/:templateId/:state
 * Get filing information for a template in a specific state
 */
router.get('/filing-info/:templateId/:state', async (req: Request, res: Response) => {
  const { templateId, state } = req.params;

  const template = expandedLegalServices.getTemplate(templateId);

  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  }

  // In production, this would have state-specific filing information
  const filingInfo = {
    templateId,
    templateName: template.name,
    state,
    filingRequired: template.filingRequired,
    estimatedFilingFee: template.filingFee,
    filingLocation: template.filingRequired
      ? `${state} County Courthouse or online via state portal`
      : 'Filing not required',
    instructions: template.instructions,
    disclaimer:
      'Filing fees and locations may vary by county. Contact your local courthouse for exact requirements.',
  };

  res.json({
    success: true,
    data: filingInfo,
  });
});

// ============================================================================
// DOCUMENT SUMMARY
// ============================================================================

/**
 * GET /summary
 * Get summary of user's legal documents
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const allDocs = await expandedLegalServices.getUserDocuments(userId);

    // Group by category and status
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const doc of allDocs) {
      byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
      byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
    }

    res.json({
      success: true,
      data: {
        totalDocuments: allDocs.length,
        byCategory,
        byStatus,
        recentDocuments: allDocs.slice(0, 5).map((d) => ({
          id: d.id,
          title: d.title,
          category: d.category,
          status: d.status,
          updatedAt: d.updatedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// QUICK START GUIDES
// ============================================================================

/**
 * GET /guides/:templateId
 * Get step-by-step guide for a document type
 */
router.get('/guides/:templateId', async (req: Request, res: Response) => {
  const { templateId } = req.params;

  const template = expandedLegalServices.getTemplate(templateId);

  if (!template) {
    return res.status(404).json({
      success: false,
      error: 'Template not found',
    });
  }

  // Generate a guide based on template
  const guide = {
    templateId,
    templateName: template.name,
    category: template.category,
    overview: template.description,
    steps: [
      {
        step: 1,
        title: 'Gather Information',
        description: 'Collect all required information before starting',
        items: template.requiredFields.map((f) => f.label),
      },
      {
        step: 2,
        title: 'Complete the Form',
        description: 'Fill in all required fields carefully',
        tips: [
          'Use legal names exactly as they appear on official documents',
          'Double-check dates and addresses',
          'Be specific and clear in descriptions',
        ],
      },
      {
        step: 3,
        title: 'Review',
        description: 'Carefully review the completed document',
        tips: [
          'Check all information for accuracy',
          'Review legal terms and implications',
          'Consider having a professional review if needed',
        ],
      },
      {
        step: 4,
        title: 'Sign and Execute',
        description: template.signatureRequired !== false ? 'Sign the document as required' : 'Finalize the document',
        tips: template.instructions,
      },
      ...(template.filingRequired
        ? [
            {
              step: 5,
              title: 'File',
              description: 'File with the appropriate authority',
              tips: [
                `Estimated filing fee: $${template.filingFee || 'varies'}`,
                'Keep copies of all filed documents',
                'Note any case numbers or confirmation',
              ],
            },
          ]
        : []),
    ],
    disclaimers: template.disclaimers,
    estimatedTime: '15-30 minutes',
  };

  res.json({
    success: true,
    data: guide,
  });
});

export default router;
