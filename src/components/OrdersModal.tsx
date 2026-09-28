import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Order } from '@/lib/types';
import { formatPrice, formatDate, formatDateTime } from '@/lib/format';
import {
  Package, X, Check, Truck, Box, Home, Clock, MapPin,
  ChevronDown, ChevronUp, Ban, AlertCircle, RotateCcw, Wallet,
  CreditCard, Smartphone,
} from 'lucide-react';
import { ReturnModal } from '@/components/ReturnModal';

interface OrdersModalProps {
  open: boolean;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  processing: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  packed: 'bg-purple-100 text-purple-700',
  shipped: 'bg-blue-100 text-blue-700',
  out_for_delivery: 'bg-cyan-100 text-cyan-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
  return_requested: 'bg-orange-100 text-orange-700',
  return_approved: 'bg-teal-100 text-teal-700',
  return_rejected: 'bg-red-100 text-red-700',
  return_picked_up: 'bg-sky-100 text-sky-700',
  refund_requested: 'bg-amber-100 text-amber-700',
  refund_approved: 'bg-yellow-100 text-yellow-700',
  refunded: 'bg-green-100 text-green-700',
  replacement_shipped: 'bg-blue-100 text-blue-700',
  replacement_delivered: 'bg-emerald-100 text-emerald-700',
};

const statusLabels: Record<string, string> = {
  processing: 'Order Placed',
  confirmed: 'Confirmed',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return Requested',
  return_approved: 'Return Approved',
  return_rejected: 'Return Rejected',
  return_picked_up: 'Return Picked Up',
  refund_requested: 'Refund Requested',
  refund_approved: 'Refund Approved',
  refunded: 'Refund Processed',
  replacement_shipped: 'Replacement Shipped',
  replacement_delivered: 'Replacement Delivered',
};

interface TrackingStep {
  key: string;
  label: string;
  description: string;
  icon: typeof Check;
  timestampField: keyof Order;
}

const deliverySteps: TrackingStep[] = [
  { key: 'processing', label: 'Order Placed', description: 'Your order has been placed successfully', icon: Check, timestampField: 'placed_at' },
  { key: 'confirmed', label: 'Confirmed', description: 'Seller has confirmed your order', icon: Check, timestampField: 'confirmed_at' },
  { key: 'packed', label: 'Packed', description: 'Your order has been packed', icon: Box, timestampField: 'packed_at' },
  { key: 'shipped', label: 'Shipped', description: 'Your order has been shipped', icon: Truck, timestampField: 'shipped_at' },
  { key: 'out_for_delivery', label: 'Out for Delivery', description: 'Your order is out for delivery', icon: Truck, timestampField: 'out_for_delivery_at' },
  { key: 'delivered', label: 'Delivered', description: 'Your order has been delivered', icon: Home, timestampField: 'delivered_at' },
];

const refundOnlySteps: TrackingStep[] = [
  { key: 'return_requested', label: 'Refund Requested', description: 'You requested a refund for this order', icon: Wallet, timestampField: 'return_requested_at' },
  { key: 'return_approved', label: 'Refund Approved', description: 'Your refund request has been approved', icon: Check, timestampField: 'return_approved_at' },
  { key: 'return_picked_up', label: 'Item Picked Up', description: 'Courier has picked up your item', icon: Truck, timestampField: 'return_picked_up_at' },
  { key: 'refunded', label: 'Refund Processed', description: 'Your refund has been processed to your original payment method', icon: Wallet, timestampField: 'refund_processed_at' },
];

const returnRefundSteps: TrackingStep[] = [
  { key: 'return_requested', label: 'Return Requested', description: 'You requested a return for this order', icon: RotateCcw, timestampField: 'return_requested_at' },
  { key: 'return_approved', label: 'Return Approved', description: 'Your return request has been approved', icon: Check, timestampField: 'return_approved_at' },
  { key: 'return_picked_up', label: 'Return Picked Up', description: 'Courier has picked up your return', icon: Truck, timestampField: 'return_picked_up_at' },
  { key: 'refunded', label: 'Refund Processed', description: 'Your refund has been processed to your original payment method', icon: Wallet, timestampField: 'refund_processed_at' },
];

