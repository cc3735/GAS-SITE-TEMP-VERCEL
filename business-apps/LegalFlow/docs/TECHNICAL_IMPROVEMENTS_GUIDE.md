# Technical Improvements Guide

## Overview

This guide covers the technical infrastructure improvements implemented in LegalFlow, including enhanced caching, cursor-based pagination, encryption utilities, audit logging, rate limiting, and security enhancements.

## Table of Contents

1. [Enhanced Caching](#enhanced-caching)
2. [Cursor-Based Pagination](#cursor-based-pagination)
3. [Encryption Utilities](#encryption-utilities)
4. [Audit Logging](#audit-logging)
5. [Rate Limiting](#rate-limiting)
6. [Security Enhancements](#security-enhancements)
7. [Admin API Reference](#admin-api-reference)
8. [Best Practices](#best-practices)

---

## Enhanced Caching

### Features

- **TTL (Time-To-Live)**: Automatic expiration of cached entries
- **Namespace Support**: Organize cache entries by category
- **Automatic Cleanup**: Background cleanup of expired entries
- **Statistics**: Monitor cache performance
- **Cache-Aside Pattern**: Convenient `getOrSet` method

### Usage

```typescript
import { enhancedCache } from '../utils/technical-improvements.js';

// Simple get/set
enhancedCache.set('user:123', userData, { ttl: 3600000 }); // 1 hour TTL
const user = enhancedCache.get<User>('user:123');

// With namespace
enhancedCache.set('returns', taxReturns, { namespace: 'tax', ttl: 1800000 });
const returns = enhancedCache.get<TaxReturn[]>('returns', 'tax');

// Cache-aside pattern (recommended)
const data = await enhancedCache.getOrSet(
  'expensive-query',
  async () => await db.query('SELECT * FROM large_table'),
  { ttl: 600000, namespace: 'queries' }
);

// Clear specific namespace
enhancedCache.clearNamespace('tax');

// Get statistics
const stats = enhancedCache.getStats();
// { totalEntries: 150, hitRate: 0.85, ... }
```

### Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `ttl` | 3600000 (1h) | Time-to-live in milliseconds |
| `namespace` | undefined | Optional grouping for cache entries |
| `cleanupInterval` | 300000 (5m) | How often to clean expired entries |

### Cache Strategies

#### Strategy 1: Short-lived Data (Real-time)
```typescript
// Tax calculations - cache briefly
enhancedCache.set('calc:' + returnId, calculation, { ttl: 60000 }); // 1 minute
```

#### Strategy 2: Reference Data (Semi-static)
```typescript
// Tax brackets - cache longer
enhancedCache.set('brackets:2024', brackets, { ttl: 86400000 }); // 24 hours
```

#### Strategy 3: User Sessions
```typescript
// Session data - cache with moderate TTL
enhancedCache.set('session:' + userId, sessionData, {
  namespace: 'sessions',
  ttl: 1800000 // 30 minutes
});
```

---

## Cursor-Based Pagination

### Why Cursor-Based?

| Offset-Based | Cursor-Based |
|--------------|--------------|
| Skip N records | Continue from last item |
| Slow on large datasets | Consistent performance |
| Issues with concurrent inserts | Stable during modifications |
| Simple to implement | More efficient |

### Usage

```typescript
import { paginationHelper } from '../utils/technical-improvements.js';

// In route handler
router.get('/documents', async (req, res) => {
  // Parse pagination params
  const { limit, cursor, direction } = paginationHelper.parseParams({
    limit: req.query.limit,
    cursor: req.query.cursor,
    direction: req.query.direction
  });

  // Build query
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: direction === 'forward' });

  // Apply cursor
  if (cursor) {
    const cursorData = paginationHelper.decodeCursor(cursor);
    query = query.gt('created_at', cursorData.value);
  }

  // Fetch with limit + 1 to detect hasMore
  const { data } = await query.limit(limit + 1);

  // Create paginated response
  const response = paginationHelper.createResponse(
    data,
    limit,
    'created_at',
    direction
  );

  res.json({
    success: true,
    data: response.items,
    pagination: {
      nextCursor: response.nextCursor,
      prevCursor: response.prevCursor,
      hasMore: response.hasMore,
      limit
    }
  });
});
```

### API Response Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "nextCursor": "eyJmaWVsZCI6ImNyZWF0ZWRfYXQiLCJ2YWx1ZSI6IjIwMjQtMDEtMTUiLCJkaXJlY3Rpb24iOiJmb3J3YXJkIn0=",
    "prevCursor": null,
    "hasMore": true,
    "limit": 25
  }
}
```

### Client Usage

```javascript
// Initial request
const first = await fetch('/api/documents?limit=25');

// Next page
const next = await fetch(`/api/documents?limit=25&cursor=${first.pagination.nextCursor}`);

// Previous page
const prev = await fetch(`/api/documents?limit=25&cursor=${next.pagination.prevCursor}&direction=backward`);
```

---

## Encryption Utilities

### Features

- **AES-256-GCM**: Industry-standard symmetric encryption
- **PBKDF2**: Secure key derivation for hashing
- **Data Masking**: Hide sensitive data for display
- **Secure Key Management**: Environment-based key handling

### Usage

```typescript
import { encryptionHelper } from '../utils/technical-improvements.js';

// Encrypt sensitive data (reversible)
const encrypted = encryptionHelper.encrypt('123-45-6789');
// Returns: "<iv>:<authTag>:<ciphertext>" in hex format

// Decrypt data
const decrypted = encryptionHelper.decrypt(encrypted);
// Returns: "123-45-6789"

// Hash data (one-way, for comparison)
const hash = encryptionHelper.hash('password123');
// Returns: SHA-512 hash with salt

// Mask SSN for display
const masked = encryptionHelper.maskSSN('123-45-6789');
// Returns: "***-**-6789"

// Mask email for display
const maskedEmail = encryptionHelper.maskEmail('john.doe@example.com');
// Returns: "j***e@example.com"
```

### Security Considerations

1. **Key Management**
   ```bash
   # Generate a secure key
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Set in environment
   ENCRYPTION_KEY=<generated-key>
   ```

2. **Key Rotation**
   - Store key version with encrypted data
   - Support decryption with multiple key versions
   - Re-encrypt data during maintenance windows

3. **What to Encrypt**
   - SSNs and tax IDs
   - Bank account numbers
   - Dates of birth
   - Full addresses (when required)

4. **What NOT to Encrypt**
   - Primary keys (need for queries)
   - Non-PII data
   - Data needed for searching

### Database Example

```typescript
// Storing encrypted SSN
const encryptedSSN = encryptionHelper.encrypt(ssn);
await supabase.from('users').update({
  ssn_encrypted: encryptedSSN,
  ssn_last_four: ssn.slice(-4) // For display/search
}).eq('id', userId);

// Retrieving and decrypting
const { data } = await supabase.from('users').select('ssn_encrypted').eq('id', userId);
const ssn = encryptionHelper.decrypt(data.ssn_encrypted);
```

---

## Audit Logging

### Features

- **Comprehensive Tracking**: Who did what, when, and where
- **Compliance Ready**: Meets SOC 2, HIPAA audit requirements
- **Efficient Querying**: Filter by user, action, resource, date range
- **Export Capability**: CSV export for compliance audits

### Log Entry Structure

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout';
  resource: string;      // e.g., 'tax_return', 'legal_document'
  resourceId?: string;   // The specific record ID
  details?: object;      // Additional context
  ipAddress: string;
  userAgent: string;
}
```

### Usage

```typescript
import { auditLogger, AuditAction } from '../utils/technical-improvements.js';

// Log an action
await auditLogger.log({
  userId: req.user.id,
  action: 'read' as AuditAction,
  resource: 'tax_return',
  resourceId: returnId,
  details: {
    taxYear: 2024,
    status: 'draft'
  },
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});

// Query audit logs
const logs = await auditLogger.query({
  userId: 'user-123',
  action: 'update',
  resource: 'tax_return',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100,
  offset: 0
});

// Get user activity summary
const summary = await auditLogger.getUserSummary('user-123', 30);
// Returns: { totalActions: 150, byAction: {...}, byResource: {...}, recentActivity: [...] }
```

### What to Log

| Action | When to Log |
|--------|-------------|
| `create` | New records created |
| `read` | Sensitive data accessed |
| `update` | Any data modification |
| `delete` | Records removed |
| `export` | Data exported/downloaded |
| `login` | User authentication |
| `logout` | Session ended |

### Compliance Reports

```bash
# Export audit logs via API
GET /api/admin/audit-logs/export?startDate=2024-01-01&endDate=2024-03-31

# Filter by specific user
GET /api/admin/audit-logs?userId=user-123&limit=100

# Filter by action type
GET /api/admin/audit-logs?action=delete&resource=tax_return
```

---

## Rate Limiting

### Features

- **Sliding Window**: Fair rate limiting algorithm
- **Per-Key Limits**: Different limits for different operations
- **Auto-Reset**: Automatic window reset
- **Visibility**: Check remaining requests

### Usage

```typescript
import { rateLimiter } from '../utils/technical-improvements.js';

// Check if request is allowed
const result = rateLimiter.isAllowed(
  `user:${userId}:tax-calculate`,
  100,    // max requests
  60000   // per minute
);

if (!result.allowed) {
  return res.status(429).json({
    success: false,
    error: 'Rate limit exceeded',
    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
  });
}

// Include rate limit info in response headers
res.set({
  'X-RateLimit-Limit': 100,
  'X-RateLimit-Remaining': result.remaining,
  'X-RateLimit-Reset': result.resetAt
});
```

### Recommended Limits

| Endpoint Type | Max Requests | Window |
|---------------|--------------|--------|
| Tax calculations | 100 | 1 minute |
| Document generation | 20 | 1 minute |
| AI advisor queries | 10 | 1 minute |
| File uploads | 50 | 1 minute |
| E-filing submissions | 5 | 1 hour |

### Middleware Example

```typescript
const createRateLimitMiddleware = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.user?.id || req.ip}:${req.path}`;
    const result = rateLimiter.isAllowed(key, maxRequests, windowMs);

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetAt
    });

    if (!result.allowed) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000)
      });
    }

    next();
  };
};

