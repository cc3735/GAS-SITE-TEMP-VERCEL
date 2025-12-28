/**
 * Submit Contact Form Edge Function
 * 
 * Handles contact form submissions from gasweb-site:
 * - Creates/updates contacts in CRM
 * - Matches or creates companies
 * - Creates form submissions
 * - Sends email notifications
 * - Handles IP geolocation
 * - Calculates lead scores
 * 
 * @module functions/submit-contact-form
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const GAS_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const NOTIFICATION_EMAILS = ['chris@gasweb.info', 'jarvis@gasweb.info'];

// Environment variables
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const CRM_URL = Deno.env.get('CRM_URL') || 'https://your-crm.com';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interfaces
interface ContactFormData {
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

interface RequestMetadata {
  ipAddress?: string | null;
  userAgent?: string;
  referrer?: string;
  url?: string;
  utmParams?: {
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
  };
  timestamp?: string;
}

interface GeolocationData {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

// Helper Functions

/**
 * Normalize company name for consistency and matching
 */
function normalizeCompanyName(company: string): string {
  return company
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(inc|incorporated)\b\.?/gi, 'Inc.')
    .replace(/\bllc\b\.?/gi, 'LLC')
    .replace(/\b(ltd|limited)\b\.?/gi, 'Ltd.')
    .replace(/\b(corp|corporation)\b\.?/gi, 'Corp.')
    .replace(/\bco\b\.?/gi, 'Co.')
    .replace(/\s+\./g, '.');
}

/**
 * Calculate lead score based on form data
 */
function calculateLeadScore(formData: ContactFormData, existingScore: number): number {
  let score = existingScore || 0;

  // +10 if company provided
  if (formData.company && formData.company.trim()) score += 10;
  
  // +5 if phone provided
  if (formData.phone && formData.phone.trim()) score += 5;
  
  // +10 if message > 100 characters
  if (formData.message && formData.message.length > 100) score += 10;
  
  // +15 if service is not General Inquiry
  if (formData.service && formData.service !== 'General Inquiry') score += 15;
  
  // +5 if pain point provided
  if (formData.painPoint && formData.painPoint.trim()) score += 5;
  
  // +20 if timeline is Immediate
  if (formData.timeline && formData.timeline.includes('Immediate')) score += 20;
  
  // +10 if timeline is Short-term
  else if (formData.timeline && formData.timeline.includes('Short-term')) score += 10;

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Get geolocation data from IP address
 */
async function getGeolocation(ip: string): Promise<GeolocationData> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === 'localhost') {
    return {};
  }

  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    
    if (!response.ok) {
      console.warn('Geolocation API returned non-OK status:', response.status);
      return {};
    }
    
    const data = await response.json();
    
    return {
      city: data.city || null,
      state: data.region || null,
      country: data.country_name || null,
    };
  } catch (error) {
    console.error('Geolocation error:', error);
    return {};
  }
}

/**
 * Send email notifications to team members
 */
