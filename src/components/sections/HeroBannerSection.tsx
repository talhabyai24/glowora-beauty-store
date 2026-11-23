import { ArrowRight } from 'lucide-react';
import type { HeroBannerConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface HeroBannerSectionProps {
  config: HeroBannerConfig;
  onNavigate: (target: string) => void;
}

export function HeroBannerSection({ config, onNavigate }: HeroBannerSectionProps) {
  return (
    <section
      id="hero_banner"
      className="relative w-full overflow-hidden bg-[#0A0A0B]"
    >
      <div className="relative min-h-[74vh] lg:min-h-[82vh] max-h-[860px] flex items-end lg:items-center">
        {/* Background campaign image */}
        <div className="absolute inset-0">
          <LuxuryImage
            src={config.backgroundImage}
            alt={config.heading}
            className="h-full w-full object-cover object-center"
            fallbackLabel="GLOWORA"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B]/90 via-[#0A0A0B]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-transparent to-[#0A0A0B]/20" />
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 py-16 sm:py-24 lg:py-28">
          <div className="max-w-xl space-y-6">
            <p className="text-[11px] font-medium tracking-[0.24em] uppercase text-[#D4AF37]">
              {config.kicker}
            </p>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[62px] font-medium leading-[1.06] tracking-[-0.01em] text-[#F5F2EB] text-balance">
              {config.heading}
            </h1>

            <p className="text-base sm:text-[17px] leading-relaxed text-[#E7E2D8]/90 max-w-lg font-light">
              {config.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-7 pt-3">
              <button
                type="button"
                onClick={() => onNavigate(config.ctaTarget || '#featured_products')}
                className="inline-flex items-center gap-2.5 bg-[#D4AF37] px-8 py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              >
                <span>{config.ctaLabel || 'Shop Now'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              {config.secondaryCtaLabel && (
                <button
                  type="button"
                  onClick={() => onNavigate(config.secondaryCtaTarget || '#brand_story')}
                  className="text-xs font-medium tracking-[0.14em] uppercase text-[#F5F2EB] underline underline-offset-8 decoration-[#D4AF37]/60 hover:text-[#D4AF37] hover:decoration-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
                >
                  {config.secondaryCtaLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
