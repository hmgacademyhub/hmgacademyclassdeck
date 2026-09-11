/* ============================================================
   HMG ACADEMY CLASS DECK — Deployment Configuration (V36 engine)
   ------------------------------------------------------------
   This file merges BOTH configuration systems:
   1) The original HMG ACADEMY CLASS DECK blocks (HMG_OWNER,
      HMG_BRAND, HMG_RECORDING_DEFAULTS) — fully preserved.
   2) The newer CLASSDECK.BRAND block introduced by the enhanced
      Tutoring Connect / Adewale Class Deck engine, consumed by
      enhancements.js, portal-bridge.js and generator.js.
   Edit values here; committed to your GitHub repository.
   ============================================================ */

window.HMG_OWNER = {
  /* 👑 FOUNDER / OWNER ACCOUNT — lifetime access, never expires.
     The HMG ACADEMY CLASS DECK belongs to you, so this account is
     always unlocked regardless of trial or license state.
     You can change the email/password to your own, and it will be
     honoured automatically by js/auth.js on every deploy. */
  email: "buildingmyictcareer@gmail.com",
  password: "Walex@28120215",
  name: "Adewale Samson Adeagbo"
};

window.HMG_BRAND = {
  /* Branding shown on recordings, intro, and broadcast watermark. */
  name: "HMG ACADEMY CLASS DECK",
  shortName: "HMG ClassDeck",
  motto: "Learning Deliberately. Teaching Authentically.",
  contactPhone: "08100866322, 08094481488",
  supportWhatsApp: "https://wa.me/2348100866322",
  ecosystem: ["HMG Concepts", "HMG Academy", "HMG Technologies", "HMG Media", "HMG Gospel"]
};

window.HMG_RECORDING_DEFAULTS = {
  /* Defaults for the Recording Studio dialog (all editable in-app). */
  staffName: "Adewale Adeagbo",
  staffTitle: "Virtual Tutor | Data Scientist | AI-Augmented Solutions Developer",
  lowerThird: "If you want to book virtual classes with us, contact Adewale on 08100866322, 08094481488",
  adText: "",
  adIntervalSeconds: 60,
  staffPulseSeconds: 30,
  footer: "Learning Deliberately. Teaching Authentically."
};

/* ------------------------------------------------------------
   Enhanced-engine brand block (V36) — consumed by
   enhancements.js (recording watermark), portal-bridge.js
   (theme + optional portal chip) and js/generator.js.
   ------------------------------------------------------------ */
window.CLASSDECK = window.CLASSDECK || {};
window.CLASSDECK.BRAND = {
  productName: 'HMG ACADEMY CLASS DECK',
  shortName: 'HMG ClassDeck',
  studioName: 'HMG ACADEMY',
  tagline: 'Teach live inside HMG ACADEMY — whiteboard, materials and learners in one place.',
  founder: 'Adewale Samson Adeagbo',
  ecosystem: 'HMG Concepts Ecosystem',
  email: 'hmgconcepts@gmail.com',
  whatsapp: 'https://wa.me/2348100866322',
  siteUrl: 'https://hmgacademyclassdeck.vercel.app',
  /* STANDALONE DECK: no parent portal. portal-bridge.js checks
     these flags and leaves the original auth gate in charge. */
  standalone: true,
  parentPortal: '',
  portalSessions: '',
  portalCalendar: '',
  portalLogin: '',
  logoUrl: 'assets/hmg-academy-logo.png',
  primary: '#1e2a78',
  accent: '#ffb347',
  requirePortalSession: false,
  studentJoinFree: true
};
window.CD_CONFIG = Object.assign({}, window.CD_CONFIG || {}, window.CLASSDECK.BRAND);
window.APP_NAME = window.CLASSDECK.BRAND.productName;
window.SCHOOL_NAME = window.CLASSDECK.BRAND.studioName;
console.log('[HMG ACADEMY CLASS DECK] config loaded — standalone mode, owner account active');
