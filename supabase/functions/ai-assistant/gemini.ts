/**
 * Google Gemini API Client & Intent Interpretation.
 *
 * Rules:
 * - Uses current official Google Gemini REST API v1beta.
 * - Authenticates securely via server-side x-goog-api-key header.
 * - Model is configurable via GEMINI_MODEL (defaults to gemini-2.5-flash).
 * - Enforces timeout and safe provider failure handling.
 * - Zero API key exposure to client, logs, or error responses.
 */

import type { ChatHistoryMessage, SearchQueryInterpretation } from './types.ts';
import type { AuthoritativeProduct } from './catalog.ts';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export class GeminiError extends Error {
  public statusCode: number;
  public safeUserMessage: string;
  public code: string;

  constructor(message: string, statusCode = 500, code = 'GEMINI_ERROR', safeUserMessage?: string) {
    super(message);
    this.name = 'GeminiError';
    this.statusCode = statusCode;
    this.code = code;
    this.safeUserMessage = safeUserMessage || 'The AI assistant service is temporarily unavailable. Please try again later.';
  }
}

export function getGeminiModel(): string {
  // Check Deno.env or process.env
  try {
    // @ts-ignore Deno global
    if (typeof Deno !== 'undefined' && Deno.env) {
      // @ts-ignore
      const m = Deno.env.get('GEMINI_MODEL');
      if (m && m.trim()) return m.trim();
    }
  } catch {
    // Ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env) {
      const m = process.env.GEMINI_MODEL;
      if (m && m.trim()) return m.trim();
    }
  } catch {
    // Ignore
  }

  return DEFAULT_GEMINI_MODEL;
}

export interface GeminiApiCallParams {
  apiKey: string;
  model?: string;
  systemInstruction?: string;
  contents: Array<{
    role: 'user' | 'model';
    parts: Array<{ text: string }>;
  }>;
  jsonMode?: boolean;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Low-level caller for Gemini generateContent REST endpoint.
 */
export async function callGeminiApi(params: GeminiApiCallParams): Promise<string> {
  const { apiKey, systemInstruction, contents, jsonMode = false, timeoutMs = 15000 } = params;

  if (!apiKey || !apiKey.trim()) {
    throw new GeminiError(
      'Missing GEMINI_API_KEY configuration',
      500,
      'CONFIG_MISSING',
      'AI service configuration error: Missing API credentials. Please set GEMINI_API_KEY in Edge Function secrets.'
    );
  }

  const model = params.model || getGeminiModel();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const requestBody: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 1024,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const fetchImpl = params.fetchFn || fetch;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isAbort = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
    if (isAbort) {
      throw new GeminiError(
        'Gemini API request timed out after ' + timeoutMs + 'ms',
        504,
        'PROVIDER_TIMEOUT',
        'The AI assistant took too long to respond. Please try again.'
      );
    }
    throw new GeminiError(
      'Network error reaching Gemini API: ' + (err instanceof Error ? err.message : String(err)),
      503,
      'PROVIDER_NETWORK_ERROR',
      'The AI assistant is momentarily unreachable. Please try again later.'
    );
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson?.error?.message || response.statusText;
    } catch {
      errorDetail = response.statusText;
    }

    if (response.status === 429) {
      throw new GeminiError(
        `Gemini API rate limit exceeded (429): ${errorDetail}`,
        429,
        'PROVIDER_RATE_LIMITED',
        'The AI assistant is momentarily busy. Please try again in a few moments.'
      );
    }

    if (response.status === 400 || response.status === 403 || response.status === 401) {
      throw new GeminiError(
        `Gemini API authentication or configuration error (${response.status}): ${errorDetail}`,
        500,
        'PROVIDER_AUTH_ERROR',
        'AI service configuration error. Please verify Edge Function secrets.'
      );
    }

    throw new GeminiError(
      `Gemini API provider error (${response.status}): ${errorDetail}`,
      503,
      'PROVIDER_ERROR',
      'The AI assistant service is temporarily unavailable. Please try again later.'
    );
  }

  const data = await response.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof candidateText !== 'string') {
    throw new GeminiError(
      'Gemini API returned an empty or invalid response payload',
      502,
      'EMPTY_RESPONSE',
      'The AI assistant could not generate a response. Please try rephrasing your request.'
    );
  }

  return candidateText.trim();
}

