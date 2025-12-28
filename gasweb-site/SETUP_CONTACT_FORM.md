# Contact Form CRM Integration Setup

This document provides step-by-step instructions for completing the contact form integration with the CRM.

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Access to Supabase project dashboard
- Resend account for email notifications

## Setup Steps

### 1. Run Database Migration

Apply the migration to create the form record and RLS policies:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project → SQL Editor
2. Open `project/supabase/migrations/20251227000000_create_contact_form_and_rls.sql`
3. Copy and paste the contents
4. Click "Run"

**Option B: Via Supabase CLI**
```bash
cd project
supabase db push
```

### 2. Configure Email Service (Resend)

1. Create an account at [resend.com](https://resend.com) (free tier available)
2. Create an API key
3. Verify your domain (gasweb.info) or use the test domain

### 3. Set Edge Function Secrets

In Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
# Or via CLI
supabase secrets set RESEND_API_KEY=re_your_api_key_here
supabase secrets set CRM_URL=https://your-crm-url.com
```

| Secret | Required | Description |
|--------|----------|-------------|
| `RESEND_API_KEY` | Yes | Your Resend API key |
| `CRM_URL` | No | URL to your CRM (for email links) |

### 4. Deploy Edge Function

```bash
cd project
supabase functions deploy submit-contact-form
```

Verify deployment:
```bash
supabase functions list
```

### 5. Test the Integration

**Test in Development Mode:**
1. Start the gasweb-site dev server: `npm run dev`
2. Navigate to `/contact`
3. Fill out and submit the form
4. Check console for success response
5. Verify in Supabase:
   - `contacts` table has new record
   - `form_submissions` table has new record

**Test Email Notifications:**
1. Submit form with `isTestMode: false` (production build)
2. Check email inboxes for chris@gasweb.info and jarvis@gasweb.info

### 6. Verify Everything Works

Run through this checklist:

- [ ] Form submission creates contact in CRM
- [ ] Duplicate email updates existing contact
- [ ] Company name creates/matches company record
- [ ] Lead score is calculated correctly
- [ ] Email notifications are sent (production only)
- [ ] Form shows success message
- [ ] Validation errors display correctly
- [ ] Phone number formats as user types

## Troubleshooting

### Edge Function Not Found

```bash
# Check if function is deployed
supabase functions list

# Redeploy
supabase functions deploy submit-contact-form
```

### Database Errors

```bash
# Check if migration ran
SELECT * FROM forms WHERE name = 'Contact Form';

# If not, run the migration manually
```

### Email Not Sending

1. Check RESEND_API_KEY is set correctly
2. Verify domain is verified in Resend
3. Check Edge Function logs:
```bash
supabase functions logs submit-contact-form
```

### CORS Errors

The Edge Function allows all origins by default. If you need to restrict:

1. Edit `project/supabase/functions/submit-contact-form/index.ts`
2. Change `'Access-Control-Allow-Origin': '*'` to your domain
3. Redeploy

## Files Created/Modified

### New Files

- `gasweb-site/src/lib/contactService.ts` - Form submission service
- `gasweb-site/src/lib/validation.ts` - Form validation utilities
- `gasweb-site/src/lib/analytics.ts` - Analytics tracking
- `project/supabase/functions/submit-contact-form/index.ts` - Edge Function
- `project/supabase/functions/submit-contact-form/README.md` - Function docs
- `project/supabase/migrations/20251227000000_create_contact_form_and_rls.sql` - Database setup

### Modified Files

- `gasweb-site/src/pages/Contact.tsx` - Enhanced contact form

## Architecture

```
gasweb-site (React)           project/supabase
┌─────────────────────┐       ┌─────────────────────┐
│  Contact.tsx        │       │  Edge Function      │
│  ├─ validation.ts   │──────▶│  submit-contact-form│
│  ├─ analytics.ts    │       │  ├─ Find/Create Co. │
│  └─ contactService.ts│      │  ├─ Find/Create Con.│
└─────────────────────┘       │  ├─ Create Submiss. │
                              │  ├─ Create Activity │
                              │  └─ Send Emails     │
                              └─────────────────────┘
                                        │
                              ┌─────────▼─────────┐
                              │  Supabase DB      │
                              │  ├─ contacts      │
                              │  ├─ companies     │
                              │  ├─ forms         │
                              │  ├─ form_submiss. │
                              │  └─ activities    │
                              └───────────────────┘
```

## Support

If you encounter issues, check:
1. Edge Function logs: `supabase functions logs submit-contact-form`
2. Browser console for client-side errors
3. Supabase dashboard for database records

