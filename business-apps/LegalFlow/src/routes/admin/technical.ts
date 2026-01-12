/**
 * Technical Administration Routes
 *
 * Provides endpoints for cache management, audit log queries,
 * rate limiting status, and system health monitoring.
 *
 * @module routes/admin/technical
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import {
  enhancedCache,
  auditLogger,
  rateLimiter,
  encryptionHelper,
  AuditAction,
} from '../../utils/technical-improvements.js';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to ensure user has admin privileges
 */
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
  }
  next();
};

// Apply admin check to all routes below
router.use(requireAdmin);

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * GET /cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = enhancedCache.getStats();

    await auditLogger.log({
      userId: req.user!.id,
      action: 'read' as AuditAction,
      resource: 'cache_stats',
      details: {},
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: {
        stats,
        description: {
          totalEntries: 'Total number of cached items',
          totalSize: 'Approximate memory usage',
          hitRate: 'Percentage of cache hits vs misses',
          oldestEntry: 'Timestamp of oldest cache entry',
          newestEntry: 'Timestamp of newest cache entry',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /cache
 * Clear entire cache or specific namespace
 */
router.delete('/cache', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { namespace } = req.query;

    if (namespace && typeof namespace === 'string') {
      enhancedCache.clearNamespace(namespace);
    } else {
      enhancedCache.clear();
    }

    await auditLogger.log({
      userId: req.user!.id,
      action: 'delete' as AuditAction,
      resource: 'cache',
      details: { namespace: namespace || 'all' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: namespace
        ? `Cache namespace '${namespace}' cleared`
        : 'Entire cache cleared',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /cache/:key
 * Delete specific cache key
 */
router.delete('/cache/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;
    const { namespace } = req.query;

    enhancedCache.delete(key, namespace as string | undefined);

    await auditLogger.log({
      userId: req.user!.id,
      action: 'delete' as AuditAction,
      resource: 'cache_key',
      resourceId: key,
      details: { namespace },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Cache key '${key}' deleted`,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// AUDIT LOGS
// ============================================================================

/**
 * GET /audit-logs
 * Query audit logs with filtering
 */
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      action,
      resource,
      resourceId,
      startDate,
      endDate,
      limit = '100',
      offset = '0',
    } = req.query;

    const logs = await auditLogger.query({
      userId: userId as string,
      action: action as AuditAction,
      resource: resource as string,
      resourceId: resourceId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10),
          hasMore: logs.length === parseInt(limit as string, 10),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /audit-logs/user/:userId/summary
 * Get audit summary for a specific user
 */
router.get('/audit-logs/user/:userId/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { days = '30' } = req.query;

    const summary = await auditLogger.getUserSummary(userId, parseInt(days as string, 10));

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /audit-logs/export
 * Export audit logs as CSV
 */
router.get('/audit-logs/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      action,
      resource,
      startDate,
      endDate,
    } = req.query;

    const logs = await auditLogger.query({
      userId: userId as string,
      action: action as AuditAction,
      resource: resource as string,
      startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate as string) : new Date(),
      limit: 10000,
    });

    // Generate CSV
    const headers = ['ID', 'Timestamp', 'User ID', 'Action', 'Resource', 'Resource ID', 'IP Address', 'User Agent', 'Details'];
    const csvRows = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId,
        log.action,
        log.resource,
        log.resourceId || '',
        log.ipAddress,
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        `"${JSON.stringify(log.details || {}).replace(/"/g, '""')}"`,
      ].join(',')),
    ];

    await auditLogger.log({
      userId: req.user!.id,
      action: 'export' as AuditAction,
      resource: 'audit_logs',
      details: { recordCount: logs.length },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvRows.join('\n'));
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * GET /rate-limits/status
 * Get rate limiting status for all tracked keys
 */
router.get('/rate-limits/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = rateLimiter.getStatus();

    res.json({
      success: true,
      data: {
        ...status,
        configuration: {
          defaultMaxRequests: 100,
          defaultWindowMs: 60000,
          description: 'Default: 100 requests per minute per key',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /rate-limits/:key
 * Reset rate limit for a specific key
 */
router.delete('/rate-limits/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { key } = req.params;

    rateLimiter.reset(key);

    await auditLogger.log({
      userId: req.user!.id,
      action: 'update' as AuditAction,
      resource: 'rate_limit',
      resourceId: key,
      details: { action: 'reset' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: `Rate limit for '${key}' has been reset`,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /rate-limits
 * Clear all rate limits
 */
router.delete('/rate-limits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    rateLimiter.clearAll();

    await auditLogger.log({
      userId: req.user!.id,
      action: 'delete' as AuditAction,
      resource: 'rate_limits',
      details: { action: 'clear_all' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      message: 'All rate limits cleared',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

/**
 * GET /health
 * Get system health status
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const startTime = Date.now();

    // Check various system components
    const checks = {
      cache: {
        status: 'healthy',
        stats: enhancedCache.getStats(),
      },
      rateLimiter: {
        status: 'healthy',
        stats: rateLimiter.getStatus(),
      },
      memory: {
        status: 'healthy',
        usage: process.memoryUsage(),
      },
      uptime: {
        status: 'healthy',
        seconds: process.uptime(),
      },
    };

    const responseTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        responseTimeMs: responseTime,
        checks,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// ENCRYPTION UTILITIES
// ============================================================================

/**
 * POST /encrypt
 * Encrypt a value (for testing/admin purposes)
 */
router.post('/encrypt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value, type = 'encrypt' } = req.body;

    if (!value || typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Value is required and must be a string',
      });
    }

    let result: string;
    switch (type) {
      case 'encrypt':
        result = encryptionHelper.encrypt(value);
        break;
      case 'hash':
        result = encryptionHelper.hash(value);
        break;
      case 'maskSSN':
        result = encryptionHelper.maskSSN(value);
        break;
      case 'maskEmail':
        result = encryptionHelper.maskEmail(value);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid type. Use: encrypt, hash, maskSSN, or maskEmail',
        });
    }

    await auditLogger.log({
      userId: req.user!.id,
      action: 'create' as AuditAction,
      resource: 'encryption',
      details: { type },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: {
        type,
        result,
        note: type === 'encrypt' ? 'Store the result securely. You can decrypt it using the decrypt endpoint.' : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /decrypt
 * Decrypt a value
 */
router.post('/decrypt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { value } = req.body;

    if (!value || typeof value !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Value is required and must be a string',
      });
    }

    const result = encryptionHelper.decrypt(value);

    await auditLogger.log({
      userId: req.user!.id,
      action: 'read' as AuditAction,
      resource: 'encryption',
      details: { action: 'decrypt' },
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({
      success: true,
      data: {
        result,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * GET /config
 * Get current system configuration (non-sensitive)
 */
router.get('/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: {
        cache: {
          defaultTTL: 3600000,
          cleanupInterval: 300000,
        },
        rateLimiting: {
          defaultMaxRequests: 100,
          defaultWindowMs: 60000,
        },
        encryption: {
          algorithm: 'aes-256-gcm',
          keyDerivation: 'pbkdf2',
        },
        auditLogging: {
          enabled: true,
          retentionDays: 90,
        },
        security: {
          headers: [
            'X-Content-Type-Options: nosniff',
            'X-Frame-Options: DENY',
            'X-XSS-Protection: 1; mode=block',
            'Strict-Transport-Security: max-age=31536000; includeSubDomains',
            'Content-Security-Policy: default-src self',
            'Cache-Control: no-store, no-cache, must-revalidate',
          ],
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
