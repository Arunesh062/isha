/*
# Create ecommerce store schema

1. New Tables
- `profiles`: one customer profile per Supabase account, with a server-controlled role.
- `catalog_products`: public catalogue inventory keyed by the existing frontend product IDs.
- `orders`: authenticated customer orders, totals, addresses, and fulfillment status.
- `order_items`: immutable product snapshots belonging to an order.

2. Security
- Row level security is enabled on every table.
- Customers can only read and create their own profiles, orders, and order items.
- Catalogue inventory is publicly readable, but only authenticated admins can change it.
- Only authenticated admins can read or update all orders.
- The profile role is never client-writable.

3. Important Notes
- Authentication uses Supabase Auth's built-in `auth.users`; no custom password table is created.
- New accounts receive the `customer` role automatically through a server-side trigger.
- Product prices and stock are checked again by the order flow before an order is created.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.catalog_products (
  product_id text PRIMARY KEY,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catalog_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own_details" ON public.profiles;
CREATE POLICY "profiles_update_own_details" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated
USING (auth.uid() = user_id);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "catalog_select_public" ON public.catalog_products;
CREATE POLICY "catalog_select_public" ON public.catalog_products FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "catalog_insert_admin" ON public.catalog_products;
CREATE POLICY "catalog_insert_admin" ON public.catalog_products FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "catalog_update_admin" ON public.catalog_products;
CREATE POLICY "catalog_update_admin" ON public.catalog_products FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "catalog_delete_admin" ON public.catalog_products;
CREATE POLICY "catalog_delete_admin" ON public.catalog_products FOR DELETE TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "orders_select_own_or_admin" ON public.orders;
CREATE POLICY "orders_select_own_or_admin" ON public.orders FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_insert_own" ON public.orders;
CREATE POLICY "orders_insert_own" ON public.orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_admin" ON public.orders;
CREATE POLICY "orders_update_admin" ON public.orders FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_delete_own" ON public.orders;
CREATE POLICY "orders_delete_own" ON public.orders FOR DELETE TO authenticated
USING (auth.uid() = user_id AND status = 'placed');

DROP POLICY IF EXISTS "order_items_select_own_or_admin" ON public.order_items;
CREATE POLICY "order_items_select_own_or_admin" ON public.order_items FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_admin())));

DROP POLICY IF EXISTS "order_items_insert_own" ON public.order_items;
CREATE POLICY "order_items_insert_own" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "order_items_update_admin" ON public.order_items;
CREATE POLICY "order_items_update_admin" ON public.order_items FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_delete_own" ON public.order_items;
CREATE POLICY "order_items_delete_own" ON public.order_items FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid() AND orders.status = 'placed'));

INSERT INTO public.catalog_products (product_id, stock)
VALUES
  ('fw-001', 30), ('fw-002', 24), ('fw-003', 40), ('fw-004', 18),
  ('yg-001', 20), ('yg-002', 16), ('yg-003', 12), ('yg-004', 0),
  ('bc-001', 30), ('bc-002', 22), ('bc-003', 28), ('bc-004', 15),
  ('cw-001', 35), ('cw-002', 18), ('cw-003', 12), ('cw-004', 8),
  ('sc-001', 10), ('sc-002', 45), ('sc-003', 14), ('sc-004', 20),
  ('bk-001', 25), ('bk-002', 18), ('bk-003', 12), ('bk-004', 100)
ON CONFLICT (product_id) DO NOTHING;
