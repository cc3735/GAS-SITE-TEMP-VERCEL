import { useState, useEffect } from 'react';
import { Alert } from '../types/missionControl';

export function useAlertSystem(organizationId: string) {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);

  useEffect(() => {
    // Mock data
    setActiveAlerts([
      {
        id: '1',
        alertType: 'agent_failure',
        severity: 'critical',
        title: 'Voice Agent API Timeout',
        message: 'The voice agent service is not responding.',
        isAcknowledged: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        alertType: 'high_priority',
        severity: 'high',
        title: 'VIP Customer Negative Sentiment',
        message: 'Customer expressed dissatisfaction in thread #123.',
        isAcknowledged: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
      }
    ]);
  }, [organizationId]);

  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== alertId));
    // Move to history
  };

  return { activeAlerts, alertHistory, acknowledgeAlert };
}
