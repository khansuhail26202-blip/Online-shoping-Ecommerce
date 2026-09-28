import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/format';
import { X, Check, Loader2, MapPin, CreditCard, Smartphone, Wallet, ShieldCheck, Navigation } from 'lucide-react';
import type { CartItem } from '@/lib/types';
import { LocationPicker, type StructuredAddress } from '@/components/LocationPicker';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  onAuthRequired: () => void;
  buyNowItem?: CartItem | null;
}

type PaymentMethod = 'upi' | 'card' | 'cod';

const paymentOptions: { key: PaymentMethod; label: string; description: string; icon: typeof CreditCard }[] = [
  { key: 'upi', label: 'UPI', description: 'Pay using any UPI app', icon: Smartphone },
  { key: 'card', label: 'Credit / Debit Card', description: 'Visa, Mastercard, RuPay', icon: CreditCard },
  { key: 'cod', label: 'Cash on Delivery', description: 'Pay when you receive', icon: Wallet },
];

const cardNetworks = ['Visa', 'Mastercard', 'RuPay', 'Amex'];

function splitSelectedAddress(address: StructuredAddress): { street: string; city: string; postal: string } {
  const parts = address.fullAddress.split(',').map((part) => part.trim()).filter(Boolean);
  const postal = address.postal || address.fullAddress.match(/\b\d{6}\b/)?.[0] || '';
  const city = address.city || parts.slice(2).find((part) =>
    part !== postal && !/tahsil|tehsil|district|state|division|country|india/i.test(part)
  ) || '';
  const fullAddressParts = parts.filter(
    (part) => part !== city && part !== postal && !/^\d{6}$/.test(part)
  );
  const street = fullAddressParts.length > 0
    ? fullAddressParts.join(', ')
    : address.street;

  return { street, city, postal };
}

