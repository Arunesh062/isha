# Sattva Life — Implementation Plan & Roadmap

## Phase Overview

### Phase 1: Project Architecture & Structure (Current)
- [x] Separation into `frontend/`, `backend/`, `database/`, `supabase/`, `docs/`, `tests/`, and `scripts/`.
- [x] Relocation of frontend source code and configuration.
- [x] Establishment of central domain types and backwards-compatible re-exports.
- [x] Verification of existing store features, catalog data, and build pipelines.
- [x] Cleanup of obsolete duplicates and artifacts.

---

### Phase 2: Database Migration & Catalogue Synchronization
- [ ] Apply pending migration `20261017100000_fix_role_self_escalation.sql`.
- [ ] Apply pending migration `20261017110000_add_product_metadata.sql`.
- [ ] Verify that `useProducts()` switches from cached fallback to live Supabase data.
- [ ] Verify admin inventory and price modifications propagate live to the storefront.

---

### Phase 3: Gemini AI Shopping Assistant Integration
- [ ] Configure `supabase/functions/ai-assistant/index.ts` with Google Gemini SDK (`@google/genai`).
- [ ] Securely store `GEMINI_API_KEY` in Supabase Secrets (never in frontend code).
- [ ] Ground Gemini responses using the store knowledge base (`src/data/knowledge.ts`) and live catalog embeddings.
- [ ] Implement interactive chat widget in `frontend/src/features/ai-assistant/`.
- [ ] Add product recommendation actions directly from AI chat to the shopping cart.

---

### Phase 4: Testing & Deployment
- [ ] Write unit tests for cart/store calculations in `tests/unit/`.
- [ ] Implement integration tests for checkout and auth flows in `tests/integration/`.
- [ ] Configure CI/CD pipeline and production deployment hosting.