async function sendEmailNotifications(data: {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  company?: string;
  service: string;
  message: string;
  painPoint?: string;
  timeline?: string;
  isDuplicate: boolean;
  contactId: string;
  geolocation: GeolocationData;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email notifications');
    return;
  }

  const locationParts = [data.geolocation.city, data.geolocation.state, data.geolocation.country]
    .filter(Boolean);
  const locationString = locationParts.length > 0 ? locationParts.join(', ') : 'Unknown';

  const emailBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb, #0891b2); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }
    .section { margin-bottom: 20px; }
    .section h3 { color: #1e40af; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
    .field { margin-bottom: 8px; }
    .field strong { color: #475569; }
    .message-box { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-new { background: #dcfce7; color: #166534; }
    .badge-returning { background: #fef3c7; color: #92400e; }
    .cta { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 15px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Contact Form Submission</h2>
      <span class="badge ${data.isDuplicate ? 'badge-returning' : 'badge-new'}">
        ${data.isDuplicate ? 'Returning Contact' : 'New Lead'}
      </span>
    </div>
    <div class="content">
      <div class="section">
        <h3>Contact Information</h3>
        <div class="field"><strong>Name:</strong> ${data.contactName}</div>
        <div class="field"><strong>Email:</strong> <a href="mailto:${data.contactEmail}">${data.contactEmail}</a></div>
        ${data.contactPhone ? `<div class="field"><strong>Phone:</strong> <a href="tel:${data.contactPhone}">${data.contactPhone}</a></div>` : ''}
        ${data.company ? `<div class="field"><strong>Company:</strong> ${data.company}</div>` : ''}
        <div class="field"><strong>Location:</strong> ${locationString}</div>
      </div>
      
      <div class="section">
        <h3>Inquiry Details</h3>
        <div class="field"><strong>Service Interest:</strong> ${data.service}</div>
        ${data.painPoint ? `<div class="field"><strong>Pain Point:</strong> ${data.painPoint}</div>` : ''}
        ${data.timeline ? `<div class="field"><strong>Timeline:</strong> ${data.timeline}</div>` : ''}
      </div>
      
      <div class="section">
        <h3>Message</h3>
        <div class="message-box">
          ${data.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <a href="${CRM_URL}/contacts/${data.contactId}" class="cta">View in CRM →</a>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Send to all notification emails in parallel
  const emailPromises = NOTIFICATION_EMAILS.map((email) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'GasWeb Contact Form <noreply@gasweb.info>',
        to: email,
        subject: `New Contact: ${data.contactName}${data.isDuplicate ? ' (Returning)' : ''} - ${data.service}`,
        html: emailBody,
      }),
    }).catch((error) => {
      console.error(`Failed to send email to ${email}:`, error);
      return null;
    })
  );

  await Promise.all(emailPromises);
}

// Main Handler
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { formData, metadata }: { formData: ContactFormData; metadata: RequestMetadata } = await req.json();

    // Validate required fields
    if (!formData.name || !formData.email || !formData.service || !formData.message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get real IP address from headers (Vercel/Cloudflare provide these)
    const realIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('x-real-ip') ||
                   req.headers.get('cf-connecting-ip') ||
                   metadata.ipAddress ||
                   'unknown';

    // Get geolocation
    const geolocation = await getGeolocation(realIP);

    // Parse name into first/last
    const nameParts = formData.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || null;

    // Normalize company name
    const normalizedCompany = formData.company
      ? normalizeCompanyName(formData.company)
      : null;

    // Find or create company
    let companyId: string | null = null;
    if (normalizedCompany) {
      // Try to find existing company (case-insensitive)
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('organization_id', GAS_ORG_ID)
        .ilike('name', normalizedCompany)
        .limit(1)
        .single();

      if (existingCompany) {
        companyId = existingCompany.id;
        console.log('Found existing company:', companyId);
      } else {
        // Create new company
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            organization_id: GAS_ORG_ID,
            name: normalizedCompany,
            city: geolocation.city || null,
            state: geolocation.state || null,
            country: geolocation.country || null,
            custom_fields: {
              source: 'website_form',
              created_from_form: true,
            },
          })
          .select('id')
          .single();

        if (companyError) {
          console.error('Error creating company:', companyError);
        } else {
          companyId = newCompany.id;
          console.log('Created new company:', companyId);
        }
      }
    }

    // Find existing contact by email
    const normalizedEmail = formData.email.toLowerCase().trim();
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone, company_id, lead_status, lead_score, custom_fields')
      .eq('organization_id', GAS_ORG_ID)
      .eq('email', normalizedEmail)
      .limit(1)
      .single();

    let contactId: string;
    let isDuplicate = false;

    if (existingContact) {
      // Update existing contact
      contactId = existingContact.id;
      isDuplicate = true;
      console.log('Found existing contact:', contactId);

      // Calculate updated lead score
      const leadScore = calculateLeadScore(formData, existingContact.lead_score || 0);

      // Merge custom fields
      const existingCustomFields = (existingContact.custom_fields as Record<string, unknown>) || {};
      
      const { error: updateError } = await supabase
        .from('contacts')
        .update({
          first_name: firstName,
          last_name: lastName || existingContact.last_name,
          phone: formData.phone || existingContact.phone || null,
          company_id: companyId || existingContact.company_id || null,
          lead_status: existingContact.lead_status === 'new' ? 'new' : 're-engaged',
          lead_score: leadScore,
          custom_fields: {
            ...existingCustomFields,
            latest_service_interest: formData.service,
            latest_message: formData.message,
            pain_point: formData.painPoint || existingCustomFields.pain_point,
            timeline: formData.timeline || existingCustomFields.timeline,
            source: 'website_form',
            utm_source: metadata.utmParams?.utm_source || existingCustomFields.utm_source,
            utm_medium: metadata.utmParams?.utm_medium || existingCustomFields.utm_medium,
            utm_campaign: metadata.utmParams?.utm_campaign || existingCustomFields.utm_campaign,
            last_form_submission: new Date().toISOString(),
            city: geolocation.city || existingCustomFields.city,
            state: geolocation.state || existingCustomFields.state,
            country: geolocation.country || existingCustomFields.country,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);

      if (updateError) {
        console.error('Error updating contact:', updateError);
      }
    } else {
      // Create new contact
      const leadScore = calculateLeadScore(formData, 0);

      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: GAS_ORG_ID,
          first_name: firstName,
          last_name: lastName,
          email: normalizedEmail,
          phone: formData.phone || null,
          company_id: companyId,
          lead_source: 'website_form',
          lead_status: 'new',
          lead_score: leadScore,
          tags: ['website_lead'],
          custom_fields: {
            service_interest: formData.service,
            message: formData.message,
            pain_point: formData.painPoint || null,
            timeline: formData.timeline || null,
            source: 'website_form',
            utm_source: metadata.utmParams?.utm_source || null,
            utm_medium: metadata.utmParams?.utm_medium || null,
            utm_campaign: metadata.utmParams?.utm_campaign || null,
            utm_term: metadata.utmParams?.utm_term || null,
            utm_content: metadata.utmParams?.utm_content || null,
            city: geolocation.city || null,
            state: geolocation.state || null,
            country: geolocation.country || null,
            ip_address: realIP,
            is_test: formData.isTestMode || false,
          },
        })
        .select('id')
        .single();

      if (contactError) {
        console.error('Error creating contact:', contactError);
        throw new Error(`Failed to create contact: ${contactError.message}`);
      }

      contactId = newContact.id;
      console.log('Created new contact:', contactId);
    }

    // Get or create form record
    let formId: string;
    const { data: existingForm } = await supabase
      .from('forms')
      .select('id')
      .eq('organization_id', GAS_ORG_ID)
      .eq('name', 'Contact Form')
      .limit(1)
      .single();

    if (existingForm) {
      formId = existingForm.id;
    } else {
      // Create form record if it doesn't exist
      const { data: newForm, error: formError } = await supabase
        .from('forms')
        .insert({
          organization_id: GAS_ORG_ID,
          name: 'Contact Form',
          description: 'Main contact form from gasweb.info',
          is_active: true,
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'phone', type: 'tel', required: false },
            { name: 'company', type: 'text', required: false },
            { name: 'service', type: 'select', required: true },
            { name: 'painPoint', type: 'select', required: false },
            { name: 'timeline', type: 'select', required: false },
            { name: 'message', type: 'textarea', required: true },
          ],
        })
        .select('id')
        .single();

      if (formError) {
        console.error('Error creating form:', formError);
        throw new Error('Form not found and could not be created');
      }
      formId = newForm.id;
      console.log('Created form record:', formId);
    }

    // Create form submission
    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        organization_id: GAS_ORG_ID,
        form_id: formId,
        contact_id: contactId,
        data: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          company: formData.company || null,
          service: formData.service,
          message: formData.message,
          painPoint: formData.painPoint || null,
          timeline: formData.timeline || null,
          isTestMode: formData.isTestMode || false,
        },
        ip_address: realIP,
        user_agent: metadata.userAgent || null,
        referrer: metadata.referrer || null,
      })
      .select('id')
      .single();

    if (submissionError) {
      console.error('Error creating submission:', submissionError);
      throw new Error(`Failed to create submission: ${submissionError.message}`);
    }

    console.log('Created form submission:', submission.id);

    // Create activity record
    const { error: activityError } = await supabase
      .from('activities')
      .insert({
        organization_id: GAS_ORG_ID,
        contact_id: contactId,
        company_id: companyId,
        activity_type: 'note',
        subject: `Website Form Submission: ${formData.service}`,
        description: `
Service: ${formData.service}
${formData.painPoint ? `Pain Point: ${formData.painPoint}` : ''}
${formData.timeline ? `Timeline: ${formData.timeline}` : ''}

Message:
${formData.message}
        `.trim(),
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

    if (activityError) {
      console.error('Error creating activity:', activityError);
      // Don't throw - activity is supplementary
    }

    // Send email notifications (skip in test mode)
    if (!formData.isTestMode) {
      await sendEmailNotifications({
        contactName: formData.name,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        company: normalizedCompany || undefined,
        service: formData.service,
        message: formData.message,
        painPoint: formData.painPoint,
        timeline: formData.timeline,
        isDuplicate,
        contactId,
        geolocation,
      });
    } else {
      console.log('Test mode - skipping email notifications');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        contactId,
        submissionId: submission.id,
        companyId,
        isDuplicate,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing form submission:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

