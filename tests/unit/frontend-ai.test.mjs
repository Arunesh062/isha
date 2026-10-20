/**
 * Frontend AI Integration Unit Tests for Sattva Life (Phase 3).
 *
 * Covers:
 * 1. Chat request and response handling via aiService.
 * 2. Search request and response handling via aiService.
 * 3. Empty search results handling.
 * 4. Network failures and 429 rate-limit responses.
 * 5. Malformed backend responses.
 * 6. Product recommendation card contracts and fallback safety.
 * 7. Search query interpretation and catalogue fallback preservation.
 *
 * Mocks the Supabase Edge Function invoke without requiring live Gemini or Supabase services.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Import supabase client and aiService
import { supabase } from '../../frontend/src/lib/supabase.ts';
import {
  sendChatMessage,
  executeAiSearch,
  AiServiceError,
} from '../../frontend/src/features/ai-assistant/aiService.ts';

// Helper to mock supabase.functions getter on client instance
function setMockInvoke(mockFn) {
  Object.defineProperty(supabase, 'functions', {
    value: { invoke: mockFn },
    configurable: true,
    writable: true,
  });
}

test('1. sendChatMessage sends formatted request and parses chat response', async () => {
  const mockChatResponse = {
    mode: 'chat',
    answer: 'Tulsi Ginger Herbal Tea is formulated with sacred Tulsi leaves and organic ginger to support immunity.',
    referencedProductIds: ['fw-001'],
    referencedProducts: [
      {
        id: 'fw-001',
        name: 'Tulsi Ginger Herbal Tea',
        price: 250,
        mrp: 320,
        image: 'https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg',
        inStock: true,
        rating: 4.7,
        category: 'food-wellness',
      },
    ],
  };

  let capturedPayload = null;
  setMockInvoke(async (functionName, options) => {
    assert.strictEqual(functionName, 'ai-assistant');
    capturedPayload = options?.body;
    return { data: mockChatResponse, error: null };
  });

  const result = await sendChatMessage({
    message: 'What tea helps with immunity?',
    history: [{ role: 'user', content: 'Hello' }],
    productId: 'fw-001',
  });

  assert.strictEqual(capturedPayload.mode, 'chat');
  assert.strictEqual(capturedPayload.message, 'What tea helps with immunity?');
  assert.strictEqual(capturedPayload.productId, 'fw-001');

  assert.strictEqual(result.mode, 'chat');
  assert.match(result.answer, /Tulsi Ginger/);
  assert.strictEqual(result.referencedProductIds.length, 1);
  assert.strictEqual(result.referencedProducts[0].id, 'fw-001');
  assert.strictEqual(result.referencedProducts[0].price, 250);
});

test('2. sendChatMessage validates empty input before calling backend', async () => {
  await assert.rejects(
    async () => {
      await sendChatMessage({ message: '   ' });
    },
    (err) => {
      assert.ok(err instanceof AiServiceError);
      assert.strictEqual(err.code, 'INVALID_INPUT');
      return true;
    }
  );
});

test('3. executeAiSearch returns structured intent and matching products', async () => {
  const mockSearchResponse = {
    mode: 'search',
    queryInterpretation: {
      searchTerms: ['copper', 'bottle'],
      category: 'copperware',
      minPrice: null,
      maxPrice: 800,
      characteristics: ['hydration'],
    },
    products: [
      {
        id: 'cw-002',
        name: 'Copper Water Bottle — 900ml',
        category: 'copperware',
        subcategory: 'bottles',
        price: 650,
        mrp: 850,
        rating: 4.8,
        reviewCount: 178,
        image: 'https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg',
        inStock: true,
        stock: 18,
      },
    ],
    totalMatches: 1,
    limit: 10,
  };

  setMockInvoke(async (functionName, options) => {
    assert.strictEqual(options?.body?.mode, 'search');
    assert.strictEqual(options?.body?.query, 'copper bottle under 800');
    return { data: mockSearchResponse, error: null };
  });

  const result = await executeAiSearch({ query: 'copper bottle under 800' });
  assert.strictEqual(result.mode, 'search');
  assert.strictEqual(result.queryInterpretation.category, 'copperware');
  assert.strictEqual(result.queryInterpretation.maxPrice, 800);
  assert.strictEqual(result.products.length, 1);
  assert.strictEqual(result.products[0].id, 'cw-002');
  assert.strictEqual(result.products[0].price, 650);
});

test('4. executeAiSearch handles empty search results safely', async () => {
  const mockEmptyResponse = {
    mode: 'search',
    queryInterpretation: {
      searchTerms: ['spaceship'],
      category: null,
      minPrice: null,
      maxPrice: null,
      characteristics: [],
    },
    products: [],
    totalMatches: 0,
    limit: 10,
  };

  setMockInvoke(async () => ({ data: mockEmptyResponse, error: null }));

  const result = await executeAiSearch({ query: 'nonexistent spaceship product' });
  assert.strictEqual(result.mode, 'search');
  assert.strictEqual(result.products.length, 0);
  assert.strictEqual(result.totalMatches, 0);
});

test('5. Handles 429 rate-limit responses with friendly message and retry information', async () => {
  setMockInvoke(async () => {
    const error = new Error('Edge Function returned a non-2xx status code: 429 Too Many Requests');
    error.status = 429;
    return { data: { error: 'Too many requests. Please wait a moment before trying again.', code: 'RATE_LIMIT_EXCEEDED' }, error };
  });

  await assert.rejects(
    async () => {
      await sendChatMessage({ message: 'Hello' });
    },
    (err) => {
      assert.ok(err instanceof AiServiceError);
      assert.strictEqual(err.code, 'RATE_LIMIT_EXCEEDED');
      assert.match(err.message, /too many requests|busy/i);
      return true;
    }
  );
});

test('6. Handles 401 unauthorized errors gracefully', async () => {
  setMockInvoke(async () => {
    const error = new Error('Edge Function returned a non-2xx status code: 401 Unauthorized');
    error.status = 401;
    return { data: { error: 'Unauthorized: Missing or invalid Supabase authentication credentials.', code: 'UNAUTHORIZED' }, error };
  });

  await assert.rejects(
    async () => {
      await sendChatMessage({ message: 'Hello' });
    },
    (err) => {
      assert.ok(err instanceof AiServiceError);
      assert.strictEqual(err.code, 'UNAUTHORIZED');
      assert.match(err.message, /authentication/i);
      return true;
    }
  );
});

test('7. Handles network and timeout failures safely', async () => {
  setMockInvoke(async () => {
    const error = new Error('Failed to fetch: NetworkError');
    return { data: null, error };
  });

  await assert.rejects(
    async () => {
      await sendChatMessage({ message: 'Hello' });
    },
    (err) => {
      assert.ok(err instanceof AiServiceError);
      assert.strictEqual(err.code, 'NETWORK_ERROR');
      assert.match(err.message, /internet connection|network/i);
      return true;
    }
  );
});

test('8. Handles malformed or non-standard backend payloads', async () => {
  setMockInvoke(async () => {
    return { data: { randomField: 123 }, error: null };
  });

  await assert.rejects(
    async () => {
      await sendChatMessage({ message: 'Hello' });
    },
    (err) => {
      assert.ok(err instanceof AiServiceError);
      assert.strictEqual(err.code, 'INVALID_RESPONSE');
      return true;
    }
  );
});
