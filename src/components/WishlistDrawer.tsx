import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';
import { StarRating } from '@/components/StarRating';
import type { Product } from '@/lib/types';
import { Heart, X, ShoppingCart } from 'lucide-react';

interface WishlistDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenProduct: (product: Product) => void;
}

export function WishlistDrawer({ open, onClose, onOpenProduct }: WishlistDrawerProps) {
  const { items, toggle } = useWishlist();
  const { add } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" fill="currentColor" strokeWidth={1.5} />
            Wishlist ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close wishlist"
          >
            <X className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <Heart className="w-12 h-12 text-slate-200" strokeWidth={1} />
            <p className="text-slate-400 text-sm">Your wishlist is empty.</p>
            <button
              onClick={onClose}
              className="text-sm text-[#1168b0] font-medium hover:underline"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {items.map(({ product }) => (
              <div key={product.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
                <button
                  onClick={() => {
                    onOpenProduct(product);
                    onClose();
                  }}
                  className="shrink-0"
                >
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md bg-slate-50"
                  />
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 uppercase">{product.brand}</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <StarRating rating={product.rating} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">{formatPrice(product.price_cents)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => add(product)}
                      disabled={product.inventory === 0}
                      className="flex items-center gap-1 bg-[#ff9f00] text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-[#f0a500] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3 h-3" strokeWidth={2} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => toggle(product)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </>
  );
}
