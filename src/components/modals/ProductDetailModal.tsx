import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingBag, Star, X } from 'lucide-react';
import type { Product } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductDetailModal({
  product,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
}: ProductDetailModalProps) {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
    >
      <div className="relative w-full max-w-4xl border border-[#D4AF37]/30 bg-[#0E0E10] text-[#F5F2EB] overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product detail"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center bg-[#0A0A0B]/80 border border-white/10 text-[#A8A29E] hover:text-[#F5F2EB]"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
          <div className="md:col-span-6 bg-[#141417] min-h-[300px]">
            <LuxuryImage
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              fallbackLabel={product.category}
            />
          </div>

          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
                <span className="text-[#D4AF37] uppercase tracking-wider">{product.category}</span>
                <span aria-hidden="true">·</span>
                <span>{product.collectionTag}</span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-[#F5F2EB]">
                {product.name}
              </h2>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
                  <span className="font-mono-tabular text-sm text-[#F5F2EB]">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-[#A8A29E] font-mono-tabular">
                  ({product.reviewCount} verified reviews)
                </span>
                <span aria-hidden="true" className="text-[#3F3F46]">·</span>
                <span className="font-mono-tabular text-xs text-[#A8A29E]">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-1">
                <span className="font-mono-tabular text-2xl font-semibold text-[#D4AF37]">
                  ${product.price.toFixed(2)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="font-mono-tabular text-sm text-[#78716C] line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="font-mono-tabular text-xs text-[#D4AF37]">
                    Save {product.discountPercent}%
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed text-[#D6D3CD]">{product.description}</p>

              <div className="border-t border-white/10 pt-4 space-y-1.5">
                <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#D4AF37]">
                  Key Ingredients
                </p>
                <p className="text-xs leading-relaxed text-[#A8A29E]">{product.ingredients}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center border border-white/15 bg-[#141417]">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-3 text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono-tabular px-4 text-sm">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(10, q + 1))}
                  aria-label="Increase quantity"
                  className="p-3 text-[#A8A29E] hover:text-[#F5F2EB]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => {
                  onAddToCart(product, qty);
                  onClose();
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-[#D4AF37] px-6 py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-[#0A0A0B] hover:bg-[#E5C158] disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>{product.stock <= 0 ? 'Sold Out' : 'Add to Bag'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleWishlist(product)}
                aria-label="Toggle wishlist"
                className="flex h-12 w-12 items-center justify-center border border-white/15 bg-[#141417] hover:border-[#D4AF37]"
              >
                <Heart
                  className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-[#F5F2EB]'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
