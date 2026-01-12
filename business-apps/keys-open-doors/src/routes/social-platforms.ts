/**
 * Multi-Platform Social Media Routes
 *
 * Endpoints for posting deals to multiple social media platforms.
 *
 * @module routes/social-platforms
 */

import { Router, Request, Response } from 'express';
import {
  multiPlatformPoster,
  postDealToAllPlatforms,
  postDealToPlatforms,
  Platform,
} from '../services/multi-platform-poster.js';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

/**
 * GET /api/social-platforms
 * Get list of configured platforms
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const enabledPlatforms = multiPlatformPoster.getEnabledPlatforms();

    const platformsWithLimits = enabledPlatforms.map(platform => ({
      platform,
      enabled: true,
      limits: multiPlatformPoster.getPlatformLimits(platform),
    }));

    res.json({
      success: true,
      data: {
        platforms: platformsWithLimits,
        totalEnabled: enabledPlatforms.length,
      },
    });
  } catch (error) {
    logger.error('Error getting platforms:', error);
    res.status(500).json({ success: false, error: 'Failed to get platforms' });
  }
});

/**
 * GET /api/social-platforms/:platform/limits
 * Get limits for a specific platform
 */
router.get('/:platform/limits', async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform as Platform;
    const limits = multiPlatformPoster.getPlatformLimits(platform);

    res.json({
      success: true,
      data: {
        platform,
        limits,
      },
    });
  } catch (error) {
    logger.error('Error getting platform limits:', error);
    res.status(500).json({ success: false, error: 'Failed to get platform limits' });
  }
});

// ============================================================================
// POSTING ENDPOINTS
// ============================================================================

/**
 * POST /api/social-platforms/post
 * Post a deal to selected platforms
 */
router.post('/post', async (req: Request, res: Response) => {
  try {
    const { dealId, platforms, customCaption } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required',
      });
    }

    // Get deal from database
    const { data: deal, error } = await supabase
      .from('scraped_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (error || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    // Transform to DealData format
    const dealData = {
      id: deal.id,
      title: deal.title,
      address: deal.address,
      city: deal.city,
      state: deal.state,
      zip: deal.zip,
      price: deal.price,
      arv: deal.arv,
      bedrooms: deal.bedrooms,
      bathrooms: deal.bathrooms,
      sqft: deal.sqft,
      images: deal.images || [],
      description: deal.description,
    };

    // Post to platforms
    let result;
    if (platforms && platforms.length > 0) {
      result = await postDealToPlatforms(dealData, platforms as Platform[], customCaption);
    } else {
      result = await postDealToAllPlatforms(dealData, customCaption);
    }

    // Update deal as posted if any succeeded
    if (result.successCount > 0) {
      await supabase
        .from('scraped_deals')
        .update({
          is_posted: true,
          posted_at: new Date().toISOString(),
        })
        .eq('id', dealId);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error posting to platforms:', error);
    res.status(500).json({ success: false, error: 'Failed to post to platforms' });
  }
});

/**
 * POST /api/social-platforms/post/:platform
 * Post a deal to a specific platform
 */
router.post('/post/:platform', async (req: Request, res: Response) => {
  try {
    const platform = req.params.platform as Platform;
    const { dealId, customCaption } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required',
      });
    }

    // Get deal from database
    const { data: deal, error } = await supabase
      .from('scraped_deals')
      .select('*')
      .eq('id', dealId)
      .single();

    if (error || !deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found',
      });
    }

    const dealData = {
      id: deal.id,
      title: deal.title,
      address: deal.address,
      city: deal.city,
      state: deal.state,
      zip: deal.zip,
      price: deal.price,
      arv: deal.arv,
      bedrooms: deal.bedrooms,
      bathrooms: deal.bathrooms,
      sqft: deal.sqft,
      images: deal.images || [],
      description: deal.description,
    };

    const result = await postDealToPlatforms(dealData, [platform], customCaption);

    res.json({
      success: true,
      data: result.results[0],
    });
  } catch (error) {
    logger.error('Error posting to platform:', error);
    res.status(500).json({ success: false, error: 'Failed to post to platform' });
  }
});

/**
 * POST /api/social-platforms/preview-caption
 * Preview a caption optimized for a platform
 */
