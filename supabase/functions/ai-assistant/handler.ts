/**
 * Core Request Processing Pipeline for Isha Life AI Assistant.
 *
 * Handles CORS, envelope validation, authentication, rate limiting,
 * schema validation, Gemini invocation, and database-verified response formatting.
 */

import type {
  AiAssistantRequest,
  AiChatRequest,
  AiSearchRequest,
  AiChatResponse,
  AiSearchResponse,
} from './types.ts';
import {
  getCorsHeaders,
  validateRequestEnvelope,
  authenticateSupabaseRequest,
  checkRateLimit,
  getClientIdentifier,
  checkPromptSafetyAndPermissions,
  MAX_PAYLOAD_BYTES,
} from './security.ts';
import {
  syncCatalogWithDatabase,
  searchProducts,
  getChatContextProducts,
  verifyAndSummarizeProductIds,
  type LiveDbInventoryRow,
} from './catalog.ts';
import {
  interpretNaturalLanguageSearch,
  generateGroundedChatResponse,
  GeminiError,
} from './gemini.ts';
import { buildChatSystemPrompt } from './knowledge.ts';

export interface HandlerOptions {
  geminiApiKey?: string;
  geminiModel?: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  mockDbRows?: LiveDbInventoryRow[];
  fetchFn?: typeof fetch;
  rateLimitMax?: number;
}

function getEnvVar(name: string): string | undefined {
  try {
    // @ts-ignore Deno global
    if (typeof Deno !== 'undefined' && Deno.env) {
      // @ts-ignore
      const v = Deno.env.get(name);
      if (v) return v;
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const v = process.env[name];
      if (v) return v;
    }
  } catch {
    // Ignore
  }

  return undefined;
}

/**
 * Main request handler function.
 */
