import { useState, useEffect } from 'react';
import { Thread, InboxFilters, SortOption } from '../types/missionControl';

export function useUnifiedInbox(
  organizationId: string,
  filters: InboxFilters,
  searchQuery: string,
  sortBy: SortOption
) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        // Mock data
        const mockThreads: Thread[] = [
          {
            id: '1',
            customerName: 'Alice Johnson',
            lastMessage: 'I need help with my order #12345',
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
            unreadCount: 1,
            channel: 'sms',
            priority: 'high',
            status: 'open',
            humanOnlineStatus: true,
            escalationQueue: false
          },
          {
            id: '2',
            customerName: 'Bob Smith',
            lastMessage: 'Thanks for the update!',
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
            unreadCount: 0,
            channel: 'email',
            priority: 'medium',
            status: 'resolved',
            humanOnlineStatus: true,
            escalationQueue: false
          },
          {
            id: '3',
            customerName: 'Charlie Brown',
            lastMessage: 'Can I speak to a human?',
            lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
            unreadCount: 2,
            channel: 'voice',
            priority: 'urgent',
            status: 'assigned',
            assignedAgentId: 'agent-1',
            humanOnlineStatus: false,
            escalationQueue: true,
            handoffSummary: 'Customer is frustrated with voice bot loop.'
          }
        ];
        setThreads(mockThreads);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [organizationId, filters, searchQuery, sortBy]);

  return { threads, loading, error, refetch: () => {} };
}
