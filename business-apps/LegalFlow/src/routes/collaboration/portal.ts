/**
 * Client Collaboration Portal Routes
 *
 * Provides secure multi-user access to tax returns with role-based permissions,
 * document sharing, e-signature support, and real-time notifications.
 *
 * @module routes/collaboration/portal
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  ClientPortalService,
  CollaboratorRole,
  DocumentRequestStatus
} from '../../services/collaboration/client-portal.js';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();
const portalService = new ClientPortalService();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// COLLABORATION MANAGEMENT
// ============================================================================

/**
 * GET /collaborators/:returnId
 * Get all collaborators for a tax return
 */
router.get('/collaborators/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const userId = req.user!.id;

    const collaborators = await portalService.getCollaborators(returnId, userId);

    res.json({
      success: true,
      data: collaborators,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /invite
 * Invite a collaborator to a tax return
 */
router.post('/invite', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId, email, role, permissions, message } = req.body;
    const inviterId = req.user!.id;

    // Validate required fields
    if (!returnId || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: returnId, email, role',
      });
    }

    // Validate role
    const validRoles: CollaboratorRole[] = ['owner', 'preparer', 'reviewer', 'client', 'spouse'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
      });
    }

    const invite = await portalService.inviteCollaborator(
      returnId,
      inviterId,
      email,
      role,
      permissions,
      message
    );

    res.status(201).json({
      success: true,
      data: invite,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /invites/pending
 * Get pending invitations for the current user
 */
router.get('/invites/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const userEmail = req.user!.email;

    const invites = await portalService.getPendingInvites(userEmail);

    res.json({
      success: true,
      data: invites,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /invites/:inviteId/accept
 * Accept a collaboration invite
 */
router.post('/invites/:inviteId/accept', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteId } = req.params;
    const userId = req.user!.id;

    const collaborator = await portalService.acceptInvite(inviteId, userId);

    res.json({
      success: true,
      data: collaborator,
      message: 'Invitation accepted successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /invites/:inviteId/decline
 * Decline a collaboration invite
 */
router.post('/invites/:inviteId/decline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inviteId } = req.params;
    const { reason } = req.body;

    await portalService.declineInvite(inviteId, reason);

    res.json({
      success: true,
      message: 'Invitation declined',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /collaborators/:collaboratorId
 * Update collaborator permissions
 */
router.put('/collaborators/:collaboratorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collaboratorId } = req.params;
    const { role, permissions } = req.body;
    const userId = req.user!.id;

    const collaborator = await portalService.updateCollaborator(
      collaboratorId,
      userId,
      role,
      permissions
    );

    res.json({
      success: true,
      data: collaborator,
      message: 'Collaborator updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /collaborators/:collaboratorId
 * Remove a collaborator from a tax return
 */
router.delete('/collaborators/:collaboratorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { collaboratorId } = req.params;
    const userId = req.user!.id;

    await portalService.removeCollaborator(collaboratorId, userId);

    res.json({
      success: true,
      message: 'Collaborator removed successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DOCUMENT REQUESTS
// ============================================================================

/**
 * POST /document-requests
 * Create a document request for a client
 */
router.post('/document-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      returnId,
      requestedFromUserId,
      documentTypes,
      customDescription,
      dueDate,
      priority,
    } = req.body;
    const requesterId = req.user!.id;

    if (!returnId || !requestedFromUserId || !documentTypes?.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: returnId, requestedFromUserId, documentTypes',
      });
    }

    const request = await portalService.createDocumentRequest(
      returnId,
      requesterId,
      requestedFromUserId,
      documentTypes,
      customDescription,
      dueDate ? new Date(dueDate) : undefined,
      priority
    );

    res.status(201).json({
      success: true,
      data: request,
      message: 'Document request created',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /document-requests/:returnId
 * Get all document requests for a tax return
 */
router.get('/document-requests/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const userId = req.user!.id;

    const requests = await portalService.getDocumentRequests(returnId, userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /document-requests/pending/me
 * Get document requests assigned to the current user
 */
router.get('/document-requests/pending/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const requests = await portalService.getMyPendingDocumentRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /document-requests/:requestId/fulfill
 * Fulfill a document request by uploading documents
 */
router.post('/document-requests/:requestId/fulfill', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { documents } = req.body;
    const userId = req.user!.id;

    if (!documents?.length) {
      return res.status(400).json({
        success: false,
        error: 'No documents provided',
      });
    }

    const request = await portalService.fulfillDocumentRequest(requestId, userId, documents);

    res.json({
      success: true,
      data: request,
      message: 'Document request fulfilled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /document-requests/:requestId/status
 * Update document request status (for reviewers)
 */
router.put('/document-requests/:requestId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;
    const userId = req.user!.id;

    const validStatuses: DocumentRequestStatus[] = ['pending', 'partial', 'fulfilled', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const request = await portalService.updateDocumentRequestStatus(requestId, userId, status, notes);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// DOCUMENT SHARING
// ============================================================================

/**
 * POST /documents/share
 * Share a document with collaborators
 */
router.post('/documents/share', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      returnId,
      documentId,
      sharedWithUserIds,
      accessLevel,
      expiresAt,
    } = req.body;
    const sharedByUserId = req.user!.id;

    if (!returnId || !documentId || !sharedWithUserIds?.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: returnId, documentId, sharedWithUserIds',
      });
    }

    const sharedDoc = await portalService.shareDocument(
      returnId,
      documentId,
      sharedByUserId,
      sharedWithUserIds,
      accessLevel || 'view',
      expiresAt ? new Date(expiresAt) : undefined
    );

    res.status(201).json({
      success: true,
      data: sharedDoc,
      message: 'Document shared successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /documents/shared/:returnId
 * Get all shared documents for a tax return
 */
router.get('/documents/shared/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const userId = req.user!.id;

    const documents = await portalService.getSharedDocuments(returnId, userId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /documents/shared-with-me
 * Get documents shared with the current user
 */
router.get('/documents/shared-with-me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const documents = await portalService.getDocumentsSharedWithMe(userId);

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /documents/share/:shareId
 * Revoke document sharing
 */
router.delete('/documents/share/:shareId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shareId } = req.params;
    const userId = req.user!.id;

    await portalService.revokeDocumentShare(shareId, userId);

    res.json({
      success: true,
      message: 'Document sharing revoked',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// E-SIGNATURES
// ============================================================================

/**
 * POST /signatures/request
 * Request e-signature on a document
 */
router.post('/signatures/request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      returnId,
      documentId,
      signerUserIds,
      signatureLocations,
      dueDate,
      reminderDays,
    } = req.body;
    const requesterId = req.user!.id;

    if (!returnId || !documentId || !signerUserIds?.length || !signatureLocations?.length) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: returnId, documentId, signerUserIds, signatureLocations',
      });
    }

    const request = await portalService.requestSignature(
      returnId,
      documentId,
      requesterId,
      signerUserIds,
      signatureLocations,
      dueDate ? new Date(dueDate) : undefined,
      reminderDays
    );

    res.status(201).json({
      success: true,
      data: request,
      message: 'Signature request sent',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /signatures/pending/me
 * Get pending signature requests for the current user
 */
router.get('/signatures/pending/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const requests = await portalService.getMyPendingSignatures(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /signatures/:returnId
 * Get all signature requests for a tax return
 */
router.get('/signatures/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const userId = req.user!.id;

    const requests = await portalService.getSignatureRequests(returnId, userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /signatures/:requestId/sign
 * Sign a document
 */
router.post('/signatures/:requestId/sign', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { signatureData, signatureType } = req.body;
    const userId = req.user!.id;

    if (!signatureData) {
      return res.status(400).json({
        success: false,
        error: 'Signature data is required',
      });
    }

    const result = await portalService.signDocument(
      requestId,
      userId,
      signatureData,
      signatureType || 'typed'
    );

    res.json({
      success: true,
      data: result,
      message: 'Document signed successfully',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /signatures/:requestId/decline
 * Decline to sign a document
 */
router.post('/signatures/:requestId/decline', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;

    await portalService.declineSignature(requestId, userId, reason);

    res.json({
      success: true,
      message: 'Signature request declined',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * GET /notifications
 * Get notifications for the current user
 */
router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly, limit } = req.query;

    const notifications = await portalService.getNotifications(
      userId,
      unreadOnly === 'true',
      limit ? parseInt(limit as string) : undefined
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /notifications/:notificationId/read
 * Mark a notification as read
 */
router.put('/notifications/:notificationId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user!.id;

    await portalService.markNotificationRead(notificationId, userId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/notifications/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const count = await portalService.markAllNotificationsRead(userId);

    res.json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ACTIVITY LOG
// ============================================================================

/**
 * GET /activity/:returnId
 * Get activity log for a tax return
 */
router.get('/activity/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const { limit, offset } = req.query;
    const userId = req.user!.id;

    const activity = await portalService.getActivityLog(
      returnId,
      userId,
      limit ? parseInt(limit as string) : undefined,
      offset ? parseInt(offset as string) : undefined
    );

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PORTAL OVERVIEW
// ============================================================================

/**
 * GET /overview
 * Get portal overview for the current user (all returns, pending items, etc.)
 */
router.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const overview = await portalService.getPortalOverview(userId);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /returns/shared
 * Get all tax returns shared with the current user
 */
router.get('/returns/shared', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const returns = await portalService.getSharedReturns(userId);

    res.json({
      success: true,
      data: returns,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * GET /permissions/:returnId
 * Get current user's permissions for a tax return
 */
router.get('/permissions/:returnId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { returnId } = req.params;
    const userId = req.user!.id;

    const permissions = await portalService.getUserPermissions(returnId, userId);

    res.json({
      success: true,
      data: permissions,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /roles
 * Get available collaboration roles and their default permissions
 */
router.get('/roles', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      roles: [
        {
          role: 'owner',
          name: 'Owner',
          description: 'Full access to the tax return, can invite others and manage permissions',
          defaultPermissions: {
            canView: true,
            canEdit: true,
            canComment: true,
            canUpload: true,
            canDelete: true,
            canSign: true,
            canInvite: true,
            canExport: true,
          },
        },
        {
          role: 'preparer',
          name: 'Tax Preparer',
          description: 'Can prepare and edit the tax return, request documents',
          defaultPermissions: {
            canView: true,
            canEdit: true,
            canComment: true,
            canUpload: true,
            canDelete: false,
            canSign: false,
            canInvite: true,
            canExport: true,
          },
        },
        {
          role: 'reviewer',
          name: 'Reviewer',
          description: 'Can view and comment on the tax return',
          defaultPermissions: {
            canView: true,
            canEdit: false,
            canComment: true,
            canUpload: false,
            canDelete: false,
            canSign: false,
            canInvite: false,
            canExport: true,
          },
        },
        {
          role: 'client',
          name: 'Client',
          description: 'Can view their return, upload documents, and sign',
          defaultPermissions: {
            canView: true,
            canEdit: false,
            canComment: true,
            canUpload: true,
            canDelete: false,
            canSign: true,
            canInvite: false,
            canExport: true,
          },
        },
        {
          role: 'spouse',
          name: 'Spouse',
          description: 'Joint filer with full access and signing authority',
          defaultPermissions: {
            canView: true,
            canEdit: true,
            canComment: true,
            canUpload: true,
            canDelete: false,
            canSign: true,
            canInvite: false,
            canExport: true,
          },
        },
      ],
    },
  });
});

/**
 * GET /document-types
 * Get available document types for requests
 */
router.get('/document-types', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      documentTypes: [
        { type: 'w2', name: 'W-2', description: 'Wage and Tax Statement' },
        { type: '1099_int', name: '1099-INT', description: 'Interest Income' },
        { type: '1099_div', name: '1099-DIV', description: 'Dividend Income' },
        { type: '1099_b', name: '1099-B', description: 'Stock Sales' },
        { type: '1099_misc', name: '1099-MISC', description: 'Miscellaneous Income' },
        { type: '1099_nec', name: '1099-NEC', description: 'Nonemployee Compensation' },
        { type: '1099_g', name: '1099-G', description: 'Government Payments' },
        { type: '1099_r', name: '1099-R', description: 'Retirement Distributions' },
        { type: '1098', name: '1098', description: 'Mortgage Interest Statement' },
        { type: '1098_t', name: '1098-T', description: 'Tuition Statement' },
        { type: '1095_a', name: '1095-A', description: 'Health Insurance Marketplace' },
        { type: 'id', name: 'ID Document', description: "Driver's License or State ID" },
        { type: 'ssn_card', name: 'Social Security Card', description: 'SSN verification' },
        { type: 'bank_statement', name: 'Bank Statement', description: 'For direct deposit verification' },
        { type: 'prior_return', name: 'Prior Year Return', description: 'Previous tax return' },
        { type: 'property_tax', name: 'Property Tax Statement', description: 'Real estate tax records' },
        { type: 'charitable_receipt', name: 'Charitable Donation Receipt', description: 'Donation acknowledgments' },
        { type: 'medical_expenses', name: 'Medical Expenses', description: 'Healthcare cost documentation' },
        { type: 'business_income', name: 'Business Income Records', description: 'Self-employment income' },
        { type: 'business_expenses', name: 'Business Expense Records', description: 'Self-employment expenses' },
        { type: 'other', name: 'Other Document', description: 'Any other supporting document' },
      ],
    },
  });
});

export default router;
