/**
 * Trademark AI Service
 *
 * AI-powered features for trademark registration:
 * - Mark strength analysis (generic → fanciful spectrum)
 * - Goods/services description generation
 * - Conflict risk assessment
 * - Specimen acceptability analysis
 * - Office action response assistance
 */

import { chat, generate, generateJSON } from '../ai/openai-client.js';
import { logger } from '../../utils/logger.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import type {
  TrademarkSearchResult,
  MarkStrengthAnalysis,
  GoodsDescriptionSuggestion,
  SearchAIAnalysis,
  ConflictAnalysis,
  SpecimenAnalysis,
  TrademarkAISuggestions,
  GoodsServicesEntry,
  NiceClass,
} from '../../types/trademark.js';
import niceClasses from '../../data/nice-classes.json' assert { type: 'json' };

// ==================== MARK STRENGTH ANALYSIS ====================

/**
 * Analyze the strength of a trademark on the distinctiveness spectrum
 * Generic → Descriptive → Suggestive → Arbitrary → Fanciful
 */
export async function analyzeMarkStrength(
  markText: string,
  goodsServices?: string,
  userId?: string
): Promise<MarkStrengthAnalysis> {
  const systemPrompt = `You are an expert trademark attorney analyzing trademark distinctiveness.

Classify trademarks on the distinctiveness spectrum:
1. GENERIC (0-20): Common name for the product/service itself. Cannot be registered.
   Example: "COMPUTER" for computers, "PIZZA" for pizza

2. DESCRIPTIVE (21-40): Directly describes a feature, quality, or characteristic.
   Example: "COLD AND CREAMY" for ice cream, "SPEEDY" for delivery service
   May be registered with proof of secondary meaning (acquired distinctiveness).

3. SUGGESTIVE (41-60): Suggests qualities but requires imagination to connect.
   Example: "COPPERTONE" for sunscreen, "NETFLIX" for streaming
   Registrable without proving secondary meaning.

4. ARBITRARY (61-80): Common words used in unrelated context.
   Example: "APPLE" for computers, "AMAZON" for online retail
   Strong protection.

5. FANCIFUL (81-100): Invented words with no prior meaning.
   Example: "XEROX", "KODAK", "EXXON"
   Strongest protection.

Respond with JSON only.`;

  const userPrompt = `Analyze this trademark:
Mark: "${markText}"
${goodsServices ? `Goods/Services: ${goodsServices}` : ''}

Provide:
1. Category (generic, descriptive, suggestive, arbitrary, fanciful)
2. Score (0-100)
3. Detailed analysis explaining the classification
4. Specific recommendations for strengthening if needed
5. Warning if similar marks might exist`;

  try {
    const result = await generateJSON<{
      category: 'generic' | 'descriptive' | 'suggestive' | 'arbitrary' | 'fanciful';
      score: number;
      analysis: string;
      recommendations: string[];
      similar_marks_warning?: string;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'mark_strength',
      temperature: 0.3,
    });

    return {
      category: result.category,
      score: Math.min(100, Math.max(0, result.score)),
      analysis: result.analysis,
      recommendations: result.recommendations || [],
      similar_marks_warning: result.similar_marks_warning,
    };
  } catch (error) {
    logger.error('Failed to analyze mark strength:', error);
    // Return a safe default
    return {
      category: 'descriptive',
      score: 30,
      analysis: 'Unable to analyze mark strength at this time. Please consult with a trademark attorney.',
      recommendations: ['Consider consulting with a trademark attorney for detailed analysis.'],
    };
  }
}

// ==================== GOODS/SERVICES DESCRIPTION ====================

/**
 * Generate USPTO-acceptable goods/services descriptions
 */
