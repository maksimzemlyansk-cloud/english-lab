(function (root, factory) {
  const util = root.EL;
  const storage = root.EL;
  const api = factory(util, storage);
  root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (util, storage) {
  const DICT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  const MEMORY = 'https://api.mymemory.translated.net/get';

  function readCache() {
    try { return JSON.parse(localStorage.getItem(storage.LOOKUP_KEY) || '{}'); } catch (err) { return {}; }
  }

  function writeCache(all) {
    const keys = Object.keys(all);
    if (keys.length > 200) {
      keys.sort(function (a, b) { return (all[a].at || 0) - (all[b].at || 0); }).slice(0, keys.length - 200).forEach(function (key) { delete all[key]; });
    }
    localStorage.setItem(storage.LOOKUP_KEY, JSON.stringify(all));
  }

  function cacheKey(text) {
    return String(text || '').trim().toLowerCase();
  }

  async function fetchJson(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, ms || 8000);
    try {
      const response = await fetch(url, { signal: ctrl.signal });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function pickDict(payload) {
    if (!Array.isArray(payload) || !payload.length) return null;
    const entry = payload[0];
    const phonetics = entry.phonetics || [];
    const audioRaw = phonetics.map(function (item) { return item.audio || ''; }).find(Boolean) || '';
    const audio = audioRaw.indexOf('//') === 0 ? 'https:' + audioRaw : audioRaw;
    const phonetic = entry.phonetic || phonetics.map(function (item) { return item.text || ''; }).find(Boolean) || '';
    const meaning = (entry.meanings || [])[0] || {};
    const def = (meaning.definitions || [])[0] || {};
    return {
      pos: meaning.partOfSpeech || '',
      phonetic: phonetic,
      audio: /^https?:\/\//i.test(audio) ? audio : '',
      definition: def.definition || ''
    };
  }

  async function fetchDict(word) {
    const clean = String(word || '').trim().toLowerCase().replace(/[^a-z'\- ]/g, '');
    if (!clean || clean.indexOf(' ') !== -1) return null;
    try {
      return pickDict(await fetchJson(DICT + encodeURIComponent(clean)));
    } catch (err) {
      return null;
    }
  }

  async function fetchTranslation(text) {
    const q = String(text || '').trim().slice(0, 400);
    if (!q) return '';
    try {
      const url = MEMORY + '?q=' + encodeURIComponent(q) + '&langpair=en|ru';
      const data = await fetchJson(url);
      if (!data || data.quotaFinished) return '';
      const translated = data.responseData && data.responseData.translatedText;
      if (!translated || data.responseStatus && Number(data.responseStatus) >= 400) return '';
      if (translated.trim().toLowerCase() === q.toLowerCase() && /[a-z]/i.test(q)) return '';
      return String(translated).trim();
    } catch (err) {
      return '';
    }
  }

  async function lookupText(text) {
    const key = cacheKey(text);
    if (!key) return { ru: '', definition: '', pos: '', phonetic: '', audio: '', offline: false, ok: false };
    const all = readCache();
    if (all[key]) return Object.assign({ offline: false }, all[key]);
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { ru: '', definition: '', pos: '', phonetic: '', audio: '', offline: true, ok: false };
    }
    const dictWord = key.split(/\s+/)[0];
    const dict = await fetchDict(key.split(/\s+/).length === 1 ? key : dictWord);
    const ru = await fetchTranslation(key);
    const result = {
      ru: ru,
      definition: dict && dict.definition || '',
      pos: dict && dict.pos || '',
      phonetic: dict && dict.phonetic || '',
      audio: dict && dict.audio || '',
      ok: !!(ru || (dict && dict.definition)),
      offline: false,
      at: Date.now()
    };
    if (result.ok) {
      all[key] = result;
      writeCache(all);
    }
    return result;
  }

  function speak(text) {
    if (!window.speechSynthesis || !text) return false;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices() || [];
    const voice = voices.find(function (item) { return item.lang === 'en-US'; }) || voices.find(function (item) { return /^en/i.test(item.lang); });
    if (voice) utter.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    return true;
  }

  function posRu(pos) {
    const map = { noun: 'существительное', verb: 'глагол', adjective: 'прилагательное', adverb: 'наречие', pronoun: 'местоимение', preposition: 'предлог', conjunction: 'союз', interjection: 'междометие', exclamation: 'междометие', article: 'артикль', numeral: 'числительное' };
    return map[String(pos || '').toLowerCase()] || pos || '';
  }

  return { lookupText: lookupText, speak: speak, posRu: posRu };
});
