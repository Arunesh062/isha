# Isha Life — Database Architecture & Migrations

This folder organizes all database-related assets, migrations, schema definitions, and seed scripts for the Isha Life PostgreSQL / Supabase database.

---

## 1. Directory Structure

```
database/
├── migrations/       # Timestamped, version-controlled SQL migrations
├── seed/             # Seed scripts for products, categories, and reference data
│   └── seed.sql
├── schema/           # Core schema reference and entity diagrams
│   └── schema.sql
└── README.md
```

---

## 2. Migrations Overview

The database uses ordered, idempotent SQL migrations. All migrations are tracked both here and in `supabase/migrations/`:

| Migration File | Description | Status |
| :--- | :--- | :--- |
| `20261015044705_create_store_schema.sql` | Initial schema: `profiles`, `catalog_products`, `orders`, `order_items`, RLS policies, trigger `on_auth_user_created`. | Applied |
| `20261015044733_add_secure_checkout_function.sql` | Added `unit_price` column to `catalog_products`, created `place_order` atomic stored function. | Applied |
| `20261015044934_tighten_store_grants.sql` | Revoked public/anon execution on SECURITY DEFINER functions, tightened table grants. | Applied |
| `20261017100000_fix_role_self_escalation.sql` | Added defense-in-depth RLS check preventing role modification in `profiles_update_own_details`. | Pending execution |
| `20261017110000_add_product_metadata.sql` | Added 12 metadata columns to `catalog_products`, created `catalog_categories`, seeded 24 products. | Pending execution |

---

## 3. How to Apply Migrations

To apply pending migrations to your Supabase project:
1. Ensure your Supabase CLI is authenticated:
   ```bash
   supabase login
   ```
2. Link your remote Supabase project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Push pending migrations:
   ```bash
   supabase db push
   ```
   *Alternatively, copy the SQL contents of `20261017100000_fix_role_self_escalation.sql` and `20261017110000_add_product_metadata.sql` and run them directly in the Supabase Dashboard SQL Editor.*

---

## 4. Security & Permissions Summary
- **RLS (Row Level Security)** is active on all public tables.
- **Role Escalation Protection**: Protected via column-level grants (`GRANT UPDATE (full_name, phone) ON profiles TO authenticated`) and RLS `WITH CHECK`.
- **Catalogue Inventory Protection**: Updates require `public.is_admin()`. Unauthenticated users can only `SELECT`.
- **Checkout Integrity**: Orders can only be placed through the server-side RPC `place_order`, which verifies authenticated user, re-calculates prices from `catalog_products.unit_price`, and atomically decrements inventory.
