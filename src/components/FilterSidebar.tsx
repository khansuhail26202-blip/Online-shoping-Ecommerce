import { Star } from 'lucide-react';

interface FilterSidebarProps {
  categories: string[];
  brands: string[];
  activeCategory: string | null;
  activeBrand: string | null;
  minRating: number;
  priceRange: [number, number];
  maxPrice: number;
  onCategory: (cat: string | null) => void;
  onBrand: (brand: string | null) => void;
  onMinRating: (rating: number) => void;
  onPriceRange: (range: [number, number]) => void;
  onClear: () => void;
}

export function FilterSidebar({
  categories,
  brands,
  activeCategory,
  activeBrand,
  minRating,
  priceRange,
  maxPrice,
  onCategory,
  onBrand,
  onMinRating,
  onPriceRange,
  onClear,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Filters</h2>
        <button
          onClick={onClear}
          className="text-xs text-[#1168b0] font-medium hover:underline"
        >
          Clear All
        </button>
      </div>

      {/* Category */}
      <div className="border-b border-slate-200 pb-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Category</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={activeCategory === null}
              onChange={() => onCategory(null)}
              className="accent-[#1168b0]"
            />
            <span className="text-sm text-slate-600">All Categories</span>
          </label>
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={activeCategory === cat}
                onChange={() => onCategory(cat)}
                className="accent-[#1168b0]"
              />
              <span className="text-sm text-slate-600">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brand */}
      <div className="border-b border-slate-200 pb-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Brand</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={activeBrand === null}
              onChange={() => onBrand(null)}
              className="accent-[#1168b0]"
            />
            <span className="text-sm text-slate-600">All Brands</span>
          </label>
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={activeBrand === brand}
                onChange={() => onBrand(brand)}
                className="accent-[#1168b0]"
              />
              <span className="text-sm text-slate-600">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div className="border-b border-slate-200 pb-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Price Range</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>₹{(priceRange[0] / 100).toLocaleString('en-IN')}</span>
            <span>—</span>
            <span>₹{(priceRange[1] / 100).toLocaleString('en-IN')}</span>
          </div>
          <input
            type="range"
            min={0}
            max={maxPrice}
            step={1000}
            value={priceRange[1]}
            onChange={(e) => onPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-[#1168b0]"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={minRating === r}
                onChange={() => onMinRating(r)}
                className="accent-[#1168b0]"
              />
              <div className="flex items-center gap-1">
                <span className="text-sm text-slate-600">{r}</span>
                <Star className="w-3.5 h-3.5 fill-[#1168b0] text-[#1168b0]" strokeWidth={0} />
                <span className="text-sm text-slate-600">& above</span>
              </div>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={minRating === 0}
              onChange={() => onMinRating(0)}
              className="accent-[#1168b0]"
            />
            <span className="text-sm text-slate-600">All Ratings</span>
          </label>
        </div>
      </div>
    </div>
  );
}
