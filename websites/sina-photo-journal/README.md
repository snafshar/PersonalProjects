# Sina Afshar — Photo Journal

A personal photography journal, original-image storefront and integrated Photo Lab. Built with React, TypeScript and Vinext for the OpenAI Sites Cloudflare Worker runtime.

Website: https://sina-photo-journal.afsharsn.chatgpt.site

## What works

- Server-rendered photographic journal, permanent photo pages, captions, alt text and image metadata.
- Owner-only dashboard with eight sections: overview, posts and shop, new post, sales, customers, custom orders, support and shop readiness.
- JPEG/PNG/WebP uploads up to 40 MB, full post metadata editing, bulk publication and archiving, private original downloads and confirmed deletion of unused drafts. Photos with any order records are retained.
- Paginated and searchable post/customer/order lists, date and status filters, historical order details, payment reconciliation, receipt retries and sales CSV export (up to 5,000 filtered records).
- Real local photo editing with 24 distinct presets, adjustable strength, 12 image controls, before/after comparison, undo/redo, reusable settings files and JPEG/PNG/WebP downloads.
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

1. Sign in using the owning ChatGPT account. Open **Studio → New post**.
2. Choose an original, add a title, caption, meaningful alt text and optional camera details. Confirm applicable rights.
3. Turn on **Offer the original for sale** and enter a price of €1–€5,000, or leave the toggle off for a journal-only photograph.
4. Save a private draft or turn on journal visibility to publish. **Posts & shop** supports editing, search, bulk publication and archiving.
5. Review **Sales & orders**, **Customers**, **Custom orders** and **Customer support** for real account activity. **Shop readiness** lists missing seller and payment settings.
6. Collectors use **My collection** for originals, favourites, saved shooting setups, account exports and support.

## Photo editing

Open **Photo Lab → Photo editor** and choose a local JPEG, PNG or WebP. Everyday, Portrait, Landscape, Film, Monochrome and Low light each contain four presets. They use distinct pixel transformations, with linear-light exposure, tone adjustments, white balance, restrained vibrance, edge-aware smoothing, sharpening, split toning, grain and vignette. Preview thumbnails and downloads use the same processing engine in a Web Worker.

Choose a preset, adjust its strength and refine the twelve controls. Compare with the untouched source, undo/redo changes, or save/import a validated JSON settings file. Your editor image and edits remain available while switching Photo Lab tabs. Opening another photograph or leaving/reloading the page clears local edits. Images are processed in the browser and are not uploaded by the editor.

Input limits: 40 MB, 80 megapixels and 20,000 pixels on the longest edge. Export at original size up to 67 megapixels or choose a smaller long edge. Tiled processing bounds working memory, although the browser still needs memory for the decoded source and output canvas. Exports are 8-bit sRGB and remove embedded EXIF; PNG preserves transparency. No upscaling or RAW development is provided. Filters cannot recover lost focus, clipped detail or change the true capture resolution. Download the finished photograph before uploading it as a post original.

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
