/**
 * Form Validation Utilities
 * 
 * Provides validation functions for contact form fields including
 * email, phone, company name normalization, and complete form validation.
 * 
 * @module lib/validation
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Contact form data for validation
 */
export interface ContactFormValidation {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
  painPoint?: string;
  timeline?: string;
}

/**
 * Validate email format using regex
 * 
 * @param email - Email address to validate
 * @returns True if valid email format
 * 
 * @example
 * validateEmail('test@example.com') // true
 * validateEmail('invalid-email') // false
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate US phone number (10 digits)
 * 
 * @param phone - Phone number to validate
 * @returns True if valid 10-digit US phone number
 * 
 * @example
 * validatePhone('(555) 123-4567') // true
 * validatePhone('5551234567') // true
 * validatePhone('123') // false
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // US phone numbers should have 10 digits
  return digits.length === 10;
}

/**
 * Format phone number to (XXX) XXX-XXXX format
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number or original if invalid
 * 
 * @example
 * formatPhone('5551234567') // '(555) 123-4567'
 * formatPhone('555123') // '555123' (incomplete, returned as-is)
 */
export function formatPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Format as user types
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  
  // Max 10 digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

/**
 * Normalize company name for consistency
 * - Removes extra whitespace
 * - Standardizes common suffixes (Inc., LLC, Corp., Ltd.)
 * 
 * @param company - Company name to normalize
 * @returns Normalized company name
 * 
 * @example
 * normalizeCompanyName('Acme  inc') // 'Acme Inc.'
 * normalizeCompanyName('Test Company llc') // 'Test Company LLC'
 */
export function normalizeCompanyName(company: string): string {
  if (!company || typeof company !== 'string') return company;
  
  return company
    .trim()
    .replace(/\s+/g, ' ') // Remove extra whitespace
    .replace(/\b(inc|incorporated)\b\.?/gi, 'Inc.')
    .replace(/\bllc\b\.?/gi, 'LLC')
    .replace(/\b(ltd|limited)\b\.?/gi, 'Ltd.')
    .replace(/\b(corp|corporation)\b\.?/gi, 'Corp.')
    .replace(/\bco\b\.?/gi, 'Co.')
    .replace(/\s+\./g, '.'); // Clean up space before period
}

/**
 * Validate complete contact form data
 * 
 * @param data - Form data to validate
 * @returns Validation result with isValid flag and errors object
 * 
 * @example
 * const result = validateContactForm({
 *   name: 'John',
 *   email: 'john@example.com',
 *   service: 'Email Automation',
 *   message: 'I need help with automation'
 * });
 * 
 * if (!result.isValid) {
 *   console.log(result.errors); // { message: 'Message must be at least 10 characters' }
 * }
 */
export function validateContactForm(data: ContactFormValidation): ValidationResult {
  const errors: Record<string, string> = {};

  // Name validation - required, min 2 characters
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  // Email validation - required, valid format
  if (!data.email || !data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Phone validation - optional, but if provided must be valid 10-digit
  if (data.phone && data.phone.trim()) {
    if (!validatePhone(data.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
    }
  }

  // Company name - optional, no validation errors (just normalization)
  // Normalization happens in the service layer

  // Service validation - required
  if (!data.service || data.service.trim().length === 0) {
    errors.service = 'Please select a service';
  }

  // Message validation - required, 10-2000 characters
  const messageLength = data.message?.trim().length || 0;
  if (messageLength < 10) {
    errors.message = 'Message must be at least 10 characters';
  } else if (messageLength > 2000) {
    errors.message = 'Message must be less than 2000 characters';
  }

  // Pain point validation - optional, but if provided should have some content
  if (data.painPoint && data.painPoint.trim().length > 0 && data.painPoint.trim().length < 3) {
    errors.painPoint = 'Please provide more detail about your pain point';
  }

  // Timeline - optional, no validation needed

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if a field has an error
 * Helper function for form field styling
 * 
 * @param errors - Errors object from validation
 * @param field - Field name to check
 * @returns True if field has an error
 */
export function hasError(errors: Record<string, string>, field: string): boolean {
  return field in errors && errors[field].length > 0;
}

/**
 * Get error message for a field
 * 
 * @param errors - Errors object from validation
 * @param field - Field name to get error for
 * @returns Error message or empty string
 */
export function getError(errors: Record<string, string>, field: string): string {
  return errors[field] || '';
}

