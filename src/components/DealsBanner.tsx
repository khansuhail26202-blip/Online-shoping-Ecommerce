import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { StarRating } from '@/components/StarRating';
import { Zap } from 'lucide-react';

interface DealsBannerProps {
  products: Product[];
  onOpen: (product: Product) => void;
}

export function DealsBanner({ products, onOpen }: DealsBannerProps) {
  const deals = products
    .filter((p) => p.discount_percent >= 30)
    .sort((a, b) => b.discount_percent - a.discount_percent)
    .slice(0, 6);

  if (deals.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1168b0] to-[#0d5a9c]">
        <Zap className="w-5 h-5 text-[#ff9f00] fill-[#ff9f00]" strokeWidth={1.5} />
        <h2 className="text-base font-bold text-white uppercase tracking-wide">Deal of the Day</h2>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-4 p-4 min-w-max">
          {deals.map((product) => (
            <button
              key={product.id}
              onClick={() => onOpen(product)}
              className="w-44 shrink-0 text-left group"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-slate-50 mb-2">
                <img
                  src={product.image_url}
                  alt={product.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <p className="text-xs text-slate-400 uppercase truncate">{product.brand}</p>
              <p className="text-sm text-slate-800 truncate">{product.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-slate-900">{formatPrice(product.price_cents)}</span>
                {product.original_price_cents && (
                  <span className="text-xs text-slate-400 line-through">{formatPrice(product.original_price_cents)}</span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-semibold text-emerald-600">{product.discount_percent}% off</span>
                <StarRating rating={product.rating} size="sm" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
