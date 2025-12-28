import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many authentication attempts, please try again in an hour',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// AI API rate limiter (more restrictive due to cost)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'AI request limit reached, please wait a moment',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Upload limit reached, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

