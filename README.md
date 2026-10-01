# Enemies of the Original Man — Authoritative Hub

Single-page landing site for *Enemies of the Original Man* by Abdullah Hakim Kenneth Basnight.
Static HTML/CSS/JS — no build step.

## Run locally
Open `index.html` in a browser, or serve the folder:

    python -m http.server 8000

## Files
- `index.html` — all sections, anchors and JSON-LD (Book + DefinedTerms)
- `styles.css` — design tokens and layout
- `site.js` — mobile menu and active-section highlighting
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

## TODO
- Replace placeholder retailer homepages in the `#buy` section with direct product URLs (only Bookshop.org is still a homepage; Google Play is the audiobook listing).
- Fill the "Forthcoming" sections: Sample, Evidence, Author, Media, Speaking.
- Create the Stripe Payment Links and set prices in the direct-sale block.
- Review the internal-notes copy ("Asset Note", SEO strategy blocks) before publishing publicly.
