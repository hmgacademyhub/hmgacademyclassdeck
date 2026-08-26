# 🚀 HMG ACADEMY CLASS DECK — Complete Deployment Guide

## Overview
**HMG ACADEMY CLASS DECK** is a 100% client-side, free, installable (PWA) teaching platform. It requires **no backend server**, **no database**, and **no API keys** to run. Everything happens in the browser using WebRTC, Canvas, and localStorage.

---

## Part A: Deploying Your ClassDeck

### Prerequisites
- A **GitHub account** (free) — https://github.com/signup
- Optional: A **Vercel** / **Netlify** / **Cloudflare** account (free)

### Method 1: Deploy to Vercel (Recommended — 2 minutes)
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your ClassDeck repository
4. **Framework Preset:** Other
5. **Root Directory:** ./
6. **Build Command:** (leave empty)
7. **Output Directory:** ./
8. Click **Deploy**
9. Your ClassDeck is live at `https://your-project.vercel.app`

### Method 2: Deploy to Netlify (2 minutes)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag your entire ClassDeck folder onto the browser
3. Your site is live instantly
4. (Optional) Connect a GitHub repo for automatic deploys

### Method 3: Deploy to GitHub Pages (3 minutes)
1. Create a new repository on GitHub
2. Upload ALL ClassDeck files (keep folder structure)
3. Go to **Settings → Pages**
4. **Source:** Deploy from a branch
5. **Branch:** main → / (root) → Save
6. Wait ~1 minute. Your site is live at `https://yourusername.github.io/repo-name`

### Method 4: Deploy to Cloudflare Pages (3 minutes)
1. Go to Cloudflare Dashboard → **Pages**
2. Click **Create a project → Connect to Git**
3. Select your repository
4. **Build settings:** Framework = None
5. Click **Save and Deploy**

---

## Part B: Using the ClassDeck Generator

### What is the Generator?
The **ClassDeck Generator** (`generate.html`) creates a **branded, white-label ClassDeck** for your clients. Enter their brand details, logo, colors, and social links, and the generator produces a full website ZIP ready to deploy.

### How to Use
1. Open `generate.html` on the live ClassDeck site
2. Fill in the 5-step wizard:
   - **Step 1:** Brand name, short name, tagline, motto, logo
   - **Step 2:** Primary color, accent color, background color
   - **Step 3:** Address, phone, email, website, social media handles
   - **Step 4:** Select features to highlight
   - **Step 5:** Review and click "Generate & Download"
3. Download the ZIP containing the complete branded website
4. Upload to GitHub and deploy (see Part A)

### What the ZIP Contains
```
client-classdeck/
├── index.html          # Branded landing page
├── teach.html          # Teacher Studio (branded)
├── join.html           # Student join page
├── generate.html       # Generator (for future builds)
├── admin.html          # License key manager
├── stream.html         # Social live streaming guide
├── cbt.html            # CBT practice tests
├── classroom.html      # Classroom command centre
├── community.html      # Teacher community
├── parent.html         # Parent portal
├── 404.html            # Custom 404
├── js/                 # All JavaScript files
├── css/                # Stylesheets
├── vendor/             # Third-party libraries
├── assets/             # Icons, logos
├── DEPLOYMENT-GUIDE.md # This guide
├── README.md           # Project readme
├── sw.js               # Service Worker (PWA)
├── manifest.json       # PWA manifest
├── vercel.json         # Vercel deployment config
├── _headers            # Security headers
├── robots.txt          # SEO
└── sitemap.xml         # SEO
```

---

## Part C: Post-Deployment Configuration

### 1. Change the Auth Secret (Critical!)
**File:** `js/auth.js`
```javascript
const AUTH_SECRET = "CHANGE-ME-HMG-2026"; // ← CHANGE THIS
```
Replace with a random 20+ character string. **This is required** — the default value is public knowledge.

### 2. Customize Branding
- **Logo:** Place your logo in `assets/` and update references
- **Colors:** Edit `:root` variables in `css/style.css`
- **Brand name:** Update in `index.html`, `teach.html`, `join.html`

### 3. Configure Security
- **Class PIN:** Teachers set this in Settings → Class PIN
- **Secure invite links:** Settings → Secure invite link token
- **Forensic watermark:** Settings → Forensic watermark
- **License keys:** Generated via `admin.html` (keep private)

### 4. Enable PWA Install
The app automatically prompts users to install. To force install:
- The install banner appears on page load
- It reappears until the user installs the app
- Users can install via browser menu → "Add to Home screen"

---

## Part D: Recording & Content Creation

