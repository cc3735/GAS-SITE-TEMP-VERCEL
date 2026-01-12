/**
 * Lead Capture & CRM Integration Service
 *
 * Captures leads from various sources and integrates with CRM systems:
 * - Instagram DM inquiries
 * - Landing page submissions
 * - SMS/WhatsApp inquiries
 * - Email inquiries
 *
 * CRM Integrations:
 * - HubSpot
 * - Salesforce
 * - Pipedrive
 * - Custom webhooks
 *
 * @module services/lead-capture
 */

import axios from 'axios';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type LeadSource =
  | 'instagram_dm'
  | 'facebook_messenger'
  | 'landing_page'
  | 'sms'
  | 'whatsapp'
  | 'email'
  | 'phone_call'
  | 'referral'
  | 'manual';

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'negotiating'
  | 'won'
  | 'lost'
  | 'nurturing';

export type LeadType = 'buyer' | 'seller' | 'investor' | 'agent' | 'unknown';

export interface Lead {
  id?: string;
  organizationId?: string;
  source: LeadSource;
  sourceId?: string;
  dealId?: string;
  postId?: string;
  type: LeadType;
  status: LeadStatus;
  score: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
  interestedIn?: string[];
  budget?: {
    min?: number;
    max?: number;
  };
  location?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  tags?: string[];
  notes?: string;
  assignedTo?: string;
  metadata?: Record<string, any>;
  crmSynced?: boolean;
  crmId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: 'created' | 'contacted' | 'email_sent' | 'email_opened' | 'call' | 'meeting' | 'note' | 'status_change';
  description: string;
  metadata?: Record<string, any>;
  createdBy?: string;
  createdAt: Date;
}

export interface CRMConfig {
  provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'webhook';
  enabled: boolean;
  apiKey?: string;
  apiUrl?: string;
  accessToken?: string;
  instanceUrl?: string;
  webhookUrl?: string;
  mappings?: Record<string, string>;
}

export interface LeadScoreFactors {
  hasEmail: boolean;
  hasPhone: boolean;
  hasBudget: boolean;
  messageLength: number;
  mentionedDeal: boolean;
  investorKeywords: boolean;
  urgencyKeywords: boolean;
  previousInteraction: boolean;
}

// ============================================================================
// LEAD SCORING ENGINE
// ============================================================================

export class LeadScoringEngine {
  private readonly investorKeywords = [
    'investor', 'investment', 'wholesale', 'flip', 'rental',
    'cash buyer', 'off-market', 'motivated', 'quick close',
    'portfolio', 'syndication', 'partnership',
  ];

  private readonly urgencyKeywords = [
    'asap', 'urgent', 'immediately', 'today', 'now',
    'ready to buy', 'ready to close', 'serious', 'cash ready',
  ];

  /**
   * Calculate lead score (0-100)
   */
  calculateScore(lead: Lead, factors?: Partial<LeadScoreFactors>): number {
    let score = 0;

    // Contact information (30 points max)
    if (lead.email) score += 15;
    if (lead.phone) score += 15;

    // Budget specification (15 points)
    if (lead.budget?.min || lead.budget?.max) score += 15;

    // Message analysis (25 points max)
    if (lead.message) {
      const messageLower = lead.message.toLowerCase();

      // Length indicates engagement
      if (lead.message.length > 200) score += 10;
      else if (lead.message.length > 50) score += 5;

      // Investor keywords
      const investorMatches = this.investorKeywords.filter(kw =>
        messageLower.includes(kw)
      ).length;
      score += Math.min(10, investorMatches * 3);

      // Urgency keywords
      const urgencyMatches = this.urgencyKeywords.filter(kw =>
        messageLower.includes(kw)
      ).length;
      score += Math.min(5, urgencyMatches * 2);
    }

    // Deal reference (10 points)
    if (lead.dealId || lead.postId) score += 10;

    // Lead type (10 points)
    if (lead.type === 'investor') score += 10;
    else if (lead.type === 'buyer') score += 8;
    else if (lead.type === 'seller') score += 5;

    // Previous interaction (10 points)
    if (factors?.previousInteraction) score += 10;

    return Math.min(100, score);
  }

