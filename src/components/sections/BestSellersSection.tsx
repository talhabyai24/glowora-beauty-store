import { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, ProductSectionConfig } from '../../types/glowora';
import { ProductCard } from '../ui/ProductCard';

interface BestSellersSectionProps {
  config: ProductSectionConfig;
  products: Product[];
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onViewAll: () => void;
}

export function BestSellersSection({
  config,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  onViewAll,
}: BestSellersSectionProps) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const bestSellers = products.filter((p) => p.isBestseller).slice(0, config.maxItems || 6);

  const scrollByAmount = (direction: 'prev' | 'next') => {
    if (!sliderRef.current) return;
    const amount = sliderRef.current.clientWidth * 0.75;
    sliderRef.current.scrollBy({
      left: direction === 'next' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  if (bestSellers.length === 0) return null;

  return (
    <section
      id="best_sellers"
      className="bg-[#0A0A0B] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByAmount('prev')}
                aria-label="Scroll best sellers left"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollByAmount('next')}
                aria-label="Scroll best sellers right"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1.5 border border-white/25 px-4 py-2 text-xs font-medium text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              <span>{config.ctaLabel || 'View All'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {bestSellers.map((product) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[310px] lg:w-[320px] shrink-0 snap-start"
            >
              <ProductCard
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onSelectProduct={onSelectProduct}
                highlightTag="Best Seller"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
