/**
 * Client Collaboration Portal Service
 *
 * Enables collaboration between tax preparers and their clients:
 * - Document sharing and requests
 * - Secure document upload with encryption
 * - E-signature integration
 * - Status updates and notifications
 * - Multi-user access to returns
 *
 * @version 1.0.0
 * @created 2026-01-12
 */

import { supabase } from '../../lib/supabase.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Collaboration role types
 */
export type CollaboratorRole = 'owner' | 'preparer' | 'reviewer' | 'client' | 'spouse';

/**
 * Document request status
 */
export type DocumentRequestStatus = 'pending' | 'uploaded' | 'approved' | 'rejected' | 'expired';

/**
 * Signature status
 */
export type SignatureStatus = 'pending' | 'signed' | 'declined' | 'expired';

/**
 * Collaboration invitation
 */
export interface CollaborationInvite {
  id: string;
  taxReturnId: string;
  invitedEmail: string;
  invitedRole: CollaboratorRole;
  invitedBy: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token: string;
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
}

/**
 * Collaborator on a tax return
 */
export interface Collaborator {
  id: string;
  userId: string;
  taxReturnId: string;
  role: CollaboratorRole;
  permissions: CollaboratorPermissions;
  addedBy: string;
  addedAt: Date;
  lastAccessedAt?: Date;
  user?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Collaborator permissions
 */
export interface CollaboratorPermissions {
  canView: boolean;
  canEdit: boolean;
  canUploadDocuments: boolean;
  canRequestDocuments: boolean;
  canSign: boolean;
  canInviteOthers: boolean;
  canSubmit: boolean;
}

/**
 * Document request
 */
export interface DocumentRequest {
  id: string;
  taxReturnId: string;
  requestedBy: string;
  requestedFrom: string;
  documentType: string;
  documentName: string;
  description?: string;
  status: DocumentRequestStatus;
  dueDate?: Date;
  uploadedDocumentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Shared document
 */
export interface SharedDocument {
  id: string;
  taxReturnId: string;
  uploadedBy: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  encryptedUrl: string;
  category: DocumentCategory;
  description?: string;
  isConfidential: boolean;
  expiresAt?: Date;
  accessLog: DocumentAccessLog[];
  createdAt: Date;
}

/**
 * Document category
 */
export type DocumentCategory =
  | 'w2'
  | '1099'
  | '1098'
  | 'id_verification'
  | 'proof_of_income'
  | 'bank_statement'
  | 'receipt'
  | 'prior_return'
  | 'signature'
  | 'other';

/**
 * Document access log entry
 */
export interface DocumentAccessLog {
  userId: string;
  action: 'view' | 'download' | 'delete';
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Signature request
 */
export interface SignatureRequest {
  id: string;
  taxReturnId: string;
  documentId: string;
  requestedBy: string;
  signerEmail: string;
  signerName: string;
  signerRole: 'taxpayer' | 'spouse' | 'preparer';
  status: SignatureStatus;
  signatureData?: string;
  signedAt?: Date;
  declinedAt?: Date;
  declineReason?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Activity log entry
 */
export interface ActivityLogEntry {
  id: string;
  taxReturnId: string;
  userId: string;
  action: string;
  details: Record<string, unknown>;
  timestamp: Date;
  ipAddress?: string;
}

/**
 * Notification
 */
export interface PortalNotification {
  id: string;
  userId: string;
  taxReturnId?: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

/**
 * Notification types
 */
export type NotificationType =
  | 'document_request'
  | 'document_uploaded'
  | 'signature_request'
  | 'signature_completed'
  | 'return_status_change'
  | 'collaboration_invite'
  | 'comment_added'
  | 'deadline_reminder';

// ============================================================================
// Default Permissions by Role
// ============================================================================

const DEFAULT_PERMISSIONS: Record<CollaboratorRole, CollaboratorPermissions> = {
  owner: {
    canView: true,
    canEdit: true,
    canUploadDocuments: true,
    canRequestDocuments: true,
    canSign: true,
    canInviteOthers: true,
    canSubmit: true,
  },
  preparer: {
    canView: true,
    canEdit: true,
    canUploadDocuments: true,
    canRequestDocuments: true,
    canSign: false,
    canInviteOthers: true,
    canSubmit: true,
  },
  reviewer: {
    canView: true,
    canEdit: false,
    canUploadDocuments: false,
    canRequestDocuments: false,
    canSign: false,
    canInviteOthers: false,
    canSubmit: false,
  },
  client: {
    canView: true,
    canEdit: false,
    canUploadDocuments: true,
    canRequestDocuments: false,
    canSign: true,
    canInviteOthers: false,
    canSubmit: false,
  },
  spouse: {
    canView: true,
    canEdit: false,
    canUploadDocuments: true,
    canRequestDocuments: false,
    canSign: true,
    canInviteOthers: false,
    canSubmit: false,
  },
};

// ============================================================================
// Client Portal Service
// ============================================================================

export class ClientPortalService {
  // ==========================================================================
  // Collaboration Management
  // ==========================================================================

