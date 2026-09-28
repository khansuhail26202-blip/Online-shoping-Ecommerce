/*
# Add order tracking timeline columns

1. Modified Tables
- `orders`
  - `placed_at` (timestamptz, defaults to now()) — when the order was placed
  - `confirmed_at` (timestamptz, nullable) — when the seller confirmed the order
  - `packed_at` (timestamptz, nullable) — when the order was packed
  - `shipped_at` (timestamptz, nullable) — when the order was handed to courier
  - `out_for_delivery_at` (timestamptz, nullable) — when the courier started delivery
  - `delivered_at` (timestamptz, nullable) — when the order was delivered
2. Notes
  - All new columns are nullable and default to null except `placed_at` which defaults to now().
  - The `status` column is kept and updated as the order progresses through stages.
  - Backfill `placed_at` for existing orders using their `created_at` value.
  - No RLS policy changes needed — existing policies already cover the new columns.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS placed_at timestamptz DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS out_for_delivery_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

UPDATE orders SET placed_at = created_at WHERE placed_at IS NULL;
