import { useEffect, type ReactNode } from 'react';
import { ArrowRight, Heart, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { formatPrice, type Product } from '@/data/products';
import { useCatalogue } from '@/store/CatalogueContext';
import { useStore } from '@/store/StoreContext';

interface PanelProps {
  open: boolean;
  onClose: () => void;
  onViewProduct: (product: Product) => void;
}

interface CartPanelProps extends PanelProps {
  onCheckout: () => void;
}

export function CartPanel({ open, onClose, onCheckout, onViewProduct }: CartPanelProps) {
  const { cart, cartTotal, updateQuantity, removeFromCart, stockByProductId } = useStore();
  const shipping = cartTotal >= 999 || cartTotal === 0 ? 0 : 99;
  const grandTotal = cartTotal + shipping;

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    <SidePanel open={open} onClose={onClose} title="Your Cart">
      {cart.length === 0 ? (
        <EmptyPanel
          icon={<ShoppingBag className="w-8 h-8 text-primary-500" />}
          title="Your cart is empty"
          description="Add something meaningful to your everyday wellbeing."
          onClose={onClose}
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="mb-4 text-xs text-primary-500">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
            <div className="space-y-5">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 border-b border-primary-100 pb-5">
                  <button onClick={() => onViewProduct(product)} className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-primary-50">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onViewProduct(product)} className="line-clamp-2 text-left font-serif text-base font-semibold leading-tight text-primary-900 hover:text-primary-600">
                      {product.name}
                    </button>
                    <p className="mt-1 text-sm font-medium text-primary-700">{formatPrice(product.price)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center rounded-sm border border-primary-200">
                        <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-1.5 text-primary-700 hover:bg-primary-50" aria-label="Decrease quantity">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-7 text-center text-xs font-medium text-primary-900">{quantity}</span>
                        <button onClick={() => updateQuantity(product.id, quantity + 1)} disabled={stockByProductId[product.id] !== undefined && quantity >= stockByProductId[product.id]} className="p-1.5 text-primary-700 hover:bg-primary-50 disabled:cursor-not-allowed disabled:text-primary-300" aria-label="Increase quantity">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(product.id)} className="text-primary-400 hover:text-red-600" aria-label={`Remove ${product.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-primary-100 bg-primary-50 px-5 py-5">
            <div className="mb-2 flex justify-between text-sm text-primary-600">
              <span>Subtotal</span><span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="mb-4 flex justify-between text-sm text-primary-600">
              <span>Shipping</span><span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
            </div>
            <div className="mb-5 flex justify-between border-t border-primary-200 pt-3 font-semibold text-primary-900">
              <span>Total</span><span>{formatPrice(grandTotal)}</span>
            </div>
            <button onClick={onCheckout} className="flex w-full items-center justify-center gap-2 rounded-sm bg-primary-700 px-5 py-3 text-sm font-medium tracking-wide text-white hover:bg-primary-800">
              Continue to Checkout <ArrowRight className="h-4 w-4" />
            </button>
            {cartTotal < 999 && <p className="mt-3 text-center text-xs text-primary-500">Add {formatPrice(999 - cartTotal)} more for free shipping.</p>}
          </div>
        </div>
      )}
    </SidePanel>
  );
}

export function WishlistPanel({ open, onClose, onViewProduct }: PanelProps) {
  const { wishlist, toggleWishlist, addToCart, stockByProductId } = useStore();
  const { products } = useCatalogue();
  const wishedProducts = wishlist.map((id) => products.find((product) => product.id === id)).filter((product): product is Product => Boolean(product));

  return (
    <SidePanel open={open} onClose={onClose} title="Wishlist">
      {wishedProducts.length === 0 ? (
        <EmptyPanel
          icon={<Heart className="w-8 h-8 text-primary-500" />}
          title="Your wishlist is empty"
          description="Save products here when they speak to you."
          onClose={onClose}
        />
      ) : (
        <div className="space-y-4 overflow-y-auto px-5 py-5">
          {wishedProducts.map((product) => (
            <div key={product.id} className="flex gap-3 border-b border-primary-100 pb-4">
              <button onClick={() => onViewProduct(product)} className="h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-primary-50">
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              </button>
              <div className="min-w-0 flex-1">
                <button onClick={() => onViewProduct(product)} className="line-clamp-2 text-left font-serif text-base font-semibold leading-tight text-primary-900 hover:text-primary-600">
                  {product.name}
                </button>
                <p className="mt-1 text-sm font-medium text-primary-700">{formatPrice(product.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <button disabled={stockByProductId[product.id] !== undefined && stockByProductId[product.id] <= 0} onClick={() => addToCart(product)} className="rounded-sm bg-primary-700 px-3 py-2 text-xs font-medium text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:bg-primary-300">
                    {stockByProductId[product.id] !== undefined && stockByProductId[product.id] <= 0 ? 'Out of stock' : 'Add to cart'}
                  </button>
                  <button onClick={() => toggleWishlist(product.id)} className="text-xs text-primary-500 hover:text-red-600">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SidePanel>
  );
}

function SidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <button className="absolute inset-0 h-full w-full cursor-default bg-primary-950/45" onClick={onClose} aria-label="Close panel" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-warmwhite shadow-2xl animate-slide-down sm:w-[420px]">
        <div className="flex items-center justify-between border-b border-primary-100 px-5 py-5">
          <h2 className="font-serif text-2xl font-semibold text-primary-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-primary-600 hover:bg-primary-50" aria-label={`Close ${title.toLowerCase()}`}>
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}

function EmptyPanel({ icon, title, description, onClose }: { icon: ReactNode; title: string; description: string; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">{icon}</div>
      <h3 className="font-serif text-xl font-semibold text-primary-900">{title}</h3>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-primary-500">{description}</p>
      <button onClick={onClose} className="mt-6 rounded-sm bg-primary-700 px-6 py-3 text-sm font-medium text-white hover:bg-primary-800">Continue shopping</button>
    </div>
  );
}
