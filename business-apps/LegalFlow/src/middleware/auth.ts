import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../utils/supabase.js';
import { config } from '../config/index.js';
import { AuthenticationError, AuthorizationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

export interface AuthUser {
  id: string;
  email: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// Main authentication middleware
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No authentication token provided');
    }

    const token = authHeader.substring(7);
    req.token = token;

    // First try to verify as Supabase JWT
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        throw new Error('Invalid Supabase token');
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email || '',
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
      };

      return next();
    } catch {
      // If Supabase auth fails, try custom JWT
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      
      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', decoded.sub)
        .single();

      req.user = {
        id: decoded.sub,
        email: decoded.email,
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
      };

      return next();
    }
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AuthenticationError('Invalid authentication token'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AuthenticationError('Authentication token expired'));
    }
    return next(error);
  }
}

// Optional authentication - continues even if no token
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    req.token = token;

    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      
      if (user) {
        const { data: profile } = await supabaseAdmin
          .from('user_profiles')
          .select('subscription_tier, subscription_status')
          .eq('id', user.id)
          .single();

        req.user = {
          id: user.id,
          email: user.email || '',
          subscriptionTier: profile?.subscription_tier || 'free',
          subscriptionStatus: profile?.subscription_status || 'active',
        };
      }
    } catch {
      // Silent fail for optional auth
      logger.debug('Optional auth failed, continuing without user');
    }

    return next();
  } catch {
    return next();
  }
}

// Require specific subscription tier
export function requireTier(...allowedTiers: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!allowedTiers.includes(req.user.subscriptionTier)) {
      return next(
        new AuthorizationError(
          `This feature requires one of the following subscription tiers: ${allowedTiers.join(', ')}`
        )
      );
    }

    // Check if subscription is active
    if (req.user.subscriptionStatus !== 'active') {
      return next(
        new AuthorizationError('Your subscription is not active')
      );
    }

    return next();
  };
}

// Require premium features
export const requirePremium = requireTier('basic', 'premium', 'pro');

// Require pro features
export const requirePro = requireTier('premium', 'pro');

// Generate custom JWT token
export function generateToken(userId: string, email: string): string {
  return jwt.sign(
    {
      sub: userId,
      email,
    },
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    }
  );
}

// Verify custom JWT token
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, config.jwt.secret) as JWTPayload;
}

