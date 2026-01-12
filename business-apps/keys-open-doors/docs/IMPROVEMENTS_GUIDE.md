# Keys Open Doors - Improvements Guide

## Overview

This guide covers the enhanced features added to the Keys Open Doors real estate automation platform:

1. **Multi-Platform Social Media Posting** - Post deals to Instagram, Facebook, TikTok, LinkedIn, and Twitter
2. **Multiple Deal Sources** - Aggregate deals from InvestorLift, Connected Investors, PropStream, and more
3. **Lead Capture & CRM Integration** - Capture and manage leads from various sources with CRM sync

---

## Table of Contents

1. [Multi-Platform Posting](#multi-platform-posting)
2. [Deal Source Aggregation](#deal-source-aggregation)
3. [Lead Capture System](#lead-capture-system)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)

---

## Multi-Platform Posting

### Supported Platforms

| Platform | Features | Limits |
|----------|----------|--------|
| Instagram | Single image, Carousel | 2,200 chars, 30 hashtags, 10 images |
| Facebook | Single/Multi photo | 63,206 chars, 10 images |
| TikTok | Photo carousel | 2,200 chars, 35 images |
| LinkedIn | Multi-image posts | 3,000 chars, 5 hashtags, 9 images |
| Twitter/X | Text posts | 280 chars, 5 hashtags, 4 images |

### Usage

```typescript
import { postDealToAllPlatforms, postDealToPlatforms } from './services/multi-platform-poster';

// Post to all enabled platforms
const result = await postDealToAllPlatforms(deal);

// Post to specific platforms
const result = await postDealToPlatforms(deal, ['instagram', 'facebook']);

// With custom caption
const result = await postDealToAllPlatforms(deal, 'Check out this amazing deal! 🏠');
```

### API Endpoints

```bash
# Get enabled platforms
GET /api/social-platforms

# Post to all platforms
POST /api/social-platforms/post
{
  "dealId": "deal-uuid",
  "customCaption": "Optional custom caption"
}

# Post to specific platform
POST /api/social-platforms/post/instagram
{
  "dealId": "deal-uuid"
}

# Bulk post multiple deals
POST /api/social-platforms/bulk-post
{
  "dealIds": ["deal-1", "deal-2"],
  "platforms": ["instagram", "facebook"]
}

# Preview optimized caption
POST /api/social-platforms/preview-caption
{
  "dealId": "deal-uuid",
  "platform": "twitter"
}

# Get posting history
GET /api/social-platforms/history
GET /api/social-platforms/history/:dealId

# Get analytics
GET /api/social-platforms/analytics
```

### Caption Optimization

Captions are automatically optimized for each platform:
- Character limits respected
- Hashtag counts adjusted
- Long content truncated with ellipsis
- Platform-specific formatting applied

```typescript
const optimized = multiPlatformPoster.optimizeCaptionForPlatform(caption, 'twitter');
// Original: 500 character caption with 20 hashtags
// Optimized: 280 characters with 5 hashtags
```

---

## Deal Source Aggregation

### Supported Sources

| Source | Type | Authentication |
|--------|------|----------------|
| InvestorLift | Web scraping | Username/Password |
| Connected Investors | API + Scraping | API Key or Username/Password |
| PropStream | API | API Key |
| Tax Delinquent | Public records | None |
| Foreclosure | Public records | None |

### Usage

```typescript
import { runAllScrapers, runScraper } from './services/deal-sources';

// Run all configured scrapers
const results = await runAllScrapers();

// Run specific scraper
const result = await runScraper('propstream');
```

### Scraping Results

```typescript
interface ScrapingResult {
  source: DealSource;
  success: boolean;
  dealsFound: number;
  dealsSaved: number;
  duplicatesSkipped: number;
  errors: string[];
  duration: number;
}
```

### Deal Scoring

Each deal receives a score (0-100) based on:

| Factor | Points |
|--------|--------|
| Price to ARV spread ≥40% | +30 |
| Price to ARV spread ≥30% | +20 |
| Price to ARV spread ≥20% | +10 |
| 5+ images | +10 |
| 1-4 images | +5 |
| Bedrooms/bathrooms listed | +5 |
| Square footage listed | +5 |
| Year built listed | +3 |
| Description provided | +2 |

### Deduplication

Deals are automatically deduplicated by:
- Address matching (case-insensitive)
- City and state matching
- Existing deals are skipped, new deals are saved

---

## Lead Capture System

### Lead Sources

| Source | Description |
|--------|-------------|
| `instagram_dm` | Instagram Direct Messages |
| `facebook_messenger` | Facebook Messenger |
| `landing_page` | Website lead forms |
| `sms` | Text message inquiries |
| `whatsapp` | WhatsApp messages |
| `email` | Email inquiries |
| `phone_call` | Phone call leads |
| `referral` | Referral from existing contact |
| `manual` | Manually entered |

### Lead Scoring

Leads are automatically scored (0-100):

| Factor | Points |
|--------|--------|
| Has email | +15 |
| Has phone | +15 |
| Has budget specified | +15 |
| Message >200 characters | +10 |
| Message >50 characters | +5 |
| Contains investor keywords | Up to +10 |
| Contains urgency keywords | Up to +5 |
| References specific deal | +10 |
| Lead type: Investor | +10 |
| Lead type: Buyer | +8 |
| Lead type: Seller | +5 |
| Previous interaction | +10 |

### Lead Classification

Leads are automatically classified based on message content:

- **Investor**: Contains "invest", "flip", "wholesale", "rental", "portfolio"
- **Buyer**: Contains "buy", "purchase", "looking for", "interested in"
- **Seller**: Contains "sell", "selling", "my property", "my house"
- **Agent**: Contains "agent", "realtor", "broker", "represent"
- **Unknown**: No clear indicators

### CRM Integration

Supports automatic sync to:

| CRM | Features |
|-----|----------|
| HubSpot | Contacts, properties, lifecycle stages |
| Salesforce | Leads with status mapping |
| Pipedrive | Persons and Deals |
| Custom Webhook | Full lead data via HTTP POST |

### Usage

```typescript
import { leadCaptureService, createLeadFromLandingPage } from './services/lead-capture';

// Create from landing page
const lead = await createLeadFromLandingPage({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '+15555555555',
  message: 'I want to invest in wholesale properties',
  budget: { min: 100000, max: 300000 }
});

// Lead is auto-scored, classified, and synced to CRM
console.log(lead.score);  // 65
console.log(lead.type);   // 'investor'
```

### API Endpoints

```bash
# List leads
GET /api/leads?status=new&minScore=50&limit=25

# Get lead statistics
GET /api/leads/stats

# Create lead manually
POST /api/leads
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "message": "Interested in your properties"
}

# Capture from Instagram DM
POST /api/leads/capture/instagram
{
  "senderId": "instagram-user-id",
  "message": "Is this deal still available?",
  "postId": "post-id"
}

# Capture from landing page
POST /api/leads/capture/landing-page
{
  "firstName": "Jane",
  "email": "jane@example.com",
  "dealId": "deal-uuid",
  "budget": { "min": 150000, "max": 250000 }
}

# Update lead status
POST /api/leads/:id/status
{
  "status": "qualified",
  "notes": "Verified cash buyer"
}

# Schedule follow-up
POST /api/leads/:id/follow-up
{
  "date": "2024-02-15T14:00:00Z",
  "notes": "Call to discuss deal"
}

# Get lead activities
GET /api/leads/:id/activities

# Sync to CRM
POST /api/leads/:id/sync-crm
```

---

## API Reference

### Social Platforms

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/social-platforms` | List enabled platforms |
| GET | `/api/social-platforms/:platform/limits` | Get platform limits |
| POST | `/api/social-platforms/post` | Post to platforms |
| POST | `/api/social-platforms/post/:platform` | Post to specific platform |
| POST | `/api/social-platforms/preview-caption` | Preview optimized caption |
| GET | `/api/social-platforms/history` | Get posting history |
| POST | `/api/social-platforms/bulk-post` | Bulk post deals |
| GET | `/api/social-platforms/analytics` | Get posting analytics |

### Leads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/leads` | List leads with filtering |
| GET | `/api/leads/stats` | Get lead statistics |
| GET | `/api/leads/:id` | Get specific lead |
| POST | `/api/leads` | Create lead |
| PATCH | `/api/leads/:id` | Update lead |
| POST | `/api/leads/:id/status` | Update status |
| POST | `/api/leads/:id/contact` | Record contact |
| POST | `/api/leads/:id/assign` | Assign to team member |
| POST | `/api/leads/:id/follow-up` | Schedule follow-up |
| GET | `/api/leads/:id/activities` | Get activity history |
| POST | `/api/leads/:id/note` | Add note |
| POST | `/api/leads/capture/instagram` | Capture from Instagram |
| POST | `/api/leads/capture/landing-page` | Capture from form |
| POST | `/api/leads/capture/sms` | Capture from SMS |
| POST | `/api/leads/capture/email` | Capture from email |
| POST | `/api/leads/:id/sync-crm` | Sync to CRM |

---

## Configuration

### Environment Variables

```env
# Multi-Platform Posting
INSTAGRAM_ACCESS_TOKEN=your_instagram_token
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id

FACEBOOK_ACCESS_TOKEN=your_facebook_token
FACEBOOK_PAGE_ID=your_page_id

TIKTOK_ACCESS_TOKEN=your_tiktok_token
TIKTOK_OPEN_ID=your_tiktok_open_id

LINKEDIN_ACCESS_TOKEN=your_linkedin_token
LINKEDIN_ORGANIZATION_ID=your_org_id

TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Deal Sources
INVESTORLIFT_USERNAME=your_username
INVESTORLIFT_PASSWORD=your_password

CONNECTED_INVESTORS_API_KEY=your_api_key
CONNECTED_INVESTORS_USERNAME=your_username
CONNECTED_INVESTORS_PASSWORD=your_password

PROPSTREAM_API_KEY=your_propstream_key

ENABLE_TAX_DELINQUENT=true

# Filters
FILTER_STATES=TX,FL,GA,NC
FILTER_MIN_PRICE=50000
FILTER_MAX_PRICE=500000

# CRM Integration
HUBSPOT_API_KEY=your_hubspot_key

SALESFORCE_ACCESS_TOKEN=your_salesforce_token
SALESFORCE_INSTANCE_URL=https://your-instance.salesforce.com

PIPEDRIVE_API_KEY=your_pipedrive_key

CRM_WEBHOOK_URL=https://your-webhook.com/leads

AUTO_CRM_SYNC=true
```

---

## Database Schema

### New Tables

```sql
-- Social media posts tracking
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES scraped_deals(id),
  platform VARCHAR(50) NOT NULL,
  post_id VARCHAR(255),
  post_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  source VARCHAR(50) NOT NULL,
  source_id VARCHAR(255),
  deal_id UUID,
  post_id VARCHAR(255),
  type VARCHAR(50) DEFAULT 'unknown',
  status VARCHAR(50) DEFAULT 'new',
  score INTEGER DEFAULT 0,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  message TEXT,
  interested_in JSONB,
  budget JSONB,
  location JSONB,
  tags JSONB,
  notes TEXT,
  assigned_to UUID,
  metadata JSONB,
  crm_synced BOOLEAN DEFAULT FALSE,
  crm_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contacted_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ
);

-- Lead activities
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  metadata JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add source column to scraped_deals
ALTER TABLE scraped_deals ADD COLUMN source VARCHAR(50) DEFAULT 'investorlift';
ALTER TABLE scraped_deals ADD COLUMN source_id VARCHAR(255);
ALTER TABLE scraped_deals ADD COLUMN deal_score INTEGER;
ALTER TABLE scraped_deals ADD COLUMN county VARCHAR(100);
ALTER TABLE scraped_deals ADD COLUMN lot_size INTEGER;
ALTER TABLE scraped_deals ADD COLUMN year_built INTEGER;
ALTER TABLE scraped_deals ADD COLUMN property_type VARCHAR(100);
ALTER TABLE scraped_deals ADD COLUMN seller_info JSONB;
ALTER TABLE scraped_deals ADD COLUMN repair_cost NUMERIC;
ALTER TABLE scraped_deals ADD COLUMN metadata JSONB;

-- Indexes
CREATE INDEX idx_social_posts_deal_id ON social_posts(deal_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-01-12 | Added multi-platform posting, deal sources, lead capture |
| 1.0.0 | Initial | Instagram posting, InvestorLift scraping |
