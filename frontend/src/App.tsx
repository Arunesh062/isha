import { useState } from 'react';
import { StoreProvider } from '@/store/StoreContext';
import { CatalogueProvider, useCatalogue } from '@/store/CatalogueContext';
import { AuthProvider } from '@/auth/AuthContext';
import type { Product } from '@/data/products';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import TrustBadges from '@/components/TrustBadges';
import CategoryShowcase from '@/components/CategoryShowcase';
import FeaturedProducts from '@/components/FeaturedProducts';
import PromoBanner from '@/components/PromoBanner';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import { CartPanel, WishlistPanel } from '@/components/ShoppingPanels';
import AuthModal from '@/components/AuthModal';
import AiChatPanel from '@/features/ai-assistant/AiChatPanel';
import ShopPage from '@/pages/ShopPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrdersPage from '@/pages/OrdersPage';
import AdminPage from '@/pages/AdminPage';

function App() {
  return (
    <AuthProvider>
      <CatalogueProvider>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </CatalogueProvider>
    </AuthProvider>
  );
}

function AppShell() {
  const [currentPage, setCurrentPage] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { products } = useCatalogue();

  const navigate = (page: string) => {
    setCurrentPage(page);
    setCartOpen(false);
    setWishlistOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const viewProduct = (product: Product) => navigate(`product:${product.id}`);
  const viewProductById = (productId: string) => navigate(`product:${productId}`);
  const pageType = currentPage.split(':')[0];
  const currentProduct = pageType === 'product' ? products.find((product) => product.id === currentPage.split(':')[1]) : undefined;
  const isHome = currentPage === 'home';

  return (
    <div className="min-h-screen flex flex-col">
      <Header onNavigate={navigate} currentPage={currentPage} searchQuery={searchQuery} onSearchChange={setSearchQuery} onOpenCart={() => setCartOpen(true)} onOpenWishlist={() => setWishlistOpen(true)} onOpenAuth={() => setAuthOpen(true)} />
      <main className="flex-1">
        {isHome && <HomePage onNavigate={navigate} onViewProduct={viewProduct} />}
        {pageType === 'shop' && <ShopPage target={currentPage} onView={viewProduct} />}
        {pageType === 'product' && currentProduct && <ProductDetailPage product={currentProduct} onBack={() => navigate('shop:all')} />}
        {pageType === 'checkout' && <CheckoutPage onNavigate={navigate} />}
        {pageType === 'orders' && <OrdersPage onNavigate={navigate} />}
        {pageType === 'admin' && <AdminPage onNavigate={navigate} />}
        {!isHome && pageType === 'product' && !currentProduct && <ShopPage target="shop:all" onView={viewProduct} />}
      </main>
      <Footer onNavigate={navigate} />
      <CartPanel open={cartOpen} onClose={() => setCartOpen(false)} onCheckout={() => navigate('checkout')} onViewProduct={viewProduct} />
      <WishlistPanel open={wishlistOpen} onClose={() => setWishlistOpen(false)} onViewProduct={viewProduct} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AiChatPanel onViewProduct={viewProductById} currentProductId={currentProduct?.id} />
    </div>
  );
}


interface HomePageProps { onNavigate: (page: string) => void; onViewProduct: (product: Product) => void; }

function HomePage({ onNavigate, onViewProduct }: HomePageProps) {
  return <>
    <Hero onShopNow={() => onNavigate('shop:all')} />
    <TrustBadges />
    <CategoryShowcase onNavigate={onNavigate} />
    <FeaturedProducts title="Bestsellers" subtitle="Our most-loved products, chosen by our community" filterFn={(product) => product.badge === 'Bestseller'} onView={onViewProduct} onNavigate={onNavigate} viewAllTarget="shop:all" />
    <PromoBanner onNavigate={onNavigate} />
    <FeaturedProducts title="New Arrivals" subtitle="Fresh additions to our collection" filterFn={(product) => product.badge === 'New'} onView={onViewProduct} onNavigate={onNavigate} viewAllTarget="shop:all" />
    <FeaturedProducts title="Food & Wellness" subtitle="Nourish your body with natural goodness" filterFn={(product) => product.category === 'food-wellness'} onView={onViewProduct} onNavigate={onNavigate} viewAllTarget="shop:food-wellness" />
    <FeaturedProducts title="Yoga & Meditation Essentials" filterFn={(product) => product.category === 'yoga'} onView={onViewProduct} onNavigate={onNavigate} viewAllTarget="shop:yoga" />
    <Newsletter />
  </>;
}

export default App;
