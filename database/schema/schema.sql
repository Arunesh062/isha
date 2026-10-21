-- ====================================================================
-- Isha Life Full PostgreSQL Database Schema (Unofficial Demonstration)
-- Target: PostgreSQL 15+ / Supabase
-- ====================================================================

-- 1. Profiles Table (1-to-1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Catalog Categories Table
CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  subcategories jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0
);

-- 3. Catalog Products Table
CREATE TABLE IF NOT EXISTS public.catalog_products (
  product_id text PRIMARY KEY,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  unit_price numeric(12,2) NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  subcategory text NOT NULL DEFAULT '',
  mrp numeric(12,2),
  rating numeric(3,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '',
  images jsonb NOT NULL DEFAULT '[]',
  features jsonb NOT NULL DEFAULT '[]',
  badge text,
  in_stock boolean GENERATED ALWAYS AS (stock > 0) STORED,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_products_category_idx ON public.catalog_products(category);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping numeric(12,2) NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  address_line text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  postal_code text NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery', 'sandbox')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);
