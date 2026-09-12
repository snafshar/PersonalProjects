# Release verification — 12 September 2026

The production build and strict TypeScript check passed. Eleven core tests and twenty-one isolated server integration checks passed.

Core checks cover exposure calculations, the handheld correction, every recovered shooting scenario, out-of-range lens advice, unavailable flash, upload content detection, input validation, payment matching and webhook signatures.

Server checks execute the built Worker against temporary D1 and R2 stores. They cover public rendering, metadata endpoints, access control, cross-origin rejection, account consent, saved-setup isolation, draft and published uploads, escaped captions, private original bytes, disabled checkout, duplicate active-order prevention, buyer-only downloads, refunded-order rejection, customer requests and account deletion with financial-record retention. Custom-order checks cover public discovery, authenticated submission, consent/date validation, customer isolation, owner-only estimates, stale-proposal rejection, server-assigned message authorship and account exports.

No production buyer data or real payment method was used. No real email was sent. Browser interaction, live ChatGPT authentication redirects, live payment-provider flows and delivery-provider behaviour were not independently exercised by these tests. A production build and passing tests do not establish the absence of all bugs or certify legal compliance.

Checkout remains disabled pending the setup and provider tests in COMMERCE_SETUP.md. Legal policies require verification against the actual seller, jurisdiction, taxes and operating practices.