export function CheckoutModal({ open, onClose, onComplete, onAuthRequired, buyNowItem }: CheckoutModalProps) {
  const { items: cartItems, totalCents: cartTotal, clear } = useCart();

  const items = buyNowItem ? [buyNowItem] : cartItems;
  const totalCents = buyNowItem
    ? buyNowItem.product.price_cents * buyNowItem.quantity
    : cartTotal;
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postal, setPostal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardNetwork, setCardNetwork] = useState('Visa');
  const [showMap, setShowMap] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const detectNetwork = (num: string) => {
    const clean = num.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'Mastercard';
    if (clean.startsWith('6')) return 'RuPay';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'Amex';
    return 'Visa';
  };

  const validatePayment = (): string | null => {
    if (paymentMethod === 'upi') {
      if (!upiId.trim()) return 'Please enter your UPI ID.';
      if (!/^[\w.\-]+@[\w]+$/.test(upiId.trim())) return 'Enter a valid UPI ID (e.g. name@bank).';
    }
    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) return 'Enter a valid 16-digit card number.';
      if (!cardName.trim()) return 'Enter the name on your card.';
      if (cardExpiry.length < 5) return 'Enter card expiry (MM/YY).';
      if (cardCvv.length < 3) return 'Enter a valid CVV.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!session) {
      onAuthRequired();
      return;
    }

    const payErr = validatePayment();
    if (payErr) {
      setError(payErr);
      return;
    }

    setPlacing(true);
    try {
      const orderInsert: Record<string, unknown> = {
        user_id: session.user.id,
        total_cents: totalCents,
        shipping_name: name,
        shipping_address: address,
        shipping_city: city,
        shipping_postal_code: postal,
        placed_at: new Date().toISOString(),
        payment_method: paymentMethod,
      };

      if (selectedLat !== null) orderInsert.shipping_latitude = selectedLat;
      if (selectedLng !== null) orderInsert.shipping_longitude = selectedLng;

      if (paymentMethod === 'upi') {
        orderInsert.payment_upi_id = upiId.trim();
      } else if (paymentMethod === 'card') {
        orderInsert.payment_card_last4 = cardNumber.replace(/\s/g, '').slice(-4);
        orderInsert.payment_card_network = cardNetwork;
        orderInsert.payment_cardholder_name = cardName.trim();
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product.id,
        product_name: i.product.name,
        product_image_url: i.product.image_url,
        unit_price_cents: i.product.price_cents,
        quantity: i.quantity,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      setSuccess(true);
      if (!buyNowItem) clear();
      setTimeout(() => {
        setSuccess(false);
        setName('');
        setPhone('');
        setAddress('');
        setCity('');
        setPostal('');
        setUpiId('');
        setCardNumber('');
        setCardName('');
        setCardExpiry('');
        setCardCvv('');
        setSelectedLat(null);
        setSelectedLng(null);
        setShowMap(false);
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-in max-h-[90vh] flex flex-col">
        {success ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Order Confirmed!</h2>
            <p className="text-sm text-slate-500 mt-2">Your order has been placed successfully. We'll send a confirmation shortly.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#1168b0]">
              <h2 className="text-base font-bold text-white">Checkout</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-5 space-y-5 overflow-y-auto">
              {!session && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-md px-4 py-2.5 border border-amber-200">
                  Please sign in or create an account to complete your purchase.
                </p>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">
                        {product.name} <span className="text-slate-400">× {quantity}</span>
                      </span>
                      <span className="text-slate-600 tabular-nums">
                        {formatPrice(product.price_cents * quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-lg font-bold text-slate-900 tabular-nums">
                      {formatPrice(totalCents)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Shipping Address
                </h3>
                <div className="space-y-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                  />
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone number"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                  />
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street address / Flat / Building"
                    className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                    />
                    <input
                      required
                      value={postal}
                      onChange={(e) => setPostal(e.target.value)}
                      placeholder="PIN code"
                      className="px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                    />
                  </div>

                  {/* Map location toggle */}
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors border ${
                      showMap || selectedLat !== null
                        ? 'bg-blue-50 text-[#1168b0] border-[#1168b0]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <Navigation className="w-4 h-4" strokeWidth={2} />
                    {selectedLat !== null ? 'Location selected — tap to change' : 'Select location on map'}
                  </button>

                  {showMap && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <LocationPicker
                        onLocationSelect={(lat, lng, addr: StructuredAddress) => {
                          const selectedAddress = splitSelectedAddress(addr);
                          setSelectedLat(lat);
                          setSelectedLng(lng);
                          setAddress(selectedAddress.street);
                          setCity(selectedAddress.city);
                          setPostal(selectedAddress.postal);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Section */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Payment Method
                </h3>
                <div className="grid gap-2.5">
                  {paymentOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = paymentMethod === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPaymentMethod(opt.key)}
                        className={`flex items-center gap-3 px-4 py-3 text-left rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-[#1168b0] bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#1168b0]' : 'bg-slate-100'
                        }`}>
                          <Icon className={`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-[#1168b0]" strokeWidth={2.5} />}
                      </button>
                    );
                  })}
                </div>

                {/* UPI form */}
                {paymentMethod === 'upi' && (
                  <div className="mt-3 space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">UPI ID</label>
                      <input
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bankname"
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                      />
                      <p className="text-xs text-slate-400 mt-1.5">Enter your UPI ID linked to any UPI app (GPay, PhonePe, Paytm, etc.)</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 font-medium">Popular:</span>
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                        <span key={app} className="text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-600 font-medium">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Card form */}
                {paymentMethod === 'card' && (
                  <div className="mt-3 space-y-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Card Number</label>
                      <input
                        value={cardNumber}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          setCardNumber(formatted);
                          setCardNetwork(detectNetwork(formatted));
                        }}
                        placeholder="0000 0000 0000 0000"
                        inputMode="numeric"
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors font-mono tracking-wider"
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-slate-400">Detected:</span>
                        <span className="text-xs font-semibold text-slate-600">{cardNetwork}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1.5">Name on Card</label>
                      <input
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Cardholder name"
                        className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">Expiry</label>
                        <input
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                          placeholder="MM/YY"
                          inputMode="numeric"
                          className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">CVV</label>
                        <input
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="•••"
                          inputMode="numeric"
                          type="password"
                          className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs font-semibold text-slate-700 block mb-1.5">Network</label>
                        <select
                          value={cardNetwork}
                          onChange={(e) => setCardNetwork(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-md border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:border-[#1168b0] focus:ring-1 focus:ring-[#1168b0] transition-colors"
                        >
                          {cardNetworks.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* COD info */}
                {paymentMethod === 'cod' && (
                  <div className="mt-3 p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                    <Wallet className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" strokeWidth={2} />
                    <p className="text-xs text-amber-700">
                      Pay {formatPrice(totalCents)} in cash to the delivery agent when your order arrives. Keep exact change ready.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-1.5 mt-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2} />
                  <p className="text-xs text-slate-400">Your payment information is secure and encrypted.</p>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-md px-4 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={placing || items.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#ff9f00] text-white py-3.5 rounded-md text-sm font-bold uppercase tracking-wide hover:bg-[#f0a500] transition-colors disabled:opacity-50"
              >
                {placing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    Placing order…
                  </>
                ) : (
                  `Place Order · ${formatPrice(totalCents)}`
                )}
              </button>
              <p className="text-xs text-slate-400 text-center">Demo checkout — no real payment is processed.</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
