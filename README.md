# Parah Hospitality website

Static multi-page site (HTML, CSS, JavaScript). No build step. Colours: mist `#d5e7ed`, brick `#a16662`.

## Pages
| File | Purpose |
|---|---|
| `index.html` | Home: places, how it works, about, gallery, contact |
| `white-dove.html` | Hotel rooms (available/occupied), check-in, check-out, request tracking |
| `cash-out-lounge.html` | Tables, Arabian tea, games, event hall enquiry |
| `ministers-apartment.html` | Free/booked status, max stay, calendar, booking request |
| `staff.html` | PIN-protected dashboard: approve requests, rooms, tables, apartment, attendance, backups |

## Set up before launch
1. **`js/config.js`**: phone, WhatsApp number, email, address, rooms, number of tables, tea and games, and the **staff PIN**.
2. **Photos**: add your own pictures to `assets/img/` with these names and they appear automatically: `hero.jpg`, `about.jpg`, `white-dove.jpg`, `lounge.jpg`, `apartment.jpg`, `gallery-1.jpg` to `gallery-6.jpg`. Until then the site shows `property.jpg` or a warm placeholder. Replace the logo in `assets/logo.svg` and `assets/favicon.svg`.
3. Replace `YOUR-DOMAIN.com` in `robots.txt` and `sitemap.xml`.

## Deploy
Upload the whole folder to any static host: Netlify (drag and drop), Cloudflare Pages, Vercel, GitHub Pages, or cPanel (`public_html`). `_headers` (Netlify/Cloudflare) and `.htaccess` (Apache) add security headers and a 404 page. Serve over HTTPS.

## How the flow works
Guests see availability, send a request (check-in, check-out, apartment dates, hall enquiry) and get a reference code. Staff approve it in `staff.html`, which updates availability. Guests can track a code on the White Dove page.

## Important: data and security
- **Data is stored in each visitor's browser (localStorage).** That keeps the project runnable anywhere, but customers and staff on different devices will NOT see each other's changes. For a real launch, replace the functions in `js/store.js` (`read`, `write` and `PH.db`) with calls to a shared backend (for example a Laravel or Node API with a database). The rest of the site does not need to change.
- **The staff PIN is checked in the browser, so it is only a deterrent.** Before real use, put the staff area behind server-side login with the same backend.
- Guest names and phone numbers must be stored on your server, over HTTPS, once you connect a backend (Nigeria Data Protection Act).

## Photos and the built-in illustrations
The site ships with 16 illustrated placeholder scenes in `assets/img/stock/` (these are drawings, not photographs). Every picture slot first looks for your own photo and falls back to the illustration, so you replace images simply by adding files to `assets/img/` with these names:
`hero`, `about`, `white-dove`, `lounge`, `apartment`, `tile-rooms`, `tile-tea`, `tile-games`, `tile-hall`, `gallery-1` to `gallery-7`, `band-wd1` to `band-wd3`, `band-co1` to `band-co3`, `band-ma1` to `band-ma4`, `tea`, `hall`, `game-table-tennis`, `game-chess`, `game-ludo`, `game-dice`, and per room `room-101` (or `room-standard` / `room-deluxe` for all rooms of a type). Use `.jpg`, around 1600px wide and under 300 KB each.

## Demo photos (Unsplash)
For the client demo, most picture slots load real photographs from Unsplash (https://unsplash.com), which are free to use under the Unsplash License. They are linked from Unsplash's servers, so the site needs an internet connection to show them. The built-in illustrations only appear when a photo cannot load. Before the real launch, replace them with your own photos (see the names above) or download the Unsplash images and host them yourself. The list of photo IDs is in `PH.STOCK` in `js/main.js`.
Slots with no suitable Unsplash photo yet (table tennis, ludo, dice, event hall) still show the illustrations.
