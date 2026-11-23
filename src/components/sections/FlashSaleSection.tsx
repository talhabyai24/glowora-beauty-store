import { useEffect, useState } from 'react';
import type { FlashSaleConfig, Product } from '../../types/glowora';
import { ProductCard } from '../ui/ProductCard';

interface FlashSaleSectionProps {
  config: FlashSaleConfig;
  products: Product[];
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

function getTimeLeft(endIso: string) {
  const target = new Date(endIso).getTime();
  const diff = Math.max(0, (Number.isNaN(target) ? Date.now() + 86400000 : target) - Date.now());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function FlashSaleSection({
  config,
  products,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}: FlashSaleSectionProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(config.endTimeIso));

  useEffect(() => {
    setTimeLeft(getTimeLeft(config.endTimeIso));
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(config.endTimeIso));
    }, 1000);
    return () => clearInterval(timer);
  }, [config.endTimeIso]);

  const saleProducts = products.filter((p) => p.isFlashSale || p.discountPercent > 0).slice(0, 4);
  if (saleProducts.length === 0) return null;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      id="flash_sale"
      className="bg-[#0E0E10] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/10">
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#D4AF37]">
              {config.offerNote}
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 self-start lg:self-auto" aria-label="Offer countdown">
            {[
              { label: 'Days', value: pad(timeLeft.days) },
              { label: 'Hrs', value: pad(timeLeft.hours) },
              { label: 'Min', value: pad(timeLeft.minutes) },
              { label: 'Sec', value: pad(timeLeft.seconds) },
            ].map((unit) => (
              <div
                key={unit.label}
                className="flex flex-col items-center justify-center border border-white/15 bg-[#141417] px-3.5 py-2.5 min-w-[60px]"
              >
                <span className="font-mono-tabular text-xl sm:text-2xl font-medium text-[#D4AF37]">
                  {unit.value}
                </span>
                <span className="text-[10px] tracking-[0.16em] uppercase text-[#A8A29E]">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {saleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlistIds.has(product.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
              highlightTag={product.discountPercent > 0 ? `Save ${product.discountPercent}%` : 'Limited Offer'}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
