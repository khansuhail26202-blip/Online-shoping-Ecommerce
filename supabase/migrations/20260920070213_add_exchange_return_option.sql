/*
# Add exchange option to return flow (Flipkart-style)

1. Modified Functions
- Updated `progress_order_statuses()` so that:
  - return_action = 'refund' (or NULL) follows: return_picked_up -> refunded
  - return_action = 'replacement' follows: return_picked_up -> replacement_shipped -> replacement_delivered
  - return_action = 'exchange' follows: return_picked_up -> replacement_shipped -> replacement_delivered (same as replacement)
2. Notes
- No schema changes needed; exchange reuses the replacement timeline columns.
- The refund-only flow (refund_requested -> refund_approved -> refunded) remains for cases where no pickup is needed.
*/

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

  -- shipped -> out for delivery (after 30 seconds)
  UPDATE orders
  SET status = 'out_for_delivery', out_for_delivery_at = now()
  WHERE status = 'shipped'
    AND shipped_at IS NOT NULL
    AND now() - shipped_at >= interval '30 seconds'
    AND out_for_delivery_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- out for delivery -> delivered (after 30 seconds)
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

  -- RETURN FLOW (replacement/exchange): return_picked_up -> replacement_shipped (after 30 seconds)
  UPDATE orders
  SET status = 'replacement_shipped', replacement_shipped_at = now()
  WHERE status = 'return_picked_up'
    AND return_picked_up_at IS NOT NULL
    AND now() - return_picked_up_at >= interval '30 seconds'
    AND replacement_shipped_at IS NULL
    AND return_action IN ('replacement', 'exchange');
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- RETURN FLOW (replacement/exchange): replacement_shipped -> replacement_delivered (after 30 seconds)
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