router.post('/preview-caption', async (req: Request, res: Response) => {
  try {
    const { dealId, platform, caption } = req.body;

    if (!dealId || !platform) {
      return res.status(400).json({
        success: false,
        error: 'dealId and platform are required',
      });
    }

    // Get deal for caption generation if no caption provided
    let captionText = caption;
    if (!captionText) {
      const { data: deal } = await supabase
        .from('scraped_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (deal) {
        const { generateCaption } = await import('../services/caption-generator.js');
        captionText = await generateCaption(deal);
      }
    }

    if (!captionText) {
      return res.status(400).json({
        success: false,
        error: 'Could not generate caption',
      });
    }

    const optimizedCaption = multiPlatformPoster.optimizeCaptionForPlatform(
      captionText,
      platform as Platform
    );

    const limits = multiPlatformPoster.getPlatformLimits(platform as Platform);

    res.json({
      success: true,
      data: {
        original: captionText,
        optimized: optimizedCaption,
        platform,
        characterCount: optimizedCaption.length,
        characterLimit: limits.captionLength,
        withinLimit: optimizedCaption.length <= limits.captionLength,
      },
    });
  } catch (error) {
    logger.error('Error previewing caption:', error);
    res.status(500).json({ success: false, error: 'Failed to preview caption' });
  }
});

// ============================================================================
// POSTING HISTORY
// ============================================================================

/**
 * GET /api/social-platforms/history
 * Get posting history across all platforms
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const { platform, status, limit = '50', offset = '0' } = req.query;

    let query = supabase
      .from('social_posts')
      .select('*, scraped_deals(title, address, city, state)', { count: 'exact' });

    if (platform) query = query.eq('platform', platform);
    if (status) query = query.eq('status', status);

    query = query
      .order('posted_at', { ascending: false })
      .range(
        parseInt(offset as string, 10),
        parseInt(offset as string, 10) + parseInt(limit as string, 10) - 1
      );

    const { data, count, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      pagination: {
        total: count || 0,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
    });
  } catch (error) {
    logger.error('Error getting posting history:', error);
    res.status(500).json({ success: false, error: 'Failed to get posting history' });
  }
});

/**
 * GET /api/social-platforms/history/:dealId
 * Get posting history for a specific deal
 */
router.get('/history/:dealId', async (req: Request, res: Response) => {
  try {
    const history = await multiPlatformPoster.getPostingHistory(req.params.dealId);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    logger.error('Error getting deal posting history:', error);
    res.status(500).json({ success: false, error: 'Failed to get posting history' });
  }
});

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * POST /api/social-platforms/bulk-post
 * Post multiple deals to platforms
 */
router.post('/bulk-post', async (req: Request, res: Response) => {
  try {
    const { dealIds, platforms, delayBetweenPosts = 5000 } = req.body;

    if (!dealIds || !Array.isArray(dealIds) || dealIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'dealIds array is required',
      });
    }

    const results = [];

    for (const dealId of dealIds) {
      // Get deal
      const { data: deal } = await supabase
        .from('scraped_deals')
        .select('*')
        .eq('id', dealId)
        .single();

      if (!deal) {
        results.push({ dealId, success: false, error: 'Deal not found' });
        continue;
      }

      const dealData = {
        id: deal.id,
        title: deal.title,
        address: deal.address,
        city: deal.city,
        state: deal.state,
        zip: deal.zip,
        price: deal.price,
        arv: deal.arv,
        bedrooms: deal.bedrooms,
        bathrooms: deal.bathrooms,
        sqft: deal.sqft,
        images: deal.images || [],
      };

      try {
        const result = await postDealToPlatforms(
          dealData,
          platforms as Platform[] || multiPlatformPoster.getEnabledPlatforms()
        );
        results.push({ dealId, ...result });

        // Update deal status
        if (result.successCount > 0) {
          await supabase
            .from('scraped_deals')
            .update({ is_posted: true, posted_at: new Date().toISOString() })
            .eq('id', dealId);
        }
      } catch (error: any) {
        results.push({ dealId, success: false, error: error.message });
      }

      // Delay between posts
      await new Promise(resolve => setTimeout(resolve, delayBetweenPosts));
    }

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: dealIds.length,
          successful: results.filter(r => (r as any).successCount > 0).length,
          failed: results.filter(r => (r as any).successCount === 0 || (r as any).success === false).length,
        },
      },
    });
  } catch (error) {
    logger.error('Error in bulk post:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk post' });
  }
});

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * GET /api/social-platforms/analytics
 * Get posting analytics by platform
 */
router.get('/analytics', async (_req: Request, res: Response) => {
  try {
    const { data: posts } = await supabase
      .from('social_posts')
      .select('platform, status, posted_at');

    if (!posts) {
      return res.json({
        success: true,
        data: { byPlatform: {}, totalPosts: 0 },
      });
    }

    const analytics: Record<string, { posted: number; failed: number; total: number }> = {};

    for (const post of posts) {
      if (!analytics[post.platform]) {
        analytics[post.platform] = { posted: 0, failed: 0, total: 0 };
      }
      analytics[post.platform].total++;
      if (post.status === 'posted') {
        analytics[post.platform].posted++;
      } else {
        analytics[post.platform].failed++;
      }
    }

    res.json({
      success: true,
      data: {
        byPlatform: analytics,
        totalPosts: posts.length,
        successRate: posts.length > 0
          ? Math.round((posts.filter(p => p.status === 'posted').length / posts.length) * 100)
          : 0,
      },
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

export default router;
