# LegalFlow Setup Guide

## Prerequisites

- Node.js 20.x or higher
- npm or yarn
- A Supabase account and project
- A Stripe account (for payments)
- An OpenAI API key (for AI features)

## Quick Start

### 1. Clone and Install

```bash
cd business-apps/LegalFlow
npm install
```

### 2. Environment Configuration

Copy the environment template:

```bash
cp env.example .env
```

Edit `.env` with your credentials:

```env
# Server
PORT=3002
NODE_ENV=development

# Supabase (get from Supabase Dashboard > Settings > API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# Stripe
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret

# JWT
JWT_SECRET=your-32-character-minimum-secret

# Encryption (for SSN and sensitive data)
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 3. Database Setup

Run all migrations in order in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration file **in order**:

| Order | Migration File | Description |
|-------|----------------|-------------|
| 1 | `001_initial_schema.sql` | Core tables (users, tax returns, legal documents, etc.) |
| 2 | `002_data_ingestion_schema.sql` | Data tables for tax/legal reference data |
| 3 | `003_seed_federal_tax_data.sql` | 2024 federal tax brackets, deductions, credits |
| 4 | `004_seed_state_tax_data.sql` | All 50 states tax configurations and brackets |
| 5 | `005_seed_child_support_data.sql` | Child support guidelines for all 50 states |
| 6 | `006_seed_business_formation_data.sql` | LLC/Corp formation requirements by state |
| 7 | `007_seed_legal_filing_requirements.sql` | Divorce filing requirements by state |

**Important:** Run migrations in sequential order as later migrations depend on earlier ones.

```bash
# Each migration is a separate SQL file - copy/paste contents into SQL Editor
# and execute one at a time
```

After running all migrations, verify the data was seeded correctly:

```sql
-- Check record counts
SELECT 'Federal Tax Brackets' as table_name, COUNT(*) as count FROM lf_federal_tax_brackets
UNION ALL
SELECT 'State Tax Configs', COUNT(*) FROM lf_state_tax_config
UNION ALL
SELECT 'Child Support Guidelines', COUNT(*) FROM lf_child_support_guidelines
UNION ALL
SELECT 'Business Formation', COUNT(*) FROM lf_business_formation_requirements
UNION ALL
SELECT 'Filing Requirements', COUNT(*) FROM lf_filing_requirements;
```

### 4. Start the Server

```bash
# Development with hot reload
npm run dev

# Production build
npm run build
npm start
```

The API server will start at `http://localhost:3002`

## Stripe Configuration

### Create Products and Prices

1. Go to Stripe Dashboard > Products
2. Create the following products and prices:

**Basic Subscription**
- Product: "LegalFlow Basic"
- Price: $19/month recurring

**Premium Subscription**
- Product: "LegalFlow Premium"  
- Price: $49/month recurring

3. Add price IDs to your `.env`:

```env
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
```

### Webhook Setup

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

## Testing

### Health Check

```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "LegalFlow API",
  "version": "1.0.0"
}
```

### Create Test User

```bash
curl -X POST http://localhost:3002/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Child Support Calculator

```bash
curl -X POST http://localhost:3002/api/child-support/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "stateCode": "CA",
    "calculationType": "initial",
    "parent1Data": {
      "grossMonthlyIncome": 5000,
      "otherIncome": 0,
      "healthInsuranceCost": 200,
      "childCareCost": 0,
      "otherChildSupport": 0,
      "overnightsPerYear": 100,
      "deductions": []
    },
    "parent2Data": {
      "grossMonthlyIncome": 3000,
      "otherIncome": 0,
      "healthInsuranceCost": 0,
      "childCareCost": 500,
      "otherChildSupport": 0,
      "overnightsPerYear": 265,
      "deductions": []
    },
    "childrenData": [
      {
        "dateOfBirth": "2018-05-15",
        "specialNeeds": false,
        "healthInsuranceCoveredBy": "parent1"
      }
    ]
  }'
```

## Production Deployment

### Environment Variables

Ensure all environment variables are set in your production environment:

- Use strong, unique secrets for `JWT_SECRET` and `ENCRYPTION_KEY`
- Use production Stripe keys (`sk_live_*` and `pk_live_*`)
- Update `ALLOWED_ORIGINS` with your frontend domain

### Recommended Platforms

- **Backend**: Railway, Render, or Fly.io
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Database**: Supabase (managed PostgreSQL)

### Security Checklist

- [ ] All secrets are stored securely (not in code)
- [ ] HTTPS is enabled
- [ ] Rate limiting is configured
- [ ] CORS is restricted to your domains
- [ ] Database RLS policies are active
- [ ] Stripe webhook signature verification is enabled

## Troubleshooting

### Common Issues

**"Invalid API key" error from OpenAI**
- Verify your `OPENAI_API_KEY` is correct
- Check that your OpenAI account has credits

**"Database connection failed"**
- Verify `SUPABASE_URL` and keys are correct
- Check that the migration has been run

**"Stripe webhook signature verification failed"**
- Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- For local testing, use Stripe CLI to forward webhooks

### Getting Help

- Check the [API Reference](API_REFERENCE.md) for endpoint details
- Review [Architecture Guide](ARCHITECTURE.md) for system overview
- For security concerns, see [Security Guide](SECURITY.md)

