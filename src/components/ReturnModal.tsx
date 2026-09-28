import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import {
  X, Check, RotateCcw, Wallet, RefreshCw, Truck, ChevronRight, ChevronLeft,
  AlertCircle, ShieldCheck, Clock, FileText,
} from 'lucide-react';

interface ReturnModalProps {
  order: Order;
  onClose: () => void;
  onComplete: () => void;
}

type Action = 'replacement' | 'exchange' | 'refund';

const actions: { key: Action; label: string; description: string; icon: typeof Check; color: string; bgClass: string; ring: string }[] = [
  {
    key: 'replacement',
    label: 'Replacement',
    description: 'Same product, brand new replacement',
    icon: RotateCcw,
    color: 'text-blue-600',
    bgClass: 'bg-blue-100',
    ring: 'ring-blue-400',
  },
  {
    key: 'exchange',
    label: 'Exchange',
    description: 'Swap for a different size or variant',
    icon: RefreshCw,
    color: 'text-violet-600',
    bgClass: 'bg-violet-100',
    ring: 'ring-violet-400',
  },
  {
    key: 'refund',
    label: 'Refund',
    description: 'Money back to your payment method',
    icon: Wallet,
    color: 'text-orange-600',
    bgClass: 'bg-orange-100',
    ring: 'ring-orange-400',
  },
];

const reasonOptions = [
  'Product damaged or defective',
  'Wrong item received',
  'Item did not match description',
  'No longer needed',
  'Quality not as expected',
  'Size or fit issue',
];

const pickupSlots = [
  'Tomorrow, 9 AM – 12 PM',
  'Tomorrow, 12 PM – 3 PM',
  'Tomorrow, 3 PM – 6 PM',
  'Day after tomorrow, 9 AM – 12 PM',
  'Day after tomorrow, 12 PM – 3 PM',
  'Day after tomorrow, 3 PM – 6 PM',
];

const getPaymentLabel = (order: Order) => {
  if (order.payment_method === 'upi') return `UPI (${order.payment_upi_id || 'N/A'})`;
  if (order.payment_method === 'card') return `Card (${order.payment_card_network || ''} •••• ${order.payment_card_last4 || ''})`;
  if (order.payment_method === 'cod') return 'Cash on Delivery';
  return 'Original Payment Method';
};

const getRefundMethods = (order: Order) => [
  { key: 'original', label: getPaymentLabel(order), sub: order.payment_method === 'cod' ? 'Refund as account credit' : '3-5 business days' },
  { key: 'wallet', label: 'ShopWave Wallet', sub: 'Instant' },
  { key: 'bank', label: 'Bank Account (NEFT)', sub: '5-7 business days' },
];

const stepLabels = ['Choose Action', 'Select Reason', 'Pickup Details', 'Review & Confirm'];

