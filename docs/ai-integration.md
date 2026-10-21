# Isha Life — Gemini AI Integration Specification (Phase 2, Unofficial Demonstration)

## 1. Overview & Objectives

Phase 2 introduces a server-side AI backend proxy deployed as a Supabase Edge Function (`ai-assistant`). It acts as a secure intermediary between customer clients and the Google Gemini API, providing:

1. **AI Shopping Assistant (Mode: `chat`)**: Grounded conversational wellness consultations, ingredient queries, and verified product recommendations with real-time database price and stock validation.
2. **Natural Language Search Interpretation (Mode: `search`)**: Structured intent parsing from customer queries (e.g. *"copper water bottle under 800"* or *"organic tea for immunity"*) mapped directly to live database catalogue queries.

> **Important**: No Gemini SDK or API keys are installed in the React frontend. All AI interactions occur strictly server-side within the Supabase Edge Function environment.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Customer Browser                     │
│  (React Storefront / Auth Session / Supabase Client)   │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS POST / JSON
                           │ Authorization: Bearer <user_jwt | anon_key>
                           │ apikey: <supabase_anon_key>
                           ▼
┌────────────────────────────────────────────────────────┐
│           Supabase Edge Function: ai-assistant         │
│         (Deno / supabase/functions/ai-assistant)       │
├────────────────────────────────────────────────────────┤
│ 1. Envelope & CORS Check: POST only, 16KB max payload  │
│ 2. Supabase Auth Gate: JWT or anon key validation      │
│ 3. Sliding Window Rate Limiter: 20 req/min per client  │
│ 4. Prompt Safety & Admin Isolation Guards             │
│ 5. Authoritative Store Grounding & Live Price Sync     │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               │ Server Secret            │ Read-only SELECT
               │ (x-goog-api-key)         │ (product_id, stock, unit_price)
               ▼                          ▼
┌─────────────────────────────┐   ┌──────────────────────────────┐
│      Google Gemini API      │   │    Supabase PostgreSQL DB    │
│  (gemini-2.5-flash REST)    │   │  (public.catalog_products)   │
└─────────────────────────────┘   └──────────────────────────────┘
```

### Component Breakdown
- **`supabase/functions/ai-assistant/index.ts`**: Entrypoint for Deno/Supabase Edge Functions.
- **`supabase/functions/ai-assistant/handler.ts`**: HTTP pipeline: CORS, header validation, auth verification, rate limiting, payload parsing, routing, error mapping.
- **`supabase/functions/ai-assistant/security.ts`**: Request envelope validation, Supabase Auth token verification, sliding-window rate limiter, prompt injection defense, and admin data isolation.
- **`supabase/functions/ai-assistant/catalog.ts`**: 24 canonical products, live inventory and price synchronization from PostgreSQL `catalog_products`, search scoring & ranking, product ID validation.
- **`supabase/functions/ai-assistant/knowledge.ts`**: Owner-approved policies (free shipping threshold >= ₹999, ₹99 flat fee below ₹999, COD threshold >= ₹3,000, support line `8010 479480`), category wellness guidelines, strict grounding instructions.
- **`supabase/functions/ai-assistant/gemini.ts`**: Google Gemini REST client, model selection, intent interpretation, grounded response generation, error transformation.
- **`supabase/functions/ai-assistant/types.ts`**: Request and response TypeScript contracts.
- **`frontend/src/types/ai.ts`**: Shared TypeScript contracts for future frontend integration.

---

## 3. Required Environment Secrets

Edge function secrets must be stored in Supabase Secrets / Environment variables. **Never commit real secrets to Git or frontend files.**

| Secret Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `GEMINI_API_KEY` | **Yes** | `AIzaSy...[PLACEHOLDER]` | Google Gemini API server key. |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model identifier (e.g. `gemini-2.5-flash`, `gemini-1.5-flash`). |
| `SUPABASE_URL` | **Yes** | `https://your-project-id.supabase.co` | Supabase project URL for PostgREST & Auth. |
| `SUPABASE_ANON_KEY` | **Yes** | `eyJhbGciOiJIUz...[PLACEHOLDER]` | Supabase anon key used to authenticate requests. |
| `RATE_LIMIT_MAX_REQUESTS` | No | `20` | Max requests per 60-second window per client. |

---

## 4. Local Development Instructions

### Prerequisites
- Node.js v20+ (Node v22 recommended)
- Supabase CLI (accessible via `npx supabase`)

### 1. Configure Local Secrets
Create a `.env.local` file inside `supabase/functions/ai-assistant/`:
```bash
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-2.5-flash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
```

