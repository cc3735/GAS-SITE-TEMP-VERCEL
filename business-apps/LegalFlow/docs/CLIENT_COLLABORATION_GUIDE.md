# Client Collaboration Portal Guide

## Overview

The Client Collaboration Portal enables secure multi-user access to tax returns with role-based permissions, document sharing, e-signature support, and real-time notifications. This feature is designed for tax preparers working with clients, joint filers, or professional reviewers.

## Table of Contents

1. [Key Features](#key-features)
2. [User Roles](#user-roles)
3. [Inviting Collaborators](#inviting-collaborators)
4. [Document Requests](#document-requests)
5. [Document Sharing](#document-sharing)
6. [E-Signatures](#e-signatures)
7. [Notifications](#notifications)
8. [Activity Logging](#activity-logging)
9. [API Reference](#api-reference)
10. [Security](#security)
11. [Examples](#examples)

---

## Key Features

| Feature | Description |
|---------|-------------|
| Multi-User Access | Multiple users can collaborate on a single tax return |
| Role-Based Permissions | Fine-grained access control based on user roles |
| Document Requests | Tax preparers can request specific documents from clients |
| Secure Document Sharing | Share documents with encryption and access controls |
| E-Signatures | Request and collect electronic signatures on forms |
| Real-Time Notifications | Email and in-app notifications for all activities |
| Activity Logging | Complete audit trail of all actions |

---

## User Roles

### Role Overview

| Role | Description | Use Case |
|------|-------------|----------|
| Owner | Full access, primary taxpayer | The person whose return it is |
| Preparer | Can prepare and edit returns | CPA, tax preparer, EA |
| Reviewer | View-only with commenting | Quality review, supervisor |
| Client | Upload docs, view, sign | Client working with preparer |
| Spouse | Joint filer with full access | Married filing jointly |

### Default Permissions by Role

| Permission | Owner | Preparer | Reviewer | Client | Spouse |
|------------|-------|----------|----------|--------|--------|
| View Return | Yes | Yes | Yes | Yes | Yes |
| Edit Return | Yes | Yes | No | No | Yes |
| Add Comments | Yes | Yes | Yes | Yes | Yes |
| Upload Documents | Yes | Yes | No | Yes | Yes |
| Delete Documents | Yes | No | No | No | No |
| Sign Documents | Yes | No | No | Yes | Yes |
| Invite Others | Yes | Yes | No | No | No |
| Export Data | Yes | Yes | Yes | Yes | Yes |

---

## Inviting Collaborators

### Invite Flow

```
1. Owner/Preparer creates invite
2. System sends email to invitee
3. Invitee creates account (if needed)
4. Invitee accepts invite
5. Access granted with specified permissions
```

### Invite Statuses

| Status | Description |
|--------|-------------|
| pending | Invite sent, awaiting response |
| accepted | Invite accepted, user has access |
| declined | Invite rejected |
| expired | Invite expired (default: 7 days) |
| revoked | Invite cancelled by inviter |

### API: Send Invite

```bash
POST /api/collaboration/invite

{
  "returnId": "return-uuid",
  "email": "client@example.com",
  "role": "client",
  "permissions": {
    "canView": true,
    "canEdit": false,
    "canComment": true,
    "canUpload": true,
    "canDelete": false,
    "canSign": true,
    "canInvite": false,
    "canExport": true
  },
  "message": "Please review your tax return and upload your W-2s"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "invite-uuid",
    "returnId": "return-uuid",
    "invitedEmail": "client@example.com",
    "invitedByUserId": "preparer-uuid",
    "role": "client",
    "status": "pending",
    "expiresAt": "2024-01-20T00:00:00Z",
    "createdAt": "2024-01-13T10:30:00Z"
  },
  "message": "Invitation sent to client@example.com"
}
```

### API: Accept Invite

```bash
POST /api/collaboration/invites/:inviteId/accept
```

### API: Get Pending Invites

```bash
GET /api/collaboration/invites/pending
```

---

## Document Requests

### Purpose

Tax preparers can request specific documents from clients, with tracking for due dates, priority, and fulfillment status.

### Request Flow

```
1. Preparer creates document request
2. Client receives notification
3. Client uploads requested documents
4. Preparer reviews and approves
5. Request marked as fulfilled
```

### Document Request Statuses

| Status | Description |
|--------|-------------|
| pending | Request created, awaiting documents |
| partial | Some documents uploaded, others pending |
| fulfilled | All documents received |
| rejected | Documents not accepted, re-upload needed |

### Supported Document Types

| Type | Name | Description |
|------|------|-------------|
| w2 | W-2 | Wage and Tax Statement |
| 1099_int | 1099-INT | Interest Income |
| 1099_div | 1099-DIV | Dividend Income |
| 1099_b | 1099-B | Stock Sales |
| 1099_misc | 1099-MISC | Miscellaneous Income |
| 1099_nec | 1099-NEC | Nonemployee Compensation |
| 1099_g | 1099-G | Government Payments |
| 1099_r | 1099-R | Retirement Distributions |
| 1098 | 1098 | Mortgage Interest Statement |
| 1098_t | 1098-T | Tuition Statement |
| 1095_a | 1095-A | Health Insurance Marketplace |
| id | ID Document | Driver's License or State ID |
| ssn_card | Social Security Card | SSN verification |
| bank_statement | Bank Statement | For direct deposit |
| prior_return | Prior Year Return | Previous tax return |
| property_tax | Property Tax Statement | Real estate records |
| charitable_receipt | Donation Receipt | Charitable contributions |
| medical_expenses | Medical Expenses | Healthcare costs |
| business_income | Business Income | Self-employment income |
| business_expenses | Business Expenses | Self-employment expenses |
| other | Other Document | Any other document |

### API: Create Document Request

```bash
POST /api/collaboration/document-requests

{
  "returnId": "return-uuid",
  "requestedFromUserId": "client-uuid",
  "documentTypes": ["w2", "1099_int", "1098"],
  "customDescription": "Please upload all W-2s from 2024 employers",
  "dueDate": "2024-02-01",
  "priority": "high"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "request-uuid",
    "returnId": "return-uuid",
    "requestedByUserId": "preparer-uuid",
    "requestedFromUserId": "client-uuid",
    "documentTypes": ["w2", "1099_int", "1098"],
    "customDescription": "Please upload all W-2s from 2024 employers",
    "status": "pending",
    "priority": "high",
    "dueDate": "2024-02-01T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### API: Fulfill Document Request

```bash
POST /api/collaboration/document-requests/:requestId/fulfill

{
  "documents": [
    {
      "documentType": "w2",
      "fileName": "W2-employer1.pdf",
      "fileUrl": "https://storage.example.com/documents/w2-1.pdf"
    },
    {
      "documentType": "1099_int",
      "fileName": "1099-INT-bank.pdf",
      "fileUrl": "https://storage.example.com/documents/1099-int-1.pdf"
    }
  ]
}
```

---

## Document Sharing

### Features

- Share documents with specific collaborators
- Set access level (view-only or download)
- Set expiration dates for temporary access
- Automatic encryption for sensitive documents
- Access revocation at any time

### Access Levels

| Level | Description |
|-------|-------------|
| view | View document only, no download |
| download | Can view and download |
| edit | Can view, download, and edit (for editable docs) |

### API: Share Document

```bash
POST /api/collaboration/documents/share

{
  "returnId": "return-uuid",
  "documentId": "document-uuid",
  "sharedWithUserIds": ["user-uuid-1", "user-uuid-2"],
  "accessLevel": "view",
  "expiresAt": "2024-03-01"
}
```

### API: Get Shared Documents

```bash
GET /api/collaboration/documents/shared/:returnId
```

### API: Revoke Sharing

```bash
DELETE /api/collaboration/documents/share/:shareId
```

---

## E-Signatures

### Overview

The e-signature feature enables secure electronic signing of tax documents, including:
- IRS Form 8879 (e-file authorization)
- State e-file authorization forms
- Engagement letters
- Any document requiring signature

### Signature Types

| Type | Description |
|------|-------------|
| typed | Typed name as signature |
| drawn | Hand-drawn signature (touch/mouse) |
| uploaded | Uploaded signature image |

### Signature Flow

```
1. Preparer creates signature request
2. Signers receive notification
3. Signer reviews document
4. Signer applies signature
5. All parties notified of completion
6. Signed document stored securely
```

### API: Request Signature

```bash
POST /api/collaboration/signatures/request

{
  "returnId": "return-uuid",
  "documentId": "form-8879-uuid",
  "signerUserIds": ["taxpayer-uuid", "spouse-uuid"],
  "signatureLocations": [
    {
      "page": 1,
      "x": 100,
      "y": 500,
      "width": 200,
      "height": 50,
      "signerUserId": "taxpayer-uuid",
      "label": "Taxpayer Signature"
    },
    {
      "page": 1,
      "x": 100,
      "y": 550,
      "width": 200,
      "height": 50,
      "signerUserId": "spouse-uuid",
      "label": "Spouse Signature"
    }
  ],
  "dueDate": "2024-02-10",
  "reminderDays": [3, 1]
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "signature-request-uuid",
    "returnId": "return-uuid",
    "documentId": "form-8879-uuid",
    "status": "pending",
    "signers": [
      {
        "userId": "taxpayer-uuid",
        "status": "pending",
        "signedAt": null
      },
      {
        "userId": "spouse-uuid",
        "status": "pending",
        "signedAt": null
      }
    ],
    "dueDate": "2024-02-10T00:00:00Z",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### API: Sign Document

```bash
POST /api/collaboration/signatures/:requestId/sign

{
  "signatureData": "data:image/png;base64,iVBORw0KGgo...",
  "signatureType": "drawn"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "signatureRequestId": "signature-request-uuid",
    "signerId": "taxpayer-uuid",
    "signedAt": "2024-01-16T14:30:00Z",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "allSigned": false,
    "remainingSigners": 1
  },
  "message": "Document signed successfully"
}
```

### API: Get Pending Signatures

```bash
GET /api/collaboration/signatures/pending/me
```

---

## Notifications

### Notification Types

| Type | Description |
|------|-------------|
| invite_received | You've been invited to collaborate |
| invite_accepted | Someone accepted your invite |
| document_request | Documents have been requested |
| document_uploaded | Documents were uploaded |
| signature_request | Signature requested on document |
| signature_received | Someone signed a document |
| return_updated | Tax return was modified |
| comment_added | New comment on return |
| deadline_reminder | Upcoming deadline |

### Notification Channels

| Channel | Description |
|---------|-------------|
| in_app | Shown in portal notifications |
| email | Sent via email |
| sms | Sent via SMS (if enabled) |
| push | Push notification (mobile app) |

### API: Get Notifications

```bash
GET /api/collaboration/notifications?unreadOnly=true&limit=20
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "notification-uuid",
      "userId": "user-uuid",
      "type": "signature_request",
      "title": "Signature Required",
      "message": "Please sign Form 8879 for your 2024 tax return",
      "returnId": "return-uuid",
      "metadata": {
        "documentId": "form-8879-uuid",
        "signatureRequestId": "request-uuid"
      },
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### API: Mark Notification Read

```bash
PUT /api/collaboration/notifications/:notificationId/read
```

### API: Mark All Read

```bash
PUT /api/collaboration/notifications/read-all
```

---

## Activity Logging

### Purpose

Complete audit trail of all activities on a tax return for compliance and transparency.

### Logged Activities

| Action | Description |
|--------|-------------|
| invite_sent | Collaboration invite sent |
| invite_accepted | Invite accepted |
| invite_declined | Invite declined |
| collaborator_removed | Collaborator removed |
| permissions_updated | Permissions changed |
| document_uploaded | Document uploaded |
| document_deleted | Document deleted |
| document_shared | Document shared |
| share_revoked | Document sharing revoked |
| signature_requested | Signature requested |
| document_signed | Document signed |
| signature_declined | Signature declined |
| return_viewed | Return viewed |
| return_edited | Return edited |
| comment_added | Comment added |
| export_generated | Data exported |

### API: Get Activity Log

```bash
GET /api/collaboration/activity/:returnId?limit=50&offset=0
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "activity-uuid",
      "returnId": "return-uuid",
      "userId": "user-uuid",
      "userName": "John Smith",
      "action": "document_uploaded",
      "description": "Uploaded W-2 from ABC Company",
      "metadata": {
        "documentId": "doc-uuid",
        "documentType": "w2",
        "fileName": "W2-ABC.pdf"
      },
      "ipAddress": "192.168.1.1",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

---

## API Reference

### Collaboration Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collaboration/collaborators/:returnId` | Get collaborators |
| POST | `/api/collaboration/invite` | Send invite |
| GET | `/api/collaboration/invites/pending` | Get pending invites |
| POST | `/api/collaboration/invites/:id/accept` | Accept invite |
| POST | `/api/collaboration/invites/:id/decline` | Decline invite |
| PUT | `/api/collaboration/collaborators/:id` | Update collaborator |
| DELETE | `/api/collaboration/collaborators/:id` | Remove collaborator |

### Document Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collaboration/document-requests` | Create request |
| GET | `/api/collaboration/document-requests/:returnId` | Get requests for return |
| GET | `/api/collaboration/document-requests/pending/me` | Get my pending requests |
| POST | `/api/collaboration/document-requests/:id/fulfill` | Fulfill request |
| PUT | `/api/collaboration/document-requests/:id/status` | Update status |

### Document Sharing

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collaboration/documents/share` | Share document |
| GET | `/api/collaboration/documents/shared/:returnId` | Get shared docs |
| GET | `/api/collaboration/documents/shared-with-me` | Docs shared with me |
| DELETE | `/api/collaboration/documents/share/:id` | Revoke sharing |

### E-Signatures

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collaboration/signatures/request` | Request signature |
| GET | `/api/collaboration/signatures/pending/me` | My pending signatures |
| GET | `/api/collaboration/signatures/:returnId` | Get signature requests |
| POST | `/api/collaboration/signatures/:id/sign` | Sign document |
| POST | `/api/collaboration/signatures/:id/decline` | Decline to sign |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collaboration/notifications` | Get notifications |
| PUT | `/api/collaboration/notifications/:id/read` | Mark read |
| PUT | `/api/collaboration/notifications/read-all` | Mark all read |

### Activity & Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collaboration/activity/:returnId` | Get activity log |
| GET | `/api/collaboration/overview` | Get portal overview |
| GET | `/api/collaboration/returns/shared` | Get shared returns |
| GET | `/api/collaboration/permissions/:returnId` | Get my permissions |
| GET | `/api/collaboration/roles` | Get available roles |
| GET | `/api/collaboration/document-types` | Get document types |

---

## Security

### Data Protection

| Feature | Implementation |
|---------|----------------|
| Encryption at Rest | AES-256 encryption for all documents |
| Encryption in Transit | TLS 1.3 for all API communications |
| Access Control | Role-based with per-field permissions |
| Session Management | JWT tokens with 24-hour expiration |
| Audit Trail | All actions logged with IP and timestamp |

### Compliance

- **IRS Requirements**: Meets IRS e-file security requirements
- **SOC 2**: Designed for SOC 2 Type II compliance
- **Data Retention**: Configurable retention policies
- **Access Logs**: Complete audit trail for all access

### Best Practices

1. **Least Privilege**: Grant minimum necessary permissions
2. **Regular Review**: Audit collaborator list periodically
3. **Expiring Access**: Use expiration dates for temporary access
4. **Document Verification**: Verify document authenticity before use
5. **Secure Channels**: Use secure methods for sharing sensitive info

---

## Examples

### Example 1: Tax Preparer Workflow

```javascript
// 1. Invite client to collaborate
const invite = await api.post('/collaboration/invite', {
  returnId: 'return-123',
  email: 'client@example.com',
  role: 'client',
  message: 'Please join to upload your tax documents'
});

// 2. Request documents from client
const request = await api.post('/collaboration/document-requests', {
  returnId: 'return-123',
  requestedFromUserId: 'client-user-id',
  documentTypes: ['w2', '1099_int', '1098'],
  dueDate: '2024-02-01',
  priority: 'high'
});

// 3. Wait for client to upload documents...

// 4. Request signature on Form 8879
const sigRequest = await api.post('/collaboration/signatures/request', {
  returnId: 'return-123',
  documentId: 'form-8879-id',
  signerUserIds: ['client-user-id'],
  signatureLocations: [{
    page: 1,
    x: 100,
    y: 500,
    width: 200,
    height: 50,
    signerUserId: 'client-user-id',
    label: 'Taxpayer Signature'
  }]
});
```

### Example 2: Client Workflow

```javascript
// 1. Check for pending invites
const invites = await api.get('/collaboration/invites/pending');

// 2. Accept invite
await api.post(`/collaboration/invites/${inviteId}/accept`);

// 3. View document requests
const requests = await api.get('/collaboration/document-requests/pending/me');

// 4. Upload requested documents
await api.post(`/collaboration/document-requests/${requestId}/fulfill`, {
  documents: [
    {
      documentType: 'w2',
      fileName: 'W2-2024.pdf',
      fileUrl: 'https://storage.example.com/w2.pdf'
    }
  ]
});

// 5. Sign when requested
const pendingSigs = await api.get('/collaboration/signatures/pending/me');
await api.post(`/collaboration/signatures/${sigRequestId}/sign`, {
  signatureData: 'John Smith',
  signatureType: 'typed'
});
```

### Example 3: Joint Filer Workflow

```javascript
// 1. Primary filer invites spouse
await api.post('/collaboration/invite', {
  returnId: 'return-123',
  email: 'spouse@example.com',
  role: 'spouse'
});

// 2. Both can now edit the return
// 3. Both must sign for e-file
const sigRequest = await api.post('/collaboration/signatures/request', {
  returnId: 'return-123',
  documentId: 'form-8879-id',
  signerUserIds: ['taxpayer-id', 'spouse-id'],
  signatureLocations: [
    { page: 1, x: 100, y: 500, signerUserId: 'taxpayer-id', label: 'Taxpayer' },
    { page: 1, x: 100, y: 550, signerUserId: 'spouse-id', label: 'Spouse' }
  ]
});
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with full collaboration features |

---

## Related Documentation

- [E-Filing Guide](./E_FILING_GUIDE.md)
- [Tax Calculator Guide](./TAX_CALCULATOR.md)
- [Business Tax Guide](./BUSINESS_TAX_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
