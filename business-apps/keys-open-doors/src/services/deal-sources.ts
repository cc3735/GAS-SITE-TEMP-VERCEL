/**
 * Multiple Deal Sources Service
 *
 * Aggregates real estate deals from multiple sources:
 * - InvestorLift (existing)
 * - Connected Investors
 * - PropStream
 * - DealMachine
 * - Public Records (Tax Delinquent, Probate)
 *
 * @module services/deal-sources
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { supabase } from '../utils/supabase.js';
import { logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type DealSource =
  | 'investorlift'
  | 'connected_investors'
  | 'propstream'
  | 'dealmachine'
  | 'tax_delinquent'
  | 'probate'
  | 'foreclosure'
  | 'manual';

export interface DealData {
  id?: string;
  source: DealSource;
  sourceId?: string;
  title: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  price: number;
  arv?: number;
  repairCost?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  images: string[];
  description?: string;
  sellerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    company?: string;
  };
  listingDate?: Date;
  expirationDate?: Date;
  dealScore?: number;
  metadata?: Record<string, any>;
}

export interface SourceConfig {
  source: DealSource;
  enabled: boolean;
  credentials?: {
    username?: string;
    password?: string;
    apiKey?: string;
  };
  filters?: {
    states?: string[];
    cities?: string[];
    minPrice?: number;
    maxPrice?: number;
    propertyTypes?: string[];
  };
  rateLimit?: {
    requestsPerMinute: number;
    delayMs: number;
  };
}

export interface ScrapingResult {
  source: DealSource;
  success: boolean;
  dealsFound: number;
  dealsSaved: number;
  duplicatesSkipped: number;
  errors: string[];
  duration: number;
}

// ============================================================================
// BASE SCRAPER CLASS
// ============================================================================

abstract class BaseScraper {
  protected config: SourceConfig;
  protected browser: Browser | null = null;

  constructor(config: SourceConfig) {
    this.config = config;
  }

  abstract scrape(): Promise<DealData[]>;

  protected async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  protected async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async randomDelay(min: number = 1000, max: number = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    return this.delay(delay);
  }

  protected calculateDealScore(deal: DealData): number {
    let score = 50; // Base score

    // Price to ARV ratio (higher spread = better deal)
    if (deal.arv && deal.price) {
      const spread = ((deal.arv - deal.price) / deal.arv) * 100;
      if (spread >= 40) score += 30;
      else if (spread >= 30) score += 20;
      else if (spread >= 20) score += 10;
    }

    // Has images
    if (deal.images.length >= 5) score += 10;
    else if (deal.images.length >= 1) score += 5;

    // Has complete info
    if (deal.bedrooms && deal.bathrooms) score += 5;
    if (deal.sqft) score += 5;
    if (deal.yearBuilt) score += 3;
    if (deal.description) score += 2;

    return Math.min(100, score);
  }
}

// ============================================================================
// INVESTORLIFT SCRAPER
// ============================================================================

class InvestorLiftScraper extends BaseScraper {
  private readonly baseUrl = 'https://investorlift.com';

  async scrape(): Promise<DealData[]> {
    const deals: DealData[] = [];
    const browser = await this.initBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Login if credentials provided
      if (this.config.credentials?.username && this.config.credentials?.password) {
        await this.login(page);
      }

      // Navigate to marketplace
      await page.goto(`${this.baseUrl}/marketplace`, { waitUntil: 'networkidle2' });

      // Scroll to load more deals
      let previousHeight = 0;
      for (let i = 0; i < 5; i++) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await this.randomDelay();
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break;
        previousHeight = newHeight;
      }

      // Extract deals
      const dealElements = await page.$$('.deal-card, .property-card');

      for (const element of dealElements) {
        try {
          const deal = await this.extractDealFromElement(page, element);
          if (deal && this.matchesFilters(deal)) {
            deal.dealScore = this.calculateDealScore(deal);
            deals.push(deal);
          }
        } catch (error) {
          logger.warn('Error extracting deal:', error);
        }
      }

      logger.info(`InvestorLift: Found ${deals.length} deals`);
    } finally {
      await this.closeBrowser();
    }

    return deals;
  }

  private async login(page: Page): Promise<void> {
    await page.goto(`${this.baseUrl}/login`, { waitUntil: 'networkidle2' });
    await page.type('input[name="email"]', this.config.credentials!.username!);
    await page.type('input[name="password"]', this.config.credentials!.password!);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
  }

  private async extractDealFromElement(page: Page, element: any): Promise<DealData | null> {
    return await page.evaluate((el: Element) => {
      const titleEl = el.querySelector('.deal-title, .property-title, h3');
      const addressEl = el.querySelector('.address, .location');
      const priceEl = el.querySelector('.price, .asking-price');
      const arvEl = el.querySelector('.arv, .after-repair-value');
      const imgEl = el.querySelector('img');

      if (!titleEl || !priceEl) return null;

      const addressText = addressEl?.textContent?.trim() || '';
      const addressParts = addressText.split(',').map((s: string) => s.trim());

      const parsePrice = (text: string): number => {
        const match = text.match(/\$?([\d,]+)/);
        return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
      };

      return {
        source: 'investorlift',
        title: titleEl.textContent?.trim() || '',
        address: addressParts[0] || addressText,
        city: addressParts[1] || '',
        state: addressParts[2]?.split(' ')[0] || '',
        zip: addressParts[2]?.split(' ')[1] || '',
        price: parsePrice(priceEl.textContent || '0'),
        arv: arvEl ? parsePrice(arvEl.textContent || '0') : undefined,
        images: imgEl ? [imgEl.src] : [],
      };
    }, element);
  }

  private matchesFilters(deal: DealData): boolean {
    const filters = this.config.filters;
    if (!filters) return true;

    if (filters.states?.length && !filters.states.includes(deal.state)) return false;
    if (filters.cities?.length && !filters.cities.includes(deal.city)) return false;
    if (filters.minPrice && deal.price < filters.minPrice) return false;
    if (filters.maxPrice && deal.price > filters.maxPrice) return false;

    return true;
  }
}

// ============================================================================
// CONNECTED INVESTORS SCRAPER
// ============================================================================

class ConnectedInvestorsScraper extends BaseScraper {
  private readonly baseUrl = 'https://connectedinvestors.com';

  async scrape(): Promise<DealData[]> {
    const deals: DealData[] = [];

    // Use API if available
    if (this.config.credentials?.apiKey) {
      return this.scrapeViaApi();
    }

    const browser = await this.initBrowser();

    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

      // Login
      if (this.config.credentials?.username && this.config.credentials?.password) {
        await page.goto(`${this.baseUrl}/login`);
        await page.type('#email', this.config.credentials.username);
        await page.type('#password', this.config.credentials.password);
        await page.click('button[type="submit"]');
        await page.waitForNavigation();
      }

      // Navigate to deals
      await page.goto(`${this.baseUrl}/deals/search`, { waitUntil: 'networkidle2' });

      // Apply filters
      if (this.config.filters?.states?.length) {
        for (const state of this.config.filters.states) {
          await page.select('#state-filter', state);
          await this.randomDelay(500, 1000);
        }
      }

      // Load more deals
      for (let i = 0; i < 3; i++) {
        try {
          await page.click('.load-more-btn');
          await this.randomDelay();
        } catch {
          break;
        }
      }

      // Extract deals
      const content = await page.content();
      const $ = cheerio.load(content);

      $('.deal-listing, .property-item').each((_, el) => {
        const $el = $(el);
        const deal: DealData = {
          source: 'connected_investors',
          title: $el.find('.deal-title, h3').text().trim(),
          address: $el.find('.address').text().trim(),
          city: $el.find('.city').text().trim(),
          state: $el.find('.state').text().trim(),
          zip: $el.find('.zip').text().trim(),
          price: this.parsePrice($el.find('.price').text()),
          arv: this.parsePrice($el.find('.arv').text()),
          images: [],
        };

        $el.find('img').each((_, img) => {
          const src = $(img).attr('src');
          if (src && !src.includes('placeholder')) {
            deal.images.push(src);
          }
        });

        if (deal.title && deal.price && this.matchesFilters(deal)) {
          deal.dealScore = this.calculateDealScore(deal);
          deals.push(deal);
        }
      });

      logger.info(`Connected Investors: Found ${deals.length} deals`);
    } finally {
      await this.closeBrowser();
    }

    return deals;
  }

  private async scrapeViaApi(): Promise<DealData[]> {
    const deals: DealData[] = [];

    try {
      const response = await axios.get(`${this.baseUrl}/api/deals`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials?.apiKey}`,
        },
        params: {
          states: this.config.filters?.states?.join(','),
          minPrice: this.config.filters?.minPrice,
          maxPrice: this.config.filters?.maxPrice,
        },
      });

      for (const item of response.data.deals || []) {
        const deal: DealData = {
          source: 'connected_investors',
          sourceId: item.id,
          title: item.title,
          address: item.address,
          city: item.city,
          state: item.state,
          zip: item.zip,
          price: item.askingPrice,
          arv: item.arv,
          bedrooms: item.beds,
          bathrooms: item.baths,
          sqft: item.sqft,
          images: item.photos || [],
          description: item.description,
        };
        deal.dealScore = this.calculateDealScore(deal);
        deals.push(deal);
      }
    } catch (error) {
      logger.error('Connected Investors API error:', error);
    }

    return deals;
  }

  private parsePrice(text: string): number {
    const match = text.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
  }

  private matchesFilters(deal: DealData): boolean {
    const filters = this.config.filters;
    if (!filters) return true;
    if (filters.states?.length && !filters.states.includes(deal.state)) return false;
    if (filters.minPrice && deal.price < filters.minPrice) return false;
    if (filters.maxPrice && deal.price > filters.maxPrice) return false;
    return true;
  }
}

// ============================================================================
// PROPSTREAM API INTEGRATION
// ============================================================================

class PropStreamScraper extends BaseScraper {
  private readonly apiUrl = 'https://api.propstream.com/v1';

  async scrape(): Promise<DealData[]> {
    const deals: DealData[] = [];

    if (!this.config.credentials?.apiKey) {
      logger.warn('PropStream: API key not configured');
      return deals;
    }

    try {
      const response = await axios.get(`${this.apiUrl}/properties/search`, {
        headers: {
          'Authorization': `Bearer ${this.config.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
        params: {
          states: this.config.filters?.states?.join(','),
          minPrice: this.config.filters?.minPrice,
          maxPrice: this.config.filters?.maxPrice,
          propertyTypes: this.config.filters?.propertyTypes?.join(','),
          distressed: true,
          motivated: true,
        },
      });

      for (const property of response.data.results || []) {
        const deal: DealData = {
          source: 'propstream',
          sourceId: property.propertyId,
          title: `${property.address}, ${property.city}`,
          address: property.address,
          city: property.city,
          state: property.state,
          zip: property.zip,
          county: property.county,
          price: property.estimatedValue || property.lastSalePrice,
          arv: property.estimatedValue,
          bedrooms: property.beds,
          bathrooms: property.baths,
          sqft: property.sqft,
          lotSize: property.lotSize,
          yearBuilt: property.yearBuilt,
          propertyType: property.propertyType,
          images: property.photos || [],
          sellerInfo: property.ownerInfo ? {
            name: property.ownerInfo.name,
            phone: property.ownerInfo.phone,
          } : undefined,
          metadata: {
            equity: property.equity,
            mortgageBalance: property.mortgageBalance,
            taxDelinquent: property.taxDelinquent,
            preForeclosure: property.preForeclosure,
            vacant: property.vacant,
          },
        };

        deal.dealScore = this.calculateDealScore(deal);
        deals.push(deal);
      }

      logger.info(`PropStream: Found ${deals.length} deals`);
    } catch (error) {
      logger.error('PropStream API error:', error);
    }

    return deals;
  }
}

// ============================================================================
// TAX DELINQUENT SCRAPER
// ============================================================================

class TaxDelinquentScraper extends BaseScraper {
  async scrape(): Promise<DealData[]> {
    const deals: DealData[] = [];
    const states = this.config.filters?.states || ['TX', 'FL', 'GA'];

    for (const state of states) {
      try {
        const stateDeals = await this.scrapeStateRecords(state);
        deals.push(...stateDeals);
      } catch (error) {
        logger.warn(`Tax delinquent scrape failed for ${state}:`, error);
      }
    }

    return deals;
  }

  private async scrapeStateRecords(state: string): Promise<DealData[]> {
    const deals: DealData[] = [];
    const browser = await this.initBrowser();

    try {
      const page = await browser.newPage();

      // State-specific tax collector URLs (examples)
      const taxUrls: Record<string, string> = {
        TX: 'https://taxcollector.texas.gov/delinquent',
        FL: 'https://taxcollector.florida.gov/delinquent',
        GA: 'https://taxcollector.georgia.gov/delinquent',
      };

      const url = taxUrls[state];
      if (!url) return deals;

      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      // Extract property data (varies by state)
      const content = await page.content();
      const $ = cheerio.load(content);

      $('table tr, .property-row').each((_, el) => {
        const $el = $(el);
        const address = $el.find('.address, td:nth-child(2)').text().trim();
        const amountOwed = $el.find('.amount, td:nth-child(5)').text().trim();

        if (address && amountOwed) {
          const deal: DealData = {
            source: 'tax_delinquent',
            title: `Tax Delinquent: ${address}`,
            address,
            city: '',
            state,
            zip: '',
            price: this.parseAmount(amountOwed),
            images: [],
            metadata: {
              taxesOwed: this.parseAmount(amountOwed),
              status: 'tax_delinquent',
            },
          };

          deal.dealScore = this.calculateDealScore(deal);
          deals.push(deal);
        }
      });
    } finally {
      await this.closeBrowser();
    }

    return deals;
  }

  private parseAmount(text: string): number {
    const match = text.match(/\$?([\d,]+\.?\d*)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }
}

// ============================================================================
// DEAL SOURCE AGGREGATOR
// ============================================================================

export class DealSourceAggregator {
  private scrapers: Map<DealSource, BaseScraper> = new Map();
  private configs: Map<DealSource, SourceConfig> = new Map();

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv(): void {
    // InvestorLift
    if (process.env.INVESTORLIFT_USERNAME) {
      const config: SourceConfig = {
        source: 'investorlift',
        enabled: true,
        credentials: {
          username: process.env.INVESTORLIFT_USERNAME,
          password: process.env.INVESTORLIFT_PASSWORD,
        },
        filters: {
          states: process.env.FILTER_STATES?.split(','),
          minPrice: parseInt(process.env.FILTER_MIN_PRICE || '0'),
          maxPrice: parseInt(process.env.FILTER_MAX_PRICE || '500000'),
        },
      };
      this.configs.set('investorlift', config);
      this.scrapers.set('investorlift', new InvestorLiftScraper(config));
    }

    // Connected Investors
    if (process.env.CONNECTED_INVESTORS_API_KEY || process.env.CONNECTED_INVESTORS_USERNAME) {
      const config: SourceConfig = {
        source: 'connected_investors',
        enabled: true,
        credentials: {
          apiKey: process.env.CONNECTED_INVESTORS_API_KEY,
          username: process.env.CONNECTED_INVESTORS_USERNAME,
          password: process.env.CONNECTED_INVESTORS_PASSWORD,
        },
        filters: {
          states: process.env.FILTER_STATES?.split(','),
        },
      };
      this.configs.set('connected_investors', config);
      this.scrapers.set('connected_investors', new ConnectedInvestorsScraper(config));
    }

    // PropStream
    if (process.env.PROPSTREAM_API_KEY) {
      const config: SourceConfig = {
        source: 'propstream',
        enabled: true,
        credentials: {
          apiKey: process.env.PROPSTREAM_API_KEY,
        },
        filters: {
          states: process.env.FILTER_STATES?.split(','),
        },
      };
      this.configs.set('propstream', config);
      this.scrapers.set('propstream', new PropStreamScraper(config));
    }

    // Tax Delinquent
    if (process.env.ENABLE_TAX_DELINQUENT === 'true') {
      const config: SourceConfig = {
        source: 'tax_delinquent',
        enabled: true,
        filters: {
          states: process.env.FILTER_STATES?.split(','),
        },
      };
      this.configs.set('tax_delinquent', config);
      this.scrapers.set('tax_delinquent', new TaxDelinquentScraper(config));
    }

    logger.info(`Deal aggregator initialized with ${this.scrapers.size} sources`);
  }

  /**
   * Get enabled sources
   */
  getEnabledSources(): DealSource[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.enabled)
      .map(([source]) => source);
  }

  /**
   * Scrape from a single source
   */
  async scrapeSource(source: DealSource): Promise<ScrapingResult> {
    const startTime = Date.now();
    const result: ScrapingResult = {
      source,
      success: false,
      dealsFound: 0,
      dealsSaved: 0,
      duplicatesSkipped: 0,
      errors: [],
      duration: 0,
    };

    const scraper = this.scrapers.get(source);
    if (!scraper) {
      result.errors.push(`Source ${source} not configured`);
      return result;
    }

    try {
      const deals = await scraper.scrape();
      result.dealsFound = deals.length;

      // Save deals to database
      for (const deal of deals) {
        const saved = await this.saveDeal(deal);
        if (saved === 'saved') {
          result.dealsSaved++;
        } else if (saved === 'duplicate') {
          result.duplicatesSkipped++;
        }
      }

      result.success = true;
    } catch (error: any) {
      result.errors.push(error.message);
      logger.error(`Error scraping ${source}:`, error);
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Scrape from all enabled sources
   */
  async scrapeAllSources(): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];

    for (const source of this.getEnabledSources()) {
      const result = await this.scrapeSource(source);
      results.push(result);

      // Log job to database
      await this.logScrapingJob(result);
    }

    return results;
  }

  /**
   * Save deal to database with deduplication
   */
  private async saveDeal(deal: DealData): Promise<'saved' | 'duplicate' | 'error'> {
    try {
      // Check for duplicates by address
      const { data: existing } = await supabase
        .from('scraped_deals')
        .select('id')
        .ilike('address', deal.address)
        .eq('city', deal.city)
        .eq('state', deal.state)
        .single();

      if (existing) {
        return 'duplicate';
      }

      // Insert new deal
      const { error } = await supabase.from('scraped_deals').insert({
        id: uuidv4(),
        source: deal.source,
        source_id: deal.sourceId,
        title: deal.title,
        address: deal.address,
        city: deal.city,
        state: deal.state,
        zip: deal.zip,
        county: deal.county,
        price: deal.price,
        arv: deal.arv,
        repair_cost: deal.repairCost,
        bedrooms: deal.bedrooms,
        bathrooms: deal.bathrooms,
        sqft: deal.sqft,
        lot_size: deal.lotSize,
        year_built: deal.yearBuilt,
        property_type: deal.propertyType,
        images: deal.images,
        description: deal.description,
        seller_info: deal.sellerInfo,
        deal_score: deal.dealScore,
        metadata: deal.metadata,
        is_approved: false,
        is_posted: false,
        scraped_at: new Date().toISOString(),
      });

      if (error) throw error;
      return 'saved';
    } catch (error) {
      logger.error('Error saving deal:', error);
      return 'error';
    }
  }

  /**
   * Log scraping job
   */
  private async logScrapingJob(result: ScrapingResult): Promise<void> {
    try {
      await supabase.from('scraping_jobs').insert({
        id: uuidv4(),
        source: result.source,
        status: result.success ? 'completed' : 'failed',
        deals_found: result.dealsFound,
        deals_saved: result.dealsSaved,
        duplicates_skipped: result.duplicatesSkipped,
        errors: result.errors,
        duration_ms: result.duration,
        completed_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error logging scraping job:', error);
    }
  }
}

// Export singleton
export const dealSourceAggregator = new DealSourceAggregator();

/**
 * Run scraping for all sources
 */
export async function runAllScrapers(): Promise<ScrapingResult[]> {
  return dealSourceAggregator.scrapeAllSources();
}

/**
 * Run scraping for specific source
 */
export async function runScraper(source: DealSource): Promise<ScrapingResult> {
  return dealSourceAggregator.scrapeSource(source);
}
