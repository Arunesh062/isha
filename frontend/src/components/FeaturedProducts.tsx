import { ArrowRight } from 'lucide-react';
import type { Product } from '@/data/products';
import { useCatalogue } from '@/store/CatalogueContext';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
  title: string;
  subtitle?: string;
  filterFn: (product: Product) => boolean;
  limit?: number;
  onView: (product: Product) => void;
  onNavigate: (page: string) => void;
  viewAllTarget?: string;
}

export default function FeaturedProducts({
  title,
  subtitle,
  filterFn,
  limit = 4,
  onView,
  onNavigate,
  viewAllTarget,
}: FeaturedProductsProps) {
  const { products } = useCatalogue();
  const filtered = products.filter(filterFn).slice(0, limit);

  if (filtered.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-cream">
      <div className="container-custom">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary-900">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-primary-500 mt-1">{subtitle}</p>}
          </div>
          {viewAllTarget && (
            <button
              onClick={() => onNavigate(viewAllTarget)}
              className="flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onView={onView} />
          ))}
        </div>
      </div>
    </section>
  );
}
