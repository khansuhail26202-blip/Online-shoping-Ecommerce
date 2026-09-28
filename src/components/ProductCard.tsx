import { useState } from 'react';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { StarRating } from '@/components/StarRating';
import { Heart, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpen: (product: Product) => void;
}

export function ProductCard({ product, onOpen }: ProductCardProps) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [added, setAdded] = useState(false);
  const inWishlist = has(product.id);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggle(product);
  };

  return (
    <div
      onClick={() => onOpen(product)}
      className="group bg-white rounded-lg border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
        />
        {product.discount_percent > 0 && (
          <span className="absolute top-2 left-2 bg-[#1168b0] text-white text-xs font-bold px-2 py-1 rounded">
            {product.discount_percent}% OFF
          </span>
        )}
        <button
          onClick={handleWishlist}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
            inWishlist
              ? 'bg-red-50 text-red-500'
              : 'bg-white/80 text-slate-400 hover:text-red-500 hover:bg-white'
          }`}
          aria-label="Toggle wishlist"
        >
          <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={2} />
        </button>
        {product.inventory === 0 && (
          <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center">
            <span className="text-white text-sm font-semibold tracking-wide">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide truncate">{product.brand}</p>
        <h3 className="text-sm text-slate-800 mt-0.5 line-clamp-2 leading-snug flex-1">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1.5">
          <StarRating rating={product.rating} size="sm" showNumber />
          <span className="text-xs text-slate-400">{product.rating_count.toLocaleString()}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-base font-bold text-slate-900">{formatPrice(product.price_cents)}</span>
          {product.original_price_cents && product.original_price_cents > product.price_cents && (
            <span className="text-xs text-slate-400 line-through">{formatPrice(product.original_price_cents)}</span>
          )}
        </div>
        <button
          onClick={handleAdd}
          disabled={product.inventory === 0}
          className={`mt-3 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all duration-200 ${
            added
              ? 'bg-emerald-600 text-white'
              : 'bg-[#ff9f00] text-white hover:bg-[#f0a500] hover:shadow-md'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {added ? (
            <>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Added
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" strokeWidth={2} />
              Add to Cart
            </>
          )}
        </button>
      </div>
    </div>
  );
}