export async function generateGoodsDescription(
  userInput: string,
  niceClassNumber: number,
  userId?: string
): Promise<GoodsDescriptionSuggestion> {
  // Get the Nice class details
  const niceClass = (niceClasses as NiceClass[]).find(c => c.classNumber === niceClassNumber);
  const classInfo = niceClass
    ? `Class ${niceClassNumber}: ${niceClass.title} - ${niceClass.description}`
    : `Class ${niceClassNumber}`;

  const systemPrompt = `You are an expert in USPTO trademark identification.

Your task is to convert user descriptions of goods/services into USPTO ID Manual-acceptable language.

Guidelines:
1. Use clear, precise language accepted by USPTO
2. Start with the general category, then specifics
3. Use "namely" to introduce specific examples
4. Avoid vague terms like "various", "miscellaneous", "etc."
5. Match the terminology used in USPTO ID Manual
6. Ensure the description fits within the specified Nice class

Format descriptions as:
"[Category], namely, [specific items]; [additional categories]"

Example good descriptions:
- Class 9: "Computer software for managing business operations, namely, accounting, inventory management, and customer relationship management"
- Class 25: "Clothing, namely, shirts, pants, and jackets; headwear, namely, hats and caps"
- Class 42: "Software as a service (SAAS) featuring software for project management and team collaboration"

Respond with JSON only.`;

  const userPrompt = `Convert this description for ${classInfo}:

User's description: "${userInput}"

Provide:
1. A primary USPTO-acceptable description
2. 2-3 alternative phrasings
3. Any warnings about the description (too broad, potentially descriptive, etc.)
4. Link to USPTO ID Manual if applicable`;

  try {
    const result = await generateJSON<{
      description: string;
      alternative_descriptions: string[];
      warnings: string[];
      id_manual_url?: string;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'goods_description',
      temperature: 0.4,
    });

    return {
      class_number: niceClassNumber,
      user_input: userInput,
      suggested_description: result.description,
      alternative_descriptions: result.alternative_descriptions || [],
      warnings: result.warnings || [],
      id_manual_url: result.id_manual_url || `https://idm-tmng.uspto.gov/id-master-list-public.html`,
    };
  } catch (error) {
    logger.error('Failed to generate goods description:', error);
    return {
      class_number: niceClassNumber,
      user_input: userInput,
      suggested_description: userInput, // Return original if AI fails
      alternative_descriptions: [],
      warnings: ['AI description generation unavailable. Please verify your description against the USPTO ID Manual.'],
    };
  }
}

/**
 * Suggest Nice classification classes for a description
 */
export async function suggestNiceClasses(
  description: string,
  userId?: string
): Promise<{ suggested_classes: number[]; explanations: Record<number, string> }> {
  const classListSummary = (niceClasses as NiceClass[]).map(c =>
    `Class ${c.classNumber} (${c.category}): ${c.title}`
  ).join('\n');

  const systemPrompt = `You are an expert in Nice Classification for trademarks.

The Nice Classification system has 45 classes:
- Classes 1-34: Goods
- Classes 35-45: Services

${classListSummary}

Analyze the user's description and suggest the most appropriate class(es).
Many products/services may fall under multiple classes.

Respond with JSON only.`;

  const userPrompt = `What Nice class(es) would these goods/services fall under?

"${description}"

Respond with:
1. An array of suggested class numbers (most relevant first)
2. Brief explanation for each suggested class`;

  try {
    const result = await generateJSON<{
      suggested_classes: number[];
      explanations: Record<string, string>;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'nice_classification',
      temperature: 0.3,
    });

    // Convert string keys to numbers
    const explanations: Record<number, string> = {};
    for (const [key, value] of Object.entries(result.explanations)) {
      explanations[parseInt(key)] = value;
    }

    return {
      suggested_classes: result.suggested_classes.filter(c => c >= 1 && c <= 45),
      explanations,
    };
  } catch (error) {
    logger.error('Failed to suggest Nice classes:', error);
    return {
      suggested_classes: [],
      explanations: {},
    };
  }
}

// ==================== CONFLICT ANALYSIS ====================

/**
 * AI analysis of search results for conflict risk
 */
