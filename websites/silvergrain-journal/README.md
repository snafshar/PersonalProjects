# MyPhotoStories

A single-author photography magazine by Sina Afshar. The warm cream front page follows the original Silvergrain layout, with one photo-and-story row after another and images alternating sides. Each edition has up to ten stories in the author's chosen order. Readers open a text-first newspaper article and can send the editor a message. Photos display in black and white.

## Publishing a story

1. Open `/cntrladmin` directly and sign in with the owner's ChatGPT account. The dashboard is omitted from public navigation. There is no registration route.
2. Choose **New story**. Enter a headline and introduction, then write or paste the article. The toolbar supports headings, quotations, bold, italic and underline. Select **Justified** and one to four columns. Long articles flow onto additional sheets.
3. Choose **Arrange media**. Drag a gallery photo or video onto the newspaper sheet, including across a gutter. The surrounding text reflows in every affected column. On a touch screen you can select an item and tap its destination. With a keyboard, select an item, focus a sheet and press Enter.
4. Drag the frame to reposition it and drag its corner to resize. Hold Shift during a corner drag to keep its proportions. You can also enter an exact sheet, position, width and height. Use the arrow keys to move a focused frame or resize a focused corner. **Undo layout** and **Redo layout** include placement, captions and column changes.
5. Give each frame a caption underneath, optional text on the image or film, and an accessible description. Overlay positions are top, center and bottom. **Use as story cover** copies the frame's annotations to the cover. Double-click a text line to edit the paragraph on the sheet.

The cover appears on the front page and journal listing. An opened article begins with its heading and text. Its photos and videos appear in the positions set in the editor. Both the editor and published newspaper use whitespace between columns.

6. **Save draft** keeps your changes private. **Open saved draft preview** shows the same layout readers will see. **Publish story** updates the public article. **Unpublish story** takes it back to drafts. A stale save from another tab reports a conflict.
7. Set **Homepage order** under **Story details & cover**. Lower numbers appear earlier. Readers can follow previous and next stories by link or touch swipe. Small screens default to single-column reading and retain a Newspaper view.

Photos can be JPEG, PNG or WebP up to 16 MiB. Videos can be MP4 or WebM up to 80 MiB. Uploaded files enter the private gallery. A file becomes public when referenced by a published article. Unpublishing its last public reference removes public access.

## Site settings

Open **Site settings** in the dashboard at `/cntrladmin/site-settings`. Edit the blog name, tagline, author, location, search description and copyright credit. Colour controls cover the paper, name, main text, secondary text, links and separators. You can also choose the name font and size, story preview text size, page width, photo row spacing, posts per page, photo placement and monochrome or original-colour display.

The visibility controls cover captions, photo locations, dates, author details, row separators, menu links and the contact form. The desktop and mobile preview shows changes before publication. **Publish settings** applies them. **Revert changes** restores the last saved values, and **Use default settings** fills in the original settings for review. Changes to the same settings in another tab produce a conflict message.

## About me and News

**About me** and **News** are available in both the public navigation and the private dashboard. Publish your biography from **About me**. The initial biography uses the name, location and purpose already shown on the journal.

Under **News**, choose **New update** to use the same newspaper editor, private draft preview, media gallery and publishing controls as a story. Published updates appear at `/news`, with individual articles at `/news/<id>`. News drafts stay private. Existing journal stories keep their original addresses and order.

## Contact

In the dashboard, **Contact links** accepts Instagram and Telegram usernames, a WhatsApp number or chat link, and optional public email and phone details. A blank field hides that channel. **Inbox** receives reader contact forms. The form uses a short-lived arithmetic challenge, submission deduplication and rate limiting. Contact form messages stay in the dashboard.

## Running locally

Use Node.js 22.13 or newer and npm. The app runs as a Cloudflare Worker with a D1 database (`DB`) and an R2 bucket (`BUCKET`). Source files may be cloned independently of the hosted deployment.

```sh
npm ci
npm run build
```

On a fresh local database, apply the included schema migrations once, in order, from the project root.

```sh
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_left_punisher.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_reader_letters.sql
```

