import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../utils/supabase.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middleware/async.js';
import { authenticate } from '../middleware/auth.js';
import { AuthenticationError, ValidationError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { Database } from '../types/database.js';

const router = Router();

// Helper to get a Supabase client for the authenticated user
const getUserSupabaseClient = (token: string) => {
    return createClient<Database>(config.supabase.url, config.supabase.anonKey, {
        global: {
            headers: { Authorization: `Bearer ${token}` }
        }
    });
};

/**
 * @swagger
 * /api/mfa/enroll:
 *   post:
 *     summary: Enroll a new MFA factor (TOTP)
 *     tags: [MFA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully generated QR code for MFA enrollment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     qr_code:
 *                       type: string
 *                       description: An SVG QR code image that can be rendered on the client.
 *                     secret:
 *                       type: string
 *                       description: The secret key for the authenticator app.
 *                     factorId:
 *                       type: string
 *                       description: The ID of the new factor.
 */
router.post('/enroll', authenticate, asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    logger.info(`MFA enroll attempt for user ${req.user.id}`);
    const userSupabase = getUserSupabaseClient(req.token!);

    const { data, error } = await userSupabase.auth.mfa.enroll({
        factorType: 'totp',
    });

    if (error) {
        throw new AuthenticationError(`Failed to enroll MFA: ${error.message}`);
    }

    logger.info(`MFA enroll successful for user ${req.user.id}`);
    res.json({
        success: true,
        data: {
            qr_code: data.totp.qr_code,
            secret: data.totp.secret,
            factorId: data.id,
        }
    });
}));

/**
 * @swagger
 * /api/mfa/enable:
 *   post:
 *     summary: Enable a new MFA factor by verifying the TOTP code
 *     tags: [MFA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - factorId
 *               - code
 *             properties:
 *               factorId:
 *                 type: string
 *               code:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA factor enabled successfully
 */
router.post('/enable', authenticate, asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const { factorId, code } = req.body;
    if (!factorId || !code) {
        throw new ValidationError('Factor ID and code are required');
    }
    logger.info(`MFA enable attempt for user ${req.user.id}, factor ${factorId}`);
    
    const userSupabase = getUserSupabaseClient(req.token!);

    const { data: challengeData, error: challengeError } = await userSupabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
        throw new AuthenticationError(`Failed to challenge MFA factor: ${challengeError.message}`);
    }

    const { data, error: verifyError } = await userSupabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
    });
    if (verifyError) {
        throw new AuthenticationError(`Failed to verify MFA factor: ${verifyError.message}`);
    }
    
    logger.info(`MFA enable successful for user ${req.user.id}, factor ${factorId}`);
    res.json({ success: true, data });
}));

/**
 * @swagger
 * /api/mfa/unenroll:
 *   post:
 *     summary: Unenroll an MFA factor
 *     tags: [MFA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - factorId
 *             properties:
 *               factorId:
 *                 type: string
 *     responses:
 *       200:
 *         description: MFA factor unenrolled successfully
 */
router.post('/unenroll', authenticate, asyncHandler(async (req, res) => {
    if (!req.user) throw new AuthenticationError();
    const { id: userId } = req.user;
    const { factorId } = req.body;
    
    if (!factorId) {
        throw new ValidationError('Factor ID is required');
    }
    logger.info(`MFA unenroll attempt for user ${userId}, factor ${factorId}`);

    const { data, error } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        id: factorId,
        userId,
    });

    if (error) {
        throw new AuthenticationError(`Failed to unenroll MFA: ${error.message}`);
    }
    
    logger.info(`MFA unenroll successful for user ${userId}, factor ${factorId}`);
    res.json({ success: true, data });
}));

export default router;