/**
 * Interpret a natural language product search query into a validated structured schema.
 */
export async function interpretNaturalLanguageSearch(
  query: string,
  apiKey: string,
  model?: string,
  fetchFn?: typeof fetch
): Promise<SearchQueryInterpretation> {
  const systemInstruction = `You are an expert e-commerce search query interpreter for Sattva Life, an Ayurvedic and yogic wellness store.
Analyze the customer's search query and extract structured search parameters into JSON.

Allowed categories (strictly one of these strings, or null if query spans multiple categories or is general):
- "food-wellness" (teas, honey, supplements, herbs, triphala, ashwagandha)
- "yoga" (yoga mats, cushions, mat bags, yoga straps)
- "body-care" (face wash, lotion, sandalwood, hair oil, bhringraj, solid perfume)
- "copperware" (copper bottles, glasses, tumblers, bowls, vessels)
- "sacred" (rudraksha mala, incense, dhoop, aarti stand, candles)
- "books" (books, yogic wisdom, music CDs, audio chants, digital downloads)

Output JSON schema strictly matching:
{
  "searchTerms": string[],        // core product keywords (e.g. ["copper", "bottle"], ["face", "wash"])
  "category": string | null,      // exact category ID from the list above, or null
  "minPrice": number | null,      // minimum price in INR if mentioned, else null
  "maxPrice": number | null,      // maximum price in INR if mentioned (e.g. "under 500" -> 500), else null
  "characteristics": string[]     // specific attributes mentioned like "organic", "stress", "immunity", "plastic-free"
}

OUTPUT RAW JSON ONLY. No markdown, no explanation, no backticks.`;

  const userPrompt = `Interpret this customer product search query:
"${query.replace(/"/g, "'")}"`;

  const rawJson = await callGeminiApi({
    apiKey,
    model,
    systemInstruction,
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    jsonMode: true,
    fetchFn,
  });

  return parseAndValidateSearchInterpretation(rawJson, query);
}

const VALID_CATEGORIES = new Set([
  'food-wellness',
  'yoga',
  'body-care',
  'copperware',
  'sacred',
  'books',
]);

/**
 * Strict validation of interpreted search structure.
 */
export function parseAndValidateSearchInterpretation(
  rawJson: string,
  originalQuery: string
): SearchQueryInterpretation {
  let parsed: Record<string, unknown> = {};

  try {
    // Strip markdown fences if present
    const cleaned = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback: simple keyword extraction if JSON parsing fails
    return fallbackSearchInterpretation(originalQuery);
  }

  const searchTerms: string[] = [];
  if (Array.isArray(parsed.searchTerms)) {
    for (const item of parsed.searchTerms) {
      if (typeof item === 'string' && item.trim().length > 0) {
        searchTerms.push(item.trim().slice(0, 50));
      }
    }
  }

  let category: string | null = null;
  if (typeof parsed.category === 'string') {
    const catClean = parsed.category.trim().toLowerCase();
    if (VALID_CATEGORIES.has(catClean)) {
      category = catClean;
    }
  }

  let minPrice: number | null = null;
  if (typeof parsed.minPrice === 'number' && !isNaN(parsed.minPrice) && parsed.minPrice >= 0) {
    minPrice = Math.round(parsed.minPrice);
  }

  let maxPrice: number | null = null;
  if (typeof parsed.maxPrice === 'number' && !isNaN(parsed.maxPrice) && parsed.maxPrice >= 0) {
    maxPrice = Math.round(parsed.maxPrice);
  }

  // If minPrice > maxPrice, normalize by swapping
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    const temp = minPrice;
    minPrice = maxPrice;
    maxPrice = temp;
  }

  const characteristics: string[] = [];
  if (Array.isArray(parsed.characteristics)) {
    for (const item of parsed.characteristics) {
      if (typeof item === 'string' && item.trim().length > 0) {
        characteristics.push(item.trim().slice(0, 50));
      }
    }
  }

  // If both searchTerms and characteristics are empty, extract tokens from query
  if (searchTerms.length === 0 && characteristics.length === 0) {
    return fallbackSearchInterpretation(originalQuery, category, minPrice, maxPrice);
  }

  return {
    searchTerms,
    category,
    minPrice,
    maxPrice,
    characteristics,
  };
}

