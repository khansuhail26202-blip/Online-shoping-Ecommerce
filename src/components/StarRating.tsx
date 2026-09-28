interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  count?: number;
}

export function StarRating({ rating, size = 'sm', showNumber = false, count }: StarRatingProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  const sizeClass = sizes[size];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < fullStars) {
            return (
              <svg key={i} className={sizeClass} viewBox="0 0 24 24" fill="#1168b0">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            );
          }
          if (i === fullStars && hasHalf) {
            return (
              <svg key={i} className={sizeClass} viewBox="0 0 24 24">
                <defs>
                  <linearGradient id={`half-${i}`}>
                    <stop offset="50%" stopColor="#1168b0" />
                    <stop offset="50%" stopColor="#d1d5db" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  fill={`url(#half-${i})`}
                />
              </svg>
            );
          }
          return (
            <svg key={i} className={sizeClass} viewBox="0 0 24 24" fill="#d1d5db">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-medium text-slate-600">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-slate-400">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
