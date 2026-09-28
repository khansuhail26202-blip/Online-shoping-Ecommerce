/*
# Speed up order progression timing

1. Modified Functions
- `progress_order_statuses()` — replaced with faster timing intervals so orders
  advance through stages more quickly for a better real-time tracking experience:
    - processing → confirmed: immediately (0 min)
    - confirmed → packed: after 30 seconds
    - packed → shipped: after 30 seconds
    - shipped → out_for_delivery: after 30 seconds
    - out_for_delivery → delivered: after 30 seconds
  Total time from placed to delivered: ~2 minutes.
2. Notes
  - Same SECURITY DEFINER + authenticated grant as before.
  - Idempotent: no-op if no orders are ready to advance.
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

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.progress_order_statuses() TO authenticated;
