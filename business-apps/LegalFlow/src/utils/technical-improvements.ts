/**
 * Technical Improvements Module
 *
 * Provides enhanced caching with TTL, cursor-based pagination,
 * encryption utilities, audit logging, and security helpers.
 *
 * @module utils/technical-improvements
 */

import crypto from 'crypto';
import { logger } from './logger.js';
import { supabase } from '../lib/supabase.js';

// ============================================================================
// ENHANCED CACHING
// ============================================================================

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

interface CacheOptions {
  ttlMs?: number;
  namespace?: string;
}

/**
 * Enhanced in-memory cache with TTL and namespacing
 */
export class EnhancedCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTtlMs: number;
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor(defaultTtlMs: number = 3600000) {
    this.defaultTtlMs = defaultTtlMs;
    this.startCleanupInterval();
  }

  /**
   * Get value from cache
   */
  get<T>(key: string, namespace?: string): T | null {
    const fullKey = this.buildKey(key, namespace);
    const entry = this.cache.get(fullKey);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(fullKey);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, options?: CacheOptions): void {
    const fullKey = this.buildKey(key, options?.namespace);
    const ttlMs = options?.ttlMs || this.defaultTtlMs;

    this.cache.set(fullKey, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string, namespace?: string): boolean {
    const fullKey = this.buildKey(key, namespace);
    return this.cache.delete(fullKey);
  }

  /**
   * Clear all entries in a namespace
   */
  clearNamespace(namespace: string): number {
    let count = 0;
    const prefix = `${namespace}:`;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    namespaces: Record<string, number>;
    memoryUsage: string;
  } {
    const namespaces: Record<string, number> = {};

    for (const key of this.cache.keys()) {
      const ns = key.split(':')[0] || 'default';
      namespaces[ns] = (namespaces[ns] || 0) + 1;
    }

    return {
      size: this.cache.size,
      namespaces,
      memoryUsage: `~${Math.round(JSON.stringify([...this.cache.entries()]).length / 1024)}KB`,
    };
  }

  /**
   * Get or set pattern - fetch from cache or compute and store
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = this.get<T>(key, options?.namespace);
    if (cached !== null) return cached;

    const value = await fetcher();
    this.set(key, value, options);
    return value;
  }

  private buildKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  private startCleanupInterval(): void {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug(`Cache cleanup: removed ${cleaned} expired entries`);
      }
    }, 300000);
  }

  /**
   * Stop cleanup interval (for graceful shutdown)
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Global cache instance
export const cache = new EnhancedCache();

// ============================================================================
// PAGINATION
// ============================================================================

export interface PaginationParams {
  cursor?: string;
  limit?: number;
  direction?: 'next' | 'prev';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    prevCursor: string | null;
    total?: number;
  };
}

export interface CursorData {
  id: string;
  timestamp: number;
}

/**
 * Pagination utilities for cursor-based pagination
 */
export class PaginationHelper {
  private maxLimit: number;
  private defaultLimit: number;

  constructor(defaultLimit: number = 20, maxLimit: number = 100) {
    this.defaultLimit = defaultLimit;
    this.maxLimit = maxLimit;
  }

  /**
   * Parse and validate pagination parameters
   */
  parseParams(params: PaginationParams): {
    limit: number;
    cursor: CursorData | null;
    direction: 'next' | 'prev';
  } {
    const limit = Math.min(params.limit || this.defaultLimit, this.maxLimit);
    const direction = params.direction || 'next';
    const cursor = params.cursor ? this.decodeCursor(params.cursor) : null;

    return { limit, cursor, direction };
  }

  /**
   * Encode cursor for client
   */
  encodeCursor(data: CursorData): string {
    return Buffer.from(JSON.stringify(data)).toString('base64url');
  }

  /**
   * Decode cursor from client
   */
  decodeCursor(cursor: string): CursorData | null {
    try {
      const decoded = Buffer.from(cursor, 'base64url').toString('utf8');
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }

  /**
   * Create paginated response
   */
  createResponse<T extends { id: string; createdAt: Date | string }>(
    items: T[],
    limit: number,
    direction: 'next' | 'prev',
    total?: number
  ): PaginatedResponse<T> {
    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;

    let nextCursor: string | null = null;
    let prevCursor: string | null = null;

    if (data.length > 0) {
      const lastItem = data[data.length - 1];
      const firstItem = data[0];

      if (hasMore || direction === 'prev') {
        nextCursor = this.encodeCursor({
          id: lastItem.id,
          timestamp: new Date(lastItem.createdAt).getTime(),
        });
      }

      if (direction === 'next' && data.length > 0) {
        prevCursor = this.encodeCursor({
          id: firstItem.id,
          timestamp: new Date(firstItem.createdAt).getTime(),
        });
      }
    }

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
        prevCursor,
        total,
      },
    };
  }

  /**
   * Build Supabase query with cursor pagination
   */
  applyToSupabaseQuery(
    query: any,
    params: { limit: number; cursor: CursorData | null; direction: 'next' | 'prev' },
    orderColumn: string = 'created_at'
  ): any {
    const { limit, cursor, direction } = params;

    // Fetch one extra to determine hasMore
    query = query.limit(limit + 1);

    if (cursor) {
      if (direction === 'next') {
        query = query.lt(orderColumn, new Date(cursor.timestamp).toISOString());
      } else {
        query = query.gt(orderColumn, new Date(cursor.timestamp).toISOString());
      }
    }

    // Order by timestamp desc for next, asc for prev
    query = query.order(orderColumn, { ascending: direction === 'prev' });

    return query;
  }
}

