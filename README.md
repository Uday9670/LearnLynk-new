To implement a Stripe Checkout flow for an application fee:

1. When a user initiates payment, insert a payment_requests row with: application_id, amount, currency, tenant_id, user_id, and status = 'pending'.
2. From the backend, create a Stripe Checkout Session with the application fee as a line item, and attach payment_request_id in metadata.
3. Store the returned session.id and session.url in the payment_requests row so the frontend can redirect the user to the hosted checkout page.
4. Implement Stripe webhooks (e.g., checkout.session.completed) with signature validation and idempotency.
5. When the webhook confirms the payment, update the payment_requests row to status = 'succeeded' and save payment_intent_id, session_id, paid_at, and receipt details.
6. Update the associated applications record to mark it as paid, or insert a row into an application_payments table.
7. Use the stored checkout_session_id or payment_intent_id to avoid double-processing webhook events.
8. Handle refunds or disputes via additional Stripe webhook events and update local records accordingly.
