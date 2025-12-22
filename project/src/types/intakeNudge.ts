export interface LeadIntakeEvent {
  id: string;
  eventType: string;
  source: string;
  intentCategory: 'high_value' | 'window_shopper' | 'engaged' | 'browsing';
  intentScore: number;
  eventData: any;
  createdAt: string;
}

export interface LeadState {
  id: string;
  customerProfileId: string;
  currentState: 'new' | 'engaged' | 'ghosting' | 'converted' | 'lost';
  engagementScore: number;
  ghostingStartedAt?: string;
  nudgeAttempts: number;
  lastActivityAt: string;
}

export interface NudgeCampaign {
  id: string;
  name: string;
  description?: string;
  triggerState: string;
  delayHours: number;
  channel: 'email' | 'sms' | 'both';
  contentTemplate: {
    subject?: string;
    body: string;
  };
  isActive: boolean;
  totalSent: number;
  totalConverted: number;
}

export interface NudgeExecution {
  id: string;
  campaignId?: string;
  channel: string;
  status: string;
  sentAt: string;
  openedAt?: string;
  convertedAt?: string;
}
