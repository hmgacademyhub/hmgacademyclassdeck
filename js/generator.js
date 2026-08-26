/* ============================================================
   HMG ClassDeck Generator — Template Engine (generator.js)
   Takes customer branding info and generates a complete branded
   ClassDeck website as a downloadable ZIP.
   Built for HMG Concepts — Free, browser-based, no backend.
   ============================================================ */
"use strict";

const CDGenerator = {
  _cache: {},

  async loadFile(path) {
    if (CDGenerator._cache[path]) return CDGenerator._cache[path];
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      CDGenerator._cache[path] = text;
      return text;
    } catch (e) {
      console.warn('[CDGen] Failed to load:', path, e.message);
      return '';
    }
  },

  async loadBinary(path) {
    if (CDGenerator._cache[path + '_bin']) return CDGenerator._cache[path + '_bin'];
    try {
      const res = await fetch(path, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arr = await res.arrayBuffer();
      const data = new Uint8Array(arr);
      CDGenerator._cache[path + '_bin'] = data;
      return data;
    } catch (e) {
      console.warn('[CDGen] Binary load failed:', path, e.message);
      return null;
    }
  },

  esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  jsStr(s) {
    return JSON.stringify(String(s == null ? '' : s));
  },

  /** Build the branded ClassDeck ZIP */
  async build(config) {
    if (!window.JSZip) {
      await CDGenerator.loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js');
    }
    const zip = new JSZip();
    const cfg = CDGenerator._resolveConfig(config);

    // ---- Load all template files ----
    const files = [
      'index.html', 'teach.html', 'join.html', 'admin.html', '404.html',
      'stream.html', 'cbt.html', 'classroom.html', 'community.html', 'parent.html',
      'css/style.css', 'manifest.json', 'manifest.webmanifest',
      'version.json', 'robots.txt', 'sitemap.xml', 'vercel.json', '_headers',
      'sw.js', 'revoked.json',
      'js/common.js', 'js/auth.js', 'js/security-config.js', 'js/teach.js',
      'js/whiteboard.js', 'js/rtc.js', 'js/join.js',
      'js/toolkit.js', 'js/toolkit-ext.js',
      'js/toolkit-data.js', 'js/toolkit-data2.js', 'js/toolkit-data3.js',
      'js/webcast.js',
      'vendor/peerjs.min.js', 'vendor/pdf.min.js',
      'vendor/pdf.worker.min.js', 'vendor/qrcode.min.js'
    ];

    const contents = {};
    for (const f of files) {
      contents[f] = await CDGenerator.loadFile(f);
    }

    // ---- Assets ----
    const assetFiles = [
      'assets/icon-96.png', 'assets/icon-192.png', 'assets/icon-512.png',
      'assets/apple-touch-icon.png', 'assets/hmg-academy-logo.png'
    ];
    for (const af of assetFiles) {
      const bin = await CDGenerator.loadBinary(af);
      if (bin) zip.file(af, bin, { binary: true });
    }

    // ---- Generate branding assets ----
    const logoData = cfg.logoData || '';
    const logoExt = cfg.logoExt || 'svg';
    const brandSlug = cfg.shortName.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'classdeck';

    // Write uploaded logo
    if (logoData && /^data:image\//.test(logoData) && logoExt !== 'svg') {
      const b64 = logoData.split(',')[1] || '';
      zip.file('assets/brand-logo.' + logoExt, b64, { base64: true });
    }
    // Generate placeholder SVG logo
    zip.file('assets/brand-logo.svg', CDGenerator._logoSVG(cfg));
    // Generate favicon
    zip.file('assets/favicon.svg', CDGenerator._faviconSVG(cfg));

    // ---- Generate config.js ----
    const configJS = CDGenerator._configJS(cfg);
    zip.file('js/config.js', configJS);

    // ---- Write all files with branding replacements ----
    for (const [path, content] of Object.entries(contents)) {
      if (!content) continue;
      const branded = CDGenerator._brand(path, content, cfg);
      zip.file(path, branded);
    }

    // ---- Generate SEO files ----
    zip.file('robots.txt', CDGenerator._robots(cfg));
    zip.file('sitemap.xml', CDGenerator._sitemap(cfg));
    zip.file('_headers', CDGenerator._headers());
    zip.file('vercel.json', CDGenerator._vercelJSON(cfg));
    zip.file('manifest.json', CDGenerator._manifest(cfg));
    zip.file('manifest.webmanifest', CDGenerator._manifestWeb(cfg));
    zip.file('version.json', JSON.stringify({
      version: cfg.version || '11.1.1-classdesk-v3',
      build: Date.now(),
      channel: cfg.buildType || 'client',
      released: new Date().toISOString().slice(0, 10),
      brand: cfg.brandName
    }, null, 2));

    // ---- Generate customer landing page ----
    zip.file('index.html', CDGenerator._landingPage(cfg));

    // ---- Generate README & Deployment Guide ----
    zip.file('README.md', CDGenerator._readme(cfg));
    zip.file('DEPLOYMENT-GUIDE.md', CDGenerator._deployGuide(cfg));

    // ---- Generate docs ----
    zip.file('docs/USER_GUIDE.md', CDGenerator._userGuide(cfg));
    zip.file('docs/BRANDING.md', CDGenerator._brandingDoc(cfg));

    // ---- Generate the ZIP ----
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    const fileName = brandSlug + '-classdeck-v3.zip';
    return { blob, fileName };
  },

  _resolveConfig(raw) {
    return {
      brandName:    raw.brandName    || 'My ClassDeck',
      shortName:    raw.shortName    || (raw.brandName || '').slice(0, 12) || 'ClassDeck',
      tagline:      raw.tagline      || 'Teach online like a pro — from any device',
      motto:        raw.motto        || 'Learning Deliberately. Teaching Authentically.',
      address:      raw.address      || '',
      phone:        raw.phone        || '',
      email:        raw.email        || '',
      website:      raw.website      || '',
      socialFacebook:  raw.socialFacebook  || '',
      socialTwitter:   raw.socialTwitter   || '',
      socialInstagram: raw.socialInstagram || '',
      socialYouTube:   raw.socialYouTube   || '',
      socialWhatsApp:  raw.socialWhatsApp  || '',
      socialLinkedIn:  raw.socialLinkedIn  || '',
      socialTikTok:    raw.socialTikTok    || '',
      primaryColor: raw.primaryColor || '#1e2a78',
      accentColor:  raw.accentColor  || '#ffb347',
      bgColor:      raw.bgColor      || '#10142b',
      logoData:     raw.logoData     || '',
      logoExt:      raw.logoExt      || 'svg',
      fontFamily:   raw.fontFamily   || 'system-ui, sans-serif',
      features:     Array.isArray(raw.features) ? raw.features : [],
      hmgPowered:   raw.hmgPowered !== false,
      hmgLink:      raw.hmgLink      || 'https://hmgconcepts.pages.dev/',
      developer:    raw.developer    || 'Adewale Samson Adeagbo',
      version:      '11.1.1-classdesk-v3',
      buildType:    raw.buildType    || 'client',
      siteUrl:      raw.siteUrl      || ''
    };
  },

  _brand(path, content, cfg) {
    let html = content;
    const replacements = {
      'HMG ACADEMY CLASS DECK': cfg.brandName,
      'HMG ACADEMY': cfg.shortName,
      'HMG ClassDeck': cfg.shortName || 'ClassDeck',
      'CLASS DECK': cfg.shortName?.toUpperCase() || 'CLASS DECK',
      'ClassDeck': cfg.shortName || 'ClassDeck',
      'hmg-academy-logo.png': 'brand-logo.' + cfg.logoExt,
      'hmgacademyclassdeck.vercel.app': cfg.siteUrl || 'classdeck.example.com',
      'hmgacademy.pages.dev': cfg.hmgLink.replace(/https?:\/\//, ''),
      '#1e2a78': cfg.primaryColor,
      '#ffb347': cfg.accentColor,
      '#10142b': cfg.bgColor,
      '#0a3d62': cfg.bgColor,
      'Adewale Samson Adeagbo': cfg.developer,
      'STEM Educator · Data Scientist · Founder, HMG ACADEMY': cfg.tagline || 'Online Teaching Platform',
    };
    for (const [from, to] of Object.entries(replacements)) {
      html = html.split(from).join(to);
    }
    // Add CSS variable overrides
    const styleOverride = `\n:root {\n  --brand-primary: ${cfg.primaryColor};\n  --brand-accent: ${cfg.accentColor};\n  --brand-bg: ${cfg.bgColor};\n  --brand-font: ${cfg.fontFamily};\n}\n`;
    html = html.replace('</head>', `<style>${styleOverride}</style>\n</head>`);
    return html;
  },

  _configJS(cfg) {
    return `/* HMG ClassDeck — Generated Brand Configuration */
window.CD_CONFIG = {
  brand: ${this.jsStr(cfg.brandName)},
  shortName: ${this.jsStr(cfg.shortName)},
  tagline: ${this.jsStr(cfg.tagline)},
  motto: ${this.jsStr(cfg.motto)},
  address: ${this.jsStr(cfg.address)},
  phone: ${this.jsStr(cfg.phone)},
  email: ${this.jsStr(cfg.email)},
  website: ${this.jsStr(cfg.website)},
  primaryColor: ${this.jsStr(cfg.primaryColor)},
  accentColor: ${this.jsStr(cfg.accentColor)},
  bgColor: ${this.jsStr(cfg.bgColor)},
  socials: ${JSON.stringify({
    facebook: cfg.socialFacebook, twitter: cfg.socialTwitter,
    instagram: cfg.socialInstagram, youtube: cfg.socialYouTube,
    whatsapp: cfg.socialWhatsApp, linkedin: cfg.socialLinkedIn,
    tiktok: cfg.socialTikTok
  })},
  features: ${JSON.stringify(cfg.features)},
  hmgPowered: ${!!cfg.hmgPowered},
  hmgLink: ${this.jsStr(cfg.hmgLink)},
  developer: ${this.jsStr(cfg.developer)},
  version: ${this.jsStr(cfg.version)}
};
console.log('[ClassDeck] Brand config loaded —', CD_CONFIG.brand);`;
  },

  _landingPage(cfg) {
    const esc = this.esc;
    const features = cfg.features.length ? cfg.features : [
      'Split-screen whiteboard & PDF workspace',
      'Built-in live classroom with WebRTC',
      '200+ teaching tools included',
      'Quizzes with leaderboards & auto-scoring',
      'Branded lesson recording',
      'No-OBS social live streaming'
    ];
    const socialLinks = [
      ['facebook', cfg.socialFacebook, '📘'],
      ['twitter', cfg.socialTwitter, '🐦'],
      ['instagram', cfg.socialInstagram, '📸'],
      ['youtube', cfg.socialYouTube, '▶️'],
      ['whatsapp', cfg.socialWhatsApp, '💬'],
      ['linkedin', cfg.socialLinkedIn, '💼'],
      ['tiktok', cfg.socialTikTok, '🎵']
    ].filter(([_, url]) => url).map(([_, url, emoji]) =>
      `<a href="${esc(url)}" target="_blank" rel="noopener" style="font-size:1.5rem;text-decoration:none;margin:0 6px">${emoji}</a>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(cfg.brandName)} — ${esc(cfg.tagline)}</title>
<meta name="description" content="${esc(cfg.brandName)}: ${esc(cfg.tagline)}. Built by ${esc(cfg.developer)} — HMG Concepts." />
<meta name="author" content="${esc(cfg.developer)}, ${esc(cfg.brandName)}" />
<link rel="manifest" href="manifest.webmanifest" />
<link rel="icon" href="assets/favicon.svg" />
<link rel="apple-touch-icon" href="assets/apple-touch-icon.png" />
<meta name="theme-color" content="${cfg.primaryColor}" />
<meta property="og:title" content="${esc(cfg.brandName)} — ${esc(cfg.tagline)}" />
<meta property="og:description" content="${esc(cfg.tagline)}" />
<meta property="og:type" content="website" />
<meta property="og:image" content="assets/brand-logo.${cfg.logoExt}" />
<meta name="twitter:card" content="summary" />
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "${esc(cfg.brandName)}",
  "applicationCategory": "EducationalApplication",
  "operatingSystem": "Web, Android, iOS, Windows, macOS, Linux",
  "description": "${esc(cfg.tagline)}",
  "creator": { "@type": "Person", "name": "${esc(cfg.developer)}" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
<link rel="stylesheet" href="css/style.css" />
<style>
  :root { --brand: ${cfg.primaryColor}; --accent: ${cfg.accentColor}; --bg: ${cfg.bgColor}; }
</style>
</head>
<body>
<div class="landing">
  <img class="logo" src="assets/brand-logo.${cfg.logoExt}" alt="${esc(cfg.brandName)}" style="width:auto;max-width:200px;height:auto;border-radius:14px" />
  <h1>${esc(cfg.brandName)}</h1>
  <p class="tag">${esc(cfg.tagline)}</p>
  ${cfg.motto ? `<p class="tag" style="font-weight:600;margin-top:4px">${esc(cfg.motto)}</p>` : ''}

  <div class="cards">
    <a class="card" href="teach.html" style="text-decoration:none;color:inherit">
      <div class="em">🧑‍🏫</div>
      <h3>I'm a Teacher</h3>
      <p>Open the Teacher Studio — run your own live class with student cameras, chat, polls, quizzes and attendance.</p>
      <span class="btn primary">Start teaching ➜</span>
    </a>
    <a class="card" href="join.html" style="text-decoration:none;color:inherit">
      <div class="em">🎓</div>
      <h3>I'm a Student</h3>
      <p>Got a class link or room code from your teacher? Join in seconds — free, no account, on any device.</p>
      <span class="btn">Join my class ➜</span>
    </a>
  </div>

  <div class="feat-list">
    <h2>Why choose ${esc(cfg.brandName)}</h2>
    <div class="feat-grid">
      ${features.map(f => `<div class="feat"><b>✦</b> ${esc(f)}</div>`).join('')}
    </div>
  </div>

  ${cfg.address || cfg.phone || cfg.email ? `
  <div style="display:flex;gap:16px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px 22px;margin-top:38px;max-width:640px;flex-wrap:wrap;justify-content:center">
    <div style="min-width:220px;flex:1;text-align:center">
      ${cfg.address ? `<div style="font-size:13px">📍 ${esc(cfg.address)}</div>` : ''}
      ${cfg.phone ? `<div style="font-size:13px">📞 ${esc(cfg.phone)}</div>` : ''}
      ${cfg.email ? `<div style="font-size:13px">✉️ ${esc(cfg.email)}</div>` : ''}
      ${cfg.website ? `<div style="font-size:13px">🌐 ${esc(cfg.website)}</div>` : ''}
      ${socialLinks ? `<div style="margin-top:8px">${socialLinks}</div>` : ''}
    </div>
  </div>` : ''}

  <footer>
    <b>${esc(cfg.brandName)}</b> — ${cfg.hmgPowered ? `Powered by <a href="${esc(cfg.hmgLink)}" target="_blank" rel="noopener">HMG Concepts</a>` : 'All rights reserved.'}
    <button class="btn small install-btn hide" onclick="promptInstall()" style="margin-top:10px">⬇ Install ${esc(cfg.shortName)}</button>
  </footer>
</div>
<script src="js/common.js"></script>
<script src="js/config.js"></script>
</body>
</html>`;
  },

  _logoSVG(cfg) {
    const initial = (cfg.shortName || cfg.brandName || 'C')[0].toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="40" fill="${cfg.primaryColor}"/>
  <text x="100" y="135" font-family="Arial, sans-serif" font-size="110" font-weight="900" text-anchor="middle" fill="${cfg.accentColor}">${initial}</text>
</svg>`;
  },

  _faviconSVG(cfg) {
    const initial = (cfg.shortName || 'C')[0].toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="${cfg.primaryColor}"/>
  <text x="16" y="23" font-family="Arial" font-size="20" font-weight="900" text-anchor="middle" fill="${cfg.accentColor}">${initial}</text>
</svg>`;
  },

  _robots(cfg) {
    const base = cfg.siteUrl ? cfg.siteUrl.replace(/\/+$/, '') : '';
    return `User-agent: *
Allow: /
Disallow: /admin.html
Disallow: /revoked.json

Sitemap: ${base ? base + '/sitemap.xml' : '/sitemap.xml'}
`;
  },

  _sitemap(cfg) {
    const base = (cfg.siteUrl || 'https://example.com').replace(/\/+$/, '');
    const pages = ['/', '/teach.html', '/join.html', '/stream.html'];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url><loc>${base}${p}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`).join('\n')}
</urlset>`;
  },

  _headers() {
    return `/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  Cross-Origin-Resource-Policy: same-origin
  Permissions-Policy: camera=(self), microphone=(self), display-capture=(self), geolocation=()
  Cross-Origin-Opener-Policy: same-origin-allow-popups

/sw.js
  Cache-Control: public, max-age=0, must-revalidate

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable
`;
  },

  _vercelJSON(cfg) {
    return JSON.stringify({
      headers: [
        { source: '/(.*)', headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), display-capture=(self)' }
        ]},
        { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] }
      ]
    }, null, 2);
  },

  _manifest(cfg) {
    return JSON.stringify({
      name: cfg.brandName + ' v3',
      short_name: cfg.shortName || 'ClassDeck',
      description: cfg.tagline + ' — ' + (cfg.motto || ''),
      start_url: './index.html',
      display: 'standalone',
      background_color: cfg.bgColor,
      theme_color: cfg.primaryColor,
      categories: ['education', 'productivity'],
      icons: [
        { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    }, null, 2);
  },

  _manifestWeb(cfg) {
    return JSON.stringify({
      name: cfg.brandName + ' — Split-Screen Teaching Studio',
      short_name: cfg.shortName || 'ClassDeck',
      description: cfg.tagline,
      id: '/',
      start_url: './index.html',
      scope: './',
      display: 'standalone',
      orientation: 'any',
      background_color: cfg.bgColor,
      theme_color: cfg.primaryColor,
      lang: 'en',
      categories: ['education', 'productivity'],
      icons: [
        { src: 'assets/icon-96.png', sizes: '96x96', type: 'image/png' },
        { src: 'assets/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: 'assets/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
      ],
      shortcuts: [
        { name: 'Start a class', url: './teach.html', description: 'Open the teacher studio' },
        { name: 'Join a class', url: './join.html', description: 'Join as a student' }
      ]
    }, null, 2);
  },

  _readme(cfg) {
    return `# ${cfg.brandName} — ClassDeck v3

**${cfg.tagline}**

Built for ${cfg.developer} · Powered by [HMG Concepts](${cfg.hmgLink})

## Quick Start

1. Upload all files to a GitHub repository
2. Deploy to Vercel, Netlify, Cloudflare Pages, or GitHub Pages
3. Open the live URL and start teaching!

## Features

- Split-screen whiteboard + PDF/browser/notes/image workspace
- Built-in live classroom (WebRTC, 1000+ students)
- 200+ teaching tools (periodic table, graph plotter, lab equipment)
- Quizzes with leaderboards and CSV import
- Branded recording with intro/outro
- No-OBS social live streaming
- Live captions (free Web Speech API)
- Professional whiteboard with palm rejection

## Tech Stack

- 100% client-side — no backend needed
- Vanilla JavaScript, HTML5, CSS3
- WebRTC via PeerJS (free cloud broker)
- Canvas 2D API for whiteboard and broadcast
- Service Worker for offline PWA support

## Deployment

See DEPLOYMENT-GUIDE.md for step-by-step instructions.

---

**${cfg.brandName}** — ${cfg.motto || 'Learning Deliberately. Teaching Authentically.'}
`;
  },

  _deployGuide(cfg) {
    return `# 🚀 Deployment Guide — ${cfg.brandName}

## Prerequisites
- A GitHub account (free)
- Optional: Vercel, Netlify, or Cloudflare account (free)

## Step 1: Upload to GitHub
1. Create a new repository at https://github.com/new
2. Upload ALL files from this package (keep folder structure)
3. Commit to main branch

## Step 2: Deploy

### Option A: Vercel (recommended)
1. Go to https://vercel.com → Import GitHub repository
2. Framework: **Other**
3. Root directory: **./**
4. Build command: *(none)*
5. Output directory: **./**
6. Deploy

### Option B: Netlify
1. Go to https://app.netlify.com/drop
2. Drag the entire folder onto the browser
3. Site is live immediately

### Option C: Cloudflare Pages
1. Go to Cloudflare Dashboard → Pages
2. Connect your GitHub repository
3. Build settings: Framework = None
4. Deploy

### Option D: GitHub Pages
1. Repository → Settings → Pages
2. Source: Deploy from branch → main → / (root)
3. Save

## Step 3: Custom Domain (Optional)
Add your own domain in your hosting provider's settings.

## Post-Deployment Checklist
- [ ] Site loads at your deployed URL
- [ ] Teacher Studio opens (teach.html)
- [ ] Join page opens (join.html)
- [ ] PWA install prompt appears on mobile
- [ ] All branding/logo displays correctly

## Support
- Developer: ${cfg.developer}
- Built by: HMG Concepts
- Website: ${cfg.hmgLink}

---

**${cfg.brandName}** — ${cfg.tagline}
`;
  },

  _userGuide(cfg) {
    return `# User Guide — ${cfg.brandName}

## For Teachers

### Getting Started
1. Open the Teacher Studio (teach.html)
2. Sign up for a free account
3. Start with a 3-day trial
4. Select your teaching materials in the split-screen
5. Press "▶ Go Live" to start your class

### Recording Lessons
1. Tap the Record button
2. Fill in subject, topic, class details
3. Add your brand logo
4. Start recording — video saves automatically

### Live Streaming
Use the built-in social live feature to stream to YouTube, Facebook, or TikTok simultaneously with your live class.

## For Students
1. Click your teacher's invite link
2. Enter your name
3. Join the class — no account needed
4. Raise your hand, chat, and participate

## Tips
- Install as an app for the best experience
- Use focus mode when sharing on Meet/Zoom/Teams
- Enable wake lock to prevent your tablet from sleeping

---
Built by ${cfg.developer} · ${cfg.hmgLink}
`;
  },

  _brandingDoc(cfg) {
    return `# Branding Guide — ${cfg.brandName}

## Brand Identity
- **Name:** ${cfg.brandName}
- **Short name:** ${cfg.shortName}
- **Tagline:** ${cfg.tagline}
- **Motto:** ${cfg.motto}
- **Primary Color:** ${cfg.primaryColor}
- **Accent Color:** ${cfg.accentColor}
- **Background Color:** ${cfg.bgColor}

## Contact Information
- Address: ${cfg.address}
- Phone: ${cfg.phone}
- Email: ${cfg.email}
- Website: ${cfg.website}

## Social Media
${Object.entries({facebook:cfg.socialFacebook,twitter:cfg.socialTwitter,instagram:cfg.socialInstagram,youtube:cfg.socialYouTube,whatsapp:cfg.socialWhatsApp,linkedin:cfg.socialLinkedIn,tiktok:cfg.socialTikTok}).filter(([_,v])=>v).map(([k,v])=>`- ${k}: ${v}`).join('\n')}

## Deployment
This ClassDeck can be deployed on Vercel, Netlify, Cloudflare Pages, or GitHub Pages.

---
Built by HMG Concepts · ${cfg.hmgLink}
`;
  },

  loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load: ' + src));
      document.head.appendChild(s);
    });
  }
};

window.CDGenerator = CDGenerator;
console.log('[ClassDeck Generator v3] Loaded — ready to build branded deployments.');