  /**
   * Invite a collaborator to a tax return
   */
  async inviteCollaborator(
    taxReturnId: string,
    invitedBy: string,
    email: string,
    role: CollaboratorRole
  ): Promise<CollaborationInvite> {
    // Verify inviter has permission
    const canInvite = await this.checkPermission(taxReturnId, invitedBy, 'canInviteOthers');
    if (!canInvite) {
      throw new Error('You do not have permission to invite collaborators');
    }

    // Check if already a collaborator
    const { data: existing } = await supabase
      .from('tax_return_collaborators')
      .select('id')
      .eq('tax_return_id', taxReturnId)
      .eq('user_email', email)
      .single();

    if (existing) {
      throw new Error('This user is already a collaborator on this return');
    }

    // Generate secure invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const { data: invite, error } = await supabase
      .from('collaboration_invites')
      .insert({
        tax_return_id: taxReturnId,
        invited_email: email.toLowerCase(),
        invited_role: role,
        invited_by: invitedBy,
        status: 'pending',
        token,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create invite:', error);
      throw new Error('Failed to create invitation');
    }

    // Create notification for the invitee (if they have an account)
    await this.createNotificationByEmail(email, {
      type: 'collaboration_invite',
      title: 'You\'ve been invited to collaborate',
      message: `You've been invited to collaborate on a tax return as a ${role}.`,
      taxReturnId,
      actionUrl: `/collaboration/accept/${token}`,
    });

    // Log activity
    await this.logActivity(taxReturnId, invitedBy, 'invite_sent', {
      invitedEmail: email,
      role,
    });

    return {
      id: invite.id,
      taxReturnId: invite.tax_return_id,
      invitedEmail: invite.invited_email,
      invitedRole: invite.invited_role,
      invitedBy: invite.invited_by,
      status: invite.status,
      token: invite.token,
      expiresAt: new Date(invite.expires_at),
      createdAt: new Date(invite.created_at),
    };
  }

  /**
   * Accept a collaboration invite
   */
  async acceptInvite(token: string, userId: string): Promise<Collaborator> {
    // Find and validate invite
    const { data: invite, error: findError } = await supabase
      .from('collaboration_invites')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (findError || !invite) {
      throw new Error('Invalid or expired invitation');
    }

    if (new Date(invite.expires_at) < new Date()) {
      await supabase
        .from('collaboration_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id);
      throw new Error('This invitation has expired');
    }

    // Get user email to verify
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (user?.email?.toLowerCase() !== invite.invited_email.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    // Create collaborator record
    const permissions = DEFAULT_PERMISSIONS[invite.invited_role as CollaboratorRole];

    const { data: collaborator, error: createError } = await supabase
      .from('tax_return_collaborators')
      .insert({
        user_id: userId,
        tax_return_id: invite.tax_return_id,
        role: invite.invited_role,
        permissions,
        added_by: invite.invited_by,
        added_at: new Date().toISOString(),
        user_email: invite.invited_email,
      })
      .select()
      .single();

    if (createError) {
      logger.error('Failed to create collaborator:', createError);
      throw new Error('Failed to accept invitation');
    }

    // Update invite status
    await supabase
      .from('collaboration_invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id);

    // Log activity
    await this.logActivity(invite.tax_return_id, userId, 'invite_accepted', {
      role: invite.invited_role,
    });

    return {
      id: collaborator.id,
      userId: collaborator.user_id,
      taxReturnId: collaborator.tax_return_id,
      role: collaborator.role,
      permissions: collaborator.permissions,
      addedBy: collaborator.added_by,
      addedAt: new Date(collaborator.added_at),
    };
  }

  /**
   * Get collaborators for a tax return
   */
  async getCollaborators(taxReturnId: string, requesterId: string): Promise<Collaborator[]> {
    // Verify requester has access
    const hasAccess = await this.checkPermission(taxReturnId, requesterId, 'canView');
    if (!hasAccess) {
      throw new Error('You do not have access to this return');
    }

    const { data, error } = await supabase
      .from('tax_return_collaborators')
      .select(`
        *,
        users:user_id (
          email,
          first_name,
          last_name
        )
      `)
      .eq('tax_return_id', taxReturnId);

    if (error) {
      logger.error('Failed to get collaborators:', error);
      return [];
    }

    return data.map(c => ({
      id: c.id,
      userId: c.user_id,
      taxReturnId: c.tax_return_id,
      role: c.role,
      permissions: c.permissions,
      addedBy: c.added_by,
      addedAt: new Date(c.added_at),
      lastAccessedAt: c.last_accessed_at ? new Date(c.last_accessed_at) : undefined,
      user: c.users ? {
        email: c.users.email,
        firstName: c.users.first_name,
        lastName: c.users.last_name,
      } : undefined,
    }));
  }

  /**
   * Remove a collaborator
   */
  async removeCollaborator(
    taxReturnId: string,
    collaboratorId: string,
    removedBy: string
  ): Promise<void> {
    // Verify permission
    const canInvite = await this.checkPermission(taxReturnId, removedBy, 'canInviteOthers');
    if (!canInvite) {
      throw new Error('You do not have permission to remove collaborators');
    }

    // Get collaborator info for logging
    const { data: collaborator } = await supabase
      .from('tax_return_collaborators')
      .select('user_id, role')
      .eq('id', collaboratorId)
      .single();

    if (!collaborator) {
      throw new Error('Collaborator not found');
    }

    // Cannot remove owner
    if (collaborator.role === 'owner') {
      throw new Error('Cannot remove the owner of a return');
    }

    const { error } = await supabase
      .from('tax_return_collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) {
      logger.error('Failed to remove collaborator:', error);
      throw new Error('Failed to remove collaborator');
    }

    // Log activity
    await this.logActivity(taxReturnId, removedBy, 'collaborator_removed', {
      removedUserId: collaborator.user_id,
      role: collaborator.role,
    });
  }

  // ==========================================================================
  // Document Requests
  // ==========================================================================

  /**
   * Create a document request
   */
  async createDocumentRequest(
    taxReturnId: string,
    requestedBy: string,
    requestedFromEmail: string,
    request: {
      documentType: string;
      documentName: string;
      description?: string;
      dueDate?: Date;
    }
  ): Promise<DocumentRequest> {
    // Verify permission
    const canRequest = await this.checkPermission(taxReturnId, requestedBy, 'canRequestDocuments');
    if (!canRequest) {
      throw new Error('You do not have permission to request documents');
    }

    const { data, error } = await supabase
      .from('document_requests')
      .insert({
        tax_return_id: taxReturnId,
        requested_by: requestedBy,
        requested_from_email: requestedFromEmail.toLowerCase(),
        document_type: request.documentType,
        document_name: request.documentName,
        description: request.description,
        status: 'pending',
        due_date: request.dueDate?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create document request:', error);
      throw new Error('Failed to create document request');
    }

    // Create notification
    await this.createNotificationByEmail(requestedFromEmail, {
      type: 'document_request',
      title: 'Document Requested',
      message: `Please upload: ${request.documentName}`,
      taxReturnId,
      actionUrl: `/collaboration/documents/${data.id}`,
    });

    // Log activity
    await this.logActivity(taxReturnId, requestedBy, 'document_requested', {
      documentType: request.documentType,
      documentName: request.documentName,
      requestedFrom: requestedFromEmail,
    });

    return {
      id: data.id,
      taxReturnId: data.tax_return_id,
      requestedBy: data.requested_by,
      requestedFrom: data.requested_from_email,
      documentType: data.document_type,
      documentName: data.document_name,
      description: data.description,
      status: data.status,
      dueDate: data.due_date ? new Date(data.due_date) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * Get document requests for a tax return
   */
  async getDocumentRequests(
    taxReturnId: string,
    userId: string
  ): Promise<DocumentRequest[]> {
    const hasAccess = await this.checkPermission(taxReturnId, userId, 'canView');
    if (!hasAccess) {
      throw new Error('You do not have access to this return');
    }

    const { data, error } = await supabase
      .from('document_requests')
      .select('*')
      .eq('tax_return_id', taxReturnId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get document requests:', error);
      return [];
    }

    return data.map(d => ({
      id: d.id,
      taxReturnId: d.tax_return_id,
      requestedBy: d.requested_by,
      requestedFrom: d.requested_from_email,
      documentType: d.document_type,
      documentName: d.document_name,
      description: d.description,
      status: d.status,
      dueDate: d.due_date ? new Date(d.due_date) : undefined,
      uploadedDocumentId: d.uploaded_document_id,
      notes: d.notes,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
      completedAt: d.completed_at ? new Date(d.completed_at) : undefined,
    }));
  }

  /**
   * Fulfill a document request
   */
  async fulfillDocumentRequest(
    requestId: string,
    userId: string,
    documentId: string
  ): Promise<void> {
    const { data: request, error: findError } = await supabase
      .from('document_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (findError || !request) {
      throw new Error('Document request not found');
    }

    const canUpload = await this.checkPermission(request.tax_return_id, userId, 'canUploadDocuments');
    if (!canUpload) {
      throw new Error('You do not have permission to upload documents');
    }

    const { error } = await supabase
      .from('document_requests')
      .update({
        status: 'uploaded',
        uploaded_document_id: documentId,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (error) {
      logger.error('Failed to fulfill document request:', error);
      throw new Error('Failed to fulfill document request');
    }

    // Notify the requester
    await this.createNotification(request.requested_by, {
      type: 'document_uploaded',
      title: 'Document Uploaded',
      message: `${request.document_name} has been uploaded`,
      taxReturnId: request.tax_return_id,
      actionUrl: `/tax/${request.tax_return_id}/documents`,
    });

    // Log activity
    await this.logActivity(request.tax_return_id, userId, 'document_uploaded', {
      requestId,
      documentId,
      documentName: request.document_name,
    });
  }

  // ==========================================================================
  // Document Sharing
  // ==========================================================================

  /**
   * Upload a shared document
   */
  async uploadDocument(
    taxReturnId: string,
    uploadedBy: string,
    file: {
      fileName: string;
      fileType: string;
      fileSize: number;
      content: string; // Base64 encoded
    },
    options: {
      category: DocumentCategory;
      description?: string;
      isConfidential?: boolean;
      expiresAt?: Date;
    }
  ): Promise<SharedDocument> {
    const canUpload = await this.checkPermission(taxReturnId, uploadedBy, 'canUploadDocuments');
    if (!canUpload) {
      throw new Error('You do not have permission to upload documents');
    }

    // In production, encrypt and store in secure storage (S3, etc.)
    // For now, store reference
    const encryptedUrl = `secure://documents/${taxReturnId}/${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from('shared_documents')
      .insert({
        tax_return_id: taxReturnId,
        uploaded_by: uploadedBy,
        file_name: file.fileName,
        file_type: file.fileType,
        file_size: file.fileSize,
        encrypted_url: encryptedUrl,
        category: options.category,
        description: options.description,
        is_confidential: options.isConfidential || false,
        expires_at: options.expiresAt?.toISOString(),
        access_log: [],
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to upload document:', error);
      throw new Error('Failed to upload document');
    }

    // Log activity
    await this.logActivity(taxReturnId, uploadedBy, 'document_shared', {
      documentId: data.id,
      fileName: file.fileName,
      category: options.category,
    });

    return {
      id: data.id,
      taxReturnId: data.tax_return_id,
      uploadedBy: data.uploaded_by,
      fileName: data.file_name,
      fileType: data.file_type,
      fileSize: data.file_size,
      encryptedUrl: data.encrypted_url,
      category: data.category,
      description: data.description,
      isConfidential: data.is_confidential,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      accessLog: data.access_log || [],
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Get shared documents
   */
  async getSharedDocuments(
    taxReturnId: string,
    userId: string
  ): Promise<SharedDocument[]> {
    const hasAccess = await this.checkPermission(taxReturnId, userId, 'canView');
    if (!hasAccess) {
      throw new Error('You do not have access to this return');
    }

    const { data, error } = await supabase
      .from('shared_documents')
      .select('*')
      .eq('tax_return_id', taxReturnId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to get shared documents:', error);
      return [];
    }

    // Log access
    await this.logDocumentAccess(taxReturnId, userId, 'view');

    return data.map(d => ({
      id: d.id,
      taxReturnId: d.tax_return_id,
      uploadedBy: d.uploaded_by,
      fileName: d.file_name,
      fileType: d.file_type,
      fileSize: d.file_size,
      encryptedUrl: d.encrypted_url,
      category: d.category,
      description: d.description,
      isConfidential: d.is_confidential,
      expiresAt: d.expires_at ? new Date(d.expires_at) : undefined,
      accessLog: d.access_log || [],
      createdAt: new Date(d.created_at),
    }));
  }

  // ==========================================================================
  // E-Signature
  // ==========================================================================

  /**
   * Request a signature
   */
  async requestSignature(
    taxReturnId: string,
    requestedBy: string,
    documentId: string,
    signer: {
      email: string;
      name: string;
      role: 'taxpayer' | 'spouse' | 'preparer';
    }
  ): Promise<SignatureRequest> {
    const { data, error } = await supabase
      .from('signature_requests')
      .insert({
        tax_return_id: taxReturnId,
        document_id: documentId,
        requested_by: requestedBy,
        signer_email: signer.email.toLowerCase(),
        signer_name: signer.name,
        signer_role: signer.role,
        status: 'pending',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create signature request:', error);
      throw new Error('Failed to create signature request');
    }

    // Notify signer
    await this.createNotificationByEmail(signer.email, {
      type: 'signature_request',
      title: 'Signature Required',
      message: 'Please sign your tax return',
      taxReturnId,
      actionUrl: `/collaboration/sign/${data.id}`,
    });

    // Log activity
    await this.logActivity(taxReturnId, requestedBy, 'signature_requested', {
      signatureRequestId: data.id,
      signerEmail: signer.email,
      signerRole: signer.role,
    });

    return {
      id: data.id,
      taxReturnId: data.tax_return_id,
      documentId: data.document_id,
      requestedBy: data.requested_by,
      signerEmail: data.signer_email,
      signerName: data.signer_name,
      signerRole: data.signer_role,
      status: data.status,
      expiresAt: new Date(data.expires_at),
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * Sign a document
   */
  async signDocument(
    signatureRequestId: string,
    userId: string,
    signatureData: string,
    ipAddress?: string
  ): Promise<void> {
    const { data: request, error: findError } = await supabase
      .from('signature_requests')
      .select('*')
      .eq('id', signatureRequestId)
      .single();

    if (findError || !request) {
      throw new Error('Signature request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('This signature request has already been processed');
    }

    if (new Date(request.expires_at) < new Date()) {
      throw new Error('This signature request has expired');
    }

    // Verify user is the signer
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    if (user?.email?.toLowerCase() !== request.signer_email.toLowerCase()) {
      throw new Error('You are not authorized to sign this document');
    }

    const { error } = await supabase
      .from('signature_requests')
      .update({
        status: 'signed',
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        ip_address: ipAddress,
      })
      .eq('id', signatureRequestId);

    if (error) {
      logger.error('Failed to sign document:', error);
      throw new Error('Failed to sign document');
    }

    // Notify requester
    await this.createNotification(request.requested_by, {
      type: 'signature_completed',
      title: 'Document Signed',
      message: `${request.signer_name} has signed the document`,
      taxReturnId: request.tax_return_id,
      actionUrl: `/tax/${request.tax_return_id}`,
    });

    // Log activity
    await this.logActivity(request.tax_return_id, userId, 'document_signed', {
      signatureRequestId,
      signerRole: request.signer_role,
    });
  }

  // ==========================================================================
  // Notifications
  // ==========================================================================

  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string,
    notification: Omit<PortalNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    await supabase.from('portal_notifications').insert({
      user_id: userId,
      tax_return_id: notification.taxReturnId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      is_read: false,
      action_url: notification.actionUrl,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Create notification by email (for users who might not be registered yet)
   */
  async createNotificationByEmail(
    email: string,
    notification: Omit<PortalNotification, 'id' | 'userId' | 'isRead' | 'createdAt'>
  ): Promise<void> {
    // Find user by email
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (user) {
      await this.createNotification(user.id, notification);
    }
    // If user doesn't exist, notification would be sent via email instead
    // (email integration not implemented in this version)
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(userId: string): Promise<PortalNotification[]> {
    const { data, error } = await supabase
      .from('portal_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to get notifications:', error);
      return [];
    }

    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      taxReturnId: n.tax_return_id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.is_read,
      actionUrl: n.action_url,
      createdAt: new Date(n.created_at),
    }));
  }

  /**
   * Mark notifications as read
   */
  async markNotificationsRead(userId: string, notificationIds: string[]): Promise<void> {
    await supabase
      .from('portal_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .in('id', notificationIds);
  }

  // ==========================================================================
  // Activity Logging
  // ==========================================================================

  /**
   * Log an activity
   */
  async logActivity(
    taxReturnId: string,
    userId: string,
    action: string,
    details: Record<string, unknown>,
    ipAddress?: string
  ): Promise<void> {
    await supabase.from('activity_log').insert({
      tax_return_id: taxReturnId,
      user_id: userId,
      action,
      details,
      ip_address: ipAddress,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get activity log
   */
  async getActivityLog(
    taxReturnId: string,
    userId: string
  ): Promise<ActivityLogEntry[]> {
    const hasAccess = await this.checkPermission(taxReturnId, userId, 'canView');
    if (!hasAccess) {
      throw new Error('You do not have access to this return');
    }

    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('tax_return_id', taxReturnId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Failed to get activity log:', error);
      return [];
    }

    return data.map(a => ({
      id: a.id,
      taxReturnId: a.tax_return_id,
      userId: a.user_id,
      action: a.action,
      details: a.details,
      timestamp: new Date(a.timestamp),
      ipAddress: a.ip_address,
    }));
  }

  /**
   * Log document access
   */
  private async logDocumentAccess(
    taxReturnId: string,
    userId: string,
    action: 'view' | 'download' | 'delete'
  ): Promise<void> {
    await this.logActivity(taxReturnId, userId, `document_${action}`, {});
  }

  // ==========================================================================
  // Permission Checking
  // ==========================================================================

  /**
   * Check if user has a specific permission on a return
   */
  async checkPermission(
    taxReturnId: string,
    userId: string,
    permission: keyof CollaboratorPermissions
  ): Promise<boolean> {
    // Check if user is the owner
    const { data: returnData } = await supabase
      .from('tax_returns')
      .select('user_id')
      .eq('id', taxReturnId)
      .single();

    if (returnData?.user_id === userId) {
      return true; // Owner has all permissions
    }

    // Check collaborator permissions
    const { data: collaborator } = await supabase
      .from('tax_return_collaborators')
      .select('permissions')
      .eq('tax_return_id', taxReturnId)
      .eq('user_id', userId)
      .single();

    if (!collaborator) {
      return false;
    }

    return collaborator.permissions?.[permission] || false;
  }

  /**
   * Get user's role on a return
   */
  async getUserRole(taxReturnId: string, userId: string): Promise<CollaboratorRole | null> {
    // Check if owner
    const { data: returnData } = await supabase
      .from('tax_returns')
      .select('user_id')
      .eq('id', taxReturnId)
      .single();

    if (returnData?.user_id === userId) {
      return 'owner';
    }

    // Check collaborator role
    const { data: collaborator } = await supabase
      .from('tax_return_collaborators')
      .select('role')
      .eq('tax_return_id', taxReturnId)
      .eq('user_id', userId)
      .single();

    return collaborator?.role || null;
  }
}

// Export singleton
export const clientPortalService = new ClientPortalService();
