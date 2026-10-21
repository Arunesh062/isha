# Isha Life — Holistic E-Commerce Platform

A production-grade, holistic e-commerce web application built with **React**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Supabase**.

---

## 1. Quick Start

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation & Setup
1. Ensure your environment variables are configured:
   ```bash
   cp .env.example frontend/.env
   ```
2. Run the development server from the repository root:
   ```bash
   npm run dev
   ```
   *(Or navigate into `frontend/` and run `npm run dev`)*.
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 2. Available Scripts (From Repository Root)

- `npm run dev`: Starts the local Vite development server.
- `npm run build`: Builds the production bundle in `frontend/dist/`.
- `npm run lint`: Runs ESLint on frontend source files.
- `npm run typecheck`: Validates TypeScript types across the frontend.
- `npm run preview`: Previews the production build locally.

---

## 3. Project Organization

- **`frontend/`**: Complete client application (React, Vite, Tailwind CSS, components, pages, state).
- **`backend/`**: Backend architecture documentation and service specifications.
- **`database/`**: SQL migrations, database schema references, and catalog seed scripts.
- **`supabase/`**: Local Supabase configuration and serverless Edge Functions (`ai-assistant`).
- **`docs/`**: Full architectural blueprints, requirements, implementation roadmap, and testing reports.
- **`tests/`**: Unit, integration, and end-to-end testing directories.
- **`scripts/`**: Automation scripts.
