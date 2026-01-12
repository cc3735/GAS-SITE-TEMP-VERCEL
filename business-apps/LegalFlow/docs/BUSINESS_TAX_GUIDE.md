# Business Tax Guide

## Overview

LegalFlow provides comprehensive business tax support for various entity types, including sole proprietorships, partnerships, LLCs, and S-corporations. This guide covers all supported business tax features, calculations, and API endpoints.

## Table of Contents

1. [Entity Types](#entity-types)
2. [Schedule C (Sole Proprietor)](#schedule-c-sole-proprietor)
3. [Self-Employment Tax](#self-employment-tax)
4. [QBI Deduction](#qbi-deduction)
5. [Quarterly Estimated Taxes](#quarterly-estimated-taxes)
6. [Partnership (Form 1065)](#partnership-form-1065)
7. [S-Corporation (Form 1120-S)](#s-corporation-form-1120-s)
8. [API Reference](#api-reference)
9. [Examples](#examples)

---

## Entity Types

| Entity Type | Tax Form | SE Tax | Pass-Through |
|-------------|----------|--------|--------------|
| Sole Proprietorship | Schedule C | Yes | Yes |
| Single-Member LLC | Schedule C | Yes | Yes |
| Partnership | Form 1065 | Yes* | Yes |
| Multi-Member LLC | Form 1065 | Yes* | Yes |
| S-Corporation | Form 1120-S | No** | Yes |
| C-Corporation | Form 1120 | No | No |

*General partners and LLC members pay SE tax; limited partners generally don't
**S-Corp shareholders must take reasonable salary (subject to payroll tax)

### Choosing the Right Entity

| Factor | Sole Prop | LLC | S-Corp | C-Corp |
|--------|-----------|-----|--------|--------|
| Liability Protection | None | Yes | Yes | Yes |
| Formation Complexity | Lowest | Low | Medium | High |
| SE Tax on Profits | Full | Full | Salary Only | None |
| Double Taxation | No | No | No | Yes |
| Ownership Flexibility | N/A | High | Limited | Highest |

---

## Schedule C (Sole Proprietor)

### Overview

Schedule C is used to report income or loss from a business operated as a sole proprietorship or single-member LLC.

### Income Categories

| Line | Description |
|------|-------------|
| 1 | Gross receipts or sales |
| 2 | Returns and allowances |
| 3 | Cost of goods sold (if applicable) |
| 4 | Gross profit |
| 5 | Other income |
| 6 | Gross income |

### Expense Categories

| Line | Expense | Description |
|------|---------|-------------|
| 8 | Advertising | Marketing and promotional costs |
| 9 | Car and Truck | Business vehicle expenses |
| 10 | Commissions | Fees paid to others |
| 11 | Contract Labor | Payments to independent contractors |
| 12 | Depletion | Natural resource depletion |
| 13 | Depreciation | Asset depreciation |
| 14 | Employee Benefits | Health insurance, retirement for employees |
| 15 | Insurance | Business insurance (not health) |
| 16a | Mortgage Interest | Interest on business property |
| 16b | Other Interest | Other business interest |
| 17 | Legal/Professional | Attorney and accountant fees |
| 18 | Office Expense | Office supplies and expenses |
| 19 | Pension Plans | Employer retirement contributions |
| 20a | Rent (Vehicles) | Vehicle and equipment rental |
| 20b | Rent (Other) | Property rental |
| 21 | Repairs | Maintenance and repairs |
| 22 | Supplies | Materials and supplies |
| 23 | Taxes | Business taxes and licenses |
| 24a | Travel | Business travel expenses |
| 24b | Meals | 50% of business meals |
| 25 | Utilities | Phone, internet, utilities |
| 26 | Wages | Employee wages |
| 27 | Other | Other deductible expenses |

### Vehicle Expense Methods

#### Standard Mileage Rate (2024)
- **Business**: $0.67 per mile
- **Medical/Moving**: $0.21 per mile
- **Charity**: $0.14 per mile

#### Actual Expense Method
Track actual costs:
- Gas and oil
- Repairs and maintenance
- Insurance
- Registration fees
- Depreciation
- Interest (if financed)

Calculate business percentage based on business miles / total miles.

### Home Office Deduction

#### Simplified Method
- $5 per square foot
- Maximum 300 square feet
- Maximum deduction: $1,500
- No depreciation recapture

#### Regular Method
Calculate percentage of home used for business:
```
Business Percentage = Business Square Feet / Total Home Square Feet
```

Deductible expenses (at business percentage):
- Mortgage interest
- Real estate taxes
- Insurance
- Repairs and maintenance
- Utilities
- Depreciation

### API: Calculate Schedule C

```bash
POST /api/tax/business/calculate/schedule-c

{
  "businessName": "My Consulting Business",
  "principalBusinessCode": "541611",
  "businessDescription": "Management consulting",
  "accountingMethod": "cash",
  "grossReceipts": 150000,
  "returns": 0,
  "otherIncome": 500,
  "expenses": {
    "advertising": 2000,
    "officeExpense": 1500,
    "supplies": 800,
    "legal": 1200,
    "insurance": 2400,
    "utilities": 1800,
    "travel": 3500,
    "deductibleMeals": 1000,
    "contractLabor": 15000,
    "otherExpenses": [
      {"description": "Software subscriptions", "amount": 2400}
    ]
  },
  "homeOffice": {
    "method": "simplified",
    "squareFeet": 200,
    "totalHomeSquareFeet": 2000,
    "daysUsed": 365
  }
}
```

Response:
```json
{
  "success": true,
  "data": {
    "entityType": "sole_proprietorship",
    "formType": "schedule_c",
    "grossIncome": 150500,
    "totalExpenses": 32600,
    "netIncome": 117900,
    "selfEmploymentTax": 16656,
    "selfEmploymentTaxDeduction": 8328,
    "qbiDeduction": 23580,
    "quarterlyEstimates": [
      {"quarter": 1, "dueDate": "2024-04-15", "amount": 4164},
      {"quarter": 2, "dueDate": "2024-06-15", "amount": 4164},
      {"quarter": 3, "dueDate": "2024-09-15", "amount": 4164},
      {"quarter": 4, "dueDate": "2025-01-15", "amount": 4164}
    ]
  }
}
```

---

## Self-Employment Tax

### Overview

Self-employment tax covers Social Security and Medicare taxes for self-employed individuals.

### 2024 Rates

| Component | Rate | Wage Base |
|-----------|------|-----------|
| Social Security | 12.4% | $168,600 |
| Medicare | 2.9% | No limit |
| Additional Medicare | 0.9% | Over $200,000 |
| **Total** | **15.3%** | - |

### Calculation

```
Net Earnings = Net Self-Employment Income × 92.35%
Social Security Tax = min(Net Earnings, $168,600) × 12.4%
Medicare Tax = Net Earnings × 2.9%
Additional Medicare = max(0, Net Earnings - $200,000) × 0.9%
Total SE Tax = Social Security + Medicare + Additional Medicare
SE Tax Deduction = Total SE Tax / 2
```

### API: Calculate SE Tax

```bash
POST /api/tax/business/calculate/self-employment-tax

{
  "netSelfEmploymentIncome": 100000
}
```

Response:
```json
{
  "success": true,
  "data": {
    "netSelfEmploymentIncome": 100000,
    "netEarnings": 92350,
    "selfEmploymentTax": 14130,
    "selfEmploymentTaxDeduction": 7065,
    "breakdown": {
      "socialSecurityPortion": 11451,
      "medicarePortion": 2678,
      "additionalMedicare": 0
    }
  }
}
```

---

## QBI Deduction

### Overview

The Qualified Business Income (QBI) deduction allows eligible self-employed and small business owners to deduct up to 20% of their qualified business income.

### Basic Calculation

```
QBI Deduction = Qualified Business Income × 20%
```

### Limitations

1. **Taxable Income Limit**: QBI deduction cannot exceed 20% of taxable income (before QBI)

2. **Specified Service Trades or Businesses (SSTB)**:
   - Full deduction phases out for high earners
   - SSTBs include: health, law, accounting, consulting, financial services, athletics, performing arts

3. **W-2 Wage and Asset Limits** (for non-SSTBs at higher income):
   - Greater of:
     - 50% of W-2 wages, OR
     - 25% of W-2 wages + 2.5% of qualified property

### API: Calculate QBI

```bash
POST /api/tax/business/calculate/qbi

{
  "qualifiedBusinessIncome": 100000,
  "entityType": "sole_proprietorship",
  "taxableIncomeBeforeQBI": 80000
}
```

---

## Quarterly Estimated Taxes

### Due Dates

| Quarter | Period | Due Date |
|---------|--------|----------|
| Q1 | Jan 1 - Mar 31 | April 15 |
| Q2 | Apr 1 - May 31 | June 15 |
| Q3 | Jun 1 - Aug 31 | September 15 |
| Q4 | Sep 1 - Dec 31 | January 15 (next year) |

### Safe Harbor Rules

To avoid underpayment penalties, pay at least:
1. 90% of current year tax, OR
2. 100% of prior year tax (110% if AGI > $150,000)

### Calculation

```
Annual Tax Estimate = Self-Employment Tax + Estimated Income Tax
Quarterly Payment = Annual Tax Estimate / 4
```

### API: Calculate Quarterly Estimates

```bash
POST /api/tax/business/quarterly-estimates/calculate

{
  "estimatedNetIncome": 120000,
  "estimatedIncomeTax": 18000
}
```

### Record Payment

```bash
POST /api/tax/business/quarterly-estimates/record

{
  "taxYear": 2024,
  "quarter": 1,
  "amountPaid": 8500,
  "paidDate": "2024-04-12",
  "confirmationNumber": "123456789"
}
```

---

## Partnership (Form 1065)

### Overview

Form 1065 is used by partnerships (including multi-member LLCs) to report income, deductions, gains, and losses.

### Key Concepts

1. **Pass-Through Entity**: Partnership doesn't pay income tax; income passes to partners
2. **Schedule K-1**: Each partner receives a K-1 showing their share
3. **Guaranteed Payments**: Payments to partners for services (like salary)
4. **Self-Employment Tax**: General partners pay SE tax on their share

### Partner Types

| Type | Liability | SE Tax on Share | Management |
|------|-----------|-----------------|------------|
| General Partner | Unlimited | Yes | Yes |
| Limited Partner | Limited | Generally No | No |
| LLC Member | Limited | Yes | Varies |

### Allocation of Income

Partners share income based on partnership agreement percentages:
- Profit sharing percentage
- Loss sharing percentage
- Capital sharing percentage

### Coming Soon
Full Form 1065 calculation and K-1 generation.

---

## S-Corporation (Form 1120-S)

### Overview

S-Corporations provide liability protection while avoiding double taxation. Income passes through to shareholders.

### Key Benefits

1. **No SE Tax on Distributions**: Unlike partnerships, S-Corp distributions aren't subject to self-employment tax
2. **Pass-Through Taxation**: No corporate-level tax (with some exceptions)
3. **Liability Protection**: Shareholders protected from business debts

### Requirements

- 100 or fewer shareholders
- Only one class of stock
- Shareholders must be individuals, estates, or certain trusts
- No nonresident alien shareholders

### Reasonable Compensation

S-Corp shareholders who work in the business must take "reasonable compensation" as wages (subject to payroll tax) before taking distributions.

### Coming Soon
Full Form 1120-S calculation and K-1 generation.

---

## API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tax/business/returns` | Create business return |
| GET | `/api/tax/business/returns` | List business returns |
| GET | `/api/tax/business/returns/:id` | Get business return |
| PUT | `/api/tax/business/returns/:id` | Update business return |
| DELETE | `/api/tax/business/returns/:id` | Delete business return |
| POST | `/api/tax/business/returns/:id/calculate` | Calculate taxes |
| POST | `/api/tax/business/calculate/schedule-c` | Preview Schedule C |
| POST | `/api/tax/business/calculate/self-employment-tax` | Calculate SE tax |
| POST | `/api/tax/business/calculate/qbi` | Calculate QBI deduction |
| GET | `/api/tax/business/quarterly-estimates` | Get quarterly estimates |
| POST | `/api/tax/business/quarterly-estimates/calculate` | Calculate estimates |
| POST | `/api/tax/business/quarterly-estimates/record` | Record payment |
| GET | `/api/tax/business/summary` | Get business tax summary |
| GET | `/api/tax/business/entity-types` | Get entity types info |
| GET | `/api/tax/business/expense-categories` | Get expense categories |
| GET | `/api/tax/business/mileage-rate` | Get mileage rates |

---

## Examples

### Example 1: Freelance Consultant

**Situation:**
- Single-member LLC
- $180,000 gross receipts
- $45,000 in expenses
- Home office (200 sq ft)

**Results:**
```
Gross Income: $180,000
Expenses: $45,000
Home Office: $1,000 (simplified)
Net Profit: $134,000
SE Tax: ~$18,900
SE Tax Deduction: ~$9,450
QBI Deduction: ~$26,800
Quarterly Estimate: ~$4,725
```

### Example 2: Food Truck Business

**Situation:**
- Sole proprietorship
- $95,000 gross receipts
- $52,000 in expenses (food, labor, vehicle)
- Standard mileage: 15,000 business miles

**Results:**
```
Gross Income: $95,000
Expenses: $52,000
Vehicle (std mileage): $10,050
Net Profit: $32,950
SE Tax: ~$4,650
SE Tax Deduction: ~$2,325
QBI Deduction: ~$6,590
Quarterly Estimate: ~$1,160
```

### Example 3: E-commerce Business

**Situation:**
- Single-member LLC
- $250,000 gross sales
- $125,000 COGS
- $50,000 operating expenses

**Results:**
```
Gross Sales: $250,000
COGS: $125,000
Gross Profit: $125,000
Operating Expenses: $50,000
Net Profit: $75,000
SE Tax: ~$10,600
SE Tax Deduction: ~$5,300
QBI Deduction: ~$15,000
Quarterly Estimate: ~$2,650
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with Schedule C, SE tax, QBI, quarterly estimates |

---

## Related Documentation

- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [Tax Credits Guide](./TAX_CREDITS_GUIDE.md)
- [E-Filing Guide](./E_FILING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
