/**
 * Multi-Platform Social Media Poster Service
 *
 * Supports posting to multiple social media platforms:
 * - Instagram (Graph API)
 * - Facebook (Graph API)
 * - TikTok (Business API)
 * - LinkedIn (Marketing API)
 * - Twitter/X (API v2)
 *
 * @module services/multi-platform-poster
 */

import axios, { AxiosInstance } from 'axios';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { generateCaption } from './caption-generator.js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type Platform = 'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'twitter';

export interface PlatformConfig {
  platform: Platform;
  enabled: boolean;
  accessToken: string;
  accountId?: string;
  pageId?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
}

export interface DealData {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  arv?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  images: string[];
  description?: string;
}

export interface PostResult {
  platform: Platform;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  timestamp: Date;
}

export interface MultiPostResult {
  dealId: string;
  results: PostResult[];
  successCount: number;
  failureCount: number;
}

interface PlatformLimits {
  captionLength: number;
  hashtagCount: number;
  maxImages: number;
  videoSupport: boolean;
  carouselSupport: boolean;
}

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

const PLATFORM_LIMITS: Record<Platform, PlatformLimits> = {
  instagram: {
    captionLength: 2200,
    hashtagCount: 30,
    maxImages: 10,
    videoSupport: true,
    carouselSupport: true,
  },
  facebook: {
    captionLength: 63206,
    hashtagCount: 30,
    maxImages: 10,
    videoSupport: true,
    carouselSupport: true,
  },
  tiktok: {
    captionLength: 2200,
    hashtagCount: 100,
    maxImages: 35,
    videoSupport: true,
    carouselSupport: true,
  },
  linkedin: {
    captionLength: 3000,
    hashtagCount: 5,
    maxImages: 9,
    videoSupport: true,
    carouselSupport: true,
  },
  twitter: {
    captionLength: 280,
    hashtagCount: 5,
    maxImages: 4,
    videoSupport: true,
    carouselSupport: false,
  },
};

// ============================================================================
// MULTI-PLATFORM POSTER CLASS
// ============================================================================

export class MultiPlatformPoster {
  private configs: Map<Platform, PlatformConfig> = new Map();
  private apiClients: Map<Platform, AxiosInstance> = new Map();

  constructor() {
    this.initializeFromEnv();
  }

  /**
   * Initialize platform configurations from environment variables
   */
  private initializeFromEnv(): void {
    // Instagram
    if (process.env.INSTAGRAM_ACCESS_TOKEN) {
      this.configs.set('instagram', {
        platform: 'instagram',
        enabled: true,
        accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
        accountId: process.env.INSTAGRAM_ACCOUNT_ID,
      });
      this.apiClients.set('instagram', axios.create({
        baseURL: 'https://graph.facebook.com/v18.0',
        timeout: 30000,
      }));
    }

    // Facebook
    if (process.env.FACEBOOK_ACCESS_TOKEN && process.env.FACEBOOK_PAGE_ID) {
      this.configs.set('facebook', {
        platform: 'facebook',
        enabled: true,
        accessToken: process.env.FACEBOOK_ACCESS_TOKEN,
        pageId: process.env.FACEBOOK_PAGE_ID,
      });
      this.apiClients.set('facebook', axios.create({
        baseURL: 'https://graph.facebook.com/v18.0',
        timeout: 30000,
      }));
    }

    // TikTok
    if (process.env.TIKTOK_ACCESS_TOKEN) {
      this.configs.set('tiktok', {
        platform: 'tiktok',
        enabled: true,
        accessToken: process.env.TIKTOK_ACCESS_TOKEN,
        accountId: process.env.TIKTOK_OPEN_ID,
      });
      this.apiClients.set('tiktok', axios.create({
        baseURL: 'https://open.tiktokapis.com/v2',
        timeout: 30000,
      }));
    }

    // LinkedIn
    if (process.env.LINKEDIN_ACCESS_TOKEN) {
      this.configs.set('linkedin', {
        platform: 'linkedin',
        enabled: true,
        accessToken: process.env.LINKEDIN_ACCESS_TOKEN,
        accountId: process.env.LINKEDIN_ORGANIZATION_ID,
      });
      this.apiClients.set('linkedin', axios.create({
        baseURL: 'https://api.linkedin.com/v2',
        timeout: 30000,
      }));
    }

    // Twitter/X
    if (process.env.TWITTER_BEARER_TOKEN) {
      this.configs.set('twitter', {
        platform: 'twitter',
        enabled: true,
        accessToken: process.env.TWITTER_BEARER_TOKEN,
      });
      this.apiClients.set('twitter', axios.create({
        baseURL: 'https://api.twitter.com/2',
        timeout: 30000,
      }));
    }

    logger.info(`Multi-platform poster initialized with ${this.configs.size} platforms`);
  }

