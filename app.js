/* Qodesh — offline Sacred Name Bible reader */
(function () {
'use strict';

var $ = function (id) { return document.getElementById(id); };
function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------------- divine-name rendering ----------------
   One dataset (Yahuah/Yahusha). Alternate renderings are a
   runtime text swap applied at display time only. */
var NAME_MODES = {
  'yahuah-yahusha': { label: 'Yahuah / Yahusha', father: 'Yahuah', son: 'Yahusha',
                      fUp: 'YAHUAH', sUp: 'YAHUSHA' },
  'yah-yahusha':     { label: 'Yah / Yahusha',   father: 'Yah',    son: 'Yahusha',
                      fUp: 'YAH',    sUp: 'YAHUSHA' },
  'yahweh-yahshua': { label: 'Yahweh / Yahshua', father: 'Yahweh', son: 'Yahshua',
                      fUp: 'YAHWEH', sUp: 'YAHSHUA' },
  'yhwh-yeshua':     { label: 'YHWH / Yeshua',   father: 'YHWH',   son: 'Yeshua',
                      fUp: 'YHWH',   sUp: 'YESHUA' },
  'god-jesus':       { label: 'God / Jesus',     father: 'God',    son: 'Jesus',
                      fUp: 'GOD',    sUp: 'JESUS' },
  'hebrew-names':    { label: 'Hebrew Names',    father: 'Yahuah', son: 'Yahusha',
                      fUp: 'YAHUAH', sUp: 'YAHUSHA' }
};
function nm() { return NAME_MODES[state.names] || NAME_MODES['yahuah-yahusha']; }
/* Subtitle / badge label: only the sacred dataset follows the name-mode picker. */
function nameLabel() {
  if (state.version === 'sacred' || state.version === 'compare') return nm().label;
  if (state.version === 'ethiopic' || state.dv === 'ethiopic') return 'God / Jesus';
  if (state.version === 'yy' || state.dv === 'yy') return 'YAHWEH / Yeshua';
  if (state.version === 'nt' || state.dv === 'nt') return 'YAHWEH + titles / Yeshua';
  var k = state.version === 'votd' ? votdVersionKey() : (state.dv || state.version);
  if (k === 'sacred') return nm().label;
  return (VERSIONS[k] && VERSIONS[k].logo) || 'Scripture';
}
function swapNames(t, vOverride) {
  var v = (typeof vOverride === 'string') ? vOverride : state.version;
  if (v !== 'sacred' && v !== 'compare') return t;
  if (state.names === 'hebrew-names') return hebrewNames(t);
  var m = nm();
  if (state.names === 'yahuah-yahusha') return t;
  return String(t)
    .replace(/Yahusha|Yahuah/g, function (w) { return w === 'Yahusha' ? m.son : m.father; })
    .replace(/YAHUSHA|YAHUAH/g, function (w) { return w === 'YAHUSHA' ? m.sUp : m.fUp; });
}

/* ---------------- Hebrew Names rendering ----------------
   Original runtime transliteration scheme (not Cepher text).
   Yahuah/Yahusha stay as-is; other names get Hebrew renderings.
   Word-boundary-safe, case-sensitive (the dataset capitalizes names).
   Title tokens ("Lord") are mixed human/divine in the data and
   "God" never appears standalone, so neither is remapped. */
var HEBREW_MAP = {
  'Holy Spirit': 'Ruach HaQodesh', 'Holy Ghost': 'Ruach HaQodesh', 'Red Sea': 'Yam Suph',
  'Abraham': 'Avraham', 'Isaac': 'Yitschak', 'Jacob': "Ya'aqov", 'Joseph': 'Yosef',
  'Moses': 'Mosheh', 'Aaron': 'Aharon', 'Joshua': 'Yahushua', 'Samuel': "Shemu'el",
  'David': 'Dawid', 'Solomon': 'Shelomoh', 'Elijah': 'Eliyahu', 'Isaiah': 'Yeshayahu',
  'Jeremiah': 'Yirmeyahu', 'Ezekiel': 'Yechezqel', 'Daniel': "Daniy'el",
  'Hosea': 'Hushea', 'Joel': "Yo'el", 'Obadiah': 'Ovadyah', 'Jonah': 'Yonah',
  'Micah': 'Miykah', 'Nahum': 'Nachum', 'Habakkuk': 'Chavaqquq',
  'Zephaniah': 'Tsefanyahu', 'Haggai': 'Chaggai', 'Zechariah': 'Zekaryah',
  'Malachi': "Mal'akiy", 'Eve': 'Chavvah', 'Noah': 'Noach', 'Cain': 'Qayin',
  'Abel': 'Hevel', 'Enoch': 'Chanok', 'Rebekah': 'Rivqah', 'Leah': "Le'ah",
  'Miriam': 'Miryam', 'Deborah': 'Devorah', 'Gideon': "Gid'on", 'Samson': 'Shimshon',
  'Caleb': 'Kalev', 'Saul': "Sha'ul", 'Jonathan': 'Yahonatan', 'Rehoboam': "Rechav'am",
  'Hezekiah': 'Chizqiyahu', 'Josiah': 'Yoshiyahu', 'Cyrus': 'Koresh',
  'Esther': 'Ester', 'Job': 'Iyov', 'Nehemiah': 'Nechemyah', 'Pharaoh': "Par'oh",
  'Mary': 'Miryam', 'John': 'Yochanan', 'Peter': 'Kepha', 'Paul': "Sha'ul",
  'James': "Ya'aqov", 'Matthew': 'Mattithyahu', 'Mark': 'Marqos', 'Luke': 'Luqas',
  'Thomas': "Ta'oma", 'Judas': 'Yahudah', 'Jude': 'Yahudah',
  'Ananias': 'Chananyah', 'Philip': 'Philippos',
  'Jerusalem': 'Yerushalayim', 'Israel': "Yisra'el", 'Judah': 'Yahudah',
  'Bethlehem': 'Beyth Lechem', 'Nazareth': 'Natsareth', 'Galilee': 'Galiyl',
  'Egypt': 'Mitsrayim', 'Babylon': 'Bavel', 'Jordan': 'Yarden', 'Sinai': 'Ciynay',
  'Zion': 'Tsiyon', 'Canaan': "Kena'an", 'Golgotha': 'Gulgoleth',
  'Gethsemane': 'Gat Shemanim', 'Olives': 'Zeytiym', 'Bethany': 'Beyth Anyah',
  'Capernaum': 'Kephar Nachum',
  'Christ': 'Mashiach', 'Messiah': 'Mashiach', 'Amen': 'Amein',
  'the Lord': 'Adonai', 'The Lord': 'Adonai',
  'Lord': 'Adonai', 'LORD': 'Adonai',
  'Sabbath': 'Shabbat', 'Passover': 'Pecach',
  'Emmanuel': "Immanu'el", 'Immanuel': "Immanu'el"
};
var HEBREW_RE = null;
function hebrewNames(t) {
  if (!HEBREW_RE) {
    var keys = Object.keys(HEBREW_MAP).sort(function (a, b) { return b.length - a.length; });
    HEBREW_RE = new RegExp('\\b(' + keys.map(function (k) {
      return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }).join('|') + ')\\b', 'g');
  }
  return String(t).replace(HEBREW_RE, function (w) { return HEBREW_MAP[w]; });
}

/* ---------------- bible versions ---------------- */
var VERSIONS = {
  sacred: { file: 'bible.json',  logo: 'JSB',
            tagline: 'Johnny Smith Version \u2022 Easy-Read English Edition' },
  ethiopic: { file: 'ethiopic.json', logo: 'ETH',
            tagline: 'Ethiopian Orthodox \u2022 Wider Canon \u2022 God / Lord / Jesus' },
  yy: { file: 'yy.json', logo: 'Y&Y',
            tagline: 'Yahweh & Yeshua \u2022 JSV text \u2022 YAHWEH / Yeshua' },
  nt: { file: 'nt.json', logo: 'N&T',
            tagline: 'YAHWEH where the Name is, titles where titles are' },
  kjv: { file: 'kjv.json', logo: 'KJV',
         tagline: 'King James Version \u2022 1611 \u2022 Public Domain' },
  web: { file: 'web.json', logo: 'WEB',
         tagline: 'World English Bible \u2022 Public Domain' },
  ylt: { file: 'ylt.json', logo: 'YLT',
         tagline: 'Young\u2019s Literal Translation \u2022 1862 \u2022 Public Domain' },
  ydabar: { file: 'ydabar.json', logo: 'YD',
         tagline: 'YAHUAH DABAR \u2022 Sacred-Name Translation' },
  bsb: { file: 'bsb.json', logo: 'BSB',
         tagline: 'Berean Standard Bible \u2022 Public Domain' },
  elohim: { file: 'elohim.json', logo: 'EL',
         tagline: 'ELOHIM \u2022 Accurate-Names Edition' },
  /* ---- v2 additions: public-domain translations (LSV is CC BY-SA, credited in Settings) ---- */
  asv: { file: 'asv.json', logo: 'ASV',
         tagline: 'American Standard Version \u2022 1901 \u2022 Public Domain' },
  darby: { file: 'darby.json', logo: 'DBY',
         tagline: 'Darby Translation \u2022 1890 \u2022 Public Domain' },
  bbe: { file: 'bbe.json', logo: 'BBE',
         tagline: 'Bible in Basic English \u2022 Public Domain' },
  dra: { file: 'dra.json', logo: 'DRA',
         tagline: 'Douay-Rheims \u2022 1899 \u2022 Public Domain' },
  msb: { file: 'msb.json', logo: 'MSB',
         tagline: 'Majority Standard Bible \u2022 Public Domain' },
  oeb: { file: 'oeb.json', logo: 'OEB',
         tagline: 'Open English Bible \u2022 Public Domain' },
  lsv: { file: 'lsv.json', logo: 'LSV',
         tagline: 'Literal Standard Version \u2022 2020 \u2022 CC BY-SA' },
  brenton: { file: 'brenton.json', logo: 'LXX',
         tagline: 'Brenton Septuagint \u2022 1851 \u2022 Public Domain' },
  geneva: { file: 'geneva.json', logo: 'GNV',
         tagline: 'Geneva Bible \u2022 1599 \u2022 Public Domain' },
  jps: { file: 'jps.json', logo: 'JPS',
         tagline: 'Jewish Publication Society \u2022 1917 \u2022 Public Domain' },
  tcnt: { file: 'tcnt.json', logo: 'TCNT',
         tagline: 'Twentieth Century New Testament \u2022 Public Domain' },
  wmb: { file: 'wmb.json', logo: 'WMB',
         tagline: 'World Messianic Bible \u2022 Public Domain' },
  webster: { file: 'webster.json', logo: 'WBT',
         tagline: 'Webster Bible \u2022 1833 \u2022 Public Domain' },
  rv: { file: 'rv.json', logo: 'RV',
         tagline: 'Revised Version \u2022 1885 \u2022 Public Domain' },
  wycliffe: { file: 'wycliffe.json', logo: 'WYC',
         tagline: 'Wycliffe Bible \u2022 1395 \u2022 Public Domain' }
};
/* 'compare' is a view mode, not a data file: it reads the sacred dataset
   and renders KJV, WEB, YLT and YAHUAH DABAR alongside it (toggleable per version). */
var STD_VERSION_KEYS = ['kjv', 'web', 'ylt', 'ydabar', 'bsb', 'elohim',
  'asv', 'darby', 'bbe', 'dra', 'msb', 'oeb', 'lsv', 'brenton', 'geneva', 'jps',
  'tcnt', 'wmb', 'webster', 'rv', 'wycliffe'];
function isStdVersion(v) { return STD_VERSION_KEYS.indexOf(v) >= 0; }
var VOTD_LIST = [["Genesis 1:1",0,0,1],["Genesis 1:27",0,0,27],["Genesis 28:15",0,27,15],["Exodus 14:14",1,13,14],["Deuteronomy 31:6",4,30,6],["Joshua 1:9",5,0,9],["1 Samuel 16:7",8,15,7],["2 Chronicles 7:14",13,6,14],["Nehemiah 8:10",15,7,10],["Psalms 19:14",18,18,14],["Psalms 23:1",18,22,1],["Psalms 23:4",18,22,4],["Psalms 27:1",18,26,1],["Psalms 34:8",18,33,8],["Psalms 37:4",18,36,4],["Psalms 46:1",18,45,1],["Psalms 46:10",18,45,10],["Psalms 56:3",18,55,3],["Psalms 91:1",18,90,1],["Psalms 91:2",18,90,2],["Psalms 118:24",18,117,24],["Psalms 119:105",18,118,105],["Psalms 121:1",18,120,1],["Psalms 139:14",18,138,14],["Proverbs 3:5",19,2,5],["Proverbs 3:6",19,2,6],["Proverbs 16:3",19,15,3],["Proverbs 18:10",19,17,10],["Proverbs 22:6",19,21,6],["Ecclesiastes 3:1",20,2,1],["Isaiah 9:6",22,8,6],["Isaiah 26:3",22,25,3],["Isaiah 40:31",22,39,31],["Isaiah 41:10",22,40,10],["Isaiah 43:2",22,42,2],["Isaiah 53:5",22,52,5],["Jeremiah 29:11",23,28,11],["Jeremiah 33:3",23,32,3],["Lamentations 3:22",24,2,22],["Lamentations 3:23",24,2,23],["Ezekiel 36:26",25,35,26],["Micah 6:8",32,5,8],["Nahum 1:7",33,0,7],["Habakkuk 3:19",34,2,19],["Zephaniah 3:17",35,2,17],["Malachi 3:10",38,2,10],["Matthew 5:3",60,4,3],["Matthew 5:16",60,4,16],["Matthew 6:33",60,5,33],["Matthew 7:7",60,6,7],["Matthew 11:28",60,10,28],["Matthew 19:26",60,18,26],["Matthew 28:20",60,27,20],["Mark 11:24",61,10,24],["Luke 1:37",62,0,37],["Luke 6:31",62,5,31],["John 1:1",63,0,1],["John 3:16",63,2,16],["John 8:12",63,7,12],["John 8:32",63,7,32],["John 10:10",63,9,10],["John 14:6",63,13,6],["John 14:27",63,13,27],["John 15:13",63,14,13],["John 16:33",63,15,33],["Acts 1:8",64,0,8],["Acts 16:31",64,15,31],["Romans 3:23",65,2,23],["Romans 5:8",65,4,8],["Romans 6:23",65,5,23],["Romans 8:1",65,7,1],["Romans 8:28",65,7,28],["Romans 8:31",65,7,31],["Romans 10:9",65,9,9],["Romans 10:13",65,9,13],["Romans 12:2",65,11,2],["Romans 15:13",65,14,13],["1 Corinthians 10:13",66,9,13],["1 Corinthians 13:4",66,12,4],["2 Corinthians 5:17",67,4,17],["2 Corinthians 12:9",67,11,9],["Galatians 5:22",68,4,22],["Ephesians 2:8",69,1,8],["Philippians 1:6",70,0,6],["Philippians 4:6",70,3,6],["Philippians 4:7",70,3,7],["Philippians 4:13",70,3,13],["Philippians 4:19",70,3,19],["Colossians 3:23",71,2,23],["1 Thessalonians 5:16",72,4,16],["1 Thessalonians 5:18",72,4,18],["2 Timothy 1:7",75,0,7],["2 Timothy 3:16",75,2,16],["Hebrews 11:1",78,10,1],["Hebrews 13:5",78,12,5],["James 1:5",79,0,5],["1 Peter 5:7",80,4,7],["1 John 1:9",82,0,9],["1 John 4:19",82,3,19],["Revelation 3:20",86,2,20],["Revelation 21:4",86,20,4]];

/* ---------------- Verse of the Day card (sidebar) ----------------
   Curated list mirrors android/assets/votd.json used by the home-screen
   widget (same entries, same day-of-year algorithm), so the widget and
   the in-app card always agree. Text is looked up live from the current
   version dataset so it follows the active version tab and divine-name
   mode (gold/red kept for JSV). */
function votdDayOfYear() {
  var now = new Date(), start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / 86400000); /* 1-based, like Calendar.DAY_OF_YEAR */
}
function votdEntry() {
  if (!VOTD_LIST || !VOTD_LIST.length) return null;
  var e = VOTD_LIST[votdDayOfYear() % VOTD_LIST.length];
  return { ref: e[0], b: e[1], c: e[2], v: e[3] };
}
/* resolve the entry against a given version dataset; null if missing */
function votdLookupV(e, vkey) {
  if (!e || !DATA) return null;
  var b = e.b;
  if (isStdVersion(vkey)) { b = sacredToStdIndex(b); if (b < 0) return null; }
  var book = DATA.books[b];
  if (!book) return null;
  var ch = book.chapters[e.c];
  if (!ch) return null;
  for (var i = 0; i < ch.length; i++)
    if (ch[i][0] === e.v) return { book: b, verse: ch[i] };
  return null;
}
/* resolve the entry against the CURRENTLY loaded dataset; null if missing */
function votdLookup(e) { return votdLookupV(e, state.version); }
function votdTextHtml(vobj) {
  /* same segment rendering as verseHtml(), minus verse number/badges */
  return verseSegHtml(vobj);
}
function renderVotd() {
  var card = $('votd-card'), ref = $('votd-ref'), txt = $('votd-text');
  if (!card || !ref || !txt) return;
  var e = votdEntry();
  if (!e) { ref.textContent = ''; txt.textContent = 'Verse of the day unavailable.'; return; }
  ref.textContent = e.ref;
  var hit = votdLookup(e);
  txt.innerHTML = hit ? votdTextHtml(hit.verse)
    : '\u201CLook up ' + esc(e.ref) + ' in your Bible.\u201D';
}
function initVotd() {
  var card = $('votd-card');
  if (!card || card.getAttribute('data-votd')) return;
  card.setAttribute('data-votd', '1');
  var go = function () {
    var e = votdEntry();
    if (!e) return;
    var b = e.b;
    if (isStdVersion(state.version)) { b = sacredToStdIndex(b); if (b < 0) return; }
    window.jumpToVerse(b, e.c, e.v); /* reuses the widget deep-link path */
  };
  card.addEventListener('click', go);
  card.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); }
  });
}

