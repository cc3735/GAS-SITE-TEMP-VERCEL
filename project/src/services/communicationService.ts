import { supabase } from '../lib/supabase';
import { Message } from '../types/missionControl';

export class CommunicationService {
  async sendMessage(
    threadId: string,
    channel: 'email' | 'sms' | 'social' | 'voice',
    content: string,
    senderType: 'human' | 'ai_agent',
    organizationId: string
  ): Promise<Message | null> {
    
    // 1. Insert message into DB
    const { data: message, error } = await supabase
      .from('communication_messages')
      .insert({
        organization_id: organizationId,
        thread_id: threadId,
        channel,
        direction: 'outbound',
        sender_type: senderType,
        body: content,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    // 2. Update thread status/last_message
    await supabase
      .from('communication_threads')
      .update({
        last_message_at: new Date().toISOString(),
        status: senderType === 'human' ? 'assigned' : 'open' // Example logic
      })
      .eq('id', threadId);

    // 3. Trigger actual sending logic (e.g., via Edge Function or API)
    // await sendViaProvider(channel, content, ...);

    return message as any; // Type casting for now
  }

  async escalateThread(threadId: string, reason: string): Promise<void> {
    await supabase
      .from('communication_threads')
      .update({
        escalation_queue: true,
        priority: 'high',
        metadata: { escalation_reason: reason }
      })
      .eq('id', threadId);
  }

  async handoffToHuman(threadId: string, summary: string): Promise<void> {
     await supabase
      .from('communication_threads')
      .update({
        human_online_status: true, // Assuming checking this before calling
        handoff_summary: summary,
        assigned_agent_id: null // Unassign agent
      })
      .eq('id', threadId);
  }
}

export const communicationService = new CommunicationService();
