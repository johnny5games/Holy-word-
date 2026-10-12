/* God's Holy Word PWA service worker: precaches EVERY file (app, all Bible
   versions, study notes, dictionary, lexicon, icons) so the app works fully offline. */
const V = '__VERSION__';
const FILES = __FILES__;
const BYTES = __BYTES__;
function tell(msg) { self.clients.matchAll({ includeUncontrolled: true }).then(cs => cs.forEach(c => c.postMessage(msg))); }
async function fetchRetry(url, tries) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(new Request(url, { cache: 'reload' })); if (r.ok) return r; } catch (e) {}
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  throw new Error('failed ' + url);
}
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    /* reuse identical files already cached by an older version */
    const olds = (await caches.keys()).filter(k => k !== V);
    let n = 0; const total = FILES.length;
    const queue = FILES.slice();
    async function worker() {
      while (queue.length) {
        const f = queue.shift();
        if (!(await c.match(f))) {
          const r = await fetchRetry(f, 4);
          await c.put(f, r);
        }
        n++; if (n % 4 === 0 || n === total) tell({ type: 'ghw-cache', n, total });
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    tell({ type: 'ghw-cache', n: total, total, done: true });
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => {
  if (e.data === 'ghw-cache-info') caches.open(V).then(c => c.keys()).then(ks => e.source && e.source.postMessage({ type: 'ghw-cache-info', version: V, entries: ks.length, files: FILES.length, bytes: BYTES }));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    const hit = await c.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    if (e.request.mode === 'navigate') { const idx = await c.match('index.html'); if (idx) return idx; }
    try {
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    } catch (err) {
      return (await c.match('index.html')) || Response.error();
    }
  })());
});
