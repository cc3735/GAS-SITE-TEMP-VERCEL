/**
 * Lead Management Routes
 *
 * Endpoints for lead capture, management, and CRM integration.
 *
 * @module routes/leads
 */

import { Router, Request, Response } from 'express';
import {
  leadCaptureService,
  createLeadFromInstagramDM,
  createLeadFromLandingPage,
  LeadStatus,
  LeadSource,
  LeadType,
} from '../services/lead-capture.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================================================
// LEAD CRUD OPERATIONS
// ============================================================================

/**
 * GET /api/leads
 * List leads with filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      source,
      type,
      minScore,
      assignedTo,
      search,
      limit = '50',
      offset = '0',
    } = req.query;

    const result = await leadCaptureService.listLeads({
      status: status as LeadStatus,
      source: source as LeadSource,
      type: type as LeadType,
      minScore: minScore ? parseInt(minScore as string, 10) : undefined,
      assignedTo: assignedTo as string,
      search: search as string,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: result.leads,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    logger.error('Error listing leads:', error);
    res.status(500).json({ success: false, error: 'Failed to list leads' });
  }
});

/**
 * GET /api/leads/stats
 * Get lead statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await leadCaptureService.getStatistics();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error getting lead stats:', error);
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

/**
 * GET /api/leads/:id
 * Get a specific lead
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadCaptureService.getLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error getting lead:', error);
    res.status(500).json({ success: false, error: 'Failed to get lead' });
  }
});

/**
 * POST /api/leads
 * Create a new lead
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const lead = await leadCaptureService.createLead(req.body);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error creating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to create lead' });
  }
});

/**
 * PATCH /api/leads/:id
 * Update a lead
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const lead = await leadCaptureService.updateLead(req.params.id, req.body);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error updating lead:', error);
    res.status(500).json({ success: false, error: 'Failed to update lead' });
  }
});

/**
 * POST /api/leads/:id/contact
 * Record a contact with a lead
 */
router.post('/:id/contact', async (req: Request, res: Response) => {
  try {
    const { type, notes } = req.body;

    await leadCaptureService.logActivity(
      req.params.id,
      'contacted',
      notes || `Contacted via ${type}`,
      { contactType: type }
    );

    const lead = await leadCaptureService.updateLead(req.params.id, {
      lastContactedAt: new Date(),
      status: 'contacted',
    });

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error recording contact:', error);
    res.status(500).json({ success: false, error: 'Failed to record contact' });
  }
});

/**
 * POST /api/leads/:id/status
 * Update lead status
 */
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const lead = await leadCaptureService.updateLead(req.params.id, { status });

    if (notes) {
      await leadCaptureService.logActivity(req.params.id, 'note', notes);
    }

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error updating status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

/**
 * POST /api/leads/:id/assign
 * Assign lead to a team member
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { assignedTo } = req.body;

    const lead = await leadCaptureService.updateLead(req.params.id, { assignedTo });

    await leadCaptureService.logActivity(
      req.params.id,
      'note',
      `Lead assigned to ${assignedTo}`
    );

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error assigning lead:', error);
    res.status(500).json({ success: false, error: 'Failed to assign lead' });
  }
});

/**
 * POST /api/leads/:id/follow-up
 * Schedule a follow-up
 */
router.post('/:id/follow-up', async (req: Request, res: Response) => {
  try {
    const { date, notes } = req.body;

    const lead = await leadCaptureService.updateLead(req.params.id, {
      nextFollowUpAt: new Date(date),
    });

    await leadCaptureService.logActivity(
      req.params.id,
      'note',
      `Follow-up scheduled for ${date}${notes ? `: ${notes}` : ''}`
    );

    res.json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error scheduling follow-up:', error);
    res.status(500).json({ success: false, error: 'Failed to schedule follow-up' });
  }
});

/**
 * GET /api/leads/:id/activities
 * Get lead activity history
 */
