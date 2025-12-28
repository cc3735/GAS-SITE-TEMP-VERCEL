import { Router } from 'express';
import { supabaseAdmin } from '../utils/supabase.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import { updateUserProfileSchema, addressSchema } from '../utils/validation.js';
import { encrypt, decrypt, maskSSN, isValidSSN, formatSSN } from '../services/encryption.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('id', req.user!.id)
    .single();

  if (error || !profile) {
    throw new NotFoundError('User profile');
  }

  // Mask SSN if present
  let maskedSSN = null;
  if (profile.ssn_encrypted) {
    try {
      const ssn = decrypt(profile.ssn_encrypted);
      maskedSSN = maskSSN(ssn);
    } catch {
      // Ignore decryption errors
    }
  }

  res.json({
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      dateOfBirth: profile.date_of_birth,
      address: profile.address,
      ssnMasked: maskedSSN,
      subscriptionTier: profile.subscription_tier,
      subscriptionStatus: profile.subscription_status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    },
  });
}));

// Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const validation = updateUserProfileSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { firstName, lastName, phone, dateOfBirth, address } = validation.data;

  // Validate address if provided
  if (address) {
    const addressValidation = addressSchema.safeParse(address);
    if (!addressValidation.success) {
      throw new ValidationError(addressValidation.error.errors[0].message);
    }
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (firstName !== undefined) updateData.first_name = firstName;
  if (lastName !== undefined) updateData.last_name = lastName;
  if (phone !== undefined) updateData.phone = phone;
  if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
  if (address !== undefined) updateData.address = address;

  const { data: profile, error } = await supabaseAdmin
    .from('user_profiles')
    .update(updateData)
    .eq('id', req.user!.id)
    .select()
    .single();

  if (error) {
    throw new ValidationError('Failed to update profile');
  }

  res.json({
    success: true,
    data: {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone,
      dateOfBirth: profile.date_of_birth,
      address: profile.address,
      subscriptionTier: profile.subscription_tier,
      subscriptionStatus: profile.subscription_status,
      updatedAt: profile.updated_at,
    },
  });
}));

// Update SSN (sensitive data)
router.put('/profile/ssn', asyncHandler(async (req, res) => {
  const { ssn } = req.body;

  if (!ssn) {
    throw new ValidationError('SSN is required');
  }

  // Validate SSN format
  if (!isValidSSN(ssn)) {
    throw new ValidationError('Invalid SSN format');
  }

  // Encrypt SSN before storing
  const encryptedSSN = encrypt(formatSSN(ssn));

  const { error } = await supabaseAdmin
    .from('user_profiles')
    .update({
      ssn_encrypted: encryptedSSN,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user!.id);

  if (error) {
    throw new ValidationError('Failed to update SSN');
  }

  res.json({
    success: true,
    message: 'SSN updated successfully',
    data: {
      ssnMasked: maskSSN(ssn),
    },
  });
}));

// Get user's service usage/history
router.get('/usage', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Get tax returns count
  const { count: taxReturnsCount } = await supabaseAdmin
    .from('tax_returns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get legal documents count
  const { count: legalDocsCount } = await supabaseAdmin
    .from('legal_documents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get legal filings count
  const { count: legalFilingsCount } = await supabaseAdmin
    .from('legal_filings')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Get child support calculations count (this month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: childSupportCalcsCount } = await supabaseAdmin
    .from('child_support_calculations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  // Get AI usage (this month)
  const { data: aiUsage } = await supabaseAdmin
    .from('ai_usage_logs')
    .select('total_cost')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const totalAICost = aiUsage?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;

  res.json({
    success: true,
    data: {
      taxReturns: taxReturnsCount || 0,
      legalDocuments: legalDocsCount || 0,
      legalFilings: legalFilingsCount || 0,
      childSupportCalculationsThisMonth: childSupportCalcsCount || 0,
      aiUsageThisMonth: {
        totalCost: totalAICost,
        formattedCost: `$${totalAICost.toFixed(2)}`,
      },
    },
  });
}));

// Delete account
router.delete('/account', asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  // Delete user profile (cascades to related data)
  await supabaseAdmin
    .from('user_profiles')
    .delete()
    .eq('id', userId);

  // Delete auth user
  await supabaseAdmin.auth.admin.deleteUser(userId);

  res.json({
    success: true,
    message: 'Account deleted successfully',
  });
}));

export default router;