export function ReturnModal({ order, onClose, onComplete }: ReturnModalProps) {
  const [step, setStep] = useState(0);
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState('');
  const [comments, setComments] = useState('');
  const [slot, setSlot] = useState('');
  const [refundMethod, setRefundMethod] = useState('original');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedAction = actions.find((a) => a.key === action);

  const canProceed = () => {
    if (step === 0) return action !== null;
    if (step === 1) return reason !== '';
    if (step === 2) {
      if (action === 'refund') return refundMethod !== '';
      return slot !== '';
    }
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const update: Record<string, unknown> = {
      status: 'return_requested',
      refund_type: 'return',
      return_action: action,
      return_reason: reason,
      return_comments: comments || null,
      return_requested_at: new Date().toISOString(),
    };
    if (action === 'refund') {
      update.refund_method = refundMethod;
    } else {
      update.pickup_slot = slot;
    }
    const { error: rpcError } = await supabase.from('orders').update(update).eq('id', order.id);
    setSubmitting(false);
    if (rpcError) {
      setError('Something went wrong. Please try again.');
      return;
    }
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden animate-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Return or Replace Item</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-slate-500" strokeWidth={1.5} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, idx) => (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors ${
                      idx < step
                        ? 'bg-emerald-500 text-white'
                        : idx === step
                          ? 'bg-[#1168b0] text-white'
                          : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {idx < step ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] font-semibold hidden sm:block ${
                      idx <= step ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {idx < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 rounded ${idx < step ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-5 flex-1">
          {/* Product summary */}
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            {order.order_items?.[0] && (
              <img
                src={order.order_items[0].product_image_url}
                alt={order.order_items[0].product_name}
                className="w-14 h-14 object-cover rounded-lg bg-slate-50 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {order.order_items?.[0]?.product_name ?? 'Product'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Qty: {order.order_items?.[0]?.quantity ?? 1} · {formatPrice(order.total_cents)}
              </p>
            </div>
          </div>

          {/* Step 0: Choose action */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">How would you like to resolve this?</p>
              <div className="grid gap-2.5">
                {actions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = action === opt.key;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setAction(opt.key)}
                      className={`flex items-center gap-3 px-4 py-3.5 text-left rounded-xl border-2 transition-all ${
                        isSelected
                          ? `border-transparent ring-2 ${opt.ring} bg-slate-50`
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full ${opt.bgClass} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${opt.color}`} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800">{opt.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
                      </div>
                      {isSelected && <Check className={`w-5 h-5 ${opt.color}`} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Select reason */}
          {step === 1 && (
            <div className="space-y-4">
              {selectedAction && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100">
                  <selectedAction.icon className={`w-4 h-4 ${selectedAction.color}`} strokeWidth={2} />
                  <p className="text-xs font-semibold text-slate-700">{selectedAction.label} selected</p>
                </div>
              )}
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-2">Why are you returning this?</label>
                <div className="grid gap-2">
                  {reasonOptions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        reason === r
                          ? 'border-[#1168b0] bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        reason === r ? 'border-[#1168b0]' : 'border-slate-300'
                      }`}>
                        {reason === r && <div className="w-2.5 h-2.5 rounded-full bg-[#1168b0]" />}
                      </div>
                      <span className="text-sm text-slate-700">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 block mb-1.5">Additional comments (optional)</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={3}
                  placeholder="Tell us more about the issue…"
                  className="w-full text-sm text-slate-700 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#1168b0] resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Pickup or refund method */}
          {step === 2 && (
            <div className="space-y-4">
              {action === 'refund' ? (
                <>
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-orange-50 border border-orange-100">
                    <Wallet className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" strokeWidth={2} />
                    <p className="text-xs text-orange-700">
                      Your refund will be processed after the courier picks up your item. Choose how you'd like to receive it.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Refund method</label>
                    <div className="grid gap-2">
                      {getRefundMethods(order).map((m) => (
                        <button
                          key={m.key}
                          onClick={() => setRefundMethod(m.key)}
                          className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 text-left transition-all ${
                            refundMethod === m.key
                              ? 'border-orange-400 bg-orange-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{m.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                          </div>
                          {refundMethod === m.key && <Check className="w-5 h-5 text-orange-500" strokeWidth={2.5} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-blue-50 border border-blue-100">
                    <Truck className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" strokeWidth={2} />
                    <p className="text-xs text-blue-700">
                      Our courier will pick up the item at your address. Choose a pickup slot that works for you.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 block mb-2">Select a pickup slot</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pickupSlots.map((s) => (
                        <button
                          key={s}
                          onClick={() => setSlot(s)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border-2 text-left transition-all ${
                            slot === s
                              ? 'border-blue-400 bg-blue-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Clock className={`w-4 h-4 shrink-0 ${slot === s ? 'text-blue-500' : 'text-slate-400'}`} strokeWidth={2} />
                          <span className="text-xs font-medium text-slate-700">{s}</span>
                          {slot === s && <Check className="w-4 h-4 text-blue-500 ml-auto" strokeWidth={2.5} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Review & confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-700">Review your return request</p>
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400">Action</span>
                  <span className="text-sm font-semibold text-slate-800">{selectedAction?.label}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400">Reason</span>
                  <span className="text-sm font-semibold text-slate-800 text-right">{reason}</span>
                </div>
                {comments && (
                  <div className="flex items-start justify-between px-4 py-3 gap-4">
                    <span className="text-xs text-slate-400 shrink-0">Comments</span>
                    <span className="text-sm text-slate-600 text-right">{comments}</span>
                  </div>
                )}
                {action === 'refund' ? (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-400">Refund to</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {getRefundMethods(order).find((m) => m.key === refundMethod)?.label}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-slate-400">Pickup slot</span>
                    <span className="text-sm font-semibold text-slate-800 text-right">{slot}</span>
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs text-slate-400">Refund amount</span>
                  <span className="text-sm font-bold text-slate-900">{formatPrice(order.total_cents)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" strokeWidth={2} />
                <p className="text-xs text-emerald-700">
                  Your request will be reviewed and approved within 24 hours. You'll receive updates in your order tracking.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" strokeWidth={2} />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="px-5 py-4 border-t border-slate-200 bg-white flex items-center gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              disabled={submitting}
              className="flex items-center gap-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 text-sm font-bold text-white bg-[#1168b0] hover:bg-[#0d5290] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : (
                <>
                  <Check className="w-4 h-4" strokeWidth={2.5} />
                  Confirm return request
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
