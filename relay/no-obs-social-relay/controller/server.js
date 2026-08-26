import http from 'node:http';
import { spawn } from 'node:child_process';

const PORT = Number(process.env.PORT || 3000);
const SECRET = process.env.RELAY_SECRET || '';
const SRS_RTMP = (process.env.SRS_RTMP || 'rtmp://srs:1935/live').replace(/\/+$/, '');
const jobs = new Map(); // stream -> [{name, child}]
const MAX_DESTINATIONS = 8;

function send(res, code, obj) {
  const body = typeof obj === 'string' ? obj : JSON.stringify(obj);
  res.writeHead(code, {
    'content-type': typeof obj === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type,x-relay-secret',
  });
  res.end(body);
}
function authed(req) {
  if (!SECRET) return true;
  return req.headers['x-relay-secret'] === SECRET;
}
function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let done = false;
    req.on('data', (c) => {
      if (done) return;
      data += c;
      if (data.length > 200_000) {
        done = true;
        reject(new Error('body too large'));
        req.resume();
      }
    });
    req.on('end', () => {
      if (done) return;
      done = true;
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', (e) => { if (!done) { done = true; reject(e); } });
  });
}
function safeStream(s) {
  return String(s || 'classdeck').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80) || 'classdeck';
}
function stopStream(stream) {
  const arr = jobs.get(stream) || [];
  for (const j of arr) {
    try { j.child.kill('SIGTERM'); } catch {}
  }
  jobs.delete(stream);
}
function startOutput(stream, dest) {
  const publishUrl = String(dest.publishUrl || '').trim();
  const name = String(dest.name || 'custom').slice(0, 40);
  if (publishUrl.length > 2048 || /[\r\n]/.test(publishUrl) || !/^rtmps?:\/\//i.test(publishUrl)) throw new Error(`Invalid RTMP URL for ${name}`);
  const input = `${SRS_RTMP}/${stream}`;
  const args = [
    '-hide_banner', '-loglevel', 'warning',
    '-re', '-i', input,
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
    '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
    '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '5000k',
    '-c:a', 'aac', '-b:a', '128k', '-ar', '44100', '-ac', '2',
    '-f', 'flv', publishUrl,
  ];
  const child = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stderr.on('data', (d) => console.log(`[${stream}:${name}] ${String(d).trim()}`));
  child.on('error', (err) => console.error(`[${stream}:${name}] ffmpeg error: ${err.message}`));
  child.on('exit', (code, sig) => {
    console.log(`[${stream}:${name}] ffmpeg exited code=${code} sig=${sig}`);
    const current = jobs.get(stream) || [];
    const remaining = current.filter((job) => job.child !== child);
    if (remaining.length) jobs.set(stream, remaining);
    else jobs.delete(stream);
  });
  return { name, child };
}

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://relay.local').pathname;
  if (req.method === 'OPTIONS') return send(res, 204, '');
  // Health remains public for uptime checks, but does not leak stream names.
  if (pathname === '/health') return send(res, 200, { ok: true, service: 'classdeck-relay', activeStreams: jobs.size });
  if (!authed(req)) return send(res, 401, { ok: false, error: 'unauthorized' });
  try {
    if (pathname === '/api/start' && req.method === 'POST') {
      const body = await readJson(req);
      const stream = safeStream(body.stream);
      const destinations = Array.isArray(body.destinations) ? body.destinations.filter((d) => d && d.publishUrl).slice(0, MAX_DESTINATIONS) : [];
      if (!destinations.length) return send(res, 400, { ok: false, error: 'at least one destination is required' });
      stopStream(stream);
      const started = [];
      // Register the mutable array before spawning children so an immediately
      // failing ffmpeg process cannot race the jobs map update.
      jobs.set(stream, started);
      try {
        for (const destination of destinations) started.push(startOutput(stream, destination));
      } catch (e) {
        stopStream(stream);
        throw e;
      }
      return send(res, 200, { ok: true, stream, outputs: started.map((x) => x.name), input: `${SRS_RTMP}/${stream}` });
    }
    if (pathname === '/api/stop' && req.method === 'POST') {
      const body = await readJson(req);
      const stream = safeStream(body.stream);
      stopStream(stream);
      return send(res, 200, { ok: true, stream, stopped: true });
    }
    if (pathname === '/api/status' && req.method === 'GET') {
      return send(res, 200, { ok: true, jobs: [...jobs.entries()].map(([stream, arr]) => ({ stream, outputs: arr.map((x) => x.name) })) });
    }
    return send(res, 404, { ok: false, error: 'not found' });
  } catch (e) {
    console.error(e);
    return send(res, 500, { ok: false, error: e.message || 'server error' });
  }
});

process.on('SIGTERM', () => { for (const s of jobs.keys()) stopStream(s); process.exit(0); });
server.listen(PORT, '0.0.0.0', () => console.log(`ClassDeck relay controller listening on ${PORT}`));
