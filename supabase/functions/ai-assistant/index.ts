// Supabase Edge Function: ai-assistant
// Secure backend proxy for Gemini AI shopping assistant & natural language search.
// Phase 2 Implementation.

import { handleAiAssistantRequest } from './handler.ts';

// @ts-ignore Deno global
if (typeof Deno !== 'undefined' && typeof Deno.serve === 'function') {
  // @ts-ignore
  Deno.serve(async (req: Request) => {
    return handleAiAssistantRequest(req);
  });
} else {
  // Fallback for older Deno environments using std/http/server.ts
  import('https://deno.land/std@0.168.0/http/server.ts')
    .then(({ serve }) => {
      serve(async (req: Request) => {
        return handleAiAssistantRequest(req);
      });
    })
    .catch((err) => {
      console.error('Edge Function runtime initialization warning:', err);
    });
}

export { handleAiAssistantRequest };