/* ---------------- Verse of the Day TAB (rotating version) ----------------
   The tab shows the SAME verse as the sidebar card and the home-screen
   widget (same VOTD_LIST, same 1-based day-of-year index), but the TEXT is
   rendered in a version that rotates daily: JSV -> KJV -> WEB -> YLT -> YDABAR -> BSB -> ELOHIM. */
var VOTD_VERSIONS = [['sacred', 'JSV'], ['kjv', 'KJV'], ['web', 'WEB'], ['ylt', 'YLT'], ['ydabar', 'YDABAR'], ['bsb', 'BSB'], ['elohim', 'ELOHIM']];
function votdVersionIdx(day) { return day % VOTD_VERSIONS.length; }
function votdVersionKey() { return VOTD_VERSIONS[votdVersionIdx(votdDayOfYear())][0]; }
function votdVersionLabel() { return VOTD_VERSIONS[votdVersionIdx(votdDayOfYear())][1]; }
function votdTomorrowLabel() { return VOTD_VERSIONS[votdVersionIdx(votdDayOfYear() + 1)][1]; }
function renderVotdTab() {
  var view = $('votd-view');
  if (!view) return;
  var dEl = $('votdtab-date'), rEl = $('votdtab-ref'), pEl = $('votdtab-verpill'),
      tEl = $('votdtab-text'), tmEl = $('votdtab-tomorrow');
  if (!dEl || !rEl || !pEl || !tEl || !tmEl) return;
  var e = votdEntry();
  if (!e) {
    dEl.textContent = ''; rEl.textContent = '';
    pEl.textContent = ''; tmEl.textContent = '';
    tEl.textContent = 'Verse of the day unavailable.';
    return;
  }
  try {
    dEl.textContent = new Date().toLocaleDateString(undefined,
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  } catch (err) { dEl.textContent = ''; }
  rEl.textContent = e.ref;
  pEl.textContent = "Today's version: " + votdVersionLabel();
  /* DATA is already the rotation version's dataset (setVersion maps votd -> dv) */
  var hit = votdLookupV(e, votdVersionKey());
  tEl.innerHTML = hit ? votdTextHtml(hit.verse)
    : '\u201CLook up ' + esc(e.ref) + ' in your Bible.\u201D';
  tmEl.textContent = "Tomorrow's version: " + votdTomorrowLabel();
}
function initVotdTab() {
  var btn = $('btn-votd-chapter');
  if (!btn || btn.getAttribute('data-votdtab')) return;
  btn.setAttribute('data-votdtab', '1');
  btn.addEventListener('click', function () {
    var e = votdEntry();
    if (!e) return;
    var vk = votdVersionKey();
    var b = e.b;
    if (isStdVersion(vk)) { b = sacredToStdIndex(b); if (b < 0) return; }
    setVersion(vk); /* DATA is already this dataset; cache hit keeps it sync */
    window.jumpToVerse(b, e.c, e.v); /* reuses the widget deep-link path */
  });
}
var DATA_CACHE = {};

/* ---------------- daily reading streak ---------------- */
var STREAK_MILESTONES = [7, 14, 30, 60, 100, 180, 365];
function localDay(d) {
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}
function streakGet() {
  try {
    return {
      count: parseInt(localStorage.getItem('jsv_streak_count') || '0', 10) || 0,
      last: localStorage.getItem('jsv_streak_last') || ''
    };
  } catch (e) { return { count: 0, last: '' }; }
}
function streakSet(count, last) {
  try {
    localStorage.setItem('jsv_streak_count', String(count));
    localStorage.setItem('jsv_streak_last', last);
  } catch (e) {}
}
function renderStreakBadge(n) {
  var el = $('streak-badge');
  if (el) el.textContent = '\uD83D\uDD25 ' + n + (n === 1 ? ' day' : ' days');
  var el2 = $('streak-badge-side');
  if (el2) el2.textContent = '\uD83D\uDD25 ' + n + '-day reading streak';
}
var toastTimer = null;
function showToast(msg) {
  var t = $('streak-toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 6000);
}
function updateStreak() {
  var today = localDay(new Date());
  var yd = new Date(); yd.setDate(yd.getDate() - 1);
  var s = streakGet(), changed = false;
  if (s.last !== today) {
    changed = true;
    s.count = (s.last === localDay(yd)) ? s.count + 1 : 1;
    s.last = today;
    streakSet(s.count, s.last);
  }
  renderStreakBadge(s.count);
  try { if (bridge) { bridge.markOpenedToday(); bridge.reportStreak(s.count); } } catch (e) {}
  if (changed && STREAK_MILESTONES.indexOf(s.count) >= 0) {
    showToast('\uD83D\uDD25 ' + s.count + '-day streak! ' + nm().father + ' bless your consistency.');
  }
}

/* ---------------- state ---------------- */
var SECTIONS_SACRED = [
  { title: 'Old Testament', from: 0, to: 38 },
  { title: 'Wider Canon', from: 39, to: 59 },
  { title: 'New Testament', from: 60, to: 86 },
  { title: 'Apostolic Fathers', from: 87, to: 90 },
  { title: 'Extra Texts', from: 91, to: 92 },
  { title: 'Dead Sea Scrolls', from: 93, to: 93 }
];
var SECTIONS_STD = [
  { title: 'Old Testament', from: 0, to: 38 },
  { title: 'New Testament', from: 39, to: 65 }
];
function usesWiderCanon(v) {
  v = v || state.version;
  return v === 'sacred' || v === 'ethiopic' || v === 'yy' || v === 'nt' || v === 'compare' ||
         (v === 'votd' && votdVersionKey() === 'sacred') ||
         (v === 'notes' && (state.dv === 'sacred' || state.dv === 'ethiopic' || state.dv === 'yy' || state.dv === 'nt'));
}
function SECTIONS() { return usesWiderCanon() ? SECTIONS_SACRED : SECTIONS_STD; }
var state = { book: 0, chapter: 0, names: 'yahuah-yahusha', rate: 1, version: 'sacred', dv: 'sacred', pronounce: false };
var DATA = null;

function lsGet(k, d) { try { var v = localStorage.getItem('qodesh:' + k); return v === null ? d : v; } catch (e) { return d; } }
/* v28: returns true only when the write actually landed. The toast paths use
   this so the app can never again claim "Highlighted" when nothing was saved
   (his phone ran many versions with WebView DOM storage disabled, where every
   setItem silently vanished). */
function lsSet(k, v) { try { localStorage.setItem('qodesh:' + k, v); return true; } catch (e) { return false; } }
function loadState() {
  try {
    var p = JSON.parse(lsGet('pos', 'null'));
    if (p && typeof p.book === 'number') { state.book = p.book; state.chapter = p.chapter || 0; }
  } catch (e) {}
  var n = lsGet('names', 'yahuah-yahusha');
  if (NAME_MODES[n]) state.names = n;
  var ver = lsGet('ver', 'sacred');
  if (ver === 'audio') ver = 'sacred'; /* version removed in v13 */
  if (VERSIONS[ver] || ver === 'compare' || ver === 'votd' || ver === 'notes') state.version = ver;
  var r = parseFloat(lsGet('rate', '1'));
  if ([0.5, 0.75, 0.8, 1, 1.25, 1.5, 2].indexOf(r) >= 0) state.rate = r;
  state.pronounce = lsGet('pronounce', 'on') === 'on'; /* word mode on by default; explicit choice persists */
  /* GHW v1.7: dark is the default; only an explicitly saved 'light' choice stays light */
  if (lsGet('theme', 'dark') !== 'light') document.body.classList.add('dark');
}
function savePos() { lsSet('pos', JSON.stringify({ book: state.book, chapter: state.chapter })); }

/* ---------------- data loading ---------------- */
function fetchText(url) {
  return fetch(url).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.text();
  }).catch(function () {
    return new Promise(function (resolve, reject) {
      var x = new XMLHttpRequest();
      x.open('GET', url, true);
      x.onload = function () {
        if (x.status === 0 || x.status === 200) resolve(x.responseText);
        else reject(new Error('XHR ' + x.status));
      };
      x.onerror = function () { reject(new Error('XHR failed')); };
      x.send();
    });
  });
}

/* ---------------- version switching ---------------- */
function applyVersionChrome() {
  var v = state.version;
  /* Compare keeps the name tabs: its JSV column follows the active divine-name mode.
     The votd tab keeps them on JSV days so the verse follows the active mode.
     The notes tab hides them for a clean page. */
  /* Name tabs only apply to the sacred (JSV) dataset. Ethiopic + all 66-book
     translations already use fixed names, so hide the tabs for them. */
  var usesNameModes = (v === 'sacred' || v === 'compare' ||
    (v === 'votd' && votdVersionKey() === 'sacred'));
  var hideNames = !usesNameModes;
  var nt = $('name-tabs'); if (nt) nt.style.display = hideNames ? 'none' : '';
  var lg = $('legend-row'); if (lg) lg.style.display = hideNames ? 'none' : '';
  $('brand-logo').textContent = v === 'compare' ? 'CMP' : (v === 'votd' ? 'VOTD' : (v === 'notes' ? '\uD83D\uDCDD' : VERSIONS[v].logo));
  $('brand-tagline').textContent = v === 'compare'
    ? 'Side-by-side \u2022 JSV + 6 versions'
    : (v === 'votd'
      ? 'Verse of the Day \u2022 ' + votdVersionLabel()
      : (v === 'notes'
        ? 'My Notes \u2022 highlights & chapter notes'
        : VERSIONS[v].tagline));
  var tabs = { compare: 'ver-compare', votd: 'ver-votd', notes: 'ver-notes' };
  for (var k in VERSIONS) tabs[k] = 'ver-' + k;
  for (var k2 in tabs) { var el = $(tabs[k2]); if (el) el.classList.toggle('active', v === k2); }
}
function afterVersionLoad() {
  if (state.book >= DATA.books.length) { state.book = 0; state.chapter = 0; }
  var b = DATA.books[state.book];
  if (state.chapter >= b.chapters.length) state.chapter = 0;
  applyVersionChrome();
  var isVotdTab = state.version === 'votd';
  var isNotesTab = state.version === 'notes';
  $('reader').classList.toggle('hidden', isVotdTab || isNotesTab);
  var vv = $('votd-view'); if (vv) vv.classList.toggle('hidden', !isVotdTab);
  var nv = $('notes-view'); if (nv) nv.classList.toggle('hidden', !isNotesTab);
  $('audiobar').classList.toggle('hidden', isVotdTab || isNotesTab);
  if (isVotdTab) renderVotdTab();
  if (isNotesTab) renderNotesTab();
  if (pendingGoto) { var pg = pendingGoto; pendingGoto = null; gotoVerse(pg.bookName, pg.chapIdx, pg.verseNum); }
  var bs = $('book-search');
  if (bs) bs.placeholder = 'Search ' + DATA.books.length + ' books\u2026';
  renderBooks('');
  renderChapter();
  renderVotd();
  savePos();
}
function versionLoadLabel(v) {
  if (v === 'sacred') return 'Johnny Smith Version';
  if (v === 'ethiopic') return 'Ethiopian Orthodox Bible';
  if (v === 'yy') return 'Yahweh & Yeshua Edition';
  if (v === 'nt') return 'Names & Titles Edition';
  if (v === 'kjv') return 'King James Version';
  if (v === 'web') return 'World English Bible';
  if (v === 'ylt') return 'Young\u2019s Literal Translation';
  if (v === 'ydabar') return 'YAHUAH DABAR';
  if (v === 'bsb') return 'Berean Standard Bible';
  if (v === 'elohim') return 'ELOHIM Accurate-Names Edition';
  if (v === 'asv') return 'American Standard Version';
  if (v === 'darby') return 'Darby Translation';
  if (v === 'bbe') return 'Bible in Basic English';
  if (v === 'dra') return 'Douay-Rheims Bible';
  if (v === 'msb') return 'Majority Standard Bible';
  if (v === 'oeb') return 'Open English Bible';
  if (v === 'lsv') return 'Literal Standard Version';
  if (v === 'brenton') return 'Brenton Septuagint';
  if (v === 'geneva') return 'Geneva Bible';
  if (v === 'jps') return 'JPS Old Testament';
  if (v === 'tcnt') return 'Twentieth Century New Testament';
  if (v === 'wmb') return 'World Messianic Bible';
  if (v === 'webster') return 'Webster Bible';
  if (v === 'rv') return 'Revised Version';
  if (v === 'wycliffe') return 'Wycliffe Bible';
  if (v === 'compare') return 'comparison view';
  if (v === 'votd') return 'today\u2019s verse';
  if (v === 'notes') return 'your notes';
  return 'scriptures';
}
function setVersion(v) {
  if (v !== 'compare' && v !== 'votd' && v !== 'notes' && !VERSIONS[v]) v = 'sacred';
  if (typeof ttsStop === 'function') ttsStop();
  state.version = v;
  lsSet('ver', v);
  /* 'compare', 'votd' and 'notes' are view modes, not datasets:
     compare renders from sacred; votd renders from the daily rotation version;
     notes renders from whichever dataset was active (tracked in state.dv) */
  if (VERSIONS[v]) state.dv = v;
  var dv = v === 'compare' ? 'sacred' : (v === 'votd' ? votdVersionKey() : (v === 'notes' ? (state.dv || 'sacred') : v));
  if (DATA_CACHE[dv]) {
    DATA = DATA_CACHE[dv];
    afterVersionLoad();
    return;
  }
  $('loading').classList.remove('gone');
  $('load-msg').textContent = 'Loading ' + versionLoadLabel(v) + '\u2026';
  fetchText(VERSIONS[dv].file).then(function (t) {
    DATA_CACHE[dv] = JSON.parse(t);
    DATA = DATA_CACHE[dv];
    afterVersionLoad();
    $('loading').classList.add('gone');
  }).catch(function (err) {
    $('load-msg').textContent = 'Could not load Bible data: ' + err;
  });
}

/* ---------------- book list ---------------- */
function sectionOf(i) {
  var secs = SECTIONS();
  for (var s = 0; s < secs.length; s++)
    if (i >= secs[s].from && i <= secs[s].to) return secs[s].title;
  return '';
}
function renderBooks(filter) {
  var list = $('book-list'), html = '', lastSec = '', q = (filter || '').toLowerCase();
  DATA.books.forEach(function (b, i) {
    if (q && b.name.toLowerCase().indexOf(q) < 0) return;
    var sec = sectionOf(i);
    if (sec !== lastSec) { html += '<div class="sec-title">' + esc(sec) + '</div>'; lastSec = sec; }
    html += '<button class="book' + (i === state.book ? ' active' : '') + '" data-i="' + i + '">' +
      '<span>' + esc(b.name) + '</span><span class="chcount">' + b.chapters.length + ' ch</span></button>';
  });
  list.innerHTML = html || '<div class="sec-title">No matches</div>';
  Array.prototype.forEach.call(list.querySelectorAll('.book'), function (btn) {
    btn.addEventListener('click', function () {
      ttsStop();
      state.book = +btn.getAttribute('data-i');
      state.chapter = 0;
      closeSidebar();
      renderChapter();
      savePos();
    });
  });
}

/* ---------------- tap-a-word pronunciation ---------------- */
/* Wrap each word in a tappable span. Punctuation stays attached visually
   (display) but is stripped from the spoken form (data-w). Internal
   apostrophes (don't, Ya'aqov) are kept for speech. */
function wordSpans(t) {
  var parts = String(t).split(/(\s+)/), h = '';
  for (var k = 0; k < parts.length; k++) {
    var tok = parts[k];
    if (!tok || /^\s*$/.test(tok)) { h += esc(tok); continue; }
    var clean = tok.replace(/^[^A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u0590-\u05FF']+|[^A-Za-z0-9\u00C0-\u024F\u0370-\u03FF\u0590-\u05FF']+$/g, '');
    h += '<span class="w" data-w="' + esc(clean || tok) + '">' + esc(tok) + '</span>';
  }
  return h;
}

