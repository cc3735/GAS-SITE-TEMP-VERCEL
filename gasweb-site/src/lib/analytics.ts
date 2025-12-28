/**
 * Analytics Tracking Module
 * 
 * Provides analytics tracking for form events and user interactions.
 * Integrates with Google Analytics when available.
 * 
 * @module lib/analytics
 */

/**
 * Analytics event types for contact form
 */
export type FormAnalyticsEvent =
  | 'form_started'
  | 'form_completed'
  | 'form_abandoned'
  | 'service_selected'
  | 'field_focused'
  | 'validation_error';

/**
 * General analytics event types
 */
export type AnalyticsEvent =
  | FormAnalyticsEvent
  | 'page_view'
  | 'button_click'
  | 'link_click';

/**
 * Properties that can be attached to analytics events
 */
export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Track an analytics event
 * 
 * Sends events to Google Analytics if configured.
 * All analytics failures are caught and logged - they should never break the app.
 * 
 * @param eventType - Type of event to track
 * @param properties - Optional properties to include with the event
 * 
 * @example
 * trackEvent('form_started');
 * trackEvent('service_selected', { service: 'Email Automation' });
 */
export function trackEvent(
  eventType: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  try {
    // Track in Google Analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventType, {
        event_category: getCategoryForEvent(eventType),
        ...properties,
      });
    }

    // Log in development for debugging
    if (import.meta.env.DEV) {
      console.log(`[Analytics] ${eventType}`, properties || {});
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break the app
    console.error('[Analytics] Error tracking event:', error);
  }
}

/**
 * Track form started event
 * Should be called when user first interacts with the form
 */
export function trackFormStarted(): void {
  trackEvent('form_started', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track form completed event
 * Should be called after successful form submission
 * 
 * @param service - The service selected by the user
 * @param hasCompany - Whether the user provided a company name
 * @param hasPhone - Whether the user provided a phone number
 */
export function trackFormCompleted(
  service: string,
  hasCompany: boolean,
  hasPhone: boolean
): void {
  trackEvent('form_completed', {
    service,
    has_company: hasCompany,
    has_phone: hasPhone,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track form abandoned event
 * Should be called when user leaves page without completing form
 * 
 * @param fieldsCompleted - Number of fields that were filled out
 */
export function trackFormAbandoned(fieldsCompleted: number): void {
  trackEvent('form_abandoned', {
    fields_completed: fieldsCompleted,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track service selection event
 * Should be called when user selects a service from the dropdown
 * 
 * @param service - The service selected
 */
export function trackServiceSelected(service: string): void {
  trackEvent('service_selected', {
    service,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track validation error event
 * Should be called when form validation fails
 * 
 * @param field - The field that failed validation
 * @param error - The error message
 */
export function trackValidationError(field: string, error: string): void {
  trackEvent('validation_error', {
    field,
    error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get event category for a given event type
 * Used for Google Analytics event categorization
 */
function getCategoryForEvent(eventType: AnalyticsEvent): string {
  switch (eventType) {
    case 'form_started':
    case 'form_completed':
    case 'form_abandoned':
    case 'service_selected':
    case 'field_focused':
    case 'validation_error':
      return 'contact_form';
    case 'page_view':
      return 'navigation';
    case 'button_click':
    case 'link_click':
      return 'engagement';
    default:
      return 'general';
  }
}

/**
 * Count completed fields in form data
 * Helper function for abandonment tracking
 * 
 * @param formData - Object containing form field values
 * @returns Number of non-empty fields
 */
export function countCompletedFields(formData: Record<string, unknown>): number {
  return Object.values(formData).filter((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'boolean') return true;
    return value !== null && value !== undefined;
  }).length;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

