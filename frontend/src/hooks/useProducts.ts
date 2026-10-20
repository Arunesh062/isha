import { useCallback, useEffect, useState } from 'react';
import type { Product, Category } from '@/data/products';
import { STATIC_PRODUCTS, categories as STATIC_CATEGORIES } from '@/data/products';
import { supabase } from '@/lib/supabase';

interface FullCatalogRow {
  product_id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  unit_price: number;
  mrp: number;
  rating: number;
  review_count: number;
  image: string;
  images: string[];
  features: string[];
  badge: string | null;
  stock: number;
  in_stock: boolean;
}

interface BaseCatalogRow {
  product_id: string;
  stock: number;
  unit_price: number;
}

interface CategoryRow {
  id: string;
  name: string;
  description: string;
  image: string;
  subcategories: { id: string; name: string }[];
  sort_order: number;
}

function fullRowToProduct(row: FullCatalogRow): Product {
  return {
    id: row.product_id,
    name: row.name,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    price: Number(row.unit_price),
    mrp: Number(row.mrp),
    rating: Number(row.rating),
    reviewCount: row.review_count,
    image: row.image,
    images: Array.isArray(row.images) ? row.images : [],
    features: Array.isArray(row.features) ? row.features : [],
    inStock: Boolean(row.in_stock),
    badge: row.badge ?? undefined,
  };
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    subcategories: Array.isArray(row.subcategories) ? row.subcategories : [],
  };
}

export type CatalogueSource = 'supabase-full' | 'supabase-live-prices' | 'static-fallback';

export interface UseProductsResult {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string;
  isFallback: boolean;
  source: CatalogueSource;
  refresh: () => Promise<void>;
}

export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>(STATIC_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [source, setSource] = useState<CatalogueSource>('static-fallback');

  const fetchCatalogue = useCallback(async () => {
    setLoading(true);

    // Tier 1: Attempt to load complete metadata from Supabase
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('catalog_products')
          .select('product_id, name, description, category, subcategory, unit_price, mrp, rating, review_count, image, images, features, badge, stock, in_stock')
          .neq('name', ''),
        supabase
          .from('catalog_categories')
          .select('id, name, description, image, subcategories, sort_order')
          .order('sort_order'),
      ]);

      if (!productsResult.error && !categoriesResult.error && productsResult.data && productsResult.data.length > 0) {
        const dbProducts = (productsResult.data as FullCatalogRow[]).map(fullRowToProduct);
        const dbCategories = (categoriesResult.data as CategoryRow[]).map(rowToCategory);

        setProducts(dbProducts);
        if (dbCategories.length > 0) {
          setCategories(dbCategories);
        }
        setError('');
        setIsFallback(false);
        setSource('supabase-full');
        setLoading(false);
        return;
      }
    } catch {
      // Tier 1 query failed (e.g. columns do not exist yet on remote table)
    }

    // Tier 2: Resilient Schema Sync — synchronize live prices & stock from base catalog table
    try {
      const { data: baseRows, error: baseError } = await supabase
        .from('catalog_products')
        .select('product_id, stock, unit_price');

      if (!baseError && baseRows && baseRows.length > 0) {
        const livePriceAndStockMap = new Map<string, BaseCatalogRow>(
          (baseRows as BaseCatalogRow[]).map((row) => [row.product_id, row])
        );

        // Overlay live prices and stock on top of static product definitions
        const synchronizedProducts = STATIC_PRODUCTS.map((staticItem) => {
          const liveData = livePriceAndStockMap.get(staticItem.id);
          if (!liveData) return staticItem;

          return {
            ...staticItem,
            price: Number(liveData.unit_price),
            inStock: liveData.stock > 0,
          };
        });

        setProducts(synchronizedProducts);
        setCategories(STATIC_CATEGORIES);
        setError('Catalogue metadata using local definitions; prices and stock synchronized with live database.');
        setIsFallback(true);
        setSource('supabase-live-prices');
        setLoading(false);
        return;
      }
    } catch {
      // Tier 2 query failed (e.g. network completely unreachable)
    }

    // Tier 3: Complete Offline Fallback
    setProducts(STATIC_PRODUCTS);
    setCategories(STATIC_CATEGORIES);
    setError('Could not connect to database. Displaying cached offline catalogue.');
    setIsFallback(true);
    setSource('static-fallback');
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchCatalogue().then(() => {
      if (cancelled) return;
    });

    return () => {
      cancelled = true;
    };
  }, [fetchCatalogue]);

  return {
    products,
    categories,
    loading,
    error,
    isFallback,
    source,
    refresh: fetchCatalogue,
  };
}
