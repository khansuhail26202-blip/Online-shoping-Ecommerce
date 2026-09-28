/*
# Add location coordinates to orders table

1. New Columns
- `shipping_latitude` (double precision, nullable) — latitude of the delivery location selected on the map.
- `shipping_longitude` (double precision, nullable) — longitude of the delivery location selected on the map.

2. Notes
- Both columns are nullable so existing orders are unaffected.
- These store the pin location the customer picks on the map during checkout.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_latitude double precision;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_longitude double precision;