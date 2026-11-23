import { useCallback, useEffect, useMemo, useState } from 'react';
import { AdminSectionBuilderDrawer } from './components/admin/AdminSectionBuilderDrawer';
import { AccountOrdersModal } from './components/modals/AccountOrdersModal';
import { CartDrawer } from './components/modals/CartDrawer';
import { InfoModal, type InfoModalState } from './components/modals/InfoModal';
import { ProductDetailModal } from './components/modals/ProductDetailModal';
import { WishlistDrawer } from './components/modals/WishlistDrawer';
import { AnnouncementBarSection } from './components/sections/AnnouncementBarSection';
import { BeautyBlogSection } from './components/sections/BeautyBlogSection';
import { BestSellersSection } from './components/sections/BestSellersSection';
import { BrandStorySection } from './components/sections/BrandStorySection';
import { CategorySection } from './components/sections/CategorySection';
import { CustomerReviewsSection } from './components/sections/CustomerReviewsSection';
import { FaqSection } from './components/sections/FaqSection';
import { FeaturedCollectionSection } from './components/sections/FeaturedCollectionSection';
import { FeaturedProductsSection } from './components/sections/FeaturedProductsSection';
import { FlashSaleSection } from './components/sections/FlashSaleSection';
import { FooterSection } from './components/sections/FooterSection';
import { HeaderSection } from './components/sections/HeaderSection';
import { HeroBannerSection } from './components/sections/HeroBannerSection';
import { InstagramGallerySection } from './components/sections/InstagramGallerySection';
import { NewArrivalsSection } from './components/sections/NewArrivalsSection';
import { NewsletterSection } from './components/sections/NewsletterSection';
import { PromotionalBannerSection } from './components/sections/PromotionalBannerSection';
import { WhyChooseUsSection } from './components/sections/WhyChooseUsSection';
import { SeoManager } from './components/seo/SeoManager';
import type {
  AnnouncementBarConfig,
  BeautyBlogConfig,
  BrandStoryConfig,
  CartItem,
  CategorySectionConfig,
  CustomerReviewsConfig,
  FaqConfig,
  FeaturedCollectionConfig,
  FlashSaleConfig,
  FooterConfig,
  HeaderConfig,
  HeroBannerConfig,
  InstagramGalleryConfig,
  NewsletterConfig,
  Order,
  PaymentMethod,
  PaymentSettings,
  Product,
  ProductCategory,
  ProductSectionConfig,
  PromotionalBannerConfig,
  Review,
  SeoSettings,
  StoreSection,
  WhyChooseUsConfig,
} from './types/glowora';

const FALLBACK_PAYMENT_SETTINGS: PaymentSettings = {
  jazzcashEnabled: true,
  jazzcashDisplayName: 'GLOWORA Official JazzCash',
  jazzcashInstructions:
    'Enter your JazzCash mobile account number to connect securely with the official JazzCash Merchant Gateway.',
  jazzcashGatewayConfigured: false,
  bankEnabled: true,
  bankName: '',
  bankAccountTitle: '',
  bankAccountNumber: '',
  bankIban: '',
  bankSwiftCode: '',
  bankInstructions:
    'Transfer the exact order total to the official GLOWORA bank account below, upload your payment receipt, and enter your Transaction ID for verification.',
  codEnabled: true,
  cardEnabled: true,
};

const FALLBACK_SEO_SETTINGS: SeoSettings = {
  metaTitle: 'GLOWORA – Luxury Botanical Skincare, Makeup & Fragrances',
  metaDescription:
    'Shop GLOWORA luxury skincare serums, velvet lipsticks, and rare amber fragrances with express delivery, JazzCash, and bank transfer.',
  keywords:
    'GLOWORA, luxury skincare, botanical serum, velvet matte lipstick, amber oud perfume, beauty tools, JazzCash beauty store',
  ogImage: '/src/assets/images/hero_luxury_beauty_1795461007331.jpg',
};