export async function analyzeConflictRisk(
  proposedMark: string,
  goodsServices: string,
  searchResults: TrademarkSearchResult[],
  userId?: string
): Promise<SearchAIAnalysis> {
  if (searchResults.length === 0) {
    return {
      overall_risk: 'low',
      risk_score: 10,
      proceed_recommendation: 'proceed',
      conflicts: [],
      summary: 'No conflicting marks found in the search results.',
      detailed_analysis: 'The trademark search did not reveal any potentially conflicting marks. This is a positive indicator, but we recommend conducting additional searches including design codes and phonetic variations to ensure comprehensive clearance.',
    };
  }

  // Prepare search results summary for AI analysis
  const topResults = searchResults.slice(0, 20); // Limit for context length
  const resultsSummary = topResults.map(r => ({
    mark: r.mark_literal,
    serialNumber: r.serial_number,
    owner: r.owner_name,
    status: r.status,
    classes: r.classes,
    goodsServices: r.goods_services?.substring(0, 200),
    similarityScore: r.similarity_score,
    similarityType: r.similarity_type,
  }));

  const systemPrompt = `You are an expert trademark attorney analyzing potential trademark conflicts.

Evaluate the likelihood of confusion using the DuPont factors:
1. Similarity of the marks (sight, sound, meaning)
2. Similarity of the goods/services
3. Trade channels
4. Conditions of purchase
5. Fame of the prior mark
6. Number and nature of similar marks
7. Actual confusion
8. Length of time of concurrent use

Provide risk assessment:
- LOW (0-30): Few conflicts, proceed with confidence
- MEDIUM (31-60): Some concerns, proceed with caution
- HIGH (61-100): Significant conflicts, reconsider or modify

Respond with JSON only.`;

  const userPrompt = `Analyze potential conflicts for this trademark application:

Proposed Mark: "${proposedMark}"
Goods/Services: "${goodsServices}"

Search Results (top matches):
${JSON.stringify(resultsSummary, null, 2)}

Provide:
1. overall_risk: "low", "medium", or "high"
2. risk_score: 0-100
3. proceed_recommendation: "proceed", "caution", or "avoid"
4. conflicts: Array of detailed conflict analyses for top 5 concerning marks
5. summary: 2-3 sentence summary
6. detailed_analysis: Comprehensive analysis`;

  try {
    const result = await generateJSON<{
      overall_risk: 'low' | 'medium' | 'high';
      risk_score: number;
      proceed_recommendation: 'proceed' | 'caution' | 'avoid';
      conflicts: Array<{
        conflicting_mark: string;
        serial_number: string;
        owner: string;
        similarity_type: string;
        similarity_score: number;
        risk_level: 'low' | 'medium' | 'high';
        analysis: string;
        mitigation_suggestions: string[];
      }>;
      summary: string;
      detailed_analysis: string;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'conflict_analysis',
      temperature: 0.3,
      maxTokens: 3000,
    });

    return {
      overall_risk: result.overall_risk,
      risk_score: Math.min(100, Math.max(0, result.risk_score)),
      proceed_recommendation: result.proceed_recommendation,
      conflicts: result.conflicts || [],
      summary: result.summary,
      detailed_analysis: result.detailed_analysis,
    };
  } catch (error) {
    logger.error('Failed to analyze conflict risk:', error);
    return {
      overall_risk: 'medium',
      risk_score: 50,
      proceed_recommendation: 'caution',
      conflicts: [],
      summary: 'AI analysis unavailable. Manual review recommended.',
      detailed_analysis: 'Unable to perform AI conflict analysis at this time. Please review the search results manually or consult with a trademark attorney.',
    };
  }
}

// ==================== SPECIMEN ANALYSIS ====================

/**
 * Analyze a specimen for USPTO acceptability
 */
