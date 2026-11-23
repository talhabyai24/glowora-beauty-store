import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, ProductSectionConfig } from '../../types/glowora';
import { ProductCard } from '../ui/ProductCard';

interface NewArrivalsSectionProps {
  config: ProductSectionConfig;
  products: Product[];
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export function NewArrivalsSection({
  config,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}: NewArrivalsSectionProps) {
  const newArrivals = products.filter((p) => p.isNewArrival).slice(0, config.maxItems || 6);
  const [startIndex, setStartIndex] = useState(0);

  if (newArrivals.length === 0) return null;

  const pageSize = 3;
  const maxStart = Math.max(0, newArrivals.length - pageSize);
  const clampedStart = Math.min(startIndex, maxStart);
  const visible = newArrivals.slice(clampedStart, clampedStart + pageSize);

  return (
    <section
      id="new_arrivals"
      className="bg-[#0E0E10] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          {newArrivals.length > pageSize && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="font-mono-tabular text-xs text-[#A8A29E] mr-2">
                {clampedStart + 1}–{Math.min(clampedStart + pageSize, newArrivals.length)} of{' '}
                {newArrivals.length}
              </span>
              <button
                type="button"
                onClick={() => setStartIndex((prev) => Math.max(0, prev - 1))}
                disabled={clampedStart === 0}
                aria-label="Previous new arrivals"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setStartIndex((prev) => Math.min(maxStart, prev + 1))}
                disabled={clampedStart >= maxStart}
                aria-label="Next new arrivals"
                className="flex h-9 w-9 items-center justify-center border border-white/15 text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
              highlightTag="New"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
