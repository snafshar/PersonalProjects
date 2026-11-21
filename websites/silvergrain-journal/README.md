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
