# Plaid Integration Guide

## Overview

LegalFlow integrates with Plaid to provide secure bank account connections, automatic tax document import (1099-INT, 1099-DIV), investment portfolio tracking, and direct deposit setup for tax refunds.

## Table of Contents

1. [Features](#features)
2. [Setup](#setup)
3. [Plaid Link Flow](#plaid-link-flow)
4. [Tax Document Import](#tax-document-import)
5. [Investment Tracking](#investment-tracking)
6. [Direct Deposit](#direct-deposit)
7. [API Reference](#api-reference)
8. [Security](#security)
9. [Webhooks](#webhooks)
10. [Examples](#examples)

---

## Features

| Feature | Description |
|---------|-------------|
| Bank Linking | Securely connect bank and investment accounts |
| 1099-INT Import | Auto-import interest income from banks |
| 1099-DIV Import | Auto-import dividend income from investments |
| Investment Holdings | View portfolio with real-time values |
| Cost Basis | Calculate capital gains for tax reporting |
| Direct Deposit | Set up refund direct deposit from linked accounts |
| Multi-Institution | Connect accounts from 11,000+ institutions |

---

## Setup

### Environment Variables

```bash
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret_key
PLAID_ENV=sandbox  # sandbox, development, or production
PLAID_WEBHOOK_URL=https://your-domain.com/api/plaid/webhook
```

### Plaid Environments

| Environment | Use Case | Data |
|-------------|----------|------|
| sandbox | Development and testing | Simulated data |
| development | Pre-production testing | Real institutions, test credentials |
| production | Live application | Real user data |

### Required Plaid Products

| Product | Purpose | Required |
|---------|---------|----------|
| transactions | Transaction history | No |
| auth | Direct deposit (routing/account numbers) | For refunds |
| investments | Investment holdings and transactions | For 1099-DIV |
| identity | Identity verification | No |

---

## Plaid Link Flow

### Overview

Plaid Link is a secure, embeddable UI that handles credential collection and account linking.

```
1. Frontend requests Link token from backend
2. Backend creates Link token with Plaid API
3. Frontend initializes Plaid Link with token
4. User authenticates with their bank
5. Plaid Link returns public token
6. Frontend sends public token to backend
7. Backend exchanges for access token and stores
```

### Step 1: Create Link Token

```bash
POST /api/plaid/link/token

{
  "products": ["transactions", "investments", "auth"],
  "accountTypes": ["depository", "investment"],
  "redirectUri": "https://your-app.com/plaid/callback"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "linkToken": "link-sandbox-abc123...",
    "expiration": "2024-01-14T00:00:00Z",
    "requestId": "req-xyz789"
  }
}
```

### Step 2: Initialize Plaid Link (Frontend)

```javascript
import { usePlaidLink } from 'react-plaid-link';

const { open, ready } = usePlaidLink({
  token: linkToken,
  onSuccess: async (publicToken, metadata) => {
    // Exchange public token for access token
    await api.post('/plaid/link/exchange', {
      publicToken,
      institutionId: metadata.institution.institution_id,
      institutionName: metadata.institution.name,
    });
  },
  onExit: (err, metadata) => {
    if (err) console.error('Link error:', err);
  },
});
```

### Step 3: Exchange Public Token

```bash
POST /api/plaid/link/exchange

{
  "publicToken": "public-sandbox-abc123...",
  "institutionId": "ins_1",
  "institutionName": "Chase"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "itemId": "item-xyz789",
    "message": "Account linked successfully"
  }
}
```

---

## Tax Document Import

### Supported Documents

| Document | Description | Source |
|----------|-------------|--------|
| 1099-INT | Interest Income | Banks, CDs, bonds |
| 1099-DIV | Dividend Income | Stocks, mutual funds, ETFs |

### Import Process

```
1. User links investment/bank accounts via Plaid
2. System fetches holdings and transactions
3. Interest and dividend income calculated
4. Tax documents generated and stored
5. Data available for tax return auto-fill
```

### API: Import Tax Documents

```bash
POST /api/plaid/tax-documents/import

{
  "taxYear": 2024
}
```

Response:
```json
{
  "success": true,
  "data": {
    "taxYear": 2024,
    "imported": {
      "1099-INT": 3,
      "1099-DIV": 5
    },
    "documents": {
      "1099-INT": [
        {
          "id": "1099int-abc123-2024",
          "payerName": "Chase Bank",
          "interestIncome": 245.67,
          "federalTaxWithheld": 0
        }
      ],
      "1099-DIV": [
        {
          "id": "1099div-xyz789-2024",
          "payerName": "Fidelity Investments",
          "ordinaryDividends": 1523.45,
          "qualifiedDividends": 1142.59,
          "totalCapitalGainDistributions": 234.56
        }
      ]
    }
  }
}
```

### API: Get Tax Documents

```bash
GET /api/plaid/tax-documents/2024
```

### API: Get Tax Document Summary

```bash
GET /api/plaid/tax-documents/2024/summary
```

Response:
```json
{
  "success": true,
  "data": {
    "taxYear": 2024,
    "totalInterestIncome": 523.45,
    "totalDividendIncome": 3456.78,
    "totalQualifiedDividends": 2592.59,
    "totalCapitalGains": 567.89,
    "totalFederalWithholding": 45.00,
    "totalStateTaxWithheld": 0,
    "documents1099INT": 3,
    "documents1099DIV": 5,
    "linkedInstitutions": ["Chase", "Fidelity", "Vanguard"]
  }
}
```

### 1099-INT Fields

| Field | Description |
|-------|-------------|
| interestIncome | Box 1: Interest income |
| earlyWithdrawalPenalty | Box 2: Early withdrawal penalty |
| interestOnUsSavingsBonds | Box 3: Interest on U.S. Savings Bonds |
| federalTaxWithheld | Box 4: Federal income tax withheld |
| investmentExpenses | Box 5: Investment expenses |
| foreignTaxPaid | Box 6: Foreign tax paid |
| taxExemptInterest | Box 8: Tax-exempt interest |
| marketDiscount | Box 10: Market discount |
| bondPremium | Box 11: Bond premium |

### 1099-DIV Fields

| Field | Description |
|-------|-------------|
| ordinaryDividends | Box 1a: Total ordinary dividends |
| qualifiedDividends | Box 1b: Qualified dividends |
| totalCapitalGainDistributions | Box 2a: Total capital gain distributions |
| unrecapturedSection1250Gain | Box 2b: Unrecaptured Section 1250 gain |
| section1202Gain | Box 2c: Section 1202 gain |
| collectiblesGain | Box 2d: Collectibles (28%) gain |
| nondividendDistributions | Box 3: Nondividend distributions |
| federalTaxWithheld | Box 4: Federal income tax withheld |
| foreignTaxPaid | Box 7: Foreign tax paid |
| exemptInterestDividends | Box 12: Exempt-interest dividends |

---

## Investment Tracking

### Holdings

```bash
GET /api/plaid/investments/holdings
```

Response:
```json
{
  "success": true,
  "data": {
    "holdings": [
      {
        "id": "holding-abc123",
        "securityName": "Apple Inc.",
        "securityTicker": "AAPL",
        "securityType": "equity",
        "quantity": 50,
        "costBasis": 7500.00,
        "currentValue": 9250.00,
        "unrealizedGainLoss": 1750.00,
        "unrealizedGainLossPercent": 23.33
      }
    ],
    "summary": {
      "totalHoldings": 25,
      "totalValue": 125000.00,
      "totalCostBasis": 100000.00,
      "totalUnrealizedGainLoss": 25000.00,
      "totalUnrealizedGainLossPercent": 25.00
    }
  }
}
```

### Transactions

```bash
GET /api/plaid/investments/transactions?startDate=2024-01-01&endDate=2024-12-31
```

Response:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-xyz789",
        "securityName": "Vanguard Total Stock Market ETF",
        "securityTicker": "VTI",
        "transactionType": "buy",
        "quantity": 10,
        "price": 250.00,
        "amount": 2500.00,
        "fees": 0,
        "date": "2024-03-15"
      }
    ],
    "count": 45,
    "dateRange": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}
```

### Cost Basis Calculation

```bash
GET /api/plaid/investments/cost-basis/2024
```

Response:
```json
{
  "success": true,
  "data": {
    "taxYear": 2024,
    "totalProceeds": 15000.00,
    "totalCostBasis": 12000.00,
    "totalGainLoss": 3000.00,
    "shortTermGainLoss": 500.00,
    "longTermGainLoss": 2500.00,
    "taxImplication": {
      "shortTermRate": "10-37% (ordinary income rates)",
      "longTermRate": "0%, 15%, or 20% (depending on income)",
      "netInvestmentIncomeTax": "3.8% (if applicable)"
    },
    "transactions": [...]
  }
}
```

---

## Direct Deposit

### Get Direct Deposit Info

```bash
GET /api/plaid/direct-deposit/:accountId
```

Response:
```json
{
  "success": true,
  "data": {
    "accountId": "account-abc123",
    "routingNumber": "021000021",
    "accountNumber": "****4567",
    "accountType": "checking",
    "bankName": "Chase",
    "accountNumberLast4": "4567"
  }
}
```

### Verify for Form Submission

```bash
GET /api/plaid/direct-deposit/:accountId/verify
```

This returns the full account number for secure form submission.

---

## API Reference

### Link Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plaid/link/token` | Create Link token |
| POST | `/api/plaid/link/exchange` | Exchange public token |

### Account Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plaid/accounts` | Get linked accounts |
| POST | `/api/plaid/accounts/:id/refresh` | Refresh balances |
| DELETE | `/api/plaid/accounts/:id` | Unlink account |

### Tax Documents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plaid/tax-documents/import` | Import tax documents |
| GET | `/api/plaid/tax-documents/:year` | Get tax documents |
| GET | `/api/plaid/tax-documents/:year/summary` | Get summary |

### Investments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plaid/investments/holdings` | Get holdings |
| GET | `/api/plaid/investments/transactions` | Get transactions |
| GET | `/api/plaid/investments/cost-basis/:year` | Calculate cost basis |

### Direct Deposit

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plaid/direct-deposit/:accountId` | Get deposit info |
| GET | `/api/plaid/direct-deposit/:accountId/verify` | Verify for submission |

### Institutions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plaid/institutions/search` | Search institutions |
| GET | `/api/plaid/institutions/:id` | Get institution details |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plaid/supported-products` | Get supported products |
| GET | `/api/plaid/status` | Check integration status |
| POST | `/api/plaid/webhook` | Handle Plaid webhooks |

---

## Security

### Data Protection

| Measure | Implementation |
|---------|----------------|
| Token Encryption | Access tokens encrypted at rest (AES-256) |
| Secure Transport | All API calls over TLS 1.3 |
| Token Isolation | Access tokens never exposed to frontend |
| Minimal Permissions | Request only necessary Plaid products |
| Webhook Verification | Verify Plaid webhook signatures |

### Compliance

- **PCI DSS**: Plaid is PCI DSS compliant
- **SOC 2 Type II**: Plaid maintains SOC 2 certification
- **Data Privacy**: User data handled per privacy policy
- **Access Control**: Role-based access to financial data

### Best Practices

1. **Never log access tokens** - They grant account access
2. **Rotate credentials** - Update Plaid secrets periodically
3. **Monitor webhooks** - Track `ITEM_LOGIN_REQUIRED` events
4. **Limit products** - Only request what you need
5. **Handle errors** - Gracefully handle connection issues

---

## Webhooks

### Supported Webhook Types

| Type | Description |
|------|-------------|
| ITEM | Account connection status changes |
| TRANSACTIONS | New transactions available |
| INVESTMENTS_TRANSACTIONS | New investment transactions |
| HOLDINGS | Portfolio holdings updated |

### Webhook Events

| Event | Action |
|-------|--------|
| ITEM_LOGIN_REQUIRED | Mark account for re-authentication |
| ERROR | Log error and update account status |
| DEFAULT_UPDATE | Trigger data refresh |
| HISTORICAL_UPDATE | Large data update available |

### Webhook Endpoint

```bash
POST /api/plaid/webhook

{
  "webhook_type": "ITEM",
  "webhook_code": "ERROR",
  "item_id": "item-abc123",
  "error": {
    "error_type": "ITEM_ERROR",
    "error_code": "ITEM_LOGIN_REQUIRED",
    "error_message": "User needs to re-authenticate"
  }
}
```

---

## Examples

### Example 1: Complete Link and Import Flow

```javascript
// Frontend: Initialize Plaid Link
const PlaidLinkButton = () => {
  const [linkToken, setLinkToken] = useState(null);

  useEffect(() => {
    // Get link token from backend
    api.post('/plaid/link/token', {
      products: ['transactions', 'investments', 'auth']
    }).then(res => setLinkToken(res.data.linkToken));
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken, metadata) => {
      // Exchange token
      await api.post('/plaid/link/exchange', {
        publicToken,
        institutionId: metadata.institution.institution_id,
        institutionName: metadata.institution.name,
      });

      // Import tax documents
      await api.post('/plaid/tax-documents/import', {
        taxYear: 2024
      });

      alert('Account linked and documents imported!');
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Link Bank Account
    </button>
  );
};
```

### Example 2: Display Tax Document Summary

```javascript
const TaxDocumentSummary = ({ taxYear }) => {
  const { data: summary } = useQuery(
    ['taxDocuments', taxYear],
    () => api.get(`/plaid/tax-documents/${taxYear}/summary`)
  );

  return (
    <div>
      <h2>Tax Year {taxYear} Summary</h2>
      <table>
        <tbody>
          <tr>
            <td>Interest Income (1099-INT)</td>
            <td>${summary.totalInterestIncome.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Dividend Income (1099-DIV)</td>
            <td>${summary.totalDividendIncome.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Qualified Dividends</td>
            <td>${summary.totalQualifiedDividends.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Capital Gain Distributions</td>
            <td>${summary.totalCapitalGains.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Federal Withholding</td>
            <td>${summary.totalFederalWithholding.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
      <p>Documents: {summary.documents1099INT} 1099-INT, {summary.documents1099DIV} 1099-DIV</p>
      <p>Institutions: {summary.linkedInstitutions.join(', ')}</p>
    </div>
  );
};
```

### Example 3: Set Up Direct Deposit for Refund

```javascript
const DirectDepositSetup = ({ accounts }) => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [depositInfo, setDepositInfo] = useState(null);

  const handleSelectAccount = async (accountId) => {
    setSelectedAccount(accountId);

    // Get direct deposit info
    const res = await api.get(`/plaid/direct-deposit/${accountId}/verify`);
    setDepositInfo(res.data);
  };

  const handleConfirm = async () => {
    // Save to tax return
    await api.patch('/tax/returns/current', {
      refundMethod: 'direct_deposit',
      routingNumber: depositInfo.routingNumber,
      accountNumber: depositInfo.accountNumber,
      accountType: depositInfo.accountType,
    });
  };

  return (
    <div>
      <h3>Select Account for Refund</h3>
      <select onChange={(e) => handleSelectAccount(e.target.value)}>
        <option value="">Select account...</option>
        {accounts.map(account => (
          <option key={account.accountId} value={account.accountId}>
            {account.name} (****{account.mask})
          </option>
        ))}
      </select>

      {depositInfo && (
        <div>
          <p>Bank: {depositInfo.bankName}</p>
          <p>Routing: {depositInfo.routingNumber}</p>
          <p>Account: ****{depositInfo.accountNumber.slice(-4)}</p>
          <p>Type: {depositInfo.accountType}</p>
          <button onClick={handleConfirm}>Confirm</button>
        </div>
      )}
    </div>
  );
};
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| ITEM_LOGIN_REQUIRED | User needs to re-authenticate via Plaid Link |
| NO_ACCOUNTS | User didn't select any accounts during Link |
| INVALID_CREDENTIALS | Sandbox credentials invalid (use test credentials) |
| PRODUCT_NOT_ENABLED | Enable product in Plaid dashboard |

### Sandbox Testing

Use these credentials in sandbox:
- Username: `user_good`
- Password: `pass_good`

For testing errors:
- `user_bad` - Invalid credentials
- `user_locked` - Locked account

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with tax document import, investments, direct deposit |

---

## Related Documentation

- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [E-Filing Guide](./E_FILING_GUIDE.md)
- [Client Collaboration Guide](./CLIENT_COLLABORATION_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
