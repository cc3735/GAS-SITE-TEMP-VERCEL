# Expanded Legal Services Guide

## Overview

LegalFlow provides comprehensive document preparation services for a wide range of legal documents including family law, estate planning, real estate, employment, and business documents. This guide covers all available document types, templates, and the document preparation process.

## Table of Contents

1. [Document Categories](#document-categories)
2. [Family Law Documents](#family-law-documents)
3. [Estate Planning Documents](#estate-planning-documents)
4. [Real Estate Documents](#real-estate-documents)
5. [Employment Documents](#employment-documents)
6. [Business Documents](#business-documents)
7. [Document Workflow](#document-workflow)
8. [API Reference](#api-reference)
9. [Examples](#examples)

---

## Document Categories

| Category | Description | Documents |
|----------|-------------|-----------|
| Family Law | Divorce, custody, family matters | Divorce petition, settlement, custody |
| Estate Planning | Wills, POA, directives | POA, living will, simple will |
| Real Estate | Property, landlord-tenant | Leases, eviction notices |
| Employment | Work contracts, HR | Employment contracts, contractor agreements |
| Business | NDAs, general contracts | NDAs, general agreements |

---

## Family Law Documents

### Divorce Petition

Initial filing to start divorce proceedings.

**Required Information:**
- Both spouses' names and addresses
- Marriage date and location
- Separation date
- Grounds for divorce
- Information about minor children (if any)
- Property to be divided

**Filing Fee:** ~$350 (varies by state/county)

### Marital Settlement Agreement

Agreement between spouses on division of property, debts, and custody.

**Covers:**
- Real property division
- Personal property division
- Debt allocation
- Spousal support
- Child custody (if applicable)
- Child support (if applicable)
- Retirement accounts

### Child Custody Agreement

Parenting plan for custody and visitation.

**Includes:**
- Legal custody (decision-making)
- Physical custody (residence)
- Regular visitation schedule
- Holiday schedule
- Transportation arrangements
- Communication provisions

### API: Create Divorce Petition

```bash
POST /api/legal/expanded/documents

{
  "templateId": "divorce_petition",
  "state": "CA",
  "data": {
    "petitioner_name": "Jane Smith",
    "petitioner_address": {
      "street": "123 Main St",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90001"
    },
    "respondent_name": "John Smith",
    "respondent_address": {
      "street": "456 Oak Ave",
      "city": "Los Angeles",
      "state": "CA",
      "zip": "90002"
    },
    "marriage_date": "2010-06-15",
    "marriage_location": "Los Angeles, CA",
    "separation_date": "2024-01-01",
    "grounds": "Irreconcilable differences",
    "children": true,
    "child_names": "Emma Smith (age 10), Michael Smith (age 7)",
    "property_division": "Yes",
    "spousal_support": true,
    "child_custody": "Joint custody"
  }
}
```

---

## Estate Planning Documents

### Financial Power of Attorney

Authorizes someone to handle your financial affairs.

**Types:**
| Type | Description |
|------|-------------|
| Durable | Continues if you become incapacitated |
| Springing | Only effective upon incapacity |
| Limited | For specific purpose or time |
| General | Broad financial powers |

**Powers Typically Granted:**
- Banking transactions
- Real estate transactions
- Investment management
- Tax filings
- Bill payment
- Contract signing

### Healthcare Power of Attorney

Authorizes someone to make medical decisions if you cannot.

**Important Considerations:**
- Agent should know your healthcare wishes
- Discuss end-of-life preferences
- Update regularly
- Give copies to doctors

### Living Will / Advance Directive

Specifies your wishes for end-of-life medical treatment.

**Decisions Covered:**
- Life-sustaining treatment
- Artificial nutrition/hydration
- Pain management
- Organ donation

### Simple Will

Basic last will and testament.

**Includes:**
- Executor designation
- Beneficiary designations
- Specific gifts
- Residuary estate
- Guardian for minors (if applicable)

### API: Create Power of Attorney

```bash
POST /api/legal/expanded/documents

{
  "templateId": "power_of_attorney_financial",
  "state": "NY",
  "data": {
    "principal_name": "Robert Johnson",
    "principal_address": {
      "street": "789 Park Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10021"
    },
    "principal_dob": "1955-03-20",
    "agent_name": "Sarah Johnson",
    "agent_address": {
      "street": "321 Broadway",
      "city": "New York",
      "state": "NY",
      "zip": "10013"
    },
    "agent_relationship": "Daughter",
    "poa_type": "Durable (continues if incapacitated)",
    "effective_date": "Immediately",
    "powers_granted": "All financial matters including banking, investments, real estate, and tax filings",
    "successor_agent": "Michael Johnson (Son)"
  }
}
```

---

## Real Estate Documents

### Residential Lease Agreement

Standard rental agreement for residential property.

**Key Terms:**
- Lease duration
- Monthly rent amount
- Security deposit
- Late fees
- Utilities included
- Pet policy
- Maintenance responsibilities

**State-Specific Considerations:**
- Security deposit limits
- Required disclosures
- Notice requirements
- Rent control (where applicable)

### Eviction Notice

Notice to tenant to vacate or cure lease violation.

**Types:**
| Notice Type | Use Case |
|-------------|----------|
| Pay Rent or Quit | Non-payment of rent |
| Cure or Quit | Lease violation that can be fixed |
| Unconditional Quit | Severe violation, must leave |
| 30-Day Notice | Month-to-month termination |
| 60-Day Notice | Long-term tenant termination |

### API: Create Lease Agreement

```bash
POST /api/legal/expanded/documents

{
  "templateId": "residential_lease",
  "state": "TX",
  "data": {
    "landlord_name": "ABC Property Management LLC",
    "landlord_address": {
      "street": "100 Commerce St",
      "city": "Dallas",
      "state": "TX",
      "zip": "75201"
    },
    "tenant_name": "David Wilson",
    "property_address": {
      "street": "456 Elm Street, Unit 2B",
      "city": "Dallas",
      "state": "TX",
      "zip": "75202"
    },
    "lease_start": "2024-03-01",
    "lease_end": "2025-02-28",
    "monthly_rent": 1500,
    "due_date": 1,
    "security_deposit": 1500,
    "late_fee": 75,
    "utilities_included": "Water and trash",
    "pets_allowed": false,
    "parking": "One assigned parking space included"
  }
}
```

---

## Employment Documents

### Employment Agreement

Contract between employer and employee.

**Covers:**
- Job title and duties
- Compensation
- Benefits
- Work schedule
- Termination provisions
- Non-compete clauses (where enforceable)
- Confidentiality

### Independent Contractor Agreement

Contract for freelance or contract work.

**Key Distinctions from Employment:**
- Contractor controls how work is done
- Contractor responsible for own taxes
- No employee benefits
- Project-based or time-limited

**Important:** Misclassification can result in significant penalties.

### API: Create Employment Contract

```bash
POST /api/legal/expanded/documents

{
  "templateId": "employment_contract",
  "data": {
    "employer_name": "Tech Solutions Inc.",
    "employer_address": {
      "street": "500 Tech Drive",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    },
    "employee_name": "Jennifer Lee",
    "employee_address": {
      "street": "123 Market St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    },
    "job_title": "Software Engineer",
    "job_duties": "Design, develop, and maintain software applications. Participate in code reviews. Collaborate with cross-functional teams.",
    "start_date": "2024-04-01",
    "employment_type": "Full-time",
    "compensation": "$120,000 annual salary",
    "pay_frequency": "Bi-weekly",
    "benefits": "Health, dental, vision insurance; 401(k) with 4% match; stock options",
    "vacation_days": 15,
    "sick_days": 10,
    "probation_period": "90 days",
    "non_compete": true,
    "confidentiality": true
  }
}
```

---

## Business Documents

### Non-Disclosure Agreement (NDA)

Protects confidential information.

**Types:**
| Type | Description |
|------|-------------|
| One-Way (Unilateral) | One party discloses, other receives |
| Mutual (Bilateral) | Both parties share confidential info |

**Key Elements:**
- Definition of confidential information
- Purpose of disclosure
- Duration of confidentiality
- Exclusions
- Return of materials

### API: Create NDA

```bash
POST /api/legal/expanded/documents

{
  "templateId": "nda",
  "data": {
    "disclosing_party": "Innovative Startup Inc.",
    "disclosing_address": {
      "street": "200 Innovation Way",
      "city": "Austin",
      "state": "TX",
      "zip": "78701"
    },
    "receiving_party": "Big Corp Investments LLC",
    "receiving_address": {
      "street": "1000 Finance Blvd",
      "city": "New York",
      "state": "NY",
      "zip": "10004"
    },
    "nda_type": "Mutual (Bilateral)",
    "confidential_info": "Business plans, financial projections, customer lists, proprietary technology, trade secrets, and any information marked as confidential",
    "purpose": "Evaluation of potential investment or acquisition",
    "term": "3 years"
  }
}
```

---

## Document Workflow

### Status Progression

```
Draft → Review → Ready → Signed → Filed (if applicable)
```

| Status | Description |
|--------|-------------|
| Draft | Initial creation, can be edited |
| Review | Ready for review before signing |
| Ready | Finalized, ready for signatures |
| Signed | All required signatures obtained |
| Filed | Filed with appropriate authority |

### Workflow Steps

1. **Create Document**
   ```bash
   POST /api/legal/expanded/documents
   ```

2. **Update/Edit**
   ```bash
   PUT /api/legal/expanded/documents/:id
   ```

3. **Generate PDF**
   ```bash
   POST /api/legal/expanded/documents/:id/generate-pdf
   ```

4. **Sign** (via collaboration portal)
   ```bash
   POST /api/collaboration/signatures/request
   ```

5. **File** (if required)
   - Download PDF
   - File with appropriate court/agency
   - Update status

---

## API Reference

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/legal/expanded/templates` | Get all templates |
| GET | `/api/legal/expanded/templates/:id` | Get specific template |
| GET | `/api/legal/expanded/categories` | Get all categories |
| GET | `/api/legal/expanded/categories/:cat/templates` | Get templates by category |

### Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/legal/expanded/documents` | Create document |
| GET | `/api/legal/expanded/documents` | Get user's documents |
| GET | `/api/legal/expanded/documents/:id` | Get specific document |
| PUT | `/api/legal/expanded/documents/:id` | Update document |
| DELETE | `/api/legal/expanded/documents/:id` | Delete draft |
| POST | `/api/legal/expanded/documents/:id/generate-pdf` | Generate PDF |

### Information

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/legal/expanded/filing-info/:templateId/:state` | Get filing info |
| GET | `/api/legal/expanded/summary` | Get document summary |
| GET | `/api/legal/expanded/guides/:templateId` | Get step-by-step guide |

---

## Examples

### Example 1: Complete Estate Planning Package

```javascript
// Create Power of Attorney - Financial
const financialPoa = await api.post('/legal/expanded/documents', {
  templateId: 'power_of_attorney_financial',
  state: 'FL',
  data: {
    principal_name: 'William Brown',
    principal_dob: '1950-08-15',
    agent_name: 'Elizabeth Brown',
    // ... more fields
  }
});

// Create Power of Attorney - Healthcare
const healthcarePoa = await api.post('/legal/expanded/documents', {
  templateId: 'power_of_attorney_healthcare',
  state: 'FL',
  data: {
    principal_name: 'William Brown',
    agent_name: 'Elizabeth Brown',
    // ... more fields
  }
});

// Create Living Will
const livingWill = await api.post('/legal/expanded/documents', {
  templateId: 'living_will',
  state: 'FL',
  data: {
    declarant_name: 'William Brown',
    terminal_condition: 'Withhold life-sustaining treatment',
    // ... more fields
  }
});

// Create Simple Will
const will = await api.post('/legal/expanded/documents', {
  templateId: 'simple_will',
  state: 'FL',
  data: {
    testator_name: 'William Brown',
    executor_name: 'Elizabeth Brown',
    residuary_beneficiary: 'Elizabeth Brown',
    // ... more fields
  }
});

// Generate PDFs for all
for (const doc of [financialPoa, healthcarePoa, livingWill, will]) {
  await api.post(`/legal/expanded/documents/${doc.data.id}/generate-pdf`);
}
```

### Example 2: Landlord Managing Properties

```javascript
// Create lease for new tenant
const lease = await api.post('/legal/expanded/documents', {
  templateId: 'residential_lease',
  state: 'CA',
  data: {
    landlord_name: 'Property Management Co.',
    tenant_name: 'New Tenant',
    property_address: { /* ... */ },
    monthly_rent: 2000,
    // ... more fields
  }
});

// If tenant doesn't pay, create eviction notice
const eviction = await api.post('/legal/expanded/documents', {
  templateId: 'eviction_notice',
  state: 'CA',
  data: {
    landlord_name: 'Property Management Co.',
    tenant_name: 'Problem Tenant',
    notice_type: 'Pay Rent or Quit',
    days_to_comply: 3,
    reason: 'Non-payment of rent for February 2024',
    amount_owed: 2000
  }
});
```

---

## Important Disclaimers

1. **Not Legal Advice**: This service provides document preparation only, not legal advice or representation.

2. **State Variations**: Laws vary significantly by state. Templates are designed to comply with general requirements but may need modification for specific jurisdictions.

3. **Professional Review**: For complex matters, consider having documents reviewed by an attorney.

4. **Filing Requirements**: You are responsible for properly filing documents with the appropriate courts or agencies.

5. **Updates**: Laws change frequently. Verify current requirements before using any document.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with family, estate, real estate, employment, business documents |

---

## Related Documentation

- [Client Collaboration Guide](./CLIENT_COLLABORATION_GUIDE.md)
- [E-Filing Guide](./E_FILING_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