export async function analyzeSpecimen(
  specimenUrl: string,
  specimenDescription: string,
  markType: string,
  markText: string,
  goodsServices: GoodsServicesEntry[],
  userId?: string
): Promise<SpecimenAnalysis> {
  const classInfo = goodsServices.map(gs =>
    `Class ${gs.classNumber}: ${gs.description}`
  ).join('\n');

  const isGoods = goodsServices.some(gs => gs.classNumber <= 34);
  const isServices = goodsServices.some(gs => gs.classNumber >= 35);

  const systemPrompt = `You are an expert USPTO trademark examining attorney analyzing specimens.

Specimen Requirements:
FOR GOODS (Classes 1-34):
- Must show the mark as used ON or IN CONNECTION WITH the goods
- Acceptable: Labels, tags, packaging, product displays, product itself
- NOT acceptable: Advertising, invoices (alone), internal documents

FOR SERVICES (Classes 35-45):
- Must show the mark as used IN THE SALE OR ADVERTISING of services
- Acceptable: Website screenshots showing services, brochures, signage
- Must show a direct association between the mark and the services

Common Specimen Rejections:
1. Mark not shown in connection with goods/services
2. Specimen is mere advertising (for goods)
3. Mark is not legible or clearly visible
4. Specimen is digitally altered or mockup
5. Mark shown differs from mark in application
6. Goods/services not clearly identifiable

Respond with JSON only.`;

  const userPrompt = `Analyze this specimen submission:

Mark: "${markText}"
Mark Type: ${markType}
Goods/Services:
${classInfo}

Specimen Description: "${specimenDescription}"
Specimen URL: ${specimenUrl}

${isGoods ? 'This is a GOODS application - specimen must show mark on/in connection with goods.' : ''}
${isServices ? 'This is a SERVICES application - specimen must show mark in advertising/sale of services.' : ''}

Based on the description, analyze:
1. Is this specimen likely acceptable?
2. What issues might the USPTO raise?
3. What improvements could be made?
4. What type of specimen is this?`;

  try {
    const result = await generateJSON<{
      acceptable: boolean;
      issues: string[];
      suggestions: string[];
      confidence_score: number;
      specimen_type_detected: string;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'specimen_analysis',
      temperature: 0.3,
    });

    return {
      acceptable: result.acceptable,
      issues: result.issues || [],
      suggestions: result.suggestions || [],
      confidence_score: Math.min(100, Math.max(0, result.confidence_score || 50)),
      specimen_type_detected: result.specimen_type_detected || 'unknown',
    };
  } catch (error) {
    logger.error('Failed to analyze specimen:', error);
    return {
      acceptable: false,
      issues: ['Unable to analyze specimen automatically.'],
      suggestions: ['Please ensure specimen clearly shows the mark in connection with the goods/services.'],
      confidence_score: 0,
      specimen_type_detected: 'unknown',
    };
  }
}

// ==================== OFFICE ACTION ASSISTANCE ====================

/**
 * Generate response suggestions for Office Actions
 */
export async function generateOfficeActionResponse(
  officeActionText: string,
  applicationDetails: {
    markText: string;
    markType: string;
    goodsServices: GoodsServicesEntry[];
    filingBasis: string;
  },
  userId?: string
): Promise<{
  summary: string;
  issues_identified: string[];
  response_suggestions: Array<{
    issue: string;
    suggested_response: string;
    evidence_needed?: string[];
  }>;
  deadline_warning: string;
}> {
  const systemPrompt = `You are an expert USPTO trademark attorney helping applicants respond to Office Actions.

Common Office Action issues:
1. Section 2(d) - Likelihood of Confusion
2. Section 2(e)(1) - Merely Descriptive
3. Section 2(e)(2) - Geographically Descriptive
4. Specimen Issues
5. Identification of Goods/Services Issues
6. Drawing Issues
7. Disclaimer Requirements

For each issue, provide:
- Clear explanation of the issue
- Suggested response strategy
- Evidence or arguments that may help

Remember: Responses must be filed within 6 months of the Office Action date.

Respond with JSON only.`;

  const goodsServicesText = applicationDetails.goodsServices
    .map(gs => `Class ${gs.classNumber}: ${gs.description}`)
    .join('\n');

  const userPrompt = `Help respond to this Office Action:

Application Details:
- Mark: "${applicationDetails.markText}"
- Mark Type: ${applicationDetails.markType}
- Filing Basis: ${applicationDetails.filingBasis}
- Goods/Services:
${goodsServicesText}

Office Action Text:
${officeActionText.substring(0, 4000)}

Analyze the Office Action and provide:
1. Summary of the issues raised
2. Detailed response suggestions for each issue
3. Evidence that might be needed
4. Deadline warning`;

  try {
    const result = await generateJSON<{
      summary: string;
      issues_identified: string[];
      response_suggestions: Array<{
        issue: string;
        suggested_response: string;
        evidence_needed?: string[];
      }>;
      deadline_warning: string;
    }>(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'office_action',
      temperature: 0.4,
      maxTokens: 4000,
    });

    return result;
  } catch (error) {
    logger.error('Failed to generate office action response:', error);
    return {
      summary: 'Unable to analyze Office Action automatically.',
      issues_identified: [],
      response_suggestions: [],
      deadline_warning: 'IMPORTANT: You must respond to the Office Action within 6 months of the issue date to avoid abandonment.',
    };
  }
}