function updateWordsBtn() {
  var b = $('btn-words');
  b.classList.toggle('active', state.pronounce);
  b.innerHTML = '&#128266; Tap a word to hear it: ' + (state.pronounce ? 'On' : 'Off');
}
function toggleWords() {
  state.pronounce = !state.pronounce;
  lsSet('pronounce', state.pronounce ? 'on' : 'off');
  ttsStop();
  updateWordsBtn();
  if (DATA) renderChapter();
}

/* ---------------- word definitions (long-press a word) ----------------
   Dictionary: www/dict.json (built by tools/build_dict.py from Princeton
   WordNet 3.1 glosses + GCIDE public-domain fallback for archaic words;
   attribution shown in the popup footer). APK loads it via fetch from local
   assets (offline, zero-permission); the web build inlines it as var DICT. */
var DICT_CACHE = null;
function dictData() {
  if (DICT_CACHE) return DICT_CACHE;
  if (typeof DICT !== 'undefined' && DICT) { DICT_CACHE = DICT; return DICT; }
  return null;
}
function ensureDict(done) {
  var d = dictData();
  if (d) { done(d); return; }
  fetchText('dict.json').then(function (t) {
    try { DICT_CACHE = JSON.parse(t); } catch (e) { DICT_CACHE = {}; }
    done(DICT_CACHE);
  }).catch(function () { done({}); });
}
/* ---------------- biblical lexicon (long-press a word) ----------------
   Bible meaning first: www/bible-lexicon.json — original Hebrew/Greek word,
   Strong's number, the ancient biblical sense, and a note on how the meaning
   has drifted in modern usage. Strong's data is public domain; attribution is
   shown in the popup footer. APK loads it via fetch from local assets
   (offline, zero-permission); the web build inlines it as var BIBLE_LEXICON. */
var BIBLE_LEXICON_CACHE = null;
function bibleLexiconData() {
  if (BIBLE_LEXICON_CACHE) return BIBLE_LEXICON_CACHE;
  if (typeof BIBLE_LEXICON !== 'undefined' && BIBLE_LEXICON) { BIBLE_LEXICON_CACHE = BIBLE_LEXICON; return BIBLE_LEXICON; }
  return null;
}
function ensureBibleLexicon(done) {
  var d = bibleLexiconData();
  if (d) { done(d); return; }
  fetchText('bible-lexicon.json').then(function (t) {
    try { BIBLE_LEXICON_CACHE = JSON.parse(t); } catch (e) { BIBLE_LEXICON_CACHE = {}; }
    done(BIBLE_LEXICON_CACHE);
  }).catch(function () { done({}); });
}
/* Exact match first, then simple biblical stemming only: -ed, -ing, -es, -s,
   -eth (with doubled-consonant handling, e.g. repented -> repent, so that
   baptized -> baptize and churches -> church resolve). Returns
   {key: <matched headword>, e: <entry>} or null. The modern dict.json lookup
   below is unchanged. */
function lookupBibleWord(raw) {
  var w = String(raw == null ? '' : raw).toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .replace(/^'+|'+$/g, '');
  if (!w) return null;
  var lex = bibleLexiconData();
  if (!lex) return null;
  if (lex[w]) return { key: w, e: lex[w] };
  var cands = [];
  var push = function (s) { if (s && s.length > 1 && cands.indexOf(s) < 0) cands.push(s); };
  var undup = function (b) { return /(.)\1$/.test(b) ? b.slice(0, -1) : null; };
  var yform = function (b) { return /[^aeiou]i$/.test(b) ? b.slice(0, -1) + 'y' : null; };
  var b;
  if (w.length > 4 && w.slice(-3) === 'ing') { b = w.slice(0, -3); push(b); push(b + 'e'); push(undup(b)); }
  if (w.length > 3 && w.slice(-2) === 'ed') { b = w.slice(0, -2); push(b); push(b + 'e'); push(undup(b)); push(yform(b)); }
  if (w.length > 3 && w.slice(-2) === 'es') { b = w.slice(0, -2); push(b); push(b + 'e'); push(yform(b)); }
  if (w.length > 3 && w.slice(-1) === 's') { push(w.slice(0, -1)); }
  if (w.length > 4 && w.slice(-3) === 'eth') { b = w.slice(0, -3); push(b); push(b + 'e'); push(yform(b)); }
  for (var i = 0; i < cands.length; i++) {
    if (lex[cands[i]]) return { key: cands[i], e: lex[cands[i]] };
  }
  return null;
}
/* Reuse the wordSpans clean logic: lowercase, strip surrounding punctuation
   (internal apostrophes kept). Returns the definition string or null. */
function lookupWord(raw) {
  var w = String(raw == null ? '' : raw).toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .replace(/^'+|'+$/g, '');
  if (!w) return null;
  var d = dictData();
  if (!d) return null;
  return d[w] || null;
}
function showDefPopup(word, verseIdx) {
  var w = String(word == null ? '' : word);
  $('def-word').textContent = w;
  var cw = w.toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '')
    .replace(/^'+|'+$/g, '');
  var b = lookupBibleWord(w);
  var modern = lookupWord(w);
  var bs = $('def-bible'), ms = $('def-modern');
  /* Bible meaning first, prominent: origin + Strong's, ancient sense, drift note */
  if (b && bs) {
    bs.style.display = '';
    $('def-bible-head').textContent = '\uD83D\uDCD6 Bible meaning' +
      ((b.key !== cw) ? ' (from \u2018' + b.key + '\u2019)' : '');
    $('def-ancient').textContent = b.e.ancient;
    $('def-drift').textContent = b.e.drift;
    var meta = b.e.origin || '';
    if (b.e.strongs) meta += (meta ? ' \u00B7 ' : '') + "Strong's " + b.e.strongs;
    var mo = $('def-origin');
    if (meta) { mo.textContent = meta; mo.style.display = ''; }
    else { mo.style.display = 'none'; }
  } else if (bs) { bs.style.display = 'none'; }
  /* Modern meaning second, subdued; unchanged behavior when no bible entry */
  if (ms) {
    if (modern) {
      ms.style.display = '';
      $('def-modern-head').textContent = b ? 'Modern meaning' : 'Definition';
      $('def-modern-text').textContent = modern;
    } else if (!b) {
      ms.style.display = '';
      $('def-modern-head').textContent = 'Definition';
      $('def-modern-text').textContent = 'No definition found for \u2018' + w + '\u2019.';
    } else { ms.style.display = 'none'; }
  }
  var s = $('def-sheet');
  s.classList.remove('sheet-gone');
  s.setAttribute('aria-hidden', 'false');
  defVerseIdx = (typeof verseIdx === 'number' && verseIdx >= 0) ? verseIdx : -1;
}
var defVerseIdx = -1;
function hideDefPopup() {
  var s = $('def-sheet');
  s.classList.add('sheet-gone');
  s.setAttribute('aria-hidden', 'true');
}
/* Long-press detection, delegated on #verses (words re-render often).
   touchstart starts a ~500ms timer; touchend/touchmove/touchcancel cancels it.
   When it fires, the word element is flagged so the follow-up click does NOT
   trigger tap-to-speak. */
var lpTimer = null, lpStart = null;
function setupWordGestures() {
  var sc = $('verses');
  if (!sc || sc._lpArmed) return;
  sc._lpArmed = true;
  var wordAt = function (ev) {
    var t = ev.target;
    return (t && t.classList && t.classList.contains('w')) ? t : null;
  };
  sc.addEventListener('touchstart', function (ev) {
    /* v1.8: clear a stale long-press guard (when the WebView never sent the
       follow-up click) so it can't swallow this new tap */
    var vEl = ev.target;
    while (vEl && vEl !== sc && !(vEl.classList && vEl.classList.contains('verse'))) vEl = vEl.parentNode;
    if (vEl && vEl !== sc && vEl._lpFired && Date.now() - (vEl._lpAt || 0) > 1200) vEl._lpFired = false;
    var w = wordAt(ev);
    if (!w) return;
    if (lpTimer) clearTimeout(lpTimer);
    var tp = (ev.touches && ev.touches[0]) || ev;
    lpStart = { x: tp.clientX || 0, y: tp.clientY || 0 };
    lpTimer = setTimeout(function () {
      lpTimer = null;
      var word = w.getAttribute('data-w') || w.textContent;
      var vi = -1, anc = w;
      while (anc) {
        if (anc.classList && anc.classList.contains('verse')) {
          vi = +anc.getAttribute('data-i'); break;
        }
        anc = anc.parentNode;
      }
      if (vi >= 0 && anc && !isNaN(vi)) {
        /* v1.8: holding a verse (words included) selects it and opens the
           action bar; the dictionary is one tap away via its Define button */
        anc._lpFired = true; anc._lpAt = Date.now(); /* swallow the click that follows */
        if (selMode) toggleSelect(vi); else enterSelMode(vi, word);
        return;
      }
      w._lpFired = true; /* suppress the tap-to-speak click that follows */
      ensureDict(function () {
        ensureBibleLexicon(function () { showDefPopup(word, vi); });
      });
    }, 500);
  }, { passive: true });
  var cancel = function () {
    if (lpTimer) { clearTimeout(lpTimer); lpTimer = null; }
  };
  sc.addEventListener('touchend', cancel);
  /* v1.8: finger jitter must not kill the hold; cancel only past ~12px */
  sc.addEventListener('touchmove', function (ev) {
    if (!lpTimer) return;
    var p = (ev.touches && ev.touches[0]) || ev;
    if (!lpStart || Math.abs((p.clientX || 0) - lpStart.x) > 12 || Math.abs((p.clientY || 0) - lpStart.y) > 12) cancel();
  }, { passive: true });
  sc.addEventListener('touchcancel', cancel);
  /* desktop fallback: right-click / long mouse press is not needed;
     the popup close controls are wired at init */
}

/* ---------------- verse highlights ----------------
   QUICK FLOW (Johnny's design, v27): hold (~500ms) on a VERSE NUMBER, or
   drag-release across a verse, or the definition popup's "Highlight this
   verse" button — all instantly paint the verse in pale quick-yellow ('q'),
   save it date-stamped, append it to the chapter's notes, and toast. NO
   sheet. Holding the number of an already-highlighted verse removes it.
   The verse element is flagged (_lpFired) so the follow-up click does NOT
   fire tapVerse or the number-tap sheet entry.

   SHEET (power use, v26): the 🖍️ button tap and the verse-number SINGLE tap
   still open the highlight sheet (5 colors / Share / Remove), with the
   touchend-driven wiring (wireHlTap) so taps can't get lost on his phone.
   Storage: localStorage 'hl' JSON map keyed book|chapter:verse, entries
   {c: colorCode, d: 'YYYY-MM-DD'}. applyHighlights() re-stamps classes on
   every render. */
var HL_COLORS = ['y', 'g', 'p', 'b', 'o', 'q']; /* yellow green pink blue orange + quick pale-yellow */
var hlVerseIdx = -1;
/* Multi-verse selection mode (v36): long-press a verse number to enter.
   selSet maps verse data-i -> true. While active, taps toggle selection;
   long-pressing another verse number opens the color sheet in batch mode. */
var selMode = false, selSet = {}, hlBatch = false;
function selCount() { return Object.keys(selSet).length; }
function paintSelection() {
  Array.prototype.forEach.call(document.querySelectorAll('#verses .verse'), function (el) {
    el.classList.toggle('selected', !!selSet[el.getAttribute('data-i')]);
  });
  var chip = $('sel-cancel');
  if (chip) chip.classList.remove('show'); /* v1.8: the action bar has its own Close */
  updateSelBar();
}
function enterSelMode(i, word) {
  selMode = true; selSet = {};
  selSet[i] = true;
  selWord = word || null;
  try { if (tts.mode === 'verse') ttsStop(); } catch (e) {}
  paintSelection();
}
function toggleSelect(i) {
  if (selSet[i]) delete selSet[i]; else selSet[i] = true;
  if (selWord && selCount() !== 1) selWord = null;
  if (!selCount()) { exitSelMode(); return; }
  paintSelection();
}
function exitSelMode() {
  selMode = false; selSet = {}; hlBatch = false; selWord = null;
  paintSelection();
}

function hlKey(bookName, chapIdx, verseNum) { return bookName + '|' + chapIdx + '|' + verseNum; }
/* v25: highlight entries are {c: colorCode, d: 'YYYY-MM-DD'} objects so the
   Notes tab can show when each verse was highlighted. Older installs stored
   bare color strings; normHlVal migrates them on load. */
function todayISO(d) {
  d = d || new Date();
  var m = d.getMonth() + 1, day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}
function normHlVal(v) {
  if (typeof v === 'string') return { c: v, d: null };
  if (v && typeof v === 'object' && typeof v.c === 'string')
    return { c: v.c, d: (typeof v.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.d)) ? v.d : null };
  return null;
}
function loadHl() {
  var m = {};
  try { m = JSON.parse(lsGet('hl', '{}')) || {}; } catch (e) { m = {}; }
  var dirty = false;
  Object.keys(m).forEach(function (k) {
    var n = normHlVal(m[k]);
    if (!n || HL_COLORS.indexOf(n.c) < 0) { delete m[k]; dirty = true; }
    else if (typeof m[k] !== 'object' || m[k] === null) { m[k] = n; dirty = true; }
    else m[k] = n;
  });
  if (dirty) saveHl(m);
  return m;
}
function saveHl(m) { return lsSet('hl', JSON.stringify(m)); }
/* v28: confirm a highlight entry really is in storage (read it back) before
   any success toast. Returns true when the entry is present with the expected
   color, false when the write vanished (broken storage) so callers can be
   honest instead of toasting a lie. */
function hlStored(key, color) {
  var e = normHlVal(loadHl()[key]);
  return !!(e && e.c === color);
}
function hlEntryOf(i) {
  var b = DATA.books[state.book];
  if (!b || !b.chapters[state.chapter] || !b.chapters[state.chapter][i]) return null;
  var m = loadHl();
  var e = normHlVal(m[hlKey(b.name, state.chapter, b.chapters[state.chapter][i][0])]);
  return (e && HL_COLORS.indexOf(e.c) >= 0) ? e : null;
}
function hlColorOf(i) {
  var e = hlEntryOf(i);
  return e ? e.c : null;
}
function applyHighlights() {
  var b = DATA.books[state.book];
  if (!b || !$('verses')) return;
  Array.prototype.forEach.call($('verses').querySelectorAll('.verse'), function (el) {
    var c = hlColorOf(+el.getAttribute('data-i'));
    HL_COLORS.forEach(function (k) { el.classList.remove('hl-' + k); });
    if (c) el.classList.add('hl-' + c);
  });
}
function showHlSheet(i) {
  hlVerseIdx = i;
  hlBatch = false;
  $('hl-title').textContent = 'Highlight ' + refOf(i);
  var cur = hlColorOf(i);
  var btns = document.querySelectorAll('#hl-colors .hl-btn');
  Array.prototype.forEach.call(btns, function (bt) {
    bt.classList.toggle('on', bt.getAttribute('data-c') === cur);
  });
  $('hl-remove').style.display = cur ? '' : 'none';
  updateShareUI(); /* hide Share when no share path exists on this device */
  var s = $('hl-sheet');
  s.classList.remove('sheet-gone');
  s.setAttribute('aria-hidden', 'false');
}
/* Batch sheet for multi-select: title shows the count, no remove/share row
   (those are single-verse actions). Dismissing without a color keeps selMode. */
function showHlSheetBatch() {
  hlBatch = true;
  hlVerseIdx = -1;
  var n = selCount();
  $('hl-title').textContent = 'Highlight ' + n + (n === 1 ? ' verse' : ' verses');
  var btns = document.querySelectorAll('#hl-colors .hl-btn');
  Array.prototype.forEach.call(btns, function (bt) { bt.classList.remove('on'); });
  $('hl-remove').style.display = 'none';
  updateShareUI();
  var sh = $('hl-share'); if (sh) sh.style.display = 'none'; /* batch: no single-verse share */
  var s = $('hl-sheet');
  s.classList.remove('sheet-gone');
  s.setAttribute('aria-hidden', 'false');
}
function hideHlSheet() {
  hlVerseIdx = -1;
  var s = $('hl-sheet');
  s.classList.add('sheet-gone');
  s.setAttribute('aria-hidden', 'true');
}
/* Tap-based highlight entry points: the visible highlighter button and the
   verse number both open the highlight sheet with a plain tap. Returns true
   when it handled the click (caller must stop and NOT fall through to
   tapVerse or word speak). */