  /**
   * Classify lead type from message
   */
  classifyLeadType(message: string): LeadType {
    const messageLower = message.toLowerCase();

    const buyerKeywords = ['buy', 'purchase', 'looking for', 'interested in', 'want to own'];
    const sellerKeywords = ['sell', 'selling', 'my property', 'my house', 'list'];
    const investorKeywords = ['invest', 'flip', 'wholesale', 'rental', 'portfolio'];
    const agentKeywords = ['agent', 'realtor', 'broker', 'represent'];

    const countMatches = (keywords: string[]) =>
      keywords.filter(kw => messageLower.includes(kw)).length;

    const scores = {
      investor: countMatches(investorKeywords),
      buyer: countMatches(buyerKeywords),
      seller: countMatches(sellerKeywords),
      agent: countMatches(agentKeywords),
    };

    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) return 'unknown';

    return Object.entries(scores).find(([, score]) => score === maxScore)?.[0] as LeadType || 'unknown';
  }

  /**
   * Determine priority based on score
   */
  getPriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

// ============================================================================
// CRM INTEGRATION SERVICE
// ============================================================================

export class CRMIntegration {
  private configs: Map<string, CRMConfig> = new Map();

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv(): void {
    // HubSpot
    if (process.env.HUBSPOT_API_KEY) {
      this.configs.set('hubspot', {
        provider: 'hubspot',
        enabled: true,
        apiKey: process.env.HUBSPOT_API_KEY,
        apiUrl: 'https://api.hubapi.com',
      });
    }

    // Salesforce
    if (process.env.SALESFORCE_ACCESS_TOKEN) {
      this.configs.set('salesforce', {
        provider: 'salesforce',
        enabled: true,
        accessToken: process.env.SALESFORCE_ACCESS_TOKEN,
        instanceUrl: process.env.SALESFORCE_INSTANCE_URL,
      });
    }

    // Pipedrive
    if (process.env.PIPEDRIVE_API_KEY) {
      this.configs.set('pipedrive', {
        provider: 'pipedrive',
        enabled: true,
        apiKey: process.env.PIPEDRIVE_API_KEY,
        apiUrl: 'https://api.pipedrive.com/v1',
      });
    }

    // Custom webhook
    if (process.env.CRM_WEBHOOK_URL) {
      this.configs.set('webhook', {
        provider: 'webhook',
        enabled: true,
        webhookUrl: process.env.CRM_WEBHOOK_URL,
      });
    }

    logger.info(`CRM integration initialized with ${this.configs.size} providers`);
  }

