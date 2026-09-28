/*
# Add payment method fields to orders table

1. New Columns
- `payment_method` (text, nullable) — stores the payment method chosen at checkout: 'upi', 'card', or 'cod' (cash on delivery).
- `payment_upi_id` (text, nullable) — stores the UPI ID entered by the customer when paying via UPI.
- `payment_card_last4` (text, nullable) — stores the last 4 digits of the card used for payment.
- `payment_card_network` (text, nullable) — stores the card network (Visa, Mastercard, RuPay, etc.).
- `payment_cardholder_name` (text, nullable) — stores the name on the card used for payment.

2. Notes
- These fields are informational only — no real payment is processed.
- They allow the checkout flow to collect payment details (UPI ID or card info) like Flipkart/Amazon.
- The refund flow in ReturnModal reads `payment_method` to show the customer how their refund will be processed.
- All columns are nullable so existing orders are unaffected.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_upi_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card_last4 text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_card_network text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_cardholder_name text;