import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingBag, User, Package, Search, X, Heart,
  Home as HomeIcon, Shirt, Smartphone, Sofa, Sparkles, Tv, Watch,
  ChevronRight, Truck, RotateCcw, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, CartItem } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { ProductCard } from '@/components/ProductCard';
import { ProductDetail } from '@/components/ProductDetail';
import { CartDrawer } from '@/components/CartDrawer';
import { AuthModal } from '@/components/AuthModal';
import { CheckoutModal } from '@/components/CheckoutModal';
import { OrdersModal } from '@/components/OrdersModal';
import { WishlistDrawer } from '@/components/WishlistDrawer';
import { DealsBanner } from '@/components/DealsBanner';
import { FilterSidebar } from '@/components/FilterSidebar';
import { InfoModal, type InfoModalType } from '@/components/InfoModal';

type View = 'home' | 'shop' | 'product';

const categoryIcons: Record<string, typeof Smartphone> = {
  Electronics: Smartphone,
  Fashion: Shirt,
  Home: Sofa,
  Beauty: Sparkles,
  Appliances: Tv,
};

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Rating: High to Low' },
  { value: 'discount', label: 'Discount: High to Low' },
] as const;

type SortValue = (typeof sortOptions)[number]['value'];

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<InfoModalType | null>(null);

  const { count } = useCart();
  const { session, signOut } = useAuth();
  const { items: wishlistItems } = useWishlist();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data) {
        setProducts(data as Product[]);
        const max = Math.max(...(data as Product[]).map((p) => p.price_cents));
        setPriceRange([0, max]);
      }
      setLoading(false);
    })();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const brands = useMemo(
    () =>
      [...new Set(
        products
          .filter((p) => !activeCategory || p.category === activeCategory)
          .map((p) => p.brand)
      )].sort(),
    [products, activeCategory]
  );

  const maxPrice = useMemo(
    () => Math.max(...products.map((p) => p.price_cents), 100000),
    [products]
  );

  const featured = useMemo(() => products.filter((p) => p.featured), [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (activeCategory) list = list.filter((p) => p.category === activeCategory);
    if (activeBrand) list = list.filter((p) => p.brand === activeBrand);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    list = list.filter((p) => p.price_cents >= priceRange[0] && p.price_cents <= priceRange[1]);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price_cents - a.price_cents);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        list.sort((a, b) => b.discount_percent - a.discount_percent);
        break;
    }
    return list;
  }, [products, activeCategory, activeBrand, minRating, priceRange, search, sort]);

  const goToShop = (category?: string) => {
    setActiveCategory(category ?? null);
    setActiveBrand(null);
    setMinRating(0);
    setPriceRange([0, maxPrice]);
    setSearch('');
    setSort('relevance');
    setView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category: string | null) => {
    setActiveCategory(category);
    setActiveBrand(null);
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goHome = () => {
    setView('home');
    setSelectedProduct(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveBrand(null);
    setMinRating(0);
    setPriceRange([0, maxPrice]);
    setSort('relevance');
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#1168b0] text-white shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex items-center gap-3 h-14">
            <button onClick={goHome} className="text-lg font-bold tracking-tight shrink-0">
              ShopWave
            </button>

            {/* Search */}
            <div className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  if (view === 'home' || view === 'product') setView('shop');
                }}
                placeholder="Search for products, brands, and more…"
                className="w-full pl-10 pr-8 py-2 rounded-sm bg-white text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#ff9f00] transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => (session ? signOut() : setAuthOpen(true))}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-sm hover:bg-white/10 transition-colors text-sm font-medium"
              >
                <User className="w-4 h-4" strokeWidth={1.5} />
                {session ? 'Logout' : 'Login'}
              </button>
              {session && (
                <button
                  onClick={() => setOrdersOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-sm hover:bg-white/10 transition-colors text-sm font-medium"
                >
                  <Package className="w-4 h-4" strokeWidth={1.5} />
                  Orders
                </button>
              )}
              <button
                onClick={() => {
                  if (!session) {
                    setAuthOpen(true);
                    return;
                  }
                  setWishlistOpen(true);
                }}
                className="relative p-2 rounded-sm hover:bg-white/10 transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" strokeWidth={1.5} />
                {wishlistItems.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-[#1168b0] bg-[#ff9f00] rounded-full px-0.5">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 rounded-sm hover:bg-white/10 transition-colors"
                aria-label="Open cart"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[10px] font-bold text-[#1168b0] bg-[#ff9f00] rounded-full px-0.5">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category bar */}
        <nav className="bg-[#0d5a9c] hidden md:block">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-center gap-1 h-10">
              <button
                onClick={goHome}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <HomeIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
                Home
              </button>
              {categories.map((cat) => {
                const Icon = categoryIcons[cat] ?? HomeIcon;
                return (
                  <button
                    key={cat}
                    onClick={() => goToShop(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile category bar */}
      <nav className="md:hidden bg-white border-b border-slate-200 sticky top-14 z-20">
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 no-scrollbar">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat] ?? HomeIcon;
            return (
              <button
                key={cat}
                onClick={() => goToShop(cat)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-full whitespace-nowrap hover:bg-[#1168b0] hover:text-white transition-colors shrink-0"
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                {cat}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Home view */}
      {view === 'home' && (
        <>
          {/* Hero banner */}
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-[#1168b0] to-[#0a4a82]">
              <div className="px-8 py-10 md:px-12 md:py-16 max-w-2xl">
                <p className="text-xs uppercase tracking-[0.2em] text-[#ff9f00] font-bold mb-3">
                  The Big Shopping Sale
                </p>
                <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
                  Up to 40% off on top brands
                </h1>
                <p className="text-sm md:text-base text-white/80 mt-4">
                  Shop the latest electronics, fashion, home essentials, and more at unbeatable prices.
                </p>
                <button
                  onClick={() => goToShop()}
                  className="mt-6 px-6 py-3 bg-[#ff9f00] text-white rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#f0a500] transition-colors"
                >
                  Shop Now
                </button>
              </div>
            </div>
          </section>

          {/* Deals banner */}
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4">
            {loading ? (
              <div className="h-48 bg-white rounded-lg border border-slate-200 animate-pulse" />
            ) : (
              <DealsBanner products={products} onOpen={openProduct} />
            )}
          </section>

          {/* Category grid */}
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <h2 className="text-base font-bold text-slate-900 mb-4">Shop by Category</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {categories.map((cat) => {
                  const Icon = categoryIcons[cat] ?? HomeIcon;
                  const sample = products.find((p) => p.category === cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => goToShop(cat)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-100 border-2 border-transparent group-hover:border-[#1168b0] transition-colors">
                        {sample && (
                          <img
                            src={sample.image_url}
                            alt={cat}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-slate-700 group-hover:text-[#1168b0] transition-colors">
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Featured products */}
          {featured.length > 0 && (
            <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-4 pb-8">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-slate-900">Top Picks for You</h2>
                  <button
                    onClick={() => goToShop()}
                    className="flex items-center gap-1 text-sm text-[#1168b0] font-medium hover:underline"
                  >
                    View All <ChevronRight className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-lg bg-slate-200 animate-pulse" />
                      ))
                    : featured.map((product) => (
                        <ProductCard key={product.id} product={product} onOpen={openProduct} />
                      ))}
                </div>
              </div>
            </section>
          )}

          {/* All products preview */}
          <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pb-8">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-900">Trending Now</h2>
                <button
                  onClick={() => goToShop()}
                  className="flex items-center gap-1 text-sm text-[#1168b0] font-medium hover:underline"
                >
                  View All <ChevronRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-slate-200 animate-pulse" />
                    ))
                  : products.slice(0, 12).map((product) => (
                      <ProductCard key={product.id} product={product} onOpen={openProduct} />
                    ))}
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#172337] text-slate-300">
            {/* Trust badges strip */}
            <div className="border-b border-slate-700/60">
              <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Truck, title: 'Free Delivery', sub: 'On all orders' },
                  { icon: RotateCcw, title: '7-Day Returns', sub: 'Easy & hassle-free' },
                  { icon: Shield, title: 'Secure Payments', sub: 'Bank-grade encryption' },
                  { icon: Package, title: 'Genuine Products', sub: '100% verified' },
                ].map((b) => {
                  const BIcon = b.icon;
                  return (
                    <div key={b.title} className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <BIcon className="w-4 h-4 text-[#f0a500]" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{b.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{b.sub}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main footer */}
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
                {/* Brand + tagline */}
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-sm font-bold text-white mb-2">ShopWave</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">
                    Ab Har Wish Poori!
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Your one-stop online shopping destination for electronics, fashion, home appliances, beauty, and more.
                  </p>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => goToShop(cat)}
                        className="block text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Help */}
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">Help</h3>
                  <div className="space-y-2">
                    <button onClick={() => setInfoModal('track')} className="block text-xs text-slate-400 hover:text-white transition-colors">Track Order</button>
                    <button onClick={() => setInfoModal('shipping')} className="block text-xs text-slate-400 hover:text-white transition-colors">Shipping Info</button>
                    <button onClick={() => setInfoModal('faq')} className="block text-xs text-slate-400 hover:text-white transition-colors">FAQ</button>
                    <button onClick={() => setInfoModal('faq')} className="block text-xs text-slate-400 hover:text-white transition-colors">Help Center</button>
                  </div>
                </div>

                {/* About */}
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-3">About</h3>
                  <div className="space-y-2">
                    <button onClick={() => setInfoModal('about')} className="block text-xs text-slate-400 hover:text-white transition-colors">About Us</button>
                    <button onClick={() => setInfoModal('returns')} className="block text-xs text-slate-400 hover:text-white transition-colors">Return Policy</button>
                    <button onClick={() => setInfoModal('terms')} className="block text-xs text-slate-400 hover:text-white transition-colors">Terms &amp; Conditions</button>
                    <button onClick={() => setInfoModal('privacy')} className="block text-xs text-slate-400 hover:text-white transition-colors">Privacy Policy</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-700/60">
              <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  <button onClick={() => setInfoModal('returns')} className="hover:text-white transition-colors">Return Policy</button>
                  <span className="text-slate-600">·</span>
                  <button onClick={() => setInfoModal('terms')} className="hover:text-white transition-colors">Terms</button>
                  <span className="text-slate-600">·</span>
                  <button onClick={() => setInfoModal('privacy')} className="hover:text-white transition-colors">Privacy</button>
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  © 2026 ShopWave — Ab Har Wish Poori!
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Secured by</span>
                  <Shield className="w-3.5 h-3.5 text-[#f0a500]" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Shop view */}
      {view === 'shop' && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
          <div className="flex gap-5">
            {/* Filter sidebar - desktop */}
            <div className="hidden md:block w-60 shrink-0">
              <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-32">
                <FilterSidebar
                  categories={categories}
                  brands={brands}
                  activeCategory={activeCategory}
                  activeBrand={activeBrand}
                  minRating={minRating}
                  priceRange={priceRange}
                  maxPrice={maxPrice}
                  onCategory={handleCategoryChange}
                  onBrand={setActiveBrand}
                  onMinRating={setMinRating}
                  onPriceRange={setPriceRange}
                  onClear={clearFilters}
                />
              </div>
            </div>

            {/* Products */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-slate-900 capitalize">
                    {activeCategory ?? 'All Products'}
                  </h1>
                  <span className="text-xs text-slate-400">({filtered.length} items)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFilters(true)}
                    className="md:hidden flex items-center gap-1 text-xs text-slate-600 border border-slate-300 px-3 py-1.5 rounded-md"
                  >
                    Filters
                  </button>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortValue)}
                    className="text-sm text-slate-700 border border-slate-300 rounded-md px-3 py-1.5 focus:outline-none focus:border-[#1168b0] bg-white"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        Sort: {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-slate-200 animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 py-16 text-center">
                  <p className="text-sm text-slate-400">No products found. Try adjusting your filters.</p>
                  <button
                    onClick={clearFilters}
                    className="mt-3 text-sm text-[#1168b0] font-medium hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={openProduct} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Product detail view */}
      {view === 'product' && selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={goHome}
          onBuyNow={(product: Product, quantity: number) => {
            setView('home');
            setBuyNowItem({ product, quantity: Math.min(quantity, product.inventory) });
            setCheckoutOpen(true);
          }}
          onAuthRequired={() => setAuthOpen(true)}
        />
      )}

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowFilters(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl overflow-y-auto p-4 animate-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-1.5 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
              </button>
            </div>
            <FilterSidebar
              categories={categories}
              brands={brands}
              activeCategory={activeCategory}
              activeBrand={activeBrand}
              minRating={minRating}
              priceRange={priceRange}
              maxPrice={maxPrice}
              onCategory={handleCategoryChange}
              onBrand={setActiveBrand}
              onMinRating={setMinRating}
              onPriceRange={setPriceRange}
              onClear={clearFilters}
            />
          </div>
        </div>
      )}

      {/* Overlays */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        onOpenProduct={openProduct}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => {
          setCheckoutOpen(false);
          setBuyNowItem(null);
        }}
        buyNowItem={buyNowItem}
        onComplete={() => {
          setCheckoutOpen(false);
          setBuyNowItem(null);
          setOrdersOpen(true);
        }}
        onAuthRequired={() => {
          setCheckoutOpen(false);
          setBuyNowItem(null);
          setAuthOpen(true);
        }}
      />
      <OrdersModal open={ordersOpen} onClose={() => setOrdersOpen(false)} />
      <InfoModal
        type={infoModal}
        onClose={() => setInfoModal(null)}
        onTrackOrder={() => {
          if (session) {
            setOrdersOpen(true);
          } else {
            setAuthOpen(true);
          }
        }}
      />
    </div>
  );
}
