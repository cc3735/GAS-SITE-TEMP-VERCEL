/**
 * Trademark Search Service
 *
 * Provides trademark search functionality with multiple provider support:
 * - Primary: USPTO TESS API
 * - Fallback: TrademarkNow API
 * - Secondary Fallback: Corsearch API
 *
 * Includes phonetic matching algorithms (Soundex, Metaphone) for
 * comprehensive similarity analysis.
 */

import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { ExternalServiceError } from '../../utils/errors.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import type {
  TrademarkSearchRequest,
  TrademarkSearchResult,
  TrademarkSearchReport,
  SearchAIAnalysis,
  ConflictAnalysis,
  JurisdictionType
} from '../../types/trademark.js';

// API Configuration (from environment)
const USPTO_API_URL = process.env.USPTO_API_URL || 'https://tsdrapi.uspto.gov';
const USPTO_API_KEY = process.env.USPTO_API_KEY || '';
const TRADEMARKNOW_API_URL = process.env.TRADEMARKNOW_API_URL || 'https://api.trademarknow.com';
const TRADEMARKNOW_API_KEY = process.env.TRADEMARKNOW_API_KEY || '';
const CORSEARCH_API_URL = process.env.CORSEARCH_API_URL || 'https://api.corsearch.com';
const CORSEARCH_API_KEY = process.env.CORSEARCH_API_KEY || '';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const PROVIDER_TIMEOUT_MS = 30000;

