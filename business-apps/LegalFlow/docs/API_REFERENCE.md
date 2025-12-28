# LegalFlow API Reference

Base URL: `http://localhost:3002/api` (development)

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/auth/signin` or `/api/auth/signup` endpoints.

---

## Auth Endpoints

### Sign Up
```http
POST /api/auth/signup
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "subscriptionTier": "free"
    },
    "token": "jwt-token"
  }
}
```

### Sign In
```http
POST /api/auth/signin
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Get Current User
```http
GET /api/auth/me
```
**Auth Required:** Yes

---

## Tax Endpoints

### List Tax Returns
```http
GET /api/tax/returns
```
**Auth Required:** Yes

### Create Tax Return
```http
POST /api/tax/returns
```

**Body:**
```json
{
  "taxYear": 2024,
  "filingStatus": "single"
}
```

### Get Tax Return
```http
GET /api/tax/returns/:id
```

### Update Tax Return
```http
PUT /api/tax/returns/:id
```

### Delete Tax Return
```http
DELETE /api/tax/returns/:id
```

### Start Tax Interview
```http
POST /api/tax/interview/start
```

**Body:**
```json
{
  "taxReturnId": "uuid"
}
```

### Submit Interview Answer
```http
POST /api/tax/interview/answer
```

**Body:**
```json
{
  "taxReturnId": "uuid",
  "questionId": "filing_status",
  "value": "single"
}
```

### Get AI Suggestions
```http
GET /api/tax/interview/suggestions/:taxReturnId
```
**Auth Required:** Yes (Premium tier recommended)

### Get Refund Estimate
```http
GET /api/tax/returns/:id/refund-estimate
```

### Validate Before Filing
```http
POST /api/tax/returns/:id/validate
```

### File Tax Return
```http
POST /api/tax/returns/:id/file
```

---

## Legal Document Endpoints

### List Documents
```http
GET /api/legal/documents?category=business&status=draft&limit=20&offset=0
```

### Create Document
```http
POST /api/legal/documents
```

**Body:**
```json
{
  "documentType": "llc_formation",
  "documentCategory": "business",
  "title": "My LLC Operating Agreement",
  "templateId": "uuid"
}
```

### Get Document
```http
GET /api/legal/documents/:id
```

### Update Document
```http
PUT /api/legal/documents/:id
```

**Body:**
```json
{
  "title": "Updated Title",
  "documentData": { "field": "value" },
  "status": "in_progress"
}
```

### Delete Document
```http
DELETE /api/legal/documents/:id
```

### Generate PDF
```http
POST /api/legal/documents/:id/generate-pdf
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdfBase64": "base64-encoded-pdf",
    "filename": "document.pdf"
  }
}
```

### AI Customize Document
```http
POST /api/legal/documents/:id/ai-customize
```
**Auth Required:** Yes (Premium tier)

**Body:**
```json
{
  "customizations": "Add a non-compete clause for 2 years"
}
```

---

## Legal Templates Endpoints

### List Templates
```http
GET /api/legal/templates?category=business&search=llc
```

### Get Template
```http
GET /api/legal/templates/:id
```

---

## Business Formation Endpoints

### Get Entity Recommendation
```http
POST /api/legal/business/recommend-entity
```

**Body:**
```json
{
  "businessType": "consulting",
  "numberOfOwners": 1,
  "expectedRevenue": 100000,
  "needsInvestors": false,
  "liabilityProtection": true,
  "taxPreference": "pass_through",
  "state": "CA"
}
```

### Start LLC Formation
```http
POST /api/legal/business/llc
```

**Body:**
```json
{
  "businessName": "My Company",
  "state": "CA",
  "purpose": "Software development services",
  "members": [
    {
      "name": "John Doe",
      "ownershipPercentage": 100
    }
  ]
}
```

### Start Corporation Formation
```http
POST /api/legal/business/corporation
```

### Get State Requirements
```http
GET /api/legal/business/requirements/:state?entityType=llc
```

---

## Legal Filing Endpoints

### List Filings
```http
GET /api/filing?status=draft&type=name_change
```

