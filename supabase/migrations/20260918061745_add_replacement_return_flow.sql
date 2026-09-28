/*
# Add replacement option to return flow

1. Modified Tables
- `orders`
  - Added `return_action` (text, nullable) — 'refund' or 'replacement', tracks what the customer chose when returning
  - Added `replacement_shipped_at` (timestamptz, nullable) — when the replacement order was shipped
  - Added `replacement_delivered_at` (timestamptz, nullable) — when the replacement order was delivered
2. Modified Constraints
- Extended the status CHECK constraint to include 'replacement_shipped' and 'replacement_delivered'
3. Modified Functions
- Updated `progress_order_statuses()` to auto-advance the replacement flow:
  return_picked_up -> replacement_shipped (30s) when return_action = 'replacement'
  replacement_shipped -> replacement_delivered (30s)
  The refund flow (return_action = 'refund') remains: return_picked_up -> refunded
4. Notes
- All new columns are nullable so existing rows are unaffected.
- 'replacement_delivered' is the terminal status for the replacement flow.
- 'refunded' remains the terminal status for the refund flow.
*/

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_action text,
  ADD COLUMN IF NOT EXISTS replacement_shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS replacement_delivered_at timestamptz;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'processing', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered',
    'cancelled',
    'return_requested', 'return_approved', 'return_rejected', 'return_picked_up',
    'refund_requested', 'refund_approved', 'refunded',
    'replacement_shipped', 'replacement_delivered'
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
  -- processing -> confirmed (immediately)
  UPDATE orders
  SET status = 'confirmed', confirmed_at = now()
  WHERE status = 'processing' AND confirmed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- confirmed -> packed (after 30 seconds)
  UPDATE orders
  SET status = 'packed', packed_at = now()
  WHERE status = 'confirmed'
    AND confirmed_at IS NOT NULL
    AND now() - confirmed_at >= interval '30 seconds'
    AND packed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- packed -> shipped (after 30 seconds)
  UPDATE orders
  SET status = 'shipped', shipped_at = now()
  WHERE status = 'packed'
    AND packed_at IS NOT NULL
    AND now() - packed_at >= interval '30 seconds'
    AND shipped_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- shipped -> out_for_delivery (after 30 seconds)
  UPDATE orders
  SET status = 'out_for_delivery', out_for_delivery_at = now()
  WHERE status = 'shipped'
    AND shipped_at IS NOT NULL
    AND now() - shipped_at >= interval '30 seconds'
    AND out_for_delivery_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- out_for_delivery -> delivered (after 30 seconds)
  UPDATE orders
  SET status = 'delivered', delivered_at = now()
  WHERE status = 'out_for_delivery'
    AND out_for_delivery_at IS NOT NULL
    AND now() - out_for_delivery_at >= interval '30 seconds'
    AND delivered_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW: return_requested -> return_approved (after 30 seconds)
  UPDATE orders
  SET status = 'return_approved', return_approved_at = now()
  WHERE status = 'return_requested'
    AND return_requested_at IS NOT NULL
    AND now() - return_requested_at >= interval '30 seconds'
    AND return_approved_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW: return_approved -> return_picked_up (after 30 seconds)
  UPDATE orders
  SET status = 'return_picked_up', return_picked_up_at = now()
  WHERE status = 'return_approved'
    AND return_approved_at IS NOT NULL
    AND now() - return_approved_at >= interval '30 seconds'
    AND return_picked_up_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW (refund): return_picked_up -> refunded (after 30 seconds)
  UPDATE orders
  SET status = 'refunded', refund_processed_at = now()
  WHERE status = 'return_picked_up'
    AND return_picked_up_at IS NOT NULL
    AND now() - return_picked_up_at >= interval '30 seconds'
    AND refund_processed_at IS NULL
    AND (return_action = 'refund' OR return_action IS NULL);
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW (replacement): return_picked_up -> replacement_shipped (after 30 seconds)
  UPDATE orders
  SET status = 'replacement_shipped', replacement_shipped_at = now()
  WHERE status = 'return_picked_up'
    AND return_picked_up_at IS NOT NULL
    AND now() - return_picked_up_at >= interval '30 seconds'
    AND replacement_shipped_at IS NULL
    AND return_action = 'replacement';
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW (replacement): replacement_shipped -> replacement_delivered (after 30 seconds)
  UPDATE orders
  SET status = 'replacement_delivered', replacement_delivered_at = now()
  WHERE status = 'replacement_shipped'
    AND replacement_shipped_at IS NOT NULL
    AND now() - replacement_shipped_at >= interval '30 seconds'
    AND replacement_delivered_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- REFUND-ONLY FLOW: refund_requested -> refund_approved (after 30 seconds)
  UPDATE orders
  SET status = 'refund_approved', refund_approved_at = now()
  WHERE status = 'refund_requested'
    AND refund_requested_at IS NOT NULL
    AND now() - refund_requested_at >= interval '30 seconds'
    AND refund_approved_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- REFUND-ONLY FLOW: refund_approved -> refunded (after 30 seconds)
  UPDATE orders
  SET status = 'refunded', refund_processed_at = now()
  WHERE status = 'refund_approved'
    AND refund_approved_at IS NOT NULL
    AND now() - refund_approved_at >= interval '30 seconds'
    AND refund_processed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.progress_order_statuses() TO authenticated;
