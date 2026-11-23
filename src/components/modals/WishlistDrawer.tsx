import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Product } from '../../types/glowora';
import { LuxuryImage } from '../ui/LuxuryImage';

interface WishlistDrawerProps {
  open: boolean;
  onClose: () => void;
  items: Product[];
  onRemove: (product: Product) => void;
  onMoveToCart: (product: Product) => void;
}

export function WishlistDrawer({
  open,
  onClose,
  items,
  onRemove,
  onMoveToCart,
}: WishlistDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Wishlist">
      <div className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0E0E10] text-[#F5F2EB]">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Heart className="h-4.5 w-4.5 text-[#D4AF37]" />
            <h2 className="font-display text-2xl font-semibold">Wishlist</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="flex h-9 w-9 items-center justify-center text-[#A8A29E] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <Heart className="h-10 w-10 text-[#3F3F46]" strokeWidth={1.25} />
            <p className="font-display text-2xl text-[#F5F2EB]">No saved items yet</p>
            <p className="text-sm text-[#A8A29E] max-w-xs">
              Save your favorite skincare, color, and fragrance items here.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 divide-y divide-white/10">
            {items.map((product) => (
              <div key={product.id} className="py-4 first:pt-0 flex gap-4">
                <div className="h-20 w-24 shrink-0 overflow-hidden bg-[#141417] border border-white/10">
                  <LuxuryImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] text-[#A8A29E]">{product.category}</p>
                      <h3 className="font-display text-lg font-medium text-[#F5F2EB] truncate">
                        {product.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(product)}
                      aria-label={`Remove ${product.name} from wishlist`}
                      className="text-[#78716C] hover:text-red-400 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="font-mono-tabular text-sm font-semibold text-[#D4AF37]">
                      ${product.price.toFixed(0)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onMoveToCart(product)}
                      className="inline-flex items-center gap-1.5 bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-[#0A0A0B] hover:bg-[#E5C158]"
                    >
                      <ShoppingBag className="h-3.5 w-3.5" />
                      <span>Add to Bag</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
