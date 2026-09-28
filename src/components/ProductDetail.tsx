import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Product, Review } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/format';
import { StarRating } from '@/components/StarRating';
import { X, Heart, ShoppingCart, Zap, Truck, Shield, RotateCcw, Star } from 'lucide-react';

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onAuthRequired: () => void;
}

export function ProductDetail({ product, onClose, onBuyNow, onAuthRequired }: ProductDetailProps) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const { session } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setShowReviewForm(false);
    if (!product) return;
    setReviewsLoading(true);
    (async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      setReviews((data as Review[]) ?? []);
      setReviewsLoading(false);
    })();
  }, [product]);

  if (!product) return null;

  const inWishlist = has(product.id);

  const handleAddToCart = () => {
    add(product, quantity);
  };

  const handleBuyNow = () => {
    onBuyNow(product, quantity);
  };

  const handleWishlist = () => {
    if (!session) {
      onAuthRequired();
      return;
    }
    toggle(product);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !product) return;
    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: session.user.id,
      rating: newRating,
      title: newTitle.trim(),
      body: newBody.trim(),
    });
    setSubmittingReview(false);
    if (!error) {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      setReviews((data as Review[]) ?? []);
      setShowReviewForm(false);
      setNewTitle('');
      setNewBody('');
      setNewRating(5);
    }
  };

  return (
    <div className="fixed inset-0 z-[55] bg-white overflow-y-auto">
      {/* Header bar */}
      <div className="sticky top-0 bg-white border-b border-slate-200 z-10 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
        >
          <X className="w-5 h-5" strokeWidth={1.5} />
          Close
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="md:sticky md:top-16 md:self-start">
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-50 border border-slate-200">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{product.brand}</p>
            <h1 className="text-xl md:text-2xl font-medium text-slate-900 mt-1">{product.name}</h1>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-[#1168b0] text-white px-2 py-0.5 rounded text-sm font-semibold">
                {product.rating.toFixed(1)}
                <Star className="w-3 h-3 fill-white" strokeWidth={0} />
              </div>
              <span className="text-sm text-slate-400">{product.rating_count.toLocaleString()} Ratings & {reviews.length} Reviews</span>
            </div>

            <div className="flex items-baseline gap-3 mt-5">
              <span className="text-3xl font-bold text-slate-900">{formatPrice(product.price_cents)}</span>
              {product.original_price_cents && product.original_price_cents > product.price_cents && (
                <>
                  <span className="text-lg text-slate-400 line-through">{formatPrice(product.original_price_cents)}</span>
                  <span className="text-lg font-semibold text-emerald-600">{product.discount_percent}% off</span>
                </>
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mt-5">{product.description}</p>

            {/* Stock */}
            <p className="text-sm mt-4">
              {product.inventory > 0 ? (
                <span className="text-emerald-600 font-medium">In Stock ({product.inventory} available)</span>
              ) : (
                <span className="text-red-500 font-medium">Out of Stock</span>
              )}
            </p>

            {/* Quantity */}
            {product.inventory > 0 && (
              <div className="flex items-center gap-3 mt-4">
                <span className="text-sm text-slate-600">Quantity</span>
                <div className="flex items-center border border-slate-300 rounded-md">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    −
                  </button>
                  <span className="text-sm w-10 text-center tabular-nums font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.inventory, q + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddToCart}
                disabled={product.inventory === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-white border-2 border-[#1168b0] text-[#1168b0] py-3 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#1168b0] hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={2} />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.inventory === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#ff9f00] text-white py-3 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#f0a500] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" strokeWidth={2} />
                Buy Now
              </button>
              <button
                onClick={handleWishlist}
                className={`w-12 flex items-center justify-center rounded-md border-2 transition-all ${
                  inWishlist
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-slate-300 text-slate-400 hover:text-red-500 hover:border-red-500'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} strokeWidth={2} />
              </button>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-200">
              <div className="flex flex-col items-center gap-1 text-center">
                <Truck className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                <p className="text-xs text-slate-500">Free Delivery</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <RotateCcw className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                <p className="text-xs text-slate-500">7-Day Returns</p>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield className="w-6 h-6 text-slate-400" strokeWidth={1.5} />
                <p className="text-xs text-slate-500">Warranty</p>
              </div>
            </div>

            {/* Reviews */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Reviews & Ratings</h2>
                {session && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="text-sm text-[#1168b0] font-medium hover:underline"
                  >
                    Write a review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-slate-50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Your rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                      >
                        <Star
                          className={`w-5 h-5 ${star <= newRating ? 'text-[#1168b0] fill-[#1168b0]' : 'text-slate-300'}`}
                          strokeWidth={0}
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Review title"
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1168b0] transition-colors"
                  />
                  <textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Share your experience…"
                    rows={3}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:border-[#1168b0] transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 py-2 bg-[#1168b0] text-white rounded-md text-sm font-medium hover:bg-[#0d5a9c] transition-colors disabled:opacity-50"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 text-slate-600 rounded-md text-sm hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {reviewsLoading ? (
                <p className="text-sm text-slate-400 py-4">Loading reviews…</p>
              ) : reviews.length === 0 ? (
                <p className="text-sm text-slate-400 py-4">No reviews yet. Be the first to review this product.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <StarRating rating={review.rating} size="sm" />
                        {review.title && (
                          <span className="text-sm font-medium text-slate-800">{review.title}</span>
                        )}
                      </div>
                      {review.body && (
                        <p className="text-sm text-slate-600 leading-relaxed">{review.body}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1.5">{formatDate(review.created_at)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
