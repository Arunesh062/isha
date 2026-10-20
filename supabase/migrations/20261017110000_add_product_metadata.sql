/*
# Add product metadata columns and categories table

1. Modified Tables
- `catalog_products`: adds name, description, category, subcategory, mrp,
  rating, review_count, image, images, features, badge, and a computed
  in_stock column derived from live stock.

2. New Tables
- `catalog_categories`: stores category metadata with subcategories as JSONB.

3. Security
- Categories are publicly readable, admin-only writable.
- Existing catalog_products RLS policies cover the new columns automatically.

4. Seed Data
- All 24 products and 6 categories upserted idempotently.
- Stock and unit_price are NOT overwritten on conflict — those remain
  authoritative from the existing rows.
*/

-- ===== Add metadata columns to catalog_products =====

ALTER TABLE public.catalog_products
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS subcategory text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS mrp numeric(12,2),
  ADD COLUMN IF NOT EXISTS rating numeric(3,1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS badge text;

-- Computed column: in_stock is always derived from the live stock column
-- (Cannot use ADD COLUMN IF NOT EXISTS for generated columns in all PG versions,
--  so we use DO block with exception handler)
DO $$
BEGIN
  ALTER TABLE public.catalog_products
    ADD COLUMN in_stock boolean GENERATED ALWAYS AS (stock > 0) STORED;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END;
$$;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS catalog_products_category_idx ON public.catalog_products(category);

-- ===== Create catalog_categories table =====

CREATE TABLE IF NOT EXISTS public.catalog_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  subcategories jsonb NOT NULL DEFAULT '[]',
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.catalog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON public.catalog_categories;
CREATE POLICY "categories_select_public" ON public.catalog_categories FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "categories_insert_admin" ON public.catalog_categories;
CREATE POLICY "categories_insert_admin" ON public.catalog_categories FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_update_admin" ON public.catalog_categories;
CREATE POLICY "categories_update_admin" ON public.catalog_categories FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_delete_admin" ON public.catalog_categories;
CREATE POLICY "categories_delete_admin" ON public.catalog_categories FOR DELETE TO authenticated
USING (public.is_admin());

GRANT SELECT ON public.catalog_categories TO anon;

-- ===== Seed categories =====

INSERT INTO public.catalog_categories (id, name, description, image, subcategories, sort_order)
VALUES
  ('food-wellness', 'Food & Wellness', 'Natural foods, herbal supplements, and immunity boosters',
   'https://images.pexels.com/photos/6694156/pexels-photo-6694156.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"herbal-teas","name":"Herbal Teas"},{"id":"natural-foods","name":"Natural Foods"},{"id":"supplements","name":"Herbal Supplements"},{"id":"honey-jams","name":"Honey & Jams"}]',
   1),
  ('yoga', 'Yoga & Meditation', 'Yoga mats, meditation cushions, and accessories',
   'https://images.pexels.com/photos/6752177/pexels-photo-6752177.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"yoga-mats","name":"Yoga Mats"},{"id":"meditation-aids","name":"Meditation Aids"},{"id":"cushions","name":"Cushions & Bolsters"},{"id":"accessories","name":"Accessories"}]',
   2),
  ('body-care', 'Body Care', 'Natural, chemical-free body care products',
   'https://images.pexels.com/photos/4841255/pexels-photo-4841255.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"skincare","name":"Skincare"},{"id":"hair-care","name":"Hair Care"},{"id":"bath-body","name":"Bath & Body"},{"id":"fragrances","name":"Natural Fragrances"}]',
   3),
  ('copperware', 'Copperware', 'Traditional copper vessels for healthful living',
   'https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"bottles","name":"Bottles & Tumblers"},{"id":"vessels","name":"Vessels & Pots"},{"id":"plates","name":"Plates & Bowls"},{"id":"gift-sets","name":"Gift Sets"}]',
   4),
  ('sacred', 'Sacred & Spiritual', 'Rudraksha, incense, and consecrated items',
   'https://images.pexels.com/photos/2297252/pexels-photo-2297252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"rudraksha","name":"Rudraksha"},{"id":"incense","name":"Incense & Dhoop"},{"id":"offerings","name":"Temple Offerings"},{"id":"decor","name":"Home Decor"}]',
   5),
  ('books', 'Books & Wisdom', 'Books, music, and wisdom from the yogic tradition',
   'https://images.pexels.com/photos/31373534/pexels-photo-31373534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '[{"id":"books","name":"Books"},{"id":"music","name":"Music & Chants"},{"id":"videos","name":"Videos & DVDs"},{"id":"downloads","name":"Digital Downloads"}]',
   6)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image = EXCLUDED.image,
  subcategories = EXCLUDED.subcategories,
  sort_order = EXCLUDED.sort_order;

-- ===== Seed product metadata (does NOT overwrite stock or unit_price) =====

INSERT INTO public.catalog_products (product_id, stock, unit_price, name, description, category, subcategory, mrp, rating, review_count, image, images, features, badge)
VALUES
  -- Food & Wellness
  ('fw-001', 30, 250, 'Tulsi Ginger Herbal Tea',
   'A soothing blend of sacred Tulsi leaves and ginger root, crafted to support immunity and digestion. Each sip brings calm and vitality.',
   'food-wellness', 'herbal-teas', 320, 4.7, 128,
   'https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["100% natural ingredients","Boosts immunity","Aids digestion","Caffeine-free"]',
   'Bestseller'),
  ('fw-002', 24, 450, 'Ashwagandha Root Powder',
   'Premium Ashwagandha root powder, known for its adaptogenic properties. Helps the body manage stress and promotes restful sleep.',
   'food-wellness', 'supplements', 550, 4.8, 86,
   'https://images.pexels.com/photos/6694166/pexels-photo-6694166.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/6694166/pexels-photo-6694166.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Organic certified","Adaptogenic herb","Reduces stress","Improves sleep quality"]',
   NULL),
  ('fw-003', 40, 380, 'Raw Forest Honey',
   'Pure, raw honey harvested from wild forests. Unprocessed and unpasteurized to retain all natural enzymes and health benefits.',
   'food-wellness', 'honey-jams', 420, 4.9, 215,
   'https://images.pexels.com/photos/9105962/pexels-photo-9105962.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/9105962/pexels-photo-9105962.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Raw & unprocessed","Wild forest sourced","Rich in enzymes","No added sugar"]',
   'New'),
  ('fw-004', 18, 320, 'Triphala Herbal Supplement',
   'A traditional Ayurvedic blend of three fruits — Amalaki, Bibhitaki, and Haritaki. Supports digestion and natural detoxification.',
   'food-wellness', 'supplements', 380, 4.5, 62,
   'https://images.pexels.com/photos/8329340/pexels-photo-8329340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/8329340/pexels-photo-8329340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Classical Ayurvedic formula","Supports digestion","Natural detox","100% organic"]',
   NULL),

  -- Yoga & Meditation
  ('yg-001', 20, 1200, 'Cork Yoga Mat',
   'Eco-friendly cork yoga mat with natural rubber base. Provides excellent grip and cushioning for your practice.',
   'yoga', 'yoga-mats', 1500, 4.8, 94,
   'https://images.pexels.com/photos/6752177/pexels-photo-6752177.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/6752177/pexels-photo-6752177.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Sustainable cork surface","Excellent grip","Anti-microbial","6mm cushioning"]',
   'Bestseller'),
  ('yg-002', 16, 650, 'Organic Cotton Yoga Mat Bag',
   'Handwoven organic cotton mat bag with adjustable strap. Spacious enough for your mat, towel, and water bottle.',
   'yoga', 'accessories', 800, 4.6, 47,
   'https://images.pexels.com/photos/4325439/pexels-photo-4325439.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/4325439/pexels-photo-4325439.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["100% organic cotton","Handwoven","Adjustable strap","Extra pocket"]',
   NULL),
  ('yg-003', 12, 950, 'Meditation Cushion Set',
   'Traditional meditation cushion filled with natural buckwheat hulls. Provides perfect support for longer sits.',
   'yoga', 'cushions', 1100, 4.7, 73,
   'https://images.pexels.com/photos/3822454/pexels-photo-3822454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/3822454/pexels-photo-3822454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Buckwheat hull filling","Organic cotton cover","Ergonomic design","Carry handle"]',
   NULL),
  ('yg-004', 0, 350, 'Yoga Strap with Buckle',
   'Durable cotton yoga strap with metal buckle for deeper stretches and improved flexibility.',
   'yoga', 'accessories', 450, 4.4, 38,
   'https://images.pexels.com/photos/6633997/pexels-photo-6633997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/6633997/pexels-photo-6633997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Strong cotton weave","Metal buckle","2.5m length","Multiple colors"]',
   NULL),

  -- Body Care
  ('bc-001', 30, 420, 'Organic Face Wash — Apple & Papaya',
   'Gentle organic face wash enriched with apple and papaya extracts. Cleanses deeply while maintaining natural skin balance.',
   'body-care', 'skincare', 500, 4.6, 156,
   'https://images.pexels.com/photos/14438270/pexels-photo-14438270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/14438270/pexels-photo-14438270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Suitable for all skin types","Chemical-free formula","Natural fruit extracts","100ml bottle"]',
   'Bestseller'),
  ('bc-002', 22, 480, 'Natural Body Lotion — Sandalwood',
   'Nourishing body lotion with sandalwood essence and natural oils. Leaves skin soft, smooth, and subtly fragrant.',
   'body-care', 'bath-body', 560, 4.7, 89,
   'https://images.pexels.com/photos/4841255/pexels-photo-4841255.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/4841255/pexels-photo-4841255.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Sandalwood fragrance","Deeply moisturizing","No parabens","All-day hydration"]',
   NULL),
  ('bc-003', 28, 380, 'Herbal Hair Oil — Bhringraj',
   'Traditional Bhringraj hair oil blended with coconut and amla. Promotes healthy hair growth and prevents premature graying.',
   'body-care', 'hair-care', 440, 4.5, 112,
   'https://images.pexels.com/photos/3735627/pexels-photo-3735627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/3735627/pexels-photo-3735627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Bhringraj + Amla blend","Cold-pressed coconut base","Promotes hair growth","200ml bottle"]',
   NULL),
  ('bc-004', 15, 320, 'Beeswax Solid Perfume — Jasmine',
   'Alcohol-free mild body fragrance made with natural beeswax and jasmine essential oil. Compact 4gm tin for on-the-go use.',
   'body-care', 'fragrances', 380, 4.8, 54,
   'https://images.pexels.com/photos/8789599/pexels-photo-8789599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/8789599/pexels-photo-8789599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Alcohol-free","Natural beeswax base","Jasmine scent","Pocket-sized 4gm"]',
   'New'),

  -- Copperware
  ('cw-001', 35, 280, 'Copper Drinking Glass — 200ml',
   'Handcrafted pure copper drinking glass. Storing water in copper vessels brings the benefits of natural ion purification.',
   'copperware', 'bottles', 350, 4.7, 203,
   'https://images.pexels.com/photos/20750158/pexels-photo-20750158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/20750158/pexels-photo-20750158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["100% pure copper","Handcrafted","200ml capacity","Ayurvedic tradition"]',
   'Bestseller'),
  ('cw-002', 18, 650, 'Copper Water Bottle — 900ml',
   'Seamless copper water bottle with leak-proof cap. Drink copper-charged water throughout the day for natural wellness.',
   'copperware', 'bottles', 850, 4.8, 178,
   'https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Seamless construction","Leak-proof cap","900ml capacity","Lightweight design"]',
   NULL),
  ('cw-003', 12, 890, 'Copper Serving Bowl Set',
   'Set of four handcrafted copper serving bowls with brass rim. Perfect for serving meals or as decorative pieces.',
   'copperware', 'plates', 1100, 4.6, 67,
   'https://images.pexels.com/photos/30937631/pexels-photo-30937631.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/30937631/pexels-photo-30937631.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Set of 4 bowls","Brass rim detail","Handcrafted","Food-safe coating"]',
   NULL),
  ('cw-004', 8, 1500, 'Copper Gift Hamper',
   'Beautifully curated copper gift hamper including bottle, glass, tray, and pitcher. An ideal gift for any occasion.',
   'copperware', 'gift-sets', 2000, 4.9, 41,
   'https://images.pexels.com/photos/5038916/pexels-photo-5038916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/5038916/pexels-photo-5038916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Complete gift set","Includes bottle, glass, tray, pitcher","Gift-wrapped","Premium packaging"]',
   'Gift Set'),

  -- Sacred & Spiritual
  ('sc-001', 10, 750, 'Consecrated Rudraksha Mala',
   'Authentic five-faced Rudraksha mala, consecrated and energized. Each bead is carefully selected and strung on natural thread.',
   'sacred', 'rudraksha', 950, 5.0, 34,
   'https://images.pexels.com/photos/2297252/pexels-photo-2297252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/2297252/pexels-photo-2297252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Authentic Rudraksha","108 beads","Consecrated","Natural silk thread"]',
   'Sacred'),
  ('sc-002', 45, 180, 'Natural Incense Sticks — 100 Pack',
   'Hand-rolled natural incense sticks made with pure essential oils and herbal powders. Creates a serene and purifying atmosphere.',
   'sacred', 'incense', 220, 4.6, 287,
   'https://images.pexels.com/photos/4971645/pexels-photo-4971645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/4971645/pexels-photo-4971645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["100 sticks per pack","Hand-rolled","Natural ingredients","Long burning time"]',
   NULL),
  ('sc-003', 14, 580, 'Brass Aarti Stand',
   'Traditional brass Aarti stand for daily worship. Hand-crafted by skilled artisans with intricate detailing.',
   'sacred', 'offerings', 700, 4.5, 52,
   'https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Pure brass","Hand-crafted","Intricate design","Sturdy base"]',
   NULL),
  ('sc-004', 20, 420, 'Meditation Candle Set',
   'Set of three natural wax candles with essential oil blends. Creates a calming atmosphere for meditation and relaxation.',
   'sacred', 'decor', 520, 4.7, 88,
   'https://images.pexels.com/photos/6205910/pexels-photo-6205910.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/6205910/pexels-photo-6205910.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Set of 3 candles","Natural wax","Essential oil blends","Long burning"]',
   NULL),

  -- Books & Wisdom
  ('bk-001', 25, 399, 'Enlightenment — A New Beginning',
   'A profound exploration of the spiritual path, offering insights into the nature of existence and the possibility of inner transformation.',
   'books', 'books', 499, 5.0, 1,
   'https://images.pexels.com/photos/31373534/pexels-photo-31373534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/31373534/pexels-photo-31373534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Paperback edition","English language","320 pages","Includes foreword"]',
   'New'),
  ('bk-002', 18, 350, 'A Taste of Well-Being',
   'A collection of recipes and wisdom for healthy living. Combines traditional knowledge with practical guidance for everyday wellness.',
   'books', 'books', 450, 5.0, 6,
   'https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Hardcover edition","Over 100 recipes","Full color photography","English language"]',
   NULL),
  ('bk-003', 12, 299, 'Yogic Chants — Audio CD',
   'A collection of sacred yogic chants that create a meditative atmosphere. Perfect for daily practice and spiritual gatherings.',
   'books', 'music', 350, 4.8, 45,
   'https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Audio CD format","10 sacred chants","60 minutes runtime","Includes booklet"]',
   NULL),
  ('bk-004', 100, 150, 'Mind & Memory — Digital Guide',
   'A comprehensive digital guide on enhancing mental clarity and memory through yogic practices. Instant download available.',
   'books', 'downloads', 200, 4.5, 28,
   'https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
   '["https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"]',
   '["Instant download","PDF format","50+ pages","Lifetime access"]',
   NULL)
ON CONFLICT (product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  mrp = EXCLUDED.mrp,
  rating = EXCLUDED.rating,
  review_count = EXCLUDED.review_count,
  image = EXCLUDED.image,
  images = EXCLUDED.images,
  features = EXCLUDED.features,
  badge = EXCLUDED.badge;
