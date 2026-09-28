/* Add richer return-request fields to support a multi-step return wizard */
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_comments text,
  ADD COLUMN IF NOT EXISTS pickup_slot text,
  ADD COLUMN IF NOT EXISTS refund_method text;
