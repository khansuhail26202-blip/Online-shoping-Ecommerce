/*
# Add return & refund support to orders

1. Modified Tables
- `orders`
  - Added `return_requested_at` (timestamptz, nullable) — when the customer requested a return
  - Added `return_approved_at` (timestamptz, nullable) — when the return was approved
  - Added `return_picked_up_at` (timestamptz, nullable) — when the courier picked up the return
  - Added `refund_processed_at` (timestamptz, nullable) — when the refund was completed
  - Added `return_reason` (text, nullable) — reason the customer gave for the return
  - Added `return_rejection_reason` (text, nullable) — reason if the return was rejected
2. Modified Constraints
- Extended the status CHECK constraint to include: 'return_requested', 'return_approved', 'return_rejected', 'return_picked_up', 'refunded'
3. Security
- No new tables; existing RLS policies on `orders` already cover UPDATE for authenticated owners.
4. Notes
- All new columns are nullable so existing rows are unaffected.
- The progress_order_statuses function is updated to auto-advance return stages with 30-second delays.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_picked_up_at timestamptz,
  ADD COLUMN IF NOT EXISTS refund_processed_at timestamptz,
  ADD COLUMN IF NOT EXISTS return_reason text,
  ADD COLUMN IF NOT EXISTS return_rejection_reason text;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'processing', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered',
    'cancelled',
    'return_requested', 'return_approved', 'return_rejected', 'return_picked_up', 'refunded'
  ));

CREATE OR REPLACE FUNCTION public.progress_order_statuses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
  v_total integer := 0;
BEGIN
  -- processing → confirmed (immediately)
  UPDATE orders
  SET status = 'confirmed', confirmed_at = now()
  WHERE status = 'processing' AND confirmed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- confirmed → packed (after 30 seconds)
  UPDATE orders
  SET status = 'packed', packed_at = now()
  WHERE status = 'confirmed'
    AND confirmed_at IS NOT NULL
    AND now() - confirmed_at >= interval '30 seconds'
    AND packed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- packed → shipped (after 30 seconds)
  UPDATE orders
  SET status = 'shipped', shipped_at = now()
  WHERE status = 'packed'
    AND packed_at IS NOT NULL
    AND now() - packed_at >= interval '30 seconds'
    AND shipped_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- shipped → out_for_delivery (after 30 seconds)
  UPDATE orders
  SET status = 'out_for_delivery', out_for_delivery_at = now()
  WHERE status = 'shipped'
    AND shipped_at IS NOT NULL
    AND now() - shipped_at >= interval '30 seconds'
    AND out_for_delivery_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- out_for_delivery → delivered (after 30 seconds)
  UPDATE orders
  SET status = 'delivered', delivered_at = now()
  WHERE status = 'out_for_delivery'
    AND out_for_delivery_at IS NOT NULL
    AND now() - out_for_delivery_at >= interval '30 seconds'
    AND delivered_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- return_requested → return_approved (after 30 seconds)
  UPDATE orders
  SET status = 'return_approved', return_approved_at = now()
  WHERE status = 'return_requested'
    AND return_requested_at IS NOT NULL
    AND now() - return_requested_at >= interval '30 seconds'
    AND return_approved_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- return_approved → return_picked_up (after 30 seconds)
  UPDATE orders
  SET status = 'return_picked_up', return_picked_up_at = now()
  WHERE status = 'return_approved'
    AND return_approved_at IS NOT NULL
    AND now() - return_approved_at >= interval '30 seconds'
    AND return_picked_up_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- return_picked_up → refunded (after 30 seconds)
  UPDATE orders
  SET status = 'refunded', refund_processed_at = now()
  WHERE status = 'return_picked_up'
    AND return_picked_up_at IS NOT NULL
    AND now() - return_picked_up_at >= interval '30 seconds'
    AND refund_processed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.progress_order_statuses() TO authenticated;
