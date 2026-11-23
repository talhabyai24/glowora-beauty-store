import { ArrowRight } from 'lucide-react';
import type { ProductCategory, PromotionalBannerConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface PromotionalBannerSectionProps {
  config: PromotionalBannerConfig;
  onShopOffer: (category: ProductCategory | 'All') => void;
}

export function PromotionalBannerSection({
  config,
  onShopOffer,
}: PromotionalBannerSectionProps) {
  return (
    <section
      id="promotional_banner"
      className="bg-[#0A0A0B] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Primary Seasonal Campaign Banner */}
          <div className="lg:col-span-8 relative overflow-hidden bg-[#141417] min-h-[380px] flex items-end">
            <LuxuryImage
              src={config.backgroundImage}
              alt={config.heading}
              className="absolute inset-0 h-full w-full object-cover"
              fallbackLabel="Campaign"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/92 via-[#0A0A0B]/65 to-transparent" />

            <div className="relative z-10 p-8 sm:p-12 max-w-xl space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium tracking-[0.18em] uppercase text-[#D4AF37]">
                <span>{config.kicker}</span>
                {config.discountText && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{config.discountText}</span>
                  </>
                )}
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-medium leading-tight text-[#F5F2EB] text-balance">
                {config.heading}
              </h2>

              <p className="text-sm text-[#D6D3CD] leading-relaxed">{config.subtitle}</p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onShopOffer((config.ctaFilterCategory as ProductCategory) || 'All')}
                  className="inline-flex items-center gap-2 bg-[#D4AF37] px-7 py-3 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>{config.ctaLabel || 'Shop Now'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary Offer Card */}
          <div className="lg:col-span-4 relative overflow-hidden bg-[#141417] min-h-[380px] flex flex-col justify-between">
            <div className="relative h-56 w-full overflow-hidden bg-[#101012]">
              <LuxuryImage
                src={config.secondaryOfferImage}
                alt={config.secondaryOfferTitle}
                className="h-full w-full object-cover"
                fallbackLabel="Special Offer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141417] via-transparent to-transparent" />
            </div>

            <div className="p-7 flex-1 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#D4AF37]">
                  Featured Highlight
                </p>
                <h3 className="font-display text-2xl font-medium text-[#F5F2EB]">
                  {config.secondaryOfferTitle}
                </h3>
                <p className="text-sm text-[#A8A29E]">{config.secondaryOfferSubtitle}</p>
              </div>

              <button
                type="button"
                onClick={() => onShopOffer('Makeup')}
                className="self-start inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#D4AF37] hover:text-[#E5C158] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{config.secondaryOfferCta || 'Shop Now'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