### 2. Run Edge Functions Locally
Using Supabase CLI:
```bash
npx supabase functions serve ai-assistant --env-file supabase/functions/ai-assistant/.env.local --no-verify-jwt
```
> Note: `--no-verify-jwt` delegates auth verification to the function's internal security layer, allowing both signed-in customer JWTs and storefront anonymous guest tokens to be validated seamlessly.

### 3. Run Automated Tests
```bash
npm test
```
This runs the deterministic test suite (`tests/unit/ai-assistant.test.mjs`) using Node's native test runner with zero external network dependencies.

---

## 5. Deployment Instructions

### 1. Set Edge Function Secrets
Set your production Gemini API key and model using the Supabase CLI:
```bash
npx supabase secrets set GEMINI_API_KEY="AIzaSy...your-gemini-key"
npx supabase secrets set GEMINI_MODEL="gemini-2.5-flash"
```

Verify secrets are configured:
```bash
npx supabase secrets list
```

### 2. Deploy the Edge Function
Deploy `ai-assistant` to your Supabase project:
```bash
npx supabase functions deploy ai-assistant --no-verify-jwt
```

---

## 6. API Endpoint Contracts

**Endpoint**: `POST /functions/v1/ai-assistant`  
**Headers**:
- `Content-Type: application/json`
- `apikey: <SUPABASE_ANON_KEY>`
- `Authorization: Bearer <USER_JWT or SUPABASE_ANON_KEY>`

---

### Mode A: `chat`

#### Request Payload
```json
{
  "mode": "chat",
  "message": "Which tea do you recommend for boosting immunity?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "model", "content": "Namaste! Welcome to Isha Life. How may I assist you today?" }
  ],
  "productId": "fw-001"
}
```

#### Successful Response (`200 OK`)
```json
{
  "mode": "chat",
  "answer": "For daily immunity and respiratory support, I highly recommend our Tulsi Ginger Herbal Tea. It combines pure holy basil (Tulsi) leaves with warming organic ginger root.",
  "referencedProductIds": ["fw-001"],
  "referencedProducts": [
    {
      "id": "fw-001",
      "name": "Tulsi Ginger Herbal Tea",
      "price": 250,
      "mrp": 320,
      "image": "https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "inStock": true,
      "rating": 4.7,
      "category": "food-wellness"
    }
  ]
}
```

---

### Mode B: `search`

#### Request Payload
```json
{
  "mode": "search",
  "query": "copper water bottle under 800",
  "limit": 5
}
```

#### Successful Response (`200 OK`)
```json
{
  "mode": "search",
  "queryInterpretation": {
    "searchTerms": ["copper", "bottle"],
    "category": "copperware",
    "minPrice": null,
    "maxPrice": 800,
    "characteristics": ["hydration", "seamless"]
  },
  "products": [
    {
      "id": "cw-002",
      "name": "Copper Water Bottle — 900ml",
      "category": "copperware",
      "subcategory": "bottles",
      "price": 650,
      "mrp": 850,
      "rating": 4.8,
      "reviewCount": 178,
      "image": "https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "inStock": true,
      "stock": 18,
      "features": [
        "Seamless construction",
        "Leak-proof cap",
        "900ml capacity",
        "Lightweight design"
      ]
    },
    {
      "id": "cw-001",
      "name": "Copper Drinking Glass — 200ml",
      "category": "copperware",
      "subcategory": "bottles",
      "price": 280,
      "mrp": 350,
      "rating": 4.7,
      "reviewCount": 203,
      "image": "https://images.pexels.com/photos/20750158/pexels-photo-20750158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      "inStock": true,
      "stock": 35,
      "badge": "Bestseller",
      "features": [
        "100% pure copper",
        "Handcrafted",
        "200ml capacity",
        "Ayurvedic tradition"
      ]
    }
  ],
  "totalMatches": 2,
  "limit": 5
}
```

---

### Error Responses

| Status | Code | Meaning / User-Facing Message |
| :---: | :--- | :--- |
| **400** | `INVALID_JSON` | Malformed JSON in request body. |
| **400** | `INVALID_MODE` | Mode must be `'chat'` or `'search'`. |
| **400** | `INVALID_INPUT` | Missing or invalid required fields (`message` or `query`). |
| **401** | `UNAUTHORIZED` | Missing or invalid Supabase authentication credentials. |
| **405** | `METHOD_NOT_ALLOWED` | HTTP method not allowed. Only POST and OPTIONS are accepted. |
| **413** | `PAYLOAD_TOO_LARGE` | Payload exceeds 16KB limit. |
| **415** | `UNSUPPORTED_MEDIA_TYPE` | Content-Type must be `application/json`. |
| **429** | `RATE_LIMIT_EXCEEDED` | Client exceeded 20 requests per minute. Includes `Retry-After: 60`. |
| **500** | `CONFIG_MISSING` | `GEMINI_API_KEY` secret is not configured in Supabase. |
| **503** | `PROVIDER_ERROR` | Upstream Gemini API temporary error. Returns safe user apology. |
| **504** | `PROVIDER_TIMEOUT` | Gemini API request exceeded 15s timeout. |

