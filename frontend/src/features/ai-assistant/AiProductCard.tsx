import { useState } from 'react';
import { Star, ArrowUpRight, AlertCircle } from 'lucide-react';
import type { ReferencedProductSummary } from '@/types/ai';

interface AiProductCardProps {
  product: ReferencedProductSummary;
  onViewProduct?: (productId: string) => void;
}

export default function AiProductCard({ product, onViewProduct }: AiProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formattedPrice = `₹${product.price.toLocaleString('en-IN')}`;
  const formattedMrp = product.mrp ? `₹${product.mrp.toLocaleString('en-IN')}` : undefined;

  const handleClick = () => {
    if (onViewProduct) {
      onViewProduct(product.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className="group flex items-center gap-3 p-2.5 bg-white rounded border border-primary-200/80 hover:border-primary-400 hover:shadow-md transition-all duration-200 cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      aria-label={`View product: ${product.name}`}
    >
      {/* Product Thumbnail */}
      <div className="relative w-14 h-14 rounded overflow-hidden bg-primary-50 shrink-0 border border-primary-100">
        {!imageError && product.image ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        )}

        {!product.inStock && (
          <div className="absolute inset-0 bg-primary-950/60 flex items-center justify-center">
            <span className="text-[9px] font-medium text-white px-1 py-0.5 uppercase tracking-wider">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-serif font-medium text-primary-900 line-clamp-1 group-hover:text-primary-700 transition-colors">
          {product.name}
        </h4>

        {/* Rating and Stock */}
        <div className="flex items-center gap-2 mt-0.5">
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 text-accent-600 text-[11px]">
              <Star className="w-3 h-3 fill-accent-400 text-accent-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          )}
          <span className={`text-[10px] font-medium ${product.inStock ? 'text-sage-700' : 'text-accent-700'}`}>
            {product.inStock ? 'In Stock' : 'Currently Unavailable'}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-xs font-semibold text-primary-900 font-sans">
            {formattedPrice}
          </span>
          {formattedMrp && product.mrp && product.mrp > product.price && (
            <span className="text-[10px] text-primary-400 line-through">
              {formattedMrp}
            </span>
          )}
        </div>
      </div>

      {/* Action link icon */}
      <div className="shrink-0 text-primary-400 group-hover:text-primary-700 transition-colors pr-1">
        <ArrowUpRight className="w-4 h-4" />
      </div>
    </div>
  );
}
