/**
 * Modular Email Service Interface
 */

export interface EmailMessage {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
  }
  
  export interface EmailProvider {
    name: string;
    sendEmail(message: EmailMessage): Promise<{ success: boolean; id?: string; error?: any }>;
  }
  
  /**
   * Console Provider: Logs emails to the browser console (Default for Dev/Demo)
   */
  export class ConsoleEmailProvider implements EmailProvider {
    name = 'Console Logger';
  
    async sendEmail(message: EmailMessage): Promise<{ success: boolean; id?: string }> {
      console.group('📧 [Email Simulation] Sending Email...');
      console.log('To:', message.to);
      console.log('Subject:', message.subject);
      console.log('Body Preview:', message.html.substring(0, 100) + '...');
      console.groupEnd();
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      return { success: true, id: `mock-email-${Date.now()}` };
    }
  }
  
  /**
   * Resend Provider: Implementation for Resend.com (Requires API Key)
   * Note: In a client-side app, this should be called via Supabase Edge Function 
   * to keep the API key secure.
   */
  export class ResendEmailProvider implements EmailProvider {
    name = 'Resend';
    private apiKey: string;
  
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
  
    async sendEmail(message: EmailMessage): Promise<{ success: boolean; id?: string; error?: any }> {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            from: message.from || 'onboarding@resend.dev', // Use your verified domain
            to: message.to,
            subject: message.subject,
            html: message.html
          })
        });
  
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to send email');
        
        return { success: true, id: data.id };
      } catch (error: any) {
        console.error('Resend Error:', error);
        return { success: false, error: error.message };
      }
    }
  }
  
  /**
   * Email Service Singleton
   * Manages the active provider.
   */
  class EmailService {
    private provider: EmailProvider;
  
    constructor() {
      // Default to Console Provider for safety/demo
      this.provider = new ConsoleEmailProvider();
    }
  
    // Switch provider (e.g., if user adds an API key in settings)
    setProvider(provider: EmailProvider) {
      this.provider = provider;
    }
  
    async send(message: EmailMessage) {
      return this.provider.sendEmail(message);
    }
  }
  
  export const emailService = new EmailService();