### Get Filing Types
```http
GET /api/filing/types
```

### Start New Filing
```http
POST /api/filing/start
```

**Body:**
```json
{
  "filingType": "name_change",
  "jurisdictionState": "CA",
  "jurisdictionCounty": "Los Angeles"
}
```

### Get Filing
```http
GET /api/filing/:id
```

### Update Filing
```http
PUT /api/filing/:id
```

### Delete Filing
```http
DELETE /api/filing/:id
```

### Get Filing Status
```http
GET /api/filing/:id/status
```

### Get Generated Forms
```http
GET /api/filing/:id/forms
```

### Generate Forms
```http
POST /api/filing/:id/generate-forms
```

---

## Filing Interview Endpoints

### Start Interview
```http
GET /api/filing/interview/:filingId/start
```

### Submit Answer
```http
POST /api/filing/interview/:filingId/answer
```

**Body:**
```json
{
  "questionId": "current_first_name",
  "value": "John"
}
```

### Get AI Clarification
```http
POST /api/filing/interview/:filingId/clarify
```

**Body:**
```json
{
  "questionId": "reason_for_change",
  "userQuestion": "What reasons are acceptable for a name change?"
}
```

---

## Child Support Calculator Endpoints

### Calculate Support
```http
POST /api/child-support/calculate
```

**Body:**
```json
{
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
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "netSupportAmount": 850,
      "payingParent": "parent1",
      "combinedIncome": 8000,
      "parent1IncomePercentage": 62,
      "parent2IncomePercentage": 38,
      "basicSupportObligation": 1600,
      "healthInsuranceAddOn": 200,
      "childCareAddOn": 500
    },
    "guidelines": {
      "state": "California",
      "model": "income_shares"
    }
  }
}
```

### Get Calculation History
```http
GET /api/child-support/calculations
```
**Auth Required:** Yes

### Get Single Calculation
```http
GET /api/child-support/calculations/:id
```

### Get State Guidelines
```http
GET /api/child-support/guidelines/:state
```

### Get Supported States
```http
GET /api/child-support/states
```

---

## Subscription Endpoints

### Get Current Subscription
```http
GET /api/subscriptions/current
```

### Get Available Plans
```http
GET /api/subscriptions/plans
```

### Cancel Subscription
```http
POST /api/subscriptions/cancel
```

### Resume Subscription
```http
POST /api/subscriptions/resume
```

### Change Tier
```http
POST /api/subscriptions/change-tier
```

**Body:**
```json
{
  "newTier": "premium"
}
```

### Get Usage Statistics
```http
GET /api/subscriptions/usage
```

### Get Billing Portal
```http
GET /api/subscriptions/billing-portal?returnUrl=https://app.example.com/settings
```

---

## Payment Endpoints

### Create Checkout Session
```http
POST /api/payments/create-checkout-session
```

**Body:**
```json
{
  "tier": "premium",
  "successUrl": "https://app.example.com/success",
  "cancelUrl": "https://app.example.com/cancel"
}
```

### Create Payment Intent
```http
POST /api/payments/create-payment-intent
```

**Body:**
```json
{
  "amount": 4900,
  "serviceType": "legal_document",
  "serviceId": "uuid",
  "description": "LLC Operating Agreement"
}
```

### Get Payment History
```http
GET /api/payments/history
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      {
        "field": "email",
        "message": "Required"
      }
    ]
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `AUTHENTICATION_ERROR` | 401 | Missing or invalid token |
| `AUTHORIZATION_ERROR` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT_ERROR` | 409 | Resource already exists |
| `RATE_LIMIT_ERROR` | 429 | Too many requests |
| `PAYMENT_ERROR` | 402 | Payment failed |
| `EXTERNAL_SERVICE_ERROR` | 502 | External service unavailable |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Rate Limits

| Endpoint Category | Limit |
|------------------|-------|
| General API | 100 requests / 15 min |
| Auth endpoints | 5 requests / hour |
| AI endpoints | 20 requests / minute |
| File uploads | 50 requests / hour |

