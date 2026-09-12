# Hosting and legal research — 12 September 2026

## Hosting comparison

| Provider | Relevant free-tier position | Suitability |
| --- | --- | --- |
| Cloudflare Workers + D1 + R2 | Workers: 100,000 requests/day with a 10 ms CPU limit. D1: 5 GB total storage; daily read/write allowances. R2 Standard: 10 GB-month and included operations; no egress charge. | Strongest independent free-tier candidate for private photo storage. Usage can exceed free limits, and a full SSR app must be measured against the CPU allowance. |
| Netlify Free | 300 credits/month and no auto recharge. | Viable small launch option, but resource usage exhausts shared credits and can pause the site. Requires runtime/auth/storage adaptation. |
| Vercel Hobby | Restricted to non-commercial personal use. | Unsuitable for the intended photo shop. |
| GitHub Pages | Not allowed as free hosting for a site primarily facilitating commercial transactions. Static hosting does not provide this application's protected backend. | Use GitHub for source, not the shop runtime. |

This project is published through the already available OpenAI Sites connection, using managed Cloudflare infrastructure. That is distinct from deployment into a user-owned Cloudflare Free account. No separate host billing plan, paid upgrade or custom domain was purchased. Independent Cloudflare deployment would require account access, resource provisioning and an authentication adaptation; the existing identity headers must never be trusted on a directly exposed Worker.

Sources:

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/
- https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/
- https://vercel.com/docs/limits/fair-use-guidelines
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Implemented legal measures

The code provides operator contact, privacy/cookie disclosures, a personal-use digital licence, buyer consent captured before immediate digital delivery, durable order-email content, downloadable contract confirmations, a withdrawal-request function, account export/deletion and server-side sales-readiness gating.

Relevant primary sources:

- EU distance-selling and digital-content information/consent requirements: https://europa.eu/youreurope/business/selling-in-eu/selling-goods-services/ecommerce-distance-selling/index_en.htm
- EU withdrawal-function amendments, applied from 19 June 2026: https://eur-lex.europa.eu/eli/dir/2023/2673/oj/eng
- Garante cookie guidance, including the distinction between necessary and profiling cookies: https://www.garanteprivacy.it/faq/cookie
- Stripe checkout API: https://docs.stripe.com/api/checkout/sessions/create
- Stripe fulfilment: https://docs.stripe.com/checkout/fulfillment
- Resend email API: https://resend.com/docs/api-reference/emails/send-email

The implementation does not determine the seller's tax status, obtain model releases, create a business registration, register tax obligations, perform a formal accessibility audit, guarantee SEO rankings, or certify compliance. The public shop remains closed until the actual details and operating arrangements have been reviewed.
