import { ArrowRight } from 'lucide-react';
import type { BrandStoryConfig } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface BrandStorySectionProps {
  config: BrandStoryConfig;
  onOpenStoryModal: () => void;
}

export function BrandStorySection({ config, onOpenStoryModal }: BrandStorySectionProps) {
  return (
    <section
      id="brand_story"
      className="bg-[#F3EFE6] text-[#141416] py-20 lg:py-28 border-b border-[#141416]/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
          <div className="lg:col-span-6 relative overflow-hidden bg-[#E5DEC9] min-h-[380px] lg:min-h-[500px]">
            <LuxuryImage
              src={config.imageUrl}
              alt={config.heading}
              className="h-full w-full object-cover lg:h-full"
              fallbackLabel="GLOWORA"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
            <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#8A6D1B]">
              {config.kicker}
            </p>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-medium leading-[1.1] text-[#141416] text-balance">
              {config.heading}
            </h2>

            <p className="text-base leading-relaxed text-[#44403C]">{config.body}</p>

            {config.highlights && config.highlights.length > 0 && (
              <div className="grid grid-cols-3 gap-6 pt-5 pb-4 border-y border-[#141416]/15">
                {config.highlights.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <p className="font-mono-tabular text-2xl sm:text-3xl font-semibold text-[#141416]">
                      {item.value}
                    </p>
                    <p className="text-xs text-[#57534E]">{item.label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onOpenStoryModal}
                className="inline-flex items-center gap-2.5 bg-[#141416] px-8 py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#F5F2EB] hover:bg-[#2A2A2F] transition-colors whitespace-nowrap shrink-0"
              >
                <span>{config.ctaLabel || 'Our Story'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
