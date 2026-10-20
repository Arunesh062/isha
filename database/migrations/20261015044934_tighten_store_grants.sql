/*
# Tighten ecommerce grants

1. Security Changes
- Removes default PUBLIC execution from all SECURITY DEFINER functions.
- Allows only authenticated users to call the admin check and secure checkout function.
- Removes anonymous write access from catalogue inventory and all access from private profiles/orders tables.

2. Important Notes
- Public catalogue reads remain available to anonymous visitors.
- The auth trigger continues to run as its function owner and does not need client EXECUTE permission.
*/

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
REVOKE ALL ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) TO authenticated;

REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.catalog_products FROM anon;
GRANT SELECT ON public.catalog_products TO anon;
REVOKE ALL ON public.orders FROM anon;
REVOKE ALL ON public.order_items FROM anon;

DROP POLICY IF EXISTS "profiles_update_own_details" ON public.profiles;
CREATE POLICY "profiles_update_own_details" ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