### Branded Recording Setup
1. In Teacher Studio, click **⏺ Rec**
2. Fill in the **Enhanced Recording Studio** dialog:
   - **Subject, Topic, Class** — appears in the video intro
   - **Your Name & Title** — appears as intermittent popups
   - **Lower Thirds Text** — scrolling text banner at the bottom
   - **Text Ad / Announcement** — intermittent ad overlays
   - **Ad Frequency** — how often the ad appears
   - **Staff Popup Frequency** — how often credentials pop up
3. Click **Start Recording with Branding**
4. The recording includes:
   - Professional intro with logo, brand, staff info
   - The split-screen workspace
   - Teacher camera (if on)
   - Lower thirds scrolling banner
   - Intermittent staff credentials popup
   - Text ad overlays at configured intervals
   - Professional outro with contact details

### Crash-Safe Recording
If the app closes unexpectedly during recording:
- Recording chunks are saved to IndexedDB
- On next load, you're prompted to recover
- Click "Recover recording" to download

### Recording + Live Streaming Simultaneously
The composite canvas feeds BOTH the recording and the WebRTC live stream at the same time. This is handled natively — start a live class AND recording simultaneously without any conflict.

---

## Part E: Live Classroom — 1000+ Student Scalability

### How It Scales
| Student Count | Mode | Details |
|---|---|---|
| 1–50 | Peer-to-peer (WebRTC star) | Teacher is the hub; students connect directly |
| 50–200 | Composite broadcast | Canvas stream is distributed via WebRTC |
| 200–1000 | YouTube Live relay | Teacher streams to YouTube; students watch from YouTube |
| 1000+ | Multi-platform relay | WebRTC → WHIP relay → RTMP to YouTube/Facebook/TikTok |

### Configuration
- **Quality:** Settings → Broadcast quality
  - 720p @ 8fps — best for slow networks (default)
  - 720p @ 15fps — balanced
  - 1080p @ 10fps — strong network only
- **Broadcast mode:** Settings → Broadcast mode
  - Composite — streams the split-screen workspace (recommended for tablets)
  - Screen share — getDisplayMedia for desktops

---

## Part F: Companion Mode (Meet / Zoom / Teams / FreeConference)

### How to Use
Append one of these to your teach.html URL:

| Platform | URL Suffix |
|---|---|
| **Google Meet** | `teach.html?meet=1` |
| **Zoom** | `teach.html?companion=zoom#zoom` |
| **Microsoft Teams** | `teach.html?companion=teams#teams` |
| **FreeConference** | `teach.html?companion=freeconf#freeconf` |

### What Companion Mode Does
- Hides all live-class control buttons
- Shows a green badge with the platform name
- Activates wake lock immediately
- Auto-enters focus mode after a delay
- Lets you share your screen in the conferencing app

---

## Part G: Security Architecture

### Layers of Protection
1. **Authentication:** PBKDF2 key-stretched password hashing (120k iterations)
2. **Account integrity:** Cryptographic signing prevents localStorage tampering
3. **Device binding:** Keys are bound to device ID (max 2 devices)
4. **Central revocation:** Fetches `revoked.json` from deployment to block leaked keys
5. **Runtime heartbeat:** Auth checked every ~5 seconds during streaming
6. **Forensic watermark:** Stamps teacher/room/date to deter screen-recording
7. **Audit log:** 500-entry security event log with CSV export
8. **Chat rate limiting:** Prevents message flooding
9. **Message sanitization:** All input is trimmed and character-limited

---

## Part H: Free-Tier Protection
Since this is a static site with no backend:
- **No database to maintain** — everything is localStorage
- **No server to keep alive**
- **100% free hosting** — Vercel/Netlify/Cloudflare/GitHub Pages free tiers
- **No API keys needed** — WebRTC uses free STUN/TURN servers

---

## Quick Start Checklist
- [ ] Files uploaded to GitHub repository
- [ ] Site deployed and accessible at your URL
- [ ] `AUTH_SECRET` changed in `js/auth.js`
- [ ] Branding updated (logo, name, colors)
- [ ] Tested teacher signup → studio → recording
- [ ] Tested student join → stage → chat
- [ ] PWA install prompt works on mobile
- [ ] Companion mode works on Meet/Zoom/Teams

---

## Support
**Developer:** Adewale Samson Adeagbo  
**HMG Concepts:** https://hmgconcepts.pages.dev/  
**HMG Academy:** https://hmgacademy.pages.dev/  
**HMG Technologies:** https://hmgtechnologies.pages.dev/  
**WhatsApp Support:** https://wa.me/2348100866322

---

*HMG ACADEMY CLASS DECK — Learning Deliberately. Teaching Authentically.*  
*Part of the HMG Concepts Ecosystem: Academy · Technologies · Media · Gospel*