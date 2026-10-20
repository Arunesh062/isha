/**
 * Frontend AI Service for Sattva Life.
 *
 * Interacts with the Supabase Edge Function 'ai-assistant'.
 * Rules:
 * - Never calls Gemini directly from React.
 * - Never exposes GEMINI_API_KEY in frontend code.
 * - Uses existing Supabase client and shared TypeScript types.
 * - Handles network errors, timeouts, rate limits, and provider failures safely.
 */

import { supabase } from '../../lib/supabase.ts';
import type {
  AiChatRequest,
  AiChatResponse,
  AiSearchRequest,
  AiSearchResponse,
  AiErrorResponse,
  ChatHistoryMessage,
} from '../../types/ai.ts';


export class AiServiceError extends Error {
  public code: string;
  public status?: number;
  public retryAfter?: number;

  constructor(message: string, code = 'AI_SERVICE_ERROR', status?: number, retryAfter?: number) {
    super(message);
    this.name = 'AiServiceError';
    this.code = code;
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

/**
 * Normalizes and extracts user-friendly error details from Supabase Edge Function invocation failures.
 */
function extractFunctionError(error: unknown, data?: unknown): AiServiceError {
  // If data already contains a formatted backend error response
  if (data && typeof data === 'object') {
    const errData = data as Partial<AiErrorResponse> & { retryAfter?: number };
    if (typeof errData.error === 'string' && errData.error) {
      const code = errData.code || 'AI_ERROR';
      return new AiServiceError(errData.error, code, undefined, errData.retryAfter);
    }
  }

  if (error instanceof Error) {
    const errMsg = error.message.toLowerCase();
    const status = (error as { status?: number }).status || (error as { context?: { status?: number } }).context?.status;

    // Rate limiting
    if (status === 429 || errMsg.includes('429') || errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
      return new AiServiceError(
        'The AI assistant is momentarily busy with high request volume. Please wait a few moments and try again.',
        'RATE_LIMIT_EXCEEDED',
        429,
        60
      );
    }

    // Authentication failure
    if (status === 401 || errMsg.includes('401') || errMsg.includes('unauthorized')) {
      return new AiServiceError(
        'Authentication required. Please refresh the page or check your connection.',
        'UNAUTHORIZED',
        401
      );
    }

    // Payload size
    if (status === 413 || errMsg.includes('413') || errMsg.includes('too large')) {
      return new AiServiceError(
        'Your message is too long. Please shorten your message and try again.',
        'PAYLOAD_TOO_LARGE',
        413
      );
    }


    // Upstream provider / timeout / offline
    if (errMsg.includes('504') || errMsg.includes('timeout') || errMsg.includes('timed out')) {
      return new AiServiceError(
        'The AI assistant took too long to respond. Please try asking again.',
        'PROVIDER_TIMEOUT',
        504
      );
    }

    if (errMsg.includes('failed to fetch') || errMsg.includes('network') || errMsg.includes('connection')) {
      return new AiServiceError(
        'Unable to connect to the AI assistant. Please check your internet connection.',
        'NETWORK_ERROR'
      );
    }

    if (errMsg.includes('500') || errMsg.includes('503') || errMsg.includes('service unavailable')) {
      return new AiServiceError(
        'The AI assistant service is temporarily unavailable. Please try again shortly.',
        'PROVIDER_ERROR',
        503
      );
    }

    return new AiServiceError(error.message, 'FUNCTION_INVOKE_ERROR');
  }

  return new AiServiceError(
    'An unexpected error occurred while communicating with the AI assistant.',
    'UNKNOWN_ERROR'
  );
}

/**
 * Send a chat message to the AI Shopping Assistant.
 */
export async function sendChatMessage(params: {
  message: string;
  history?: ChatHistoryMessage[];
  productId?: string;
}): Promise<AiChatResponse> {
  const trimmed = params.message?.trim();
  if (!trimmed) {
    throw new AiServiceError('Message cannot be empty.', 'INVALID_INPUT', 400);
  }

  const payload: AiChatRequest = {
    mode: 'chat',
    message: trimmed.slice(0, 1000),
    history: (params.history || []).slice(-10),
    productId: params.productId,
  };

  try {
    const { data, error } = await supabase.functions.invoke<AiChatResponse | AiErrorResponse>(
      'ai-assistant',
      {
        body: payload,
      }
    );

    if (error) {
      throw extractFunctionError(error, data);
    }

    if (!data || typeof data !== 'object') {
      throw new AiServiceError('Received invalid empty response from assistant.', 'INVALID_RESPONSE');
    }

    // Check for application error in response payload
    if ('error' in data && typeof data.error === 'string') {
      throw extractFunctionError(new Error(data.error), data);
    }

    const chatResponse = data as AiChatResponse;
    if (chatResponse.mode !== 'chat' || typeof chatResponse.answer !== 'string') {
      throw new AiServiceError('Response format is missing required chat fields.', 'INVALID_RESPONSE');
    }

    return {
      mode: 'chat',
      answer: chatResponse.answer,
      referencedProductIds: Array.isArray(chatResponse.referencedProductIds) ? chatResponse.referencedProductIds : [],
      referencedProducts: Array.isArray(chatResponse.referencedProducts) ? chatResponse.referencedProducts : [],
      suggestedQuestions: Array.isArray(chatResponse.suggestedQuestions) ? chatResponse.suggestedQuestions : undefined,
    };
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      throw err;
    }
    throw extractFunctionError(err);
  }
}

/**
 * Execute a natural language search query through the AI Assistant.
 */
export async function executeAiSearch(params: {
  query: string;
  limit?: number;
}): Promise<AiSearchResponse> {
  const trimmed = params.query?.trim();
  if (!trimmed) {
    throw new AiServiceError('Search query cannot be empty.', 'INVALID_INPUT', 400);
  }

  const payload: AiSearchRequest = {
    mode: 'search',
    query: trimmed.slice(0, 500),
    limit: params.limit ? Math.max(1, Math.min(24, params.limit)) : 10,
  };

  try {
    const { data, error } = await supabase.functions.invoke<AiSearchResponse | AiErrorResponse>(
      'ai-assistant',
      {
        body: payload,
      }
    );

    if (error) {
      throw extractFunctionError(error, data);
    }

    if (!data || typeof data !== 'object') {
      throw new AiServiceError('Received invalid empty response from search service.', 'INVALID_RESPONSE');
    }

    if ('error' in data && typeof data.error === 'string') {
      throw extractFunctionError(new Error(data.error), data);
    }

    const searchResponse = data as AiSearchResponse;
    if (searchResponse.mode !== 'search' || !Array.isArray(searchResponse.products)) {
      throw new AiServiceError('Response format is missing required search fields.', 'INVALID_RESPONSE');
    }

    return {
      mode: 'search',
      queryInterpretation: searchResponse.queryInterpretation || {
        searchTerms: [],
        category: null,
        minPrice: null,
        maxPrice: null,
        characteristics: [],
      },
      products: searchResponse.products,
      totalMatches: typeof searchResponse.totalMatches === 'number' ? searchResponse.totalMatches : searchResponse.products.length,
      limit: searchResponse.limit || payload.limit || 10,
    };
  } catch (err: unknown) {
    if (err instanceof AiServiceError) {
      throw err;
    }
    throw extractFunctionError(err);
  }
}
