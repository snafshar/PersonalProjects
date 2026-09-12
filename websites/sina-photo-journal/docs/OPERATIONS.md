# Operating the journal

## Routine publishing

Use Studio with the owning ChatGPT account. Add meaningful alt text and captions. Publish a draft to expose only its web preview. Archive removes the listing without deleting originals needed by existing buyers. An original's uploaded bytes are never part of Git or a public asset directory.

## Data and backups

D1 stores profiles, photo metadata, orders and recorded customer requests. R2 stores previews and private originals. Source control is not a database or upload backup. Maintain private, encrypted exports using the hosting provider's administrative capabilities and keep a restoration procedure. Do not upload production database exports to the public repository.

Review customer requests and delivery failures regularly. Apply statutory response/refund deadlines. Retain accounting and dispute records only for the applicable legal periods, then remove them. Review legacy backups and provider retention too. If an upload fails after storing blobs, the route attempts to clean them up; inspect orphaned objects if storage cleanup itself fails.

## Access

Use OWNER_USER_ID after observing the owner's authenticated site-specific identity, otherwise the verified configured owner email. Keep production keys and owner settings in hosting secrets. Never assign admin status to the first person who registers. A new independent hosting provider needs a verified auth gateway before serving this code publicly.

## Limits and known boundaries

- Supported originals: JPEG, PNG, WebP; maximum 40 MB.
- The current feed loads the latest 100 photos; Studio the latest 200. Add pagination before a catalogue grows beyond these view limits.
- Up to 100 saved Photo Lab setups per account.
- No automatic invoicing/SDI, commercial licensing, physical prints, follow graph or public comments.
- No uploaded photographs or legacy customer data were available during initial development; the starter gallery is labelled AI sample artwork.
- Local integration tests verify Worker routes, D1 and R2. Provider live payments, live email deliverability and real browser/mobile interaction require verification in their actual environments before commerce opens.
- Review SEO in Search Console after real photographs are published. A sitemap and valid metadata do not guarantee indexing or ranking.

## Recovering a deployment

Preserve .openai/hosting.json and its project identity. Build and test changed source, save to GitHub, push the exact Sites source revision, package the build and publish a new version. Reuse existing deployment/version IDs when retrying an unchanged deployment. Append schema migrations; never rewrite applied migrations.

Customer requests retain the submitted contact email, timestamp and notice, even if a collection profile is later deleted. Acknowledgements are attempted through the configured sender. Review requests with a **Send confirmation email** button and retry failed confirmations promptly; receiving the notice never depends on successful email delivery.

Review **Custom requests** in Studio for new briefs and private messages. Customers see these in My collection → Custom orders. There are no automatic commission email notifications. Estimates, interest confirmations and closed enquiries do not record payment. Final custom-project terms and payment arrangements must be agreed separately. Contact details and conversation records remain subject to the privacy notice after profile deletion. The current views show the latest 100 enquiries and at most 200 messages per enquiry.
