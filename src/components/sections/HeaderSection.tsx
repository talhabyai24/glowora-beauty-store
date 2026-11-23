import { useState } from 'react';
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import type { HeaderConfig, Product } from '../../types/glowora';

interface HeaderSectionProps {
  config: HeaderConfig;
  cartCount: number;
  wishlistCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onNavigate: (target: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAccount: () => void;
}

export function HeaderSection({
  config,
  cartCount,
  wishlistCount,
  searchQuery,
  onSearchChange,
  products,
  onSelectProduct,
  onNavigate,
  onOpenCart,
  onOpenWishlist,
  onOpenAccount,
}: HeaderSectionProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const matchingProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  return (
    <header
      id="header"
      className="sticky top-0 z-40 w-full bg-[#0A0A0B]/95 backdrop-blur-md border-b border-white/10"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-10 h-16">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden flex h-10 w-10 items-center justify-center text-[#F5F2EB] hover:text-[#D4AF37] transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <a
            href="#hero_banner"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-display text-2xl sm:text-[27px] font-semibold tracking-[0.22em] text-[#F5F2EB] whitespace-nowrap shrink-0 hover:text-[#D4AF37] transition-colors"
          >
            {config.brandName || 'GLOWORA'}
          </a>
        </div>

        {/* Zone 2: Clean Typography Navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-normal tracking-[0.04em] text-[#D6D3CD]">
          {config.navLinks.slice(0, 5).map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => onNavigate(link.target)}
              className="whitespace-nowrap shrink-0 hover:text-[#F5F2EB] transition-colors py-1 border-b border-transparent hover:border-[#D4AF37]"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Minimal Shopper Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search products"
            className="flex h-10 w-10 items-center justify-center text-[#E7E2D8] hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            aria-label="Account and Orders"
            className="flex h-10 w-10 items-center justify-center text-[#E7E2D8] hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            aria-label={`Wishlist (${wishlistCount})`}
            className="relative flex h-10 w-10 items-center justify-center text-[#E7E2D8] hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]"
          >
            <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="font-mono-tabular absolute top-1.5 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold text-[#0A0A0B]">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Shopping bag (${cartCount})`}
            className="relative flex h-10 items-center gap-1.5 px-2 text-[#E7E2D8] hover:text-[#D4AF37] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37] whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
            <span className="hidden sm:inline text-xs tracking-wide">
              Bag{cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
            {cartCount > 0 && (
              <span className="sm:hidden font-mono-tabular absolute top-1.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D4AF37] px-1 text-[10px] font-bold text-[#0A0A0B]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {searchOpen && (
        <div className="border-t border-white/10 bg-[#0E0E10] px-4 sm:px-6 lg:px-10 py-3.5">
          <div className="mx-auto max-w-3xl relative">
            <div className="flex items-center gap-3 border-b border-white/25 pb-2 focus-within:border-[#D4AF37]">
              <Search className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={config.searchPlaceholder || 'Search serums, lipsticks, fragrance...'}
                className="w-full bg-transparent text-sm text-[#F5F2EB] placeholder:text-[#78716C] focus:outline-none"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="text-xs text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="text-[#A8A29E] hover:text-[#F5F2EB]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {searchQuery.trim() && (
              <div className="mt-3 bg-[#141417] divide-y divide-white/10">
                {matchingProducts.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-[#A8A29E]">
                    No products match “{searchQuery}”.
                  </p>
                ) : (
                  matchingProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        onSelectProduct(p);
                        setSearchOpen(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[#1C1C21] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          referrerPolicy="no-referrer"
                          className="h-12 w-10 object-cover shrink-0 bg-[#0A0A0B]"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#F5F2EB] truncate">{p.name}</p>
                          <p className="text-xs text-[#A8A29E]">{p.category}</p>
                        </div>
                      </div>
                      <span className="font-mono-tabular text-sm text-[#D4AF37] ml-3 shrink-0">
                        ${p.price}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#0E0E10] px-4 py-4 flex flex-col gap-2">
          {config.navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => {
                onNavigate(link.target);
                setMobileMenuOpen(false);
              }}
              className="py-2.5 text-left text-sm font-medium text-[#E7E2D8] hover:text-[#D4AF37] border-b border-white/5 last:border-b-0"
            >
              {link.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