---

## 7. Security Architecture & Safeguards

1. **Authentication Gate**:
   - Supabase Auth is validated on every request.
   - Accepts both logged-in customer user JWTs (verified via `/auth/v1/user`) and storefront anonymous guest tokens (matching `SUPABASE_ANON_KEY`).
   - Unauthenticated requests are rejected with `401 Unauthorized`.
2. **Payload Protection**:
   - Hard maximum payload size of 16,384 bytes (16KB) prevents resource exhaustion / denial-of-service.
   - HTTP method enforced to POST only.
3. **Sliding Window Rate Limiter**:
   - Limits each client identifier (authenticated user ID, or client IP from headers) to 20 requests per 60-second window.
   - Automatically returns HTTP 429 with `Retry-After` header when exceeded.
4. **Prompt Injection & Administrative Isolation**:
   - Incoming queries are pre-scanned for prompt jailbreaks, persona manipulation, and SQL/admin probe patterns.
   - Customer messages and product descriptions are quarantined within `<customer_query>` tags and marked strictly as untrusted data.
   - Explicit system instructions forbid following instructions inside user queries that attempt to alter prices, modify stock, change discounts, or access customer data.
   - Inquiries asking to inspect other customer orders or access database records are refused safely without invoking the LLM.
5. **Authoritative Grounding & Anti-Hallucination**:
   - Gemini is **never** permitted to generate product availability or prices.
   - In search mode, Gemini only interprets user intent; the server executes the query against real database records.
   - In chat mode, all referenced product IDs are validated against the database before returning; any hallucinated ID is strictly filtered out.
6. **Policy Containment**:
   - Only owner-approved policies (`VERIFIED_FAQS`, `VERIFIED_SHIPPING_POLICY`) are included in system prompts.
   - Draft policies (return windows, courier dispatch SLAs, SMS tracking links) are strictly blocked. Gemini is instructed to reply that information could not be verified and directs customers to support at `8010 479480`.
7. **Zero Leakage**:
   - API keys and tokens are never included in prompts, logs, or client-facing errors.

---

## 8. Testing Instructions

The automated test suite runs 15 deterministic checks using Node's native test runner (`node:test`):

```bash
npm test
```

### Test Coverage Matrix
| # | Test Case | Expected Outcome |
| :---: | :--- | :--- |
| 1 | Missing Gemini secret | HTTP 500 (`CONFIG_MISSING`) |
| 2 | Unauthenticated request | HTTP 401 (`UNAUTHORIZED`) |
| 3 | Malformed JSON & invalid mode | HTTP 400 (`INVALID_JSON` / `INVALID_MODE`) |
| 4 | Oversized request (>16KB) | HTTP 413 (`PAYLOAD_TOO_LARGE`) |
| 5 | Gemini API 503 & timeout | HTTP 503 / 504 with safe user messages |
| 6 | Search with price & category bounds | Accurate filtering against DB catalogue |
| 7 | Empty search results | HTTP 200 with `products: []`, `totalMatches: 0` |
| 8 | Out-of-stock product handling | `inStock: false`, `stock: 0` accurately rendered |
| 9 | Questions about unapproved policies | States information is unverified, cites support |
| 10 | Prompt injection attempt | Safely intercepted and refused |
| 11 | Order/admin data access attempt | Safely intercepted and refused |
| 12 | Hallucinated product IDs | Filtered out; only real DB IDs returned |
| 13 | Rate limiting | HTTP 429 (`RATE_LIMIT_EXCEEDED`) with `Retry-After` |
| 14 | CORS preflight | HTTP 204 with standard CORS headers |
| 15 | Grounded chat recommendation | Grounded answer with live price & verified summary |

---

## 9. Known Limitations & Next Phase Roadmap

1. **Database Schema State**:
   - Remote Supabase database currently has `catalog_products` with base columns (`product_id`, `stock`, `unit_price`, `updated_at`).
   - The Edge Function operates using a **resilient dual-layer architecture**: authoritative product definitions are synchronized in real-time with live database prices and stock levels.
   - When migration `20261017110000_add_product_metadata.sql` is applied in the Supabase Dashboard, the Edge Function is ready to seamlessly utilize full database columns without requiring code modifications.
2. **Phase 3 Scope (Upcoming)**:
   - Floating chat widget in React storefront (`frontend/src/features/ai-assistant/`).
   - Integrated natural language search input in `Header.tsx` and `ProductsPage.tsx`.
   - Direct interactive "Add to Cart" cards inside chat responses.
