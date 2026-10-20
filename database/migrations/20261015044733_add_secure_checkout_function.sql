/*
# Add secure checkout transaction

1. Modified Tables
- `catalog_products`: adds `unit_price`, the server-owned current selling price.

2. New Function
- `place_order`: validates the signed-in customer, quantities, stock, and current prices; creates the order and item snapshots; and decrements stock atomically.

3. Security
- The function runs with a fixed search path and is callable only by authenticated users.
- Browser-supplied prices and totals are ignored.
- Invalid quantities, unknown products, and insufficient stock are rejected.
*/

ALTER TABLE public.catalog_products ADD COLUMN IF NOT EXISTS unit_price numeric(12,2);

UPDATE public.catalog_products SET unit_price = CASE product_id
  WHEN 'fw-001' THEN 250 WHEN 'fw-002' THEN 450 WHEN 'fw-003' THEN 380 WHEN 'fw-004' THEN 320
  WHEN 'yg-001' THEN 1200 WHEN 'yg-002' THEN 650 WHEN 'yg-003' THEN 950 WHEN 'yg-004' THEN 350
  WHEN 'bc-001' THEN 420 WHEN 'bc-002' THEN 480 WHEN 'bc-003' THEN 380 WHEN 'bc-004' THEN 320
  WHEN 'cw-001' THEN 280 WHEN 'cw-002' THEN 650 WHEN 'cw-003' THEN 890 WHEN 'cw-004' THEN 1500
  WHEN 'sc-001' THEN 750 WHEN 'sc-002' THEN 180 WHEN 'sc-003' THEN 580 WHEN 'sc-004' THEN 420
  WHEN 'bk-001' THEN 399 WHEN 'bk-002' THEN 350 WHEN 'bk-003' THEN 299 WHEN 'bk-004' THEN 150
  ELSE unit_price
END
WHERE unit_price IS NULL;

ALTER TABLE public.catalog_products ALTER COLUMN unit_price SET NOT NULL;

CREATE OR REPLACE FUNCTION public.place_order(
  p_items jsonb,
  p_customer_name text,
  p_customer_phone text,
  p_address_line text,
  p_city text,
  p_state text,
  p_postal_code text,
  p_payment_method text DEFAULT 'cash_on_delivery'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_order_id uuid;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2);
  v_item jsonb;
  v_product_id text;
  v_quantity integer;
  v_price numeric(12,2);
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  IF p_payment_method NOT IN ('cash_on_delivery', 'sandbox') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;

    IF v_product_id IS NULL OR v_quantity IS NULL OR v_quantity < 1 OR v_quantity > 100 THEN
      RAISE EXCEPTION 'Invalid cart item';
    END IF;

    SELECT unit_price INTO v_price FROM public.catalog_products WHERE product_id = v_product_id;
    IF v_price IS NULL THEN
      RAISE EXCEPTION 'Product unavailable';
    END IF;

    UPDATE public.catalog_products
    SET stock = stock - v_quantity, updated_at = now()
    WHERE product_id = v_product_id AND stock >= v_quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient stock';
    END IF;

    v_subtotal := v_subtotal + (v_price * v_quantity);
  END LOOP;

  v_shipping := CASE WHEN v_subtotal >= 999 THEN 0 ELSE 99 END;

  INSERT INTO public.orders (
    user_id, subtotal, shipping, total, customer_name, customer_phone,
    address_line, city, state, postal_code, payment_method
  ) VALUES (
    v_user_id, v_subtotal, v_shipping, v_subtotal + v_shipping,
    trim(p_customer_name), trim(p_customer_phone), trim(p_address_line),
    trim(p_city), trim(p_state), trim(p_postal_code), p_payment_method
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := v_item ->> 'product_id';
    v_quantity := (v_item ->> 'quantity')::integer;
    SELECT unit_price INTO v_price FROM public.catalog_products WHERE product_id = v_product_id;
    SELECT name INTO v_name FROM jsonb_to_record(v_item) AS item(name text);

    INSERT INTO public.order_items (order_id, product_id, product_name, unit_price, quantity)
    SELECT v_order_id, v_product_id, COALESCE(v_name, v_product_id), v_price, v_quantity;
  END LOOP;

  RETURN v_order_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text, text, text, text) TO authenticated;
