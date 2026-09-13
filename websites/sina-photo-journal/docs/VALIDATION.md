# Release verification — 13 September 2026

The production build and strict TypeScript check passed. Nineteen core tests and thirty-one isolated server integration checks passed.

The navigation update uses native document links, so browsing does not depend on client-side route interception. Account creation also opens its destination with a document navigation. A reproduced Photo Lab hydration error was fixed by using the same explicit number locale on the server and client; dates rendered in collector lists now use UTC consistently. The locale regression compares rendered advice for all 26 scenarios under English and German process locales.

Managed-preview browser checks exercised the main navigation, all three sample photo links, the five legal destinations, the journal anchor, the Photo Lab link, sign-in/Join tabs, and the Exposure Lab tab and Landscape preset. The calculator updated to f/8, 1/60 s, ISO 100 and EV 11.9 after selecting Landscape. The updated production Worker test checks all 13 public homepage destinations and its referenced JavaScript/CSS assets.

Photo editor browser checks applied Silver monochrome, changed exposure, used undo/redo and before/after comparison, exported a PNG and reopened it through the local file chooser. The downloaded result was verified as a 1,536 × 1,024 PNG with equal RGB channels, pixels different from the source and no EXIF entries. All 24 preset thumbnails rendered. The exported browser Worker is included in the production assets and allowed by the CSP. The desktop homepage lead card and right-hand stack share identical top and bottom coordinates (458.484375 and 1123.296875 px at the checked viewport).

The seven new core checks cover all 24 distinct preset outputs, original/zero-strength identity, input/alpha preservation, tiled versus whole-image equivalence, exposure and monochrome effects, noise reduction, recipe validation and CSV formula neutralisation.

The eight new server checks cover owner-only dashboard/export/original access, all eight admin section renders, real aggregate and filtered database queries, full post edits preserving order snapshots, bulk visibility, retention of photos with order records, unused-draft file/bookmark deletion, pagination and escaped searches, historical CSV data and production Worker assets.

Core checks cover exposure calculations, the handheld correction, every recovered shooting scenario, out-of-range lens advice, unavailable flash, upload content detection, input validation, payment matching and webhook signatures.

Server checks execute the built Worker against temporary D1 and R2 stores. They cover public rendering, metadata endpoints, access control, cross-origin rejection, account consent, saved-setup isolation, draft and published uploads, escaped captions, private original bytes, disabled checkout, duplicate active-order prevention, buyer-only downloads, refunded-order rejection, customer requests and account deletion with financial-record retention. Custom-order checks cover public discovery, authenticated submission, consent/date validation, customer isolation, owner-only estimates, stale-proposal rejection, server-assigned message authorship and account exports.

No production buyer data or real payment method was used. No real email was sent. Browser interaction was checked in the managed preview; the reported live homepage failure was not independently reproduced. Live ChatGPT authentication redirects, live payment-provider flows and delivery-provider behaviour were not exercised. A production build and passing tests do not establish the absence of all bugs or certify legal compliance.

Checkout remains disabled pending the setup and provider tests in COMMERCE_SETUP.md. Legal policies require verification against the actual seller, jurisdiction, taxes and operating practices.
