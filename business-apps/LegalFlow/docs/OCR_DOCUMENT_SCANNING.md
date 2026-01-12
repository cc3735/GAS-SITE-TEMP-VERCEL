# OCR Document Scanning Guide

## Overview

LegalFlow includes an advanced OCR (Optical Character Recognition) system for scanning and extracting data from tax documents. This feature significantly reduces manual data entry by automatically reading W-2, 1099, 1098, and other tax forms.

## Table of Contents

1. [Supported Documents](#supported-documents)
2. [How It Works](#how-it-works)
3. [API Reference](#api-reference)
4. [Configuration](#configuration)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Supported Documents

### Tax Forms

| Form Type | Description | Extraction Confidence |
|-----------|-------------|----------------------|
| **W-2** | Wage and Tax Statement | High (90%+) |
| **1099-INT** | Interest Income | High (85%+) |
| **1099-DIV** | Dividends and Distributions | High (85%+) |
| **1099-NEC** | Nonemployee Compensation | High (85%+) |
| **1099-MISC** | Miscellaneous Income | Medium (80%+) |
| **1099-G** | Government Payments | Medium (80%+) |
| **1099-R** | Retirement Distributions | Medium (80%+) |
| **1099-SSA** | Social Security Benefits | Medium (80%+) |
| **1098** | Mortgage Interest Statement | High (85%+) |
| **1098-E** | Student Loan Interest | Medium (80%+) |
| **1098-T** | Tuition Statement | Medium (80%+) |

### Supported File Formats

| Format | Extension | Notes |
|--------|-----------|-------|
| JPEG | .jpg, .jpeg | Recommended for photos |
| PNG | .png | Good for screenshots |
| WebP | .webp | Modern format, smaller size |
| TIFF | .tif, .tiff | High quality scans |
| PDF | .pdf | Single or multi-page supported |

---

## How It Works

### Processing Pipeline

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Upload     │────▶│  Google      │────▶│  Form Type      │
│  Document   │     │  Vision OCR  │     │  Detection      │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  User       │◀────│  Confidence  │◀────│  Data           │
│  Review     │     │  Scoring     │     │  Extraction     │
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  AI Validation  │
                                         │  (OpenAI)       │
                                         └─────────────────┘
```

### Step-by-Step Process

1. **Document Upload**: User uploads a photo or PDF of their tax document
2. **OCR Processing**: Google Cloud Vision extracts all text from the document
3. **Form Detection**: System analyzes text patterns to identify the form type
4. **Data Extraction**: Parses the OCR text using form-specific rules
5. **Confidence Scoring**: Each field is assigned a confidence score
6. **AI Validation**: OpenAI reviews extracted data for common errors
7. **User Review**: Fields with low confidence are flagged for manual review
8. **Data Storage**: Verified data is saved to the tax return

---

## API Reference

### Scan Document

**Endpoint:** `POST /api/tax/documents/scan`

**Description:** Scans a tax document and extracts structured data.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "taxReturnId": "uuid-of-tax-return",
  "fileBase64": "base64-encoded-file-content",
  "mimeType": "image/jpeg",
  "autoSave": true
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `taxReturnId` | string | Yes | UUID of the tax return to associate the document with |
| `fileBase64` | string | Yes | Base64-encoded file content |
| `mimeType` | string | Yes | MIME type of the file |
| `autoSave` | boolean | No | Automatically save extracted data (default: false) |

**Response:**
```json
{
  "success": true,
  "data": {
    "formType": "w2",
    "formTypeConfidence": 0.95,
    "extractedData": {
      "employerEin": "12-3456789",
      "employerName": "ACME Corporation",
      "wagesTipsOther": 75000.00,
      "federalWithheld": 12500.00,
      "socialSecurityWages": 75000.00,
      "socialSecurityWithheld": 4650.00,
      "medicareWages": 75000.00,
      "medicareWithheld": 1087.50,
      "taxYear": 2024
    },
    "overallConfidence": 0.87,
    "fieldsNeedingReview": ["employerName"],
    "suggestions": [
      "Please verify the employer name is correct",
      "State wage information was not detected"
    ],
    "fieldConfidences": [
      {"field": "employerEin", "value": "12-3456789", "confidence": 0.9, "needsReview": false},
      {"field": "employerName", "value": "ACME Corporation", "confidence": 0.7, "needsReview": true}
    ],
    "metadata": {
      "processingTimeMs": 2340,
      "documentLanguage": "en",
      "pageCount": 1
    },
    "documentId": "doc_abc123",
    "autoSaved": true
  }
}
```

### Check OCR Status

**Endpoint:** `GET /api/tax/documents/scan/status`

**Description:** Checks if OCR service is available.

**Response:**
```json
{
  "success": true,
  "data": {
    "ocrAvailable": true,
    "supportedFormats": ["image/jpeg", "image/png", "application/pdf"],
    "supportedDocumentTypes": ["w2", "1099_int", "1099_div", ...],
    "message": "OCR service is ready to scan documents"
  }
}
```

### Validate Scanned Data

**Endpoint:** `POST /api/tax/documents/scan/validate`

**Description:** Validates user-corrected data against expected formats.

**Request Body:**
```json
{
  "documentType": "w2",
  "data": {
    "employerEin": "12-3456789",
    "wagesTipsOther": 75000.00,
    "federalWithheld": 12500.00,
    "socialSecurityWages": 75000.00,
    "socialSecurityWithheld": 4650.00
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "validationErrors": [],
    "warnings": [
      {
        "field": "federalWithheld",
        "message": "Federal withholding rate (16.7%) is higher than typical (10-22%)"
      }
    ]
  }
}
```

---

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# Google Cloud Vision API (required for OCR)
GOOGLE_CLOUD_KEY_FILE=/path/to/service-account-key.json
# OR use inline credentials:
GOOGLE_CLOUD_CREDENTIALS='{"type":"service_account","project_id":"..."}'
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# OpenAI (optional, for AI-enhanced validation)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview
```

### Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Cloud Vision API**
   - Navigate to APIs & Services > Library
   - Search for "Cloud Vision API"
   - Click Enable

3. **Create Service Account**
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Grant "Cloud Vision API User" role
   - Create and download JSON key file

4. **Configure LegalFlow**
   - Place the JSON key file in a secure location
   - Set `GOOGLE_CLOUD_KEY_FILE` environment variable

### Pricing Considerations

Google Cloud Vision API pricing (as of 2024):
- First 1,000 units/month: Free
- 1,001 - 5,000,000 units/month: $1.50 per 1,000 units
- 5,000,001+ units/month: $0.60 per 1,000 units

Each document scan = 1 unit for images, 1+ units for multi-page PDFs

---

## Best Practices

### For Users

1. **Photo Quality**
   - Use good lighting when photographing documents
   - Ensure the entire document is visible
   - Avoid shadows and glare
   - Hold the camera parallel to the document

2. **File Size**
   - Keep images under 10MB
   - Use JPEG for photos (better compression)
   - Use PDF for multi-page documents

3. **Document Preparation**
   - Flatten any folded documents
   - Remove staples or clips
   - Ensure all text is visible and not cut off

### For Developers

1. **Error Handling**
   ```typescript
   try {
     const result = await scanDocument(buffer, mimeType);
     if (!result.success) {
       // Handle OCR failure
       console.error('Scan failed:', result.error);
     }
   } catch (error) {
     // Handle unexpected errors
     console.error('Unexpected error:', error);
   }
   ```

2. **Confidence Thresholds**
   - High confidence (≥0.85): Auto-accept data
   - Medium confidence (0.6-0.84): Suggest review
   - Low confidence (<0.6): Require manual entry

3. **Rate Limiting**
   - OCR endpoint has upload rate limiting
   - Default: 10 scans per minute per user

---

## Troubleshooting

### Common Issues

#### "OCR service not available"

**Cause:** Google Cloud Vision API not configured properly.

**Solution:**
1. Verify `GOOGLE_CLOUD_KEY_FILE` or `GOOGLE_CLOUD_CREDENTIALS` is set
2. Ensure the service account has "Cloud Vision API User" role
3. Check if Cloud Vision API is enabled in Google Cloud Console

#### Low confidence scores

**Cause:** Poor image quality or unusual document format.

**Solution:**
1. Take a clearer photo with better lighting
2. Ensure the document is flat and fully visible
3. Try scanning from a different angle
4. For PDFs, ensure the document is not password-protected

#### Form type detection failure

**Cause:** Document doesn't match expected patterns.

**Solution:**
1. Verify the document is a supported form type
2. Ensure form year is visible (e.g., "2024")
3. Try scanning individual pages if multi-page
4. Manual entry may be required for non-standard forms

#### Missing fields in extraction

**Cause:** Fields may be in unexpected locations or formats.

**Solution:**
1. Review the raw OCR text in the response
2. Manually enter missing values
3. Report consistently missing fields to support

### Error Codes

| Error | Description | Resolution |
|-------|-------------|------------|
| `ValidationError` | Invalid request parameters | Check request body format |
| `NotFoundError` | Tax return not found | Verify taxReturnId is correct |
| `OCR_NOT_INITIALIZED` | OCR service not configured | Set up Google Cloud credentials |
| `UNSUPPORTED_FORMAT` | File type not supported | Use supported file format |
| `FILE_TOO_LARGE` | File exceeds size limit | Compress or resize the file |

---

## Security Considerations

1. **Data Encryption**
   - All OCR data is encrypted in transit (TLS)
   - Extracted SSNs are stored encrypted at rest

2. **Data Retention**
   - Raw OCR text is not stored permanently
   - Only extracted structured data is retained
   - Documents can be deleted by users

3. **Access Control**
   - Users can only scan documents for their own tax returns
   - Admin access is logged and audited

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with W-2, 1099, 1098 support |

---

## Related Documentation

- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [API Reference](./API_REFERENCE.md)
- [Security Documentation](./SECURITY.md)
