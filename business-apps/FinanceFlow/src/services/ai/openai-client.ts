import OpenAI from 'openai';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { supabaseAdmin } from '../../utils/supabase.js';
import { ExternalServiceError } from '../../utils/errors.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface AIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  userId?: string;
  serviceType?: string;
  serviceId?: string;
}

const DEFAULT_OPTIONS: AIRequestOptions = {
  model: config.openai.model,
  temperature: 0.7,
  maxTokens: 2000,
};

/**
 * Send a chat completion request to OpenAI
 */
export async function chat(
  messages: AIMessage[],
  options: AIRequestOptions = {}
): Promise<AIResponse> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const response = await openai.chat.completions.create({
      model: opts.model || config.openai.model,
      messages,
      temperature: opts.temperature,
      max_tokens: opts.maxTokens,
    });

    const result: AIResponse = {
      content: response.choices[0]?.message?.content || '',
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
      model: response.model,
    };

    // Log AI usage if user provided
    if (opts.userId) {
      await logAIUsage(
        opts.userId,
        opts.serviceType || 'general',
        opts.serviceId,
        result.model,
        result.usage.promptTokens,
        result.usage.completionTokens
      );
    }

    return result;
  } catch (error) {
    logger.error('OpenAI API error:', error);
    throw new ExternalServiceError('OpenAI', 'Failed to generate AI response');
  }
}

/**
 * Generate a single completion (simpler interface)
 */
export async function generate(
  prompt: string,
  systemPrompt?: string,
  options: AIRequestOptions = {}
): Promise<string> {
  const messages: AIMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await chat(messages, options);
  return response.content;
}

/**
 * Generate structured JSON response
 */
export async function generateJSON<T>(
  prompt: string,
  systemPrompt: string,
  options: AIRequestOptions = {}
): Promise<T> {
  const enhancedSystemPrompt = `${systemPrompt}

IMPORTANT: You must respond with valid JSON only. No additional text or markdown formatting.`;

  const response = await generate(prompt, enhancedSystemPrompt, options);

  try {
    // Try to extract JSON from response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }

    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    logger.error('Failed to parse AI JSON response:', response);
    throw new ExternalServiceError('OpenAI', 'Failed to parse AI response as JSON');
  }
}

/**
 * Log AI usage for tracking and billing
 */
async function logAIUsage(
  userId: string,
  serviceType: string,
  serviceId: string | undefined,
  model: string,
  promptTokens: number,
  completionTokens: number
): Promise<void> {
  try {
    // Calculate cost (approximate based on GPT-4 pricing)
    const promptCostPer1k = model.includes('gpt-4') ? 0.03 : 0.001;
    const completionCostPer1k = model.includes('gpt-4') ? 0.06 : 0.002;
    
    const totalCost =
      (promptTokens / 1000) * promptCostPer1k +
      (completionTokens / 1000) * completionCostPer1k;

    await supabaseAdmin.from('ai_usage_logs').insert({
      user_id: userId,
      service_type: serviceType,
      service_id: serviceId,
      ai_model: model,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_cost: totalCost,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    logger.error('Failed to log AI usage:', error);
  }
}

/**
 * Check if AI features are available
 */
export function isAIAvailable(): boolean {
  return !!config.openai.apiKey;
}

export default {
  chat,
  generate,
  generateJSON,
  isAIAvailable,
};