function hlTapEntry(el, ev) {
  var n = ev.target;
  while (n && n !== el) {
    if (n.classList && (n.classList.contains('vhlbtn') || n.classList.contains('vnum'))) {
      showHlSheet(+el.getAttribute('data-i'));
      return true;
    }
    n = n.parentNode;
  }
  return false;
}
function pickHighlight(color) {
  if (hlBatch && selMode) { pickHighlightBatch(color); return; }
  var i = hlVerseIdx;
  if (i < 0 || !DATA) { hideHlSheet(); return; }
  var b = DATA.books[state.book], ch = b.chapters[state.chapter];
  var v = ch && ch[i];
  if (!v) { hideHlSheet(); return; }
  var key = hlKey(b.name, state.chapter, v[0]);
  var m = loadHl();
  var wasHl = !!m[key];
  m[key] = { c: color, d: todayISO() };
  var ok = saveHl(m) && hlStored(key, color);
  applyHighlights();
  if (ok && !wasHl) {
    /* first highlight of this verse: save it into the chapter's notes, date-stamped */
    var line = '\u2728 ' + stampDate() + ' \u2014 ' + refOf(i) + ' \u2014 ' + displayText(v);
    var nk = noteKey();
    var cur = lsGet(nk, '');
    lsSet(nk, (cur ? cur.replace(/\s+$/, '') + '\n\n' : '') + line + '\n');
    if ($('notes-box')) $('notes-box').value = lsGet(nk, '');
  }
  hideHlSheet();
  /* v28: only celebrate a save that really landed (read-back verified). */
  quickToast(ok ? '\u2713 Highlighted ' + refOf(i) : 'Couldn\u2019t save the highlight \u2014 try again');
}
/* Batch highlight (v36): paint every selected verse with the chosen color,
   each saved in the existing dated {c, d} format and appended to the
   chapter notes on first paint. Exits selection mode afterwards. */
function pickHighlightBatch(color) {
  if (!DATA) { hideHlSheet(); return; }
  var b = DATA.books[state.book], ch = b.chapters[state.chapter];
  var idxs = Object.keys(selSet).map(Number).sort(function (a, c) { return a - c; });
  var m = loadHl(), n = 0, nk = noteKey(), noteAdd = '';
  idxs.forEach(function (i) {
    var v = ch && ch[i];
    if (!v) return;
    var key = hlKey(b.name, state.chapter, v[0]);
    var wasHl = !!normHlVal(m[key]);
    m[key] = { c: color, d: todayISO() };
    n++;
    if (!wasHl) {
      noteAdd += (noteAdd ? '\n\n' : '') + '\u2728 ' + stampDate() + ' \u2014 ' + refOf(i) +
                 ' \u2014 ' + displayText(v) + '\n';
    }
  });
  var ok = saveHl(m);
  if (ok && noteAdd) {
    var cur = lsGet(nk, '');
    lsSet(nk, (cur ? cur.replace(/\s+$/, '') + '\n\n' : '') + noteAdd);
    if ($('notes-box')) $('notes-box').value = lsGet(nk, '');
  }
  applyHighlights();
  exitSelMode();
  hideHlSheet();
  quickToast(ok ? ('\u2713 ' + n + (n === 1 ? ' verse' : ' verses') + ' highlighted.') :
                  'Couldn\u2019t save the highlights \u2014 try again');
}
function removeHighlight() {
  var i = hlVerseIdx;
  if (i >= 0 && DATA) {
    var b = DATA.books[state.book], ch = b.chapters[state.chapter];
    var v = ch && ch[i];
    if (v) {
      var m = loadHl();
      delete m[hlKey(b.name, state.chapter, v[0])];
      saveHl(m);
      applyHighlights();
    }
  }
  hideHlSheet(); /* notes text stays as-is; his notes are never deleted */
}
/* Brief non-blocking confirmation toast for the instant highlight flow.
   Reuses the .hl-tip look; .no-touch keeps it from ever swallowing taps. */
var quickToastTimer = null;
function quickToast(msg) {
  var old = document.getElementById('qtoast');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  if (quickToastTimer) { clearTimeout(quickToastTimer); quickToastTimer = null; }
  var t = document.createElement('div');
  t.id = 'qtoast';
  t.className = 'hl-tip show no-touch';
  t.textContent = msg;
  document.body.appendChild(t);
  quickToastTimer = setTimeout(function () {
    quickToastTimer = null;
    t.classList.remove('show');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
  }, 2200);
}
/* Instant highlight toggle (v27): no sheet. Paints the verse pale quick-yellow,
   persists it date-stamped, appends it to the chapter's notes on first paint,
   and toasts. A verse that already has ANY highlight gets it removed. */
function quickHighlight(i) {
  if (!DATA) return;
  var b = DATA.books[state.book], ch = b.chapters[state.chapter];
  var v = ch && ch[i];
  if (!v) return;
  var key = hlKey(b.name, state.chapter, v[0]);
  var m = loadHl();
  if (normHlVal(m[key])) {
    delete m[key];
    var rok = saveHl(m) && !hlStored(key, 'q') && !normHlVal(loadHl()[key]);
    applyHighlights();
    /* v28: only claim removal when the entry is really gone from storage. */
    quickToast(rok ? 'Highlight removed' : 'Couldn\u2019t update the highlight \u2014 try again');
    return;
  }
  m[key] = { c: 'q', d: todayISO() };
  var ok = saveHl(m) && hlStored(key, 'q');
  applyHighlights();
  if (ok) {
    /* first highlight of this verse: save it into the chapter's notes, date-stamped */
    var line = '\u2728 ' + stampDate() + ' \u2014 ' + refOf(i) + ' \u2014 ' + displayText(v);
    var nk = noteKey();
    var cur = lsGet(nk, '');
    lsSet(nk, (cur ? cur.replace(/\s+$/, '') + '\n\n' : '') + line + '\n');
    if ($('notes-box')) $('notes-box').value = lsGet(nk, '');
    quickToast('\u2713 Highlighted ' + refOf(i));
  } else {
    quickToast('Couldn\u2019t save the highlight \u2014 try again');
  }
}
/* One-time coach tip for verse highlighting: shown at the top of the reader
   on the first chapter render after this update, auto-dismisses after ~4s
   or on tap, and never shows again (persisted 'hltip3' flag; hltip3 supersedes
   the older flags so the updated wording reaches existing installs). */
var hlTipTimer = null;
function showHlTip() {
  if (document.getElementById('hltip')) return;
  var t = document.createElement('div');
  t.id = 'hltip';
  t.className = 'hl-tip show';
  t.textContent = 'Tip: hold any verse to share, copy or highlight it \uD83D\uDCE4';
  var dismiss = function () {
    if (hlTipTimer) { clearTimeout(hlTipTimer); hlTipTimer = null; }
    t.classList.remove('show');
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 350);
  };
  t.addEventListener('click', dismiss);
  document.body.appendChild(t);
  hlTipTimer = setTimeout(dismiss, 4000);
}
function maybeShowHlTip() {
  try {
    if (lsGet('hltip4', null)) return; /* v1.8: new tip wording reaches existing installs once */
    lsSet('hltip4', '1');
  } catch (e) { return; }
  showHlTip();
}

/* ---------------- Notes tab ----------------
   One place for everything Johnny has saved: every highlighted verse across
   the whole Bible (newest first, with color dot, reference, text and date),
   plus his per-chapter notes. Tapping a highlight row jumps to that verse in
   the reader; tapping a note row opens that chapter's notes. Each highlight
   row has its own share button wired to the existing share path. */
var pendingGoto = null; /* {bookName, chapIdx, verseNum} retried after a version switch */
var notesHlRows = [], notesNoteRows = [];

function findBookByName(name) {
  if (!DATA || !name) return -1;
  var q = String(name).toLowerCase();
  for (var i = 0; i < DATA.books.length; i++)
    if (DATA.books[i].name.toLowerCase() === q) return i;
  return -1;
}
function hlDateLabel(iso) {
  if (!iso) return '';
  var p = String(iso).split('-');
  if (p.length < 3) return '';
  return stampDate(new Date(+p[0], +p[1] - 1, +p[2]));
}
function findVerseObj(bi, ci, vnum) {
  var b = DATA.books[bi];
  if (!b) return null;
  var ch = b.chapters[ci];
  if (!ch) return null;
  for (var i = 0; i < ch.length; i++)
    if (ch[i][0] === vnum) return ch[i];
  return null;
}
function hlVerseText(bi, ci, vnum) {
  var v = findVerseObj(bi, ci, vnum);
  if (!v) return '';
  return displayText(v, (state.dv || 'sacred') === 'sacred' ? 'sacred' : state.dv);
}
function hlVerseHtml(bi, ci, vnum) {
  var v = findVerseObj(bi, ci, vnum);
  if (!v) return '';
  return verseSegHtml(v, (state.dv || 'sacred') === 'sacred' ? 'sacred' : state.dv);
}
function shareHlRow(r) {
  shareText("God's Holy Word", '\u201C' + (r.text || '') + '\u201D \u2014 ' + r.ref + '\n\u2014 God\u2019s Holy Word');
}
function gotoVerse(bookName, chapIdx, verseNum) {
  if (!DATA) return;
  var bi = findBookByName(bookName);
  if (bi < 0) {
    /* not in this version's dataset — fall back to the full JSV text, then retry */
    if ((state.dv || 'sacred') !== 'sacred' || state.version !== 'notes') {
      pendingGoto = { bookName: bookName, chapIdx: chapIdx, verseNum: verseNum };
      setVersion('sacred');
    }
    return;
  }
  var b = DATA.books[bi];
  if (!b.chapters[chapIdx]) return;
  var dv = state.dv || 'sacred';
  state.book = bi; state.chapter = chapIdx;
  if (state.version !== dv && VERSIONS[dv]) setVersion(dv);
  else { renderChapter(); savePos(); }
  var vi = -1, ch = b.chapters[chapIdx];
  for (var i = 0; i < ch.length; i++) if (ch[i][0] === verseNum) { vi = i; break; }
  if (vi >= 0) {
    var el = document.querySelector('#verses .verse[data-i="' + vi + '"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center' });
  }
}
function gotoChapterNotes(bi, ci) {
  if (!DATA || !DATA.books[bi] || !DATA.books[bi].chapters[ci]) return;
  var dv = state.dv || 'sacred';
  state.book = bi; state.chapter = ci;
  if (state.version !== dv && VERSIONS[dv]) setVersion(dv);
  else { renderChapter(); savePos(); }
  openStudy();
}
function renderNotesTab() {
  var hlList = $('notes-hl-list'), noteList = $('notes-note-list');
  if (!hlList || !noteList || !DATA) return;
  /* --- highlighted verses, newest first --- */
  var m = loadHl();
  notesHlRows = [];
  Object.keys(m).forEach(function (k) {
    var e = normHlVal(m[k]);
    if (!e || HL_COLORS.indexOf(e.c) < 0) return;
    var parts = String(k).split('|');
    var ci = parseInt(parts[1], 10), vn = parseInt(parts[2], 10);
    if (isNaN(ci) || isNaN(vn)) return;
    var bi = findBookByName(parts[0]);
    notesHlRows.push({
      bookName: parts[0], bi: bi, ci: ci, vn: vn, c: e.c, d: e.d,
      ref: parts[0] + ' ' + (ci + 1) + ':' + parts[2],
      text: bi >= 0 ? hlVerseText(bi, ci, vn) : '',
      vhtml: bi >= 0 ? hlVerseHtml(bi, ci, vn) : ''
    });
  });
  notesHlRows.sort(function (a, b) {
    if (a.d && b.d) return a.d < b.d ? 1 : (a.d > b.d ? -1 : 0);
    if (a.d) return -1;
    if (b.d) return 1;
    return 0;
  });
  var html = '';
  notesHlRows.forEach(function (r, i) {
    html += '<div class="note-row" data-hl="' + i + '">' +
      '<span class="hl-swatch hl-sw-' + r.c + ' note-dot"></span>' +
      '<div class="note-main"><div class="note-ref">' + esc(r.ref) +
      (r.d ? '<span class="note-date">' + esc(hlDateLabel(r.d)) + '</span>' : '') + '</div>' +
      (r.vhtml ? '<div class="note-text">' + r.vhtml + '</div>' : '') + '</div>' +
      '<button class="note-share" data-hls="' + i + '" aria-label="Share verse">&#128228;</button></div>';
  });
  hlList.innerHTML = html ||
    '<div class="note-empty">No highlighted verses yet \u2014 hold a verse number to highlight it.</div>';
  Array.prototype.forEach.call(hlList.querySelectorAll('.note-row'), function (row) {
    row.addEventListener('click', function (ev) {
      var s = ev.target;
      if (s && s.classList && s.classList.contains('note-share')) {
        var r = notesHlRows[+s.getAttribute('data-hls')];
        if (r) shareHlRow(r);
        return;
      }
      var r2 = notesHlRows[+row.getAttribute('data-hl')];
      if (r2) gotoVerse(r2.bookName, r2.ci, r2.vn);
    });
  });
  /* --- per-chapter notes --- */
  notesNoteRows = [];
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (!k || k.indexOf('qodesh:note:') !== 0) continue;
      var rest = k.slice('qodesh:note:'.length).split(':');
      var bi2 = parseInt(rest[0], 10), ci2 = parseInt(rest[1], 10);
      if (isNaN(bi2) || isNaN(ci2)) continue;
      var txt = localStorage.getItem(k);
      if (!txt || !txt.replace(/\s/g, '')) continue;
      var bn = (DATA.books[bi2] ? DATA.books[bi2].name : 'Book ' + (bi2 + 1));
      notesNoteRows.push({
        bi: bi2, ci: ci2,
        ref: bn + ' ' + (ci2 + 1),
        preview: txt.replace(/\s+/g, ' ').slice(0, 110)
      });
    }
  } catch (e) {}
  notesNoteRows.sort(function (a, b) { return a.bi - b.bi || a.ci - b.ci; });
  var nh = '';
  notesNoteRows.forEach(function (r, i) {
    nh += '<div class="note-row" data-note="' + i + '">' +
      '<span class="note-dot note-dot-n">&#128221;</span>' +
      '<div class="note-main"><div class="note-ref">' + esc(r.ref) + '</div>' +
      '<div class="note-text">' + esc(r.preview) + '</div></div></div>';
  });
  noteList.innerHTML = nh ||
    '<div class="note-empty">No chapter notes yet \u2014 open Study &amp; notes on any chapter to write some.</div>';
  Array.prototype.forEach.call(noteList.querySelectorAll('.note-row'), function (row) {
    row.addEventListener('click', function () {
      var r = notesNoteRows[+row.getAttribute('data-note')];
      if (r) gotoChapterNotes(r.bi, r.ci);
    });
  });
  var nv = $('notes-view');
  if (nv) nv.classList.toggle('no-share', !shareAvailable());
}
/* Long-press detection for verse highlighting, delegated on #verses.
   Word presses are excluded (the word gesture owns them). The emulated
   mousedown some mobile browsers fire after a touch is ignored via the
   lastTouch guard so it can't re-open the sheet or swallow a later tap. */
var hlLpTimer = null, hlLastTouch = 0;
/* Drag-to-highlight (YouVersion-style): press and drag horizontally across a
   verse to open the highlight sheet. Custom touch tracking — NOT text
   selection (words have user-select:none). Thresholds: horizontal > 40px with
   vertical < 30px = highlight drag; vertical-first = normal scroll. */
