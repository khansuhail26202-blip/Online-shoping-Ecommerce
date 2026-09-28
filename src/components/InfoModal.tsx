import { X, Package, RotateCcw, Truck, HelpCircle, Store, Shield, FileText } from 'lucide-react';

export type InfoModalType = 'track' | 'returns' | 'shipping' | 'faq' | 'about' | 'privacy' | 'terms';

interface InfoModalProps {
  type: InfoModalType | null;
  onClose: () => void;
  onTrackOrder: () => void;
}

const content: Record<Exclude<InfoModalType, 'track'>, { title: string; icon: typeof Truck; body: JSX.Element }> = {
  returns: {
    title: 'Returns & Refunds',
    icon: RotateCcw,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>We offer a <strong className="text-slate-900">7-day return policy</strong> on most items. After delivery, you'll see two separate options in your order tracking:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-orange-200 bg-orange-50 p-3">
            <p className="font-semibold text-orange-700 text-xs mb-1">Return Item</p>
            <p className="text-xs text-orange-600">Send the item back and get a full refund. A courier picks it up from your address.</p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
            <p className="font-semibold text-amber-700 text-xs mb-1">Request Refund</p>
            <p className="text-xs text-amber-600">Get your money back without returning the item — for damaged, missing, or wrong deliveries.</p>
          </div>
        </div>
        <div className="space-y-2.5">
          <p className="font-semibold text-slate-800">How to return or refund:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
            <li>Go to <strong className="text-slate-900">My Orders</strong> and find the order</li>
            <li>Click <strong className="text-slate-900">Track order</strong> to expand the details</li>
            <li>Choose <strong className="text-slate-900">Return Item</strong> or <strong className="text-slate-900">Request Refund</strong></li>
            <li>Select a reason from the dropdown</li>
            <li>For returns: pack the item and our courier picks it up</li>
            <li>Your refund is processed to your original payment method</li>
          </ol>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
          <p className="text-xs text-amber-700">
            <strong>Refund timeline:</strong> Refunds are processed within 3-5 business days after we receive and inspect the returned item. The amount will be credited to your original payment method.
          </p>
        </div>
        <div className="rounded-md bg-slate-50 border border-slate-200 p-3">
          <p className="text-xs text-slate-500">
            <strong>Non-returnable items:</strong> Personal care products, innerwear, opened software, and items marked as non-returnable cannot be returned.
          </p>
        </div>
      </div>
    ),
  },
  shipping: {
    title: 'Shipping Information',
    icon: Truck,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>We ship across India with <strong className="text-slate-900">free delivery on all orders</strong>. No minimum purchase required.</p>
        <div className="grid grid-cols-1 gap-3">
          <div className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Standard Delivery</p>
            <p className="text-xs text-slate-500">3-5 business days · Free</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Express Delivery</p>
            <p className="text-xs text-slate-500">1-2 business days · Rs 49</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3">
            <p className="font-semibold text-slate-800 text-xs uppercase tracking-wide mb-1">Same-Day Delivery</p>
            <p className="text-xs text-slate-500">Available in select cities · Rs 99</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-semibold text-slate-800">Order tracking:</p>
          <p>Once your order is shipped, you can track it in real-time through <strong className="text-slate-900">My Orders</strong>. You'll see each stage — Order Placed, Confirmed, Packed, Shipped, Out for Delivery, and Delivered — with timestamps.</p>
        </div>
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-700">
            <strong>Note:</strong> Delivery times may vary for remote areas. You'll receive updates at each stage of your order's journey.
          </p>
        </div>
      </div>
    ),
  },
  faq: {
    title: 'Frequently Asked Questions',
    icon: HelpCircle,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        {[
          {
            q: 'How do I track my order?',
            a: 'Click on "Track Order" in the footer or go to My Orders from the header. Find your order and click "Track order" to see the full delivery timeline with live status updates.',
          },
          {
            q: 'Can I cancel my order?',
            a: 'Yes, you can cancel your order anytime before it is shipped. Open the order tracking and click "Cancel this order". Once shipped, cancellation is no longer available.',
          },
          {
            q: 'How long does delivery take?',
            a: 'Standard delivery takes 3-5 business days and is free. Express delivery (1-2 days) is available for Rs 49, and same-day delivery is available in select cities for Rs 99.',
          },
          {
            q: 'What is the return policy?',
            a: 'After delivery, go to My Orders and click "Track order". You\'ll see two separate buttons: "Return Item" (send it back for a refund) or "Request Refund" (get money back without returning, for damaged/missing items). Pick one, select a reason, and the process runs automatically.'
          },
          {
            q: 'How do I create an account?',
            a: 'Click "Login" in the top right corner, then switch to the sign-up tab. Enter your email and password to create an account. You can start shopping immediately after signing up.',
          },
          {
            q: 'Is my payment secure?',
            a: 'Yes, all payments are processed through secure encrypted channels. We do not store your card details on our servers.',
          },
        ].map((item, i) => (
          <div key={i} className="border-b border-slate-100 pb-3 last:border-0">
            <p className="font-semibold text-slate-800 text-sm mb-1">{item.q}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    ),
  },
  about: {
    title: 'About ShopWave',
    icon: Store,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p>ShopWave is your one-stop online shopping destination, bringing you the best deals across electronics, fashion, home appliances, beauty, and more — all in one place.</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <p className="text-lg font-bold text-[#1168b0]">10M+</p>
            <p className="text-xs text-slate-500">Happy Customers</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <p className="text-lg font-bold text-[#1168b0]">500K+</p>
            <p className="text-xs text-slate-500">Products</p>
          </div>
          <div className="rounded-md border border-slate-200 p-3 text-center">
            <p className="text-lg font-bold text-[#1168b0]">19,000+</p>
            <p className="text-xs text-slate-500">Pin Codes Served</p>
          </div>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1.5">Our Mission</p>
          <p>To make online shopping effortless, affordable, and trustworthy for every Indian household. We curate quality products, deliver them fast, and stand behind every purchase with easy returns and refunds.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1.5">What Makes Us Different</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Genuine products with verified seller ratings</li>
            <li>Free standard delivery with no minimum order</li>
            <li>Real-time order tracking from placement to delivery</li>
            <li>Hassle-free 7-day returns with automatic refund processing</li>
            <li>Secure payments with bank-grade encryption</li>
          </ul>
        </div>
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-700">
            <strong>Founded in 2024</strong> · Headquartered in Bengaluru, India. Serving customers nationwide.
          </p>
        </div>
      </div>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    icon: Shield,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p className="text-xs text-slate-400">Last updated: September 2026</p>
        <div>
          <p className="font-semibold text-slate-800 mb-1">1. Information We Collect</p>
          <p>When you create an account, place an order, or contact support, we collect your name, email address, shipping address, phone number, and payment details. We also collect browsing data such as pages visited and products viewed to improve your shopping experience.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">2. How We Use Your Information</p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Process and deliver your orders</li>
            <li>Send order updates, tracking, and delivery notifications</li>
            <li>Provide customer support and handle returns/refunds</li>
            <li>Personalize product recommendations and deals</li>
            <li>Detect and prevent fraud or unauthorized activity</li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">3. Data Security</p>
          <p>All personal data is encrypted in transit and at rest. Payment information is processed through PCI-DSS compliant gateways — we never store full card numbers or CVV codes on our servers.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">4. Sharing Your Data</p>
          <p>We share data only with trusted partners necessary to fulfill orders — logistics providers, payment processors, and sellers. We never sell your personal information to third parties.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">5. Your Rights</p>
          <p>You can access, update, or delete your personal data at any time from your account settings. You may also request a complete data export or account deletion by contacting <span className="text-[#1168b0]">privacy@shopwave.in</span>.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">6. Cookies</p>
          <p>We use cookies to keep you logged in, remember your cart and wishlist, and understand how customers use our site. You can disable cookies in your browser settings, though some features may not work properly.</p>
        </div>
      </div>
    ),
  },
  terms: {
    title: 'Terms & Conditions',
    icon: FileText,
    body: (
      <div className="space-y-4 text-sm text-slate-600">
        <p className="text-xs text-slate-400">Last updated: September 2026</p>
        <div>
          <p className="font-semibold text-slate-800 mb-1">1. Acceptance of Terms</p>
          <p>By accessing or using ShopWave, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">2. Account Registration</p>
          <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your password and for all activities under your account.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">3. Orders & Pricing</p>
          <p>All product prices are listed in Indian Rupees (Rs) and include applicable taxes. We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspected fraudulent activity. Full payment is required at the time of placing an order.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">4. Cancellation</p>
          <p>Orders can be cancelled free of charge before they are shipped. Once an order is shipped, cancellation is no longer available, but you may request a return after delivery.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">5. Returns & Refunds</p>
          <p>Eligible items can be returned within 7 days of delivery. Refunds are processed to the original payment method after the returned item is received and inspected. Certain categories (personal care, innerwear, opened software) are non-returnable.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">6. Shipping</p>
          <p>Standard delivery is free across India. Express and same-day delivery options are available at additional cost in select areas. Delivery timelines are estimates and may vary due to weather, logistics, or remote locations.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">7. Product Warranty</p>
          <p>Products are covered by the manufacturer's warranty where applicable. Warranty claims should be directed to the authorized service centers of the respective brand.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">8. Limitation of Liability</p>
          <p>ShopWave shall not be liable for indirect, incidental, or consequential damages arising from the use of our services. Our total liability is limited to the order value paid by the customer.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">9. Changes to Terms</p>
          <p>We may update these Terms from time to time. Continued use of ShopWave after changes constitutes acceptance of the updated Terms.</p>
        </div>
      </div>
    ),
  },
};

