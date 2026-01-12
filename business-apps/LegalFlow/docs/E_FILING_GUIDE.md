# E-Filing Guide

## Overview

LegalFlow provides comprehensive tax return filing capabilities, including validation, PDF generation, and foundations for future direct IRS e-filing integration.

## Table of Contents

1. [Features](#features)
2. [Validation](#validation)
3. [PDF Generation](#pdf-generation)
4. [E-Filing Submission](#e-filing-submission)
5. [Filing Status](#filing-status)
6. [API Reference](#api-reference)
7. [Deadlines](#deadlines)
8. [Troubleshooting](#troubleshooting)

---

## Features

### Current Capabilities

| Feature | Status | Description |
|---------|--------|-------------|
| Return Validation | Available | Comprehensive validation of all tax return fields |
| PDF Generation | Available | Generate IRS-ready Form 1040 and schedules |
| Submission Tracking | Available | Track filing status and history |
| Direct IRS E-Filing | Coming Soon | MeF integration for direct submission |

### Supported Forms

- **Form 1040** - U.S. Individual Income Tax Return
- **Schedule 1** - Additional Income and Adjustments to Income
- **Schedule 2** - Additional Taxes
- **Schedule 3** - Additional Credits and Payments
- **Schedule A** - Itemized Deductions
- **Schedule C** - Profit or Loss from Business
- **Schedule SE** - Self-Employment Tax
- **Schedule EIC** - Earned Income Credit

---

## Validation

The e-filing service performs comprehensive validation before allowing submission:

### Validation Categories

#### 1. Taxpayer Information
- First and last name required
- Valid Social Security Number (SSN)
- Date of birth
- Complete mailing address
- Valid ZIP code format

#### 2. Spouse Information (if married filing jointly)
- Same requirements as primary taxpayer
- Required when filing status is "Married Filing Jointly"

#### 3. Dependent Information
- Name and SSN for each dependent
- Relationship to taxpayer
- Age verification for Child Tax Credit eligibility

#### 4. Income Validation
- W-2 employer EIN format
- Non-negative wage amounts
- Withholding rate reasonableness check
- 1099 amount validation

#### 5. Deduction Validation
- SALT cap warning ($10,000 limit)
- Large charitable donation alerts
- Educator expense limits
- Student loan interest cap

#### 6. Cross-Validation
- W-2 totals match reported wages
- Withholding calculations match
- Filing status consistency

### Error Severity Levels

| Severity | Description | Can File? |
|----------|-------------|-----------|
| Critical | Must be fixed before filing | No |
| Error | Should be reviewed | No |
| Warning | Advisory only | Yes |

### Example Validation Response

```json
{
  "isValid": true,
  "readyToFile": true,
  "errors": [],
  "warnings": [
    {
      "code": "HIGH_WITHHOLDING_RATE",
      "field": "income.w2Forms[0].federalWithheld",
      "message": "W-2 #1 has unusually high withholding rate (35.5%)"
    },
    {
      "code": "SALT_CAP_EXCEEDED",
      "field": "deductions.itemizedDeductions",
      "message": "State and local taxes exceed the $10,000 cap"
    }
  ]
}
```

---

## PDF Generation

Generate IRS-ready PDF forms for manual filing or record keeping.

### Generation Options

| Option | Default | Description |
|--------|---------|-------------|
| `includeSchedules` | `true` | Include all applicable schedule forms |
| `includeWorksheets` | `true` | Include calculation worksheets |
| `includeInstructions` | `false` | Include IRS form instructions |
| `format` | `"print"` | Output format: "print" or "efile" |

### Forms Included

The PDF generator automatically determines which forms are needed based on your return:

- **Schedule 1**: If you have business income, rental income, alimony, or above-the-line deductions
- **Schedule 2**: If you have self-employment tax
- **Schedule 3**: If you have education credits, energy credits, or foreign tax credit
- **Schedule A**: If itemizing deductions
- **Schedule C**: If reporting business income
- **Schedule SE**: If self-employed
- **Schedule EIC**: If claiming Earned Income Credit

### API Request

```bash
curl -X POST /api/tax/e-filing/generate-pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taxReturnId": "your-return-id",
    "includeSchedules": true,
    "includeWorksheets": true,
    "format": "print"
  }'
```

### Response

```json
{
  "success": true,
  "data": {
    "pdfBase64": "JVBERi0xLjQKJe...",
    "filename": "Form1040_2024_Smith.pdf",
    "pageCount": 5,
    "forms": ["Form 1040", "Schedule 1", "Schedule C", "Schedule SE"]
  }
}
```

---

## E-Filing Submission

### Current Status

Direct IRS e-filing through the Modernized e-File (MeF) system is coming soon. Currently, submissions are tracked internally and users can download PDFs for manual filing.

### Submission Process

1. **Validate Return**
   - All critical errors must be resolved
   - Review and acknowledge warnings

2. **Submit Return**
   - Creates a submission record
   - Updates return status to "submitted"

3. **Track Status**
   - Monitor submission progress
   - Receive notifications on status changes

### Submission Statuses

| Status | Description |
|--------|-------------|
| `draft` | Return in progress |
| `validated` | Passed validation checks |
| `ready_to_file` | Ready for submission |
| `submitted` | Submitted for processing |
| `pending_review` | Under review |
| `accepted` | Accepted by IRS |
| `rejected` | Rejected (see reason) |

### API Request

```bash
curl -X POST /api/tax/e-filing/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "taxReturnId": "your-return-id",
    "filingType": "federal"
  }'
```

---

## Filing Status

### Check Individual Submission

```bash
curl -X GET /api/tax/e-filing/status/SUBMISSION_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### List All Submissions

```bash
curl -X GET /api/tax/e-filing/submissions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Filter by tax year:
```bash
curl -X GET /api/tax/e-filing/submissions?taxYear=2024 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tax/e-filing/validate` | Validate a tax return |
| POST | `/api/tax/e-filing/generate-pdf` | Generate IRS-ready PDF |
| POST | `/api/tax/e-filing/submit` | Submit for e-filing |
| GET | `/api/tax/e-filing/status/:id` | Check submission status |
| GET | `/api/tax/e-filing/submissions` | List all submissions |
| GET | `/api/tax/e-filing/requirements` | Get filing requirements |
| GET | `/api/tax/e-filing/deadlines` | Get filing deadlines |

### Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## Deadlines

### Federal Tax Deadlines

| Deadline | Date | Description |
|----------|------|-------------|
| Tax Return Due | April 15 | Federal income tax return due |
| Q1 Estimated | April 15 | First quarter estimated payment |
| Q2 Estimated | June 15 | Second quarter estimated payment |
| Q3 Estimated | September 15 | Third quarter estimated payment |
| Extension | October 15 | Extended return deadline |
| Q4 Estimated | January 15 | Fourth quarter estimated payment |

### Fetching Current Deadlines

```bash
curl -X GET /api/tax/e-filing/deadlines \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Troubleshooting

### Common Validation Errors

#### "Taxpayer SSN is required"
Ensure the user's profile has a valid SSN entered and encrypted properly.

#### "Invalid bank routing number"
Bank routing numbers must be exactly 9 digits and pass checksum validation.

#### "W-2 wages cannot be negative"
Check W-2 data entry - wages must be positive numbers.

### Common Issues

#### PDF Generation Fails
1. Ensure the return has passed validation
2. Check that all required fields are populated
3. Review validation errors in the response

#### Submission Rejected
1. Check the `rejectionReason` field in the status response
2. Common reasons include:
   - Invalid SSN
   - Name/SSN mismatch with IRS records
   - Missing required schedules

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `MISSING_SSN` | SSN not provided | Enter valid SSN |
| `INVALID_SSN` | SSN format invalid | Check SSN format (XXX-XX-XXXX) |
| `MISSING_ADDRESS` | Address incomplete | Fill in all address fields |
| `INVALID_EIN` | Employer EIN invalid | Verify EIN from W-2 |
| `W2_WAGES_MISMATCH` | W-2 totals don't match | Reconcile W-2 amounts |

---

## Future Roadmap

### Phase 1: Current (PDF Generation)
- Comprehensive validation
- IRS-ready PDF forms
- Submission tracking

### Phase 2: Direct E-Filing (Coming Soon)
- IRS MeF integration
- Real-time acknowledgments
- Direct deposit setup

### Phase 3: State E-Filing
- All 50 states supported
- State-specific forms
- Combined federal/state filing

---

## Security

### Data Protection
- All SSNs and sensitive data encrypted at rest (AES-256)
- TLS encryption for all API communications
- Bank account information stored securely

### Compliance
- SOC 2 Type II compliant infrastructure
- IRS-approved security standards
- Regular security audits

---

## Related Documentation

- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [Tax Credits Guide](./TAX_CREDITS_GUIDE.md)
- [OCR Document Scanning](./OCR_DOCUMENT_SCANNING.md)
- [API Reference](./API_REFERENCE.md)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with validation and PDF generation |
