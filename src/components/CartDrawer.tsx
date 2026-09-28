import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/format';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, totalCents, count, setQuantity, remove } = useCart();

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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#1168b0]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
            My Cart ({count})
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="w-12 h-12 text-slate-200" strokeWidth={1} />
            <p className="text-slate-400 text-sm">Your cart is empty.</p>
            <button
              onClick={onClose}
              className="text-sm text-[#1168b0] font-medium hover:underline"
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 pb-4 border-b border-slate-100 last:border-0">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-16 h-20 object-cover rounded-md bg-slate-50"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{product.name}</p>
                    <p className="text-xs text-slate-400 uppercase">{product.brand}</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{formatPrice(product.price_cents)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center border border-slate-300 rounded-md">
                        <button
                          onClick={() => setQuantity(product.id, quantity - 1)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" strokeWidth={2} />
                        </button>
                        <span className="text-sm w-8 text-center tabular-nums">{quantity}</span>
                        <button
                          onClick={() => setQuantity(product.id, quantity + 1)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" strokeWidth={2} />
                        </button>
                      </div>
                      <button
                        onClick={() => remove(product.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 space-y-3 bg-slate-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Amount</span>
                <span className="text-xl font-bold text-slate-900">{formatPrice(totalCents)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full bg-[#ff9f00] text-white py-3.5 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#f0a500] transition-colors"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
