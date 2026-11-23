import { ArrowRight } from 'lucide-react';
import type { FeaturedCollectionConfig, ProductCategory } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface FeaturedCollectionSectionProps {
  config: FeaturedCollectionConfig;
  onSelectCollection: (category: ProductCategory | 'All') => void;
}

export function FeaturedCollectionSection({
  config,
  onSelectCollection,
}: FeaturedCollectionSectionProps) {
  return (
    <section
      id="featured_collection"
      className="bg-[#0A0A0B] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="mb-10 space-y-2">
          <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
            {config.heading}
          </h2>
          <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {config.collections.map((col) => (
            <div
              key={col.title}
              onClick={() => onSelectCollection((col.filterCategory as ProductCategory) || 'All')}
              className="group cursor-pointer relative overflow-hidden bg-[#141417] aspect-[4/5] flex items-end"
            >
              <LuxuryImage
                src={col.imageUrl}
                alt={col.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                fallbackLabel={col.title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/92 via-[#0A0A0B]/35 to-transparent" />

              <div className="relative z-10 p-7 space-y-2.5 w-full">
                <h3 className="font-display text-2xl sm:text-3xl font-medium text-[#F5F2EB] group-hover:text-[#E5C158] transition-colors">
                  {col.title}
                </h3>
                <p className="text-sm text-[#D6D3CD] leading-relaxed">{col.subtitle}</p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#D4AF37] group-hover:gap-3 transition-all">
                    <span>{col.ctaLabel || 'Explore'}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
