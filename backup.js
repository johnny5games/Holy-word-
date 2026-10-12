/* God's Holy Word 2.10 — Backup / Restore (shared by the Android app and the iPhone PWA).
   Exports every saved item (notes, highlights, bookmarks/position, reading log,
   streak, settings) from localStorage to one JSON file, and restores one. */
(function () {
  var APPV = '2.10';
  function keys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) out.push(k); } } catch (e) {}
    return out.filter(function (k) { return k.indexOf('qodesh:') === 0 || k.indexOf('jsv_') === 0 || k.indexOf('ghw') === 0; }).sort();
  }
  function build() {
    var data = {}, ks = keys();
    ks.forEach(function (k) { try { data[k] = localStorage.getItem(k); } catch (e) {} });
    var notes = ks.filter(function (k) { return k.indexOf('qodesh:note:') === 0; }).length;
    return { app: "God's Holy Word", format: 'ghw-backup', formatVersion: 1, appVersion: APPV,
      platform: (window.GHWShare ? 'android' : 'web'), exportedAt: new Date().toISOString(),
      summary: { items: ks.length, notes: notes, hasHighlights: !!data['qodesh:hl'] }, data: data };
  }
  function fname() { var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'GodsHolyWord-backup-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '.json'; }
  function toast(m) { try { if (window.quickToast) return quickToast(m); } catch (e) {} try { status(m); } catch (e) {} }
  function status(m) { var s = document.getElementById('set-backup-status'); if (s) s.textContent = m; }
  function exportBackup() {
    var b = build(), json = JSON.stringify(b, null, 1), name = fname();
    window.__ghwLastBackup = json;
    /* Android 2.10: native file share / save to Downloads */
    try {
      if (window.GHWShare && window.GHWShare.saveFile) {
        var r = String(window.GHWShare.saveFile(json, name));
        if (r === 'ok') { status('\u2713 Saved to Downloads/' + name + ' (' + b.summary.items + ' items)');
          try { if (window.GHWShare.shareFile) window.GHWShare.shareFile(json, name); } catch (e) {}
          return 'android'; }
      }
      if (window.GHWShare && window.GHWShare.shareFile) {
        var r2 = String(window.GHWShare.shareFile(json, name));
        if (r2 === 'ok') { status('\u2713 Backup ready to share (' + b.summary.items + ' items)'); return 'android-share'; }
      }
    } catch (e) {}
    var blob = new Blob([json], { type: 'application/json' });
    try {
      var f = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare && navigator.share && navigator.canShare({ files: [f] })) {
        navigator.share({ files: [f], title: "God's Holy Word backup" }).then(function () {
          status('\u2713 Backup shared (' + b.summary.items + ' items)');
        }).catch(function (e) { if (!e || e.name !== 'AbortError') download(blob, name, b); });
        return 'share';
      }
    } catch (e) {}
    download(blob, name, b);
    return 'download';
  }
  function download(blob, name, b) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
    status('\u2713 Backup downloaded: ' + name + ' (' + b.summary.items + ' items)');
  }
  function restoreText(txt) {
    var o;
    try { o = JSON.parse(txt); } catch (e) { status('That file is not a valid backup (JSON error).'); return -1; }
    if (!o || o.format !== 'ghw-backup' || !o.data || typeof o.data !== 'object') { status('That is not a God\u2019s Holy Word backup file.'); return -1; }
    var n = 0;
    Object.keys(o.data).forEach(function (k) {
      if (!(k.indexOf('qodesh:') === 0 || k.indexOf('jsv_') === 0 || k.indexOf('ghw') === 0)) return;
      var v = o.data[k]; if (typeof v !== 'string') return;
      try { localStorage.setItem(k, v); n++; } catch (e) {}
    });
    status('\u2713 Restored ' + n + ' items. Reloading\u2026');
    setTimeout(function () { location.reload(); }, 900);
    return n;
  }
  function importFile(file) {
    if (!file) return;
    var r = new FileReader();
    r.onload = function () { if (confirm('Restore this backup? It replaces matching notes, highlights and settings on this device.')) restoreText(String(r.result)); };
    r.readAsText(file);
  }
  function mount() {
    var anchor = document.getElementById('set-history');
    if (!anchor || document.getElementById('set-backup-sec')) return;
    var sec = document.createElement('div');
    sec.className = 'set-sec'; sec.id = 'set-backup-sec';
    sec.innerHTML = '<div class="set-label">Backup &amp; restore</div>' +
      '<div class="set-hint">Saves all your notes, highlights, bookmarks, reading history and settings in one file. Use it to move to a new phone (Android \u2194 iPhone).</div>' +
      '<button id="set-backup-export" class="set-wide">&#11015;&#65039; Export backup</button>' +
      '<button id="set-backup-import" class="set-wide">&#11014;&#65039; Import backup file</button>' +
      '<button id="set-backup-paste" class="set-wide">&#128203; Paste backup text</button>' +
      '<input type="file" id="set-backup-file" accept=".json,application/json,text/plain" style="display:none">' +
      '<div class="set-hint" id="set-backup-status"></div>';
    var parent = anchor.parentNode; parent.parentNode.insertBefore(sec, parent.nextSibling);
    document.getElementById('set-backup-export').addEventListener('click', exportBackup);
    var fi = document.getElementById('set-backup-file');
    document.getElementById('set-backup-import').addEventListener('click', function () { fi.value = ''; fi.click(); });
    fi.addEventListener('change', function () { importFile(fi.files && fi.files[0]); });
    document.getElementById('set-backup-paste').addEventListener('click', function () {
      var t = prompt('Paste the full backup text (JSON):'); if (t) restoreText(t);
    });
  }
  window.GHWBackup = { build: build, exportBackup: exportBackup, restoreText: restoreText, importFile: importFile };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
