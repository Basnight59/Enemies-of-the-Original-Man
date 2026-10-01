# Enemies of the Original Man — Authoritative Hub

Single-page landing site for *Enemies of the Original Man* by Abdullah Hakim Kenneth Basnight.
Static HTML/CSS/JS — no build step.

## Run locally
Open `index.html` in a browser, or serve the folder:

    python -m http.server 8000

## Files
- `index.html` — all sections, anchors and JSON-LD (Book + DefinedTerms)
- `styles.css` — design tokens and layout
- `site.js` — mobile menu, active-section highlighting, theme toggle and the chat widget
- `chat-worker/` — Cloudflare Worker behind the chat widget (not part of the static site)
- `img/` — front and back cover
- `audio/` — "Why There Was No Slave Trade" talk (32 kbps mono MP3, about 11 MB) played in the Media section
- `video/` — 30-second book trailer (vertical MP4) and its poster image, played in the Media section

## Direct sales (Stripe Payment Links)
The `#buy` section has a "Buy Direct From The Author" block above the retailer list. To go live:
1. In Stripe, turn on Stripe Tax and create one Payment Link each for: Signed Paperback (collect shipping
   address, shipping rates, custom field "Inscription name"), Paperback (shipping address and rates),
   and Ebook (no shipping; confirmation message saying the files arrive by email).
2. In `index.html`, replace each `href="#buy" aria-disabled="true"` with its Payment Link
   (`target="_blank" rel="noopener noreferrer"`), set the price text and the button label ("Buy Now").
3. Bulk orders: point that button at a `mailto:` quote address.
4. Add `offers` (price, priceCurrency, availability, url) to the Book entry in the JSON-LD.
Ebooks are delivered by hand at first. Stripe emails you each sale, and you reply with the files. BookFunnel can automate this later.
Check first that the Spines distribution agreement allows you to sell author copies directly.

## Booking (Work With The Author, `#book`)
- **Consultations:** in Google Calendar, use Create → Appointment schedule. Copy its booking-page link
  (`https://calendar.app.google/...`) into the `#consult` card's button. Replace `href="#book" aria-disabled="true"`
  with `href="<link>" target="_blank" rel="noopener noreferrer"`, and change the label to "Book a Consultation".
- **Speaking:** create a Google Form ("Speaking Engagement Request"), link it to a Sheet, and turn on email
  notifications. Put its share link (`https://forms.gle/...`) into the `#speaking` card's button the same way,
  labelled "Request a Speaking Engagement".
- The hero's "Book a Consultation" button scrolls to `#consult`, so it needs no change.

## Chat assistant (`chat-worker/`)
The "Ask about the book" widget (`site.js`, bottom of `index.html`) talks to a Cloudflare Worker. The Worker holds
the Anthropic API key and streams Claude's answers. It answers only from `chat-worker/src/knowledge.js`, so when
definitions, prices, or links change on the site, update that file and redeploy.

One-time setup:
1. Create an Anthropic API key at console.anthropic.com and set a monthly spend limit there.
2. Create a free Cloudflare account.
3. Run:

       cd chat-worker
       npm install
       npx wrangler login
       npx wrangler secret put ANTHROPIC_API_KEY
       npm run deploy

   `wrangler secret put` asks for the key, so it never goes in a file.
4. Put the printed `https://eotom-chat.<account>.workers.dev` URL into `CHAT_ENDPOINT` in `site.js` and push.
   The widget stays hidden while `CHAT_ENDPOINT` is empty.

Local testing: put `ANTHROPIC_API_KEY=...` in `chat-worker/.dev.vars` (git-ignored) and run `npm run dev` (port 8787).
Then set `CHAT_ENDPOINT` to `http://localhost:8787` and serve the site on port 8000; don't commit that change.
Allowed origins and the rate limit (20 requests per minute per IP) are in `chat-worker/wrangler.toml`. Each answer's
token usage is logged; view it with `npx wrangler tail`.

## TODO
- Replace placeholder retailer homepages in the `#buy` section with direct product URLs (only Bookshop.org is still a homepage; Google Play is the audiobook listing).
- Fill the "Forthcoming" sections: Sample, Evidence, Author, Media.
- Add the Google Calendar booking link and the speaking Google Form link to the `#book` cards.
- Deploy `chat-worker/` and set `CHAT_ENDPOINT` in `site.js`.
- Create the Stripe Payment Links and set prices in the direct-sale block.
- Review the internal-notes copy ("Asset Note", SEO strategy blocks) before publishing publicly.
