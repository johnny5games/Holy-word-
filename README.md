# God's Holy Word — iPhone web app (PWA) 2.15

Static site for GitHub Pages (root of the branch, `.nojekyll` included).
Open it in Safari on iPhone, tap Share > Add to Home Screen. On first open the service worker
saves every file (all Bible versions, study notes, dictionary, lexicon), about 141 MB, so the app works fully offline.

- `pwa-shim.js` is the web replacement for the Android `AndroidTTS` bridge. It handles speechSynthesis speech, voices, rate, Screen Wake Lock with a muted-video fallback, and a brightness overlay.
- `backup.js` adds Settings > Backup & restore. The same file is in Android 2.10.
- After you change any file, run `python3 make-sw.py`. It rebuilds the precache list and the cache version in `sw.js`.
