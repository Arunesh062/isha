/**
 * Isha Life Product Catalogue & Real-Time Inventory Synchronizer.
 *
 * Rules:
 * - Product metadata is authoritative from verified catalogue.
 * - Prices and stock levels are synchronized with the live Supabase catalog_products table.
 * - Gemini NEVER invents product IDs, prices, or stock levels.
 */

import type { CatalogProductResult, ReferencedProductSummary, SearchQueryInterpretation } from './types.ts';

export interface AuthoritativeProduct {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  description: string;
  features: string[];
  inStock: boolean;
  stock: number;
  badge?: string;
}

export const CANONICAL_PRODUCTS: AuthoritativeProduct[] = [
  // Food & Wellness
  {
    id: 'fw-001',
    name: 'Tulsi Ginger Herbal Tea',
    category: 'food-wellness',
    subcategory: 'herbal-teas',
    price: 250,
    mrp: 320,
    rating: 4.7,
    reviewCount: 128,
    image: 'https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/17859378/pexels-photo-17859378.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A soothing blend of sacred Tulsi leaves and ginger root, crafted to support immunity and digestion. Each sip brings calm and vitality.',
    features: ['100% natural ingredients', 'Boosts immunity', 'Aids digestion', 'Caffeine-free'],
    inStock: true,
    stock: 30,
    badge: 'Bestseller',
  },
  {
    id: 'fw-002',
    name: 'Ashwagandha Root Powder',
    category: 'food-wellness',
    subcategory: 'supplements',
    price: 450,
    mrp: 550,
    rating: 4.8,
    reviewCount: 86,
    image: 'https://images.pexels.com/photos/6694166/pexels-photo-6694166.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/6694166/pexels-photo-6694166.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Premium Ashwagandha root powder, known for its adaptogenic properties. Helps the body manage stress and promotes restful sleep.',
    features: ['Organic certified', 'Adaptogenic herb', 'Reduces stress', 'Improves sleep quality'],
    inStock: true,
    stock: 24,
  },
  {
    id: 'fw-003',
    name: 'Raw Forest Honey',
    category: 'food-wellness',
    subcategory: 'honey-jams',
    price: 380,
    mrp: 420,
    rating: 4.9,
    reviewCount: 215,
    image: 'https://images.pexels.com/photos/9105962/pexels-photo-9105962.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/9105962/pexels-photo-9105962.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Pure, raw honey harvested from wild forests. Unprocessed and unpasteurized to retain all natural enzymes and health benefits.',
    features: ['Raw & unprocessed', 'Wild forest sourced', 'Rich in enzymes', 'No added sugar'],
    inStock: true,
    stock: 40,
    badge: 'New',
  },
  {
    id: 'fw-004',
    name: 'Triphala Herbal Supplement',
    category: 'food-wellness',
    subcategory: 'supplements',
    price: 320,
    mrp: 380,
    rating: 4.5,
    reviewCount: 62,
    image: 'https://images.pexels.com/photos/8329340/pexels-photo-8329340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/8329340/pexels-photo-8329340.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A traditional Ayurvedic blend of three fruits — Amalaki, Bibhitaki, and Haritaki. Supports digestion and natural detoxification.',
    features: ['Classical Ayurvedic formula', 'Supports digestion', 'Natural detox', '100% organic'],
    inStock: true,
    stock: 18,
  },

  // Yoga & Meditation
  {
    id: 'yg-001',
    name: 'Cork Yoga Mat',
    category: 'yoga',
    subcategory: 'yoga-mats',
    price: 1200,
    mrp: 1500,
    rating: 4.8,
    reviewCount: 94,
    image: 'https://images.pexels.com/photos/6752177/pexels-photo-6752177.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/6752177/pexels-photo-6752177.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Eco-friendly cork yoga mat with natural rubber base. Provides excellent grip and cushioning for your practice.',
    features: ['Sustainable cork surface', 'Excellent grip', 'Anti-microbial', '6mm cushioning'],
    inStock: true,
    stock: 20,
    badge: 'Bestseller',
  },
  {
    id: 'yg-002',
    name: 'Organic Cotton Yoga Mat Bag',
    category: 'yoga',
    subcategory: 'accessories',
    price: 650,
    mrp: 800,
    rating: 4.6,
    reviewCount: 47,
    image: 'https://images.pexels.com/photos/4325439/pexels-photo-4325439.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/4325439/pexels-photo-4325439.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Handwoven organic cotton mat bag with adjustable strap. Spacious enough for your mat, towel, and water bottle.',
    features: ['100% organic cotton', 'Handwoven', 'Adjustable strap', 'Extra pocket'],
    inStock: true,
    stock: 16,
  },
  {
    id: 'yg-003',
    name: 'Meditation Cushion Set',
    category: 'yoga',
    subcategory: 'cushions',
    price: 950,
    mrp: 1100,
    rating: 4.7,
    reviewCount: 73,
    image: 'https://images.pexels.com/photos/3822454/pexels-photo-3822454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/3822454/pexels-photo-3822454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Traditional meditation cushion filled with natural buckwheat hulls. Provides perfect support for longer sits.',
    features: ['Buckwheat hull filling', 'Organic cotton cover', 'Ergonomic design', 'Carry handle'],
    inStock: true,
    stock: 12,
  },
  {
    id: 'yg-004',
    name: 'Yoga Strap with Buckle',
    category: 'yoga',
    subcategory: 'accessories',
    price: 350,
    mrp: 450,
    rating: 4.4,
    reviewCount: 38,
    image: 'https://images.pexels.com/photos/6633997/pexels-photo-6633997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/6633997/pexels-photo-6633997.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Durable cotton yoga strap with metal buckle for deeper stretches and improved flexibility.',
    features: ['Strong cotton weave', 'Metal buckle', '2.5m length', 'Multiple colors'],
    inStock: false,
    stock: 0,
  },

  // Body Care
  {
    id: 'bc-001',
    name: 'Organic Face Wash — Apple & Papaya',
    category: 'body-care',
    subcategory: 'skincare',
    price: 420,
    mrp: 500,
    rating: 4.6,
    reviewCount: 156,
    image: 'https://images.pexels.com/photos/14438270/pexels-photo-14438270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/14438270/pexels-photo-14438270.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Gentle organic face wash enriched with apple and papaya extracts. Cleanses deeply while maintaining natural skin balance.',
    features: ['Suitable for all skin types', 'Chemical-free formula', 'Natural fruit extracts', '100ml bottle'],
    inStock: true,
    stock: 30,
    badge: 'Bestseller',
  },
  {
    id: 'bc-002',
    name: 'Natural Body Lotion — Sandalwood',
    category: 'body-care',
    subcategory: 'bath-body',
    price: 480,
    mrp: 560,
    rating: 4.7,
    reviewCount: 89,
    image: 'https://images.pexels.com/photos/4841255/pexels-photo-4841255.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/4841255/pexels-photo-4841255.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Nourishing body lotion with sandalwood essence and natural oils. Leaves skin soft, smooth, and subtly fragrant.',
    features: ['Sandalwood fragrance', 'Deeply moisturizing', 'No parabens', 'All-day hydration'],
    inStock: true,
    stock: 22,
  },
  {
    id: 'bc-003',
    name: 'Herbal Hair Oil — Bhringraj',
    category: 'body-care',
    subcategory: 'hair-care',
    price: 380,
    mrp: 440,
    rating: 4.5,
    reviewCount: 112,
    image: 'https://images.pexels.com/photos/3735627/pexels-photo-3735627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/3735627/pexels-photo-3735627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Traditional Bhringraj hair oil blended with coconut and amla. Promotes healthy hair growth and prevents premature graying.',
    features: ['Bhringraj + Amla blend', 'Cold-pressed coconut base', 'Promotes hair growth', '200ml bottle'],
    inStock: true,
    stock: 28,
  },
  {
    id: 'bc-004',
    name: 'Beeswax Solid Perfume — Jasmine',
    category: 'body-care',
    subcategory: 'fragrances',
    price: 320,
    mrp: 380,
    rating: 4.8,
    reviewCount: 54,
    image: 'https://images.pexels.com/photos/8789599/pexels-photo-8789599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/8789599/pexels-photo-8789599.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Alcohol-free mild body fragrance made with natural beeswax and jasmine essential oil. Compact 4gm tin for on-the-go use.',
    features: ['Alcohol-free', 'Natural beeswax base', 'Jasmine scent', 'Pocket-sized 4gm'],
    inStock: true,
    stock: 15,
    badge: 'New',
  },

  // Copperware
  {
    id: 'cw-001',
    name: 'Copper Drinking Glass — 200ml',
    category: 'copperware',
    subcategory: 'bottles',
    price: 280,
    mrp: 350,
    rating: 4.7,
    reviewCount: 203,
    image: 'https://images.pexels.com/photos/20750158/pexels-photo-20750158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/20750158/pexels-photo-20750158.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Handcrafted pure copper drinking glass. Storing water in copper vessels brings the benefits of natural ion purification.',
    features: ['100% pure copper', 'Handcrafted', '200ml capacity', 'Ayurvedic tradition'],
    inStock: true,
    stock: 35,
    badge: 'Bestseller',
  },
  {
    id: 'cw-002',
    name: 'Copper Water Bottle — 900ml',
    category: 'copperware',
    subcategory: 'bottles',
    price: 650,
    mrp: 850,
    rating: 4.8,
    reviewCount: 178,
    image: 'https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/33888100/pexels-photo-33888100.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Seamless copper water bottle with leak-proof cap. Drink copper-charged water throughout the day for natural wellness.',
    features: ['Seamless construction', 'Leak-proof cap', '900ml capacity', 'Lightweight design'],
    inStock: true,
    stock: 18,
  },
  {
    id: 'cw-003',
    name: 'Copper Serving Bowl Set',
    category: 'copperware',
    subcategory: 'plates',
    price: 890,
    mrp: 1100,
    rating: 4.6,
    reviewCount: 67,
    image: 'https://images.pexels.com/photos/30937631/pexels-photo-30937631.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/30937631/pexels-photo-30937631.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Set of four handcrafted copper serving bowls with brass rim. Perfect for serving meals or as decorative pieces.',
    features: ['Set of 4 bowls', 'Brass rim detail', 'Handcrafted', 'Food-safe coating'],
    inStock: true,
    stock: 12,
  },
  {
    id: 'cw-004',
    name: 'Copper Gift Hamper',
    category: 'copperware',
    subcategory: 'gift-sets',
    price: 1500,
    mrp: 2000,
    rating: 4.9,
    reviewCount: 41,
    image: 'https://images.pexels.com/photos/5038916/pexels-photo-5038916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/5038916/pexels-photo-5038916.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Beautifully curated copper gift hamper including bottle, glass, tray, and pitcher. An ideal gift for any occasion.',
    features: ['Complete gift set', 'Includes bottle, glass, tray, pitcher', 'Gift-wrapped', 'Premium packaging'],
    inStock: true,
    stock: 8,
    badge: 'Gift Set',
  },

  // Sacred & Spiritual
  {
    id: 'sc-001',
    name: 'Consecrated Rudraksha Mala',
    category: 'sacred',
    subcategory: 'rudraksha',
    price: 750,
    mrp: 950,
    rating: 5.0,
    reviewCount: 34,
    image: 'https://images.pexels.com/photos/2297252/pexels-photo-2297252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/2297252/pexels-photo-2297252.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Authentic five-faced Rudraksha mala, consecrated and energized. Each bead is carefully selected and strung on natural thread.',
    features: ['Authentic Rudraksha', '108 beads', 'Consecrated', 'Natural silk thread'],
    inStock: true,
    stock: 10,
    badge: 'Sacred',
  },
  {
    id: 'sc-002',
    name: 'Natural Incense Sticks — 100 Pack',
    category: 'sacred',
    subcategory: 'incense',
    price: 180,
    mrp: 220,
    rating: 4.6,
    reviewCount: 287,
    image: 'https://images.pexels.com/photos/4971645/pexels-photo-4971645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/4971645/pexels-photo-4971645.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Hand-rolled natural incense sticks made with pure essential oils and herbal powders. Creates a serene and purifying atmosphere.',
    features: ['100 sticks per pack', 'Hand-rolled', 'Natural ingredients', 'Long burning time'],
    inStock: true,
    stock: 45,
  },
  {
    id: 'sc-003',
    name: 'Brass Aarti Stand',
    category: 'sacred',
    subcategory: 'offerings',
    price: 580,
    mrp: 700,
    rating: 4.5,
    reviewCount: 52,
    image: 'https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Traditional brass Aarti stand for daily worship. Hand-crafted by skilled artisans with intricate detailing.',
    features: ['Pure brass', 'Hand-crafted', 'Intricate design', 'Sturdy base'],
    inStock: true,
    stock: 14,
  },
  {
    id: 'sc-004',
    name: 'Meditation Candle Set',
    category: 'sacred',
    subcategory: 'decor',
    price: 420,
    mrp: 520,
    rating: 4.7,
    reviewCount: 88,
    image: 'https://images.pexels.com/photos/6205910/pexels-photo-6205910.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/6205910/pexels-photo-6205910.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'Set of three natural wax candles with essential oil blends. Creates a calming atmosphere for meditation and relaxation.',
    features: ['Set of 3 candles', 'Natural wax', 'Essential oil blends', 'Long burning'],
    inStock: true,
    stock: 20,
  },

  // Books & Wisdom
  {
    id: 'bk-001',
    name: 'Enlightenment — A New Beginning',
    category: 'books',
    subcategory: 'books',
    price: 399,
    mrp: 499,
    rating: 5.0,
    reviewCount: 1,
    image: 'https://images.pexels.com/photos/31373534/pexels-photo-31373534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/31373534/pexels-photo-31373534.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A profound exploration of the spiritual path, offering insights into the nature of existence and the possibility of inner transformation.',
    features: ['Paperback edition', 'English language', '320 pages', 'Includes foreword'],
    inStock: true,
    stock: 25,
    badge: 'New',
  },
  {
    id: 'bk-002',
    name: 'A Taste of Well-Being',
    category: 'books',
    subcategory: 'books',
    price: 350,
    mrp: 450,
    rating: 5.0,
    reviewCount: 6,
    image: 'https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A collection of recipes and wisdom for healthy living. Combines traditional knowledge with practical guidance for everyday wellness.',
    features: ['Hardcover edition', 'Over 100 recipes', 'Full color photography', 'English language'],
    inStock: true,
    stock: 18,
  },
  {
    id: 'bk-003',
    name: 'Yogic Chants — Audio CD',
    category: 'books',
    subcategory: 'music',
    price: 299,
    mrp: 350,
    rating: 4.8,
    reviewCount: 45,
    image: 'https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/30630905/pexels-photo-30630905.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A collection of sacred yogic chants that create a meditative atmosphere. Perfect for daily practice and spiritual gatherings.',
    features: ['Audio CD format', '10 sacred chants', '60 minutes runtime', 'Includes booklet'],
    inStock: true,
    stock: 12,
  },
  {
    id: 'bk-004',
    name: 'Mind & Memory — Digital Guide',
    category: 'books',
    subcategory: 'downloads',
    price: 150,
    mrp: 200,
    rating: 4.5,
    reviewCount: 28,
    image: 'https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    images: ['https://images.pexels.com/photos/5359307/pexels-photo-5359307.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'],
    description: 'A comprehensive digital guide on enhancing mental clarity and memory through yogic practices. Instant download available.',
    features: ['Instant download', 'PDF format', '50+ pages', 'Lifetime access'],
    inStock: true,
    stock: 100,
  },
];

