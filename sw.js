/* God's Holy Word PWA service worker: precaches EVERY file (app, all Bible
   versions, study notes, dictionary, lexicon, icons) so the app works fully offline. */
const V = 'ghw-2.16-glb6';
const FILES = ["./", "allnames.json", "app.js", "apple-touch-icon.png", "awake.mp4", "backup.js", "bd/e-a.json", "bd/e-b.json", "bd/e-c.json", "bd/e-d.json", "bd/e-e.json", "bd/e-f.json", "bd/e-g.json", "bd/e-h.json", "bd/e-i.json", "bd/e-j.json", "bd/e-k.json", "bd/e-l.json", "bd/e-m.json", "bd/e-n.json", "bd/e-o.json", "bd/e-p.json", "bd/e-q.json", "bd/e-r.json", "bd/e-s.json", "bd/e-t.json", "bd/e-u.json", "bd/e-v.json", "bd/e-w.json", "bd/e-y.json", "bd/e-z.json", "bd/index.json", "bd/s-G0.json", "bd/s-G1.json", "bd/s-G2.json", "bd/s-G3.json", "bd/s-G4.json", "bd/s-G5.json", "bd/s-H0.json", "bd/s-H1.json", "bd/s-H2.json", "bd/s-H3.json", "bd/s-H4.json", "bd/s-H5.json", "bd/s-H6.json", "bd/s-H7.json", "bd/s-H8.json", "bible-lexicon.json", "bible.json.b64", "chapter-titles.json.b64", "dict.json", "favicon.png", "gods-light-bible.html", "guide-an/g0.json", "guide-an/g1.json", "guide-an/g10.json", "guide-an/g11.json", "guide-an/g12.json", "guide-an/g13.json", "guide-an/g14.json", "guide-an/g15.json", "guide-an/g16.json", "guide-an/g17.json", "guide-an/g18.json", "guide-an/g19.json", "guide-an/g2.json", "guide-an/g20.json", "guide-an/g21.json", "guide-an/g22.json", "guide-an/g23.json", "guide-an/g24.json", "guide-an/g25.json", "guide-an/g26.json", "guide-an/g27.json", "guide-an/g28.json", "guide-an/g29.json", "guide-an/g3.json", "guide-an/g30.json", "guide-an/g31.json", "guide-an/g32.json", "guide-an/g33.json", "guide-an/g34.json", "guide-an/g35.json", "guide-an/g36.json", "guide-an/g37.json", "guide-an/g38.json", "guide-an/g39.json", "guide-an/g4.json", "guide-an/g40.json", "guide-an/g41.json", "guide-an/g42.json", "guide-an/g43.json", "guide-an/g44.json", "guide-an/g45.json", "guide-an/g46.json", "guide-an/g47.json", "guide-an/g48.json", "guide-an/g49.json", "guide-an/g5.json", "guide-an/g50.json", "guide-an/g51.json", "guide-an/g52.json", "guide-an/g53.json", "guide-an/g54.json", "guide-an/g55.json", "guide-an/g56.json", "guide-an/g57.json", "guide-an/g58.json", "guide-an/g59.json", "guide-an/g6.json", "guide-an/g60.json", "guide-an/g61.json", "guide-an/g62.json", "guide-an/g63.json", "guide-an/g64.json", "guide-an/g65.json", "guide-an/g66.json", "guide-an/g67.json", "guide-an/g68.json", "guide-an/g69.json", "guide-an/g7.json", "guide-an/g70.json", "guide-an/g71.json", "guide-an/g72.json", "guide-an/g73.json", "guide-an/g74.json", "guide-an/g75.json", "guide-an/g76.json", "guide-an/g77.json", "guide-an/g78.json", "guide-an/g79.json", "guide-an/g8.json", "guide-an/g80.json", "guide-an/g81.json", "guide-an/g82.json", "guide-an/g83.json", "guide-an/g84.json", "guide-an/g85.json", "guide-an/g86.json", "guide-an/g87.json", "guide-an/g88.json", "guide-an/g89.json", "guide-an/g9.json", "guide-an/g90.json", "guide-an/g91.json", "guide-an/g92.json", "guide-an/g93.json", "guide-an/g94.json", "guide-an/g95.json", "guide-an/g96.json", "guide-an/g97.json", "guide-an/g98.json", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "index.html", "kjv94.json.b64", "manifest.json", "pwa-shim.js", "pwa.css", "references.json", "study-an/b0.json", "study-an/b1.json", "study-an/b10.json", "study-an/b11.json", "study-an/b12.json", "study-an/b13.json", "study-an/b14.json", "study-an/b15.json", "study-an/b16.json", "study-an/b17.json", "study-an/b18.json", "study-an/b19.json", "study-an/b2.json", "study-an/b20.json", "study-an/b21.json", "study-an/b22.json", "study-an/b23.json", "study-an/b24.json", "study-an/b25.json", "study-an/b26.json", "study-an/b27.json", "study-an/b28.json", "study-an/b29.json", "study-an/b3.json", "study-an/b30.json", "study-an/b31.json", "study-an/b32.json", "study-an/b33.json", "study-an/b34.json", "study-an/b35.json", "study-an/b36.json", "study-an/b37.json", "study-an/b38.json", "study-an/b39.json", "study-an/b4.json", "study-an/b40.json", "study-an/b41.json", "study-an/b42.json", "study-an/b43.json", "study-an/b44.json", "study-an/b45.json", "study-an/b46.json", "study-an/b47.json", "study-an/b48.json", "study-an/b49.json", "study-an/b5.json", "study-an/b50.json", "study-an/b51.json", "study-an/b52.json", "study-an/b53.json", "study-an/b54.json", "study-an/b55.json", "study-an/b56.json", "study-an/b57.json", "study-an/b58.json", "study-an/b59.json", "study-an/b6.json", "study-an/b60.json", "study-an/b61.json", "study-an/b62.json", "study-an/b63.json", "study-an/b64.json", "study-an/b65.json", "study-an/b66.json", "study-an/b67.json", "study-an/b68.json", "study-an/b69.json", "study-an/b7.json", "study-an/b70.json", "study-an/b71.json", "study-an/b72.json", "study-an/b73.json", "study-an/b74.json", "study-an/b75.json", "study-an/b76.json", "study-an/b77.json", "study-an/b78.json", "study-an/b79.json", "study-an/b8.json", "study-an/b80.json", "study-an/b81.json", "study-an/b82.json", "study-an/b83.json", "study-an/b84.json", "study-an/b85.json", "study-an/b86.json", "study-an/b87.json", "study-an/b88.json", "study-an/b89.json", "study-an/b9.json", "study-an/b90.json", "study-an/b91.json", "study-an/b92.json", "study-an/b93.json", "study-an/b94.json", "study-an/b95.json", "study-an/b96.json", "study-an/b97.json", "study-an/b98.json", "style.css", "xrefs.json"];
const BYTES = 63338919;
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
    /* reuse identical files already cached by an older version: copy them
       from the old cache instead of downloading them again. Only the
       reader page is always fetched fresh, because it changes on every
       release; every other file is byte-identical across versions. */
    const olds = (await caches.keys()).filter(k => k !== V);
    const oldCaches = [];
    for (const k of olds) oldCaches.push(await caches.open(k));
    const FRESH = ["gods-light-bible.html"];
    let n = 0; const total = FILES.length;
    const queue = FILES.slice();
    async function worker() {
      while (queue.length) {
        const f = queue.shift();
        if (!(await c.match(f))) {
          let reused = null;
          if (FRESH.indexOf(f) === -1) {
            for (const oc of oldCaches) {
              const hit = await oc.match(f);
              if (hit) { reused = hit; break; }
            }
          }
          if (reused) await c.put(f, reused);
          else {
            const r = await fetchRetry(f, 4);
            await c.put(f, r);
          }
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
