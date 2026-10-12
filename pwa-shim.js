/* God's Holy Word — iPhone PWA layer.
   The Android app talks to native code through window.AndroidTTS (speech,
   voices, rate, keep-awake, brightness, streak). On the web there is no such
   bridge, so this file provides a pure-web implementation with the same API,
   loaded BEFORE app.js:
     speech     -> Web Speech speechSynthesis (unlocked on first gesture, best en-US voice)
     keep awake -> Screen Wake Lock API (iOS 16.4+), re-acquired on visibilitychange;
                   fallback: muted, looping, inline <video>
     brightness -> dimming overlay (web pages cannot change screen brightness)
   window.GHWShare is NOT defined: app.js then uses navigator.share, the
   clipboard and downloads, which all work on iOS. */
(function () {
  'use strict';
  var ss = window.speechSynthesis;
  var seq = 0, rate = 1, voiceName = '', unlocked = false;

  /* ---------- voices ---------- */
  var GOOD = [/siri/i, /premium/i, /enhanced/i, /^samantha/i, /^ava/i, /^allison/i, /^susan/i, /^zoe/i,
              /^evan/i, /^nathan/i, /^tom\b/i, /^alex\b/i, /google us english/i, /natural/i];
  function score(v) {
    var s = 0, l = (v.lang || '').replace('_', '-');
    if (/^en-US$/i.test(l)) s += 100; else if (/^en/i.test(l)) s += 40; else return -1;
    for (var i = 0; i < GOOD.length; i++) if (GOOD[i].test(v.name)) { s += 50 - i; break; }
    if (/compact|eloquence|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|jester|superstar|wobble|albert|bahh|fred|junior|ralph|kathy|grandma|grandpa|rocko|shelley|flo|reed|sandy/i.test(v.name)) s -= 60;
    if (v.localService) s += 5;
    return s;
  }
  function voices() {
    var l = []; try { l = ss ? ss.getVoices() : []; } catch (e) {}
    return l.filter(function (v) { return score(v) >= 0; })
            .sort(function (a, b) { return score(b) - score(a); });
  }
  function pickVoice() {
    var l = voices(), i;
    if (voiceName) for (i = 0; i < l.length; i++) if (l[i].name === voiceName) return l[i];
    return l[0] || null;
  }
  window.chosenVoice = null;
  function refreshChosen() { window.chosenVoice = pickVoice(); }
  if (ss) {
    try { ss.addEventListener('voiceschanged', function () {
      refreshChosen();
      /* the settings voice list is filled from getVoices(): refresh it when iOS finishes loading */
      try { if (typeof refreshVoiceList === 'function' && document.getElementById('set-voice')) refreshVoiceList(); } catch (e) {}
    }); } catch (e) {}
    refreshChosen();
  }

  function utter(text) {
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-US';
    u.rate = rate; u.pitch = 1; u.volume = 1;
    return u;
  }
  function cb(name, i) {
    setTimeout(function () { try { window.QodeshTTS && window.QodeshTTS[name](i); } catch (e) {} }, 0);
  }

  /* ---------- iOS unlock: speech must first start inside a user gesture ---------- */
  function unlock() {
    if (unlocked || !ss) return;
    unlocked = true;
    try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.rate = 10; ss.speak(u); } catch (e) {}
    refreshChosen();
    if (wantAwake) wakeOn();
  }
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (t) {
    document.addEventListener(t, unlock, { capture: true, passive: true });
  });

  /* ---------- keep the screen awake ---------- */
  var wantAwake = false, lock = null, vid = null;
  function videoOn() {
    try {
      if (!vid) {
        vid = document.createElement('video');
        vid.setAttribute('playsinline', ''); vid.setAttribute('webkit-playsinline', '');
        vid.setAttribute('muted', ''); vid.muted = true; vid.loop = true;
        vid.setAttribute('aria-hidden', 'true');
        vid.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none;z-index:-1';
        vid.src = 'awake.mp4';
        (document.body || document.documentElement).appendChild(vid);
      }
      var p = vid.play(); if (p && p.catch) p.catch(function () {});
      window.__ghwAwakeMode = 'video';
    } catch (e) {}
  }
  function wakeOn() {
    if (!wantAwake || document.visibilityState !== 'visible') return;
    if ('wakeLock' in navigator && navigator.wakeLock && navigator.wakeLock.request) {
      if (lock && !lock.released) return;
      navigator.wakeLock.request('screen').then(function (l) {
        lock = l; window.__ghwAwakeMode = 'wakelock';
        l.addEventListener('release', function () { lock = null; });
      }).catch(function () { videoOn(); });
    } else videoOn();
  }
  function wakeOff() {
    try { if (lock) lock.release(); } catch (e) {}
    lock = null;
    try { if (vid) vid.pause(); } catch (e) {}
    window.__ghwAwakeMode = 'off';
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && wantAwake) { lock = null; wakeOn(); }
  });

  /* ---------- brightness (overlay) ---------- */
  function dim(f) {
    var o = document.getElementById('pwa-dim');
    if (!o) { o = document.createElement('div'); o.id = 'pwa-dim'; (document.body || document.documentElement).appendChild(o); }
    o.style.opacity = String(Math.max(0, Math.min(0.85, 1 - f)));
  }

  /* ---------- the web "bridge" ---------- */
  window.AndroidTTS = {
    isWeb: true,
    setRate: function (r) { rate = parseFloat(r) || 1; },
    setVoice: function (n) { voiceName = n || ''; refreshChosen(); },
    getVoices: function () {
      return JSON.stringify(voices().map(function (v) {
        return { name: v.name, label: v.name + ' (' + v.lang + ')', locale: (v.lang || '').replace('_', '-') };
      }));
    },
    speakVerse: function (idx, text) {
      if (!ss) throw new Error('no speech');
      var my = ++seq;
      ss.cancel();
      /* iOS drops a speak() issued in the same tick as cancel() */
      setTimeout(function () {
        if (my !== seq) return;
        var u = utter(text);
        u.onstart = function () { if (my === seq) cb('verseStart', idx); };
        var done = function () { if (my === seq) { seq++; cb('verseDone', idx); } };
        u.onend = done; u.onerror = function (e) { if (e && (e.error === 'interrupted' || e.error === 'canceled')) return; done(); };
        try { if (ss.paused) ss.resume(); ss.speak(u); } catch (e) { done(); }
      }, 60);
    },
    speakWord: function (w) {
      if (!ss) throw new Error('no speech');
      var my = ++seq; ss.cancel();
      setTimeout(function () { if (my === seq) try { ss.speak(utter(w)); } catch (e) {} }, 60);
    },
    stop: function () { seq++; try { if (ss) ss.cancel(); } catch (e) {} },
    setKeepAwake: function (on) { wantAwake = !!on; if (on) wakeOn(); else wakeOff(); },
    setBrightness: function (f) { dim(parseFloat(f) || 1); },
    markOpenedToday: function () {},
    reportStreak: function () {}
  };
  window.GHWPwa = { awakeMode: function () { return window.__ghwAwakeMode || 'off'; }, voice: function () { var v = pickVoice(); return v && v.name; } };

  /* ---------- iOS chrome: no pinch / double-tap zoom, no callouts on hold ---------- */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (e) {
    document.addEventListener(e, function (ev) { ev.preventDefault(); }, { passive: false });
  });
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  /* double-tap zoom is disabled with touch-action:manipulation (pwa.css) */
  document.addEventListener('contextmenu', function (e) {
    if (!(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault();
  });

  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});

  /* ---------- service worker + offline download progress ---------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (e) { console.warn('SW', e); });
    });
    navigator.serviceWorker.addEventListener('message', function (ev) {
      var d = ev.data || {};
      if (d.type !== 'ghw-cache') return;
      var b = document.getElementById('pwa-offline');
      if (!b) { b = document.createElement('div'); b.id = 'pwa-offline'; document.body.appendChild(b); }
      if (d.done) { b.textContent = '\u2713 Ready for offline use'; setTimeout(function () { b.remove(); }, 2500); }
      else b.textContent = 'Saving Bible for offline\u2026 ' + Math.round(100 * d.n / d.total) + '%';
    });
  }
})();
