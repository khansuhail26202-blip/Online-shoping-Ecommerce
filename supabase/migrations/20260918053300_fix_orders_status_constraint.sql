/*
# Fix: Expand orders status check constraint to include new tracking stages

1. Modified Constraints
- `orders_status_check` on `orders` table — dropped and recreated to include
  the new tracking statuses: 'confirmed', 'packed', 'out_for_delivery'.
  Full allowed list now: processing, confirmed, packed, shipped,
  out_for_delivery, delivered, cancelled.
2. Notes
- No data changes, no column changes. Only the CHECK constraint is replaced.
- This unblocks the progress_order_statuses() function which was failing
  because 'confirmed', 'packed', and 'out_for_delivery' were not allowed.
*/

ALTER TABLE orders DROP CONSTRAINT orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status = ANY (ARRAY[
    'processing'::text,
    'confirmed'::text,
    'packed'::text,
    'shipped'::text,
    'out_for_delivery'::text,
    'delivered'::text,
    'cancelled'::text
  ]));
