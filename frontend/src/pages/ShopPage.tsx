import { useMemo, useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, X, Sparkles, AlertCircle } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCatalogue } from '@/store/CatalogueContext';
import ProductCard from '@/components/ProductCard';
import { executeAiSearch, AiServiceError } from '@/features/ai-assistant/aiService';
import type { AiSearchResponse } from '@/types/ai';

interface ShopPageProps {
  target: string;
  onView: (product: Product) => void;
}

export default function ShopPage({ target, onView }: ShopPageProps) {
  const { products, categories, loading, error } = useCatalogue();
  const [sort, setSort] = useState('featured');
  const [priceFilter, setPriceFilter] = useState('all');
  const [mobileFilters, setMobileFilters] = useState(false);

  // Check if target is a search query
  const isSearchTarget = target.startsWith('shop:search:');
  const searchQuery = isSearchTarget ? decodeURIComponent(target.slice('shop:search:'.length)).trim() : '';

  // AI search state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiSearchResponse | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Category & Subcategory parsing when not searching
  const [, categoryId, subcategoryId] = !isSearchTarget ? target.split(':') : ['', '', ''];
  const category = categories.find((item) => item.id === categoryId);

  // Trigger AI search whenever search query changes
  useEffect(() => {
    if (!isSearchTarget || !searchQuery) {
      setAiResult(null);
      setAiError(null);
      setAiLoading(false);
      setUseFallback(false);
      return;
    }

    let isMounted = true;
    setAiLoading(true);
    setAiError(null);
    setUseFallback(false);

    executeAiSearch({ query: searchQuery })
      .then((res) => {
        if (!isMounted) return;
        setAiResult(res);
        setAiLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg = err instanceof AiServiceError ? err.message : 'Unable to complete AI search.';
        setAiError(msg);
        setAiLoading(false);
        // Automatically activate fallback keyword search on error
        setUseFallback(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isSearchTarget, searchQuery]);

  // Standard keyword fallback matching
  const standardKeywordMatches = useMemo(() => {
    if (!searchQuery) return [];
    const q = searchQuery.toLowerCase();
    const queryTokens = q.split(/\s+/).filter((t) => t.length > 1);

    return products.filter((product) => {
      const name = product.name.toLowerCase();
      const desc = product.description.toLowerCase();
      const cat = product.category.toLowerCase();
      const subcat = product.subcategory.toLowerCase();
      const feats = product.features.map((f) => f.toLowerCase()).join(' ');

      // Direct match
      if (name.includes(q) || desc.includes(q) || cat.includes(q) || subcat.includes(q)) {
        return true;
      }

      // Token match
      return queryTokens.some((tok) => name.includes(tok) || desc.includes(tok) || feats.includes(tok));
    });
  }, [products, searchQuery]);

  // Compute final product list to display
  const displayedProducts = useMemo(() => {
    let sourceList: Product[] = [];

    if (isSearchTarget) {
      if (!useFallback && aiResult && aiResult.products.length > 0) {
        // Map backend AI products to local catalogue products with live price/stock
        sourceList = aiResult.products.map((aiProd) => {
          const localMatch = products.find((p) => p.id === aiProd.id);
          if (localMatch) {
            return {
              ...localMatch,
              price: aiProd.price,
              inStock: aiProd.inStock,
              badge: aiProd.badge || localMatch.badge,
            };
          }
          return {
            id: aiProd.id,
            name: aiProd.name,
            category: aiProd.category,
            subcategory: aiProd.subcategory,
            price: aiProd.price,
            mrp: aiProd.mrp,
            rating: aiProd.rating,
            reviewCount: aiProd.reviewCount,
            image: aiProd.image,
            images: [aiProd.image],
            description: `${aiProd.name} from our ${aiProd.category} collection.`,
            features: aiProd.features || [],
            inStock: aiProd.inStock,
            badge: aiProd.badge,
          };
        });
      } else {
        // Use standard keyword matches
        sourceList = standardKeywordMatches;
      }
    } else {
      // Standard category / subcategory browsing
      sourceList = products.filter((product) => {
        const matchesCategory = !categoryId || categoryId === 'all' || product.category === categoryId;
        const matchesSubcategory = !subcategoryId || product.subcategory === subcategoryId;
        return matchesCategory && matchesSubcategory;
      });
    }

    // Apply price filter
    const priceFiltered = sourceList.filter((product) => {
      if (priceFilter === 'under-500') return product.price < 500;
      if (priceFilter === '500-1000') return product.price >= 500 && product.price <= 1000;
      if (priceFilter === 'over-1000') return product.price > 1000;
      return true;
    });

    // Apply sort
    return [...priceFiltered].sort((a, b) => {
      if (sort === 'price-low') return a.price - b.price;
      if (sort === 'price-high') return b.price - a.price;
      if (sort === 'rating') return b.rating - a.rating;
      return Number(Boolean(b.badge)) - Number(Boolean(a.badge));
    });
  }, [
    isSearchTarget,
    useFallback,
    aiResult,
    standardKeywordMatches,
    products,
    categoryId,
    subcategoryId,
    priceFilter,
    sort,
  ]);

  if (loading) {
    return (
      <section className="bg-cream py-20 text-center">
        <p className="text-sm text-primary-500">Loading catalogue…</p>
      </section>
    );
  }

  if (error && products.length === 0) {
    return (
      <section className="bg-cream py-20 text-center">
        <p className="text-sm text-accent-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="bg-cream py-10 md:py-14">
      <div className="container-custom">
        {/* Page Heading */}
        <div className="mb-8 border-b border-primary-100 pb-6">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-500">
            {isSearchTarget ? 'Intelligent Search' : 'Sattva Life catalogue'}
          </p>
          <h1 className="mt-2 font-serif text-3xl md:text-4xl font-semibold text-primary-900">
            {isSearchTarget
              ? `Search: "${searchQuery}"`
              : category?.name ?? 'All Products'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-primary-600">
            {isSearchTarget
              ? 'Results interpreted through Sattva Life natural language search and inventory validation.'
              : category?.description ?? 'Explore products inspired by natural living and everyday wellbeing.'}
          </p>
        </div>

        {/* AI Interpretation Banner (When searching) */}
        {isSearchTarget && (
          <div className="mb-8">
            {aiLoading ? (
              <div className="bg-white border border-primary-200/80 rounded-sm p-4 shadow-xs flex items-center gap-3">
                <div className="flex gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-primary-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm font-serif italic text-primary-700">
                  Interpreting query and verifying live inventory...
                </span>
              </div>
            ) : aiError ? (
              <div className="bg-accent-50 border border-accent-200 rounded-sm p-4 flex items-start sm:items-center justify-between gap-3 text-sm text-primary-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-accent-600 shrink-0" />
                  <span>
                    AI search notice: {aiError} Displaying standard keyword catalogue search below.
                  </span>
                </div>
              </div>
            ) : aiResult ? (
              <div className="bg-white border border-primary-200/90 rounded-sm p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0 text-primary-700 mt-0.5 sm:mt-0">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-primary-800">
                      <span className="font-semibold text-primary-900">AI Intent:</span>
                      {aiResult.queryInterpretation.category && (
                        <span className="bg-primary-50 border border-primary-200 text-primary-700 px-2 py-0.5 rounded text-[11px]">
                          Category: {aiResult.queryInterpretation.category}
                        </span>
                      )}
                      {aiResult.queryInterpretation.maxPrice !== null && (
                        <span className="bg-primary-50 border border-primary-200 text-primary-700 px-2 py-0.5 rounded text-[11px]">
                          Max: ₹{aiResult.queryInterpretation.maxPrice}
                        </span>
                      )}
                      {aiResult.queryInterpretation.minPrice !== null && (
                        <span className="bg-primary-50 border border-primary-200 text-primary-700 px-2 py-0.5 rounded text-[11px]">
                          Min: ₹{aiResult.queryInterpretation.minPrice}
                        </span>
                      )}
                      {aiResult.queryInterpretation.searchTerms.length > 0 && (
                        <span className="text-primary-600">
                          Keywords: {aiResult.queryInterpretation.searchTerms.join(', ')}
                        </span>
                      )}
                    </div>
                    {aiResult.products.length === 0 && (
                      <p className="text-xs text-accent-700 mt-1">
                        No products matched strict criteria. Showing standard keyword search results.
                      </p>
                    )}
                  </div>
                </div>

                {/* Fallback switcher */}
                {aiResult.products.length > 0 && (
                  <button
                    onClick={() => setUseFallback(!useFallback)}
                    className="text-xs font-medium text-primary-600 hover:text-primary-900 underline shrink-0 self-start sm:self-auto"
                  >
                    {useFallback ? 'Switch to AI results' : 'Switch to standard keyword search'}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}

        {/* Filters and Controls */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-primary-600">
            <span className="font-medium text-primary-900">{displayedProducts.length}</span>{' '}
            {displayedProducts.length === 1 ? 'product' : 'products'}
            {isSearchTarget && !useFallback && aiResult && (
              <span className="text-xs text-sage-700 bg-sage-50 px-2 py-0.5 rounded ml-1 border border-sage-200">
                AI Verified
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <button
              onClick={() => setMobileFilters(!mobileFilters)}
              className="inline-flex items-center gap-2 rounded-sm border border-primary-200 bg-white px-4 py-2.5 text-sm text-primary-700 md:hidden"
            >
              <Filter className="h-4 w-4" /> Filters
            </button>
            <label className="flex items-center gap-2 text-sm text-primary-600">
              <span className="hidden sm:inline">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-sm border border-primary-200 bg-white px-3 py-2.5 text-sm text-primary-800 outline-none"
              >
                <option value="featured">Featured</option>
                <option value="rating">Top rated</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>

        {/* Content Grid */}
        <div className="mt-7 grid gap-8 md:grid-cols-[220px_1fr]">
          {/* Aside Filters */}
          <aside
            className={`${mobileFilters ? 'block' : 'hidden'} rounded-sm border border-primary-100 bg-white p-5 md:block`}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold text-primary-900">Filter by</h2>
              <button onClick={() => setMobileFilters(false)} className="md:hidden">
                <X className="h-4 w-4 text-primary-500" />
              </button>
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-500">Price</p>
              {[
                ['all', 'All prices'],
                ['under-500', 'Under ₹500'],
                ['500-1000', '₹500 – ₹1,000'],
                ['over-1000', 'Above ₹1,000'],
              ].map(([value, label]) => (
                <label key={value} className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-primary-700">
                  <input
                    type="radio"
                    name="price"
                    value={value}
                    checked={priceFilter === value}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="accent-primary-600"
                  />
                  {label}
                </label>
              ))}
            </div>

            {category && !isSearchTarget && (
              <div className="mt-7 border-t border-primary-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-primary-500">Category</p>
                {category.subcategories.map((sub) => (
                  <div key={sub.id} className="mb-2 text-sm text-primary-600">
                    {sub.name}
                  </div>
                ))}
              </div>
            )}
          </aside>

          {/* Product Cards Grid */}
          <div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} onView={onView} />
              ))}
            </div>

            {/* Empty State */}
            {displayedProducts.length === 0 && !aiLoading && (
              <div className="py-20 text-center bg-white rounded border border-primary-100 p-8 mt-4">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-primary-400" />
                <h2 className="mt-4 font-serif text-2xl font-semibold text-primary-900">
                  No matching products found
                </h2>
                <p className="mt-2 text-sm text-primary-500 max-w-md mx-auto">
                  {isSearchTarget
                    ? `We could not find any products matching "${searchQuery}". Try different keywords or browse all products.`
                    : 'Try clearing or relaxing your price filters to see available products.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