// ==================== COMPREHENSIVE AI SUGGESTIONS ====================

/**
 * Generate comprehensive AI suggestions for a trademark application
 */
export async function generateApplicationSuggestions(
  markText: string,
  markType: string,
  goodsServices: GoodsServicesEntry[],
  filingBasis: string,
  userId?: string
): Promise<TrademarkAISuggestions> {
  // Generate mark strength analysis
  const goodsServicesText = goodsServices.map(gs => gs.description).join('; ');
  const markStrength = await analyzeMarkStrength(markText, goodsServicesText, userId);

  // Generate goods description suggestions for each class
  const goodsDescriptions: GoodsDescriptionSuggestion[] = [];
  for (const gs of goodsServices) {
    if (gs.userDescription) {
      const suggestion = await generateGoodsDescription(
        gs.userDescription,
        gs.classNumber,
        userId
      );
      goodsDescriptions.push(suggestion);
    }
  }

  // Generate filing recommendations
  const recommendations = generateFilingRecommendations(
    markStrength,
    markType,
    filingBasis,
    goodsServices
  );

  // Identify potential issues
  const potentialIssues = identifyPotentialIssues(
    markStrength,
    markType,
    goodsServices
  );

  // Generate specimen guidance
  const specimenGuidance = generateSpecimenGuidance(goodsServices);

  return {
    mark_strength: markStrength,
    goods_descriptions: goodsDescriptions,
    specimen_guidance: specimenGuidance,
    filing_recommendations: recommendations,
    potential_issues: potentialIssues,
    generated_at: new Date().toISOString(),
  };
}

/**
 * Generate filing recommendations based on application details
 */
function generateFilingRecommendations(
  markStrength: MarkStrengthAnalysis,
  markType: string,
  filingBasis: string,
  goodsServices: GoodsServicesEntry[]
): string[] {
  const recommendations: string[] = [];

  // Mark strength recommendations
  if (markStrength.score < 40) {
    recommendations.push('Consider strengthening the mark to improve registration chances. Descriptive marks often face more scrutiny.');
  } else if (markStrength.score >= 80) {
    recommendations.push('Your mark appears strong on the distinctiveness spectrum, which is favorable for registration.');
  }

  // Filing basis recommendations
  if (filingBasis === 'intent_to_use') {
    recommendations.push('As an Intent-to-Use application, you will need to file a Statement of Use after the Notice of Allowance.');
    recommendations.push('You can request up to five 6-month extensions if you need more time to begin use.');
  } else if (filingBasis === 'use') {
    recommendations.push('Ensure your specimens clearly show the mark as currently used in commerce.');
  }

  // Multi-class recommendations
  if (goodsServices.length > 1) {
    recommendations.push(`Your application covers ${goodsServices.length} classes. Filing fees will apply per class.`);
    recommendations.push('Consider whether all classes are necessary to reduce costs.');
  }

  // TEAS Plus vs Standard
  const hasComplexDescriptions = goodsServices.some(gs =>
    gs.description && gs.description.length > 150
  );
  if (hasComplexDescriptions) {
    recommendations.push('Consider TEAS Standard if your goods/services descriptions are not found in the USPTO ID Manual.');
  } else {
    recommendations.push('TEAS Plus offers a lower filing fee if your goods/services use ID Manual language.');
  }

  return recommendations;
}

/**
 * Identify potential issues with the application
 */