export default function App() {
  const [sections, setSections] = useState<StoreSection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(FALLBACK_PAYMENT_SETTINGS);
  const [seoSettings, setSeoSettings] = useState<SeoSettings>(FALLBACK_SEO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Storefront interactive state
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);

  // Drawers & Modals
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [infoModal, setInfoModal] = useState<InfoModalState>(null);

  // Admin Bearer token strictly held in React memory
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Payment redirect outcome banner (from hosted JazzCash callback)
  const [paymentBanner, setPaymentBanner] = useState<{
    status: 'success' | 'failed' | 'cancelled';
    orderId?: string;
  } | null>(null);

  const fetchStorefront = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/storefront');
      if (!res.ok) throw new Error('Unable to load GLOWORA storefront.');
      const data = await res.json();
      setSections(data.sections || []);
      setProducts(data.products || []);
      setReviews(data.reviews || []);
      if (data.paymentSettings) setPaymentSettings(data.paymentSettings);
      if (data.seoSettings) setSeoSettings(data.seoSettings);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to connect to GLOWORA server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStorefront();
  }, [fetchStorefront]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderId = params.get('orderId') || undefined;
    if (payment === 'success' || payment === 'failed' || payment === 'cancelled') {
      setPaymentBanner({ status: payment, orderId });
      if (payment === 'success') {
        setCart([]);
      }
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const wishlistIds = useMemo(() => new Set(wishlist.map((p) => p.id)), [wishlist]);
  const totalCartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const availableCategories = useMemo(() => {
    const catSec = sections.find((s) => s.id === 'categories');
    const configured = catSec
      ? ((catSec.config as CategorySectionConfig).items || []).map((i) => i.name)
      : [];
    const fromProducts = products.map((p) => p.category);
    return Array.from(new Set([...configured, ...fromProducts])).filter(Boolean);
  }, [sections, products]);

  const navigateToTarget = (target: string) => {
    if (!target) return;
    if (target.startsWith('#')) {
      const el = document.getElementById(target.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleSelectCategoryAndScroll = (category: ProductCategory | 'All') => {
    setActiveCategory(category);
    const el = document.getElementById('featured_products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.min(item.product.stock, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  };

  const handleOrderCompleted = async (_order: Order) => {
    setCart([]);
    await fetchStorefront();
  };

  const handlePlaceOrder = async (payload: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: string;
    postalCode: string;
    paymentMethod: PaymentMethod;
    paymentReference: string;
  }): Promise<Order> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unable to place order.');
    setCart([]);
    await fetchStorefront();
    return data.order;
  };

  const handleSubmitReview = async (payload: {
    authorName: string;
    authorEmail?: string;
    authorRole: string;
    rating: number;
    productName: string;
    quote: string;
  }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to publish review.');
    setReviews((prev) => [data.review, ...prev]);
  };

  const handleSubscribeNewsletter = async (email: string) => {
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Subscription failed.');
    return data;
  };

  // Admin mutation helpers
  const handleUpdateSection = async (
    sectionId: StoreSection['id'],
    updates: { enabled?: boolean; label?: string; config?: Record<string, unknown> }
  ) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/sections/${sectionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(updates),
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update section.');
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? data.section : s))
    );
  };

  const handleReorderSections = async (orderedIds: string[]) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/sections/reorder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ orderedIds }),
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reorder sections.');
    setSections(data.sections);
  };

  const handleResetSections = async () => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/sections/reset', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (res.ok && data.sections) {
      setSections(data.sections);
      setAnnouncementDismissed(false);
    }
  };

  const handleSaveProduct = async (product: Partial<Product>) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(product),
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save product.');
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === data.product.id);
      return exists
        ? prev.map((p) => (p.id === data.product.id ? data.product : p))
        : [...prev, data.product];
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!adminToken) return;
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleSavePaymentSettings = async (settings: PaymentSettings) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/settings/payment', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(settings),
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (res.ok && data.paymentSettings) {
      setPaymentSettings(data.paymentSettings);
    }
  };

  const handleSaveSeoSettings = async (settings: SeoSettings) => {
    if (!adminToken) return;
    const res = await fetch('/api/admin/settings/seo', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify(settings),
    });
    if (res.status === 401) {
      setAdminToken(null);
      return;
    }
    const data = await res.json();
    if (res.ok && data.seoSettings) {
      setSeoSettings(data.seoSettings);
    }
  };

  const handleApprovePayment = async (orderId: string): Promise<Order> => {
    if (!adminToken) throw new Error('Admin session expired.');
    const res = await fetch(`/api/admin/payments/${orderId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to approve payment.');
    return data.order;
  };

  const handleRejectPayment = async (orderId: string, reason: string): Promise<Order> => {
    if (!adminToken) throw new Error('Admin session expired.');
    const res = await fetch(`/api/admin/payments/${orderId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reject payment.');
    return data.order;
  };

  const renderSection = (section: StoreSection) => {
    if (!section.enabled) return null;

    switch (section.id) {
      case 'announcement_bar':
        return (
          <AnnouncementBarSection
            key={section.id}
            config={section.config as AnnouncementBarConfig}
            dismissed={announcementDismissed}
            onDismiss={() => setAnnouncementDismissed(true)}
            onNavigate={navigateToTarget}
          />
        );

      case 'header':
        return (
          <HeaderSection
            key={section.id}
            config={section.config as HeaderConfig}
            cartCount={totalCartCount}
            wishlistCount={wishlist.length}
            searchQuery={searchQuery}
            onSearchChange={(val) => setSearchQuery(val)}
            products={products}
            onSelectProduct={setSelectedProduct}
            onNavigate={navigateToTarget}
            onOpenCart={() => setCartOpen(true)}
            onOpenWishlist={() => setWishlistOpen(true)}
            onOpenAccount={() => setAccountOpen(true)}
          />
        );

      case 'hero_banner':
        return (
          <HeroBannerSection
            key={section.id}
            config={section.config as HeroBannerConfig}
            onNavigate={navigateToTarget}
          />
        );

      case 'categories':
        return (
          <CategorySection
            key={section.id}
            config={section.config as CategorySectionConfig}
            products={products}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategoryAndScroll}
          />
        );

      case 'featured_products':
        return (
          <FeaturedProductsSection
            key={section.id}
            config={section.config as ProductSectionConfig}
            products={products}
            categories={availableCategories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onSelectProduct={setSelectedProduct}
          />
        );

      case 'best_sellers':
        return (
          <BestSellersSection
            key={section.id}
            config={section.config as ProductSectionConfig}
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onSelectProduct={setSelectedProduct}
            onViewAll={() => handleSelectCategoryAndScroll('All')}
          />
        );

      case 'new_arrivals':
        return (
          <NewArrivalsSection
            key={section.id}
            config={section.config as ProductSectionConfig}
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onSelectProduct={setSelectedProduct}
          />
        );

      case 'promotional_banner':
        return (
          <PromotionalBannerSection
            key={section.id}
            config={section.config as PromotionalBannerConfig}
            onShopOffer={handleSelectCategoryAndScroll}
          />
        );

      case 'flash_sale':
        return (
          <FlashSaleSection
            key={section.id}
            config={section.config as FlashSaleConfig}
            products={products}
            wishlistIds={wishlistIds}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(p) => handleAddToCart(p, 1)}
            onSelectProduct={setSelectedProduct}
          />
        );

      case 'brand_story':
        return (
          <BrandStorySection
            key={section.id}
            config={section.config as BrandStoryConfig}
            onOpenStoryModal={() =>
              setInfoModal({ type: 'story', data: section.config as BrandStoryConfig })
            }
          />
        );

      case 'why_choose_us':
        return (
          <WhyChooseUsSection
            key={section.id}
            config={section.config as WhyChooseUsConfig}
          />
        );

      case 'featured_collection':
        return (
          <FeaturedCollectionSection
            key={section.id}
            config={section.config as FeaturedCollectionConfig}
            onSelectCollection={handleSelectCategoryAndScroll}
          />
        );

      case 'customer_reviews':
        return (
          <CustomerReviewsSection
            key={section.id}
            config={section.config as CustomerReviewsConfig}
            reviews={reviews}
            products={products}
            onSubmitReview={handleSubmitReview}
          />
        );

      case 'beauty_blog':
        return (
          <BeautyBlogSection
            key={section.id}
            config={section.config as BeautyBlogConfig}
            onReadArticle={(article) => setInfoModal({ type: 'article', data: article })}
          />
        );

      case 'instagram_gallery':
        return (
          <InstagramGallerySection
            key={section.id}
            config={section.config as InstagramGalleryConfig}
            onSelectTile={(tile) => setInfoModal({ type: 'instagram', data: tile })}
          />
        );

      case 'newsletter':
        return (
          <NewsletterSection
            key={section.id}
            config={section.config as NewsletterConfig}
            onSubscribe={handleSubscribeNewsletter}
          />
        );

      case 'faq':
        return <FaqSection key={section.id} config={section.config as FaqConfig} />;

      case 'footer':
        return (
          <FooterSection
            key={section.id}
            config={section.config as FooterConfig}
            onNavigate={navigateToTarget}
            onOpenPolicyModal={(key) => setInfoModal({ type: 'policy', key })}
            onOpenAdminBuilder={() => setAdminOpen(true)}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#F5F2EB] flex flex-col items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="font-display text-3xl tracking-[0.25em] text-[#D4AF37]">GLOWORA</p>
          <p className="text-xs tracking-[0.18em] uppercase text-[#A8A29E]">
            Loading Storefront...
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-[#F5F2EB] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="font-display text-3xl text-[#F5F2EB]">Storefront Unavailable</p>
        <p className="text-sm text-[#A8A29E] max-w-md">{loadError}</p>
        <button
          type="button"
          onClick={fetchStorefront}
          className="bg-[#D4AF37] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0A0A0B]"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const headerEnabled = sections.some((s) => s.id === 'header' && s.enabled);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F5F2EB] flex flex-col">
      <SeoManager seoSettings={seoSettings} products={products} sections={sections} />

      {paymentBanner && (
        <div
          role="status"
          className={`flex items-center justify-between px-4 py-2.5 text-xs border-b ${
            paymentBanner.status === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/60 border-red-500/40 text-red-200'
          }`}
        >
          <span>
            {paymentBanner.status === 'success'
              ? `JazzCash payment verified for Order #${paymentBanner.orderId || ''}.`
              : paymentBanner.status === 'cancelled'
                ? `JazzCash payment was cancelled for Order #${paymentBanner.orderId || ''}.`
                : `JazzCash payment could not be verified for Order #${paymentBanner.orderId || ''}.`}
          </span>
          <button
            type="button"
            onClick={() => setPaymentBanner(null)}
            className="underline ml-4 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="flex-1">
        {sections.map((section) => renderSection(section))}
      </main>

      {!headerEnabled && (
        <button
          type="button"
          onClick={() => setAdminOpen(true)}
          className="fixed bottom-5 right-5 z-40 border border-[#D4AF37] bg-[#0E0E10] px-4 py-2.5 text-xs font-semibold text-[#D4AF37] shadow-lg hover:bg-[#D4AF37] hover:text-[#0A0A0B]"
        >
          Store Admin
        </button>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        paymentSettings={paymentSettings}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
        onOrderCompleted={handleOrderCompleted}
      />

      <WishlistDrawer
        open={wishlistOpen}
        onClose={() => setWishlistOpen(false)}
        items={wishlist}
        onRemove={handleToggleWishlist}
        onMoveToCart={(product) => {
          handleAddToCart(product, 1);
          setWishlistOpen(false);
          setCartOpen(true);
        }}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isWishlisted={selectedProduct ? wishlistIds.has(selectedProduct.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      <AccountOrdersModal
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        products={products}
        wishlistCount={wishlist.length}
        onSubmitReview={handleSubmitReview}
        onOpenAdminBuilder={() => setAdminOpen(true)}
      />

      <InfoModal state={infoModal} onClose={() => setInfoModal(null)} />

      <AdminSectionBuilderDrawer
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        sections={sections}
        products={products}
        paymentSettings={paymentSettings}
        seoSettings={seoSettings}
        adminToken={adminToken}
        onAdminTokenChange={setAdminToken}
        onUpdateSection={handleUpdateSection}
        onReorderSections={handleReorderSections}
        onResetSections={handleResetSections}
        onSaveProduct={handleSaveProduct}
        onDeleteProduct={handleDeleteProduct}
        onSavePaymentSettings={handleSavePaymentSettings}
        onSaveSeoSettings={handleSaveSeoSettings}
        onApprovePayment={handleApprovePayment}
        onRejectPayment={handleRejectPayment}
      />
    </div>
  );
}
