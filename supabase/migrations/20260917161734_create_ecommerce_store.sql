/*
# Create boutique storefront data model

1. New Tables
- `products`: Public catalog records with name, category, price, description, image, and inventory.
- `orders`: Customer-owned purchases with payment-free demo checkout status and shipping details.
- `order_items`: Immutable line items connected to an order and product snapshot.

2. Security
- Enable RLS on all tables.
- Products are intentionally public catalog data and can be read by anonymous visitors.
- Orders and order items are restricted to the authenticated customer who owns the order.

3. Important Notes
- Customer identity uses Supabase Auth's built-in `auth.users` records.
- Prices are stored as integer cents to avoid rounding errors.
- Seed products use remote Unsplash image URLs for the demo catalog.
*/

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  inventory integer NOT NULL DEFAULT 0 CHECK (inventory >= 0),
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  shipping_name text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_image_url text NOT NULL,
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  quantity integer NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can create own orders" ON public.orders;
CREATE POLICY "Customers can create own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;
CREATE POLICY "Customers can update own orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can delete own orders" ON public.orders;
CREATE POLICY "Customers can delete own orders" ON public.orders FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Customers can view own order items" ON public.order_items;
CREATE POLICY "Customers can view own order items" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can create own order items" ON public.order_items;
CREATE POLICY "Customers can create own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can update own order items" ON public.order_items;
CREATE POLICY "Customers can update own order items" ON public.order_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
DROP POLICY IF EXISTS "Customers can delete own order items" ON public.order_items;
CREATE POLICY "Customers can delete own order items" ON public.order_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

INSERT INTO public.products (name, category, price_cents, description, image_url, inventory, featured)
SELECT * FROM (VALUES
  ('Forma Carryall', 'Bags', 16800, 'A structured everyday carryall in full-grain leather, designed to move from workdays to weekends.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 14, true),
  ('Alba Knit Dress', 'Apparel', 12400, 'Soft brushed knit with an easy midi silhouette and a clean, modern neckline.', 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?auto=format&fit=crop&w=900&q=85', 21, true),
  ('Sora Ceramic Set', 'Home', 7200, 'Hand-finished stoneware cups with a warm sand glaze for slow mornings.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', 18, true),
  ('Mara Wool Coat', 'Apparel', 28600, 'A relaxed, tailored wool coat with a softly architectural shoulder and deep pockets.', 'https://images.unsplash.com/photo-1539533018447-63fcce2678e5?auto=format&fit=crop&w=900&q=85', 8, false),
  ('Noa Fragrance Oil', 'Beauty', 5800, 'A quiet blend of cedar, iris, and skin musk in a travel-ready glass vial.', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=85', 26, false),
  ('Ode Linen Throw', 'Home', 9800, 'European linen with a washed finish that gets better with every season.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85', 11, false)
) AS seed(name, category, price_cents, description, image_url, inventory, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.products);
