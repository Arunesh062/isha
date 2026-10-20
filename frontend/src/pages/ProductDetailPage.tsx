import { useState } from 'react';
import { ArrowLeft, Check, Heart, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@/data/products';
import { formatPrice } from '@/data/products';
import { useStore } from '@/store/StoreContext';

interface ProductDetailPageProps { product: Product; onBack: () => void; }

export default function ProductDetailPage({ product, onBack }: ProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);
  const { addToCart, toggleWishlist, isInWishlist, stockByProductId } = useStore();
  const wished = isInWishlist(product.id);
  const discount = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const availableStock = stockByProductId[product.id];
  const inStock = availableStock === undefined ? product.inStock : availableStock > 0;
  const maxQty = availableStock !== undefined ? availableStock : 99;

  return (
    <section className="bg-cream py-8 md:py-14"><div className="container-custom">
      <button onClick={onBack} className="mb-8 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-900"><ArrowLeft className="h-4 w-4" /> Back to shopping</button>
      <div className="grid gap-10 md:grid-cols-2 md:gap-14"><div className="relative overflow-hidden rounded-sm bg-primary-50"><img src={product.image} alt={product.name} className="aspect-square h-full w-full object-cover" />{discount > 0 && <span className="absolute left-4 top-4 rounded-sm bg-accent-500 px-3 py-1.5 text-xs font-medium text-white">{discount}% OFF</span>}</div>
        <div className="flex flex-col justify-center"><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent-400 text-accent-400" /><span className="text-sm font-medium text-primary-700">{product.rating}</span><span className="text-sm text-primary-400">({product.reviewCount} reviews)</span></div><h1 className="mt-3 font-serif text-4xl font-semibold leading-tight text-primary-900">{product.name}</h1><div className="mt-5 flex items-baseline gap-3"><span className="text-2xl font-semibold text-primary-900">{formatPrice(product.price)}</span><span className="text-base text-primary-400 line-through">{formatPrice(product.mrp)}</span></div><p className="mt-6 text-base leading-relaxed text-primary-600">{product.description}</p><div className="mt-6 space-y-3">{product.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm text-primary-700"><Check className="h-4 w-4 text-sage-600" />{feature}</div>)}</div><div className="mt-8 flex flex-wrap items-center gap-3"><div className="flex items-center rounded-sm border border-primary-200 bg-white"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 text-primary-700"><Minus className="h-4 w-4" /></button><span className="min-w-9 text-center text-sm font-medium">{quantity}</span><button onClick={() => setQuantity(Math.min(quantity + 1, maxQty))} disabled={quantity >= maxQty} className="p-3 text-primary-700 disabled:cursor-not-allowed disabled:text-primary-300"><Plus className="h-4 w-4" /></button></div><button disabled={!inStock} onClick={() => addToCart(product, quantity)} className="inline-flex flex-1 items-center justify-center gap-2 rounded-sm bg-primary-700 px-6 py-3.5 text-sm font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-primary-300"><ShoppingCart className="h-4 w-4" />{inStock ? 'Add to cart' : 'Out of stock'}</button><button onClick={() => toggleWishlist(product.id)} className="rounded-sm border border-primary-200 bg-white p-3.5 text-primary-700 hover:border-primary-500" aria-label="Toggle wishlist"><Heart className={wished ? 'fill-red-500 text-red-500' : ''} /></button></div>{inStock && availableStock !== undefined && <p className="mt-2 text-xs text-primary-500">{availableStock} left in stock</p>}<p className="mt-5 text-xs text-primary-500">Free shipping on orders above ₹999 · Secure checkout · Easy support</p></div>
      </div>
    </div></section>
  );
}