// Usage
router.post('/calculate', createRateLimitMiddleware(100, 60000), calculateHandler);
```

---

## Security Enhancements

### Security Headers

```typescript
import { securityHeaders } from '../utils/technical-improvements.js';

// Apply to Express app
app.use((req, res, next) => {
  const headers = securityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  next();
});
```

### Headers Applied

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Strict-Transport-Security` | `max-age=31536000` | Enforce HTTPS |
| `Content-Security-Policy` | `default-src 'self'` | Restrict resource loading |
| `Cache-Control` | `no-store` | Prevent caching sensitive data |

### Input Validation

```typescript
import { validateInput, sanitizeInput, isValidEmail, isValidSSN } from '../utils/technical-improvements.js';

// Validate required fields
const errors = validateInput(req.body, {
  email: { required: true, email: true },
  ssn: { required: true, ssn: true },
  amount: { required: true, min: 0, max: 1000000 }
});

if (errors.length > 0) {
  return res.status(400).json({ success: false, errors });
}

// Sanitize text input
const safeName = sanitizeInput(req.body.name);

// Specific validations
if (!isValidEmail(email)) { /* ... */ }
if (!isValidSSN(ssn)) { /* ... */ }
```

---

## Admin API Reference

### Cache Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/cache/stats` | Get cache statistics |
| DELETE | `/api/admin/cache` | Clear entire cache |
| DELETE | `/api/admin/cache?namespace=tax` | Clear namespace |
| DELETE | `/api/admin/cache/:key` | Delete specific key |

### Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/audit-logs` | Query audit logs |
| GET | `/api/admin/audit-logs/user/:userId/summary` | User activity summary |
| GET | `/api/admin/audit-logs/export` | Export logs as CSV |

#### Query Parameters for Audit Logs

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | string | Filter by user ID |
| `action` | string | Filter by action type |
| `resource` | string | Filter by resource type |
| `resourceId` | string | Filter by specific resource |
| `startDate` | ISO date | Start of date range |
| `endDate` | ISO date | End of date range |
| `limit` | number | Max results (default: 100) |
| `offset` | number | Skip records (default: 0) |

### Rate Limiting

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/rate-limits/status` | Get all rate limit status |
| DELETE | `/api/admin/rate-limits/:key` | Reset specific limit |
| DELETE | `/api/admin/rate-limits` | Clear all limits |

### System Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/health` | System health check |
| GET | `/api/admin/config` | Get system configuration |

### Encryption Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/encrypt` | Encrypt/hash/mask a value |
| POST | `/api/admin/decrypt` | Decrypt a value |

---

## Best Practices

### 1. Caching Strategy

```typescript
// DO: Use appropriate TTLs
enhancedCache.set('user-prefs', prefs, { ttl: 3600000 }); // 1 hour for prefs

// DON'T: Cache sensitive data too long
enhancedCache.set('ssn', ssn, { ttl: 86400000 }); // BAD: Too long for sensitive data

// DO: Use namespaces for organization
enhancedCache.set('return:123', data, { namespace: 'tax' });
enhancedCache.clearNamespace('tax'); // Clear all tax-related cache
```

