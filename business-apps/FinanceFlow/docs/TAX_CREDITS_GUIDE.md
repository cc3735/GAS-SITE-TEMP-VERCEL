# Tax Credits Guide

## Overview

LegalFlow supports comprehensive federal tax credit calculations, helping users maximize their tax refunds through various credits available under current tax law. This guide covers all supported credits, eligibility requirements, and calculation methods.

## Table of Contents

1. [Supported Credits](#supported-credits)
2. [Child Tax Credit](#child-tax-credit)
3. [Child and Dependent Care Credit](#child-and-dependent-care-credit)
4. [Earned Income Tax Credit (EITC)](#earned-income-tax-credit-eitc)
5. [Education Credits](#education-credits)
6. [Saver's Credit](#savers-credit)
7. [Energy Credits](#energy-credits)
8. [API Reference](#api-reference)
9. [Examples](#examples)

---

## Supported Credits

| Credit | Max Amount | Refundable | Phase-Out Applies |
|--------|------------|------------|-------------------|
| Child Tax Credit | $2,000/child | Partially | Yes |
| Child & Dependent Care | $2,100 | No | Yes |
| EITC | $7,830 | Yes | Yes |
| American Opportunity (AOTC) | $2,500/student | Partially (40%) | Yes |
| Lifetime Learning | $2,000 | No | Yes |
| Saver's Credit | $2,000 | No | Yes |
| Residential Clean Energy | 30% of costs | No | No |
| Energy Efficient Improvements | $3,200 | No | No |
| Clean Vehicle (EV) | $7,500 new / $4,000 used | No | Yes |

---

## Child Tax Credit

### Overview
The Child Tax Credit (CTC) provides up to $2,000 per qualifying child under age 17.

### Eligibility Requirements
- Child must be under 17 at the end of the tax year
- Child must be a U.S. citizen, national, or resident alien
- Child must have a valid Social Security number
- Child must be claimed as a dependent on your return
- Child must have lived with you for more than half the year

### Calculation

```
Credit per child = $2,000
Total CTC = Number of qualifying children × $2,000
```

### Phase-Out
- **Single/HOH:** Begins at $200,000 AGI
- **Married Filing Jointly:** Begins at $400,000 AGI
- **Reduction:** $50 for each $1,000 (or fraction) above threshold

### Additional Child Tax Credit (Refundable)
- Up to $1,700 per child is refundable (2024)
- Requires earned income of at least $2,500

---

## Child and Dependent Care Credit

### Overview
Credit for expenses paid to care for qualifying children or dependents while you work.

### Eligible Expenses
- Day care, nursery school, preschool
- Before/after school programs
- Summer day camp
- Nanny, au pair, or babysitter services
- **NOT eligible:** Overnight camps, private school tuition (K-12)

### Calculation

| AGI Range | Credit Rate |
|-----------|-------------|
| Up to $15,000 | 35% |
| $15,001 - $43,000 | 35% minus 1% per $2,000 above $15,000 |
| Over $43,000 | 20% |

**Maximum Qualified Expenses:**
- 1 qualifying person: $3,000
- 2+ qualifying persons: $6,000

**Maximum Credit:**
- 1 qualifying person: $1,050 (35% of $3,000)
- 2+ qualifying persons: $2,100 (35% of $6,000)

---

## Earned Income Tax Credit (EITC)

### Overview
The EITC is a refundable credit for low to moderate income workers. It's one of the most valuable credits available, providing up to $7,830 in 2024.

### Eligibility Requirements
- Must have earned income (wages, salaries, tips, self-employment)
- Investment income must be $11,000 or less
- Must meet income limits based on filing status and children
- Must have a valid Social Security number
- Must be a U.S. citizen or resident alien for entire year
- Cannot file as "Married Filing Separately"
- Cannot be a qualifying child of another taxpayer

### 2024 Income Limits and Maximum Credits

| Filing Status | Children | Max Credit | Max Earned Income | Max AGI |
|---------------|----------|------------|-------------------|---------|
| Single/HOH | 0 | $632 | $18,591 | $18,591 |
| Single/HOH | 1 | $4,213 | $49,084 | $49,084 |
| Single/HOH | 2 | $6,960 | $55,768 | $55,768 |
| Single/HOH | 3+ | $7,830 | $59,899 | $59,899 |
| MFJ | 0 | $632 | $25,511 | $25,511 |
| MFJ | 1 | $4,213 | $56,004 | $56,004 |
| MFJ | 2 | $6,960 | $62,688 | $62,688 |
| MFJ | 3+ | $7,830 | $66,819 | $66,819 |

### Qualifying Child Rules
A qualifying child for EITC must:
- Be under age 19 (or under 24 if full-time student)
- Be younger than you (and your spouse if filing jointly)
- Live with you in the U.S. for more than half the year
- Have a valid Social Security number
- Not be claimed as a dependent by another person

---

## Education Credits

### American Opportunity Tax Credit (AOTC)

#### Overview
The AOTC provides up to $2,500 per eligible student for the first 4 years of postsecondary education.

#### Eligibility
- Student enrolled at least half-time
- Pursuing a degree or recognized credential
- First 4 years of postsecondary education only
- Not claimed AOTC for more than 4 tax years
- No felony drug conviction

#### Calculation
- 100% of first $2,000 in qualified expenses
- 25% of next $2,000 in qualified expenses
- **Maximum:** $2,500 per student

#### Refundability
- 40% of the credit (up to $1,000) is refundable
- 60% is nonrefundable

#### Phase-Out (2024)
| Filing Status | Phase-Out Start | Phase-Out End |
|---------------|-----------------|---------------|
| Single/HOH | $80,000 | $90,000 |
| MFJ | $160,000 | $180,000 |

#### Qualified Expenses
- Tuition and required fees
- Course materials (books, supplies, equipment)
- **NOT included:** Room and board, transportation, insurance

---

### Lifetime Learning Credit

#### Overview
The LLC provides up to $2,000 per tax return for qualified education expenses.

#### Key Differences from AOTC
- No limit on number of years claimed
- Available for any postsecondary education
- Available for courses to improve job skills
- Not refundable
- Per-return limit (not per student)

#### Calculation
- 20% of first $10,000 in qualified expenses
- **Maximum:** $2,000 per tax return

#### Phase-Out (2024)
Same as AOTC:
| Filing Status | Phase-Out Start | Phase-Out End |
|---------------|-----------------|---------------|
| Single/HOH | $80,000 | $90,000 |
| MFJ | $160,000 | $180,000 |

#### Important Rules
- Cannot claim AOTC and LLC for the same student in the same year
- Can claim AOTC for one student and LLC for another

---

## Saver's Credit

### Overview
The Saver's Credit (officially "Retirement Savings Contributions Credit") rewards low to moderate income taxpayers for contributing to retirement accounts.

### Eligible Contributions
- Traditional and Roth IRA
- 401(k), 403(b), 457(b) plans
- SIMPLE IRA and SEP IRA
- Thrift Savings Plan (TSP)

### Credit Rates (2024)

#### Single, Married Filing Separately
| AGI | Credit Rate |
|-----|-------------|
| Up to $23,000 | 50% |
| $23,001 - $25,000 | 20% |
| $25,001 - $38,250 | 10% |
| Over $38,250 | 0% |

#### Married Filing Jointly
| AGI | Credit Rate |
|-----|-------------|
| Up to $46,000 | 50% |
| $46,001 - $50,000 | 20% |
| $50,001 - $76,500 | 10% |
| Over $76,500 | 0% |

#### Head of Household
| AGI | Credit Rate |
|-----|-------------|
| Up to $34,500 | 50% |
| $34,501 - $37,500 | 20% |
| $37,501 - $57,375 | 10% |
| Over $57,375 | 0% |

### Maximum Credit
- **Single/HOH/MFS:** $1,000 (50% of $2,000)
- **MFJ:** $2,000 (50% of $4,000)

### Eligibility Requirements
- Age 18 or older
- Not claimed as a dependent
- Not a full-time student

---

## Energy Credits

### Residential Clean Energy Credit

#### Overview
30% credit for costs of clean energy equipment installed in your home.

#### Qualified Equipment
- Solar electric panels (photovoltaic)
- Solar water heaters
- Wind turbines
- Geothermal heat pumps
- Fuel cells
- Battery storage (3+ kWh capacity)

#### Calculation
- **Credit Rate:** 30% of qualified costs
- **No annual maximum** (for most equipment)
- Unused credit can be carried forward to future years

#### Timeframe
- 30% rate through 2032
- 26% rate for 2033
- 22% rate for 2034

---

### Energy Efficient Home Improvement Credit

#### Overview
Credit for making energy-efficient improvements to your main home.

#### Qualified Improvements
**Building Envelope (up to $1,200/year total):**
- Exterior doors: $250/door, max $500
- Windows/skylights: $600 max
- Insulation: $1,200 max
- Central air conditioners: $600 max

**Heat Pumps and Biomass (up to $2,000/year):**
- Heat pump water heaters
- Heat pump HVAC systems
- Biomass stoves and boilers

#### Calculation
- **Credit Rate:** 30% of qualified costs
- **Annual Limits:**
  - $1,200 for most items
  - $2,000 for heat pumps/biomass
  - $3,200 total maximum per year

#### Home Energy Audit Credit
- 30% of audit cost
- Maximum $150/year

---

### Clean Vehicle Credit

#### New Clean Vehicles

**Maximum Credit:** $7,500

**Eligibility Requirements:**
- Vehicle must be new
- Final assembly in North America
- MSRP limits:
  - Vans, SUVs, trucks: $80,000
  - Other vehicles: $55,000

**Income Limits (2024):**
| Filing Status | Max AGI |
|---------------|---------|
| Single | $150,000 |
| HOH | $225,000 |
| MFJ | $300,000 |

**Credit Components:**
- $3,750 for meeting critical minerals requirements
- $3,750 for meeting battery components requirements

---

#### Used Clean Vehicles

**Maximum Credit:** Lesser of $4,000 or 30% of sale price

**Eligibility Requirements:**
- Vehicle must be at least 2 years old
- Purchase price must be $25,000 or less
- First transfer after initial sale

**Income Limits (2024):**
| Filing Status | Max AGI |
|---------------|---------|
| Single | $75,000 |
| HOH | $112,500 |
| MFJ | $150,000 |

---

## API Reference

### Calculate Tax with Credits

**Endpoint:** `POST /api/tax/calculator`

**Request Body:**
```json
{
  "taxYear": 2024,
  "filingStatus": "married_jointly",
  "grossIncome": 85000,
  "qualifyingChildren": 2,
  "childCareCosts": 6000,
  "retirementContributions": 6000,
  "aotcEligibleStudents": 1,
  "tuitionPerStudent": 4000,
  "residentialCleanEnergyExpenses": 15000
}
```

**Response includes credits breakdown:**
```json
{
  "federal": {
    "credits": [
      { "name": "Child Tax Credit", "amount": 4000, "refundable": false },
      { "name": "Child and Dependent Care Credit", "amount": 1200, "refundable": false },
      { "name": "American Opportunity Tax Credit", "amount": 1500, "refundable": false },
      { "name": "American Opportunity Tax Credit (Refundable)", "amount": 1000, "refundable": true },
      { "name": "Residential Clean Energy Credit", "amount": 4500, "refundable": false }
    ],
    "totalCredits": 12200
  }
}
```

---

## Examples

### Example 1: Family with Children

**Situation:**
- Married filing jointly
- 2 children under 17
- $75,000 combined income
- $8,000 in child care expenses
- $4,000 in retirement contributions

**Credits:**
- Child Tax Credit: $4,000 (2 × $2,000)
- Child Care Credit: $1,200 (20% of $6,000 max)
- Saver's Credit: $800 (20% of $4,000)
- **Total Credits: $6,000**

---

### Example 2: College Student

**Situation:**
- Single filer
- $45,000 income
- Paying own tuition
- $6,000 tuition expenses
- First year of college

**Credits:**
- American Opportunity Tax Credit:
  - 100% of $2,000 = $2,000
  - 25% of $2,000 = $500
  - Total: $2,500 ($1,500 nonrefundable, $1,000 refundable)

---

### Example 3: Low-Income Worker with Child

**Situation:**
- Head of household
- 1 qualifying child
- $28,000 earned income
- No investment income

**Credits:**
- EITC: $4,213 (maximum for 1 child)
- **Fully refundable!**

---

### Example 4: Energy-Conscious Homeowner

**Situation:**
- Single filer
- $120,000 income
- Installed $25,000 solar panel system
- Added $5,000 in insulation

**Credits:**
- Residential Clean Energy: $7,500 (30% of $25,000)
- Energy Efficient Improvements: $1,200 (30% of $5,000, capped)
- **Total Credits: $8,700**

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-01-12 | Added EITC, AOTC, LLC, Saver's, Energy credits |
| 1.0.0 | 2024-01-01 | Initial release with CTC and Care Credit |

---

## Related Documentation

- [Tax Calculator API](./API_REFERENCE.md)
- [OCR Document Scanning](./OCR_DOCUMENT_SCANNING.md)
- [Filing Guide](./FILING_GUIDE.md)
