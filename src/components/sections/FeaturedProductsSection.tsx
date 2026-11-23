import { useState } from 'react';
import type { Product, ProductCategory, ProductSectionConfig } from '../../types/glowora';
import { ProductCard } from '../ui/ProductCard';

interface FeaturedProductsSectionProps {
  config: ProductSectionConfig;
  products: Product[];
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: ProductCategory | 'All') => void;
  searchQuery: string;
  onClearSearch: () => void;
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export function FeaturedProductsSection({
  config,
  products,
  categories,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onClearSearch,
  wishlistIds,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}: FeaturedProductsSectionProps) {
  const [showAllCatalog, setShowAllCatalog] = useState(false);

  const filterTabs: Array<ProductCategory | 'All'> = ['All', ...categories];

  const filtered = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    if (activeCategory === 'All' && !q && !showAllCatalog) {
      return p.isFeatured;
    }
    return matchesCategory && matchesSearch;
  });

  const displayProducts = filtered.slice(0, showAllCatalog ? 50 : config.maxItems || 8);

  return (
    <section
      id="featured_products"
      className="bg-[#0E0E10] py-16 lg:py-24 border-b border-white/10"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <h2 className="font-display text-3xl sm:text-4xl font-medium text-[#F5F2EB] text-balance">
              {config.heading}
            </h2>
            <p className="text-sm text-[#A8A29E] max-w-xl">{config.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-white/10 pb-2">
            {filterTabs.map((tab) => {
              const active = activeCategory === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => onSelectCategory(tab)}
                  className={`pb-1 text-xs font-medium whitespace-nowrap shrink-0 transition-colors border-b-2 focus-visible:outline-none ${
                    active
                      ? 'border-[#D4AF37] text-[#F5F2EB]'
                      : 'border-transparent text-[#A8A29E] hover:text-[#F5F2EB]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {searchQuery.trim() && (
          <div className="mb-8 flex items-center justify-between border-b border-[#D4AF37]/30 pb-3 text-xs">
            <span className="text-[#E7E2D8]">
              Results for <strong className="text-[#D4AF37]">“{searchQuery}”</strong> ·{' '}
              <span className="font-mono-tabular">{filtered.length}</span> items
            </span>
            <button
              type="button"
              onClick={onClearSearch}
              className="text-[#D4AF37] underline underline-offset-4 hover:text-[#E5C158]"
            >
              Clear Search
            </button>
          </div>
        )}

        {displayProducts.length === 0 ? (
          <div className="border-y border-white/10 px-6 py-16 text-center space-y-3">
            <p className="font-display text-2xl text-[#F5F2EB]">No products match your filter</p>
            <p className="text-sm text-[#A8A29E]">
              Try resetting your category selection or search query.
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('All');
                onClearSearch();
              }}
              className="inline-flex items-center px-6 py-2.5 bg-[#D4AF37] text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158] transition-colors"
            >
              Show All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
                onToggleWishlist={onToggleWishlist}
                onAddToCart={onAddToCart}
                onSelectProduct={onSelectProduct}
              />
            ))}
          </div>
        )}

        {products.length > displayProducts.length && (
          <div className="mt-14 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAllCatalog((prev) => !prev)}
              className="border border-white/25 px-8 py-3 text-xs font-medium tracking-[0.14em] uppercase text-[#F5F2EB] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
            >
              {showAllCatalog ? 'Show Featured Only' : config.ctaLabel || 'View All Products'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
