import { useState } from 'react';
import { Check, Heart, ShoppingBag, Star } from 'lucide-react';
import type { Product } from '../../types/glowora';
import { LuxuryImage } from './LuxuryImage';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  highlightTag?: string;
}

export function ProductCard({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  highlightTag,
}: ProductCardProps) {
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product);
  };

  const tagLabel = highlightTag || product.badgeText;

  return (
    <article
      onClick={() => onSelectProduct(product)}
      className="group cursor-pointer flex flex-col"
    >
      {/* Photo-First 3:4 Portrait Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#141417]">
        <LuxuryImage
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          fallbackLabel={product.category}
        />

        {tagLabel && (
          <span className="absolute top-3.5 left-3.5 bg-[#0A0A0B]/80 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium tracking-[0.14em] uppercase text-[#E5C158]">
            {tagLabel}
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#0A0A0B]/55 backdrop-blur-sm text-[#F5F2EB] opacity-85 hover:opacity-100 hover:text-[#D4AF37] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <Heart
            className={`h-4 w-4 ${isWishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`}
            strokeWidth={1.6}
          />
        </button>

        {/* Quick Add Overlay Bar */}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-95 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:focus-within:translate-y-0 lg:focus-within:opacity-100 transition-all duration-200">
          <button
            type="button"
            onClick={handleAdd}
            disabled={product.stock <= 0}
            className={`w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-[11px] font-semibold tracking-[0.14em] uppercase backdrop-blur-md transition-colors whitespace-nowrap ${
              product.stock <= 0
                ? 'bg-[#1C1C21]/90 text-[#A8A29E] cursor-not-allowed'
                : justAdded
                  ? 'bg-[#E5C158] text-[#0A0A0B]'
                  : 'bg-[#0A0A0B]/90 text-[#F5F2EB] hover:bg-[#D4AF37] hover:text-[#0A0A0B]'
            }`}
          >
            {justAdded ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{product.stock <= 0 ? 'Sold Out' : 'Quick Add'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unboxed Clean Editorial Details Below Image */}
      <div className="pt-4 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-[11px] text-[#A8A29E]">
          <span className="uppercase tracking-[0.12em]">{product.category}</span>
          <span className="inline-flex items-center gap-1 font-mono-tabular text-[#D6D3CD]">
            <Star className="h-3 w-3 fill-[#D4AF37] text-[#D4AF37]" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <h3 className="font-display text-[19px] font-medium leading-snug text-[#F5F2EB] group-hover:text-[#D4AF37] transition-colors line-clamp-2">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2.5 pt-0.5">
          <span className="font-mono-tabular text-[15px] font-medium text-[#F5F2EB]">
            ${product.price.toFixed(0)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="font-mono-tabular text-xs text-[#78716C] line-through">
              ${product.originalPrice.toFixed(0)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
