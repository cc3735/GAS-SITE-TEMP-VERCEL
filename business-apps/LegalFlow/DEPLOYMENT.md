# LegalFlow Deployment Guide

## Overview

LegalFlow is a full-stack application with:
- **Frontend**: React + Vite (SPA deployed to Vercel)
- **Backend**: Express + Node.js (should be deployed separately for production)
- **Database**: Supabase (hosted)

## Frontend Deployment (Vercel)

### Prerequisites
1. Push code to GitHub
2. Have a Vercel account linked to your GitHub organization

### Steps
1. **Connect to Vercel**:
   - Go to [https://vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the project

2. **Configure Environment Variables** in Vercel Dashboard:
   ```
   VITE_API_URL=https://your-backend-api.com
   ```
   
   Update this to your actual backend API URL after deploying the backend.

3. **Deploy**:
   - Vercel will automatically build and deploy on each push to main branch
   - Deployment status: Check https://vercel.com/dashboard

4. **Custom Domain (Optional)**:
   - Go to Project Settings > Domains
   - Add your custom domain

## Backend Deployment

### For Development (Current Setup)
- Running on `localhost:3002`
- Use `npm run dev` to start development server

### For Production

The backend can be deployed to several platforms:

#### Option 1: Railway (Recommended)
1. Go to [https://railway.app](https://railway.app)
2. Import GitHub repository
3. Railway will auto-detect Node.js project
4. Set environment variables in dashboard
5. Deploy

#### Option 2: Render
1. Go to [https://render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub repo
4. Set build command: `npm install && npm run build`
5. Set start command: `npm run start`
6. Deploy

#### Option 3: Heroku
1. Create Heroku app: `heroku create legalflow-api`
2. Set environment variables: `heroku config:set ...`
3. Deploy: `git push heroku main`

### Required Backend Environment Variables
```
NODE_ENV=production
PORT=3002 (or port assigned by host)
SUPABASE_URL=<from Supabase dashboard>
SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
OPENAI_API_KEY=<your OpenAI key>
OPENAI_MODEL=gpt-4-turbo-preview
STRIPE_SECRET_KEY=<your Stripe secret>
STRIPE_PUBLISHABLE_KEY=<your Stripe publishable>
STRIPE_WEBHOOK_SECRET=<your Stripe webhook secret>
JWT_SECRET=<generate a strong random string, min 32 chars>
JWT_EXPIRES_IN=7d
ENCRYPTION_KEY=<generate a 32-character key>
ALLOWED_ORIGINS=https://your-vercel-frontend.vercel.app
```

## Database Setup (Supabase)

### Already Configured
- Schema created and migrated
- RLS policies enabled
- Tables: bank_statements, plaid_transactions, bank_statement_transactions, etc.

### To Reset Database
```bash
npm run db:generate  # Generate TypeScript types
```

## Post-Deployment Checklist

- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to production platform
- [ ] Backend URL configured in frontend env vars
- [ ] Environment variables set in all services
- [ ] Supabase database accessible
- [ ] Test user accounts created
- [ ] Email/notification setup (optional)
- [ ] Domain DNS configured (if using custom domains)
- [ ] Monitoring/logging configured
- [ ] Backup strategy in place

## Monitoring & Logs

### Frontend (Vercel)
- View deployment logs: Project Dashboard > Analytics
- Monitor errors: Analytics > Web Vitals

### Backend
- Check logs from your deployment platform
- Set up error tracking with Sentry (recommended)
- Monitor database with Supabase dashboard

## Troubleshooting

### Frontend Not Loading Backend
- Check `VITE_API_URL` environment variable
- Make sure backend CORS allows frontend origin
- Check network tab in browser DevTools

### Database Connection Errors
- Verify Supabase credentials
- Check RLS policies if `SELECT` queries return empty
- Ensure service role key is used for admin operations

### Build Failures
- Check Node version compatibility (recommended: 20.x)
- Verify all dependencies are installed
- Check build logs for TypeScript errors

## Security Notes

⚠️ **IMPORTANT**: Never commit `.env` files with real credentials
- Use Vercel/platform environment variable management
- Rotate sensitive keys regularly
- Enable Supabase API key management

## Support

For issues:
1. Check application logs
2. Review [Supabase documentation](https://supabase.com/docs)
3. Check deployment platform docs

---

**Last Updated**: March 1, 2026