export interface LiveDbInventoryRow {
  product_id: string;
  stock: number;
  unit_price: number;
}

/**
 * Synchronize live database stock and price with the authoritative product catalogue.
 */
export async function syncCatalogWithDatabase(
  supabaseUrl?: string,
  supabaseKey?: string,
  mockDbRows?: LiveDbInventoryRow[]
): Promise<AuthoritativeProduct[]> {
  // Start with a clean deep copy of canonical products
  const products: AuthoritativeProduct[] = CANONICAL_PRODUCTS.map((p) => ({ ...p }));

  let dbRows: LiveDbInventoryRow[] = [];

  if (mockDbRows) {
    dbRows = mockDbRows;
  } else if (supabaseUrl && supabaseKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/catalog_products?select=product_id,stock,unit_price`;
      const res = await fetch(endpoint, {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          dbRows = data;
        }
      }
    } catch {
      // If network call fails, proceed with default authoritative values
    }
  }

  if (dbRows.length > 0) {
    const liveMap = new Map<string, LiveDbInventoryRow>(
      dbRows.map((r) => [r.product_id, r])
    );

    for (const p of products) {
      const live = liveMap.get(p.id);
      if (live) {
        p.price = Number(live.unit_price);
        p.stock = Number(live.stock);
        p.inStock = Number(live.stock) > 0;
      }
    }
  }

  return products;
}

/**
 * Filter and rank products using the validated search query interpretation.
 */
export function searchProducts(
  products: AuthoritativeProduct[],
  interpretation: SearchQueryInterpretation,
  limit = 10
): { matchingProducts: CatalogProductResult[]; totalMatches: number } {
  const { category, minPrice, maxPrice, searchTerms, characteristics } = interpretation;

  // Build lowercase tokens
  const queryTokens = [
    ...(searchTerms || []).map((t) => t.toLowerCase().trim()),
    ...(characteristics || []).map((c) => c.toLowerCase().trim()),
  ].filter((t) => t.length > 0);

  const scored: Array<{ product: AuthoritativeProduct; score: number }> = [];

  for (const product of products) {
    // 1. Category check
    if (category && category !== 'all' && product.category !== category) {
      continue;
    }

    // 2. Min price check
    if (typeof minPrice === 'number' && minPrice >= 0 && product.price < minPrice) {
      continue;
    }

    // 3. Max price check
    if (typeof maxPrice === 'number' && maxPrice >= 0 && product.price > maxPrice) {
      continue;
    }

    // 4. Keyword / characteristic scoring
    let score = 0;

    if (queryTokens.length === 0) {
      // If no specific keyword, matches with baseline score
      score = 1;
    } else {
      const nameLower = product.name.toLowerCase();
      const subcategoryLower = product.subcategory.toLowerCase();
      const descLower = product.description.toLowerCase();
      const featuresLower = (product.features || []).map((f) => f.toLowerCase());

      for (const token of queryTokens) {
        if (nameLower.includes(token)) {
          score += 10;
        }
        if (subcategoryLower.includes(token)) {
          score += 5;
        }
        for (const feat of featuresLower) {
          if (feat.includes(token)) {
            score += 4;
          }
        }
        if (descLower.includes(token)) {
          score += 2;
        }
      }
    }

    if (score > 0) {
      // Boost in-stock products slightly so available items rank first on ties
      if (product.inStock) {
        score += 0.5;
      }
      scored.push({ product, score });
    }
  }

  // Sort by score descending, then rating descending
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.product.rating - a.product.rating;
  });

  const totalMatches = scored.length;
  const safeLimit = Math.max(1, Math.min(24, limit));
  const paged = scored.slice(0, safeLimit).map((item) => {
    const p = item.product;
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory,
      price: p.price,
      mrp: p.mrp,
      rating: p.rating,
      reviewCount: p.reviewCount,
      image: p.image,
      inStock: p.inStock,
      stock: p.stock,
      badge: p.badge,
      features: p.features,
    };
  });

  return { matchingProducts: paged, totalMatches };
}

/**
 * Select the most relevant products to include as context for chat mode.
 */
export function getChatContextProducts(
  products: AuthoritativeProduct[],
  userMessage: string,
  productId?: string,
  maxProducts = 4
): AuthoritativeProduct[] {
  const result: AuthoritativeProduct[] = [];
  const selectedIds = new Set<string>();

  // If specific productId requested, include it first
  if (productId) {
    const directProduct = products.find((p) => p.id === productId);
    if (directProduct) {
      result.push(directProduct);
      selectedIds.add(directProduct.id);
    }
  }

  // Match remaining slots based on message keywords
  const messageLower = userMessage.toLowerCase();
  const scored = products
    .filter((p) => !selectedIds.has(p.id))
    .map((product) => {
      let score = 0;
      const nameTokens = product.name.toLowerCase().split(/\s+/);
      for (const t of nameTokens) {
        if (t.length > 2 && messageLower.includes(t)) {
          score += 5;
        }
      }
      if (messageLower.includes(product.category)) {
        score += 3;
      }
      for (const feat of product.features) {
        const featTokens = feat.toLowerCase().split(/\s+/);
        for (const ft of featTokens) {
          if (ft.length > 3 && messageLower.includes(ft)) {
            score += 2;
          }
        }
      }
      return { product, score };
    })
    .sort((a, b) => b.score - a.score);

  for (const item of scored) {
    if (result.length >= maxProducts) break;
    if (item.score > 0) {
      result.push(item.product);
      selectedIds.add(item.product.id);
    }
  }

  // If still fewer than 2 products, add top bestsellers to keep context rich
  if (result.length < 2) {
    const bestsellers = products.filter((p) => p.badge === 'Bestseller' && !selectedIds.has(p.id));
    for (const b of bestsellers) {
      if (result.length >= maxProducts) break;
      result.push(b);
      selectedIds.add(b.id);
    }
  }

  return result;
}

/**
 * Verify and summarize product IDs referenced by Gemini.
 * Any ID not found in the verified catalogue is filtered out.
 */
export function verifyAndSummarizeProductIds(
  rawIds: string[],
  products: AuthoritativeProduct[]
): { validIds: string[]; summaries: ReferencedProductSummary[] } {
  const productMap = new Map<string, AuthoritativeProduct>(
    products.map((p) => [p.id, p])
  );

  const validIds: string[] = [];
  const summaries: ReferencedProductSummary[] = [];
  const seen = new Set<string>();

  for (const rawId of rawIds) {
    const cleanId = rawId.trim().toLowerCase();
    if (seen.has(cleanId)) continue;
    seen.add(cleanId);

    const product = productMap.get(cleanId);
    if (product) {
      validIds.push(product.id);
      summaries.push({
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        inStock: product.inStock,
        rating: product.rating,
        category: product.category,
      });
    }
  }

  return { validIds, summaries };
}
