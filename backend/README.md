# Isha Life — Backend Architecture

## Overview
Isha Life utilizes **Supabase** as its primary Backend-as-a-Service (BaaS). Rather than maintaining a redundant Node.js/Express server layer, core backend functionalities are handled natively, securely, and scalably through Supabase services:

1. **Database & API (PostgreSQL + PostgREST)**:
   - Automated REST API for data access with Row-Level Security (RLS) enforcement.
   - High-performance, schema-driven endpoints for storefront reads and authenticated profile management.

2. **Authentication & Session Management**:
   - Supabase Auth manages user sign-up, sign-in, JWT token lifecycle, and session refresh.
   - Trigger-based profile creation on user registration (`on_auth_user_created`).

3. **Transactional Business Logic (PL/pgSQL RPCs)**:
   - Server-side atomic order placement function (`place_order`).
   - Server-side validation of product prices and stock availability to prevent client-side price tampering.

4. **Future Edge Computing & AI Assistance**:
   - Complex backend tasks, such as the Gemini AI shopping assistant and private API integrations, are deployed as serverless **Supabase Edge Functions** (Deno-based) under:
     `supabase/functions/ai-assistant/`
   - All private credentials (e.g. `GEMINI_API_KEY`) and service-role keys are securely stored as Supabase secrets and accessed exclusively by edge functions on the server side.

---

## Why No Standalone Express Server?
- **Zero Overhead**: Eliminates maintenance of custom API boilerplate, connection pooling, and separate server infrastructure.
- **Enhanced Security**: Database RLS and column-level SQL privileges provide defense-in-depth directly at the storage engine level.
- **Edge Deployment**: AI endpoints run closer to users with zero cold start delays via Supabase Edge Functions.
