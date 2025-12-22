import { useState, useEffect } from 'react';
import { CustomerProfile, IdentityLink, CustomerJourneyEvent } from '../types/missionControl';

export function useCustomerProfile(customerProfileId: string, organizationId: string) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [identityLinks, setIdentityLinks] = useState<IdentityLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setProfile({
      id: customerProfileId,
      primaryName: 'Alice Johnson',
      primaryEmail: 'alice@example.com',
      primaryPhone: '+15551234567',
      identityConfidenceScore: 0.95,
      lifetimeValue: 1250.00,
      totalOrders: 12,
      lastActiveAt: new Date().toISOString(),
      status: 'active',
      tags: ['vip', 'early-adopter']
    });

    setIdentityLinks([
      { id: '1', platform: 'shopify', platformId: 'cust_123', verificationStatus: 'verified' },
      { id: '2', platform: 'instagram', platformId: 'alice.j', platformUsername: '@alice.j', verificationStatus: 'verified' },
      { id: '3', platform: 'email', platformId: 'alice@example.com', verificationStatus: 'verified' }
    ]);
    
    setLoading(false);
  }, [customerProfileId, organizationId]);

  return { profile, identityLinks, loading };
}

export function useCustomerJourney(customerProfileId: string) {
  const [events, setEvents] = useState<CustomerJourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setEvents([
      {
        id: '1',
        eventType: 'purchase',
        platform: 'shopify',
        title: 'Order Placed #1024',
        description: 'Purchased 2 items for $150.00',
        occurredAt: new Date().toISOString()
      },
      {
        id: '2',
        eventType: 'form_submit',
        platform: 'website',
        title: 'Submitted Contact Form',
        description: 'Inquiry about bulk pricing',
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
      },
      {
        id: '3',
        eventType: 'email_open',
        platform: 'email',
        title: 'Opened Marketing Email',
        description: 'Summer Sale Newsletter',
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
      }
    ]);
    setLoading(false);
  }, [customerProfileId]);

  return { events, loading };
}
