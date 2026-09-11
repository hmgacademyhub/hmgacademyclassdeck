# HMG ACADEMY CLASS DECK V12 — Upgrade Report, Feature Explanations & Deployment

**Date:** 11 September 2026
**Repo:** `hmgacademyhub/hmgacademyclassdeck`
**Live site:** https://hmgacademyclassdeck.vercel.app/
**Scope of this upgrade:** copy every feature and capability of the **Tutoring Connect Class Deck** and the **Adewale Classroom Class Deck** (V36 engine) into the HMG ACADEMY CLASS DECK — *the Class Deck only, nothing else* — while keeping every pre-existing HMG feature.

---

## 1. What changed (and what did not)

| Area | Before (HMG v11.2) | After (V12) |
|---|---|---|
| Engine | first-generation deck | **Adewale/Tutoring Connect V36 deck engine** — every JS module and page updated |
| Recording | branded recording studio | same + **seekable WebM recordings** (`js/fix-webm-duration.js`) |
| Toolbar | occasional dead buttons on tablets | **hardened toolbar** (`js/teach-toolbar-fix.js`): every button null-safe, error-toasted, scrollable topbar, built-in timer modal |
| Theme/brand engine | static CSS | **portal-bridge theme engine** (`js/portal-bridge.js`) applies brand colours/name/logo live from config |
| Teacher login | deck's own signup / 3-day trial / HMG ACCESS KEY / owner account | **unchanged — fully preserved** (see §3) |
| Student join | free via room link | unchanged (free, no account) |
| Generator | `generate.html` v3 | same engine, **fixed + extended** to also ship the five new JS modules in every generated client deck |
| Repo layout | deck at repo root | **unchanged** — deck stays at the root; all existing URLs (`/teach.html`, `/join.html?room=…`) keep working with no redirects |

**Nothing was removed.** Whiteboard, toolkit (3 data packs + extensions), webcast/stream, PeerJS RTC, recording studio (branded intro/outro, lower thirds, rotating ads, staff pulse), noise meter, tablet-live mode, CBT, parent monitor, community, admin, license/trial engine, revocation list, PWA/offline, vendor libraries (PeerJS, pdf.js, qrcode) — all present and upgraded to the V36 builds.

### The one deliberate difference from the Adewale deck

The Adewale Class Deck lives **inside** a parent portal, so its build *removes* the teacher login gate (portal session replaces it). HMG ACADEMY CLASS DECK is **standalone** — it has no portal — so this upgrade:

1. restored the original **auth gate** in `teach.html` (create account / log in / activate key);
2. restored the original full **`js/auth.js`** (PBKDF2 hashing, trial enforcement, revocation list, owner lifetime account);
3. made `portal-bridge.js` and `teach-toolbar-fix.js` **mode-aware**: they only bypass the login when `CLASSDECK.BRAND.parentPortal` is set and `standalone` is not `true`. In this repo `standalone: true`, so your original login/trial/licensing works exactly as before — while generated client decks that *do* sit inside a portal keep the Adewale behaviour.

---

## 2. New files added by this upgrade

| File | What it does |
|---|---|
| `js/portal-bridge.js` | Theme/brand engine + optional portal integration (dormant in standalone mode). |
| `js/teach-toolbar-fix.js` | V38 toolbar hardening: null-safe click binding with visible error toasts, horizontal-scroll topbar for narrow tablets, quick timer modal, End-Live button state fix. |
| `js/fix-webm-duration.js` | Post-processes MediaRecorder WebM output so recordings show a correct duration and can be seeked — fixes the classic "live-length unknown" WebM defect. |
| `TC-INTEGRATION.md` | Explains standalone vs portal mode. |
| `docs/UPGRADE-REPORT-V12.md` | This document. |

## 3. Every feature in the system, explained

### Teaching workspace (`teach.html` + `js/teach.js` — V36 build)
- **Unified studio:** whiteboard, PDF reader (pdf.js), image viewer, notes and in-app browser side-by-side — no more split-screening two apps on a tablet.
- **Meet Companion mode** (`teach.html?meet=1`): teach here while Google Meet/Zoom carries audio/screen; includes floating self-camera window so your face is inside the screen share.
- **Zoom sync:** the broadcast mirrors the teacher's zoom level exactly (v6 fix).
- **Timers, room codes, QR join links, learner drawer** with camera grid.

### Whiteboard (`js/whiteboard.js`)
Freehand pen, shapes, text, colours, eraser, multiple pages; every stroke broadcast live to learners.

### Live classroom & broadcast (`js/rtc.js`, `js/webcast.js`, `stream.html`, `classroom.html`)
- Peer-to-peer WebRTC via PeerJS (free public broker, no media server, no bill).
- One-way **webcast** for large audiences; interactive **classroom** for small groups.
- **No-OBS social live relay:** broadcast the tablet workspace to social platforms without OBS.
- Custom room codes; students always join **free** with no account (`join.html?room=CODE`).

### Recording studio (`js/enhancements.js` — V36 build + `js/fix-webm-duration.js`)
- Records the whole teaching canvas with **branded intro/outro**, animated **lower thirds**, rotating **ad text**, periodic **staff pulse** overlay and footer watermark.
- All defaults come from `HMG_RECORDING_DEFAULTS` in `js/config.js`, editable in-app.
- **Crash-safe** chunked recording; **V12: recordings are now seekable** with correct duration.
- **Noise meter** with threshold alarm; **Tablet-live** mode (use a phone as an overhead camera).

