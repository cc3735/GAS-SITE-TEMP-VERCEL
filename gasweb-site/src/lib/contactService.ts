/**
 * Contact Form Service
 * 
 * Handles contact form submissions, validation, and integration with CRM.
 * Submits to Supabase Edge Function for server-side processing.
 * 
 * @module lib/contactService
 */

import { supabase } from './supabase';

/**
 * Contact form data interface
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  painPoint?: string;
  timeline?: string;
  isTestMode?: boolean;
}

/**
 * Metadata collected with form submission
 */
export interface SubmissionMetadata {
  ipAddress: string | null;
  userAgent: string;
  referrer: string;
  url: string;
  utmParams: {
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    utm_term: string | null;
    utm_content: string | null;
  };
  timestamp: string;
}

/**
 * Result from form submission
 */
export interface ContactSubmissionResult {
  success: boolean;
  contactId?: string;
  submissionId?: string;
  companyId?: string;
  error?: string;
  isDuplicate?: boolean;
}

/**
 * Extract UTM parameters from current URL
 */
function getUtmParams(): SubmissionMetadata['utmParams'] {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'),
    utm_campaign: urlParams.get('utm_campaign'),
    utm_term: urlParams.get('utm_term'),
    utm_content: urlParams.get('utm_content'),
  };
}

/**
 * Get client IP address (approximation - real IP captured server-side)
 */
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();
    return data.ip;
  } catch {
    // Fallback - will be captured server-side from request headers
    return null;
  }
}

/**
 * Submit contact form to CRM via Edge Function
 * 
 * @param data - Form data from user
 * @returns Submission result with contact and submission IDs
 * 
 * @example
 * const result = await submitContactForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   service: 'Email Automation',
 *   message: 'I need help with...'
 * });
 */
export async function submitContactForm(
  data: ContactFormData
): Promise<ContactSubmissionResult> {
  try {
    // Get IP address (non-blocking if fails)
    const ipAddress = await getClientIP();

    // Collect metadata
    const metadata: SubmissionMetadata = {
      ipAddress,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      utmParams: getUtmParams(),
      timestamp: new Date().toISOString(),
    };

    // Call Supabase Edge Function
    const { data: result, error } = await supabase.functions.invoke(
      'submit-contact-form',
      {
        body: {
          formData: data,
          metadata,
        },
      }
    );

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to submit form. Please try again.',
      };
    }

    if (!result?.success) {
      return {
        success: false,
        error: result?.error || 'Failed to submit form. Please try again.',
      };
    }

    return {
      success: true,
      contactId: result.contactId,
      submissionId: result.submissionId,
      companyId: result.companyId,
      isDuplicate: result.isDuplicate,
    };
  } catch (error) {
    console.error('Unexpected error submitting form:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * Track form analytics event
 * Used for form_started, form_completed, form_abandoned events
 * 
 * @param eventType - Type of form event
 * @param formData - Optional partial form data for context
 */
export async function trackFormEvent(
  eventType: 'form_started' | 'form_completed' | 'form_abandoned',
  formData?: Partial<ContactFormData>
): Promise<void> {
  try {
    // Track in Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventType, {
        event_category: 'contact_form',
        event_label: formData?.service || 'unknown',
        value: eventType === 'form_completed' ? 1 : 0,
      });
    }

    // Could also track in Supabase if we have an analytics table
    // For now, we'll rely on form_submissions for completed forms
    console.log(`[Analytics] ${eventType}`, formData);
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the form
    console.error('Error tracking form event:', error);
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

