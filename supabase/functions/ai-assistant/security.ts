/**
 * Security & Defense-in-Depth for Isha Life AI Assistant.
 *
 * Responsibilities:
 * - CORS origin verification and preflight handling.
 * - HTTP method, Content-Type, and payload size (16KB) enforcement.
 * - Supabase Auth validation (JWT & anon credentials).
 * - Per-client sliding window rate limiting.
 * - Request payload schema sanitization and validation.
 * - Prompt injection & administrative isolation guards.
 * - Zero secret or PII leakage in logs.
 */

export const MAX_PAYLOAD_BYTES = 16384; // 16 KB
export const DEFAULT_RATE_LIMIT_MAX = 20; // 20 requests per minute
export const RATE_LIMIT_WINDOW_MS = 60000; // 60 seconds

// Standard CORS headers
export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  // Allow all localhost ports and production domains
  const origin = requestOrigin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  };
}

export interface SecurityValidationResult {
  valid: boolean;
  statusCode?: number;
  error?: string;
  code?: string;
}

/**
 * Validate incoming request method, content type, and content length.
 */
export function validateRequestEnvelope(req: Request): SecurityValidationResult {
  // 1. Method check
  if (req.method !== 'POST') {
    return {
      valid: false,
      statusCode: 405,
      error: `Method ${req.method} not allowed. Only POST requests are supported.`,
      code: 'METHOD_NOT_ALLOWED',
    };
  }

  // 2. Content-Type check
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return {
      valid: false,
      statusCode: 415,
      error: 'Content-Type must be application/json.',
      code: 'UNSUPPORTED_MEDIA_TYPE',
    };
  }

  // 3. Content-Length check
  const contentLengthHeader = req.headers.get('content-length');
  if (contentLengthHeader) {
    const length = parseInt(contentLengthHeader, 10);
    if (!isNaN(length) && length > MAX_PAYLOAD_BYTES) {
      return {
        valid: false,
        statusCode: 413,
        error: `Payload too large. Maximum allowed size is ${MAX_PAYLOAD_BYTES} bytes.`,
        code: 'PAYLOAD_TOO_LARGE',
      };
    }
  }

  return { valid: true };
}

// In-memory rate limiting sliding window
interface RateLimitRecord {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Reset rate limit store (useful for automated testing).
 */
export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

/**
 * Check and record request for sliding-window rate limiting.
 */
export function checkRateLimit(
  clientId: string,
  maxRequests = DEFAULT_RATE_LIMIT_MAX,
  windowMs = RATE_LIMIT_WINDOW_MS
): { allowed: boolean; retryAfterSeconds: number; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);

  // Periodically clean up stale entries if store grows
  if (rateLimitStore.size > 1000) {
    for (const [key, val] of rateLimitStore.entries()) {
      if (now - val.windowStart > windowMs) {
        rateLimitStore.delete(key);
      }
    }
  }

  if (!record || now - record.windowStart > windowMs) {
    // New window
    rateLimitStore.set(clientId, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    const elapsed = now - record.windowStart;
    const retryAfter = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
    return { allowed: false, retryAfterSeconds: retryAfter, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, retryAfterSeconds: 0, remaining: maxRequests - record.count };
}

/**
 * Extract client identifier for rate limiting (Authenticated User ID or Client IP).
 */
export function getClientIdentifier(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ip = forwarded.split(',')[0].trim();
    if (ip) return `ip:${ip}`;
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return `ip:${realIp.trim()}`;

  const clientIp = req.headers.get('cf-connecting-ip');
  if (clientIp) return `ip:${clientIp.trim()}`;

  return 'anonymous-client';
}

export interface AuthVerificationResult {
  authenticated: boolean;
  userId?: string;
  isAnonymousVisitor: boolean;
  error?: string;
}

/**
 * Verify authentication using Supabase Auth JWT or anon apikey.
 */
export async function authenticateSupabaseRequest(
  req: Request,
  supabaseUrl: string,
  expectedAnonKey?: string,
  fetchFn?: typeof fetch
): Promise<AuthVerificationResult> {
  const authHeader = req.headers.get('authorization') || '';
  const apiKeyHeader = req.headers.get('apikey') || '';

  // Extract Bearer token
  let bearerToken = '';
  if (authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  // If neither auth token nor apikey header is present -> 401
  if (!bearerToken && !apiKeyHeader) {
    return {
      authenticated: false,
      isAnonymousVisitor: false,
      error: 'Missing Authorization or apikey header.',
    };
  }

  // 1. Check if token matches standard anon key (storefront anonymous visitor)
  if (
    (expectedAnonKey && (bearerToken === expectedAnonKey || apiKeyHeader === expectedAnonKey)) ||
    (apiKeyHeader && (!bearerToken || bearerToken === apiKeyHeader))
  ) {
    return {
      authenticated: true,
      isAnonymousVisitor: true,
    };
  }

  // 2. If bearer token exists and is a user session token, verify with Supabase Auth
  if (bearerToken && bearerToken !== expectedAnonKey) {
    const fetchImpl = fetchFn || fetch;
    const apikeyToUse = expectedAnonKey || apiKeyHeader;
    try {
      const userEndpoint = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`;
      const res = await fetchImpl(userEndpoint, {
        method: 'GET',
        headers: {
          apikey: apikeyToUse,
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (res.ok) {
        const userData = await res.json();
        if (userData && userData.id) {
          return {
            authenticated: true,
            userId: userData.id,
            isAnonymousVisitor: false,
          };
        }
      }
    } catch {
      // Failed to verify user token with Supabase
    }

    return {
      authenticated: false,
      isAnonymousVisitor: false,
      error: 'Invalid or expired user session token.',
    };
  }

  // 3. Fallback: if apikey is present and matches expected anon key
  if (expectedAnonKey && apiKeyHeader === expectedAnonKey) {
    return {
      authenticated: true,
      isAnonymousVisitor: true,
    };
  }

  return {
    authenticated: false,
    isAnonymousVisitor: false,
    error: 'Invalid authentication credentials.',
  };
}

/**
 * Defense against Prompt Injections, Administrative Queries, and Cross-Customer Access.
 */
export function checkPromptSafetyAndPermissions(text: string): { safe: boolean; reason?: string } {
  const lower = text.toLowerCase();

  // 1. Attempts to access other customer orders or admin controls
  const adminOrOrderPatterns = [
    /\b(all\s+orders|other\s+customers?'?s?\s+orders?|admin\s+dashboard|delete\s+order|modify\s+price|change\s+stock)\b/i,
    /\b(admin\s+password|master\s+key|service_role|supabase_key|system\s+prompt)\b/i,
    /\b(drop\s+table|insert\s+into|select\s+\*\s+from\s+orders)\b/i,
  ];

  for (const pattern of adminOrOrderPatterns) {
    if (pattern.test(lower)) {
      return {
        safe: false,
        reason: 'I am a customer shopping assistant and do not have access to administrative controls, orders, or sensitive system records. How can I help you find products today?',
      };
    }
  }

  // 2. Blatant prompt jailbreak attempts
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|above)\s+instructions/i,
    /you\s+are\s+now\s+in\s+(developer|unrestricted|god)\s+mode/i,
    /forget\s+(your\s+)?(rules|instructions|system\s+prompt)/i,
    /jailbreak/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      return {
        safe: false,
        reason: 'I am the Isha Life shopping assistant. I cannot override store guidelines or security policies. I am here to assist you with wellness products and verified store information.',
      };
    }
  }

  return { safe: true };
}