var hlDrag = null; /* {el, x0, y0, active} while a press is in flight */
var hlStartPos = null; /* touchstart point for the stationary long-press timer */
function setupVerseHighlight() {
  var sc = $('verses');
  if (!sc || sc._hlArmed) return;
  sc._hlArmed = true;
  var verseElAt = function (ev) {
    var t = ev.target;
    if (!t || !t.classList) return null;
    if (t.classList.contains('w')) return null; /* word path owns this press */
    var el = t;
    while (el && el !== sc) {
      if (el.classList && el.classList.contains('verse')) return el;
      el = el.parentNode;
    }
    return null;
  };
  /* a drag may START on a word span (dragging across words is the whole
     point) — only the stationary long-press excludes words */
  var dragVerseElAt = function (ev) {
    var t = ev.target;
    if (!t || !t.classList) return null;
    var el = t;
    while (el && el !== sc) {
      if (el.classList && el.classList.contains('verse')) return el;
      el = el.parentNode;
    }
    return null;
  };
  var posOf = function (ev) {
    var p = (ev.touches && ev.touches[0]) || (ev.changedTouches && ev.changedTouches[0]) || ev;
    return { x: p.clientX || 0, y: p.clientY || 0 };
  };
  var cancel = function () {
    if (hlLpTimer) { clearTimeout(hlLpTimer); hlLpTimer = null; }
    hlStartPos = null;
  };
  /* Touch jitter must not kill the long-press: only cancel the timer when
     the finger actually wanders more than ~12px from the press point. */
  var hlJitterCheck = function (ev) {
    if (!hlLpTimer || !hlStartPos) return;
    var p = posOf(ev);
    if (Math.abs(p.x - hlStartPos.x) > 12 || Math.abs(p.y - hlStartPos.y) > 12) {
      clearTimeout(hlLpTimer); hlLpTimer = null; hlStartPos = null;
    }
  };
  var endDrag = function () {
    if (!hlDrag) return;
    var d = hlDrag; hlDrag = null;
    d.el.classList.remove('hl-dragging');
    if (d.active) {
      d.el._lpFired = true; /* suppress the tapVerse click that follows */
      quickHighlight(+d.el.getAttribute('data-i')); /* v27: instant, no sheet */
    }
  };
  /* v27: the instant highlight hold arms ONLY on the verse number. A press
     anywhere else on the verse keeps the old sheet-open long-press. */
  var pressOnVnum = function (ev) {
    var t = ev.target;
    while (t && t !== sc) {
      if (t.classList && t.classList.contains('vnum')) return true;
      t = t.parentNode;
    }
    return false;
  };
  var start = function (ev) {
    var el = verseElAt(ev);
    if (el) {
      cancel();
      var target = el;
      var onVnum = pressOnVnum(ev);
      hlStartPos = posOf(ev);
      hlLpTimer = setTimeout(function () {
        hlLpTimer = null; hlStartPos = null;
        target._lpFired = true; target._lpAt = Date.now(); /* suppress the tapVerse click that follows */
        /* the hold already decided: a later drag must not toggle it back */
        if (hlDrag && hlDrag.el === target) {
          hlDrag.el.classList.remove('hl-dragging'); hlDrag = null;
        }
        var vi = +target.getAttribute('data-i');
        if (onVnum) {
          /* v36: long-press a verse number enters multi-select, or (when
             already selecting) adds that verse and opens the batch sheet. */
          if (selMode) {
            selSet[vi] = true;
            paintSelection();
            showHlSheetBatch();
          } else enterSelMode(vi);
        } else if (selMode) {
          toggleSelect(vi); /* long-press body while selecting = toggle */
        } else enterSelMode(vi); /* v1.8: hold a verse = select it + action bar */
      }, 500);
    }
    var dEl = dragVerseElAt(ev);
    if (dEl) {
      var p = posOf(ev);
      hlDrag = { el: dEl, x0: p.x, y0: p.y, active: false };
    }
  };
  var onMove = function (ev) {
    if (!hlDrag) return;
    if (hlDrag.active) {
      if (ev.cancelable) ev.preventDefault(); /* gesture owns the touch: no scroll */
      return;
    }
    var p = posOf(ev);
    var dx = Math.abs(p.x - hlDrag.x0), dy = Math.abs(p.y - hlDrag.y0);
    if (dx > 50 && dx > dy * 1.5) {
      /* direction-dominant horizontal drag: a real finger drifts diagonally,
         so judge by direction, not an absolute vertical cap */
      hlDrag.active = true;
      hlDrag.el.classList.add('hl-dragging');
      cancel(); /* stationary long-press timer dies; the word timer already died on move */
      if (ev.cancelable) ev.preventDefault(); /* no page scroll for this gesture */
    } else if (dy > 120 || (dy > 60 && dy > dx)) {
      hlDrag = null; /* clearly scrolling: abandon the gesture */
    }
    /* small or diagonal drift so far: keep tracking, decide later */
  };
  var onTouchCancel = function () {
    cancel();
    if (hlDrag) { hlDrag.el.classList.remove('hl-dragging'); hlDrag = null; }
  };
  sc.addEventListener('touchstart', start, { passive: true });
  sc.addEventListener('touchend', function () { hlLastTouch = Date.now(); cancel(); endDrag(); });
  sc.addEventListener('touchmove', hlJitterCheck, { passive: true });
  sc.addEventListener('touchmove', onMove, { passive: false });
  sc.addEventListener('touchcancel', onTouchCancel);
  /* desktop fallback: long mouse press without moving, or horizontal mouse drag */
  sc.addEventListener('mousedown', function (ev) {
    if (ev.button !== 0) return;
    if (Date.now() - hlLastTouch < 800) return; /* emulated mouse after touch */
    start(ev);
  });
  sc.addEventListener('mouseup', function () { cancel(); endDrag(); });
  sc.addEventListener('mousemove', function (ev) { hlJitterCheck(ev); onMove(ev); });
}

/* ---------------- sharing ----------------
   Native app: Android ACTION_SEND chooser through the native layer.
   Web build: navigator.share when available; otherwise the share buttons
   are hidden. The web build replaces nativeShare()/nativeShareAvailable()
   with stubs, so ALL native-layer references must live inside those two. */
function nativeShare(title, text) {
  /* v1.8: GHWShare (ACTION_SEND + chooser) first, then the older bridge */
  try { if (window.GHWShare && window.GHWShare.shareText) { window.GHWShare.shareText(text); return true; } } catch (e) {}
  try { if (bridge && bridge.shareText) { bridge.shareText(title, text); return true; } } catch (e) {}
  return false;
}
function nativeShareAvailable() {
  try { if (window.GHWShare && window.GHWShare.shareText) return true; } catch (e) {}
  try { return !!(bridge && bridge.shareText); } catch (e) { return false; }
}
function shareAvailable() {
  if (nativeShareAvailable()) return true;
  try { return typeof navigator !== 'undefined' && !!navigator.share; } catch (e) { return false; }
}
function shareText(title, text) {
  if (nativeShare(title, text)) return true;
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: title, text: text });
      return true;
    }
  } catch (e) {}
  /* last resort: copy so the user can paste it into any app */
  var ok = copyToClipboard(text);
  quickToast(ok ? 'Sharing isn\u2019t available \u2014 copied, paste it anywhere' : 'Sharing isn\u2019t available on this device');
  return ok;
}
function updateShareUI() {
  var ok = shareAvailable();
  ['hl-share', 'notes-share'].forEach(function (id) {
    var b = $(id);
    if (b) b.style.display = ok ? '' : 'none';
  });
}
function shareHighlightVerse() {
  var i = hlVerseIdx;
  if (i < 0 || !DATA) return;
  var b = DATA.books[state.book], ch = b.chapters[state.chapter];
  var v = ch && ch[i];
  if (!v) return;
  hideHlSheet();
  shareText("God's Holy Word", shareTextFor([i]));
}
function shareChapterNotes() {
  if (!DATA) return;
  var txt = lsGet(noteKey(), '').replace(/\s+$/, '');
  if (!txt) return;
  var b = DATA.books[state.book];
  shareText("God's Holy Word notes",
    '\uD83D\uDCDD Notes \u2014 ' + b.name + ' ' + (state.chapter + 1) + '\n\n' + txt + '\n\u2014 God\u2019s Holy Word');
}

/* ---------------- v1.8: verse selection action bar + shareable verses ----------------
   Hold a verse (~500ms; anywhere on it, words included) to select it and open
   the action bar: Share (text), Image (verse card), Copy, Highlight, Note,
   Define (when the hold started on a word) and Close. While selecting, taps
   on other verses add/remove them; outside selection a tap still plays audio.
   Native path: window.GHWShare (Android ACTION_SEND chooser, FileProvider
   image share, MediaStore save, clipboard). Fallbacks: the older AndroidTTS
   text share, navigator.share, then the clipboard. */
var shareBridge = (typeof window.GHWShare !== 'undefined') ? window.GHWShare : null;
var selWord = null; /* word the selecting hold started on (for Define) */
var SUP = ['\u2070', '\u00B9', '\u00B2', '\u00B3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];
function supNum(n) { return String(n).split('').map(function (d) { return SUP[+d] || d; }).join(''); }
function selIdxs() {
  if (!DATA) return [];
  var ch = DATA.books[state.book] && DATA.books[state.book].chapters[state.chapter];
  if (!ch) return [];
  return Object.keys(selSet).map(Number).filter(function (i) { return !!ch[i]; })
    .sort(function (a, c) { return a - c; });
}
/* verse numbers -> "16", "16\u201318", "16\u201318, 20" (runs by consecutive index) */
function verseRangeLabel(idxs) {
  var ch = DATA.books[state.book].chapters[state.chapter], out = [], i = 0;
  while (i < idxs.length) {
    var j = i;
    while (j + 1 < idxs.length && idxs[j + 1] === idxs[j] + 1) j++;
    out.push(j > i ? ch[idxs[i]][0] + '\u2013' + ch[idxs[j]][0] : String(ch[idxs[i]][0]));
    i = j + 1;
  }
  return out.join(', ');
}
function selRefOf(idxs) {
  var b = DATA.books[state.book];
  return b.name + ' ' + (state.chapter + 1) + ':' + verseRangeLabel(idxs);
}
function transAbbr() {
  var k = state.version === 'compare' ? 'sacred' : (state.dv || state.version);
  if (k === 'sacred') return 'JSV';
  if (k === 'ethiopic') return 'ETH';
  if (k === 'yy') return 'Y&Y';
  if (k === 'nt') return 'N&T';
  return (VERSIONS[k] && VERSIONS[k].logo) || String(k || '').toUpperCase();
}
/* body text: one verse = plain text; several = superscript verse numbers,
   with an ellipsis where the selection skips verses */
function selBodyOf(idxs) {
  var ch = DATA.books[state.book].chapters[state.chapter];
  if (idxs.length === 1) return displayText(ch[idxs[0]]);
  var s = '';
  idxs.forEach(function (i, k) {
    if (k > 0) s += (idxs[k - 1] === i - 1) ? ' ' : ' \u2026 ';
    s += supNum(ch[i][0]) + '\u2009' + displayText(ch[i]);
  });
  return s;
}
function shareTextFor(idxs) {
  return '\u201C' + selBodyOf(idxs) + '\u201D \u2014 ' + selRefOf(idxs) + ' (' + transAbbr() + ')\n' +
         '\u2014 God\u2019s Holy Word';
}
function copyToClipboard(text) {
  try { if (shareBridge && shareBridge.copyText) { shareBridge.copyText(text); return true; } } catch (e) {}
  var ok = false;
  try {
    var ta = document.createElement('textarea');
    ta.value = text; ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    ok = document.execCommand('copy');
    document.body.removeChild(ta);
  } catch (e) { ok = false; }
  if (!ok) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text); ok = true; } } catch (e) {}
  }
  return ok;
}
function updateSelBar() {
  var bar = $('sel-bar');
  if (!bar) return;
  var idxs = selMode ? selIdxs() : [];
  if (!selMode || !idxs.length) {
    bar.classList.add('sel-gone'); bar.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('selecting');
    return;
  }
  $('sel-ref').textContent = selRefOf(idxs) + ' (' + transAbbr() + ')';
  $('sel-count').textContent = idxs.length === 1 ? '1 verse \u2022 tap others to add'
                                                 : idxs.length + ' verses selected';
  var d = $('sel-define');
  if (d) d.style.display = (selWord && idxs.length === 1) ? '' : 'none';
  bar.classList.remove('sel-gone'); bar.setAttribute('aria-hidden', 'false');
  document.body.classList.add('selecting');
}
function selShare() {
  var idxs = selIdxs(); if (!idxs.length) return;
  shareText('God\u2019s Holy Word', shareTextFor(idxs));
  exitSelMode();
}
function selCopy() {
  var idxs = selIdxs(); if (!idxs.length) return;
  var ok = copyToClipboard(shareTextFor(idxs));
  quickToast(ok ? '\u2713 Copied ' + selRefOf(idxs) : 'Couldn\u2019t copy \u2014 try Share instead');
  exitSelMode();
}
function selHighlight() {
  var idxs = selIdxs(); if (!idxs.length) return;
  if (idxs.length === 1) { var i = idxs[0]; exitSelMode(); showHlSheet(i); }
  else showHlSheetBatch(); /* picking a color highlights all and exits selection */
}
function selNote() {
  var idxs = selIdxs(); if (!idxs.length) return;
  var line = '\uD83D\uDCDD ' + stampDate() + ' \u2014 ' + selRefOf(idxs) + ' (' + transAbbr() + ') \u2014 ' +
             selBodyOf(idxs);
  var nk = noteKey(), cur = lsGet(nk, '');
  var ok = lsSet(nk, (cur ? cur.replace(/\s+$/, '') + '\n\n' : '') + line + '\n');
  if ($('notes-box')) $('notes-box').value = lsGet(nk, '');
  quickToast(ok ? '\u2713 Added to this chapter\u2019s notes' : 'Couldn\u2019t save the note \u2014 try again');
  exitSelMode();
}
function selDefine() {
  var idxs = selIdxs(); var w = selWord;
  if (!w) return;
  var vi = idxs.length ? idxs[0] : -1;
  exitSelMode();
  ensureDict(function () { ensureBibleLexicon(function () { showDefPopup(w, vi); }); });
}

/* ---- verse image card (1080x1350, 4:5 portrait for social feeds) ---- */
var CARD_STYLES = {
  midnight: { name: 'Midnight', stops: ['#070b1f', '#18204d', '#2a1652'], glow: 'rgba(255,214,120,0.20)', accent: '#E6C35C' },
  royal:    { name: 'Royal',    stops: ['#14061f', '#3a1364', '#0d0518'], glow: 'rgba(255,200,110,0.22)', accent: '#E9C46A' },
  ember:    { name: 'Ember',    stops: ['#120804', '#46200d', '#0b0503'], glow: 'rgba(255,150,60,0.22)',  accent: '#F0B45A' },
  forest:   { name: 'Forest',   stops: ['#03110c', '#0f3a2b', '#020c08'], glow: 'rgba(190,255,215,0.13)', accent: '#D8C27A' },
  slate:    { name: 'Slate',    stops: ['#0b0b0e', '#24262d', '#08080a'], glow: 'rgba(255,255,255,0.08)', accent: '#D4AF37' }
};
var cardState = { idxs: [], style: 'midnight', url: '' };
function spacedText(ctx, text, cx, y, spacing) {
  var chars = text.split(''), w = 0;
  chars.forEach(function (c) { w += ctx.measureText(c).width + spacing; });
  w -= spacing;
  var x = cx - w / 2;
  ctx.textAlign = 'left';
  chars.forEach(function (c) { ctx.fillText(c, x, y); x += ctx.measureText(c).width + spacing; });
  ctx.textAlign = 'center';
}
function wrapLines(ctx, text, maxW) {
  var words = text.split(/\s+/), lines = [], line = '';
  words.forEach(function (w) {
    if (!w) return;
    var t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW || !line) line = t;
    else { lines.push(line); line = w; }
  });
  if (line) lines.push(line);
  return lines;
}
function renderVerseCard(idxs, styleKey) {
  var W = 1080, H = 1350, st = CARD_STYLES[styleKey] || CARD_STYLES.midnight;
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var ctx = cv.getContext('2d');
  var g = ctx.createLinearGradient(0, 0, W * 0.35, H);
  g.addColorStop(0, st.stops[0]); g.addColorStop(0.55, st.stops[1]); g.addColorStop(1, st.stops[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  var rg = ctx.createRadialGradient(W / 2, H * 0.12, 20, W / 2, H * 0.12, W * 0.85);
  rg.addColorStop(0, st.glow); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.8);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  /* thin inset frame */
  ctx.strokeStyle = 'rgba(230,195,92,0.28)'; ctx.lineWidth = 2;
  ctx.strokeRect(46, 46, W - 92, H - 92);
  var serif = "Georgia, 'Noto Serif', 'Times New Roman', serif";
  var sans = "system-ui, 'Roboto', sans-serif";
  var body = selBodyOf(idxs), ref = selRefOf(idxs), abbr = transAbbr();
  /* auto-size: biggest font whose wrapped text fits the text box */
  var boxW = 840, boxH = 800, size = 78, lines, lh;
  for (; size >= 26; size -= 2) {
    ctx.font = size + 'px ' + serif;
    lines = wrapLines(ctx, '\u201C' + body + '\u201D', boxW);
    lh = Math.round(size * 1.4);
    if (lines.length * lh <= boxH) break;
  }
  if (size < 26) { /* extremely long selection: clip with an ellipsis */
    size = 26; ctx.font = size + 'px ' + serif; lh = Math.round(size * 1.4);
    var maxL = Math.floor(boxH / lh);
    lines = lines.slice(0, maxL);
    lines[maxL - 1] = lines[maxL - 1].replace(/\s*\S*$/, '') + ' \u2026\u201D';
  }
  var refSize = Math.max(34, Math.min(50, Math.round(size * 0.68)));
  var textH = lines.length * lh, gap = 70, refBlock = refSize * 1.2 + 16 + 30;
  var top = 150 + Math.max(0, (1060 - (textH + gap + refBlock)) / 2);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#F7F2E6';
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12;
  ctx.font = size + 'px ' + serif;
  lines.forEach(function (ln, k) { ctx.fillText(ln, W / 2, top + size + k * lh); });
  ctx.shadowBlur = 0;
  var y = top + textH + gap;
  ctx.strokeStyle = st.accent; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W / 2 - 60, y - refSize * 0.9); ctx.lineTo(W / 2 + 60, y - refSize * 0.9); ctx.stroke();
  ctx.fillStyle = st.accent; ctx.font = '600 ' + refSize + 'px ' + serif;
  ctx.fillText(ref, W / 2, y + refSize * 0.45);
  ctx.font = '600 28px ' + sans; ctx.fillStyle = 'rgba(247,242,230,0.75)';
  spacedText(ctx, abbr, W / 2, y + refSize * 0.45 + 50, 6);
  /* footer */
  ctx.font = '600 26px ' + sans; ctx.fillStyle = 'rgba(247,242,230,0.62)';
  spacedText(ctx, 'GOD\u2019S HOLY WORD', W / 2, H - 92, 7);
  return cv.toDataURL('image/png');
}
function cardFileName() {
  var idxs = cardState.idxs;
  var base = 'GodsHolyWord-' + selRefOf(idxs).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return base + '-' + Date.now() + '.png';
}
function paintCardPreview() {
  cardState.url = renderVerseCard(cardState.idxs, cardState.style);
  $('card-img').src = cardState.url;
  Array.prototype.forEach.call(document.querySelectorAll('#card-styles .card-style'), function (b) {
    b.classList.toggle('on', b.getAttribute('data-s') === cardState.style);
  });
}
function openCardSheet() {
  var idxs = selIdxs(); if (!idxs.length) return;
  cardState.idxs = idxs;
  cardState.style = lsGet('cardstyle', 'midnight');
  if (!CARD_STYLES[cardState.style]) cardState.style = 'midnight';
  $('card-title').textContent = selRefOf(idxs) + ' (' + transAbbr() + ')';
  var s = $('card-sheet');
  s.classList.remove('sheet-gone'); s.setAttribute('aria-hidden', 'false');
  setTimeout(paintCardPreview, 30); /* let the sheet paint first */
}
function hideCardSheet() {
  var s = $('card-sheet');
  s.classList.add('sheet-gone'); s.setAttribute('aria-hidden', 'true');
}
function pickCardStyle(k) {
  if (!CARD_STYLES[k]) return;
  cardState.style = k; lsSet('cardstyle', k);
  paintCardPreview();
}
function dataUrlToBlob(url) {
  var b = atob(url.split(',')[1]), a = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return new Blob([a], { type: 'image/png' });
}
function cardShare() {
  if (!cardState.url) paintCardPreview();
  var name = cardFileName();
  try {
    if (shareBridge && shareBridge.shareImage) {
      var r = String(shareBridge.shareImage(cardState.url.split(',')[1], name));
      if (r === 'ok') { hideCardSheet(); exitSelMode(); return; }
      quickToast('Couldn\u2019t share the image (' + r + ')'); return;
    }
  } catch (e) {}
  try {
    var f = new File([dataUrlToBlob(cardState.url)], name, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f], title: 'God\u2019s Holy Word' });
      hideCardSheet(); exitSelMode(); return;
    }
  } catch (e) {}
  quickToast('Image sharing isn\u2019t available here \u2014 use Save image');
}
function cardSave() {
  if (!cardState.url) paintCardPreview();
  var name = cardFileName();
  try {
    if (shareBridge && shareBridge.saveImage) {
      var r = String(shareBridge.saveImage(cardState.url.split(',')[1], name));
      if (r === 'ok') quickToast('\u2713 Saved to Pictures/God\u2019s Holy Word');
      else if (r === 'permission') quickToast('Allow storage access, then tap Save image again');
      else quickToast('Couldn\u2019t save the image (' + r + ')');
      return;
    }
  } catch (e) {}
  try { /* web build: browser download */
    var a = document.createElement('a');
    a.href = cardState.url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    quickToast('\u2713 Image downloaded');
  } catch (e) { quickToast('Couldn\u2019t save the image'); }
}