### Teaching toolkit (`js/toolkit.js`, `js/toolkit-ext.js`, `js/toolkit-data*.js`)
200+ built-in teaching aids: math/graph tools, science figures, charts, reference data — three data packs plus extensions, all offline.

### CBT (`cbt.html`)
In-deck computer-based tests for live classes.

### Parent monitor (`parent.html`) & Community (`community.html`)
Read-only class window for parents; announcements/pinned posts and founder WhatsApp contact.

### Accounts, trial & licensing (`js/auth.js`, `js/license.js`, `js/security-config.js`, `admin.html`, `revoked.json`)
- Teacher signup with **3-day free trial** (no card), login, **HMG ACCESS KEY** activation.
- **Owner lifetime account** — `window.HMG_OWNER` in `js/config.js`; never expires.
- v7 security hardening: **PBKDF2 (120k iterations)** password hashing, central **revocation list** (`revoked.json`), anti-bypass enforcement hooks, forensic watermarking, secure invite links, optional Cloudflare Worker license gateway (free tier).
- Subscription or lifetime **license models** baked in by the generator per client.

### Class Deck Generator (`generate.html` + `js/generator.js` — Template Engine v3)
- A form: client brand name, short name, tagline, contacts, socials, colours, logo, license model (lifetime/subscription), price.
- Click **Generate** → in the browser (JSZip from a free CDN; nothing uploaded anywhere) it builds a ZIP with **two folders**:
  1. `<BRAND>-CLASSDECK/` — the complete branded deployable deck (branded config, license engine, landing page, manifest, robots/sitemap, README + deployment guide, LICENSE-TERMS);
  2. `CLASSDECK-GENERATOR/` — the generator tool itself, so more decks can be regenerated.
- **V12 fixes:** the replacement table was corrected, and the five new engine modules (`portal-bridge`, `teach-toolbar-fix`, `fix-webm-duration`, `ecosystem-branding`, `enterprise-enhanced`) are now packed into every generated deck so client pages load with zero 404s.
- This is exactly the process by which a future client deck (like Adewale's) is produced from HMG's deck.

### Platform layer
PWA install (manifest + service worker with versioned cache — bumped to `v12.0.0-standalone-merge` so every visitor's cache refreshes), offline support, SEO files (`robots.txt`, `sitemap.xml`), security headers (`_headers`, `vercel.json`), 404 page, version manifest (`version.json`).

### Free-stack guarantees
Static hosting (Vercel/Netlify/Cloudflare/GitHub Pages free tiers), PeerJS free broker, data stays on the device (localStorage), **no paid AI API**, no server, no database bill. ₦0/month.

---

## 4. Deployment — clear, unambiguous steps

### Step 1 — replace the files on GitHub
1. Unzip `hmg-academy-classdeck.zip`.
2. Open https://github.com/hmgacademyhub/hmgacademyclassdeck.
3. **Replace, don't merge:** delete the old files in the repo, then upload everything inside the unzipped folder so `index.html` sits at the repo root.
   - Web UI: open the repo → delete old files → **Add file → Upload files** → drag all files/folders → *Commit changes*.
   - Or with git:
     ```
     git clone https://github.com/hmgacademyhub/hmgacademyclassdeck.git
     cd hmgacademyclassdeck
     git rm -r . && cp -r /path/to/unzipped/* . && git add -A
     git commit -m "V12 — Adewale/Tutoring Connect Class Deck engine merged"
     git push origin main
     ```

### Step 2 — check the config (2 minutes)
Open `js/config.js` in the repo:
- `HMG_OWNER` — your founder email/password/name (change the password if the repo is public);
- `HMG_BRAND` and `HMG_RECORDING_DEFAULTS` — your recording branding;
- `CLASSDECK.BRAND` — name, tagline, colours, `siteUrl`. Leave `standalone: true`.

### Step 3 — deploy (Vercel already connected)
If the Vercel project is already linked to the repo, the push in Step 1 auto-deploys. Otherwise:
1. https://vercel.com → **Add New → Project** → import `hmgacademyhub/hmgacademyclassdeck`.
2. Framework Preset **Other**, no build command, output directory root. → **Deploy**.
3. Free alternatives: Netlify Drop (drag the folder), Cloudflare Pages (Framework: None), GitHub Pages (Settings → Pages → `main` → `/ (root)`).

### Step 4 — verify (5-point check)
1. `/` loads the branded landing; `/teach.html` shows the **sign-in gate** (or unlocks with the owner account).
2. Create a room in the Teacher Studio → open `/join.html?room=CODE` in a second browser → learner joins **free**.
3. Record 30 seconds → download → the file plays **and can be seeked**.
4. `/generate.html` → fill a test brand → Generate → a two-folder ZIP downloads.
5. Phone: browser menu → **Add to Home screen** → the PWA installs and opens full-screen.

### Step 5 — cache note
The service-worker cache is already bumped (`v12.0.0-standalone-merge`), so returning devices fetch the new build automatically — users may need to close and reopen the app once.

### Troubleshooting
| Symptom | Fix |
|---|---|
| Old UI still showing on a device | Close the PWA fully and reopen (twice at most); the versioned cache purges itself. |
| Login gate does not appear on teach.html | Confirm `js/config.js` has `standalone: true` in `CLASSDECK.BRAND`. |
| Generated client ZIP missing scripts | You are running an old `js/generator.js`; this V12 build packs all new modules. |
| Broadcast will not connect | Both sides must be online; PeerJS uses the free public broker — retry or set your own PeerServer key in `js/rtc.js` (still free). |
