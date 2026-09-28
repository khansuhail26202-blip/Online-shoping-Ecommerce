/*
# Add auto-progress function for order tracking

1. New Functions
- `progress_order_statuses()` — SECURITY DEFINER function that advances orders
  through tracking stages based on elapsed time since placement:
    - 0 min after placing → confirmed
    - 1 min after confirmed → packed
    - 2 min after packed → shipped
    - 3 min after shipped → out_for_delivery
    - 5 min after out_for_delivery → delivered
  Sets the corresponding timestamp column when advancing.
  Returns the number of orders updated.
2. Security
  - SECURITY DEFINER so it can update order timestamps.
  - Granted to authenticated role so the frontend can call it via RPC.
3. Notes
  - Does NOT touch cancelled orders.
  - Idempotent: calling it again is a no-op if no orders are ready to advance.
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
  -- processing → confirmed (immediately, 0 min)
  UPDATE orders
  SET status = 'confirmed', confirmed_at = now()
  WHERE status = 'processing' AND confirmed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- confirmed → packed (after 1 minute)
  UPDATE orders
  SET status = 'packed', packed_at = now()
  WHERE status = 'confirmed'
    AND confirmed_at IS NOT NULL
    AND now() - confirmed_at >= interval '1 minute'
    AND packed_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- packed → shipped (after 2 minutes from packed)
  UPDATE orders
  SET status = 'shipped', shipped_at = now()
  WHERE status = 'packed'
    AND packed_at IS NOT NULL
    AND now() - packed_at >= interval '2 minutes'
    AND shipped_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- shipped → out_for_delivery (after 3 minutes from shipped)
  UPDATE orders
  SET status = 'out_for_delivery', out_for_delivery_at = now()
  WHERE status = 'shipped'
    AND shipped_at IS NOT NULL
    AND now() - shipped_at >= interval '3 minutes'
    AND out_for_delivery_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  -- out_for_delivery → delivered (after 5 minutes from out_for_delivery)
  UPDATE orders
  SET status = 'delivered', delivered_at = now()
  WHERE status = 'out_for_delivery'
    AND out_for_delivery_at IS NOT NULL
    AND now() - out_for_delivery_at >= interval '5 minutes'
    AND delivered_at IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  v_total := v_total + v_updated;

  RETURN v_total;
END;
$$;

GRANT EXECUTE ON FUNCTION public.progress_order_statuses() TO authenticated;
