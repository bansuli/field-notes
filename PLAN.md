# Journal Feature Plan

## Concept
A scroll-driven journal section below the hero. As you scroll past the hero image, a journal/book appears centered on screen. Continue scrolling to flip through pages — each page shows a country name with decorative stickers. Click a page to visit that country's detail page. Scroll back up to leave the journal.

## Structure

### HTML
- `<section id="journal">` after the `</header>` inside `#app`
- Tall container (200vh per country page = 400vh total for 2 countries) to create scroll distance
- Sticky inner element `.journal-book` that stays centered on screen
- Inside the book: one `.journal-page` per country (Jordan, Costa Rica)
- Each page has: country name (large, Playfair Display italic), small sticker-style decorations, and is wrapped in an `<a>` linking to the country page

### Scroll Behavior
- Use `position: sticky` on the journal book so it pins to the center while scrolling
- JavaScript tracks scroll position within the journal section
- Maps scroll progress to which page is visible (page 1 = 0-50%, page 2 = 50-100%)
- Pages crossfade or slide vertically as you scroll between them

### Visual Design
- Journal book: ~400px wide, ~520px tall, cream/warm white background (`#f5f0e8`), subtle shadow, slightly rounded corners
- Country name: Playfair Display italic, large (~36px), centered
- Stickers: small positioned elements — could be emoji-style stamps, passport stamps, or small images from each country, scattered around the page with slight rotations
- The book itself fades/scales in as you first enter the journal section

### Pages (current)
1. **Jordan** → links to `countries/jordan.html`
2. **Costa Rica** → links to `countries/costa-rica.html`

### Files Modified
- `index.html` — add journal section HTML, CSS, and scroll JS
