# FinanceFlow API Reference

Base URL: `http://localhost:3003/api` (development)

All endpoints require authentication unless noted otherwise.

## Authentication

Include a Supabase access token in the Authorization header:

```
Authorization: Bearer <supabase_access_token>
```

## Health Check

```
GET /health
```

Returns service status. No auth required.

**Response:**
```json
{
  "status": "healthy",
  "service": "FinanceFlow API",
  "version": "1.0.0",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Tax Returns

### List Tax Returns

```
GET /api/tax/returns
```

Returns all tax returns for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "taxYear": 2024,
      "filingStatus": "single",
      "status": "draft",
      "refundAmount": 1234.56,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Tax Return

```
POST /api/tax/returns
```

**Body:**
```json
{
  "taxYear": 2024
}
```

### Get Tax Return

```
GET /api/tax/returns/:id
```

### Update Tax Return

```
PUT /api/tax/returns/:id
```

**Body:**
```json
{
  "filingStatus": "married_filing_jointly",
  "status": "in_progress"
}
```

### Delete Tax Return

```
DELETE /api/tax/returns/:id
```

---

## Tax Interview

### Start Interview

```
POST /api/tax/interview/:id/start
```

Starts the AI-guided tax interview for a tax return.

**Response:**
```json
{
  "success": true,
  "data": {
    "question": "What is your filing status?",
    "questionId": "filing_status",
    "options": ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
    "progress": 0
  }
}
```

### Answer Interview Question

```
POST /api/tax/interview/:id/answer
```

**Body:**
```json
{
  "questionId": "filing_status",
  "answer": "single"
}
```

### Get Interview Status

```
GET /api/tax/interview/:id/status
```

---

## Tax Calculations & Filing

### Calculate Tax

```
POST /api/tax/calculations/:id
```

Calculates tax liability for a return.

### Quick Tax Estimate

```
POST /api/tax/estimate
```

**Body:**
```json
{
  "income": 75000,
  "filingStatus": "single",
  "deductions": 13850
}
```

### Submit Federal E-File

```
POST /api/tax/e-filing/:id/submit
```

### Check E-File Status

```
GET /api/tax/e-filing/:id/status
```

### Submit State E-File

```
POST /api/tax/state/:id/submit
```

### Tax Calculator Tools

```
GET /api/tax/calculator
```

### Business Tax Operations

```
POST /api/tax/business
```

### Prior Year Import

```
GET /api/tax/prior-year
```

---

## AI Tax Advisor

### Ask Tax Question

```
POST /api/ai/tax-advisor/ask
```

**Body:**
```json
{
  "question": "What deductions can I claim for my home office?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "If you use part of your home exclusively for business...",
    "sources": ["IRS Publication 587"],
    "relatedTopics": ["self-employment", "schedule-c"]
  }
}
```

### Get Suggestions for Return

```
GET /api/ai/tax-advisor/suggestions/:returnId
```

---

## Bookkeeping

### List Transactions

```
GET /api/bookkeeping/transactions
```

**Query Parameters:**
- `startDate` — Filter start date (ISO 8601)
- `endDate` — Filter end date (ISO 8601)
- `category` — Filter by category
- `type` — Filter by type (`income` | `expense`)

### Create Transaction

```
POST /api/bookkeeping/transactions
```

**Body:**
```json
{
  "description": "Office supplies",
  "amount": 45.99,
  "type": "expense",
  "category": "Office Supplies",
  "date": "2024-03-01"
}
```

### List Linked Bank Accounts

```
GET /api/bookkeeping/accounts
```

### Sync Bank Account

```
POST /api/bookkeeping/accounts/:id/sync
```

### Income/Expense Summary

```
GET /api/bookkeeping/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "income": 50000,
    "expenses": 32000,
    "net": 18000
  }
}
```

### Import Bank Statement

```
POST /api/bookkeeping/statements/import
```

Accepts CSV or PDF bank statements. PDF statements are processed with OCR.

**Content-Type:** `multipart/form-data`

---

## Accounts Payable

### List Payables

```
GET /api/bookkeeping/ap
```

### Create Payable

```
POST /api/bookkeeping/ap
```

**Body:**
```json
{
  "vendor_name": "Office Depot",
  "amount": 250.00,
  "due_date": "2024-04-01",
  "description": "Office furniture"
}
```

### Update Payable

```
PUT /api/bookkeeping/ap/:id
```

### Record Payment

```
POST /api/bookkeeping/ap/:id/pay
```

**Body:**
```json
{
  "amount": 250.00,
  "payment_date": "2024-03-15",
  "payment_method": "bank_transfer"
}
```

---

## Accounts Receivable

### List Receivables

```
GET /api/bookkeeping/ar
```

### Create Receivable

```
POST /api/bookkeeping/ar
```

**Body:**
```json
{
  "client_name": "Acme Corp",
  "amount": 5000.00,
  "due_date": "2024-04-15",
  "invoice_number": "INV-001",
  "description": "Consulting services"
}
```

### Update Receivable

```
PUT /api/bookkeeping/ar/:id
```

### Record Payment

```
POST /api/bookkeeping/ar/:id/payment
```

---

## Accounting

### Chart of Accounts

```
GET /api/accounting/:businessId/accounts
```

### Create Account

```
POST /api/accounting/:businessId/accounts
```

**Body:**
```json
{
  "name": "Office Supplies",
  "type": "expense",
  "code": "6100"
}
```

### List Journal Entries

```
GET /api/accounting/:businessId/journal-entries
```

### Create Journal Entry

```
POST /api/accounting/:businessId/journal-entries
```

**Body:**
```json
{
  "date": "2024-03-01",
  "description": "Office supplies purchase",
  "entries": [
    { "accountId": "uuid", "debit": 45.99, "credit": 0 },
    { "accountId": "uuid", "debit": 0, "credit": 45.99 }
  ]
}
```

---

## Plaid Integration

### Create Link Token

```
POST /api/plaid/create-link-token
```

Creates a Plaid Link token for the frontend to initiate bank account linking.

### Exchange Public Token

```
POST /api/plaid/exchange-public-token
```

**Body:**
```json
{
  "publicToken": "public-sandbox-xxx",
  "institutionId": "ins_xxx",
  "institutionName": "Chase"
}
```

### Get Linked Accounts

```
GET /api/plaid/accounts
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "message": "Description of what went wrong",
    "code": "ERROR_CODE"
  }
}
```

Common HTTP status codes:

| Status | Meaning |
|--------|---------|
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

## Rate Limiting

API requests are rate limited per IP address. Default limits:

- General: 100 requests per 15 minutes
- Auth endpoints: 10 requests per 15 minutes
- AI endpoints: 20 requests per 15 minutes