const returnReplacementSteps: TrackingStep[] = [
  { key: 'return_requested', label: 'Return Requested', description: 'You requested a return for this order', icon: RotateCcw, timestampField: 'return_requested_at' },
  { key: 'return_approved', label: 'Return Approved', description: 'Your return request has been approved', icon: Check, timestampField: 'return_approved_at' },
  { key: 'return_picked_up', label: 'Return Picked Up', description: 'Courier has picked up your return', icon: Truck, timestampField: 'return_picked_up_at' },
  { key: 'replacement_shipped', label: 'Replacement Shipped', description: 'Your replacement order has been shipped', icon: Truck, timestampField: 'replacement_shipped_at' },
  { key: 'replacement_delivered', label: 'Replacement Delivered', description: 'Your replacement order has been delivered', icon: Home, timestampField: 'replacement_delivered_at' },
];

const deliveryStageOrder = ['processing', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const returnRefundStageOrder = ['return_requested', 'return_approved', 'return_picked_up', 'refunded'];
const returnReplacementStageOrder = ['return_requested', 'return_approved', 'return_picked_up', 'replacement_shipped', 'replacement_delivered'];

function getDeliveryStage(status: string): number {
  const idx = deliveryStageOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function getReturnRefundStage(status: string): number {
  const idx = returnRefundStageOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function getReturnReplacementStage(status: string): number {
  const idx = returnReplacementStageOrder.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function isReturnActive(status: string): boolean {
  return returnRefundStageOrder.includes(status) || returnReplacementStageOrder.includes(status);
}

function isReplacementFlow(status: string): boolean {
  return returnReplacementStageOrder.includes(status);
}

function isRefundFlow(status: string): boolean {
  return returnRefundStageOrder.includes(status);
}

function TrackingTimeline({ steps, order, currentStage }: { steps: TrackingStep[]; order: Order; currentStage: number }) {
  return (
    <div className="relative pl-1">
      <div className="absolute left-[18px] top-3 bottom-3 w-0.5 bg-slate-200" />
      <div className="space-y-3.5">
        {steps.map((step, idx) => {
          const isDone = idx <= currentStage;
          const isCurrent = idx === currentStage;
          const timestamp = order[step.timestampField] as string | null;
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative flex items-start gap-3">
              <div
                className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300 ${
                  isDone
                    ? isCurrent
                      ? 'bg-[#1168b0] ring-4 ring-blue-100'
                      : 'bg-emerald-500'
                    : 'bg-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isDone ? 'text-white' : 'text-slate-400'}`} strokeWidth={2} />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <p className={`text-sm font-semibold ${isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#1168b0] animate-pulse">
                      Current
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-0.5 ${isDone ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isDone ? step.description : 'Pending'}
                </p>
                {isDone && timestamp && (
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" strokeWidth={1.5} />
                    {formatDateTime(timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}



function OrderCard({ order, onOrderChanged }: { order: Order; onOrderChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  const deliveryStage = getDeliveryStage(order.status);
  const isCancelled = order.status === 'cancelled';
  const returnActive = isReturnActive(order.status);
  const returnRejected = order.status === 'return_rejected';
  const isDelivered = order.status === 'delivered';
  const isRefunded = order.status === 'refunded';
  const isReplacementDelivered = order.status === 'replacement_delivered';
  const canCancel = !isCancelled && !returnActive && !returnRejected && deliveryStage < 3;
  const canRequestAfterDelivery = isDelivered;
  const replacementFlow = isReplacementFlow(order.status);
  const refundFlow = isRefundFlow(order.status);

  const nextStep = !isCancelled && !returnActive && !returnRejected && deliveryStage < deliverySteps.length - 1
    ? deliverySteps[deliveryStage + 1]
    : null;

  const handleCancel = async () => {
    setCancelling(true);
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    setCancelling(false);
    setShowCancelConfirm(false);
    onOrderChanged();
  };

  const renderStatusPreview = () => {
    if (isCancelled) return <span className="text-red-500 font-medium">Order cancelled</span>;
    if (returnRejected) return <span className="text-red-500 font-medium">Return rejected</span>;
    if (replacementFlow) {
      const stage = getReturnReplacementStage(order.status);
      const rs = returnReplacementSteps[stage];
      const next = stage < returnReplacementSteps.length - 1 ? returnReplacementSteps[stage + 1] : null;
      return (
        <>
          <span className="text-blue-600 font-medium">{rs.label}</span>
          {next && (<><span className="text-slate-300">→</span><span className="text-slate-400">Next: {next.label}</span></>)}
        </>
      );
    }
    if (refundFlow) {
      const stage = getReturnRefundStage(order.status);
      const rs = returnRefundSteps[stage];
      const next = stage < returnRefundSteps.length - 1 ? returnRefundSteps[stage + 1] : null;
      return (
        <>
          <span className="text-orange-600 font-medium">{rs.label}</span>
          {next && (<><span className="text-slate-300">→</span><span className="text-slate-400">Next: {next.label}</span></>)}
        </>
      );
    }
    if (isDelivered) return (
      <span className="text-emerald-600 font-medium flex items-center gap-1">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
        Delivered
      </span>
    );
    return (
      <>
        <span className="text-slate-600 font-medium">{statusLabels[order.status]}</span>
        {nextStep && (<><span className="text-slate-300">→</span><span className="text-slate-400">Next: {nextStep.label}</span></>)}
      </>
    );
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <div>
          <p className="text-sm font-bold text-slate-900">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-xs text-slate-400">{formatDate(order.created_at)}</p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            statusColors[order.status] ?? 'bg-slate-100 text-slate-600'
          }`}
        >
          {statusLabels[order.status] ?? order.status}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {order.order_items?.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <img
              src={item.product_image_url}
              alt={item.product_name}
              className="w-12 h-12 object-cover rounded-md bg-slate-50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 truncate">{item.product_name}</p>
              <p className="text-xs text-slate-400">
                Qty: {item.quantity} · {formatPrice(item.unit_price_cents)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick status preview */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 text-xs">{renderStatusPreview()}</div>
      </div>

      {/* Toggle tracking */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-semibold text-[#1168b0] bg-blue-50 hover:bg-blue-100 transition-colors border-t border-slate-200"
      >
        {expanded ? 'Hide details' : 'Track order'}
        {expanded ? <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} /> : <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />}
      </button>

      {/* Tracking timeline */}
      {expanded && (
        <div className="px-4 py-4 space-y-4 animate-in">
          {isCancelled ? (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-md border border-red-100">
              <X className="w-4 h-4 text-red-500" strokeWidth={2} />
              <p className="text-xs text-red-600 font-medium">This order was cancelled.</p>
            </div>
          ) : returnRejected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-md border border-red-100">
                <X className="w-4 h-4 text-red-500" strokeWidth={2} />
                <p className="text-xs text-red-600 font-medium">Your return request was rejected.</p>
              </div>
              {order.return_rejection_reason && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">Reason:</p>
                  <p className="text-xs text-red-600">{order.return_rejection_reason}</p>
                </div>
              )}
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Delivery Timeline</p>
                <TrackingTimeline steps={deliverySteps} order={order} currentStage={deliveryStageOrder.length - 1} />
              </div>
              {order.return_reason && (
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-600 mb-0.5">Return reason:</p>
                  <p className="text-xs text-slate-500">{order.return_reason}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Delivery timeline — hidden when return/refund/replacement flow is active */}
              {!returnActive && !isRefunded && !isReplacementDelivered && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">Delivery Timeline</p>
                  <TrackingTimeline
                    steps={deliverySteps}
                    order={order}
                    currentStage={deliveryStage}
                  />
                </div>
              )}

              {/* Refund-only timeline — shown when customer chose refund */}
              {refundFlow && order.return_action === 'refund' && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-600 mb-2 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" /> Refund Progress
                  </p>
                  <TrackingTimeline steps={refundOnlySteps} order={order} currentStage={getReturnRefundStage(order.status)} />
                  {order.return_reason && (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-0.5">Reason:</p>
                      <p className="text-xs text-slate-500">{order.return_reason}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Return timeline — shown when customer chose return/replacement/exchange */}
              {replacementFlow && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {order.return_action === 'exchange' ? 'Exchange Progress' : 'Replacement Progress'}
                  </p>
                  <TrackingTimeline steps={returnReplacementSteps} order={order} currentStage={getReturnReplacementStage(order.status)} />
                  {order.return_reason && (
                    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-600 mb-0.5">Reason:</p>
                      <p className="text-xs text-slate-500">{order.return_reason}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Shipping address */}
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Delivery Address
            </p>
            <p className="text-sm text-slate-700 font-medium">{order.shipping_name}</p>
            <p className="text-xs text-slate-500">
              {order.shipping_address}, {order.shipping_city} - {order.shipping_postal_code}
            </p>
          </div>

          {/* Cancel order section */}
          {canCancel && !showCancelConfirm && (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors rounded-md border border-red-200"
            >
              <Ban className="w-3.5 h-3.5" strokeWidth={2} />
              Cancel this order
            </button>
          )}

          {showCancelConfirm && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={2} />
                <p className="text-xs text-red-700 font-medium">
                  Are you sure you want to cancel this order? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling…' : 'Yes, cancel order'}
                </button>
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  disabled={cancelling}
                  className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-md transition-colors border border-slate-200"
                >
                  Keep order
                </button>
              </div>
            </div>
          )}

          {/* Return / Replace button — opens the multi-step wizard */}
          {canRequestAfterDelivery && !returnActive && !isRefunded && !isReplacementDelivered && !showReturnModal && (
            <button
              onClick={() => setShowReturnModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors rounded-md border border-orange-200"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={2} />
              Return or Replace
            </button>
          )}

          {/* Refund completed banner */}
          {isRefunded && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 flex items-start gap-2">
              <Wallet className="w-4 h-4 text-green-600 mt-0.5 shrink-0" strokeWidth={2} />
              <div>
                <p className="text-xs font-semibold text-green-700">Return &amp; refund completed</p>
                <p className="text-xs text-green-600 mt-0.5">
                  {formatPrice(order.total_cents)} has been refunded to your {order.payment_method === 'upi' ? `UPI (${order.payment_upi_id || 'N/A'})` : order.payment_method === 'card' ? `card (${order.payment_card_network || ''} •••• ${order.payment_card_last4 || ''})` : 'original payment method'}.
                </p>
              </div>
            </div>
          )}

          {/* Replacement/Exchange delivered banner */}
          {isReplacementDelivered && (
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 flex items-start gap-2">
              <Home className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" strokeWidth={2} />
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  {order.return_action === 'exchange' ? 'Exchange delivered' : 'Replacement delivered'}
                </p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Your {order.return_action === 'exchange' ? 'exchanged item' : 'replacement order'} has been delivered. Enjoy your new product!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {showReturnModal && (
        <ReturnModal
          order={order}
          onClose={() => setShowReturnModal(false)}
          onComplete={() => {
            setShowReturnModal(false);
            onOrderChanged();
          }}
        />
      )}

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <p className="text-xs text-slate-400">{order.order_items?.length ?? 0} item(s)</p>
          {order.payment_method && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              ·
              {order.payment_method === 'upi' ? (
                <Smartphone className="w-3 h-3" strokeWidth={2} />
              ) : order.payment_method === 'card' ? (
                <CreditCard className="w-3 h-3" strokeWidth={2} />
              ) : (
                <Wallet className="w-3 h-3" strokeWidth={2} />
              )}
              {order.payment_method === 'upi' ? 'UPI' : order.payment_method === 'card' ? 'Card' : 'COD'}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-slate-900">{formatPrice(order.total_cents)}</p>
      </div>
    </div>
  );
}

export function OrdersModal({ open, onClose }: OrdersModalProps) {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const fetchOrders = async () => {
    const s = sessionRef.current;
    if (!s) return;
    await supabase.rpc('progress_order_statuses');
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', s.user.id)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !session) return;
    setLoading(true);
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open, session]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden animate-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#1168b0]">
          <h2 className="text-base font-bold text-white">My Orders</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading your orders…</p>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-12 h-12 text-slate-200 mb-3" strokeWidth={1} />
              <p className="text-sm text-slate-400">No orders yet. When you place one, it'll show here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} onOrderChanged={fetchOrders} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