/* ---------------- adjustable text size (whole UI) ----------------
   The stored value is a percentage that scales the root font-size; every
   size in style.css is in rem, so header, tabs, buttons and verses all grow
   together. (The old px-only verse sizing relied on the Android WebView's
   textZoom for the rest of the UI, which iOS Safari doesn't have.) */
var UI_MIN = 80, UI_MAX = 200, UI_STEP = 10;
function uiDefault() {
  var ios = /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios ? 120 : 100;
}
function vsizeGet() {
  var n = parseInt(lsGet('uiscale', ''), 10);
  if (isNaN(n)) {
    var old = parseInt(lsGet('vsize', ''), 10); /* migrate old px verse size */
    n = isNaN(old) ? uiDefault() : Math.round(old / 17 * 100 / UI_STEP) * UI_STEP;
  }
  return Math.max(UI_MIN, Math.min(UI_MAX, n));
}
function vsizeApply(n) {
  document.documentElement.style.setProperty('--ui-scale', String(n / 100));
  document.documentElement.style.fontSize = (16 * n / 100) + 'px';
  Array.prototype.forEach.call(document.querySelectorAll('.vtext, .cmp-text'), function (el) {
    el.style.fontSize = ''; /* clear stale inline px from older builds */
  });
}
function vsizeBump(d) {
  var n = Math.max(UI_MIN, Math.min(UI_MAX, vsizeGet() + d * UI_STEP));
  lsSet('uiscale', String(n));
  vsizeApply(n);
}

/* ---------------- settings sheet ----------------
   Single gear (topbar) opens a bottom sheet with text size, theme,
   read-to-me speed, tap-a-word toggle, display brightness (native app
   only — the row hides itself in the web build where bridge is null),
   and a shortcut to Study & notes. */
function openSettings() {
  syncSettingsUI();
  refreshVoiceList(); /* TTS engine may not have been ready at startup; re-query on open */
  var s = $('set-sheet');
  s.classList.remove('sheet-gone');
  s.setAttribute('aria-hidden', 'false');
}
function closeSettings() {
  var s = $('set-sheet');
  s.classList.add('sheet-gone');
  s.setAttribute('aria-hidden', 'true');
}
function setTheme(mode) {
  var dark = mode === 'dark';
  document.body.classList.toggle('dark', dark);
  lsSet('theme', dark ? 'dark' : 'light');
  syncSettingsUI();
}
function setRate(r) {
  r = parseFloat(r) || 1;
  state.rate = r;
  lsSet('rate', String(r));
  try { if (bridge) bridge.setRate(r); } catch (e) {}
  var sel = $('rate');
  if (sel) sel.value = String(r);
  syncRateMenu();
  syncSettingsUI();
}
/* speed popover (replaces the native <select>, which iOS rendered as a plain white box) */
function syncRateMenu() {
  var btn = $('rate-btn');
  if (btn) btn.textContent = state.rate + '\u00d7';
  Array.prototype.forEach.call(document.querySelectorAll('#rate-menu button'), function (b) {
    b.classList.toggle('on', parseFloat(b.getAttribute('data-rate')) === state.rate);
  });
}
function initRateMenu() {
  var btn = $('rate-btn'), menu = $('rate-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', function (e) {
    e.stopPropagation(); syncRateMenu(); menu.classList.toggle('hidden');
    btn.setAttribute('aria-expanded', menu.classList.contains('hidden') ? 'false' : 'true');
  });
  menu.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-rate]'); if (!b) return;
    setRate(b.getAttribute('data-rate')); menu.classList.add('hidden');
    btn.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('click', function (e) {
    if (!menu.contains(e.target) && e.target !== btn) menu.classList.add('hidden');
  });
  syncRateMenu();
}
function getBrightness() {
  var b = parseInt(lsGet('brightness', '100'), 10);
  if (isNaN(b)) b = 100;
  return Math.max(10, Math.min(100, b));
}
function applyBrightness(v) {
  v = Math.max(10, Math.min(100, v));
  lsSet('brightness', String(v));
  try { if (bridge && bridge.setBrightness) bridge.setBrightness(v / 100); } catch (e) {}
  syncSettingsUI();
}
function getAwake() { return lsGet('keepawake', '1') !== '0'; }
function applyAwake(on) {
  lsSet('keepawake', on ? '1' : '0');
  try { if (bridge && bridge.setKeepAwake) bridge.setKeepAwake(on); } catch (e) {}
  syncSettingsUI();
}
function syncSettingsUI() {
  var n = vsizeGet();
  var sample = $('set-font-sample');
  if (sample) sample.style.fontSize = (1.0625 * 1) + 'rem';
  var fv = $('set-font-val');
  if (fv) fv.textContent = n + '%';
  var dark = document.body.classList.contains('dark');
  var tl = $('set-theme-light'), td = $('set-theme-dark');
  if (tl) tl.classList.toggle('on', !dark);
  if (td) td.classList.toggle('on', dark);
  var chips = document.querySelectorAll('#set-speed-row .set-chip');
  Array.prototype.forEach.call(chips, function (c) {
    c.classList.toggle('on', parseFloat(c.getAttribute('data-rate')) === state.rate);
  });
  var w = $('set-words');
  if (w) { w.textContent = state.pronounce ? 'On' : 'Off'; w.classList.toggle('on', state.pronounce); }
  var bv = $('set-bright-val');
  if (bv) bv.textContent = getBrightness() + '%';
  var bs = $('set-bright');
  if (bs && document.activeElement !== bs) bs.value = String(getBrightness());
  var ka = $('set-awake');
  if (ka) { var on = getAwake(); ka.textContent = on ? 'On' : 'Off'; ka.classList.toggle('on', on); }
}
/* ---------------- reading voice (native app only) ----------------
   Populated from the Android TTS engine via bridge.getVoices().
   The web build replaces these two functions with no-op stubs and the
   voice section stays hidden. */
function refreshVoiceList() {
  var sec = $('set-voice-sec');
  var list = [];
  try {
    if (bridge && bridge.getVoices) list = JSON.parse(bridge.getVoices() || '[]');
  } catch (e) { list = []; }
  var sel = $('set-voice');
  sel.innerHTML = '';
  if (!list.length) { sec.style.display = 'none'; return; }
  sec.style.display = '';
  list.forEach(function (v) {
    var o = document.createElement('option');
    o.value = v.name;
    o.textContent = v.label || v.name;
    sel.appendChild(o);
  });
  var saved = lsGet('ttsvoice', ''), picked = '', i;
  for (i = 0; i < list.length; i++) if (list[i].name === saved) { picked = saved; break; }
  if (!picked) for (i = 0; i < list.length; i++) {
    if (/^en/i.test(list[i].locale || '')) { picked = list[i].name; break; }
  }
  if (!picked) picked = list[0].name;
  sel.value = picked;
  /* register the choice with the native engine (native pendingVoice covers pre-init timing) */
  try { if (bridge && bridge.setVoice) bridge.setVoice(picked); } catch (e) {}
  if (!saved) lsSet('ttsvoice', picked);
}
function onVoiceChange() {
  var nm = $('set-voice').value;
  lsSet('ttsvoice', nm);
  try { bridge.setVoice(nm); } catch (e) {}
}
function initSettings() {
  $('btn-settings').addEventListener('click', openSettings);
  $('set-close').addEventListener('click', closeSettings);
  $('set-sheet').addEventListener('click', function (ev) { if (ev.target === this) closeSettings(); });
  $('set-font-inc').addEventListener('click', function () { vsizeBump(1); syncSettingsUI(); });
  $('set-font-dec').addEventListener('click', function () { vsizeBump(-1); syncSettingsUI(); });
  $('set-theme-light').addEventListener('click', function () { setTheme('light'); });
  $('set-theme-dark').addEventListener('click', function () { setTheme('dark'); });
  var chips = document.querySelectorAll('#set-speed-row .set-chip');
  Array.prototype.forEach.call(chips, function (c) {
    c.addEventListener('click', function () { setRate(c.getAttribute('data-rate')); });
  });
  $('set-words').addEventListener('click', function () { toggleWords(); syncSettingsUI(); });
  $('set-voice').addEventListener('change', onVoiceChange);
  refreshVoiceList();
  /* brightness needs the native bridge; on the web build (bridge === null)
     the row is hidden instead of shown broken */
  if (bridge && bridge.setBrightness) {
    $('set-bright').addEventListener('input', function () { applyBrightness(parseInt(this.value, 10)); });
    applyBrightness(getBrightness());
  } else {
    $('set-bright-sec').style.display = 'none';
  }
  if (bridge && bridge.setKeepAwake) {
    $('set-awake').addEventListener('click', function () { applyAwake(!getAwake()); });
    applyAwake(getAwake());
  } else {
    $('set-awake-sec').style.display = 'none';
  }
  $('set-study').addEventListener('click', function () { closeSettings(); openStudy(); });
  $('set-history').addEventListener('click', function () { closeSettings(); openHistory(); });
}

/* ---------------- chapter rendering ---------------- */
function plainText(v) { return v[1].map(function (s) { return s[0]; }).join(' '); }

/* ---------------- divine-speech rendering ----------------
   God's words  = gold highlight + bold + ALL CAPS ("look at me, this is important").
   Jesus's words = bold red.
   The uppercase is baked into the text content itself (not CSS) so it survives
   copy/share; word spans, tap-to-speak and dictionary lookup keep working on the
   cased text (lookup lowercases). Search reads the raw JSON, never this output.
   vo: undefined = swapNames with current version; 'raw' = no name swap (compare
   columns keep their prior behavior); any other string = swapNames(s[0], vo). */
function segHtml(s, vo) {
  var t = (vo === 'raw') ? s[0] : swapNames(s[0], vo);
  if (s[2]) t = t.toUpperCase();
  var inner = state.pronounce ? wordSpans(t) : esc(t);
  if (s[1]) return '<span class="seg-red">' + inner + '</span>';
  if (s[2]) return '<span class="seg-hl">' + inner + '</span>';
  return inner;
}
function verseSegHtml(v, vo) {
  return v[1].map(function (s) { return segHtml(s, vo); }).join(' ');
}
/* Plain verse text with divine uppercase baked in (share / notes / history). */
function displayText(v, vo) {
  var t = v[1].map(function (s) { return s[2] ? s[0].toUpperCase() : s[0]; }).join(' ');
  return (vo === 'raw') ? t : swapNames(t, vo);
}

function verseHtml(v, i) {
  var m = (state.version === 'yy' || state.dv === 'yy' || state.version === 'nt' || state.dv === 'nt') ? { fUp: 'YAHWEH', sUp: 'YESHUA' } : (state.version === 'ethiopic' || state.dv === 'ethiopic') ? NAME_MODES['god-jesus'] : nm(), h = '', hasHl = false, hasRed = false;
  v[1].forEach(function (s) {
    if (s[1]) hasRed = true; else if (s[2]) hasHl = true;
    h += segHtml(s) + ' ';
  });
  var badges = '';
  if (hasHl) badges += '<span class="badge badge-hl">' + esc(m.fUp) + ' SPEAKS</span>';
  if (hasRed) badges += '<span class="badge badge-red">' + esc(m.sUp) + '</span>';
  return '<div class="verse" id="v' + i + '" data-i="' + i + '">' +
    '<span class="vnum">' + v[0] + '</span><span class="vtext">' + h + badges + '</span>' +
    '<button class="vhlbtn" data-i="' + i + '" aria-label="Highlight verse">&#128396;&#65039;</button></div>';
}

/* ---------------- v2: verse jump picker ----------------
   Book -> chapter -> verse navigation for every version: the sidebar picks
   the book, the chapter chips pick the chapter, and this grid jumps to any
   verse in the current chapter. */
function openVersePicker() {
  if (!DATA) return;
  var b = DATA.books[state.book];
  if (!b || !b.chapters[state.chapter]) return;
  var ch = b.chapters[state.chapter];
  $('verse-title').textContent = b.name + ' ' + (state.chapter + 1) + ' \u2022 verses';
  var html = '';
  ch.forEach(function (v, i) {
    html += '<button class="vgrid-btn" data-i="' + i + '">' + v[0] + '</button>';
  });
  $('verse-grid').innerHTML = html || '<div class="muted">No verses.</div>';
  Array.prototype.forEach.call($('verse-grid').children, function (btn) {
    if (btn.getAttribute('data-i') === null) return;
    btn.addEventListener('click', function () {
      closeVersePicker();
      var el = document.querySelector('#verses .verse[data-i="' + btn.getAttribute('data-i') + '"]');
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ block: 'center' });
        el.classList.add('vflash');
        setTimeout(function () { el.classList.remove('vflash'); }, 1200);
      }
    });
  });
  $('verse-sheet').classList.remove('sheet-gone');
  $('verse-sheet').setAttribute('aria-hidden', 'false');
}
function closeVersePicker() {
  $('verse-sheet').classList.add('sheet-gone');
  $('verse-sheet').setAttribute('aria-hidden', 'true');
}
function initVersePicker() {
  var ob = $('btn-verse');
  if (ob) ob.addEventListener('click', openVersePicker);
  var cb = $('verse-close');
  if (cb) cb.addEventListener('click', closeVersePicker);
  var sh = $('verse-sheet');
  if (sh) sh.addEventListener('click', function (ev) { if (ev.target === sh) closeVersePicker(); });
}
function renderChapters() {
  var b = DATA.books[state.book], c = $('chapter-chips'), html = '';
  b.chapters.forEach(function (_, i) {
    html += '<button class="chipbtn' + (i === state.chapter ? ' active' : '') +
      '" data-i="' + i + '">' + (i + 1) + '</button>';
  });
  c.innerHTML = html;
  Array.prototype.forEach.call(c.children, function (btn) {
    btn.addEventListener('click', function () {
      ttsStop();
      state.chapter = +btn.getAttribute('data-i');
      renderChapter();
      savePos();
    });
  });
  var act = c.querySelector('.active');
  if (act) { try { act.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) {} }
}