  /**
   * Get list of enabled platforms
   */
  getEnabledPlatforms(): Platform[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .map(([platform]) => platform);
  }

  /**
   * Get platform limits
   */
  getPlatformLimits(platform: Platform): PlatformLimits {
    return PLATFORM_LIMITS[platform];
  }

  /**
   * Optimize caption for a specific platform
   */
  optimizeCaptionForPlatform(caption: string, platform: Platform): string {
    const limits = PLATFORM_LIMITS[platform];

    // Extract hashtags
    const hashtagMatch = caption.match(/#\w+/g) || [];
    const hashtags = hashtagMatch.slice(0, limits.hashtagCount);

    // Get caption without hashtags
    let cleanCaption = caption.replace(/#\w+\s*/g, '').trim();

    // Truncate if needed (leave room for hashtags)
    const hashtagSpace = hashtags.length > 0 ? hashtags.join(' ').length + 2 : 0;
    const maxCaptionLength = limits.captionLength - hashtagSpace;

    if (cleanCaption.length > maxCaptionLength) {
      cleanCaption = cleanCaption.substring(0, maxCaptionLength - 3) + '...';
    }

    // Recombine
    if (hashtags.length > 0) {
      return `${cleanCaption}\n\n${hashtags.join(' ')}`;
    }

    return cleanCaption;
  }

  /**
   * Post to Instagram using Graph API
   */
  private async postToInstagram(deal: DealData, caption: string): Promise<PostResult> {
    const config = this.configs.get('instagram');
    const client = this.apiClients.get('instagram');

    if (!config || !client) {
      return {
        platform: 'instagram',
        success: false,
        error: 'Instagram not configured',
        timestamp: new Date(),
      };
    }

    try {
      const optimizedCaption = this.optimizeCaptionForPlatform(caption, 'instagram');
      const images = deal.images.slice(0, 10);

      let mediaContainerId: string;

      if (images.length === 1) {
        // Single image post
        const response = await client.post(`/${config.accountId}/media`, {
          image_url: images[0],
          caption: optimizedCaption,
          access_token: config.accessToken,
        });
        mediaContainerId = response.data.id;
      } else {
        // Carousel post
        const childIds: string[] = [];

        for (const imageUrl of images) {
          const childResponse = await client.post(`/${config.accountId}/media`, {
            image_url: imageUrl,
            is_carousel_item: true,
            access_token: config.accessToken,
          });
          childIds.push(childResponse.data.id);
        }

        const carouselResponse = await client.post(`/${config.accountId}/media`, {
          media_type: 'CAROUSEL',
          caption: optimizedCaption,
          children: childIds.join(','),
          access_token: config.accessToken,
        });
        mediaContainerId = carouselResponse.data.id;
      }

      // Publish the media
      const publishResponse = await client.post(`/${config.accountId}/media_publish`, {
        creation_id: mediaContainerId,
        access_token: config.accessToken,
      });

      return {
        platform: 'instagram',
        success: true,
        postId: publishResponse.data.id,
        postUrl: `https://www.instagram.com/p/${publishResponse.data.id}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Instagram posting error:', error.response?.data || error.message);
      return {
        platform: 'instagram',
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Post to Facebook Page using Graph API
   */
  private async postToFacebook(deal: DealData, caption: string): Promise<PostResult> {
    const config = this.configs.get('facebook');
    const client = this.apiClients.get('facebook');

    if (!config || !client) {
      return {
        platform: 'facebook',
        success: false,
        error: 'Facebook not configured',
        timestamp: new Date(),
      };
    }

    try {
      const optimizedCaption = this.optimizeCaptionForPlatform(caption, 'facebook');
      const images = deal.images.slice(0, 10);

      let response;

      if (images.length === 1) {
        // Single photo post
        response = await client.post(`/${config.pageId}/photos`, {
          url: images[0],
          message: optimizedCaption,
          access_token: config.accessToken,
        });
      } else {
        // Multi-photo post - upload photos first
        const photoIds: string[] = [];

        for (const imageUrl of images) {
          const photoResponse = await client.post(`/${config.pageId}/photos`, {
            url: imageUrl,
            published: false,
            access_token: config.accessToken,
          });
          photoIds.push(photoResponse.data.id);
        }

        // Create post with attached photos
        const attachedMedia = photoIds.map(id => ({ media_fbid: id }));
        response = await client.post(`/${config.pageId}/feed`, {
          message: optimizedCaption,
          attached_media: attachedMedia,
          access_token: config.accessToken,
        });
      }

      const postId = response.data.id || response.data.post_id;

      return {
        platform: 'facebook',
        success: true,
        postId,
        postUrl: `https://www.facebook.com/${postId}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Facebook posting error:', error.response?.data || error.message);
      return {
        platform: 'facebook',
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Post to TikTok using Business API (photo carousel)
   */
  private async postToTikTok(deal: DealData, caption: string): Promise<PostResult> {
    const config = this.configs.get('tiktok');
    const client = this.apiClients.get('tiktok');

    if (!config || !client) {
      return {
        platform: 'tiktok',
        success: false,
        error: 'TikTok not configured',
        timestamp: new Date(),
      };
    }

    try {
      const optimizedCaption = this.optimizeCaptionForPlatform(caption, 'tiktok');
      const images = deal.images.slice(0, 35);

      // Initialize photo upload
      const initResponse = await client.post('/post/publish/content/init/', {
        post_info: {
          title: optimizedCaption.substring(0, 150),
          description: optimizedCaption,
          disable_comment: false,
          privacy_level: 'PUBLIC_TO_EVERYONE',
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: images.map(url => url),
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO',
      }, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        platform: 'tiktok',
        success: true,
        postId: initResponse.data.data?.publish_id,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('TikTok posting error:', error.response?.data || error.message);
      return {
        platform: 'tiktok',
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Post to LinkedIn Company Page
   */
  private async postToLinkedIn(deal: DealData, caption: string): Promise<PostResult> {
    const config = this.configs.get('linkedin');
    const client = this.apiClients.get('linkedin');

    if (!config || !client) {
      return {
        platform: 'linkedin',
        success: false,
        error: 'LinkedIn not configured',
        timestamp: new Date(),
      };
    }

    try {
      const optimizedCaption = this.optimizeCaptionForPlatform(caption, 'linkedin');
      const images = deal.images.slice(0, 9);

      // Register images first
      const imageAssets: string[] = [];

      for (const imageUrl of images) {
        // Initialize upload
        const initResponse = await client.post('/assets?action=registerUpload', {
          registerUploadRequest: {
            recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
            owner: `urn:li:organization:${config.accountId}`,
            serviceRelationships: [{
              relationshipType: 'OWNER',
              identifier: 'urn:li:userGeneratedContent',
            }],
          },
        }, {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        const uploadUrl = initResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
        const asset = initResponse.data.value.asset;

        // Download image and upload to LinkedIn
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        await axios.put(uploadUrl, imageResponse.data, {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'image/jpeg',
          },
        });

        imageAssets.push(asset);
      }

      // Create post with images
      const postContent: any = {
        author: `urn:li:organization:${config.accountId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: optimizedCaption,
            },
            shareMediaCategory: images.length > 0 ? 'IMAGE' : 'NONE',
            media: imageAssets.map(asset => ({
              status: 'READY',
              media: asset,
            })),
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await client.post('/ugcPosts', postContent, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      });

      return {
        platform: 'linkedin',
        success: true,
        postId: response.data.id,
        postUrl: `https://www.linkedin.com/feed/update/${response.data.id}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('LinkedIn posting error:', error.response?.data || error.message);
      return {
        platform: 'linkedin',
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Post to Twitter/X using API v2
   */
  private async postToTwitter(deal: DealData, caption: string): Promise<PostResult> {
    const config = this.configs.get('twitter');
    const client = this.apiClients.get('twitter');

    if (!config || !client) {
      return {
        platform: 'twitter',
        success: false,
        error: 'Twitter not configured',
        timestamp: new Date(),
      };
    }

    try {
      const optimizedCaption = this.optimizeCaptionForPlatform(caption, 'twitter');

      // Twitter requires OAuth 1.0a for media uploads - using text-only for now
      const response = await client.post('/tweets', {
        text: optimizedCaption,
      }, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const tweetId = response.data.data.id;

      return {
        platform: 'twitter',
        success: true,
        postId: tweetId,
        postUrl: `https://twitter.com/i/web/status/${tweetId}`,
        timestamp: new Date(),
      };
    } catch (error: any) {
      logger.error('Twitter posting error:', error.response?.data || error.message);
      return {
        platform: 'twitter',
        success: false,
        error: error.response?.data?.detail || error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Post to a single platform
   */
  async postToPlatform(deal: DealData, caption: string, platform: Platform): Promise<PostResult> {
    switch (platform) {
      case 'instagram':
        return this.postToInstagram(deal, caption);
      case 'facebook':
        return this.postToFacebook(deal, caption);
      case 'tiktok':
        return this.postToTikTok(deal, caption);
      case 'linkedin':
        return this.postToLinkedIn(deal, caption);
      case 'twitter':
        return this.postToTwitter(deal, caption);
      default:
        return {
          platform,
          success: false,
          error: `Unknown platform: ${platform}`,
          timestamp: new Date(),
        };
    }
  }

  /**
   * Post to multiple platforms
   */
  async postToAllPlatforms(
    deal: DealData,
    caption: string,
    platforms?: Platform[]
  ): Promise<MultiPostResult> {
    const targetPlatforms = platforms || this.getEnabledPlatforms();
    const results: PostResult[] = [];

    for (const platform of targetPlatforms) {
      const result = await this.postToPlatform(deal, caption, platform);
      results.push(result);

      // Store result in database
      await this.savePostResult(deal.id, result);

      // Rate limit between posts
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return {
      dealId: deal.id,
      results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
    };
  }

  /**
   * Save post result to database
   */
  private async savePostResult(dealId: string, result: PostResult): Promise<void> {
    try {
      await supabase.from('social_posts').insert({
        deal_id: dealId,
        platform: result.platform,
        post_id: result.postId,
        post_url: result.postUrl,
        status: result.success ? 'posted' : 'failed',
        error_message: result.error,
        posted_at: result.timestamp.toISOString(),
      });
    } catch (error) {
      logger.error('Error saving post result:', error);
    }
  }

  /**
   * Get posting history for a deal
   */
  async getPostingHistory(dealId: string): Promise<PostResult[]> {
    const { data, error } = await supabase
      .from('social_posts')
      .select('*')
      .eq('deal_id', dealId)
      .order('posted_at', { ascending: false });

    if (error) {
      logger.error('Error fetching posting history:', error);
      return [];
    }

    return data.map(row => ({
      platform: row.platform as Platform,
      success: row.status === 'posted',
      postId: row.post_id,
      postUrl: row.post_url,
      error: row.error_message,
      timestamp: new Date(row.posted_at),
    }));
  }
}

// Export singleton instance
export const multiPlatformPoster = new MultiPlatformPoster();

/**
 * Post a deal to all enabled platforms
 */
export async function postDealToAllPlatforms(
  deal: DealData,
  customCaption?: string
): Promise<MultiPostResult> {
  const caption = customCaption || await generateCaption(deal);
  return multiPlatformPoster.postToAllPlatforms(deal, caption);
}

/**
 * Post a deal to specific platforms
 */
export async function postDealToPlatforms(
  deal: DealData,
  platforms: Platform[],
  customCaption?: string
): Promise<MultiPostResult> {
  const caption = customCaption || await generateCaption(deal);
  return multiPlatformPoster.postToAllPlatforms(deal, caption, platforms);
}
