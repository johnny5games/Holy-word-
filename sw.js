/* God's Holy Word PWA service worker: precaches EVERY file (app, all Bible
   versions, study notes, dictionary, lexicon, icons) so the app works fully offline. */
const V = 'ghw-2.10-dd2c492359';
const FILES = ["./", "app.js", "apple-touch-icon.png", "asv.json", "awake.mp4", "backup.js", "bbe.json", "bible-lexicon.json", "bible.json", "brenton.json", "bsb.json", "darby.json", "dict.json", "dra.json", "elohim.json", "ethiopic.json", "favicon.png", "geneva.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "jps.json", "kjv.json", "lsv.json", "manifest.json", "msb.json", "nt.json", "oeb.json", "pwa-shim.js", "pwa.css", "rv.json", "study/b0.json", "study/b1.json", "study/b10.json", "study/b11.json", "study/b12.json", "study/b13.json", "study/b14.json", "study/b15.json", "study/b16.json", "study/b17.json", "study/b18.json", "study/b19.json", "study/b2.json", "study/b20.json", "study/b21.json", "study/b22.json", "study/b23.json", "study/b24.json", "study/b25.json", "study/b26.json", "study/b27.json", "study/b28.json", "study/b29.json", "study/b3.json", "study/b30.json", "study/b31.json", "study/b32.json", "study/b33.json", "study/b34.json", "study/b35.json", "study/b36.json", "study/b37.json", "study/b38.json", "study/b39.json", "study/b4.json", "study/b40.json", "study/b41.json", "study/b42.json", "study/b43.json", "study/b44.json", "study/b45.json", "study/b46.json", "study/b47.json", "study/b48.json", "study/b49.json", "study/b5.json", "study/b50.json", "study/b51.json", "study/b52.json", "study/b53.json", "study/b54.json", "study/b55.json", "study/b56.json", "study/b57.json", "study/b58.json", "study/b59.json", "study/b6.json", "study/b60.json", "study/b61.json", "study/b62.json", "study/b63.json", "study/b64.json", "study/b65.json", "study/b66.json", "study/b67.json", "study/b68.json", "study/b69.json", "study/b7.json", "study/b70.json", "study/b71.json", "study/b72.json", "study/b73.json", "study/b74.json", "study/b75.json", "study/b76.json", "study/b77.json", "study/b78.json", "study/b79.json", "study/b8.json", "study/b80.json", "study/b81.json", "study/b82.json", "study/b83.json", "study/b84.json", "study/b85.json", "study/b86.json", "study/b87.json", "study/b88.json", "study/b89.json", "study/b9.json", "study/b90.json", "style.css", "tcnt.json", "web.json", "webster.json", "wmb.json", "wycliffe.json", "ydabar.json", "ylt.json", "yy.json"];
const BYTES = 147824006;
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