/**
 * Fallback keyword parser when Gemini returns non-standard JSON.
 */
export function fallbackSearchInterpretation(
  query: string,
  category: string | null = null,
  minPrice: number | null = null,
  maxPrice: number | null = null
): SearchQueryInterpretation {
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !['want', 'need', 'show', 'under', 'price', 'below', 'above', 'some', 'with'].includes(w));

  return {
    searchTerms: terms.slice(0, 5),
    category,
    minPrice,
    maxPrice,
    characteristics: [],
  };
}

/**
 * Generate assistant chat response grounded in retrieved products and policies.
 */
export async function generateGroundedChatResponse(params: {
  apiKey: string;
  model?: string;
  systemPrompt: string;
  retrievedProducts: AuthoritativeProduct[];
  userMessage: string;
  history?: ChatHistoryMessage[];
  fetchFn?: typeof fetch;
}): Promise<{ answer: string; rawReferencedIds: string[] }> {
  const { apiKey, model, systemPrompt, retrievedProducts, userMessage, history = [], fetchFn } = params;

  // Format product context
  const productContextText = retrievedProducts
    .map(
      (p) =>
        `[PRODUCT ${p.id}]
Name: ${p.name}
Category: ${p.category} (${p.subcategory})
Price: ₹${p.price} (MRP: ₹${p.mrp})
Inventory Status: ${p.inStock ? `In Stock (${p.stock} available)` : 'Out of Stock (0 available)'}
Rating: ${p.rating} / 5 (${p.reviewCount} customer reviews)
Description: ${p.description}
Key Features: ${p.features.join(', ')}`
    )
    .join('\n\n');

  // Grounding context instruction
  const contextBlock = `
=== AUTHORITATIVE STORE CATALOGUE CONTEXT ===
${productContextText || 'No specific products pre-selected for this query.'}
============================================`;

  const augmentedSystemInstruction = `${systemPrompt}\n\n${contextBlock}`;

  // Assemble contents bounded to last 6 history items
  const boundedHistory = (history || []).slice(-6);

  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const h of boundedHistory) {
    if (h && typeof h.content === 'string' && h.content.trim()) {
      contents.push({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.content.slice(0, 1000) }],
      });
    }
  }

  // Quarantined user message (anti-prompt-injection)
  const safeUserQuery = `<customer_query>\n${userMessage.replace(/<\/?customer_query>/g, '')}\n</customer_query>`;

  contents.push({
    role: 'user',
    parts: [{ text: safeUserQuery }],
  });

  const rawAnswer = await callGeminiApi({
    apiKey,
    model,
    systemInstruction: augmentedSystemInstruction,
    contents,
    fetchFn,
  });

  // Extract referenced product IDs: matches [id: xx-xxx] or [PRODUCT xx-xxx] or standalone xx-xxx IDs
  const idRegex = /\[id:\s*([a-z]{2}-\d{3})\]|\b([a-z]{2}-\d{3})\b/gi;
  const rawReferencedIds: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = idRegex.exec(rawAnswer)) !== null) {
    const foundId = (match[1] || match[2]).toLowerCase();
    if (!rawReferencedIds.includes(foundId)) {
      rawReferencedIds.push(foundId);
    }
  }

  // Clean answer text by removing [id: xx-xxx] tags from the visible customer response if preferred, or leave cleanly
  const cleanAnswer = rawAnswer.replace(/\[id:\s*([a-z]{2}-\d{3})\]/gi, '').replace(/\s{2,}/g, ' ').trim();

  return {
    answer: cleanAnswer || rawAnswer,
    rawReferencedIds,
  };
}