// Global pagination helper
export const pagination = new PaginationHelper();

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

/**
 * Encryption utilities for sensitive data
 */
export class EncryptionHelper {
  private masterKey: Buffer;

  constructor(masterKey?: string) {
    // In production, use a secure key from environment
    const key = masterKey || process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    this.masterKey = crypto.scryptSync(key, 'salt', KEY_LENGTH);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine iv:authTag:ciphertext
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    const parts = hashedData.split(':');
    if (parts.length !== 2) return false;

    const salt = Buffer.from(parts[0], 'hex');
    const storedHash = parts[1];

    const hash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return hash.toString('hex') === storedHash;
  }

  /**
   * Mask sensitive data (e.g., SSN: ***-**-1234)
   */
  mask(data: string, visibleChars: number = 4, maskChar: string = '*'): string {
    if (data.length <= visibleChars) return data;
    const masked = maskChar.repeat(data.length - visibleChars);
    return masked + data.slice(-visibleChars);
  }

  /**
   * Mask SSN (###-##-1234)
   */
  maskSSN(ssn: string): string {
    const clean = ssn.replace(/\D/g, '');
    if (clean.length !== 9) return '***-**-****';
    return `***-**-${clean.slice(-4)}`;
  }

  /**
   * Mask email (j***@example.com)
   */
  maskEmail(email: string): string {
    const parts = email.split('@');
    if (parts.length !== 2) return email;

    const name = parts[0];
    const domain = parts[1];

    if (name.length <= 2) return email;
    return `${name[0]}${'*'.repeat(name.length - 2)}${name.slice(-1)}@${domain}`;
  }
}