export async function handleAiAssistantRequest(
  req: Request,
  options: HandlerOptions = {}
): Promise<Response> {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Validate Request Envelope (Method, Content-Type, Content-Length)
  const envelopeCheck = validateRequestEnvelope(req);
  if (!envelopeCheck.valid) {
    return new Response(
      JSON.stringify({
        error: envelopeCheck.error,
        code: envelopeCheck.code,
      }),
      {
        status: envelopeCheck.statusCode || 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Configuration values
  const supabaseUrl = options.supabaseUrl || getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || '';
  const supabaseAnonKey = options.supabaseAnonKey || getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || '';
  const geminiApiKey = options.geminiApiKey || getEnvVar('GEMINI_API_KEY') || '';
  const geminiModel = options.geminiModel || getEnvVar('GEMINI_MODEL');
  const fetchFn = options.fetchFn || fetch;

  // 3. Supabase Auth Verification
  const authResult = await authenticateSupabaseRequest(req, supabaseUrl, supabaseAnonKey, fetchFn);
  if (!authResult.authenticated) {
    return new Response(
      JSON.stringify({
        error: authResult.error || 'Unauthorized: Missing or invalid Supabase authentication credentials.',
        code: 'UNAUTHORIZED',
      }),
      {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // 4. Rate Limiting
  const clientId = getClientIdentifier(req, authResult.userId);
  const rateLimitResult = checkRateLimit(clientId, options.rateLimitMax);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests. Please wait a moment before trying again.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitResult.retryAfterSeconds,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfterSeconds),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // 5. Parse and Validate Request Body
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Failed to read request body.', code: 'READ_ERROR' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check actual payload byte length
  const payloadBytes = new TextEncoder().encode(rawBody).length;
  if (payloadBytes > MAX_PAYLOAD_BYTES) {
    return new Response(
      JSON.stringify({
        error: `Payload too large. Received ${payloadBytes} bytes, maximum allowed is ${MAX_PAYLOAD_BYTES} bytes.`,
        code: 'PAYLOAD_TOO_LARGE',
      }),
      { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Malformed JSON payload.', code: 'INVALID_JSON' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!body || typeof body !== 'object') {
    return new Response(
      JSON.stringify({ error: 'Request body must be a JSON object.', code: 'INVALID_PAYLOAD' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const mode = body.mode;
  if (mode !== 'chat' && mode !== 'search') {
    return new Response(
      JSON.stringify({
        error: "Invalid or missing mode. Supported modes are 'chat' and 'search'.",
        code: 'INVALID_MODE',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Check Gemini API Key presence before processing
  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({
        error: 'AI service configuration error: Missing API credentials. Please set GEMINI_API_KEY in Edge Function secrets.',
        code: 'CONFIG_MISSING',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 6. Synchronize catalogue with live database
  const catalog = await syncCatalogWithDatabase(supabaseUrl, supabaseAnonKey, options.mockDbRows);

  // 7. Route based on mode
  try {
    if (mode === 'chat') {
      const chatReq = body as unknown as AiChatRequest;

      if (typeof chatReq.message !== 'string' || !chatReq.message.trim()) {
        return new Response(
          JSON.stringify({ error: "Field 'message' is required and cannot be empty.", code: 'INVALID_INPUT' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (chatReq.message.length > 1000) {
        return new Response(
          JSON.stringify({ error: "Field 'message' exceeds maximum allowed length of 1000 characters.", code: 'INPUT_TOO_LONG' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check prompt safety & admin isolation
      const safetyCheck = checkPromptSafetyAndPermissions(chatReq.message);
      if (!safetyCheck.safe) {
        const safeRefusal: AiChatResponse = {
          mode: 'chat',
          answer: safetyCheck.reason || 'I can only assist with product recommendations and verified store policies.',
          referencedProductIds: [],
          referencedProducts: [],
        };
        return new Response(JSON.stringify(safeRefusal), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Context products
      const contextProducts = getChatContextProducts(catalog, chatReq.message, chatReq.productId);
      const systemPrompt = buildChatSystemPrompt();

      const { answer, rawReferencedIds } = await generateGroundedChatResponse({
        apiKey: geminiApiKey,
        model: geminiModel,
        systemPrompt,
        retrievedProducts: contextProducts,
        userMessage: chatReq.message,
        history: chatReq.history,
        fetchFn,
      });

      // Verify product IDs strictly against catalogue
      const { validIds, summaries } = verifyAndSummarizeProductIds(rawReferencedIds, catalog);

      const responsePayload: AiChatResponse = {
        mode: 'chat',
        answer,
        referencedProductIds: validIds,
        referencedProducts: summaries,
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      });
    }

    if (mode === 'search') {
      const searchReq = body as unknown as AiSearchRequest;

      if (typeof searchReq.query !== 'string' || !searchReq.query.trim()) {
        return new Response(
          JSON.stringify({ error: "Field 'query' is required and cannot be empty.", code: 'INVALID_INPUT' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (searchReq.query.length > 500) {
        return new Response(
          JSON.stringify({ error: "Field 'query' exceeds maximum allowed length of 500 characters.", code: 'INPUT_TOO_LONG' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 1. Natural language intent interpretation via Gemini
      const interpretation = await interpretNaturalLanguageSearch(
        searchReq.query,
        geminiApiKey,
        geminiModel,
        fetchFn
      );

      // 2. Query real database catalogue using validated interpretation
      const requestedLimit = typeof searchReq.limit === 'number' && !isNaN(searchReq.limit) ? searchReq.limit : 10;
      const { matchingProducts, totalMatches } = searchProducts(catalog, interpretation, requestedLimit);

      const responsePayload: AiSearchResponse = {
        mode: 'search',
        queryInterpretation: interpretation,
        products: matchingProducts,
        totalMatches,
        limit: Math.max(1, Math.min(24, requestedLimit)),
      };

      return new Response(JSON.stringify(responsePayload), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      });
    }
  } catch (err: unknown) {
    if (err instanceof GeminiError) {
      return new Response(
        JSON.stringify({
          error: err.safeUserMessage,
          code: err.code,
        }),
        {
          status: err.statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'An internal error occurred while processing your request.',
        code: 'INTERNAL_ERROR',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({ error: 'Unhandled request route.', code: 'UNHANDLED_ROUTE' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
