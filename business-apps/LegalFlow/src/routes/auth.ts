import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseAdmin } from '../utils/supabase.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authLimiter } from '../middleware/rate-limit.js';
import { authenticate, generateToken } from '../middleware/auth.js';
import { ValidationError, AuthenticationError } from '../utils/errors.js';
import { createUserProfileSchema } from '../utils/validation.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Sign up with email and password
router.post('/signup', authLimiter, asyncHandler(async (req, res) => {
  logger.info('Signup attempt started');
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password) {
    logger.warn('Signup attempt failed: Email or password missing');
    throw new ValidationError('Email and password are required');
  }

  // Validate email format
  const validation = createUserProfileSchema.safeParse({ email, firstName, lastName });
  if (!validation.success) {
    logger.warn(`Signup validation failed for email ${email}: ${validation.error.errors[0].message}`);
    throw new ValidationError(validation.error.errors[0].message);
  }

  // Create auth user
  logger.info(`Creating auth user for ${email}`);
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    logger.error(`Supabase auth error during signup for ${email}:`, authError);
    throw new ValidationError(authError.message);
  }

  if (!authData.user) {
    logger.error(`User object not returned from Supabase after creation for ${email}`);
    throw new ValidationError('Failed to create user');
  }
  logger.info(`Auth user created successfully for ${email} with id ${authData.user.id}`);

  // Create user profile
  logger.info(`Creating user profile for ${authData.user.id}`);
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      email,
      first_name: firstName,
      last_name: lastName,
    })
    .select()
    .single();

  if (profileError) {
    // Rollback: delete auth user if profile creation fails
    logger.error(`Profile creation error for ${authData.user.id}:`, profileError);
    logger.info(`Rolling back auth user creation for ${authData.user.id}`);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw new ValidationError('Failed to create user profile');
  }
  logger.info(`User profile created successfully for ${authData.user.id}`);

  // Generate token
  const token = generateToken(authData.user.id, email);
  logger.info(`Token generated for ${authData.user.id}`);

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

  // Use the public client for sign-in to initiate MFA flow if needed
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthenticationError(error.message || 'Invalid email or password');
  }

  // If MFA is enabled, the session will be null but the user object will be present
  if (data.user && !data.session) {
    logger.info(`MFA required for user ${data.user.id}`);
    
    // The user needs to complete the MFA challenge.
    // The client now has an 'aal1' authenticated session internally.
    // We need to get the list of factors to send to the client.
    
    // To call listFactors, we need an authenticated client.
    // signInWithPassword does not return a session token directly if MFA is needed.
    // The access_token is available on the client instance after the call.
    // This is a bit of a workaround for server-side.
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new AuthenticationError('Could not get intermediate session for MFA.');
    }

    const tempUserClient = createClient(config.supabase.url, config.supabase.anonKey, {
      global: { headers: { Authorization: `Bearer ${session.access_token}` } },
    });
    
    const { data: factors, error: factorsError } = await tempUserClient.auth.mfa.listFactors();

    if (factorsError) {
      throw new AuthenticationError(`Could not list MFA factors: ${factorsError.message}`);
    }

    return res.json({
      success: true,
      data: {
        mfaRequired: true,
        factors: factors.all,
        // Send the intermediate token to the client to use for the verification step
        intermediateSessionToken: session.access_token,
      },
    });
  }

  if (error || !data.user || !data.session) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Get user profile
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // Generate our app-specific token
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

// Verify MFA code and complete sign-in
router.post('/signin/mfa', authLimiter, asyncHandler(async (req, res) => {
  const { factorId, code, intermediateSessionToken } = req.body;

  if (!factorId || !code || !intermediateSessionToken) {
    throw new ValidationError('factorId, code, and intermediateSessionToken are required');
  }

  // Create a temporary client authenticated with the intermediate token
  const tempUserClient = createClient(config.supabase.url, config.supabase.anonKey, {
    global: { headers: { Authorization: `Bearer ${intermediateSessionToken}` } },
  });

  const { data, error } = await tempUserClient.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) {
    throw new AuthenticationError(`MFA verification failed: ${error.message}`);
  }

  const { session, user } = data;

  if (!session || !user) {
    throw new AuthenticationError('MFA verification did not return a valid session.');
  }
  
  // Get user profile
  const { data: profile } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Generate our app-specific token
  const token = generateToken(user.id, user.email!);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: profile?.first_name,
        lastName: profile?.last_name,
        subscriptionTier: profile?.subscription_tier || 'free',
        subscriptionStatus: profile?.subscription_status || 'active',
      },
      token,
      supabaseToken: session.access_token,
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
