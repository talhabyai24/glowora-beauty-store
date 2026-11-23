import { ArrowUpRight } from 'lucide-react';
import type { CategorySectionConfig, Product, ProductCategory } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface CategorySectionProps {
  config: CategorySectionConfig;
  products: Product[];
  activeCategory: string;
  onSelectCategory: (category: ProductCategory | 'All') => void;
}

export function CategorySection({
  config,
  activeCategory,
  onSelectCategory,
}: CategorySectionProps) {
  return (
    <section
      id="categories"
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

          {activeCategory !== 'All' && (
            <button
              type="button"
              onClick={() => onSelectCategory('All')}
              className="self-start sm:self-auto text-xs font-medium text-[#D4AF37] underline underline-offset-4 hover:text-[#E5C158] whitespace-nowrap shrink-0"
            >
              Show All Categories
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {config.items.map((item) => {
            const isSelected = activeCategory === item.name;
            return (
              <button
                key={item.name}
                type="button"
                onClick={() => onSelectCategory(item.name)}
                className={`group relative aspect-[4/5] w-full overflow-hidden bg-[#141417] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${
                  isSelected ? 'ring-1 ring-[#D4AF37]' : ''
                }`}
              >
                <LuxuryImage
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                  fallbackLabel={item.name}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B]/90 via-[#0A0A0B]/20 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 flex items-end justify-between gap-2">
                  <div>
                    <h3 className="font-display text-xl sm:text-2xl font-medium text-[#F5F2EB] group-hover:text-[#E5C158] transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#D6D3CD]/85 line-clamp-1 mt-0.5">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#D4AF37] opacity-75 group-hover:opacity-100 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