### 2. Audit Logging

```typescript
// DO: Log meaningful context
await auditLogger.log({
  userId,
  action: 'update',
  resource: 'tax_return',
  resourceId: returnId,
  details: {
    changedFields: ['income', 'deductions'],
    previousStatus: 'draft',
    newStatus: 'review'
  }
});

// DON'T: Log sensitive data in details
await auditLogger.log({
  details: { ssn: '123-45-6789' } // BAD: Never log PII
});
```

### 3. Encryption

```typescript
// DO: Encrypt at rest, decrypt only when needed
const encrypted = encryptionHelper.encrypt(ssn);
// Store encrypted value in database

// DO: Use masking for display
const displaySSN = encryptionHelper.maskSSN(ssn); // ***-**-6789

// DON'T: Log decrypted values
console.log(encryptionHelper.decrypt(encrypted)); // BAD
```

### 4. Rate Limiting

```typescript
// DO: Use granular rate limits
rateLimiter.isAllowed(`${userId}:calculate`, 100, 60000);
rateLimiter.isAllowed(`${userId}:efile`, 5, 3600000);

// DON'T: Use same limits for all endpoints
// Heavy operations need stricter limits
```

### 5. Pagination

```typescript
// DO: Always paginate list endpoints
router.get('/returns', async (req, res) => {
  const { limit, cursor } = paginationHelper.parseParams(req.query);
  // ...
});

// DON'T: Return unbounded results
const { data } = await supabase.from('returns').select('*'); // BAD
```

---

## Database Schema

### Audit Logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(20) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id VARCHAR(100),
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
```

### Encrypted Fields Table (Example)

```sql
-- Store encrypted sensitive data with metadata
ALTER TABLE tax_returns ADD COLUMN ssn_encrypted TEXT;
ALTER TABLE tax_returns ADD COLUMN ssn_last_four VARCHAR(4);
ALTER TABLE tax_returns ADD COLUMN encryption_version INTEGER DEFAULT 1;
```

---

## Monitoring & Alerts

### Recommended Metrics

1. **Cache Performance**
   - Hit rate (target: > 80%)
   - Entry count
   - Memory usage

2. **Rate Limiting**
   - 429 response count
   - Top rate-limited users
   - Endpoint throttle frequency

3. **Audit Log Volume**
   - Logs per hour
   - Actions by type
   - Unusual patterns

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Cache hit rate | < 70% | < 50% |
| Rate limit hits/hour | > 100 | > 500 |
| Failed decryptions | > 10/hour | > 50/hour |
| Audit log failures | > 5/hour | > 20/hour |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-12 | Initial release with caching, pagination, encryption, audit logging, rate limiting |

---

## Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Security Policy](./SECURITY_POLICY.md)
- [Compliance Guide](./COMPLIANCE_GUIDE.md)
