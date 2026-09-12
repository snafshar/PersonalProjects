# Opening original-photo sales

Sales are currently disabled. Connecting Stripe in ChatGPT does not automatically provision an API key or webhook signing secret in the website runtime. Journal publishing and Photo Lab do not depend on these credentials.

## Required hosted settings

| Setting | Purpose |
| --- | --- |
| SITE_URL | Exact HTTPS public origin used in checkout links and canonical metadata |
| OWNER_USER_ID | Preferred stable site-specific owner identity |
| OWNER_EMAIL | Fallback verified identity-provider email; ignored when owner ID is configured |
| STRIPE_SECRET_KEY | Secret Stripe API key for the intended test/live account |
| STRIPE_WEBHOOK_SECRET | Secret signing key for /api/stripe/webhook |
| RESEND_API_KEY | Secret transactional email key |
| RECEIPT_FROM_EMAIL | Verified sender, e.g. a mailbox on a domain you control |
| SELLER_NAME | Legal seller identity |
| SELLER_ADDRESS | Seller postal address |
| SELLER_EMAIL | Support and privacy contact |
| SELLER_PHONE | Contact telephone |
| SELLER_TAX_ID | Applicable registration / tax-status disclosure |
| STRIPE_TAX_CODE | Reviewed tax classification of the digital photograph |
| TAX_REVIEWED | true only after applicable taxes and registrations are configured |
| LEGAL_REVIEWED | true only after policies match the actual seller and operation |
| COMMERCE_ENABLED | true only after the entire test workflow passes |

Never invent seller/tax details or change the review flags just to hide readiness warnings. Credentials can be supplied directly in hosting settings; installing a ChatGPT plugin is not required for the application to call these provider APIs.

## Provider configuration

1. Complete the seller account identity and payout onboarding directly with the payment provider.
2. Set the actual tax registrations, prices and inclusive-tax treatment. The code enables Stripe automatic tax, collects billing addresses and tax IDs, and disables adaptive currency conversion so the charged currency/amount can be verified.
3. Register the HTTPS webhook at SITE_URL/api/stripe/webhook. Subscribe to checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, checkout.session.expired, charge.refunded and charge.dispute.created. Use the matching account mode and signing secret.
4. Configure a verified transactional email sender and reply-to support address. The order email includes seller details, total, original licence snapshot and the recorded withdrawal acknowledgement. Downloads wait until the confirmation service accepts that email.
5. Upload only photographs you can publish and license. Confirm model/property/artwork permissions where relevant. RAW/HEIC/TIFF are not supported by the current upload form; JPEG, PNG and WebP are supported.
6. In provider test mode, verify success, abandoned checkout, delayed payment, failed payment, signed-event retry, refund, dispute, duplicate purchase attempts, email delivery and another user's rejected download.
7. Arrange invoicing/accounting and any Italian VAT, registration or reporting obligations with a qualified professional. A Stripe payment confirmation is not automatically a compliant Italian electronic tax invoice. The website currently supplies an order confirmation, not an SDI integration.
8. Review the operator's privacy disclosures, provider contracts/transfers, retention rules, accessibility obligations and consumer policies against the actual business. Then enable live keys and COMMERCE_ENABLED.

## Operational behaviour

- Checkout creates a pending order with immutable seller/licence/consent snapshots. A unique active-purchase constraint and stable provider idempotency key prevent duplicate checkout creation. Open sessions are reused. Ambiguous requests without a recorded session stop after 20 minutes for operator reconciliation; do not delete them or issue a second checkout until the provider confirms the original outcome.
- Stripe confirmation must match session ID, buyer ID, photo ID, full amount and EUR currency.
- The browser success URL never itself grants access.
- Full refunds and disputes disable downloads. Partial refunds and dispute resolution may require operator review.
- Users can report faulty content regardless of withdrawal status. Refund requests do not automatically move money; the seller must assess and issue appropriate refunds through the payment provider.
- The current gateway uses ChatGPT identity. Collector email/password accounts independent of ChatGPT require an additional identity integration.
