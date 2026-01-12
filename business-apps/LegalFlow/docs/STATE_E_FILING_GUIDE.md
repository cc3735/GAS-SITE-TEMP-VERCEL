# State E-Filing Guide

## Overview

LegalFlow provides comprehensive state tax return preparation and e-filing support for all 50 states plus DC. This guide covers state tax configurations, calculations, multi-state returns, and the e-filing process.

## Table of Contents

1. [State Tax Types](#state-tax-types)
2. [No Income Tax States](#no-income-tax-states)
3. [Flat Tax States](#flat-tax-states)
4. [Progressive Tax States](#progressive-tax-states)
5. [State Return Calculation](#state-return-calculation)
6. [Multi-State Returns](#multi-state-returns)
7. [E-Filing Process](#e-filing-process)
8. [API Reference](#api-reference)
9. [Examples](#examples)

---

## State Tax Types

| Type | Description | States |
|------|-------------|--------|
| None | No state income tax | AK, FL, NV, NH, SD, TN, TX, WA, WY |
| Flat | Single tax rate | AZ, CO, IL, IN, KY, MA, MI, NC, PA, UT |
| Progressive | Graduated brackets | CA, NY, NJ, GA, VA, OH, MN, OR, and others |

---

## No Income Tax States

These 9 states have no general income tax:

| State | Code | Special Rules |
|-------|------|---------------|
| Alaska | AK | No income tax, no sales tax |
| Florida | FL | No income tax |
| Nevada | NV | No income tax |
| New Hampshire | NH | Interest/dividends tax repealed 2025 |
| South Dakota | SD | No income tax |
| Tennessee | TN | Hall Tax (interest/dividends) repealed 2021 |
| Texas | TX | No income tax |
| Washington | WA | Capital gains tax on gains over $262,000 (7%) |
| Wyoming | WY | No income tax |

### API: Get No-Tax States

```bash
GET /api/tax/state/states/no-tax
```

Response:
```json
{
  "success": true,
  "data": {
    "states": [
      { "code": "AK", "name": "Alaska", "specialRules": null },
      { "code": "FL", "name": "Florida", "specialRules": null },
      { "code": "TX", "name": "Texas", "specialRules": null }
    ],
    "count": 9,
    "note": "These states do not have a general income tax."
  }
}
```

---

## Flat Tax States

States with a single flat tax rate:

| State | Rate | Notes |
|-------|------|-------|
| Arizona | 2.5% | Lowest flat rate |
| Colorado | 4.4% | |
| Illinois | 4.95% | |
| Indiana | 3.05% | County taxes apply (1-3.38%) |
| Kentucky | 4.0% | |
| Massachusetts | 5.0% | 4% surtax over $1M |
| Michigan | 4.25% | Local taxes (Detroit 2.4%) |
| North Carolina | 4.75% | |
| Pennsylvania | 3.07% | Local earned income taxes |
| Utah | 4.65% | Taxpayer credit reduces effective rate |

---

## Progressive Tax States

### California

| Bracket | Rate |
|---------|------|
| $0 - $10,412 | 1% |
| $10,412 - $24,684 | 2% |
| $24,684 - $38,959 | 4% |
| $38,959 - $54,081 | 6% |
| $54,081 - $68,350 | 8% |
| $68,350 - $349,137 | 9.3% |
| $349,137 - $418,961 | 10.3% |
| $418,961 - $698,271 | 11.3% |
| Over $698,271 | 12.3% |

**Note**: 1% mental health surcharge on income over $1 million.

### New York

| Bracket | Rate |
|---------|------|
| $0 - $8,500 | 4% |
| $8,500 - $11,700 | 4.5% |
| $11,700 - $13,900 | 5.25% |
| $13,900 - $80,650 | 5.85% |
| $80,650 - $215,400 | 6.25% |
| $215,400 - $1,077,550 | 6.85% |
| $1,077,550 - $5,000,000 | 9.65% |
| $5,000,000 - $25,000,000 | 10.3% |
| Over $25,000,000 | 10.9% |

**Note**: NYC residents pay additional 3.078-3.876% tax.

### New Jersey

| Bracket | Rate |
|---------|------|
| $0 - $20,000 | 1.4% |
| $20,000 - $35,000 | 1.75% |
| $35,000 - $40,000 | 3.5% |
| $40,000 - $75,000 | 5.525% |
| $75,000 - $500,000 | 6.37% |
| $500,000 - $1,000,000 | 8.97% |
| Over $1,000,000 | 10.75% |

---

## State Return Calculation

### How State AGI is Calculated

```
State AGI = Federal AGI
          + State Additions
          - State Subtractions
          × Allocation Percentage (for non-residents)
```

### Common State Additions

- Municipal bond interest from other states
- State tax refund (if deducted federally)
- Certain federal deductions not allowed by state

### Common State Subtractions

- U.S. government bond interest
- Social Security (if taxed federally)
- State-specific retirement income exclusions
- Military pay exclusions

### API: Calculate State Return

```bash
POST /api/tax/state/calculate

{
  "state": "CA",
  "taxYear": 2024,
  "filingStatus": "married_filing_jointly",
  "residencyStatus": "full_year",
  "federalReturnId": "fed-return-123",
  "federalAgi": 150000,
  "stateWages": 145000,
  "stateWithholding": 8500,
  "stateAdjustments": [
    {
      "type": "subtraction",
      "code": "US_BOND_INT",
      "description": "U.S. Government Bond Interest",
      "amount": 500
    }
  ],
  "stateCredits": [
    {
      "code": "RENTER_CREDIT",
      "name": "California Renter's Credit",
      "amount": 120,
      "refundable": false
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "return": {
      "id": "state-CA-2024-12345",
      "state": "CA",
      "taxYear": 2024,
      "filingStatus": "married_filing_jointly",
      "residencyStatus": "full_year",
      "federalAgi": 150000,
      "stateAgi": 149500,
      "stateTaxableIncome": 138774,
      "stateDeductions": 10726,
      "stateExemptions": 0,
      "grossTax": 10245.67,
      "credits": 120,
      "netTax": 10125.67,
      "withholding": 8500,
      "estimatedPayments": 0,
      "amountDue": 1625.67,
      "refundAmount": 0,
      "status": "draft"
    },
    "summary": {
      "state": "CA",
      "stateTaxableIncome": 138774,
      "grossTax": 10245.67,
      "credits": 120,
      "netTax": 10125.67,
      "withholding": 8500,
      "amountDue": 1625.67,
      "refundAmount": 0
    }
  }
}
```

---

## Multi-State Returns

### Part-Year Residents

If you moved during the year:
- File as part-year resident in both states
- Allocate income based on residency days
- Calculate tax proportionally

### Non-Residents

If you work in a state where you don't live:
- File non-resident return in work state
- File resident return in home state
- Claim credit for taxes paid to other state

### Reciprocal Agreements

Some states have agreements where residents only pay taxes to their home state:

| State | Reciprocal With |
|-------|-----------------|
| Pennsylvania | IN, MD, NJ, OH, VA, WV |
| Virginia | DC, KY, MD, PA, WV |
| Ohio | IN, KY, MI, PA, WV |
| Maryland | DC, PA, VA, WV |
| New Jersey | PA |

### API: Check Reciprocal Agreement

```bash
GET /api/tax/state/states/PA/reciprocal
```

Response:
```json
{
  "success": true,
  "data": {
    "state": "PA",
    "stateName": "Pennsylvania",
    "reciprocalStates": ["IN", "MD", "NJ", "OH", "VA", "WV"],
    "explanation": "If you live in this state but work in a reciprocal state, you only need to pay taxes to your state of residence."
  }
}
```

### API: Calculate Multi-State Returns

```bash
POST /api/tax/state/calculate/multi-state

{
  "commonData": {
    "taxYear": 2024,
    "filingStatus": "single",
    "federalReturnId": "fed-123",
    "federalAgi": 100000
  },
  "states": [
    {
      "state": "NJ",
      "residencyStatus": "full_year",
      "stateWages": 100000,
      "stateWithholding": 4500
    },
    {
      "state": "NY",
      "residencyStatus": "nonresident",
      "stateWages": 30000,
      "stateWithholding": 1500
    }
  ]
}
```

### API: Calculate Other State Credit

```bash
POST /api/tax/state/calculate/other-state-credit

{
  "state": "NJ",
  "filingStatus": "single",
  "federalAgi": 100000,
  "otherStateIncome": [
    {
      "state": "NY",
      "income": 30000,
      "taxPaid": 1800
    }
  ]
}
```

---

## E-Filing Process

### Prerequisites

1. Federal return must be filed first (or filed simultaneously)
2. All required state forms completed
3. Valid payment method for balance due
4. Identity verification

### Filing Workflow

```
1. Create state return → POST /api/tax/state/returns
2. Validate for e-file → POST /api/tax/state/efile/validate/:id
3. Submit return → POST /api/tax/state/efile/submit/:id
4. Check status → GET /api/tax/state/efile/status/:submissionId
```

### State E-File Providers

| Provider | States |
|----------|--------|
| State Direct | Most states offer direct e-file |
| CalFile | California free filing |
| NY Free File | New York free filing |

### API: Validate for E-Filing

```bash
POST /api/tax/state/efile/validate/state-CA-2024-12345
```

Response:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "returnId": "state-CA-2024-12345",
    "state": "CA"
  }
}
```

### API: Submit for E-Filing

```bash
POST /api/tax/state/efile/submit/state-CA-2024-12345
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "state-efile-12345",
    "stateReturnId": "state-CA-2024-12345",
    "state": "CA",
    "submissionId": "STATE-CA-1234567890",
    "status": "submitted",
    "submittedAt": "2024-03-15T10:30:00Z"
  },
  "message": "State return submitted for e-filing. Submission ID: STATE-CA-1234567890"
}
```

### API: Check E-File Status

```bash
GET /api/tax/state/efile/status/state-efile-12345
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "state-efile-12345",
    "stateReturnId": "state-CA-2024-12345",
    "state": "CA",
    "submissionId": "STATE-CA-1234567890",
    "status": "accepted",
    "submittedAt": "2024-03-15T10:30:00Z",
    "acceptedAt": "2024-03-15T14:45:00Z",
    "confirmationNumber": "CONF-CA-987654321"
  }
}
```

---

## API Reference

### State Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax/state/states` | Get all state configurations |
| GET | `/api/tax/state/states/:code` | Get specific state details |
| GET | `/api/tax/state/states/efile` | Get e-file supported states |
| GET | `/api/tax/state/states/no-tax` | Get no income tax states |
| GET | `/api/tax/state/states/:code/reciprocal` | Get reciprocal agreements |

### Calculation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tax/state/calculate` | Calculate state return |
| POST | `/api/tax/state/calculate/multi-state` | Calculate multiple states |
| POST | `/api/tax/state/calculate/other-state-credit` | Calculate credit for other state taxes |
| POST | `/api/tax/state/estimate` | Quick state tax estimate |
| POST | `/api/tax/state/estimate/compare` | Compare taxes across states |

### Return Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tax/state/returns` | Create state return |
| GET | `/api/tax/state/returns` | Get all state returns |
| GET | `/api/tax/state/returns/:id` | Get specific return |
| DELETE | `/api/tax/state/returns/:id` | Delete draft return |

### E-Filing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tax/state/efile/validate/:id` | Validate for e-filing |
| POST | `/api/tax/state/efile/submit/:id` | Submit for e-filing |
| GET | `/api/tax/state/efile/status/:id` | Check e-file status |
| GET | `/api/tax/state/efile/submissions` | Get all submissions |

---

## Examples

### Example 1: California Resident Filing

```javascript
// 1. Calculate California return
const calcResponse = await api.post('/tax/state/calculate', {
  state: 'CA',
  taxYear: 2024,
  filingStatus: 'single',
  residencyStatus: 'full_year',
  federalReturnId: 'fed-123',
  federalAgi: 85000,
  stateWages: 85000,
  stateWithholding: 3500,
});

console.log('CA Tax:', calcResponse.data.return.netTax);
console.log('Due/Refund:', calcResponse.data.return.amountDue || -calcResponse.data.return.refundAmount);

// 2. Create return
const returnResponse = await api.post('/tax/state/returns', calcResponse.data.return);

// 3. Validate
const validateResponse = await api.post(`/tax/state/efile/validate/${returnResponse.data.id}`);

// 4. Submit if valid
if (validateResponse.data.isValid) {
  const submitResponse = await api.post(`/tax/state/efile/submit/${returnResponse.data.id}`);
  console.log('Submitted:', submitResponse.data.submissionId);
}
```

### Example 2: Multi-State Comparison

```javascript
// Compare moving from high-tax to low-tax state
const comparison = await api.post('/tax/state/estimate/compare', {
  states: ['CA', 'NY', 'TX', 'FL', 'WA', 'NV', 'AZ', 'CO'],
  filingStatus: 'single',
  federalAgi: 150000,
});

console.log('Comparison Results:');
for (const state of comparison.data.comparisons) {
  console.log(`${state.stateCode}: $${state.netTax?.toFixed(2) || 0} (${state.effectiveRate?.toFixed(2) || 0}%)`);
}

console.log(`\nPotential annual savings: $${comparison.data.potentialSavings.toFixed(2)}`);
```

### Example 3: NJ Resident Working in NY

```javascript
// Calculate both returns with other-state credit
const njReturn = await api.post('/tax/state/calculate', {
  state: 'NJ',
  taxYear: 2024,
  filingStatus: 'single',
  residencyStatus: 'full_year',
  federalReturnId: 'fed-123',
  federalAgi: 120000,
  stateWages: 120000,
  stateWithholding: 5000,
  otherStateIncome: [{
    state: 'NY',
    income: 120000,
    taxPaid: 6500
  }]
});

// Calculate credit for NY taxes paid
const credit = await api.post('/tax/state/calculate/other-state-credit', {
  state: 'NJ',
  filingStatus: 'single',
  federalAgi: 120000,
  otherStateIncome: [{
    state: 'NY',
    income: 120000,
    taxPaid: 6500
  }]
});

console.log('NJ Tax before credit:', njReturn.data.return.grossTax);
console.log('Credit for NY tax:', credit.data.creditAmount);
console.log('NJ Tax after credit:', njReturn.data.return.netTax);
```

---

## State Filing Deadlines

Most states follow the federal April 15 deadline, with exceptions:

| State | Deadline | Extension |
|-------|----------|-----------|
| Most states | April 15 | October 15 |
| Virginia | May 1 | November 1 |
| Delaware | April 30 | October 15 |
| Iowa | April 30 | October 31 |
| Louisiana | May 15 | November 15 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with all 50 states + DC support |

---

## Related Documentation

- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [E-Filing Guide](./E_FILING_GUIDE.md)
- [Business Tax Guide](./BUSINESS_TAX_GUIDE.md)
- [AI Tax Advisor Guide](./AI_TAX_ADVISOR_GUIDE.md)
