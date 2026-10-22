(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function todayISO(date) {
    const d = date || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function addDays(iso, days) {
    const parts = String(iso || todayISO()).split('-').map(Number);
    const d = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
    d.setDate(d.getDate() + days);
    return todayISO(d);
  }

  function levenshtein(a, b) {
    a = String(a || '');
    b = String(b || '');
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) row[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let prev = i - 1;
      row[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const tmp = row[j];
        const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + cost);
        prev = tmp;
      }
    }
    return row[b.length];
  }

  function stem(word) {
    let w = String(word || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return '';
    if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
    if (w.length > 4 && /(ches|shes|sses|xes|oes|zes)$/.test(w)) return w.slice(0, -2);
    if (w.length > 4 && w.endsWith('ing')) {
      let s = w.slice(0, -3);
      if (s.length >= 3 && s[s.length - 1] === s[s.length - 2] && /[aeiou]/.test(s[s.length - 3])) s = s.slice(0, -1);
      return s;
    }
    if (w.length > 3 && w.endsWith('es')) return w.slice(0, -2);
    if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
    return w;
  }

  function formatTime(sec) {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h > 0 ? pad(h) + ':' + pad(m) + ':' + pad(s) : pad(m) + ':' + pad(s);
  }

  function parseYouTubeId(input) {
    const raw = String(input || '').trim();
    if (!raw) return '';
    if (/^[\w-]{11}$/.test(raw)) return raw;
    try {
      const url = new URL(raw);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || '';
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        const parts = url.pathname.split('/').filter(Boolean);
        const marker = parts.findIndex(function (p) { return p === 'embed' || p === 'shorts' || p === 'live' || p === 'v'; });
        if (marker >= 0 && parts[marker + 1]) return parts[marker + 1];
      }
    } catch (err) { /* not a URL */ }
    return '';
  }

  return {
    esc: esc,
    uid: uid,
    pad: pad,
    todayISO: todayISO,
    addDays: addDays,
    levenshtein: levenshtein,
    stem: stem,
    formatTime: formatTime,
    parseYouTubeId: parseYouTubeId
  };
});
