import { useState } from 'react';
import { Heart, ShoppingCart, User, Search, Menu, X, ChevronDown, Phone, Truck, Zap, Sparkles } from 'lucide-react';
import { useCatalogue } from '@/store/CatalogueContext';
import { useStore } from '@/store/StoreContext';

interface HeaderProps {
  onNavigate: (page: string) => void;
  currentPage: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
}

export default function Header({
  onNavigate,
  currentPage,
  searchQuery,
  onSearchChange,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const { cartCount, wishlist } = useStore();
  const { categories, products } = useCatalogue();

  const handleCategoryClick = (categoryId: string) => {
    onNavigate(`shop:${categoryId}`);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      onNavigate(`shop:search:${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      {/* Independent Unofficial Demonstration Banner */}
      <div className="bg-amber-950 text-amber-200 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium border-b border-amber-900 flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Independent Unofficial Demonstration · Not affiliated with or authorized by Isha Life</span>
      </div>

      {/* Announcement Bar */}
      <div className="bg-primary-900 text-cream text-xs sm:text-sm py-2 overflow-hidden">
        <div className="container-custom flex items-center justify-center gap-6 text-center">
          <span className="hidden sm:flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" /> Free shipping on orders above ₹999
          </span>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> 8010 479480 · Mon–Sat 10AM–5PM
          </span>
          <span className="hidden md:flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> COD available above ₹3000
          </span>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-warmwhite border-b border-primary-100 sticky top-0 z-50 shadow-sm">
        <div className="container-custom">
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden text-primary-800"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 shrink-0"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-xs">
                <span className="font-serif text-white text-xl font-bold">I</span>
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-2xl font-bold text-primary-900 leading-none">Isha</span>
                  <span className="text-[9px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">Demo</span>
                </div>
                <div className="text-[10px] tracking-[0.2em] text-primary-500 uppercase">Life</div>
              </div>
            </button>

            {/* Search bar - desktop */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden md:flex flex-1 max-w-2xl mx-4 lg:mx-8"
            >
              <div className="relative w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onBlur={() => setTimeout(() => setSearchOpen(false), 250)}
                  placeholder="Search products or natural language (e.g. 'copper bottle under 800')..."
                  className="w-full bg-primary-50 border border-primary-200 rounded-sm pl-4 pr-12 py-2.5 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary-400 hover:text-primary-700 transition-colors"
                  aria-label="Submit search"
                >
                  <Search className="w-5 h-5" />
                </button>
                {searchOpen && searchQuery.trim() && (() => {
                  const q = searchQuery.toLowerCase();
                  const matchedCategories = categories.filter((c) => c.name.toLowerCase().includes(q));
                  const matchedProducts = products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
                  return (
                    <div className="absolute top-full mt-1 w-full bg-white border border-primary-200 rounded-sm shadow-lg max-h-72 overflow-y-auto z-50 animate-slide-down">
                      {/* AI Search Action */}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          onNavigate(`shop:search:${encodeURIComponent(searchQuery.trim())}`);
                          setSearchOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-primary-800 bg-primary-50/90 hover:bg-primary-100 flex items-center justify-between border-b border-primary-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                          <span>Search with AI for <strong className="font-serif text-sm">"{searchQuery.trim()}"</strong></span>
                        </div>
                        <span className="text-[10px] text-primary-500 font-sans uppercase tracking-wider">Natural Language</span>
                      </button>

                      {matchedCategories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { onNavigate(`shop:${c.id}`); onSearchChange(''); setSearchOpen(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          <span className="text-xs text-primary-400 mr-2">Category</span> {c.name}
                        </button>
                      ))}
                      {matchedProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { onNavigate(`product:${p.id}`); onSearchChange(''); setSearchOpen(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-primary-700 hover:bg-primary-50"
                        >
                          {p.name} <span className="text-xs text-primary-400 ml-1">{p.price ? `₹${p.price}` : ''}</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </form>


            {/* Action icons */}
            <div className="flex items-center gap-3 sm:gap-5 shrink-0">
              <button
                className="md:hidden text-primary-800"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenAuth}
                className="flex flex-col items-center text-primary-800 hover:text-primary-600 transition-colors"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="hidden sm:block text-[10px] mt-0.5">Account</span>
              </button>
              <button
                onClick={onOpenWishlist}
                className="relative flex flex-col items-center text-primary-800 hover:text-primary-600 transition-colors"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
                <span className="hidden sm:block text-[10px] mt-0.5">Wishlist</span>
              </button>
              <button
                onClick={onOpenCart}
                className="relative flex flex-col items-center text-primary-800 hover:text-primary-600 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
                <span className="hidden sm:block text-[10px] mt-0.5">Cart</span>
              </button>
            </div>
          </div>

          {/* Mobile search */}
          {searchOpen && (
            <form onSubmit={handleSearchSubmit} className="md:hidden pb-3 animate-slide-down">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search products or natural language..."
                  className="w-full bg-primary-50 border border-primary-200 rounded-sm pl-4 pr-12 py-2.5 text-sm text-primary-900 placeholder-primary-400 focus:outline-none focus:border-primary-500"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-primary-400 hover:text-primary-700"
                  aria-label="Submit search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          )}


          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center justify-center gap-1 py-3 border-t border-primary-100">
            <button
              onClick={() => onNavigate('home')}
              className={`px-4 py-2 text-sm font-medium tracking-wide hover:text-primary-600 transition-colors ${
                currentPage === 'home' ? 'text-primary-600' : 'text-primary-800'
              }`}
            >
              Home
            </button>
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="relative"
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <button
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-4 py-2 text-sm font-medium tracking-wide hover:text-primary-600 transition-colors flex items-center gap-1 ${
                    currentPage === `shop:${cat.id}` ? 'text-primary-600' : 'text-primary-800'
                  }`}
                >
                  {cat.name}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {hoveredCategory === cat.id && (
                  <div className="absolute top-full left-0 bg-white border border-primary-100 shadow-xl rounded-sm py-3 min-w-[200px] z-50 animate-slide-down">
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onNavigate(`shop:${cat.id}:${sub.id}`);
                          setHoveredCategory(null);
                        }}
                        className="block w-full text-left px-5 py-2 text-sm text-primary-700 hover:bg-primary-50 hover:text-primary-900 transition-colors"
                      >
                        {sub.name}
                      </button>
                    ))}
                    <div className="border-t border-primary-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          onNavigate(`shop:${cat.id}`);
                          setHoveredCategory(null);
                        }}
                        className="block w-full text-left px-5 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                      >
                        View All {cat.name}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button
              onClick={() => onNavigate('shop:all')}
              className="px-4 py-2 text-sm font-medium tracking-wide hover:text-primary-600 transition-colors text-primary-800"
            >
              All Products
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[80%] bg-warmwhite shadow-2xl overflow-y-auto animate-slide-down">
            <div className="flex items-center justify-between p-4 border-b border-primary-100">
              <span className="font-serif text-xl font-bold text-primary-900">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
                <X className="w-6 h-6 text-primary-800" />
              </button>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-5 py-3 text-sm font-medium text-primary-800 hover:bg-primary-50"
              >
                Home
              </button>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    className="block w-full text-left px-5 py-3 text-sm font-medium text-primary-800 hover:bg-primary-50"
                  >
                    {cat.name}
                  </button>
                  <div className="pl-8">
                    {cat.subcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onNavigate(`shop:${cat.id}:${sub.id}`);
                          setMobileMenuOpen(false);
                        }}
                        className="block w-full text-left px-5 py-2 text-xs text-primary-600 hover:bg-primary-50"
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  onNavigate('shop:all');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-5 py-3 text-sm font-medium text-primary-800 hover:bg-primary-50 border-t border-primary-100 mt-2"
              >
                All Products
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
