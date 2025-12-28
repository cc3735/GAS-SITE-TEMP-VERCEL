import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { authenticate, generateToken } from '../middleware/auth.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';
import { createUserProfileSchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Sign up with email and password
router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  // Validate email format
  const validation = createUserProfileSchema.safeParse({ email, firstName, lastName });
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  // Create auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    logger.error('Signup error:', authError);
    throw new ValidationError(authError.message);
  }

  if (!authData.user) {
    throw new ValidationError('Failed to create user');
  }

  // Create user profile
  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      first_name: firstName || null,
      last_name: lastName || null,
      subscription_tier: 'free',
      subscription_status: 'active',
    });

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    logger.error('Profile creation error:', profileError);
    throw new ValidationError('Failed to create user profile');
  }

  // Generate token
  const token = generateToken(authData.user.id, email);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: authData.user.id,
        email,
        firstName,
        lastName,
        subscriptionTier: 'free',
      },
      token,
    },
  });
}));

// Sign in with email and password
router.post('/signin', authLimiter, asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError('Email and password are required');
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Get user profile
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // Generate token
  const token = generateToken(data.user.id, email);

  res.json({
    success: true,
    data: {
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
      },
      token,
      supabaseToken: data.session?.access_token,
    },
  });
}));

// Sign out
router.post('/signout', authenticate, asyncHandler(async (req, res) => {
  // Supabase handles token invalidation
  res.json({
    success: true,
    message: 'Successfully signed out',
  });
}));

// Refresh token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ValidationError('Refresh token is required');
  }

  const { data, error } = await supabaseAdmin.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    throw new AuthenticationError('Invalid refresh token');
  }

  res.json({
    success: true,
    data: {
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    },
  });
}));

// Get current user
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  res.json({
    success: true,
    data: {
      id: req.user!.id,
      email: req.user!.email,
      firstName: profile?.first_name,
      lastName: profile?.last_name,
      phone: profile?.phone,
      dateOfBirth: profile?.date_of_birth,
      address: profile?.address,
      subscriptionTier: profile?.subscription_tier,
      subscriptionStatus: profile?.subscription_status,
      createdAt: profile?.created_at,
    },
  });
}));

// Request password reset
router.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ValidationError('Email is required');
  }

  const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  if (error) {
    logger.error('Password reset error:', error);
    // Don't reveal if email exists
  }

  // Always return success to prevent email enumeration
  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent',
  });
}));

// Reset password with token
router.post('/reset-password', authLimiter, asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ValidationError('Token and password are required');
  }

  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters');
  }

  // Verify the token and update password
  const { error } = await supabaseAdmin.auth.verifyOtp({
    token_hash: token,
    type: 'recovery',
  });

  if (error) {
    throw new AuthenticationError('Invalid or expired reset token');
  }

  res.json({
    success: true,
    message: 'Password has been reset successfully',
  });
}));

export default router;

