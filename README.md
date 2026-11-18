# 𝔻𝔸𝔻𝔻𝕐 ℕ𝕆𝕌𝔾ℍ𝕋 𝕊𝔼𝔼𝕊 𝕐𝕆𝕌 — WhatsApp Presence Monitor

A dark, mobile-friendly dashboard with an Express backend.

## Important: what this app can and cannot do
WhatsApp offers **no official or authorized way** to see whether another person is online. Online and last-seen are private. This app does not fake results, bypass privacy settings, or track people. It validates and formats numbers, then shows **UNKNOWN** with an explanation. ONLINE and OFFLINE are supported by the interface but are only shown if a real, authorized, verified source is added to `lookupPresence()` in `server.js`. None is included.

History and stats are stored only in the visitor's own browser (localStorage). The server stores nothing.

## Files
```
package.json
server.js
.env.example
.gitignore
public/index.html
public/style.css
public/script.js
README.md
```
The frontend and backend are connected already: Express serves `public/` and the page calls `/api/...` on the same address. No URLs to edit.

## Deploy on Replit (from your phone browser)
1. Go to replit.com and sign up or log in.
2. Tap **Create Repl**, choose the **Node.js** template, name it, and create it.
3. In the Files panel, delete the default `index.js` if present.
4. Create each file above (use the same names and folders, `public` is a folder) and paste in the code.
5. Open the **Shell** tab and run `npm install`.
6. Open **Secrets** (padlock icon) and add the variables below (optional, defaults work).
7. Tap **Run**. Replit shows a preview with your app and a public URL.
8. For an always-on link, use **Deploy** (Replit may require a paid plan for that). Free alternative: Render.com, connect a GitHub repo, build command `npm install`, start command `npm start`.

## Environment variables
| Name | Default | Meaning |
|---|---|---|
| PORT | 3000 | Set automatically by hosts |
| RATE_LIMIT_PER_MINUTE | 15 | Checks per IP per minute |
| PRESENCE_PROVIDER | none | Keep `none` unless you add an authorized provider |

Never put secrets in anything inside `public/`.

## API
- `GET /api/countries` returns country codes.
- `POST /api/check` with `{ "countryCode": "234", "number": "8031234567" }` returns formatted number, status, reason, time.
- `GET /api/health` returns server health.

## Run locally
`npm install` then `npm start`, then open http://localhost:3000
