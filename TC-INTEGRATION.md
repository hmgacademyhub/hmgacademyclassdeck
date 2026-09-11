# HMG ACADEMY CLASS DECK — standalone deployment note

This repo is the **standalone** HMG ACADEMY CLASS DECK. It runs the enhanced
Tutoring Connect / Adewale Class Deck engine (V36), but with the deck's own
original login model restored — there is **no parent portal** in this build.

## Login model (standalone)
- **Teachers:** sign in through the deck's own auth gate (`js/auth.js`) —
  create account (3-day free trial), log in, or activate an HMG ACCESS KEY.
  The founder owner account in `js/config.js` (`window.HMG_OWNER`) has
  lifetime access and never expires.
- **Learners:** always join free via `join.html` + room code/link — no account.

## Entry points
| Who | URL |
|---|---|
| Landing | `/index.html` |
| Teacher studio | `/teach.html` |
| Meet companion | `/teach.html?meet=1` |
| Learner join | `/join.html?room=CODE` |
| Stream / broadcast | `/stream.html` |
| Admin | `/admin.html` |
| CBT | `/cbt.html` |
| Parent monitor | `/parent.html` |
| Community | `/community.html` |
| Class Deck Generator | `/generate.html` |

## Portal mode (optional, future)
`js/portal-bridge.js` still supports embedding this deck inside a Tutoring
Connect portal. It activates ONLY when `CLASSDECK.BRAND.standalone` is not
`true` AND `parentPortal` is set AND a live Supabase portal session exists.
In this repo `standalone: true`, so the bridge only applies theme colours and
leaves the deck's own auth gate fully in charge.
