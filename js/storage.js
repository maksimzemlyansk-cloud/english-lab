(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports && typeof require === 'function';
  const util = isNode ? require('./util.js') : (root.EL || {});
  const srs = isNode ? require('./srs.js') : (root.EL || {});
  const lessonsApi = isNode ? require('./lesson-data.js') : (root.EL || {});
  const checker = isNode ? require('./checker.js') : (root.EL || {});
  const api = factory(util, srs, lessonsApi, checker);
  if (isNode) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (util, srs, lessonsApi, checker) {
  const KEY = 'english-lab-free-v1';
  const LOOKUP_KEY = 'english-lab-lookup-cache-v1';
  const DRIVE_FILE_NAME = 'english-lab-progress.json';
  const DRIVE_ENABLED_KEY = 'english-lab-drive-enabled-v1';
  const DRIVE_FILE_KEY = 'english-lab-drive-file-v1';
  const GOOGLE_CLIENT_ID = '495880178624-eivt6d66dhni1f2voi1pbg24letuej66.apps.googleusercontent.com';

  function emptyLesson() {
    return { step: 0, completed: false, phrase: '', practiceDraft: '', currentId: '', items: {}, warmup: { attempts: [], revealed: false, correct: false } };
  }

  function httpsUrl(value) {
    return /^https:\/\//i.test(String(value || '')) ? String(value) : '';
  }

  function cleanImage(image) {
    if (!image || typeof image !== 'object') return null;
    const own = image.kind === 'local' || image.source === 'own';
    if (own) {
      return {
        kind: 'local',
        source: 'own',
        url: '',
        thumb: '',
        title: String(image.title || 'Своя картинка').slice(0, 140),
        creator: '',
        license: 'свой файл',
        licenseUrl: '',
        sourceUrl: '',
        attribution: 'Своя картинка хранится только на этом устройстве.'
      };
    }
    const url = httpsUrl(image.url);
    if (!url) return null;
    return {
      kind: 'remote',
      source: String(image.source || '').slice(0, 40),
      url: url,
      thumb: httpsUrl(image.thumb) || url,
      title: String(image.title || '').slice(0, 180),
      creator: String(image.creator || '').slice(0, 180),
      license: String(image.license || '').slice(0, 80),
      licenseUrl: httpsUrl(image.licenseUrl),
      sourceUrl: httpsUrl(image.sourceUrl),
      attribution: String(image.attribution || '').slice(0, 300)
    };
  }

  function migrateWord(word) {
    const src = word || {};
    const source = src.source || 'manual';
    return {
      id: src.id || util.uid(),
      en: src.en || '',
      ru: src.ru || '',
      source: source,
      context: src.context || '',
      sourceDetail: src.sourceDetail || '',
      auto: src.auto === true,
      addedAt: src.addedAt || null,
      due: src.due || util.todayISO(),
      interval: typeof src.interval === 'number' ? src.interval : 0,
      ease: typeof src.ease === 'number' ? src.ease : 2.5,
      reps: typeof src.reps === 'number' ? src.reps : 0,
      lapses: typeof src.lapses === 'number' ? src.lapses : 0,
      box: typeof src.box === 'number' ? src.box : 0,
      pos: src.pos || '',
      phonetic: src.phonetic || '',
      audio: httpsUrl(src.audio),
      definition: src.definition || '',
      stage: src.stage === 'learn' ? 'learn' : 'review',
      mnemonic: String(src.mnemonic || '').slice(0, 500),
      imageQuery: String(src.imageQuery || '').slice(0, 80),
      image: cleanImage(src.image)
    };
  }

  function forSync(data) {
    const copy = JSON.parse(JSON.stringify(data || {}));
    (copy.words || []).forEach(function (word) {
      if (!word || !word.image) return;
      if (word.image.kind === 'local' || word.image.source === 'own' || String(word.image.url || '').indexOf('data:') === 0) {
        word.image = {
          kind: 'local',
          source: 'own',
          url: '',
          thumb: '',
          title: 'Своя картинка',
          creator: '',
          license: 'свой файл',
          licenseUrl: '',
          sourceUrl: '',
          attribution: 'Своя картинка хранится только на этом устройстве.'
        };
      }
    });
    return copy;
  }

  function sanitizeVideo(video) {
    const src = video || {};
    const difficult = Array.isArray(src.difficult) ? src.difficult.map(function (line) {
      return { start: Number(line.start) || 0, end: Number(line.end) || 0, text: String(line.text || '').slice(0, 500) };
    }) : [];
    const studied = Array.isArray(src.studied) ? src.studied.map(Number).filter(function (n) { return Number.isFinite(n); }) : [];
    return {
      id: src.id,
      title: src.title || 'Видео',
      sourceType: src.sourceType || 'file',
      fileName: src.fileName || '',
      youtubeId: src.youtubeId || '',
      lastPosition: Number(src.lastPosition) || 0,
      difficult: difficult,
      studied: studied,
      linesStudied: studied.length,
      gap: src.gap && typeof src.gap === 'object' ? src.gap : {},
      updatedAt: src.updatedAt || null
    };
  }

  function sanitizeCinema(cinema) {
    const videos = {};
    const source = cinema && cinema.videos ? cinema.videos : {};
    Object.keys(source).forEach(function (id) {
      const video = sanitizeVideo(source[id]);
      if (video.id) videos[video.id] = video;
    });
    return { videos: videos };
  }

  function lessonRecord(raw, id) {
    const src = raw || {};
    const base = emptyLesson();
    base.step = Math.max(0, Math.min(4, Number(src.step) || 0));
    base.completed = src.completed === true || base.step >= 4;
    base.phrase = src.phrase || '';
    base.practiceDraft = src.practiceDraft || '';
    base.currentId = src.currentId || '';
    base.items = src.items && typeof src.items === 'object' ? src.items : {};
    base.warmup = Object.assign(base.warmup, src.warmup || {});
    if (!Array.isArray(base.warmup.attempts)) base.warmup.attempts = [];
    return base;
  }

  function migrate(raw) {
    const data = raw && typeof raw === 'object' ? raw : {};
    const lessons = { 1: emptyLesson(), 2: emptyLesson(), 3: emptyLesson(), 4: emptyLesson() };
    const legacy = !(data.schemaVersion >= 2 && data.lessons);
    if (!legacy) {
      [1, 2, 3, 4].forEach(function (id) {
        lessons[id] = lessonRecord(data.lessons[id], id);
      });
    } else {
      const step = Math.max(0, Math.min(4, Number(data.lessonStep) || 0));
      lessons[4] = lessonRecord({
        step: step,
        completed: step >= 4,
        phrase: data.phrase || '',
        practiceDraft: data.practiceDraft || ''
      }, 4);
    }
    const answers = (Array.isArray(data.answers) ? data.answers : []).map(function (item) {
      const copy = Object.assign({}, item);
      if (!copy.lesson) copy.lesson = 4;
      return copy;
    });
    let current = Number(data.currentLesson);
    if (legacy || ![1, 2, 3, 4].includes(current)) current = 1;
    return {
      schemaVersion: 2,
      currentLesson: current,
      lessonStep: lessons[4].step,
      lessons: lessons,
      answers: answers,
      phrase: lessons[4].phrase || data.phrase || '',
      practiceDraft: lessons[4].practiceDraft || data.practiceDraft || '',
      words: (Array.isArray(data.words) ? data.words : []).map(migrateWord),
      settings: { dailyMinutes: lessonsApi.snapMinutes(data.settings && data.settings.dailyMinutes) },
      cinema: sanitizeCinema(data.cinema),
      lastUpdatedAt: data.lastUpdatedAt || null
    };
  }

  function stable(data) {
    const copy = JSON.parse(JSON.stringify(data || {}));
    delete copy.lastUpdatedAt;
    return JSON.stringify(copy);
  }

  const state = { data: null };

  function load() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (err) { raw = {}; }
    const migrated = migrate(raw);
    state.data = migrated;
    if (stable(raw) !== stable(migrated)) save();
    return state.data;
  }

  function save() {
    if (!state.data) return;
    state.data.lessonStep = state.data.lessons[4].step;
    state.data.phrase = state.data.lessons[4].phrase || '';
    state.data.practiceDraft = state.data.lessons[4].practiceDraft || '';
    state.data.lastUpdatedAt = new Date().toISOString();
    localStorage.setItem(KEY, JSON.stringify(state.data));
    if (typeof globalThis.ELDriveSync === 'function') globalThis.ELDriveSync();
  }

  function replaceData(next) {
    state.data = migrate(next);
    save();
    return state.data;
  }

  function lessonStatus(id, data) {
    const store = data || state.data;
    const lesson = store.lessons[id];
    const attempts = store.answers.filter(function (item) { return Number(item.lesson) === Number(id); });
    const itemTries = Object.keys(lesson.items || {}).some(function (key) {
      const item = lesson.items[key];
      return item && Array.isArray(item.attempts) && item.attempts.length;
    });
    const warm = lesson.warmup && lesson.warmup.attempts && lesson.warmup.attempts.length;
    const started = lesson.step > 0 || !!lesson.phrase || itemTries || warm || attempts.length > 0 || lesson.completed;
    if (!started) return 'not-started';
    if (lesson.completed && lesson.step >= 4) return 'done';
    return 'in-progress';
  }

  function isUnlocked(id, data) {
    const store = data || state.data;
    const n = Number(id);
    if (n <= 1) return true;
    if (lessonStatus(n - 1, store) === 'done' || store.lessons[n - 1].completed) return true;
    return lessonStatus(n, store) !== 'not-started';
  }

  function findWord(en) {
    const key = checker.lemmaKey(en);
    if (!key) return null;
    return state.data.words.find(function (word) { return checker.lemmaKey(word.en) === key; }) || null;
  }

  function addWord(entry) {
    const en = String(entry.en || '').trim();
    if (!en) return { ok: false, reason: 'empty' };
    const dup = findWord(en);
    if (dup) return { ok: false, reason: 'duplicate', word: dup };
    const word = migrateWord({
      id: util.uid(),
      en: en,
      ru: String(entry.ru || '').trim(),
      source: entry.source || 'manual',
      context: entry.context || '',
      sourceDetail: entry.sourceDetail || '',
      auto: entry.auto === true,
      addedAt: new Date().toISOString(),
      due: util.todayISO(),
      interval: 0,
      ease: 2.5,
      reps: 0,
      lapses: 0,
      box: 0,
      stage: entry.stage === 'learn' ? 'learn' : 'review',
      imageQuery: entry.imageQuery || '',
      mnemonic: entry.mnemonic || '',
      audio: entry.audio || '',
      phonetic: entry.phonetic || ''
    });
    state.data.words.unshift(word);
    save();
    return { ok: true, word: word };
  }

  function deleteWord(id) {
    state.data.words = state.data.words.filter(function (word) { return word.id !== id; });
    save();
  }

  function grade(id, gradeName) {
    const word = state.data.words.find(function (item) { return item.id === id; });
    if (!word) return null;
    Object.assign(word, srs.gradeWord(word, gradeName, util.todayISO()));
    save();
    return word;
  }

  function countsAsDue(word, today) {
    if (!word || word.stage === 'learn') return false;
    return srs.isDue(word, today || util.todayISO());
  }

  function dueWords() {
    return state.data.words.filter(function (word) { return countsAsDue(word); });
  }

  function exportPayload() {
    return { version: 2, exportedAt: new Date().toISOString(), data: forSync(state.data) };
  }

  return {
    KEY: KEY,
    LOOKUP_KEY: LOOKUP_KEY,
    DRIVE_FILE_NAME: DRIVE_FILE_NAME,
    DRIVE_ENABLED_KEY: DRIVE_ENABLED_KEY,
    DRIVE_FILE_KEY: DRIVE_FILE_KEY,
    GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
    state: state,
    emptyLesson: emptyLesson,
    migrate: migrate,
    migrateWord: migrateWord,
    load: load,
    save: save,
    replaceData: replaceData,
    lessonStatus: lessonStatus,
    isUnlocked: isUnlocked,
    findWord: findWord,
    addWord: addWord,
    deleteWord: deleteWord,
    grade: grade,
    dueWords: dueWords,
    countsAsDue: countsAsDue,
    forSync: forSync,
    exportPayload: exportPayload,
    stable: stable
  };
});
