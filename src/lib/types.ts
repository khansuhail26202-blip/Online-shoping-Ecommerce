export interface Product {
  id: string;
  name: string;
  category: string;
  brand: string;
  price_cents: number;
  original_price_cents: number | null;
  discount_percent: number;
  description: string;
  image_url: string;
  inventory: number;
  rating: number;
  rating_count: number;
  featured: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image_url: string;
  unit_price_cents: number;
  quantity: number;
}

export interface Order {
  id: string;
  user_id: string;
  status: string;
  total_cents: number;
  shipping_name: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  created_at: string;
  placed_at: string | null;
  confirmed_at: string | null;
  packed_at: string | null;
  shipped_at: string | null;
  out_for_delivery_at: string | null;
  delivered_at: string | null;
  return_requested_at: string | null;
  return_approved_at: string | null;
  return_picked_up_at: string | null;
  refund_processed_at: string | null;
  return_reason: string | null;
  return_rejection_reason: string | null;
  refund_type: string | null;
  refund_reason: string | null;
  refund_requested_at: string | null;
  refund_approved_at: string | null;
  return_action: string | null;
  return_comments: string | null;
  pickup_slot: string | null;
  refund_method: string | null;
  replacement_shipped_at: string | null;
  replacement_delivered_at: string | null;
  payment_method: string | null;
  payment_upi_id: string | null;
  payment_card_last4: string | null;
  payment_card_network: string | null;
  payment_cardholder_name: string | null;
  shipping_latitude: number | null;
  shipping_longitude: number | null;
  order_items?: OrderItem[];
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}