  /**
   * Sync lead to HubSpot
   */
  private async syncToHubSpot(lead: Lead): Promise<string | null> {
    const config = this.configs.get('hubspot');
    if (!config?.enabled) return null;

    try {
      const response = await axios.post(
        `${config.apiUrl}/crm/v3/objects/contacts`,
        {
          properties: {
            email: lead.email,
            firstname: lead.firstName,
            lastname: lead.lastName,
            phone: lead.phone,
            company: lead.company,
            hs_lead_status: this.mapStatusToHubSpot(lead.status),
            lifecyclestage: 'lead',
            lead_source: lead.source,
            message: lead.message,
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.id;
    } catch (error: any) {
      logger.error('HubSpot sync error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Sync lead to Salesforce
   */
  private async syncToSalesforce(lead: Lead): Promise<string | null> {
    const config = this.configs.get('salesforce');
    if (!config?.enabled) return null;

    try {
      const response = await axios.post(
        `${config.instanceUrl}/services/data/v58.0/sobjects/Lead`,
        {
          FirstName: lead.firstName,
          LastName: lead.lastName || 'Unknown',
          Email: lead.email,
          Phone: lead.phone,
          Company: lead.company || 'Unknown',
          Status: this.mapStatusToSalesforce(lead.status),
          LeadSource: lead.source,
          Description: lead.message,
        },
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.id;
    } catch (error: any) {
      logger.error('Salesforce sync error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Sync lead to Pipedrive
   */
  private async syncToPipedrive(lead: Lead): Promise<string | null> {
    const config = this.configs.get('pipedrive');
    if (!config?.enabled) return null;

    try {
      // Create person
      const personResponse = await axios.post(
        `${config.apiUrl}/persons?api_token=${config.apiKey}`,
        {
          name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown',
          email: [{ value: lead.email, primary: true }],
          phone: [{ value: lead.phone, primary: true }],
        }
      );

      const personId = personResponse.data.data.id;

      // Create deal
      const dealResponse = await axios.post(
        `${config.apiUrl}/deals?api_token=${config.apiKey}`,
        {
          title: `Lead: ${lead.firstName || 'Unknown'} - ${lead.source}`,
          person_id: personId,
          value: lead.budget?.max || 0,
          status: 'open',
        }
      );

      return dealResponse.data.data.id;
    } catch (error: any) {
      logger.error('Pipedrive sync error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Send to webhook
   */
  private async sendToWebhook(lead: Lead): Promise<boolean> {
    const config = this.configs.get('webhook');
    if (!config?.enabled || !config.webhookUrl) return false;

    try {
      await axios.post(config.webhookUrl, {
        event: 'lead.created',
        timestamp: new Date().toISOString(),
        data: lead,
      });
      return true;
    } catch (error: any) {
      logger.error('Webhook error:', error.message);
      return false;
    }
  }

  /**
   * Sync lead to all configured CRMs
   */
  async syncLead(lead: Lead): Promise<Record<string, string | null>> {
    const results: Record<string, string | null> = {};

    if (this.configs.has('hubspot')) {
      results.hubspot = await this.syncToHubSpot(lead);
    }

    if (this.configs.has('salesforce')) {
      results.salesforce = await this.syncToSalesforce(lead);
    }

    if (this.configs.has('pipedrive')) {
      results.pipedrive = await this.syncToPipedrive(lead);
    }

    if (this.configs.has('webhook')) {
      results.webhook = (await this.sendToWebhook(lead)) ? 'sent' : null;
    }

    return results;
  }

  private mapStatusToHubSpot(status: LeadStatus): string {
    const mapping: Record<LeadStatus, string> = {
      new: 'NEW',
      contacted: 'ATTEMPTED_TO_CONTACT',
      qualified: 'CONNECTED',
      negotiating: 'IN_PROGRESS',
      won: 'CLOSED_WON',
      lost: 'CLOSED_LOST',
      nurturing: 'OPEN',
    };
    return mapping[status] || 'NEW';
  }

  private mapStatusToSalesforce(status: LeadStatus): string {
    const mapping: Record<LeadStatus, string> = {
      new: 'Open - Not Contacted',
      contacted: 'Working - Contacted',
      qualified: 'Qualified',
      negotiating: 'Working - Contacted',
      won: 'Closed - Converted',
      lost: 'Closed - Not Converted',
      nurturing: 'Open - Not Contacted',
    };
    return mapping[status] || 'Open - Not Contacted';
  }
}

// ============================================================================
// LEAD CAPTURE SERVICE
// ============================================================================

export class LeadCaptureService {
  private scoringEngine: LeadScoringEngine;
  private crmIntegration: CRMIntegration;

  constructor() {
    this.scoringEngine = new LeadScoringEngine();
    this.crmIntegration = new CRMIntegration();
  }

  /**
   * Create a new lead
   */
  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const lead: Lead = {
      id: uuidv4(),
      source: leadData.source || 'manual',
      type: leadData.type || (leadData.message
        ? this.scoringEngine.classifyLeadType(leadData.message)
        : 'unknown'),
      status: 'new',
      score: 0,
      ...leadData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Calculate score
    lead.score = this.scoringEngine.calculateScore(lead);

    // Check for duplicates
    const existingLead = await this.findDuplicate(lead);
    if (existingLead) {
      return this.mergeLead(existingLead, lead);
    }

    // Save to database
    const { error } = await supabase.from('leads').insert({
      id: lead.id,
      organization_id: lead.organizationId,
      source: lead.source,
      source_id: lead.sourceId,
      deal_id: lead.dealId,
      post_id: lead.postId,
      type: lead.type,
      status: lead.status,
      score: lead.score,
      first_name: lead.firstName,
      last_name: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      message: lead.message,
      interested_in: lead.interestedIn,
      budget: lead.budget,
      location: lead.location,
      tags: lead.tags,
      notes: lead.notes,
      assigned_to: lead.assignedTo,
      metadata: lead.metadata,
      created_at: lead.createdAt?.toISOString(),
      updated_at: lead.updatedAt?.toISOString(),
    });

    if (error) {
      logger.error('Error creating lead:', error);
      throw error;
    }

    // Log activity
    await this.logActivity(lead.id!, 'created', 'Lead created');

    // Sync to CRM
    if (process.env.AUTO_CRM_SYNC === 'true') {
      const crmResults = await this.crmIntegration.syncLead(lead);
      lead.crmSynced = Object.values(crmResults).some(r => r !== null);
      if (lead.crmSynced) {
        await this.updateLead(lead.id!, { crmSynced: true, crmId: Object.values(crmResults).find(r => r) || undefined });
      }
    }

    logger.info(`Lead created: ${lead.id} (score: ${lead.score})`);
    return lead;
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Convert camelCase to snake_case
    if (updates.firstName) updateData.first_name = updates.firstName;
    if (updates.lastName) updateData.last_name = updates.lastName;
    if (updates.interestedIn) updateData.interested_in = updates.interestedIn;
    if (updates.assignedTo) updateData.assigned_to = updates.assignedTo;
    if (updates.lastContactedAt) updateData.last_contacted_at = updates.lastContactedAt;
    if (updates.nextFollowUpAt) updateData.next_follow_up_at = updates.nextFollowUpAt;
    if (updates.crmSynced) updateData.crm_synced = updates.crmSynced;
    if (updates.crmId) updateData.crm_id = updates.crmId;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating lead:', error);
      return null;
    }

    // Log status change
    if (updates.status) {
      await this.logActivity(id, 'status_change', `Status changed to ${updates.status}`);
    }

    return this.mapRowToLead(data);
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string): Promise<Lead | null> {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapRowToLead(data);
  }

  /**
   * List leads with filtering
   */
  async listLeads(options: {
    status?: LeadStatus;
    source?: LeadSource;
    type?: LeadType;
    minScore?: number;
    assignedTo?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ leads: Lead[]; total: number }> {
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (options.status) query = query.eq('status', options.status);
    if (options.source) query = query.eq('source', options.source);
    if (options.type) query = query.eq('type', options.type);
    if (options.minScore) query = query.gte('score', options.minScore);
    if (options.assignedTo) query = query.eq('assigned_to', options.assignedTo);
    if (options.search) {
      query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%,phone.ilike.%${options.search}%`);
    }

    query = query.order('created_at', { ascending: false });
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

    const { data, count, error } = await query;

    if (error) {
      logger.error('Error listing leads:', error);
      return { leads: [], total: 0 };
    }

    return {
      leads: (data || []).map(row => this.mapRowToLead(row)),
      total: count || 0,
    };
  }

  /**
   * Find duplicate lead by email or phone
   */
  private async findDuplicate(lead: Lead): Promise<Lead | null> {
    const conditions: string[] = [];
    if (lead.email) conditions.push(`email.eq.${lead.email}`);
    if (lead.phone) conditions.push(`phone.eq.${lead.phone}`);

    if (conditions.length === 0) return null;

    const { data } = await supabase
      .from('leads')
      .select('*')
      .or(conditions.join(','))
      .single();

    return data ? this.mapRowToLead(data) : null;
  }

  /**
   * Merge new lead data into existing lead
   */
  private async mergeLead(existing: Lead, newLead: Lead): Promise<Lead> {
    const merged: Partial<Lead> = {
      message: newLead.message
        ? `${existing.message || ''}\n\n---\n${newLead.message}`
        : existing.message,
      score: Math.max(existing.score, newLead.score),
      metadata: { ...existing.metadata, ...newLead.metadata },
    };

    // Update missing fields
    if (!existing.firstName && newLead.firstName) merged.firstName = newLead.firstName;
    if (!existing.lastName && newLead.lastName) merged.lastName = newLead.lastName;
    if (!existing.email && newLead.email) merged.email = newLead.email;
    if (!existing.phone && newLead.phone) merged.phone = newLead.phone;

    await this.logActivity(existing.id!, 'note', `Merged with duplicate from ${newLead.source}`);

    return (await this.updateLead(existing.id!, merged)) || existing;
  }

  /**
   * Log lead activity
   */
  async logActivity(
    leadId: string,
    type: LeadActivity['type'],
    description: string,
    metadata?: Record<string, any>,
    createdBy?: string
  ): Promise<void> {
    try {
      await supabase.from('lead_activities').insert({
        id: uuidv4(),
        lead_id: leadId,
        type,
        description,
        metadata,
        created_by: createdBy,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error logging activity:', error);
    }
  }

  /**
   * Get lead activities
   */
  async getActivities(leadId: string): Promise<LeadActivity[]> {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching activities:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      leadId: row.lead_id,
      type: row.type,
      description: row.description,
      metadata: row.metadata,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }));
  }

  /**
   * Get lead statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<LeadStatus, number>;
    bySource: Record<LeadSource, number>;
    byType: Record<LeadType, number>;
    averageScore: number;
    conversionRate: number;
  }> {
    const { data: leads } = await supabase.from('leads').select('status, source, type, score');

    if (!leads || leads.length === 0) {
      return {
        total: 0,
        byStatus: {} as Record<LeadStatus, number>,
        bySource: {} as Record<LeadSource, number>,
        byType: {} as Record<LeadType, number>,
        averageScore: 0,
        conversionRate: 0,
      };
    }

    const byStatus: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let totalScore = 0;
    let wonCount = 0;

    for (const lead of leads) {
      byStatus[lead.status] = (byStatus[lead.status] || 0) + 1;
      bySource[lead.source] = (bySource[lead.source] || 0) + 1;
      byType[lead.type] = (byType[lead.type] || 0) + 1;
      totalScore += lead.score || 0;
      if (lead.status === 'won') wonCount++;
    }

    return {
      total: leads.length,
      byStatus: byStatus as Record<LeadStatus, number>,
      bySource: bySource as Record<LeadSource, number>,
      byType: byType as Record<LeadType, number>,
      averageScore: Math.round(totalScore / leads.length),
      conversionRate: Math.round((wonCount / leads.length) * 100),
    };
  }

  /**
   * Map database row to Lead
   */
  private mapRowToLead(row: any): Lead {
    return {
      id: row.id,
      organizationId: row.organization_id,
      source: row.source,
      sourceId: row.source_id,
      dealId: row.deal_id,
      postId: row.post_id,
      type: row.type,
      status: row.status,
      score: row.score,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      message: row.message,
      interestedIn: row.interested_in,
      budget: row.budget,
      location: row.location,
      tags: row.tags,
      notes: row.notes,
      assignedTo: row.assigned_to,
      metadata: row.metadata,
      crmSynced: row.crm_synced,
      crmId: row.crm_id,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
      updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
      lastContactedAt: row.last_contacted_at ? new Date(row.last_contacted_at) : undefined,
      nextFollowUpAt: row.next_follow_up_at ? new Date(row.next_follow_up_at) : undefined,
    };
  }
}

// Export singleton
export const leadCaptureService = new LeadCaptureService();

/**
 * Create a lead from Instagram DM
 */
export async function createLeadFromInstagramDM(
  senderId: string,
  message: string,
  postId?: string
): Promise<Lead> {
  return leadCaptureService.createLead({
    source: 'instagram_dm',
    sourceId: senderId,
    postId,
    message,
  });
}

/**
 * Create a lead from landing page
 */
export async function createLeadFromLandingPage(formData: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  message?: string;
  dealId?: string;
  budget?: { min?: number; max?: number };
}): Promise<Lead> {
  return leadCaptureService.createLead({
    source: 'landing_page',
    ...formData,
  });
}