function renderChapter() {
  exitSelMode(); /* a fresh chapter starts with no selection */
  showReaderButtons(true);
  if (state.version === 'compare') { renderCompare(); return; }
  var b = DATA.books[state.book];
  if (!b) return;
  if (state.chapter < 0) state.chapter = 0;
  if (state.chapter >= b.chapters.length) state.chapter = b.chapters.length - 1;
  $('book-title').textContent = b.name + ' ' + (state.chapter + 1);
  $('book-sub').textContent = sectionOf(state.book) + ' \u2022 ' +
    b.chapters.length + ' chapters \u2022 ' + nameLabel();
  renderChapters();
  var html = '';
  b.chapters[state.chapter].forEach(function (v, i) { html += verseHtml(v, i); });
  $('verses').innerHTML = html || '<div class="verse">No text.</div>';
  vsizeApply(vsizeGet()); /* newly rendered lines get the chosen text size */
  applyHighlights(); /* re-stamp saved verse highlights */
  $('verses').classList.toggle('pronounce', state.pronounce);
  Array.prototype.forEach.call($('verses').querySelectorAll('.verse'), function (el) {
    el.addEventListener('click', function (ev) {
      if (el._lpFired) { el._lpFired = false; return; } /* long-press opened the highlight sheet */
      if (selMode) { toggleSelect(+el.getAttribute('data-i')); ev.stopPropagation(); return; }
      if (hlTapEntry(el, ev)) { ev.stopPropagation(); return; } /* highlighter button / verse number tap */
      var t = ev.target;
      if (state.pronounce && t && t.classList && t.classList.contains('w')) {
        if (t._lpFired) { t._lpFired = false; ev.stopPropagation(); return; } /* long-press opened the definition */
        ev.stopPropagation();
        speakWord(t.getAttribute('data-w') || t.textContent);
        return;
      }
      tapVerse(+el.getAttribute('data-i'));
    });
  });
  loadNotes();
  logReading(); /* date-based reading journal: what did I read on a given day */
  maybeShowHlTip(); /* one-time coach tip for verse highlighting */
  $('reader').scrollTop = 0;
  setNowReading('Ready', '');
}

/* ---------------- side-by-side compare ----------------
   Compare is a view over the sacred dataset: each verse renders the JSV
   text (with the active divine-name mode, red/gold kept), plus the same
   verse from each enabled standard version (KJV / WEB / YLT, toggleable
   via chips; JSV is always on). Sacred book index -> 66-book index:
   OT 0-38 lines up; NT 60-86 maps to 39-65. Wider-canon and Apostolic
   Fathers books exist only in the sacred text. Read-along reads the JSV
   rendering (tapVerse/speakCurrent work on DATA, which is sacred here). */
var CMP_VERSIONS = [['kjv', 'KJV'], ['web', 'WEB'], ['ylt', 'YLT'], ['ydabar', 'YAHUAH DABAR'], ['bsb', 'BSB'], ['elohim', 'ELOHIM']];
var cmpEnabled = { kjv: true, web: true, ylt: true, ydabar: true, bsb: true, elohim: true };
try {
  var _ce = JSON.parse(lsGet('cmp', 'null'));
  if (_ce) CMP_VERSIONS.forEach(function (p) {
    if (typeof _ce[p[0]] === 'boolean') cmpEnabled[p[0]] = _ce[p[0]];
  });
} catch (e) {}
function cmpOnList() {
  return CMP_VERSIONS.filter(function (p) { return cmpEnabled[p[0]]; });
}
function sacredToStdIndex(sb) {
  if (sb <= 38) return sb;
  if (sb >= 60 && sb <= 86) return sb - 21;
  return -1;
}
function stdData(v) {
  if (DATA_CACHE[v]) return DATA_CACHE[v];
  if (v === 'kjv' && typeof KJV !== 'undefined') { DATA_CACHE['kjv'] = KJV; return KJV; }
  if (v === 'web' && typeof WEB !== 'undefined') { DATA_CACHE['web'] = WEB; return WEB; }
  if (v === 'ylt' && typeof YLT !== 'undefined') { DATA_CACHE['ylt'] = YLT; return YLT; }
  if (v === 'ydabar' && typeof YDABAR !== 'undefined') { DATA_CACHE['ydabar'] = YDABAR; return YDABAR; }
  if (v === 'bsb' && typeof BSB !== 'undefined') { DATA_CACHE['bsb'] = BSB; return BSB; }
  if (v === 'elohim' && typeof ELOHIM !== 'undefined') { DATA_CACHE['elohim'] = ELOHIM; return ELOHIM; }
  return null;
}
function ensureCompareData(done) {
  var missing = CMP_VERSIONS.filter(function (p) { return !stdData(p[0]); })
                            .map(function (p) { return p[0]; });
  if (!missing.length) { done(); return; }
  var pending = missing.length;
  missing.forEach(function (v) {
    fetchText(VERSIONS[v].file).then(function (t) {
      DATA_CACHE[v] = JSON.parse(t);
      if (--pending === 0) done();
    }).catch(function () { if (--pending === 0) done(); /* render with whatever loaded */ });
  });
}
function verseNumMap(ch) {
  var m = {};
  if (ch) ch.forEach(function (v) { m[v[0]] = v; });
  return m;
}
function compareVerseHtml(v, i, maps) {
  /* JSV column reuses verseHtml: red/gold, badges, pronounce spans and
     tap-to-read all behave exactly like the normal reader. Each enabled
     standard version gets its own stacked labeled block; the standard text
     renders raw (no divine-name swap, exactly as before) with the new
     divine-speech styling (gold bold caps / bold red). */
  var h = '<div class="cmp-block">' + verseHtml(v, i);
  cmpOnList().forEach(function (p) {
    var ov = maps[p[0]][v[0]];
    h += '<div class="cmp-ver"><span class="cmp-tag">' + p[1] + '</span><span class="cmp-text">' +
         (ov ? verseSegHtml(ov, 'raw') : '<span class="muted">\u2014</span>') + '</span></div>';
  });
  h += '</div>';
  return h;
}
function renderCmpChips() {
  var h = '<div class="cmp-chips"><span class="cmp-chip on locked">JSV</span>';
  CMP_VERSIONS.forEach(function (p) {
    h += '<button class="cmp-chip' + (cmpEnabled[p[0]] ? ' on' : '') + '" data-v="' + p[0] + '">' +
         p[1] + '</button>';
  });
  return h + '</div>';
}
function finishCompareRender() {
  $('verses').classList.toggle('pronounce', state.pronounce);
  Array.prototype.forEach.call($('verses').querySelectorAll('.verse'), function (el) {
    el.addEventListener('click', function (ev) {
      if (el._lpFired) { el._lpFired = false; return; } /* long-press opened the highlight sheet */
      if (selMode) { toggleSelect(+el.getAttribute('data-i')); ev.stopPropagation(); return; }
      if (hlTapEntry(el, ev)) { ev.stopPropagation(); return; } /* highlighter button / verse number tap */
      var t = ev.target;
      if (state.pronounce && t && t.classList && t.classList.contains('w')) {
        if (t._lpFired) { t._lpFired = false; ev.stopPropagation(); return; } /* long-press opened the definition */
        ev.stopPropagation();
        speakWord(t.getAttribute('data-w') || t.textContent);
        return;
      }
      tapVerse(+el.getAttribute('data-i'));
    });
  });
  Array.prototype.forEach.call($('verses').querySelectorAll('.cmp-ver .w'), function (w) {
    w.addEventListener('click', function (ev) {
      if (w._lpFired) { w._lpFired = false; ev.stopPropagation(); return; } /* long-press opened the definition */
      ev.stopPropagation();
      speakWord(w.getAttribute('data-w') || w.textContent);
    });
  });
  Array.prototype.forEach.call($('verses').querySelectorAll('.cmp-chip[data-v]'), function (c) {
    c.addEventListener('click', function (ev) {
      ev.stopPropagation();
      var v = c.getAttribute('data-v');
      cmpEnabled[v] = !cmpEnabled[v];
      lsSet('cmp', JSON.stringify(cmpEnabled));
      if (state.version === 'compare') renderCompare();
    });
  });
  loadNotes();
  $('reader').scrollTop = 0;
  setNowReading('Ready', '');
  vsizeApply(vsizeGet()); /* newly rendered lines get the chosen text size */
}
function renderCompare() {
  showReaderButtons(true);
  var b = DATA.books[state.book];
  if (!b) return;
  if (state.chapter < 0) state.chapter = 0;
  if (state.chapter >= b.chapters.length) state.chapter = b.chapters.length - 1;
  $('book-title').textContent = b.name + ' ' + (state.chapter + 1);
  var onNames = cmpOnList().map(function (p) { return p[1]; });
  $('book-sub').textContent = sectionOf(state.book) + ' \u2022 ' +
    b.chapters.length + ' chapters \u2022 JSV' + (onNames.length ? ' + ' + onNames.join(' + ') : ' only');
  renderChapters();
  var stdIdx = sacredToStdIndex(state.book);
  if (stdIdx < 0) {
    var note = 'KJV, WEB and YLT don\u2019t include this book \u2014 showing the JSV text:';
    var html = '<div class="cmp-note">' + esc(note) + '</div>';
    b.chapters[state.chapter].forEach(function (v, i) { html += verseHtml(v, i); });
    $('verses').innerHTML = html;
    finishCompareRender();
    return;
  }
  ensureCompareData(function () {
    if (state.version !== 'compare') return;
    var maps = {}, ch, bd;
    CMP_VERSIONS.forEach(function (p) {
      bd = stdData(p[0]);
      ch = (bd && bd.books[stdIdx]) ? bd.books[stdIdx].chapters[state.chapter] : null;
      maps[p[0]] = verseNumMap(ch);
    });
    var html = renderCmpChips();
    b.chapters[state.chapter].forEach(function (v, i) { html += compareVerseHtml(v, i, maps); });
    $('verses').innerHTML = html || '<div class="verse">No text.</div>';
    finishCompareRender();
  });
}

function setNowReading(a, b) { $('now-reading').textContent = a; $('verse-pos').textContent = b || ''; }
function setProgress(frac) { $('progress-fill').style.width = Math.round(frac * 100) + '%'; }
function refOf(i) {
  var b = DATA.books[state.book], ch = b.chapters[state.chapter];
  return b.name + ' ' + (state.chapter + 1) + ':' + (ch[i] ? ch[i][0] : '');
}

function showReaderButtons(v) {
  ['btn-read', 'btn-read-study', 'btn-words'].forEach(function (id) {
    var el = $(id); if (el) el.style.display = v ? '' : 'none';
  });
}

/* ---------------- TTS ---------------- */
var bridge = (typeof window.AndroidTTS !== 'undefined') ? window.AndroidTTS : null;
var tts = { mode: 'idle', idx: 0 }; // mode: idle | verse | chapter | paused

function speakNative(idx, text) {
  try {
    bridge.setRate(state.rate);
    bridge.speakVerse(idx, text);
    return true;
  } catch (e) { return false; }
}
/* browser fallback (desktop testing): use speechSynthesis */
var fbSeq = 0;
function speakFallback(idx, text, onend) {
  var my = ++fbSeq; /* stale (cancelled) utterances must never advance playback */
  try {
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = state.rate;
    var done = function () { if (my === fbSeq && onend) onend(); };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) { return false; }
}
function ttsSpeak(idx, text, onend) {
  if (bridge) return speakNative(idx, text);
  if (typeof window.speechSynthesis !== 'undefined') return speakFallback(idx, text, onend);
  return false;
}
function ttsHalt() {
  try { if (bridge) bridge.stop(); } catch (e) {}
  try { if (typeof window.speechSynthesis !== 'undefined') window.speechSynthesis.cancel(); } catch (e) {}
}

function clearSpeaking() {
  var l = $('verses').querySelectorAll('.verse.speaking');
  for (var i = 0; i < l.length; i++) l[i].classList.remove('speaking');
}
function markSpeaking(i) {
  clearSpeaking();
  var el = $('v' + i);
  if (el) {
    el.classList.add('speaking');
    try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
  }
}

function tapVerse(i) {
  tts.mode = 'verse'; tts.idx = i; /* mode first: stale callbacks become no-ops */
  ttsHalt();
  var ch = DATA.books[state.book].chapters[state.chapter];
  var text = swapNames(plainText(ch[i]));
  setNowReading(refOf(i), '');
  setProgress((i + 1) / ch.length);
  markSpeaking(i);
  updatePlayBtn();
  if (!ttsSpeak(i, text, function () { if (tts.mode === 'verse') ttsStop(); })) ttsStop();
}

function playChapter() {
  tts.mode = 'chapter'; tts.idx = 0; /* mode first: stale callbacks become no-ops */
  ttsHalt();
  updatePlayBtn();
  speakCurrent();
}
function pauseChapter() {
  if (tts.mode !== 'chapter') return;
  tts.mode = 'paused'; /* first: stale verseDone/onend callbacks become no-ops */
  ttsHalt();           /* then stop audio; tts.idx is kept for resume */
  setNowReading('Paused — ' + refOf(tts.idx), ($('verse-pos').textContent || ''));
  updatePlayBtn();
}
function resumeChapter() {
  if (tts.mode !== 'paused') return;
  tts.mode = 'chapter';
  updatePlayBtn();
  speakCurrent();                  // continues from the kept tts.idx
}
/* v2.2: hands-free read-along chapter advance. Moves to the next chapter
   (or the first chapter of the next book at a book boundary), re-renders,
   and rewinds to verse 0. Returns false only at the end of Revelation. */
function advanceChapterForTTS() {
  if (state.chapter + 1 < DATA.books[state.book].chapters.length) {
    state.chapter++;
  } else if (state.book + 1 < DATA.books.length) {
    state.book++; state.chapter = 0;
  } else {
    return false; /* end of the Bible — stop reading */
  }
  renderChapter();
  savePos();
  tts.idx = 0;
  return true;
}
function speakCurrent() {
  var ch = DATA.books[state.book].chapters[state.chapter];
  if (tts.idx >= ch.length) {
    /* v2.2: chapter finished — roll straight into the next chapter and keep
       reading (hands-free while driving / working). Stops only at the
       very end of the Bible. */
    if (!advanceChapterForTTS()) { ttsStop(); return; }
    ch = DATA.books[state.book].chapters[state.chapter];
  }
  var text = swapNames(plainText(ch[tts.idx]));
  setNowReading(refOf(tts.idx), (tts.idx + 1) + ' / ' + ch.length);
  setProgress(tts.idx / ch.length);
  markSpeaking(tts.idx);
  if (!ttsSpeak(tts.idx, text, function () {
    if (tts.mode !== 'chapter') return;
    tts.idx++;
    speakCurrent();
  })) ttsStop();
}
function ttsStop() {
  tts.mode = 'idle'; tts.idx = 0; /* mode first: stale callbacks become no-ops */
  ttsHalt();
  clearSpeaking();
  setProgress(0);
  setNowReading('Ready', '');
  updatePlayBtn();
}

/* Single-word pronunciation for tap-a-word mode.
   Stops any read-along cleanly first (mode='idle' makes in-flight
   verseDone/onend callbacks no-ops), then speaks just the word with
   NO callbacks, so read-along state can never get stuck. */
function speakWordNative(word) {
  try {
    if (!bridge || !bridge.speakWord) return false;
    bridge.setRate(state.rate);
    bridge.speakWord(word);
    return true;
  } catch (e) { return false; }
}
function speakWord(word) {
  if (!word) return;
  ttsStop();
  setNowReading('\uD83D\uDD0A ' + word, '');
  if (speakWordNative(word)) return;
  /* web / speechSynthesis path (iOS-safe: delay speak after cancel, like speakFallback) */
  var my = ++fbSeq;
  try {
    if (typeof window.speechSynthesis === 'undefined') return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(word);
    u.rate = state.rate;
    u.lang = 'en-US';
    if (typeof chosenVoice !== 'undefined' && chosenVoice) u.voice = chosenVoice;
    setTimeout(function () {
      if (my !== fbSeq) return;
      try { window.speechSynthesis.speak(u); } catch (e) {}
    }, 80);
  } catch (e) {}
}
function updatePlayBtn() {
  var p = $('btn-play'), s = $('btn-stop'), pa = $('btn-pause'), r = $('btn-read');
  var playing = tts.mode === 'chapter', paused = tts.mode === 'paused', verse = tts.mode === 'verse';
  p.innerHTML = playing ? '&#10074;&#10074; Pause' : (paused ? '&#9654; Resume' : '&#9654; Play chapter');
  r.innerHTML = (playing || paused) ? '&#9632; Stop read-along' : '&#128266; Read to me';
  pa.classList.toggle('hidden', !(playing || paused));
  s.classList.toggle('hidden', !(playing || paused || verse));
}

/* called from native code */
window.QodeshTTS = {
  verseStart: function (i) {
    if (tts.mode === 'idle') return;
    markSpeaking(i);
    var ch = DATA.books[state.book].chapters[state.chapter];
    setNowReading(refOf(i), (i + 1) + ' / ' + ch.length);
    setProgress(i / ch.length);
  },
  verseDone: function (i) {
    if (tts.mode === 'chapter') { tts.idx = i + 1; speakCurrent(); }
    else if (tts.mode === 'verse') ttsStop();
  }
};

