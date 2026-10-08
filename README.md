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
2. **Photos**: put your own pictures in `assets/img/` (the site currently uses `property.jpg`). Replace the logo in `assets/logo.svg` and `assets/favicon.svg`.
3. Replace `YOUR-DOMAIN.com` in `robots.txt` and `sitemap.xml`.

## Deploy
Upload the whole folder to any static host: Netlify (drag and drop), Cloudflare Pages, Vercel, GitHub Pages, or cPanel (`public_html`). `_headers` (Netlify/Cloudflare) and `.htaccess` (Apache) add security headers and a 404 page. Serve over HTTPS.

## How the flow works
Guests see availability, send a request (check-in, check-out, apartment dates, hall enquiry) and get a reference code. Staff approve it in `staff.html`, which updates availability. Guests can track a code on the White Dove page.

## Important: data and security
- **Data is stored in each visitor's browser (localStorage).** That keeps the project runnable anywhere, but customers and staff on different devices will NOT see each other's changes. For a real launch, replace the functions in `js/store.js` (`read`, `write` and `PH.db`) with calls to a shared backend (for example a Laravel or Node API with a database). The rest of the site does not need to change.
- **The staff PIN is checked in the browser, so it is only a deterrent.** Before real use, put the staff area behind server-side login with the same backend.
- Guest names and phone numbers must be stored on your server, over HTTPS, once you connect a backend (Nigeria Data Protection Act).
