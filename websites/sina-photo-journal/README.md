# Sina Afshar — Photo Journal

A personal photography journal, original-image storefront and integrated Photo Lab. Built with React, TypeScript and Vinext for the OpenAI Sites Cloudflare Worker runtime.

Website: https://sina-photo-journal.afsharsn.chatgpt.site

## What works

- Server-rendered photographic journal, permanent photo pages, captions, alt text and image metadata.
- Photographer-only studio: JPEG/PNG/WebP uploads up to 40 MB, publish/draft/archive controls, caption and price editing.
- Private R2 originals and separate, watermarked JPEG web previews. The browser re-encodes previews, stripping original EXIF; the downloadable original preserves its uploaded bytes.
- Custom-order briefs, budget and deadline fields, private customer/photographer conversations, estimates, enquiry status tracking and owner management.
- ChatGPT sign-in/sign-out, collection registration, private dashboard, favourites, and durable saved setups.
- The recovered FramePilot engine and its actual **26 scenarios**, plus the corrected Exposure Lab calculator.
- Stripe Checkout integration with server-side pricing, signed webhook verification, purchase ownership checks, refund/dispute blocking and private downloads.
- Email order confirmations through Resend when configured; confirmation downloads and customer-request records.
- Privacy, cookies, terms, personal-use licence and withdrawal pages; data export and collection-account deletion.
- Canonical URLs, per-photo titles/descriptions, ImageObject JSON-LD, sitemap, robots rules and protected-page noindex.
- Local, clearly labelled AI-generated sample images. They are never sale items and stop appearing on the home gallery after the first real photograph is published.

## Current launch scope

The public journal, authentication, studio and Photo Lab can run without payment credentials. **Checkout is intentionally disabled until seller information, payment and receipt-email credentials, tax configuration and legal review are complete.** No real payment or real email was sent during development. No zero-bug, ranking, uptime or legal-compliance certification is claimed.

Authentication uses ChatGPT accounts. This is not an independent email/password registration system. Source integration does not migrate legacy Supabase identities or saved data from FramePilot.

## Use the site

1. Sign in using the owning ChatGPT account. Open **Studio** to publish.
2. Choose an original, add a title, caption and meaningful alt text. Confirm applicable rights.
3. Leave the price blank for a journal-only photograph, or set a price of at least €1 for a future sale item.
4. Save a draft or publish. Archiving removes the listing from the public journal and preserves originals required by previous purchases.
5. Collectors use **My collection** for originals, favourites, settings, account exports and support.

## Development and verification

Use Node 22.13+ (Node 24 recommended) and the pinned pnpm version in package.json.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm test:server
```

The server test starts an isolated Miniflare Worker using the real built routes, temporary D1/R2, synthetic users and fixture payments. It never sends email or charges a payment method. It validates ownership, uploads, original isolation, account deletion, cross-origin rejection, SSR, sitemap and robots endpoints.

Local development follows the included scripts. OpenAI Work environments use their managed preview controls. Outside them, local development auth is a test identity only. Production authentication is supplied by the trusted Sites dispatcher.

## Hosting and data

Logical bindings are declared in .openai/hosting.json: DB (D1), BUCKET (R2). Schema definitions live in db/schema.ts. Generate migrations with `pnpm db:generate`; preserve applied migrations and append changes. Sites creates actual resources and applies migrations during publication.

The Sites source repository and this GitHub copy contain source and sample assets, **not customer data, original uploads, production secrets or database backups**. Operators should maintain private backups of D1 and R2 and test restoration. See [OPERATIONS.md](docs/OPERATIONS.md).

## Security boundary

An optional credential-checking pre-commit hook is included. In a standalone checkout, enable it with `git config core.hooksPath .githooks`. In a monorepo, integrate `node scripts/check-secrets.mjs` into the existing repository hook from this project directory. It scans staged text and reports filenames only.

The app trusts identity headers only because production traffic comes through the Sites authentication dispatcher, which owns authentication. **Do not expose this Worker directly on an unrestricted workers.dev origin or another proxy that passes user-supplied identity headers.** A move to independent hosting requires a verified authentication gateway or replacing the identity adapter with a validated OAuth/session implementation. Changing hosting alone is insufficient.

Owner access uses a configured site user ID when available, otherwise the verified identity-provider email configured in secret hosting settings. There is no first-visitor admin assignment. Each private API checks identity server-side; browser visibility is not authorization.

## Custom orders

The /custom-orders page accepts authenticated enquiries. Submitting the terms-acknowledged form creates a collection profile if necessary. Customers track requests and private conversations from My collection → Custom orders; the photographer reviews all requests in Studio. Proposals are estimates. Confirming interest does not create a paid booking or binding contract. Custom projects require a separate written agreement and payment arrangement before work begins. No custom-project charge is taken by this workflow.

## Commerce

See [COMMERCE_SETUP.md](docs/COMMERCE_SETUP.md) for exact configuration and provider events. Secrets belong in hosting settings, never Git or captions. Payment processor, tax and email costs are separate from hosting; free hosting does not make transactions free.

## Sources and credits

- FramePilot source: https://github.com/snafshar/PersonalProjects/tree/main/mobile/framepilot
- Exposure Lab source: https://github.com/snafshar/PersonalProjects/tree/main/websites/exposure-lab
- The recovered source contained 26 scenarios despite the former README saying 27.
- Fixed the original Exposure Lab reversed handheld inequality and an inverted FramePilot focal-range display. Flash advice now respects unavailable lighting equipment.
- Initial sample artwork generated with OpenAI ImageGen for this website; prompts in docs/SAMPLE_ASSETS.json.
- Bundled third-party components retain their package and vendored licences.

Hosting comparison and primary legal references: [HOSTING_AND_LEGAL.md](docs/HOSTING_AND_LEGAL.md).