/* ---------------- notes ---------------- */
function noteKey() { return 'note:' + state.book + ':' + state.chapter; }
function loadNotes() {
  $('notes-title').textContent = 'My notes — ' + DATA.books[state.book].name + ' ' + (state.chapter + 1);
  $('notes-box').value = lsGet(noteKey(), '');
  updateShareUI();
}
var noteTimer = null;
function queueSaveNote() {
  clearTimeout(noteTimer);
  noteTimer = setTimeout(function () { lsSet(noteKey(), $('notes-box').value); }, 400);
}

/* ---------------- study commentary (Matthew Henry) ---------------- */
var studyCache = {};
function paraHtml(t) {
  return esc(swapNames(t)).split(/\n\n+/).map(function (p) {
    return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
  }).join('');
}
function fillStudy(d) {
  var ch = d.chapters[state.chapter] || { notes: [], xrefs: [] };
  var nh = '';
  ch.notes.forEach(function (n) {
    nh += '<div class="mh-note"><div class="mh-range">' + esc(n.range) + '</div>' +
      '<div class="mh-text">' + paraHtml(n.text) + '</div></div>';
  });
  $('mh-notes').innerHTML = nh || '<p class="muted">No commentary for this chapter.</p>';
  var xh = '';
  ch.xrefs.forEach(function (g) {
    xh += '<div class="xref-group">' + esc(swapNames(g.join('; '))) + '</div>';
  });
  $('mh-xrefs').innerHTML = xh || '<p class="muted">No cross-references for this chapter.</p>';
}
function renderStudy() {
  var b = DATA.books[state.book];
  $('study-chap-label').textContent = 'Study — ' + b.name + ' ' + (state.chapter + 1);
  loadNotes();
  /* KJV, WEB and YLT have 66 books in standard order; map to the sacred-text study files:
     OT 0-38 lines up, NT 39-65 maps to sacred indices 60-86. Compare uses
     sacred indices already, so it needs no shift. */
  var want = state.book;
  if (isStdVersion(state.version) && want >= 39) want += 21;
  var ck = state.version + ':' + want, vb = state.version, sb = state.book;
  if (studyCache[ck]) { fillStudy(studyCache[ck]); return; }
  $('mh-notes').innerHTML = '<p class="muted">Loading study notes…</p>';
  $('mh-xrefs').innerHTML = '';
  fetchText('study/b' + want + '.json').then(function (t) {
    var d = JSON.parse(t);
    studyCache[ck] = d;
    if (state.version === vb && state.book === sb) fillStudy(d);
  }).catch(function () {
    if (state.version !== vb || state.book !== sb) return;
    $('mh-notes').innerHTML = '<p class="muted">Study notes could not be loaded.</p>';
  });
}
function stepStudy(dir) {
  var b = DATA.books[state.book], nc = state.chapter + dir;
  if (nc < 0 || nc >= b.chapters.length) return;
  ttsStop();
  state.chapter = nc;
  renderChapter();
  renderStudy();
  savePos();
}

/* deep link from the home-screen widget: jump straight to a verse */
window.jumpToVerse = function (b, c, v, tries) {
  if (!DATA) { /* bible data still loading; retry briefly */
    if ((tries || 0) < 40) setTimeout(function () { window.jumpToVerse(b, c, v, (tries || 0) + 1); }, 250);
    return;
  }
  if (!DATA.books[b]) return;
  ttsStop();
  state.book = b; state.chapter = c;
  closeSidebar(); closeStudy();
  renderChapter();
  savePos();
  var ch = DATA.books[b].chapters[c] || [], vi = -1, i;
  for (i = 0; i < ch.length; i++) if (ch[i][0] === v) { vi = i; break; }
  if (vi < 0) vi = Math.max(0, Math.min(v - 1, ch.length - 1));
  var el = $('v' + vi);
  if (el) {
    el.classList.add('jumped');
    try { el.scrollIntoView({ block: 'center' }); } catch (e) {}
    setTimeout(function () { el.classList.remove('jumped'); }, 3100);
  }
};

/* ---------------- sidebar / drawers ---------------- */
function openSidebar() { $('sidebar').classList.add('open'); $('scrim').classList.add('show'); }
function closeSidebar() { $('sidebar').classList.remove('open'); $('scrim').classList.remove('show'); }
function openStudy() {
  closeSidebar();
  renderStudy();
  $('study').classList.add('open'); $('scrim').classList.add('show');
}
function closeStudy() { $('study').classList.remove('open'); $('scrim').classList.remove('show'); }

/* ---------------- reading history ----------------
   Every displayed chapter is logged by local date so Johnny can go back
   and see what he read on a given day (e.g. last Sunday's service).
   'readlog' is a JSON array, newest last, capped at 500 entries. */
function todayKey(d) {
  d = d || new Date();
  var m = d.getMonth() + 1, day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
}
function stampDate(d) {
  d = d || new Date();
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[d.getMonth()] + ' ' + d.getDate();
}
function logReading() {
  try {
    if (!DATA || !DATA.books[state.book]) return;
    var dv = state.version === 'votd' ? votdVersionKey() : (state.version === 'notes' ? (state.dv || 'sacred') : state.version);
    var log = JSON.parse(lsGet('readlog', '[]'));
    if (!Array.isArray(log)) log = [];
    var key = todayKey();
    var last = log[log.length - 1];
    if (last && last.d === key && last.ver === dv &&
        last.book === state.book && last.chapter === state.chapter) return; /* dedupe */
    log.push({ d: key, t: Date.now(), ver: dv,
      book: state.book, chapter: state.chapter,
      name: DATA.books[state.book].name });
    while (log.length > 500) log.shift();
    lsSet('readlog', JSON.stringify(log));
  } catch (e) {}
}
function friendlyDay(key) {
  var now = new Date();
  if (key === todayKey(now)) return 'Today';
  if (key === todayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))) return 'Yesterday';
  var p = key.split('-');
  var d = new Date(+p[0], +p[1] - 1, +p[2]); /* computed locally, never guessed */
  var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}
function openHistory() {
  closeSettings();
  renderHistory();
  $('history').classList.add('open'); $('scrim').classList.add('show');
}
function closeHistory() { $('history').classList.remove('open'); $('scrim').classList.remove('show'); }
function renderHistory() {
  var log = [];
  try { log = JSON.parse(lsGet('readlog', '[]')) || []; } catch (e) { log = []; }
  var body = $('history-body');
  if (!log.length) {
    body.innerHTML = '<p class="muted">Nothing here yet. Chapters you read will appear here, grouped by day.</p>';
    return;
  }
  var h = '', lastDay = null, i, e;
  for (i = log.length - 1; i >= 0; i--) {
    e = log[i];
    if (!e || !e.d) continue;
    if (e.d !== lastDay) { h += '<h3 class="study-h">' + esc(friendlyDay(e.d)) + '</h3>'; lastDay = e.d; }
    h += '<button class="hist-row" data-i="' + i + '">' +
      '<span>' + esc(e.name || 'Unknown') + ' ' + ((e.chapter || 0) + 1) + '</span>' +
      '<span class="hist-ver">' + esc(histVerLabel(e.ver)) + '</span></button>';
  }
  body.innerHTML = h || '<p class="muted">Nothing here yet.</p>';
  Array.prototype.forEach.call(body.querySelectorAll('.hist-row'), function (b) {
    b.addEventListener('click', function () {
      var en = log[+b.getAttribute('data-i')];
      if (!en) return;
      closeHistory();
      state.book = en.book; state.chapter = en.chapter;
      setVersion(en.ver); /* afterVersionLoad clamps + renders + logs */
    });
  });
}
function histVerLabel(v) {
  if (v === 'kjv') return 'KJV';
  if (v === 'web') return 'WEB';
  if (v === 'ylt') return 'YLT';
  if (v === 'ydabar') return 'DABAR';
  if (v === 'bsb') return 'BSB';
  if (v === 'elohim') return 'ELOHIM';
  return 'JSV';
}

/* ---------------- name mode ---------------- */
var NAME_ORDER = ['yahuah-yahusha', 'yah-yahusha', 'yahweh-yahshua', 'yhwh-yeshua', 'god-jesus', 'hebrew-names'];
function renderNameTabs() {
  var bar = $('name-tabs');
  if (!bar) return;
  if (!bar.children.length) {
    NAME_ORDER.forEach(function (key) {
      var b = document.createElement('button');
      b.className = 'name-tab';
      b.dataset.mode = key;
      b.textContent = NAME_MODES[key].label;
      b.addEventListener('click', function () {
        if (state.names !== key) { state.names = key; applyNameMode(); }
      });
      bar.appendChild(b);
    });
  }
  Array.prototype.forEach.call(bar.children, function (b) {
    b.classList.toggle('active', b.dataset.mode === state.names);
  });
}
function applyNameMode() {
  var m = nm();
  $('legend-father').textContent = m.father;
  $('legend-son').textContent = m.son;
  renderNameTabs();
  lsSet('names', state.names);
  ttsStop();
  if (DATA) { renderChapter(); renderVotd(); if (state.version === 'votd') renderVotdTab(); if (state.version === 'notes') renderNotesTab(); }
}

/* ---------------- init ---------------- */
function init() {
  loadState();
  updateStreak();
  renderNameTabs();
  initVotd();
  initVotdTab();
  $('rate').value = String(state.rate);
  initRateMenu();
  applyNameModeStatic();

  $('btn-books').addEventListener('click', openSidebar);
  $('scrim').addEventListener('click', function () { closeSidebar(); closeStudy(); closeHistory(); });
  $('btn-read-study').addEventListener('click', openStudy);
  $('btn-study-close').addEventListener('click', closeStudy);
  $('btn-study-prev').addEventListener('click', function () { stepStudy(-1); });
  $('btn-study-next').addEventListener('click', function () { stepStudy(1); });
  $('book-search').addEventListener('input', function () { renderBooks(this.value); });
  $('btn-play').addEventListener('click', function () {
    if (tts.mode === 'chapter') pauseChapter();
    else if (tts.mode === 'paused') resumeChapter();
    else playChapter();
  });
  $('btn-pause').addEventListener('click', function () {
    if (tts.mode === 'chapter') pauseChapter();
    else if (tts.mode === 'paused') resumeChapter();
  });
  $('btn-read').addEventListener('click', function () {
    if (tts.mode === 'chapter' || tts.mode === 'paused') ttsStop();
    else playChapter();
  });
  $('btn-words').addEventListener('click', toggleWords);
  updateWordsBtn();
  setupWordGestures();
  setupVerseHighlight();
  $('def-close').addEventListener('click', hideDefPopup);
  wireHlTap($('def-highlight'), function () { /* v27: instant highlight, no sheet */
    var i = defVerseIdx;
    hideDefPopup();
    if (i >= 0) quickHighlight(i);
  });
  $('def-sheet').addEventListener('click', function (ev) {
    if (ev.target === this) hideDefPopup();
  });
  /* In-sheet buttons are driven from touchend, not click.
     Johnny's phone delivers the synthesized click on these buttons unreliably
     (frame-proven: a tap on a color button closed the sheet with no paint and
     the button's own click arrived ~2s late; a tap during the open pulse lost
     its click entirely). Running the action in the touchend task itself makes
     every tap land; preventDefault() kills the late duplicate click, and the
     per-button guard swallows one if it still arrives. */
  window.wireHlTap = wireHlTap;
  function wireHlTap(el, fn) {
    if (!el || el._hlTapWired) return;
    el._hlTapWired = true;
    el.addEventListener('touchend', function (ev) {
      if (ev.cancelable) ev.preventDefault(); /* no synthesized click after this */
      el._hlTouchTs = Date.now();
      fn();
    }, { passive: false });
    /* mouse / desktop fallback; also swallows the tap's own late duplicate
       click when the WebView synthesizes one despite preventDefault() */
    el.addEventListener('click', function () {
      if (Date.now() - (el._hlTouchTs || 0) < 3000) return;
      fn();
    });
  }
  var hlb = document.querySelectorAll('#hl-colors .hl-btn');
  Array.prototype.forEach.call(hlb, function (bt) {
    wireHlTap(bt, function () { pickHighlight(bt.getAttribute('data-c')); });
  });
  wireHlTap($('hl-remove'), removeHighlight);
  wireHlTap($('hl-cancel'), hideHlSheet);
  var sc = $('sel-cancel');
  if (sc) sc.addEventListener('click', function (ev) { ev.stopPropagation(); exitSelMode(); });
  wireHlTap($('hl-share'), shareHighlightVerse);
  /* v1.8: selection action bar + verse image card */
  wireHlTap($('sel-share'), selShare);
  wireHlTap($('sel-image'), openCardSheet);
  wireHlTap($('sel-copy'), selCopy);
  wireHlTap($('sel-hl'), selHighlight);
  wireHlTap($('sel-note'), selNote);
  wireHlTap($('sel-define'), selDefine);
  wireHlTap($('sel-close'), exitSelMode);
  Array.prototype.forEach.call(document.querySelectorAll('#card-styles .card-style'), function (b) {
    wireHlTap(b, function () { pickCardStyle(b.getAttribute('data-s')); });
  });
  wireHlTap($('card-share'), cardShare);
  wireHlTap($('card-save'), cardSave);
  wireHlTap($('card-cancel'), hideCardSheet);
  $('card-sheet').addEventListener('click', function (ev) { if (ev.target === this) hideCardSheet(); });
  $('notes-share').addEventListener('click', shareChapterNotes);
  $('btn-history-close').addEventListener('click', closeHistory);
  $('hl-sheet').addEventListener('click', function (ev) {
    if (ev.target === this) hideHlSheet();
  });
  vsizeApply(vsizeGet());
  initSettings();
  $('btn-stop').addEventListener('click', ttsStop);
  $('rate').addEventListener('change', function () {
    state.rate = parseFloat(this.value) || 1;
    lsSet('rate', String(state.rate));
    try { if (bridge) bridge.setRate(state.rate); } catch (e) {}
  });
  $('notes-box').addEventListener('input', queueSaveNote);
  /* v2: extra version tabs are created dynamically (after ELOHIM, before Compare) */
  var NEW_TAB_LABELS = { ethiopic: 'Ethiopian', yy: 'Yahweh & Yeshua', nt: 'Names & Titles', asv: 'ASV', darby: 'Darby', bbe: 'BBE', dra: 'DRA', msb: 'MSB',
    oeb: 'OEB', lsv: 'LSV', brenton: 'Brenton LXX', geneva: 'Geneva', jps: 'JPS',
    tcnt: 'TCNT', wmb: 'WMB', webster: 'Webster', rv: 'RV 1885', wycliffe: 'Wycliffe' };
  (function addVersionTabs() {
    var bar = $('version-tabs'), anchor = $('ver-compare');
    if (!bar || !anchor) return;
    Object.keys(VERSIONS).forEach(function (key) {
      if ($('ver-' + key)) return; /* already has a hardcoded button */
      var b = document.createElement('button');
      b.id = 'ver-' + key;
      b.className = 'name-tab';
      b.setAttribute('role', 'tab');
      b.textContent = NEW_TAB_LABELS[key] || key.toUpperCase();
      b.addEventListener('click', function () { if (state.version !== key) setVersion(key); });
      bar.insertBefore(b, anchor);
    });
  })();
  /* v2: verse jump picker */
  initVersePicker();
  $('ver-sacred').addEventListener('click', function () { if (state.version !== 'sacred') setVersion('sacred'); });
  $('ver-ethiopic').addEventListener('click', function () { if (state.version !== 'ethiopic') setVersion('ethiopic'); });
  $('ver-nt').addEventListener('click', function () { if (state.version !== 'nt') setVersion('nt'); });
  $('ver-yy').addEventListener('click', function () { if (state.version !== 'yy') setVersion('yy'); });
  $('ver-kjv').addEventListener('click', function () { if (state.version !== 'kjv') setVersion('kjv'); });
  $('ver-web').addEventListener('click', function () { if (state.version !== 'web') setVersion('web'); });
  $('ver-ylt').addEventListener('click', function () { if (state.version !== 'ylt') setVersion('ylt'); });
  $('ver-ydabar').addEventListener('click', function () { if (state.version !== 'ydabar') setVersion('ydabar'); });
  $('ver-bsb').addEventListener('click', function () { if (state.version !== 'bsb') setVersion('bsb'); });
  $('ver-elohim').addEventListener('click', function () { if (state.version !== 'elohim') setVersion('elohim'); });
  $('ver-compare').addEventListener('click', function () { if (state.version !== 'compare') setVersion('compare'); });
  $('ver-votd').addEventListener('click', function () { if (state.version !== 'votd') setVersion('votd'); });
  $('ver-notes').addEventListener('click', function () { if (state.version !== 'notes') setVersion('notes'); });

  setVersion(state.version);
}

function applyNameModeStatic() {
  var m = nm();
  $('legend-father').textContent = m.father;
  $('legend-son').textContent = m.son;
}

document.addEventListener('DOMContentLoaded', init);
})();