function identifyPotentialIssues(
  markStrength: MarkStrengthAnalysis,
  markType: string,
  goodsServices: GoodsServicesEntry[]
): string[] {
  const issues: string[] = [];

  // Mark strength issues
  if (markStrength.category === 'generic') {
    issues.push('CRITICAL: Generic marks cannot be registered. Consider modifying your mark.');
  } else if (markStrength.category === 'descriptive') {
    issues.push('Descriptive marks require proof of acquired distinctiveness (secondary meaning) unless registered on Supplemental Register.');
  }

  // Design mark issues
  if (markType === 'design' || markType === 'combined') {
    issues.push('Design marks require a clear description of the mark elements.');
    issues.push('Color claims must be specific if colors are essential to the mark.');
  }

  // Sound/motion mark issues
  if (markType === 'sound' || markType === 'motion') {
    issues.push('Non-traditional marks require detailed descriptions and appropriate specimens.');
  }

  // Multi-class issues
  if (goodsServices.length > 3) {
    issues.push('Applications with many classes face higher examination scrutiny. Ensure each class is properly supported.');
  }

  // Date consistency issues
  const hasUseDates = goodsServices.some(gs => gs.firstUseDate || gs.firstCommerceDate);
  if (hasUseDates) {
    issues.push('Verify that first use dates are accurate and can be supported with evidence if challenged.');
  }

  return issues;
}

/**
 * Generate specimen guidance based on goods/services
 */
function generateSpecimenGuidance(goodsServices: GoodsServicesEntry[]): string[] {
  const guidance: string[] = [];

  const hasGoods = goodsServices.some(gs => gs.classNumber <= 34);
  const hasServices = goodsServices.some(gs => gs.classNumber >= 35);

  if (hasGoods) {
    guidance.push('FOR GOODS: Submit specimens showing the mark on labels, tags, packaging, or the goods themselves.');
    guidance.push('Point-of-sale displays are acceptable if they show the mark with the goods.');
    guidance.push('Invoices or advertising alone are NOT acceptable for goods.');
  }

  if (hasServices) {
    guidance.push('FOR SERVICES: Submit specimens showing the mark in advertising or promotional materials.');
    guidance.push('Website screenshots showing the mark with service descriptions are commonly accepted.');
    guidance.push('Brochures, signage, or business cards can work if they show the mark with services.');
  }

  guidance.push('Ensure the mark shown matches the mark in your application exactly.');
  guidance.push('Specimens should be clear, legible, and in JPEG or PDF format.');
  guidance.push('Each class requires its own specimen showing use for that class.');

  return guidance;
}

// ==================== INTERVIEW CLARIFICATION ====================

/**
 * Provide AI clarification for interview questions
 */
export async function clarifyInterviewQuestion(
  questionId: string,
  questionText: string,
  userQuestion: string,
  applicationContext: Record<string, any>,
  userId?: string
): Promise<string> {
  const systemPrompt = `You are a helpful trademark registration assistant.

Answer user questions clearly and concisely about the trademark application process.
Use plain language but be accurate about legal requirements.
If the question is beyond your expertise, recommend consulting a trademark attorney.

Keep responses under 300 words.`;

  const contextSummary = Object.entries(applicationContext)
    .filter(([_, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n');

  const userPrompt = `The user is filling out a trademark application and has a question.

Current Question: "${questionText}"
User's Question: "${userQuestion}"

Application Context:
${contextSummary}

Please provide a clear, helpful answer.`;

  try {
    const response = await generate(userPrompt, systemPrompt, {
      userId,
      serviceType: 'trademark',
      serviceId: 'interview_clarification',
      temperature: 0.5,
      maxTokens: 500,
    });

    return response;
  } catch (error) {
    logger.error('Failed to generate clarification:', error);
    return 'I apologize, but I am unable to provide clarification at this time. Please consult the USPTO website or a trademark attorney for assistance.';
  }
}

export default {
  analyzeMarkStrength,
  generateGoodsDescription,
  suggestNiceClasses,
  analyzeConflictRisk,
  analyzeSpecimen,
  generateOfficeActionResponse,
  generateApplicationSuggestions,
  clarifyInterviewQuestion,
};
