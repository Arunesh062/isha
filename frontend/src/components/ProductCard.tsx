import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@/data/products';
import { formatPrice } from '@/data/products';
import { useStore } from '@/store/StoreContext';

interface ProductCardProps {
  product: Product;
  onView: (product: Product) => void;
}

export default function ProductCard({ product, onView }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist, stockByProductId } = useStore();
  const wished = isInWishlist(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const inStock = stockByProductId[product.id] !== undefined ? stockByProductId[product.id] > 0 : product.inStock;

  return (
    <div className="group bg-white rounded-sm overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden bg-primary-50 cursor-pointer"
        onClick={() => onView(product)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.badge && (
            <span className="bg-primary-700 text-white text-[10px] font-medium px-2.5 py-1 rounded-sm tracking-wide">
              {product.badge}
            </span>
          )}
          {discount > 0 && (
            <span className="bg-accent-500 text-white text-[10px] font-medium px-2.5 py-1 rounded-sm tracking-wide">
              {discount}% OFF
            </span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`w-4.5 h-4.5 transition-all ${
              wished ? 'fill-red-500 text-red-500' : 'text-primary-600'
            }`}
          />
        </button>
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-primary-900 text-white text-xs px-4 py-2 rounded-sm">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 mb-1.5">
          <Star className="w-3.5 h-3.5 fill-accent-400 text-accent-400" />
          <span className="text-xs text-primary-600 font-medium">{product.rating}</span>
          <span className="text-xs text-primary-400">({product.reviewCount})</span>
        </div>
        <h3
          className="font-serif text-sm md:text-base font-medium text-primary-900 leading-snug cursor-pointer hover:text-primary-600 transition-colors line-clamp-2"
          onClick={() => onView(product)}
        >
          {product.name}
        </h3>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-sans font-semibold text-primary-900 text-base">
              {formatPrice(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-xs text-primary-400 line-through">
                {formatPrice(product.mrp)}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={!inStock}
            className="w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 disabled:bg-primary-200 disabled:cursor-not-allowed transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