export function InfoModal({ type, onClose, onTrackOrder }: InfoModalProps) {
  if (!type) return null;

  if (type === 'track') {
    return (
      <div className="fixed inset-0 z-[56] flex items-center justify-center px-4 py-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl overflow-hidden animate-in">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#1168b0]">
            <h2 className="text-base font-bold text-white">Track Your Order</h2>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" aria-label="Close">
              <X className="w-5 h-5 text-white" strokeWidth={1.5} />
            </button>
          </div>
          <div className="px-5 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-[#1168b0]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-slate-600 mb-5">
              Track your orders in real-time. View the full delivery timeline from Order Placed to Delivered with live status updates.
            </p>
            <button
              onClick={() => {
                onClose();
                onTrackOrder();
              }}
              className="w-full px-4 py-2.5 bg-[#1168b0] text-white text-sm font-bold rounded-md hover:bg-[#0d5a9c] transition-colors"
            >
              Go to My Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  const info = content[type];
  const Icon = info.icon;

  return (
    <div className="fixed inset-0 z-[56] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl overflow-hidden animate-in max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-[#1168b0]">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" strokeWidth={1.5} />
            <h2 className="text-base font-bold text-white">{info.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors" aria-label="Close">
            <X className="w-5 h-5 text-white" strokeWidth={1.5} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{info.body}</div>
      </div>
    </div>
  );
}
