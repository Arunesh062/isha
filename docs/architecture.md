# Isha Life — Architecture & Project Structure

## 1. Overview
Isha Life is an e-commerce platform dedicated to holistic living, natural wellness, and yogic essentials. It is architected as a clean modern monorepo separating:
- **`frontend/`**: Single Page Application (SPA) built with React 18, TypeScript 5, Vite 5, and Tailwind CSS.
- **`backend/`**: Managed BaaS services (Supabase PostgreSQL, PostgREST, Auth).
- **`database/`**: Canonical schema definitions, SQL migrations, and catalog seed scripts.
- **`supabase/`**: Local CLI configuration and serverless Edge Functions (`supabase/functions/ai-assistant/`).
- **`docs/`**: Full architectural, requirement, and testing documentation.
- **`tests/`**: Unit, integration, and end-to-end test infrastructure.
- **`scripts/`**: Automation and migration utilities.

---

## 2. Directory Structure

```
project/
├── frontend/                     # React + TypeScript + Vite frontend
│   ├── public/                   # Static assets (favicons, manifest)
│   │   └── vite.svg
│   ├── src/
│   │   ├── assets/               # Local static assets & media
│   │   ├── auth/                 # Authentication provider & context
│   │   ├── components/           # Reusable UI presentation components
│   │   ├── data/                 # Seed data, static fallback & knowledge base
│   │   ├── features/             # Domain feature slices
│   │   │   ├── catalogue/
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── orders/
│   │   │   ├── admin/
│   │   │   └── ai-assistant/
│   │   ├── hooks/                # Custom React hooks (useProducts, etc.)
│   │   ├── lib/                  # External client singletons (supabase.ts)
│   │   ├── pages/                # Route-level views (Shop, Detail, Orders, Admin)
│   │   ├── store/                # Global contexts (StoreContext, CatalogueContext)
│   │   ├── types/                # Centralized domain TypeScript contracts
│   │   ├── App.tsx               # Root component & view router
│   │   ├── index.css             # Tailwind CSS design system tokens
│   │   ├── main.tsx              # React DOM entry point with ErrorBoundary
│   │   └── vite-env.d.ts
│   ├── index.html                # Vite HTML entry point
│   ├── package.json              # Frontend dependencies & scripts
│   ├── vite.config.ts            # Vite bundler configuration & path aliases
│   ├── tsconfig.json             # Root TypeScript references
│   ├── tsconfig.app.json         # Application TypeScript rules
│   ├── tsconfig.node.json        # Tooling TypeScript rules
│   ├── eslint.config.js          # ESLint configuration
│   ├── tailwind.config.js        # Tailwind CSS theme extension
│   └── postcss.config.js         # PostCSS plugins config
│
├── backend/                      # Backend documentation & service specifications
│   └── README.md
│
├── database/                     # Canonical database assets
│   ├── migrations/               # Versioned PostgreSQL migrations
│   ├── seed/                     # Seed data for categories and products
│   │   └── seed.sql
│   ├── schema/                   # Schema documentation & entity definitions
│   │   └── schema.sql
│   └── README.md
│
├── supabase/                     # Supabase CLI & Serverless Edge Functions
│   ├── config.toml               # Local development Supabase configuration
│   ├── migrations/               # CLI-linked SQL migrations
│   └── functions/                # Deno Edge Functions
│       └── ai-assistant/         # Gemini AI proxy endpoint
│           └── index.ts
│
├── docs/                         # Technical documentation
│   ├── architecture.md           # System architecture overview
│   ├── requirements.md           # Functional & technical requirements
│   ├── implementation-plan.md    # Multi-phase development roadmap
│   ├── ai-integration.md         # Gemini AI architecture blueprint
│   └── testing-report.md         # Test & validation results
│
├── tests/                        # Test suites
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # Browser end-to-end tests
│
├── scripts/                      # Developer utility scripts
├── .gitignore                    # Git exclusions
├── .env.example                  # Environment template
├── package.json                  # Root monorepo workspace scripts
└── README.md                     # Project overview and quickstart
```

---

## 3. Core Architectural Highlights
1. **Frontend Isolation**: The frontend is fully encapsulated in `frontend/`, keeping build tools and web code isolated from database and edge function code.
2. **Path Aliasing**: `@/*` maps to `frontend/src/*`, enabling clean depth-invariant imports.
3. **Database Security**: All transactions are guarded by PostgreSQL Row-Level Security (RLS) and column-level privileges.
4. **Resilient Data Flow**: `useProducts()` fetches metadata from Supabase and transparently falls back to local static catalog data if the connection or migrations are unavailable.
