/* HMG ClassDeck License Gateway — Cloudflare Worker (free-tier friendly)
   Bind KV namespace as LICENSE_KV for strict central trials, leases and device binding.
   Set secrets/vars:
   - ADMIN_SECRET: long private admin string
   - TRIAL_DAYS: 3
   - LEASE_MINUTES: 30
   - LICENSES_JSON: optional JSON array of licenses if you don't use KV records
*/
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type,x-admin-secret',
};
const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8' } });
const norm = (s) => String(s || '').trim().toLowerCase();
const now = () => Date.now();
async function sha256(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
async function getJsonKV(env, key, fallback = null) {
  if (!env.LICENSE_KV) return fallback;
  const v = await env.LICENSE_KV.get(key);
  if (!v) return fallback;
  try { return JSON.parse(v); } catch { return fallback; }
}
async function putJsonKV(env, key, value, opts) {
  if (!env.LICENSE_KV) return;
  await env.LICENSE_KV.put(key, JSON.stringify(value), opts || {});
}
async function findLicense(env, licenseKey) {
  const key = String(licenseKey || '').trim().toUpperCase();
  // A teacher email must never be enough to activate a license. The client
  // sends the key, and the gateway verifies that exact key record.
  if (!key) return null;
  const fromKV = await getJsonKV(env, `license:${key}`, null);
  if (fromKV) return { key, ...fromKV };
  try {
    const arr = JSON.parse(env.LICENSES_JSON || '[]');
    const hit = Array.isArray(arr) && arr.find((x) => String(x.key || '').trim().toUpperCase() === key);
    return hit ? { key, ...hit } : null;
  } catch { return null; }
}
function expiryTime(value) {
  const text = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return Date.parse(text + 'T23:59:59.999Z');
  return Date.parse(text);
}
async function verify(body, env) {
  body = body && typeof body === 'object' ? body : {};
  const email = norm(body.email), device = String(body.device || '').slice(0, 80), name = String(body.name || '').slice(0, 80);
  if (!email || !device) return { ok: false, why: 'Missing teacher email or device id.' };
  const block = await getJsonKV(env, `blocked:${email}`, null);
  if (block) return { ok: false, why: 'This account has been suspended. Contact HMG Academy.' };
  const trialDays = Number(env.TRIAL_DAYS || 3), leaseMinutes = Number(env.LEASE_MINUTES || 30);
  const lic = await findLicense(env, body.licenseKey);
  if (lic) {
    if (lic.status && lic.status !== 'active') return { ok: false, why: 'License is not active.' };
    if (lic.email && norm(lic.email) !== email) return { ok: false, why: 'License belongs to another email.' };
    if (lic.expires) {
      const expiry = expiryTime(lic.expires);
      if (!Number.isFinite(expiry)) return { ok: false, why: 'License expiry is invalid.' };
      if (expiry <= now()) return { ok: false, why: 'License expired.' };
    }
    const maxDevices = Math.max(1, Math.min(10, Number(lic.devices || 2) || 2));
    const dkey = `license-devices:${String(lic.key).toUpperCase()}`;
    let devices = await getJsonKV(env, dkey, []);
    if (!devices.includes(device)) {
      if (devices.length >= maxDevices) return { ok: false, why: `Device limit reached (${maxDevices}). Contact HMG Academy.` };
      devices.push(device); await putJsonKV(env, dkey, devices);
    }
    const lease = await sha256(`${email}|${device}|${lic.key}|${now()}|${env.ADMIN_SECRET || 'hmg'}`);
    return { ok: true, plan: lic.plan || 'licensed', badge: `✓ ${name || email} · licensed until ${lic.expires || 'active'}`, lease, leaseMinutes };
  }
  if (!env.LICENSE_KV) return { ok: false, why: 'No license found. Strict gateway mode requires LICENSE_KV for trials/licenses.' };
  const tkey = `trial:${email}:${device}`;
  let trial = await getJsonKV(env, tkey, null);
  if (!trial) { trial = { start: now(), email, device }; await putJsonKV(env, tkey, trial, { expirationTtl: Math.ceil((trialDays + 2) * 86400) }); }
  const daysLeft = Math.ceil((trial.start + trialDays * 86400000 - now()) / 86400000);
  if (daysLeft > 0) {
    const lease = await sha256(`${email}|${device}|trial|${trial.start}|${env.ADMIN_SECRET || 'hmg'}`);
    return { ok: true, plan: 'trial', badge: `🎁 ${name || email} · online trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`, lease, leaseMinutes };
  }
  return { ok: false, why: 'Trial ended. Activate a valid HMG access key.' };
}
export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response('', { status: 204, headers: CORS });
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({ ok: true, service: 'hmg-classdeck-license-gateway' });
    if (url.pathname === '/api/verify' && req.method === 'POST') {
      try { return json(await verify(await req.json(), env)); }
      catch (e) { return json({ ok: false, why: e.message || 'Gateway error' }, 500); }
    }
    // Simple admin endpoints for adding/blocking license records via curl.
    if (url.pathname === '/api/admin/license' && req.method === 'POST') {
      if (req.headers.get('x-admin-secret') !== env.ADMIN_SECRET) return json({ ok: false, why: 'unauthorized' }, 401);
      const b = await req.json(); const key = String(b.key || '').trim().toUpperCase();
      if (!/^HMG-\d{6}-[0-9A-F]{10}$/.test(key)) return json({ ok: false, why: 'invalid key format' }, 400);
      await putJsonKV(env, `license:${key}`, { email: norm(b.email), name: b.name || '', expires: b.expires || '', devices: Number(b.devices || 2), plan: b.plan || 'teacher', status: b.status || 'active' });
      return json({ ok: true, key });
    }
    if (url.pathname === '/api/admin/block' && req.method === 'POST') {
      if (req.headers.get('x-admin-secret') !== env.ADMIN_SECRET) return json({ ok: false, why: 'unauthorized' }, 401);
      const b = await req.json(); await putJsonKV(env, `blocked:${norm(b.email)}`, { at: new Date().toISOString(), reason: b.reason || '' });
      return json({ ok: true });
    }
    return json({ ok: false, why: 'not found' }, 404);
  }
};
