# LegalFlow Security Guide

## Overview

LegalFlow handles sensitive personal, financial, and legal data. This guide outlines our security measures and best practices.

## Data Classification

### Highly Sensitive Data (Encrypted at Rest)
- Social Security Numbers (SSN)
- Tax return details
- Financial account numbers
- Legal case information

### Sensitive Data (Protected)
- Personal information (name, address, DOB)
- Document contents
- Payment information (handled by Stripe)

### Standard Data
- Account preferences
- Usage statistics
- Session data

## Encryption

### At Rest

All highly sensitive data is encrypted using AES-256-GCM:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

export function decrypt(ciphertext: string): string {
  const [ivHex, encrypted, authTagHex] = ciphertext.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### In Transit

- TLS 1.3 for all connections
- HTTPS enforced on all endpoints
- Secure cookies with HttpOnly and Secure flags

## Authentication

### JWT Token Security

```typescript
// Token generation with short expiry
const token = jwt.sign(
  { 
    id: user.id, 
    email: user.email,
    role: user.role 
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);
```

### Token Refresh Flow

1. Access tokens expire after 1 hour
2. Refresh tokens provided for seamless renewal
3. Refresh tokens rotated on each use
4. Token revocation on logout/password change

### Password Requirements

- Minimum 8 characters
- Hashed using bcrypt (cost factor 12)
- No plaintext storage

## Authorization

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `user` | Own data, free tier features |
| `admin` | All data, system management |
| `expert` | Review documents, provide support |

### Middleware Implementation

```typescript
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    next();
  };
};
```

### Subscription Tier Enforcement

```typescript
export const requirePremium = (req: AuthRequest, res: Response, next: NextFunction) => {
  const tier = req.user?.subscriptionTier;
  if (tier !== 'premium' && tier !== 'pro') {
    throw new AuthorizationError('This feature requires Premium tier');
  }
  next();
};
```

## Database Security

### Row Level Security (RLS)

```sql
-- Users can only access their own data
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tax returns" 
  ON tax_returns FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own tax returns" 
  ON tax_returns FOR ALL 
  USING (auth.uid() = user_id);
```

### Connection Security

- Service role key for backend operations
- Anon key for client-side queries
- Connection pooling for efficiency

## Rate Limiting

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

// Standard API limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests',
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 attempts per window
  message: 'Too many login attempts',
});

// AI endpoint limit
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 AI requests per minute
});
```

## Input Validation

### Zod Schemas

```typescript
import { z } from 'zod';

export const createUserProfileSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const childSupportCalculationSchema = z.object({
  stateCode: z.string().length(2),
  parent1Data: z.object({
    grossMonthlyIncome: z.number().min(0),
    // ... more fields
  }),
  // ... more fields
});
```

### Request Validation Middleware

```typescript
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }
    next();
  };
};
```

## Error Handling

### Custom Error Classes

```typescript
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Invalid credentials') {
    super(message, 401);
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address"
  }
}
```

## Logging

### Security Events

```typescript
// Authentication events
logger.info('User login success', { userId, ip, userAgent });
logger.warn('User login failed', { email, ip, reason: 'invalid_password' });

// Authorization events
logger.warn('Unauthorized access attempt', { userId, resource, action });

// Data access events
logger.info('Sensitive data accessed', { userId, dataType, recordId });
```

### Audit Trail

All sensitive operations are logged with:
- Timestamp
- User ID
- Action performed
- Resource affected
- IP address
- User agent

## Third-Party Security

### Stripe

- PCI DSS compliant payment processing
- No card numbers stored on our servers
- Webhook signature verification

### OpenAI

- API key stored in environment variables
- No personally identifiable information in prompts
- Usage tracking for cost management

### Supabase

- Managed PostgreSQL with automatic backups
- Network isolation
- Encrypted connections

## Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

## Incident Response

### Response Plan

1. **Detection**: Automated monitoring alerts
2. **Containment**: Isolate affected systems
3. **Investigation**: Determine scope and impact
4. **Remediation**: Fix vulnerabilities
5. **Communication**: Notify affected users if required
6. **Documentation**: Post-incident report

### Contact

Security issues should be reported to: security@legalflow.com

## Compliance

### Standards Followed

- OWASP Top 10 guidelines
- GDPR data protection principles
- IRS Publication 1075 (tax data security)
- State bar guidelines (legal services)

### Regular Audits

- Quarterly security reviews
- Annual penetration testing
- Continuous dependency scanning

## Security Checklist for Development

- [ ] Validate all user inputs
- [ ] Use parameterized queries (Supabase handles this)
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for all connections
- [ ] Implement rate limiting
- [ ] Log security events
- [ ] Never log sensitive data
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Implement proper error handling

