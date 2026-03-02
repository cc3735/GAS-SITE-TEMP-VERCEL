# LegalFlow - Next Steps to Get Up and Running

## ✅ Completed: Full Stack Integration

### What's Been Accomplished
- ✅ **Database**: Supabase schema created with all tables, RLS policies, and seed data
- ✅ **Backend**: Express API with all bookkeeping routes (upload, fetch, summary)
- ✅ **Frontend**: React pages for bookkeeping (accounts, upload, transactions, reports)
- ✅ **Authentication**: JWT token verification with Supabase integration
- ✅ **File Upload**: Bank statement CSV upload and parsing
- ✅ **Testing**: All endpoints tested and working locally
- ✅ **Documentation**: DEPLOYMENT.md created with deployment guides

---

## 🚀 Next Steps for Production Deployment

### 1. Backend Deployment (Choose ONE)

#### Option A: Railway (Recommended - Easiest)
```bash
# No local setup needed - deploy from GitHub
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your LegalFlow repository
4. Add environment variables (see DEPLOYMENT.md)
5. Auto-deploy on push
```

#### Option B: Render
```bash
1. Go to https://render.com
2. Create new "Web Service"
3. Connect GitHub repository
4. Set build command: npm install && npm run build
5. Set start command: npm run start
```

### 2. Frontend Deployment (Vercel)

```bash
# Already configured with vercel.json
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Environment variables will be auto-detected
4. Click "Deploy"
5. Configure VITE_API_URL to point to your backend
```

---

## ⚙️ Environment Variables Needed

Create `.env` file with:

```env
# Backend Server
NODE_ENV=production
PORT=3002

# Supabase (get from Supabase Dashboard → Settings → API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4-turbo-preview

# Stripe (optional - get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_webhook-secret

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=your-32-character-minimum-jwt-secret
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# Frontend
VITE_API_URL=https://your-backend-url.com

# CORS
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

**Tip:** Generate random keys with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚀 Step 2: Install Dependencies & Start Backend

```bash
cd business-apps/LegalFlow
npm install
npm run dev
```

The API server will start at: **http://localhost:3002**

You should see:
```
🚀 LegalFlow API server running on port 3002
📚 Environment: development
🔐 Auth: Supabase + JWT
💳 Payments: Stripe
🤖 AI: OpenAI gpt-4-turbo-preview
```

---

## 🚀 Step 3: Install & Start Frontend

```bash
cd business-apps/LegalFlow/frontend
npm install
npm run dev
```

The frontend will start at: **http://localhost:5173**

---

## 🧪 Step 4: Test the API

### Health Check
```bash
curl http://localhost:3002/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "LegalFlow API",
  "version": "1.0.0",
  "timestamp": "2024-12-28T..."
}
```

### Test Child Support Calculator (No Auth Required)
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

### Test User Registration
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

### Get Legal Disclaimer
```bash
curl http://localhost:3002/api/disclaimer
```

---

## 💳 Step 5: Set Up Stripe (For Payments)

### Create Products in Stripe Dashboard

1. Go to **Stripe Dashboard → Products**
2. Create these products:

**Basic Subscription**
- Name: "LegalFlow Basic"
- Price: $19/month (recurring)

**Premium Subscription**  
- Name: "LegalFlow Premium"
- Price: $49/month (recurring)

3. Copy the Price IDs and add to `.env`:
```env
STRIPE_PRICE_BASIC_MONTHLY=price_xxxxx
STRIPE_PRICE_PREMIUM_MONTHLY=price_xxxxx
```

### Set Up Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Add endpoint: `https://your-domain.com/api/payments/webhook`
   - For local testing, use Stripe CLI: `stripe listen --forward-to localhost:3002/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 📋 Step 6: Verify Database Seed Data

Run these queries in **Supabase SQL Editor** to confirm data was seeded:

```sql
-- Check federal tax brackets (should be ~28)
SELECT COUNT(*) as federal_brackets FROM lf_federal_tax_brackets;

-- Check federal deductions (should be ~11)
SELECT COUNT(*) as federal_deductions FROM lf_federal_deductions;

-- Check federal credits (should be ~11)
SELECT COUNT(*) as federal_credits FROM lf_federal_credits;

-- Check tax forms (should be ~30)
SELECT COUNT(*) as tax_forms FROM lf_tax_forms;

-- Check state tax configs (should be 51 - all states + DC)
SELECT COUNT(*) as state_tax_configs FROM lf_state_tax_config;

-- Check child support guidelines (should be 51)
SELECT COUNT(*) as child_support_guidelines FROM lf_child_support_guidelines;

-- Check business formation requirements (should be 51)
SELECT COUNT(*) as business_formation FROM lf_business_formation_requirements;

-- Check legal filing requirements (should be ~150+)
SELECT COUNT(*) as filing_requirements FROM lf_filing_requirements;
```

### Quick Summary Query
```sql
SELECT 
  (SELECT COUNT(*) FROM lf_federal_tax_brackets) as federal_brackets,
  (SELECT COUNT(*) FROM lf_state_tax_config) as state_configs,
  (SELECT COUNT(*) FROM lf_child_support_guidelines) as child_support,
  (SELECT COUNT(*) FROM lf_business_formation_requirements) as business_formation,
  (SELECT COUNT(*) FROM lf_filing_requirements) as filing_requirements;
```

---

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### "Invalid API key" from OpenAI
- Verify your `OPENAI_API_KEY` is correct
- Check that your OpenAI account has credits

### "Database connection failed"
- Verify `SUPABASE_URL` and keys are correct
- Check that all migrations were run successfully

### "Stripe webhook signature verification failed"
- Ensure `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint
- For local testing, use Stripe CLI

### Port already in use
```bash
# Find and kill process on port 3002
npx kill-port 3002
```

---

## 📚 Additional Resources

- **API Reference:** `docs/API_REFERENCE.md`
- **Architecture Guide:** `docs/ARCHITECTURE.md`
- **Security Guide:** `docs/SECURITY.md`
- **Setup Guide:** `docs/SETUP_GUIDE.md`

---

## 🎯 What's Next After Setup?

1. **Test all API endpoints** using the test commands above
2. **Create a test user account** and explore the dashboard
3. **Try the child support calculator** with different state codes
4. **Set up Stripe** for payment processing
5. **Deploy to production** (Vercel for frontend, Railway/Render for backend)

---

## 🚀 Production Deployment Checklist

- [ ] All environment variables set in production
- [ ] Using production Stripe keys (`sk_live_*`)
- [ ] HTTPS enabled
- [ ] `ALLOWED_ORIGINS` configured correctly
- [ ] Rate limiting configured
- [ ] Database RLS policies active
- [ ] Stripe webhooks configured for production URL
- [ ] Error monitoring set up (e.g., Sentry)
- [ ] Logging configured for production

---

**Questions?** Check the docs folder or review the codebase structure in `README.md`.