// Search result cache (in-memory with TTL)
const searchCache = new Map<string, { data: TrademarkSearchResult[]; timestamp: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export type SearchProvider = 'uspto' | 'trademarknow' | 'corsearch' | 'state';

interface ProviderResponse {
  results: TrademarkSearchResult[];
  provider: SearchProvider;
  fallbackUsed: boolean;
}

/**
 * Search for trademarks across all configured providers
 */
export async function searchTrademarks(
  request: TrademarkSearchRequest,
  userId?: string
): Promise<TrademarkSearchReport> {
  const startTime = Date.now();

  // Check cache first
  const cacheKey = generateCacheKey(request);
  const cachedResult = getCachedResult(cacheKey);
  if (cachedResult) {
    logger.info('Returning cached trademark search results');
    return createSearchReport(request, cachedResult, 'cache', false, userId);
  }

  // Try providers in order: USPTO -> TrademarkNow -> Corsearch
  let response: ProviderResponse;

  try {
    // Try USPTO TESS API first
    if (USPTO_API_KEY) {
      try {
        const results = await searchUSPTO(request);
        response = { results, provider: 'uspto', fallbackUsed: false };
      } catch (error) {
        logger.warn('USPTO search failed, trying fallback:', error);
        response = await tryFallbackProviders(request);
      }
    } else {
      // No USPTO API key, go straight to fallbacks
      response = await tryFallbackProviders(request);
    }
  } catch (error) {
    logger.error('All trademark search providers failed:', error);
    throw new ExternalServiceError('Trademark Search', 'All search providers unavailable');
  }

  // Cache the results
  setCachedResult(cacheKey, response.results);

  // Calculate phonetic similarities for additional analysis
  const enhancedResults = await enhanceResultsWithPhoneticScores(request.term, response.results);

  // Create and return search report
  const report = await createSearchReport(
    request,
    enhancedResults,
    response.provider,
    response.fallbackUsed,
    userId
  );

  const duration = Date.now() - startTime;
  logger.info(`Trademark search completed in ${duration}ms, found ${response.results.length} results`);

  return report;
}

/**
 * Search USPTO TESS API
 */
async function searchUSPTO(request: TrademarkSearchRequest): Promise<TrademarkSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    // Build USPTO TESS search query
    const searchQuery = buildUSPTOQuery(request);

    const response = await fetch(`${USPTO_API_URL}/ts/cd/casestatus/sn/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'USPTO-API-Key': USPTO_API_KEY,
      },
      body: JSON.stringify({
        searchTerm: searchQuery,
        searchType: mapSearchType(request.search_type),
        classFilter: request.class_filter,
        statusFilter: request.status_filter,
        limit: 100,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`USPTO API returned ${response.status}`);
    }

    const data = await response.json();
    return normalizeUSPTOResults(data.results || []);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Try fallback providers (TrademarkNow, then Corsearch)
 */
async function tryFallbackProviders(request: TrademarkSearchRequest): Promise<ProviderResponse> {
  // Try TrademarkNow first
  if (TRADEMARKNOW_API_KEY) {
    try {
      const results = await searchTrademarkNow(request);
      return { results, provider: 'trademarknow', fallbackUsed: true };
    } catch (error) {
      logger.warn('TrademarkNow search failed, trying Corsearch:', error);
    }
  }

  // Try Corsearch as last resort
  if (CORSEARCH_API_KEY) {
    try {
      const results = await searchCorsearch(request);
      return { results, provider: 'corsearch', fallbackUsed: true };
    } catch (error) {
      logger.warn('Corsearch search failed:', error);
    }
  }

  // If all fail, return empty results with warning
  logger.error('All trademark search providers failed');
  return { results: [], provider: 'uspto', fallbackUsed: true };
}

/**
 * Search TrademarkNow API
 */
async function searchTrademarkNow(request: TrademarkSearchRequest): Promise<TrademarkSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(`${TRADEMARKNOW_API_URL}/v2/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRADEMARKNOW_API_KEY}`,
      },
      body: JSON.stringify({
        query: request.term,
        type: request.search_type,
        jurisdictions: request.jurisdiction === 'federal' ? ['US'] : [`US-${request.state}`],
        classes: request.class_filter,
        limit: 100,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`TrademarkNow API returned ${response.status}`);
    }

    const data = await response.json();
    return normalizeTrademarkNowResults(data.results || []);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Search Corsearch API
 */
async function searchCorsearch(request: TrademarkSearchRequest): Promise<TrademarkSearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const response = await fetch(`${CORSEARCH_API_URL}/trademark/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CORSEARCH_API_KEY,
      },
      body: JSON.stringify({
        term: request.term,
        searchStrategy: request.search_type === 'phonetic' ? 'FUZZY' : 'EXACT',
        jurisdiction: request.jurisdiction === 'federal' ? 'US' : `US-${request.state}`,
        niceClasses: request.class_filter,
        maxResults: 100,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Corsearch API returned ${response.status}`);
    }

    const data = await response.json();
    return normalizeCorsearchResults(data.marks || []);
  } finally {
    clearTimeout(timeout);
  }
}

// ==================== PHONETIC ALGORITHMS ====================

/**
 * Calculate Soundex code for a word
 * https://en.wikipedia.org/wiki/Soundex
 */
export function soundex(word: string): string {
  if (!word || word.length === 0) return '';

  const upperWord = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (upperWord.length === 0) return '';

  const firstLetter = upperWord[0];

  const codes: Record<string, string> = {
    'B': '1', 'F': '1', 'P': '1', 'V': '1',
    'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
    'D': '3', 'T': '3',
    'L': '4',
    'M': '5', 'N': '5',
    'R': '6',
  };

  let encoded = firstLetter;
  let previousCode = codes[firstLetter] || '';

  for (let i = 1; i < upperWord.length && encoded.length < 4; i++) {
    const char = upperWord[i];
    const code = codes[char] || '0';

    if (code !== '0' && code !== previousCode) {
      encoded += code;
      previousCode = code;
    } else if (code === '0') {
      previousCode = '';
    }
  }

  return encoded.padEnd(4, '0');
}

/**
 * Calculate Double Metaphone codes for a word
 * Simplified version - returns primary metaphone code
 */
export function metaphone(word: string): string {
  if (!word || word.length === 0) return '';

  const upperWord = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (upperWord.length === 0) return '';

  let result = '';
  let i = 0;

  // Skip if starts with GN, KN, PN, WR, PS
  const skipPairs = ['GN', 'KN', 'PN', 'WR', 'PS'];
  if (skipPairs.some(pair => upperWord.startsWith(pair))) {
    i = 1;
  }

  while (i < upperWord.length && result.length < 6) {
    const char = upperWord[i];
    const nextChar = upperWord[i + 1] || '';
    const prevChar = upperWord[i - 1] || '';

    switch (char) {
      case 'A': case 'E': case 'I': case 'O': case 'U':
        if (i === 0) result += char;
        break;
      case 'B':
        if (prevChar !== 'M' || i !== upperWord.length - 1) result += 'P';
        break;
      case 'C':
        if (nextChar === 'H') {
          result += 'X';
          i++;
        } else if (['I', 'E', 'Y'].includes(nextChar)) {
          result += 'S';
        } else {
          result += 'K';
        }
        break;
      case 'D':
        if (nextChar === 'G' && ['I', 'E', 'Y'].includes(upperWord[i + 2] || '')) {
          result += 'J';
          i += 2;
        } else {
          result += 'T';
        }
        break;
      case 'F': case 'J': case 'L': case 'M': case 'N': case 'R':
        result += char;
        break;
      case 'G':
        if (nextChar === 'H') {
          if (i > 0 && !['A', 'E', 'I', 'O', 'U'].includes(prevChar)) {
            i++;
          } else {
            result += 'K';
            i++;
          }
        } else if (['I', 'E', 'Y'].includes(nextChar)) {
          result += 'J';
        } else {
          result += 'K';
        }
        break;
      case 'H':
        if (['A', 'E', 'I', 'O', 'U'].includes(nextChar) &&
            !['A', 'E', 'I', 'O', 'U'].includes(prevChar)) {
          result += 'H';
        }
        break;
      case 'K':
        if (prevChar !== 'C') result += 'K';
        break;
      case 'P':
        if (nextChar === 'H') {
          result += 'F';
          i++;
        } else {
          result += 'P';
        }
        break;
      case 'Q':
        result += 'K';
        break;
      case 'S':
        if (nextChar === 'H') {
          result += 'X';
          i++;
        } else if (['I', 'O'].includes(nextChar) && upperWord[i + 2] === 'N') {
          result += 'X';
        } else {
          result += 'S';
        }
        break;
      case 'T':
        if (nextChar === 'H') {
          result += '0'; // TH sound
          i++;
        } else if (nextChar === 'I' && ['O', 'A'].includes(upperWord[i + 2] || '')) {
          result += 'X';
        } else {
          result += 'T';
        }
        break;
      case 'V':
        result += 'F';
        break;
      case 'W': case 'Y':
        if (['A', 'E', 'I', 'O', 'U'].includes(nextChar)) {
          result += char;
        }
        break;
      case 'X':
        result += 'KS';
        break;
      case 'Z':
        result += 'S';
        break;
    }
    i++;
  }

  return result;
}

/**
 * Calculate phonetic similarity score between two terms
 * Returns a score from 0-100
 */
export function phoneticSimilarity(term1: string, term2: string): number {
  const soundex1 = soundex(term1);
  const soundex2 = soundex(term2);
  const metaphone1 = metaphone(term1);
  const metaphone2 = metaphone(term2);

  let score = 0;

  // Soundex match
  if (soundex1 === soundex2) {
    score += 50;
  } else if (soundex1.slice(0, 3) === soundex2.slice(0, 3)) {
    score += 30;
  } else if (soundex1.slice(0, 2) === soundex2.slice(0, 2)) {
    score += 15;
  }

  // Metaphone match
  if (metaphone1 === metaphone2) {
    score += 50;
  } else if (metaphone1.slice(0, 4) === metaphone2.slice(0, 4)) {
    score += 35;
  } else if (metaphone1.slice(0, 3) === metaphone2.slice(0, 3)) {
    score += 20;
  }

  return Math.min(100, score);
}

/**
 * Calculate Levenshtein distance for visual similarity
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1].toLowerCase() === s2[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculate visual similarity score (based on Levenshtein distance)
 */
export function visualSimilarity(term1: string, term2: string): number {
  const distance = levenshteinDistance(term1, term2);
  const maxLen = Math.max(term1.length, term2.length);
  if (maxLen === 0) return 100;

  return Math.round(((maxLen - distance) / maxLen) * 100);
}

// ==================== RESULT NORMALIZATION ====================

/**
 * Normalize USPTO API results to common format
 */
function normalizeUSPTOResults(results: any[]): TrademarkSearchResult[] {
  return results.map(r => ({
    serial_number: r.serialNumber || r.sn || '',
    registration_number: r.registrationNumber || r.rn || undefined,
    mark_literal: r.markLiteralElements || r.wordMark || '',
    mark_drawing_code: r.markDrawingCode || undefined,
    owner_name: r.ownerName || r.owner?.name || '',
    owner_address: r.ownerAddress || undefined,
    status: r.status || r.statusCode || '',
    status_date: r.statusDate || undefined,
    filing_date: r.filingDate || '',
    registration_date: r.registrationDate || undefined,
    goods_services: r.goodsAndServices || r.gs || '',
    classes: r.internationalClasses || r.classes || [],
    attorneys: r.attorneys || undefined,
    correspondent: r.correspondent || undefined,
    design_codes: r.designCodes || undefined,
    similarity_score: 0, // Will be calculated
    similarity_type: 'exact',
    source: 'uspto' as const,
  }));
}

/**
 * Normalize TrademarkNow API results to common format
 */
function normalizeTrademarkNowResults(results: any[]): TrademarkSearchResult[] {
  return results.map(r => ({
    serial_number: r.applicationNumber || r.serialNumber || '',
    registration_number: r.registrationNumber || undefined,
    mark_literal: r.markName || r.wordElement || '',
    mark_drawing_code: r.designCode || undefined,
    owner_name: r.applicantName || r.ownerName || '',
    owner_address: undefined,
    status: r.statusDescription || r.status || '',
    status_date: r.statusDate || undefined,
    filing_date: r.applicationDate || r.filingDate || '',
    registration_date: r.registrationDate || undefined,
    goods_services: r.goodsServices || '',
    classes: r.niceClasses || [],
    attorneys: undefined,
    correspondent: undefined,
    design_codes: undefined,
    similarity_score: r.similarityScore || 0,
    similarity_type: r.matchType || 'exact',
    source: 'trademarknow' as const,
  }));
}

/**
 * Normalize Corsearch API results to common format
 */
function normalizeCorsearchResults(results: any[]): TrademarkSearchResult[] {
  return results.map(r => ({
    serial_number: r.applicationNo || r.serialNo || '',
    registration_number: r.registrationNo || undefined,
    mark_literal: r.mark || r.markText || '',
    mark_drawing_code: r.drawingCode || undefined,
    owner_name: r.owner || r.ownerName || '',
    owner_address: r.ownerAddress || undefined,
    status: r.markStatus || r.status || '',
    status_date: undefined,
    filing_date: r.applicationDate || '',
    registration_date: r.registrationDate || undefined,
    goods_services: r.specification || r.goodsServices || '',
    classes: r.classes || [],
    attorneys: undefined,
    correspondent: undefined,
    design_codes: undefined,
    similarity_score: r.score || 0,
    similarity_type: r.matchStrategy === 'FUZZY' ? 'phonetic' : 'exact',
    source: 'corsearch' as const,
  }));
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Build USPTO TESS search query string
 */
function buildUSPTOQuery(request: TrademarkSearchRequest): string {
  let query = request.term;

  if (request.search_type === 'phonetic') {
    // USPTO TESS phonetic search syntax
    query = `${request.term}*[BI,TI]`; // Basic Index and Translation Index
  } else if (request.search_type === 'design_code') {
    query = `${request.term}[DC]`; // Design Code
  }

  return query;
}

/**
 * Map internal search type to USPTO format
 */
function mapSearchType(type: TrademarkSearchRequest['search_type']): string {
  const mapping: Record<string, string> = {
    exact: 'EXACT',
    phonetic: 'PHONETIC',
    design_code: 'DESIGN',
    combined: 'COMBINED',
  };
  return mapping[type] || 'EXACT';
}

/**
 * Enhance results with calculated phonetic and visual similarity scores
 */
async function enhanceResultsWithPhoneticScores(
  searchTerm: string,
  results: TrademarkSearchResult[]
): Promise<TrademarkSearchResult[]> {
  return results.map(result => {
    const markText = result.mark_literal || '';

    // Calculate phonetic similarity
    const phoneticScore = phoneticSimilarity(searchTerm, markText);

    // Calculate visual similarity
    const visualScore = visualSimilarity(searchTerm, markText);

    // Use highest similarity score
    const maxScore = Math.max(
      result.similarity_score,
      phoneticScore,
      visualScore
    );

    // Determine primary similarity type
    let similarityType: 'exact' | 'phonetic' | 'visual' | 'conceptual' = 'exact';
    if (searchTerm.toLowerCase() === markText.toLowerCase()) {
      similarityType = 'exact';
    } else if (phoneticScore >= visualScore) {
      similarityType = 'phonetic';
    } else {
      similarityType = 'visual';
    }

    return {
      ...result,
      similarity_score: maxScore,
      similarity_type: similarityType,
    };
  }).sort((a, b) => b.similarity_score - a.similarity_score);
}

/**
 * Create search report and save to database
 */
async function createSearchReport(
  request: TrademarkSearchRequest,
  results: TrademarkSearchResult[],
  provider: SearchProvider | 'cache',
  fallbackUsed: boolean,
  userId?: string
): Promise<TrademarkSearchReport> {
  // Calculate overall risk score based on results
  const riskScore = calculateRiskScore(results);

  // Generate recommendations based on results
  const recommendations = generateRecommendations(request.term, results, riskScore);

  const report: TrademarkSearchReport = {
    id: crypto.randomUUID(),
    user_id: userId || '',
    trademark_application_id: undefined,
    search_term: request.term,
    search_type: request.search_type,
    jurisdiction_type: request.jurisdiction || 'federal',
    jurisdiction_state: request.state,
    results,
    result_count: results.length,
    ai_analysis: undefined, // Filled in by AI service
    risk_score: riskScore,
    recommendations,
    search_provider: provider === 'cache' ? 'uspto' : provider,
    fallback_used: fallbackUsed,
    created_at: new Date().toISOString(),
  };

  // Save to database if user is authenticated
  if (userId) {
    try {
      await supabaseAdmin.from('trademark_search_reports').insert({
        id: report.id,
        user_id: userId,
        search_term: report.search_term,
        search_type: report.search_type,
        jurisdiction_type: report.jurisdiction_type,
        jurisdiction_state: report.jurisdiction_state,
        results: report.results,
        result_count: report.result_count,
        risk_score: report.risk_score,
        recommendations: report.recommendations,
        search_provider: report.search_provider,
        fallback_used: report.fallback_used,
        created_at: report.created_at,
      });
    } catch (error) {
      logger.error('Failed to save search report:', error);
      // Don't fail the request if saving fails
    }
  }

  return report;
}

/**
 * Calculate overall risk score based on search results
 */
function calculateRiskScore(results: TrademarkSearchResult[]): number {
  if (results.length === 0) return 0;

  // Weight by similarity score and status
  let totalRisk = 0;
  let weights = 0;

  for (const result of results) {
    const status = result.status.toLowerCase();
    let statusWeight = 1;

    // Active/registered marks are higher risk
    if (status.includes('registered') || status.includes('live')) {
      statusWeight = 2;
    } else if (status.includes('pending') || status.includes('published')) {
      statusWeight = 1.5;
    } else if (status.includes('dead') || status.includes('cancelled') || status.includes('abandoned')) {
      statusWeight = 0.3;
    }

    totalRisk += result.similarity_score * statusWeight;
    weights += statusWeight;
  }

  // Normalize to 0-100 scale
  const avgRisk = weights > 0 ? totalRisk / weights : 0;

  // Apply result count factor (more results = higher risk)
  const countFactor = Math.min(1 + (results.length / 20), 2);

  return Math.min(100, Math.round(avgRisk * countFactor));
}

/**
 * Generate recommendations based on search results
 */
function generateRecommendations(
  searchTerm: string,
  results: TrademarkSearchResult[],
  riskScore: number
): string[] {
  const recommendations: string[] = [];

  if (results.length === 0) {
    recommendations.push('No conflicting marks found. This is a positive indicator for registration.');
    recommendations.push('Consider conducting a comprehensive search including design marks and phonetic variations.');
  } else if (riskScore < 30) {
    recommendations.push('Low conflict risk detected. Proceed with caution but the path appears clear.');
    recommendations.push('Review the identified marks to ensure they are in different industries/classes.');
  } else if (riskScore < 60) {
    recommendations.push('Moderate conflict risk detected. Careful review recommended.');
    recommendations.push('Consider consulting with a trademark attorney before proceeding.');
    recommendations.push('Evaluate whether your goods/services differ sufficiently from conflicting marks.');
  } else {
    recommendations.push('High conflict risk detected. Strong caution advised.');
    recommendations.push('Consider modifying your mark to create more distinction.');
    recommendations.push('Consulting with a trademark attorney is strongly recommended.');
    recommendations.push('Review the likelihood of confusion factors carefully.');
  }

  // Add specific recommendations based on result types
  const exactMatches = results.filter(r => r.similarity_score >= 90);
  if (exactMatches.length > 0) {
    recommendations.push(`Found ${exactMatches.length} very similar mark(s). These require careful analysis.`);
  }

  const activeMarks = results.filter(r =>
    r.status.toLowerCase().includes('registered') ||
    r.status.toLowerCase().includes('live')
  );
  if (activeMarks.length > 0) {
    recommendations.push(`${activeMarks.length} active/registered mark(s) found in results.`);
  }

  return recommendations;
}

// ==================== CACHING ====================

function generateCacheKey(request: TrademarkSearchRequest): string {
  return JSON.stringify({
    term: request.term.toLowerCase(),
    type: request.search_type,
    jurisdiction: request.jurisdiction,
    state: request.state,
    classes: request.class_filter?.sort(),
  });
}

function getCachedResult(key: string): TrademarkSearchResult[] | null {
  const cached = searchCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    searchCache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedResult(key: string, data: TrademarkSearchResult[]): void {
  searchCache.set(key, { data, timestamp: Date.now() });

  // Clean up old entries
  if (searchCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of searchCache) {
      if (now - v.timestamp > CACHE_TTL_MS) {
        searchCache.delete(k);
      }
    }
  }
}

// ==================== STATE TRADEMARK SEARCH ====================

/**
 * Search state trademark database
 */
export async function searchStateTrademarks(
  stateCode: string,
  term: string,
  userId?: string
): Promise<TrademarkSearchResult[]> {
  // State trademark databases vary significantly
  // This is a placeholder for state-specific integrations
  // Many states don't have public APIs and require manual searches

  logger.info(`State trademark search for ${stateCode}: ${term}`);

  // For now, return empty results with a note
  // Real implementation would integrate with each state's secretary of state database
  return [];
}

/**
 * Get search report by ID
 */
export async function getSearchReport(reportId: string): Promise<TrademarkSearchReport | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('trademark_search_reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as TrademarkSearchReport;
  } catch (error) {
    logger.error('Failed to get search report:', error);
    return null;
  }
}

/**
 * Get user's search history
 */
export async function getSearchHistory(
  userId: string,
  limit: number = 20
): Promise<TrademarkSearchReport[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('trademark_search_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return (data || []) as TrademarkSearchReport[];
  } catch (error) {
    logger.error('Failed to get search history:', error);
    return [];
  }
}

export default {
  searchTrademarks,
  searchStateTrademarks,
  getSearchReport,
  getSearchHistory,
  soundex,
  metaphone,
  phoneticSimilarity,
  visualSimilarity,
  levenshteinDistance,
};