// Global encryption helper
export const encryption = new EncryptionHelper();

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'export'
  | 'share'
  | 'sign'
  | 'file'
  | 'payment';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * Audit logging for compliance and security
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date(),
    };

    // Log to console
    logger.info('Audit log', {
      action: logEntry.action,
      resourceType: logEntry.resourceType,
      resourceId: logEntry.resourceId,
      userId: logEntry.userId,
    });

    // Store in database
    try {
      await supabase.from('audit_logs').insert({
        id: logEntry.id,
        user_id: logEntry.userId,
        action: logEntry.action,
        resource_type: logEntry.resourceType,
        resource_id: logEntry.resourceId,
        description: logEntry.description,
        metadata: logEntry.metadata,
        ip_address: logEntry.ipAddress,
        user_agent: logEntry.userAgent,
        timestamp: logEntry.timestamp.toISOString(),
      });
    } catch (error) {
      logger.error('Failed to store audit log', { error });
    }
  }

  /**
   * Query audit logs
   */
  async query(options: {
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (options.userId) query = query.eq('user_id', options.userId);
    if (options.action) query = query.eq('action', options.action);
    if (options.resourceType) query = query.eq('resource_type', options.resourceType);
    if (options.resourceId) query = query.eq('resource_id', options.resourceId);
    if (options.startDate) query = query.gte('timestamp', options.startDate.toISOString());
    if (options.endDate) query = query.lte('timestamp', options.endDate.toISOString());
    if (options.limit) query = query.limit(options.limit);
    if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to query audit logs', { error });
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      description: row.description,
      metadata: row.metadata,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      timestamp: new Date(row.timestamp),
    }));
  }

  /**
   * Get audit summary for a user
   */
  async getUserSummary(userId: string, days: number = 30): Promise<{
    totalActions: number;
    actionBreakdown: Record<string, number>;
    recentActivity: AuditLogEntry[];
    sensitiveAccess: AuditLogEntry[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.query({ userId, startDate, limit: 1000 });

    const actionBreakdown: Record<string, number> = {};
    for (const log of logs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
    }

    const sensitiveTypes = ['tax_return', 'ssn', 'bank_account', 'payment'];
    const sensitiveAccess = logs.filter((l) => sensitiveTypes.includes(l.resourceType));

    return {
      totalActions: logs.length,
      actionBreakdown,
      recentActivity: logs.slice(0, 10),
      sensitiveAccess: sensitiveAccess.slice(0, 20),
    };
  }
}

// Global audit logger
export const audit = new AuditLogger();

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * In-memory rate limiter
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private defaultMaxRequests: number;
  private defaultWindowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.defaultMaxRequests = maxRequests;
    this.defaultWindowMs = windowMs;

    // Cleanup old entries periodically
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.limits.entries()) {
        if (now > entry.resetAt) {
          this.limits.delete(key);
        }
      }
    }, 60000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(
    key: string,
    maxRequests?: number,
    windowMs?: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const max = maxRequests || this.defaultMaxRequests;
    const window = windowMs || this.defaultWindowMs;
    const now = Date.now();

    let entry = this.limits.get(key);

    // Reset if window expired
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + window };
      this.limits.set(key, entry);
    }

    const remaining = Math.max(0, max - entry.count);
    const allowed = entry.count < max;

    if (allowed) {
      entry.count++;
    }

    return { allowed, remaining, resetAt: entry.resetAt };
  }

  /**
   * Get current limit status
   */
  getStatus(key: string): { count: number; resetAt: number } | null {
    return this.limits.get(key) || null;
  }

  /**
   * Reset limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }
}

// Global rate limiter
export const rateLimiter = new RateLimiter();

// ============================================================================
// SECURITY HEADERS MIDDLEWARE
// ============================================================================

/**
 * Security headers configuration
 */
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Input validation utilities
 */
export const validation = {
  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate SSN format
   */
  isValidSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  },

  /**
   * Validate phone number
   */
  isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?1?\d{10,14}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  },

  /**
   * Validate ZIP code
   */
  isValidZip(zip: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zip);
  },

  /**
   * Sanitize string input
   */
  sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/javascript:/gi, '') // Remove JS protocol
      .trim();
  },

  /**
   * Validate and sanitize SQL-like input
   */
  sanitizeForQuery(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslash
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comment start
      .trim();
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  cache,
  pagination,
  encryption,
  audit,
  rateLimiter,
  securityHeaders,
  validation,
};
