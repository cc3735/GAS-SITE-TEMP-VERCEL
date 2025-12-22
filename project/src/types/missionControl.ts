export interface AgentPerformance {
  agentId: string;
  agentName: string;
  status: 'active' | 'idle' | 'processing' | 'paused' | 'error' | 'offline';
  statusContext: string;
  activeConversations: number;
  successRate: number;
  avgResponseTime: number;
  costPerInteraction: number;
  customerSatisfaction: number;
  lastActivity: string;
}

export interface Thread {
  id: string;
  customerProfileId?: string;
  contactId?: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  channel: 'email' | 'sms' | 'social' | 'voice' | 'mixed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'resolved' | 'archived';
  assignedAgentId?: string;
  humanOnlineStatus: boolean;
  escalationQueue: boolean;
  handoffSummary?: string;
}

export interface Message {
  id: string;
  threadId: string;
  channel: string;
  direction: 'inbound' | 'outbound';
  senderType: 'customer' | 'ai_agent' | 'human';
  senderId?: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

export interface Alert {
  id: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  context?: any;
  isAcknowledged: boolean;
  createdAt: string;
}

export interface CustomerProfile {
  id: string;
  primaryEmail?: string;
  primaryPhone?: string;
  primaryName?: string;
  identityConfidenceScore: number;
  lifetimeValue: number;
  totalOrders: number;
  lastActiveAt?: string;
  status: string;
  tags?: string[];
  identityLinks?: IdentityLink[];
}

export interface IdentityLink {
  id: string;
  platform: string;
  platformId: string;
  platformUsername?: string;
  verificationStatus: string;
}

export interface CustomerJourneyEvent {
  id: string;
  eventType: string;
  platform: string;
  title: string;
  description?: string;
  occurredAt: string;
  metadata?: any;
}

export interface InboxFilters {
  channels?: string[];
  status?: string[];
  agentType?: string;
  priority?: string[];
}

export type SortOption = 'recent' | 'oldest' | 'priority' | 'value';