router.get('/:id/activities', async (req: Request, res: Response) => {
  try {
    const activities = await leadCaptureService.getActivities(req.params.id);
    res.json({ success: true, data: activities });
  } catch (error) {
    logger.error('Error getting activities:', error);
    res.status(500).json({ success: false, error: 'Failed to get activities' });
  }
});

/**
 * POST /api/leads/:id/note
 * Add a note to a lead
 */
router.post('/:id/note', async (req: Request, res: Response) => {
  try {
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, error: 'Note is required' });
    }

    await leadCaptureService.logActivity(req.params.id, 'note', note);

    res.json({ success: true, message: 'Note added' });
  } catch (error) {
    logger.error('Error adding note:', error);
    res.status(500).json({ success: false, error: 'Failed to add note' });
  }
});

// ============================================================================
// LEAD CAPTURE ENDPOINTS
// ============================================================================

/**
 * POST /api/leads/capture/instagram
 * Capture lead from Instagram DM webhook
 */
router.post('/capture/instagram', async (req: Request, res: Response) => {
  try {
    const { senderId, message, postId } = req.body;

    if (!senderId || !message) {
      return res.status(400).json({
        success: false,
        error: 'senderId and message are required',
      });
    }

    const lead = await createLeadFromInstagramDM(senderId, message, postId);
    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error capturing Instagram lead:', error);
    res.status(500).json({ success: false, error: 'Failed to capture lead' });
  }
});

/**
 * POST /api/leads/capture/landing-page
 * Capture lead from landing page form
 */
router.post('/capture/landing-page', async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      message,
      dealId,
      budget,
    } = req.body;

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: 'Email or phone is required',
      });
    }

    const lead = await createLeadFromLandingPage({
      firstName,
      lastName,
      email,
      phone,
      message,
      dealId,
      budget,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error capturing landing page lead:', error);
    res.status(500).json({ success: false, error: 'Failed to capture lead' });
  }
});

/**
 * POST /api/leads/capture/sms
 * Capture lead from SMS
 */
router.post('/capture/sms', async (req: Request, res: Response) => {
  try {
    const { phone, message, postId, dealId } = req.body;

    if (!phone || !message) {
      return res.status(400).json({
        success: false,
        error: 'phone and message are required',
      });
    }

    const lead = await leadCaptureService.createLead({
      source: 'sms',
      phone,
      message,
      postId,
      dealId,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error capturing SMS lead:', error);
    res.status(500).json({ success: false, error: 'Failed to capture lead' });
  }
});

/**
 * POST /api/leads/capture/email
 * Capture lead from email
 */
router.post('/capture/email', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, subject, message, dealId } = req.body;

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        error: 'email and message are required',
      });
    }

    const lead = await leadCaptureService.createLead({
      source: 'email',
      email,
      firstName,
      lastName,
      message: subject ? `Subject: ${subject}\n\n${message}` : message,
      dealId,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    logger.error('Error capturing email lead:', error);
    res.status(500).json({ success: false, error: 'Failed to capture lead' });
  }
});

// ============================================================================
// CRM SYNC
// ============================================================================

/**
 * POST /api/leads/:id/sync-crm
 * Manually sync lead to CRM
 */
router.post('/:id/sync-crm', async (req: Request, res: Response) => {
  try {
    const lead = await leadCaptureService.getLead(req.params.id);

    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    // Import CRM integration
    const { CRMIntegration } = await import('../services/lead-capture.js');
    const crmIntegration = new CRMIntegration();

    const results = await crmIntegration.syncLead(lead);
    const synced = Object.values(results).some(r => r !== null);

    if (synced) {
      await leadCaptureService.updateLead(req.params.id, {
        crmSynced: true,
        crmId: Object.values(results).find(r => r) || undefined,
      });
    }

    res.json({
      success: true,
      data: {
        synced,
        results,
      },
    });
  } catch (error) {
    logger.error('Error syncing to CRM:', error);
    res.status(500).json({ success: false, error: 'Failed to sync to CRM' });
  }
});

export default router;
