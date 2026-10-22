(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CACHE_KEY = 'english-lab-image-cache-v1';
  const OPENVERSE = 'https://api.openverse.org/v1/images/';

  function stripHtml(value) {
    return String(value || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0?39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function httpsUrl(value) {
    const text = String(value || '').trim();
    if (/^https:\/\//i.test(text)) return text;
    if (text.indexOf('//') === 0) return 'https:' + text;
    return '';
  }

  function slim(item) {
    if (!item) return null;
    const url = httpsUrl(item.url);
    if (!url) return null;
    return {
      kind: 'remote',
      source: String(item.source || '').slice(0, 40),
      url: url,
      thumb: httpsUrl(item.thumb) || url,
      title: stripHtml(item.title).slice(0, 180),
      creator: stripHtml(item.creator).slice(0, 180),
      license: stripHtml(item.license).slice(0, 80),
      licenseUrl: httpsUrl(item.licenseUrl),
      sourceUrl: httpsUrl(item.sourceUrl),
      attribution: stripHtml(item.attribution).slice(0, 300)
    };
  }

  function mapOpenverse(payload) {
    const rows = payload && Array.isArray(payload.results) ? payload.results : [];
    return rows.map(function (item) {
      return slim({
        source: 'openverse',
        url: item.url,
        thumb: item.thumbnail,
        title: item.title,
        creator: item.creator,
        license: [item.license, item.license_version].filter(Boolean).join(' '),
        licenseUrl: item.license_url,
        sourceUrl: item.foreign_landing_url,
        attribution: item.attribution
      });
    }).filter(Boolean).slice(0, 6);
  }

  function mapCommons(payload) {
    const pages = payload && payload.query && payload.query.pages ? payload.query.pages : {};
    return Object.keys(pages).map(function (id) {
      const page = pages[id];
      const info = (page.imageinfo || [])[0] || {};
      const meta = info.extmetadata || {};
      const mime = String(info.mime || '');
      if (mime && !/^image\/(jpeg|png|gif|webp)$/i.test(mime)) return null;
      const license = meta.LicenseShortName && meta.LicenseShortName.value;
      return slim({
        source: 'wikimedia',
        url: info.thumburl || info.url,
        thumb: info.thumburl || info.url,
        title: (meta.ObjectName && meta.ObjectName.value) || page.title,
        creator: meta.Artist && meta.Artist.value,
        license: license,
        licenseUrl: meta.LicenseUrl && meta.LicenseUrl.value,
        sourceUrl: info.descriptionurl,
        attribution: ''
      });
    }).filter(Boolean).slice(0, 6);
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (err) { return {}; }
  }

  function writeCache(all) {
    const keys = Object.keys(all);
    if (keys.length > 30) {
      keys.sort(function (a, b) { return (all[a].at || 0) - (all[b].at || 0); }).slice(0, keys.length - 30).forEach(function (key) { delete all[key]; });
    }
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(all)); } catch (err) { /* quota */ }
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open('english-lab', 2);
      req.onupgradeneeded = function () {
        const database = req.result;
        if (!database.objectStoreNames.contains('subtitles')) database.createObjectStore('subtitles');
        if (!database.objectStoreNames.contains('images')) database.createObjectStore('images');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idb(mode, id, value) {
    return openDb().then(function (database) {
      return new Promise(function (resolve, reject) {
        const tx = database.transaction('images', mode);
        const store = tx.objectStore('images');
        const req = mode === 'readwrite' ? store.put(value, id) : store.get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function () { return null; });
  }

  async function fetchJson(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(function () { ctrl.abort(); }, ms || 7000);
    try {
      const response = await fetch(url, { signal: ctrl.signal });
      if (!response.ok) throw new Error(String(response.status));
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function searchImages(query) {
    const q = String(query || '').trim().slice(0, 80);
    if (!q) return [];
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return [];
    const key = q.toLowerCase();
    const cache = readCache();
    if (cache[key] && Array.isArray(cache[key].items)) return cache[key].items;
    let items = [];
    try {
      const url = OPENVERSE + '?q=' + encodeURIComponent(q) + '&page_size=6&mature=false';
      items = mapOpenverse(await fetchJson(url, 6000));
    } catch (err) { items = []; }
    if (!items.length) {
      try {
        const commons = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata|mime&iiurlwidth=640&gsrsearch=' + encodeURIComponent(q);
        items = mapCommons(await fetchJson(commons, 8000));
      } catch (err) { items = []; }
    }
    if (items.length) {
      cache[key] = { at: Date.now(), items: items };
      writeCache(cache);
    }
    return items;
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//i.test(file.type || '')) { reject(new Error('type')); return; }
      const reader = new FileReader();
      reader.onerror = function () { reject(reader.error); };
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () { reject(new Error('image')); };
        img.onload = function () {
          const maxEdge = 720;
          const scale = Math.min(1, maxEdge / Math.max(img.width || 1, img.height || 1));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round((img.width || 1) * scale));
          canvas.height = Math.max(1, Math.round((img.height || 1) * scale));
          canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
          let quality = 0.72;
          let data = canvas.toDataURL('image/jpeg', quality);
          while (data.length > 120000 && quality > 0.42) {
            quality = Math.round((quality - 0.1) * 100) / 100;
            data = canvas.toDataURL('image/jpeg', quality);
          }
          if (data.length > 160000) { reject(new Error('size')); return; }
          resolve(data);
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  return {
    mapOpenverse: mapOpenverse,
    mapCommons: mapCommons,
    searchImages: searchImages,
    compressImage: compressImage,
    saveLocalImage: function (id, dataUrl) { return idb('readwrite', id, dataUrl); },
    loadLocalImage: function (id) { return idb('readonly', id); },
    safeImageUrl: httpsUrl
  };
});
