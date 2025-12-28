# Submit Contact Form Edge Function

This Edge Function handles contact form submissions from gasweb.info and integrates with the CRM database.

## Features

- Creates/updates contacts in CRM database
- Matches or creates companies based on company name
- Creates form submission records
- Calculates lead scores
- Sends email notifications to team members
- Captures IP geolocation data
- Supports test mode (no emails in development)

## Configuration

### Required Environment Variables

Set these in Supabase Dashboard → Settings → Edge Functions → Secrets:

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | API key from [resend.com](https://resend.com) for email notifications |
| `CRM_URL` | No | Base URL for CRM links in notification emails (default: `https://your-crm.com`) |

### Auto-provided Variables (by Supabase)

These are automatically available in Edge Functions:

- `SUPABASE_URL` - Project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access

## Deployment

### 1. Deploy the function

```bash
cd project
supabase functions deploy submit-contact-form
```

### 2. Verify deployment

```bash
supabase functions list
```

### 3. Test the function

```bash
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-contact-form' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "formData": {
      "name": "Test User",
      "email": "test@example.com",
      "service": "Email Automation",
      "message": "This is a test submission.",
      "isTestMode": true
    },
    "metadata": {
      "userAgent": "curl",
      "referrer": "",
      "url": "https://gasweb.info/contact"
    }
  }'
```

## Database Requirements

The function requires these tables (already in migrations):

- `contacts` - Contact records
- `companies` - Company records
- `forms` - Form definitions
- `form_submissions` - Form submission records
- `activities` - Activity/note records

Run the migration to set up the Contact Form record:

```sql
-- In Supabase SQL Editor
-- Run: project/supabase/migrations/20251227000000_create_contact_form_and_rls.sql
```

## Lead Scoring

Points are calculated as follows:

| Criteria | Points |
|----------|--------|
| Company provided | +10 |
| Phone provided | +5 |
| Message > 100 chars | +10 |
| Service ≠ General Inquiry | +15 |
| Pain point provided | +5 |
| Timeline: Immediate | +20 |
| Timeline: Short-term | +10 |
| **Max Score** | **100** |

## Email Notifications

Notifications are sent to:
- chris@gasweb.info
- jarvis@gasweb.info

### Email Content

The notification email includes:
- Contact name, email, phone, company
- Location (from IP geolocation)
- Service interest
- Pain point and timeline (if provided)
- Full message
- Link to CRM contact record
- Badge indicating new vs returning contact

### Skipped in Test Mode

When `isTestMode: true`, emails are not sent. This is automatically enabled in development.

## Error Handling

The function handles errors gracefully:

- Returns structured JSON error responses
- Logs errors to console for debugging
- Doesn't expose sensitive details to clients
- Continues with submission even if email fails

## Response Format

### Success Response

```json
{
  "success": true,
  "contactId": "uuid",
  "submissionId": "uuid",
  "companyId": "uuid or null",
  "isDuplicate": false
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message"
}
```

## CORS

The function allows requests from any origin (`*`). For production, you may want to restrict this to your domain.

## Troubleshooting

### Common Issues

1. **"Missing required fields"** - Ensure name, email, service, and message are provided
2. **"Failed to create contact"** - Check database permissions and RLS policies
3. **"Form not found"** - Run the database migration to create the form record
4. **No email received** - Verify RESEND_API_KEY is set correctly

### Checking Logs

```bash
supabase functions logs submit-contact-form
```

### Verifying Secrets

```bash
supabase secrets list
```

