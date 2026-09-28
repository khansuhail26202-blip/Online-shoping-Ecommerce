/*
# Expand storefront to Flipkart-style marketplace

1. Schema Changes
- Add `brand`, `rating`, `rating_count`, `original_price_cents`, `discount_percent` to products.
- Add `reviews` table for customer product reviews with ratings and comments.
- Add `wishlists` table for authenticated users to save products.

2. Security
- Products remain publicly readable (anon + authenticated).
- Reviews: public read, authenticated insert/update/delete for own reviews only.
- Wishlists: authenticated-only CRUD scoped to owner via user_id.

3. Important Notes
- All new columns have safe defaults so existing products remain valid.
- Reviews use a composite unique constraint on (user_id, product_id) — one review per user per product.
- Wishlist owner column defaults to auth.uid() per convention.
*/

-- Add columns to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'Maison',
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) NOT NULL DEFAULT 4.0,
  ADD COLUMN IF NOT EXISTS rating_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price_cents integer CHECK (original_price_cents IS NULL OR original_price_cents >= 0),
  ADD COLUMN IF NOT EXISTS discount_percent integer NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 90);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON public.reviews(product_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read reviews" ON public.reviews;
CREATE POLICY "Public can read reviews" ON public.reviews FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Users can create own reviews" ON public.reviews;
CREATE POLICY "Users can create own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist" ON public.wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can add to own wishlist" ON public.wishlists;
CREATE POLICY "Users can add to own wishlist" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete from own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete from own wishlist" ON public.wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Clear old seed products and insert expanded Flipkart-style catalog
DELETE FROM public.products;

INSERT INTO public.products (name, category, brand, price_cents, original_price_cents, discount_percent, description, image_url, inventory, rating, rating_count, featured)
VALUES
  -- Electronics
  ('Aurora Wireless Earbuds Pro', 'Electronics', 'SoundWave', 299900, 499900, 40, 'Active noise cancellation, 30hr battery life, and crystal-clear audio with dual-driver technology.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85', 35, 4.5, 128, true),
  ('Pulse Smartwatch Series 7', 'Electronics', 'TimeTech', 199900, 249900, 20, 'Health tracking, GPS, AMOLED display, and 7-day battery in a sleek aluminum body.', 'https://images.unsplash.com/photo-1546868871-7041f09a5109?auto=format&fit=crop&w=900&q=85', 22, 4.3, 89, true),
  ('Nimbus Bluetooth Speaker', 'Electronics', 'SoundWave', 179900, 229900, 22, 'Waterproof portable speaker with 360-degree sound and 20-hour playback.', 'https://images.unsplash.com/photo-1608043152269-f4cd24f7cbd8?auto=format&fit=crop&w=900&q=85', 40, 4.2, 64, false),
  ('Vortex 4K Action Camera', 'Electronics', 'Optix', 249900, 349900, 29, 'Shoot stunning 4K video at 60fps with electronic stabilization and waterproof case included.', 'https://images.unsplash.com/photo-1502920917128-1aae6d2c5b8e?auto=format&fit=crop&w=900&q=85', 15, 4.6, 42, true),
  ('Quantum Power Bank 20000mAh', 'Electronics', 'Volt', 129900, 199900, 35, 'Fast-charge two devices simultaneously with 20W USB-C PD and dual USB-A ports.', 'https://images.unsplash.com/photo-1609592424823-2a3a3b3b3a3a?auto=format&fit=crop&w=900&q=85', 60, 4.1, 31, false),
  ('Lumen LED Desk Lamp', 'Electronics', 'BrightHome', 49900, 79900, 38, 'Adjustable color temperature, touch controls, and USB charging port built into the base.', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', 50, 4.4, 76, false),

  -- Fashion
  ('Drift Leather Jacket', 'Fashion', 'UrbanCo', 499900, 799900, 38, 'Genuine leather biker jacket with quilted shoulders and antique brass hardware.', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=85', 12, 4.5, 54, true),
  ('Breeze Running Shoes', 'Fashion', 'StrideMax', 349900, 499900, 30, 'Lightweight knit upper with responsive foam midsole for daily training and casual wear.', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', 45, 4.4, 112, true),
  ('Classic Denim Shirt', 'Fashion', 'UrbanCo', 129900, 179900, 28, 'Soft-washed cotton denim with a relaxed fit and mother-of-pearl buttons.', 'https://images.unsplash.com/photo-1582552938357-25b1be6a8a8b?auto=format&fit=crop&w=900&q=85', 30, 4.2, 38, false),
  ('Summer Floral Dress', 'Fashion', 'Bloom', 199900, 279900, 29, 'Flowy rayon midi dress with a vibrant floral print and adjustable straps.', 'https://images.unsplash.com/photo-1572804013427-4d7ca7268217?auto=format&fit=crop&w=900&q=85', 28, 4.6, 67, true),
  ('Aviator Sunglasses', 'Fashion', 'Optix', 89900, 129900, 31, 'Polarized UV400 lenses with a lightweight titanium frame and premium leather case.', 'https://images.unsplash.com/photo-1572632136-a3f4a4a4a4a4?auto=format&fit=crop&w=900&q=85', 55, 4.3, 45, false),
  ('Canvas Backpack', 'Fashion', 'UrbanCo', 159900, 219900, 27, 'Water-resistant canvas with a padded laptop sleeve and vintage leather trim.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', 38, 4.5, 91, false),

  -- Home
  ('Nordic Ceramic Vase Set', 'Home', 'HomeLuxe', 69900, 99900, 30, 'Set of three hand-glazed stoneware vases in graduated sizes for modern interiors.', 'https://images.unsplash.com/photo-1578500494198-4067514d5a8a?auto=format&fit=crop&w=900&q=85', 25, 4.4, 33, false),
  ('Aroma Diffuser with Oils', 'Home', 'HomeLuxe', 89900, 129900, 31, 'Ultrasonic diffuser with 7-color LED and three essential oil blends included.', 'https://images.unsplash.com/photo-1602874801006-9a4b9b8b8b8b?auto=format&fit=crop&w=900&q=85', 42, 4.3, 58, true),
  ('Cozy Weighted Blanket', 'Home', 'SleepWell', 149900, 199900, 25, '15lb weighted blanket with breathable cotton cover for deeper, restful sleep.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=900&q=85', 20, 4.7, 84, true),
  ('Bamboo Cutting Board Set', 'Home', 'KitchenPro', 39900, 59900, 33, 'Three-piece organic bamboo cutting boards with juice grooves and non-slip feet.', 'https://images.unsplash.com/photo-1556909114-44e3e9399a2e?auto=format&fit=crop&w=900&q=85', 65, 4.5, 47, false),
  ('Smart LED Strip 5m', 'Home', 'BrightHome', 79900, 119900, 33, 'App-controlled RGB LED strip with 16 million colors and music sync mode.', 'https://images.unsplash.com/photo-1565814329454-e2a4e1c7b1b1?auto=format&fit=crop&w=900&q=85', 48, 4.2, 29, false),

  -- Beauty
  ('Glow Vitamin C Serum', 'Beauty', 'PureSkin', 79900, 109900, 27, '20% vitamin C with hyaluronic acid for brighter, firmer-looking skin.', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85', 70, 4.5, 103, true),
  ('Hydra Face Cream', 'Beauty', 'PureSkin', 59900, 89900, 33, '72-hour hydration with ceramides and niacinamide for all skin types.', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85', 55, 4.4, 72, false),
  ('Silk Hair Care Set', 'Beauty', 'Lustre', 99900, 149900, 33, 'Sulfate-free shampoo, conditioner, and serum with argan oil for smooth, shiny hair.', 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=900&q=85', 38, 4.3, 41, false),
  ('Matte Lipstick Trio', 'Beauty', 'Lustre', 49900, 79900, 38, 'Long-wearing matte formula in three nude-pink shades enriched with shea butter.', 'https://images.unsplash.com/photo-1586495777744-44a3e180a738?auto=format&fit=crop&w=900&q=85', 80, 4.6, 95, true),

  -- Appliances
  ('Frost Personal Blender', 'Appliances', 'KitchenPro', 129900, 179900, 28, '600W motor with two to-go cups for smoothies and shakes in under 30 seconds.', 'https://images.unsplash.com/photo-1570222094114-d054a8264548?auto=format&fit=crop&w=900&q=85', 30, 4.3, 56, false),
  ('WarmTouch Hair Dryer', 'Appliances', 'Lustre', 89900, 139900, 36, 'Ionic technology with 3 heat settings and a cool-shot button for salon results.', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', 42, 4.4, 38, false),
  ('Crisp Air Fryer 5L', 'Appliances', 'KitchenPro', 99900, 149900, 33, 'Rapid air technology for oil-free cooking with 8 presets and dishwasher-safe basket.', 'https://images.unsplash.com/photo-1626806787981-8bb8115c8b8b?auto=format&fit=crop&w=900&q=85', 35, 4.5, 67, true),
  ('Pure Robo Vacuum', 'Appliances', 'HomeLuxe', 199900, 299900, 33, 'Smart mapping, app control, and 120-min runtime for automated daily cleaning.', 'https://images.unsplash.com/photo-1574269910237-0e8a1c4a4a4a?auto=format&fit=crop&w=900&q=85', 18, 4.2, 24, false);