For local development on your computer, put `JOURNAL_OWNER_EMAIL=seedy@sites.test` in the ignored `.dev.vars` file and run `npm run dev`. Open the printed loopback address. Visit `/cntrladmin` to use the portable development identity. The production dashboard uses the managed sign-in service.

```sh
npm run check
npm test
```

Tests use disposable D1 and R2 bindings and a short video fixture. They exercise public and owner permissions, publishing and unpublishing, upload and range reads, contact settings and inbox privacy, text preservation across all four column counts, cross-column wrapping, resizing, and layout history.

## Hosting and source

`worker/` handles routing, authorization, validation and persistence. `studio/editor.mjs` contains the private authoring interface. `public/press/composition.mjs` calculates line and media placement, and `public/press/proof.mjs` renders those measurements in the editor and the published newspaper. Article HTML also includes a readable fallback when JavaScript is disabled.

On the hosted project, set `JOURNAL_OWNER_EMAIL` to the owner's verified sign-in email. The first matching sign-in binds the stable, site-specific account ID. Every management route checks that ID on the server. The gateway supplies the authenticated identity headers. A deployment on another host must provide a trusted authentication boundary that strips client-supplied identity headers and sets its own. Keep all credentials in runtime configuration.

The bundled photos and stories are labeled editorial samples. Font license files are included under `public/press/fonts/`.
# Visitor statistics and logs

Open **Statistics & logs** in the owner dashboard. The report includes page views, estimated cookie-based visitors, 30-minute sessions, post/news views, distinct posts viewed, daily counts, popular posts, sources, countries, devices and browsers. Filter by UTC date range, arrival source, device, or a search across pages, IPs, locations and campaign names. Logs paginate 50 rows at a time. A **View journey** link shows the pages and posts opened during that session, in order. The private CSV export uses the same filters, supports up to 5,000 rows and neutralises spreadsheet formulas.

Collection is first-party and **opt-in**. Public pages load `/press/visits.mjs`, which reads `/visit-policy` without creating analytics identifiers. An allow choice sends a same-origin JSON request to `/visit-event`; the server validates a published public page and assigns HttpOnly, SameSite cookies. A unique event key prevents duplicate retries. A browser cookie estimates visitors; it does not identify a person or reliably distinguish people sharing a device. Reports count page loads, including reloads, rather than reading completion. Recognised bots, prefetches, signed-in owner requests, Do Not Track and Global Privacy Control are excluded. Declining prevents new collection; withdrawing through **Visit preferences** also deletes records associated with the current browser cookie. Cookie deletion, browser blocking and visitors who decline cause undercounting. No historical visits are imported or invented.

Network information comes from the host's `CF-Connecting-IP` and Cloudflare request metadata. IPv4 and IPv6 are validated; a known cross-zone Worker proxy address is treated as unavailable. Country, region and city are approximate and shown as unknown when unavailable. No external IP lookup, GPS request, raw user-agent string, contact-form content, search query or full referring URL is stored. Device, browser and OS are inferred from the user-agent. The first arrival of a session is attributed using `utm_source` or a referring host; missing information is **Direct / unknown**, since apps and browsers may omit referrers. **Create a tracked sharing link** generates links for an Instagram bio, WhatsApp, Telegram or another source, with an optional campaign name.

**Logging & privacy settings** offers collection on/off, 7/30/90-day retention (default 30) and full/masked/no IP storage. Full IP logging starts only after consent. Masking truncates IPv4 to /24 and IPv6 to /48; choosing a more private mode also scrubs historical IP detail. A revision guard prevents an in-flight collector from reintroducing detail after a privacy change. A retention/IP-policy change asks for renewed consent. Expired records are excluded from reports and pruned on collector and dashboard/export requests; this is request-driven cleanup, not a scheduled timer. Lowering retention immediately prunes old rows. Clear-history requires typing `DELETE VISIT LOGS`. Data access, CSV export, session views, configuration and clearing all require owner authorisation; writes use the existing studio origin protection. The collector rejects cross-origin requests, limits JSON size and rate-limits using a daily hashed host-reported IP (or a validated visitor ID when an IP is unavailable).

The public `/privacy` page describes the implemented collection, cookies, data handling and owner contact route. Review that notice against your actual hosting and operating arrangements when moving to another provider. This implementation is not a claim of legal compliance in every deployment.
