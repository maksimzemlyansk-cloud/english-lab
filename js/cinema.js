(function () {
  const EL = window.EL;
  const STOP = { a: 1, an: 1, the: 1, to: 1, of: 1, and: 1, or: 1, in: 1, on: 1, at: 1, for: 1, from: 1, with: 1, is: 1, am: 1, are: 1, do: 1, does: 1, not: 1, it: 1, my: 1, your: 1 };
  const state = {
    videoId: '',
    cues: [],
    cueIndex: -1,
    objectUrl: '',
    player: null,
    poll: 0,
    speed: 1,
    hideSubs: false,
    parseMode: false,
    latch: null,
    phraseMode: false,
    anchor: null,
    selection: null,
    panel: null,
    gap: null,
    note: '',
    lastSave: 0,
    ytReady: null
  };

  function db() {
    return new Promise(function (resolve, reject) {
      const req = indexedDB.open('english-lab', 1);
      req.onupgradeneeded = function () {
        if (!req.result.objectStoreNames.contains('subtitles')) req.result.createObjectStore('subtitles');
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbPut(id, value) {
    return db().then(function (database) {
      return new Promise(function (resolve, reject) {
        const tx = database.transaction('subtitles', 'readwrite');
        tx.objectStore('subtitles').put(value, id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    }).catch(function () { state.note = 'Субтитры открыты, но браузер не сохранил файл локально.'; });
  }

  function idbGet(id) {
    return db().then(function (database) {
      return new Promise(function (resolve, reject) {
        const tx = database.transaction('subtitles', 'readonly');
        const req = tx.objectStore('subtitles').get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function () { return null; });
  }

  function record() {
    if (!state.videoId) return null;
    return EL.state.data.cinema.videos[state.videoId] || null;
  }

  function ensureVideo(id, fields) {
    const bag = EL.state.data.cinema.videos;
    if (!bag[id]) {
      bag[id] = {
        id: id,
        title: fields.title || 'Видео',
        sourceType: fields.sourceType || 'file',
        fileName: fields.fileName || '',
        youtubeId: fields.youtubeId || '',
        lastPosition: 0,
        difficult: [],
        studied: [],
        linesStudied: 0,
        gap: {},
        updatedAt: new Date().toISOString()
      };
    } else {
      Object.assign(bag[id], fields, { id: id, updatedAt: new Date().toISOString() });
    }
    state.videoId = id;
    EL.save();
    return bag[id];
  }

  function markStudied(cue) {
    const rec = record();
    if (!rec || !cue) return;
    const key = Math.round(cue.start * 100) / 100;
    if (rec.studied.indexOf(key) === -1) {
      rec.studied.push(key);
      rec.linesStudied = rec.studied.length;
      rec.updatedAt = new Date().toISOString();
      EL.save();
    }
  }

  function currentTime() {
    const video = document.getElementById('local-video');
    if (video && !video.hidden && video.src) return video.currentTime || 0;
    if (state.player && state.player.getCurrentTime) {
      try { return state.player.getCurrentTime() || 0; } catch (err) { return 0; }
    }
    return 0;
  }

  function seekTo(sec) {
    const video = document.getElementById('local-video');
    if (video && !video.hidden && video.src) { video.currentTime = sec; return true; }
    if (state.player && state.player.seekTo) { state.player.seekTo(sec, true); return true; }
    return false;
  }

  function play() {
    const video = document.getElementById('local-video');
    if (video && !video.hidden && video.src) { video.play(); return; }
    if (state.player && state.player.playVideo) state.player.playVideo();
  }

  function pause() {
    const video = document.getElementById('local-video');
    if (video && !video.hidden && video.src) { video.pause(); return; }
    if (state.player && state.player.pauseVideo) state.player.pauseVideo();
  }

  function hasMedia() {
    const video = document.getElementById('local-video');
    return !!((video && !video.hidden && video.src) || (state.player && state.player.getCurrentTime));
  }

  function findCue(time) {
    for (let i = 0; i < state.cues.length; i++) {
      const cue = state.cues[i];
      if (time >= cue.start && time < cue.end) return i;
    }
    return -1;
  }

  function onTime(time) {
    const idx = findCue(time);
    if (idx !== state.cueIndex) {
      state.cueIndex = idx;
      paintActive();
    }
    paintOverlay();
    const rec = record();
    const now = Date.now();
    if (rec && now - state.lastSave > 5000) {
      rec.lastPosition = time;
      state.lastSave = now;
      EL.save();
    }
    if (state.parseMode && idx >= 0 && time >= state.cues[idx].end - 0.08 && state.latch !== state.cues[idx].end) {
      state.latch = state.cues[idx].end;
      markStudied(state.cues[idx]);
      pause();
      setNote('Режим разбора: пауза в конце реплики.');
    }
  }

  function bindLocal(video) {
    video.ontimeupdate = function () { onTime(video.currentTime || 0); };
    video.onpause = function () {
      const rec = record();
      if (rec) { rec.lastPosition = video.currentTime || 0; EL.save(); }
    };
    video.onplay = function () {
      if (state.latch != null && video.currentTime >= state.latch - 0.12) {
        const idx = findCue(video.currentTime) ;
        const next = state.cues[idx + 1];
        if (next) video.currentTime = next.start;
        state.latch = null;
      }
    };
  }

  function setNote(text) {
    state.note = text || '';
    const node = document.getElementById('cinema-note');
    if (node) node.textContent = state.note;
  }

  function paintOverlay() {
    const node = document.getElementById('overlay-sub');
    if (!node) return;
    if (state.hideSubs || state.cueIndex < 0) { node.textContent = ''; return; }
    node.textContent = state.cues[state.cueIndex].text;
  }

  function paintActive() {
    const list = document.getElementById('cue-list');
    if (!list) return;
    list.querySelectorAll('.cue').forEach(function (node, index) {
      node.classList.toggle('active', index === state.cueIndex);
    });
    const active = list.querySelector('.cue.active');
    if (!active) return;
    const top = active.offsetTop - list.offsetTop;
    const bottom = top + active.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = Math.max(0, top - 8);
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
  }

  function wordHtml(cue, cueIndex) {
    return EL.tokenize(cue.text).map(function (part) {
      if (part.type !== 'word') return EL.esc(part.raw);
      const selected = state.selection && state.selection.cue === cueIndex && part.index >= state.selection.from && part.index <= state.selection.to;
      return '<button type="button" class="word-token' + (selected ? ' selected' : '') + '" data-action="cue-word" data-cue="' + cueIndex + '" data-i="' + part.index + '">' + EL.esc(part.raw) + '</button>';
    }).join('');
  }

  function paintCues() {
    const list = document.getElementById('cue-list');
    if (!list) return;
    const rec = record();
    const hard = rec ? rec.difficult.map(function (line) { return Math.round(line.start * 100) / 100; }) : [];
    if (!state.cues.length) {
      list.innerHTML = '<div class="empty">Субтитры не загружены. Выбери файл SRT или VTT, который тебе можно использовать.</div>';
      return;
    }
    list.innerHTML = state.cues.map(function (cue, index) {
      const key = Math.round(cue.start * 100) / 100;
      const difficult = hard.indexOf(key) !== -1;
      return '<article class="cue' + (index === state.cueIndex ? ' active' : '') + (difficult ? ' difficult' : '') + '" data-action="jump-cue" data-cue="' + index + '"><div class="cue-line"><span class="muted small">' + EL.esc(EL.formatTime(cue.start)) + '</span> ' + wordHtml(cue, index) + '</div><div class="inline"><button class="button small" data-action="breakdown" data-cue="' + index + '">Разобрать</button><button class="button small" data-action="gap" data-cue="' + index + '">Пропуск</button><button class="button small" data-action="toggle-hard" data-cue="' + index + '">' + (difficult ? 'Снять метку' : 'Сложная') + '</button></div></article>';
    }).join('');
  }

  function paintPanel() {
    const node = document.getElementById('cinema-panel');
    if (!node) return;
    if (state.gap) { node.innerHTML = gapHtml(state.gap); return; }
    const panel = state.panel;
    if (!panel) { node.innerHTML = '<div class="empty">Нажми слово в реплике или кнопку «Разобрать».</div>'; return; }
    if (panel.loading) { node.innerHTML = '<p>Ищу «' + EL.esc(panel.text) + '»…</p>'; return; }
    if (panel.breakdown) { node.innerHTML = breakdownHtml(panel); return; }
    const info = panel.info || {};
    const warn = info.offline ? 'Нет интернета — перевод и словарь недоступны. Можно вписать перевод в словаре позже.' : (info.ok ? 'Перевод автоматический и может быть неточным.' : 'Сервис не ответил. Слово можно добавить и вписать перевод вручную.');
    node.innerHTML = '<h3>' + EL.esc(panel.text) + '</h3><p class="notice">' + EL.esc(warn) + '</p>' +
      '<p>' + (info.ru ? EL.esc(info.ru) : '<span class="muted">Русский перевод не получен.</span>') + '</p>' +
      (info.pos ? '<p class="small">' + EL.esc(EL.posRu(info.pos)) + '</p>' : '') +
      (info.phonetic ? '<p class="small muted">' + EL.esc(info.phonetic) + '</p>' : '') +
      (info.definition ? '<p class="small">' + EL.esc(info.definition) + '</p>' : '') +
      '<div class="inline"><button class="button" data-action="speak-panel">Слушать</button>' +
      (info.audio ? '<audio controls preload="none" src="' + EL.esc(info.audio) + '"></audio>' : '') +
      '<button class="button primary" data-action="save-panel">Добавить в словарь</button></div>';
  }

  function breakdownHtml(panel) {
    const line = panel.cue;
    const report = panel.report;
    const info = panel.info || {};
    const contractions = report.contractions.length ? report.contractions.map(function (item) {
      return '<li><strong>' + EL.esc(item.surface) + '</strong> → ' + EL.esc(item.expansion) + ' · ' + EL.esc(item.ru) + '</li>';
    }).join('') : '<li>Сокращений из списка не найдено.</li>';
    const structures = report.structures.length ? report.structures.map(function (item) {
      return '<li>' + EL.esc(item.label) + ': «' + EL.esc(item.text) + '»</li>';
    }).join('') : '<li>Конструкций уроков 1–4 в этой реплике не видно.</li>';
    const phrasals = report.phrasals.length ? report.phrasals.map(function (item) {
      return '<li><strong>' + EL.esc(item.phrase) + '</strong> — ' + EL.esc(item.ru) + '</li>';
    }).join('') : '<li>Фразовых глаголов из короткого списка нет.</li>';
    return '<h3>Разбор реплики</h3><p class="line-html">' + safeHighlight(line.text) + '</p>' +
      '<p class="notice">Перевод автоматический и может быть неточным. Разбор правил — без ИИ, по спискам приложения.</p>' +
      '<p>' + (info.ru ? EL.esc(info.ru) : 'Перевод строки не получен. Можно разобрать слова по отдельности.') + '</p>' +
      '<h3>Сокращения</h3><ul class="list">' + contractions + '</ul>' +
      '<h3>Конструкции</h3><ul class="list">' + structures + '</ul>' +
      '<h3>Фразовые глаголы</h3><ul class="list">' + phrasals + '</ul>';
  }

  function safeHighlight(text) {
    const hits = EL.findStructures(text).slice().sort(function (a, b) { return a.start - b.start || b.end - a.end; });
    let html = '';
    let cursor = 0;
    const taken = [];
    hits.forEach(function (hit) {
      if (taken.some(function (span) { return hit.start < span[1] && hit.end > span[0]; })) return;
      html += EL.esc(text.slice(cursor, hit.start)) + '<mark>' + EL.esc(text.slice(hit.start, hit.end)) + '</mark>';
      taken.push([hit.start, hit.end]);
      cursor = hit.end;
    });
    return html + EL.esc(text.slice(cursor));
  }

  function gapHtml(gap) {
    const shown = EL.tokenize(gap.cue.text).map(function (part) {
      if (part.type === 'word' && part.index === gap.word.index) return ' ____ ';
      return EL.esc(part.raw);
    }).join('');
    const msg = gap.message ? '<p class="feedback ' + (gap.ok ? 'good' : 'bad') + '">' + EL.esc(gap.message) + '</p>' : '';
    return '<h3>Пропуск</h3><p class="prompt">' + shown + '</p><input id="gap-input" class="answer" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Пропущенное слово">' + msg + '<div class="inline"><button class="button primary" data-action="check-gap">Проверить</button></div>';
  }

  function contentWord(cue) {
    const words = EL.tokenize(cue.text).filter(function (part) {
      return part.type === 'word' && part.raw.length > 2 && !STOP[part.raw.toLowerCase()];
    });
    if (!words.length) return null;
    const index = Math.floor(cue.start * 10) % words.length;
    return words[index];
  }

  function savedHtml() {
    const videos = Object.keys(EL.state.data.cinema.videos).map(function (id) { return EL.state.data.cinema.videos[id]; });
    if (!videos.length) return '<p class="muted small">Сохранённых видео пока нет.</p>';
    return videos.map(function (video) {
      return '<button class="button" data-action="open-saved" data-id="' + EL.esc(video.id) + '">' + EL.esc(video.title) + ' · реплик ' + (video.linesStudied || 0) + ' · сложных ' + (video.difficult || []).length + '</button>';
    }).join('');
  }

  function difficultHtml() {
    const rec = record();
    if (!rec || !rec.difficult.length) return '';
    return '<h3>Сложные реплики</h3>' + rec.difficult.map(function (line) {
      return '<p><span class="muted small">' + EL.esc(EL.formatTime(line.start)) + '</span> ' + EL.esc(line.text) + '</p>';
    }).join('');
  }

  function renderCinema() {
    EL.cinemaMounted = true;
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Cinema Lab</div><h1>Разбор видео</h1><p class="muted">Свой файл остаётся в браузере и никуда не отправляется. Ролик YouTube открывается официальным плеером. Субтитры целиком хранятся только на этом устройстве, не в Google Диске.</p></section>' +
      '<section class="card"><h2>Как пользоваться законно</h2><p>Netflix и другие стриминги сюда не встраиваются, и качать оттуда видео или субтитры нельзя. Подойдут свой видеофайл, ролик YouTube и файл SRT или VTT, на который у тебя есть право.</p></section>' +
      '<section class="card"><h2>Уже открытые</h2><div class="inline" id="saved-videos">' + savedHtml() + '</div><div id="hard-list">' + difficultHtml() + '</div></section>' +
      '<section class="card"><div class="formrow"><label class="button" for="video-file">Видео с устройства<input id="video-file" hidden type="file" accept="video/*"></label><input id="yt-url" class="answer" placeholder="Ссылка YouTube" autocapitalize="off"><button class="button" data-action="load-yt">Открыть YouTube</button></div><div class="formrow"><label class="button" for="sub-file">Субтитры SRT/VTT<input id="sub-file" hidden type="file" accept=".srt,.vtt,text/vtt,application/x-subrip,text/plain"></label></div><p id="cinema-note" class="muted small">' + EL.esc(state.note) + '</p></section>' +
      '<section class="card"><div class="video-wrap"><video id="local-video" playsinline controls hidden></video><div id="yt-wrap" class="yt-frame" hidden><div id="yt-slot"></div></div><div id="overlay-sub" class="overlay-sub"></div></div>' +
      '<div class="inline"><button class="button" data-action="cue-prev">Предыдущая</button><button class="button" data-action="cue-replay">Ещё раз</button><button class="button" data-action="cue-next">Следующая</button><button class="button" data-action="speed" data-rate="0.5">0.5×</button><button class="button" data-action="speed" data-rate="0.75">0.75×</button><button class="button" data-action="speed" data-rate="1">1×</button><button class="button" data-action="toggle-subs" aria-pressed="false">Субтитры на видео</button><button class="button" data-action="toggle-parse" aria-pressed="false">Режим разбора</button><button class="button" data-action="toggle-phrase" aria-pressed="false">Фраза</button></div></section>' +
      '<section class="card"><h2>Реплики</h2><div id="cue-list" class="cue-list"></div></section><section class="card" id="cinema-panel"></section>';
    paintCues();
    paintPanel();
    if (state.objectUrl) {
      const video = document.getElementById('local-video');
      video.src = state.objectUrl;
      video.hidden = false;
      bindLocal(video);
    }
  }

  function destroyCinema() {
    stopYouTube();
    const video = document.getElementById('local-video');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    EL.cinemaMounted = false;
  }

  function loadYouTubeApi() {
    if (window.YT && YT.Player) return Promise.resolve();
    if (state.ytReady) return state.ytReady;
    state.ytReady = new Promise(function (resolve) {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previous === 'function') previous();
        resolve();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    });
    return state.ytReady;
  }

  function stopYouTube() {
    if (state.poll) clearInterval(state.poll);
    state.poll = 0;
    if (state.player && state.player.destroy) {
      try { state.player.destroy(); } catch (err) { /* already gone */ }
    }
    state.player = null;
    const wrap = document.getElementById('yt-wrap');
    if (wrap) {
      wrap.hidden = true;
      wrap.innerHTML = '<div id="yt-slot"></div>';
    }
  }

  async function openYouTube(id) {
    const video = document.getElementById('local-video');
    if (video) { video.pause(); video.hidden = true; }
    stopYouTube();
    const wrap = document.getElementById('yt-wrap');
    if (wrap) wrap.hidden = false;
    await loadYouTubeApi();
    const rec = record();
    state.player = new YT.Player('yt-slot', {
      videoId: id,
      width: '100%',
      height: '100%',
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
      events: {
        onReady: function (event) {
          const data = event.target.getVideoData ? event.target.getVideoData() : null;
          if (data && data.title && record()) { record().title = data.title; EL.save(); }
          if (rec && rec.lastPosition) event.target.seekTo(rec.lastPosition, true);
          applySpeed(state.speed);
        }
      }
    });
    if (state.poll) clearInterval(state.poll);
    state.poll = setInterval(function () {
      if (state.player && state.player.getCurrentTime) onTime(state.player.getCurrentTime() || 0);
    }, 250);
  }

  function applySpeed(rate) {
    state.speed = rate;
    const video = document.getElementById('local-video');
    if (video && !video.hidden) video.playbackRate = rate;
    if (state.player && state.player.setPlaybackRate) {
      const rates = state.player.getAvailablePlaybackRates ? state.player.getAvailablePlaybackRates() : [rate];
      if (rates.indexOf(rate) === -1 && rate !== 1) setNote('Эта скорость недоступна для ролика YouTube.');
      else {
        state.player.setPlaybackRate(rate);
        setNote('Скорость ' + rate + '×.');
      }
    } else if (video && !video.hidden) setNote('Скорость ' + rate + '×.');
  }

  async function onSubFile(file) {
    const text = await file.text();
    const parsed = EL.parseSubtitles(text);
    state.cues = parsed.cues;
    if (!state.cues.length) { setNote('Не удалось разобрать субтитры. Нужен SRT или VTT.'); paintCues(); return; }
    if (!state.videoId) {
      const id = 'subs:' + file.name + ':' + file.size;
      ensureVideo(id, { title: file.name, sourceType: 'subs', fileName: file.name });
    }
    await idbPut(state.videoId, { name: file.name, cues: state.cues, savedAt: new Date().toISOString() });
    setNote('Субтитры: ' + state.cues.length + ' реплик. Полный текст остаётся на устройстве.' + (parsed.warnings.length ? ' Часть меток времени пропущена.' : ''));
    paintCues();
    const host = document.getElementById('saved-videos');
    if (host) host.innerHTML = savedHtml();
  }

  async function restoreSubs(id) {
    const saved = await idbGet(id);
    if (saved && Array.isArray(saved.cues)) {
      state.cues = saved.cues;
      paintCues();
    }
  }

  function selectedText(cue) {
    if (!state.selection || state.selection.cue == null) return '';
    const words = EL.tokenize(cue.text).filter(function (part) { return part.type === 'word' && part.index >= state.selection.from && part.index <= state.selection.to; });
    return words.map(function (part) { return part.raw; }).join(' ');
  }

  async function openWord(text, cue) {
    state.gap = null;
    state.panel = { text: text, cue: cue, loading: true, breakdown: false };
    paintPanel();
    const info = await EL.lookupText(text);
    if (!state.panel || state.panel.text !== text) return;
    state.panel.info = info;
    state.panel.loading = false;
    paintPanel();
  }

  function onCinemaClick(action, node) {
    if (action === 'load-yt') {
      const id = EL.parseYouTubeId(document.getElementById('yt-url').value);
      if (!id) { setNote('Не вижу код ролика в ссылке.'); return true; }
      const videoId = 'yt:' + id;
      ensureVideo(videoId, { title: 'YouTube ' + id, sourceType: 'youtube', youtubeId: id });
      openYouTube(id);
      restoreSubs(videoId);
      setNote('Ролик открыт через плеер YouTube.');
      return true;
    }
    if (action === 'open-saved') {
      const id = node.dataset.id;
      const rec = EL.state.data.cinema.videos[id];
      state.videoId = id;
      state.cues = [];
      restoreSubs(id).then(function () { paintCues(); });
      if (rec && rec.youtubeId) openYouTube(rec.youtubeId);
      else setNote('Для файла с устройства выбери его снова. Сложные реплики и слова уже сохранены. Видео само не хранится.');
      const hard = document.getElementById('hard-list');
      if (hard) hard.innerHTML = difficultHtml();
      const host = document.getElementById('saved-videos');
      if (host) host.innerHTML = savedHtml();
      return true;
    }
    if (action === 'jump-cue' || action === 'cue-word') {
      if (action === 'cue-word') return onWord(node);
      const cue = state.cues[Number(node.dataset.cue)];
      if (!cue) return true;
      state.cueIndex = Number(node.dataset.cue);
      markStudied(cue);
      if (!seekTo(cue.start)) setNote('Видео не открыто — реплику можно читать и разбирать.');
      else { state.latch = null; play(); }
      paintActive();
      paintOverlay();
      return true;
    }
    if (action === 'cue-prev' || action === 'cue-next' || action === 'cue-replay') return moveCue(action);
    if (action === 'speed') { applySpeed(Number(node.dataset.rate)); return true; }
    if (action === 'toggle-subs') {
      state.hideSubs = !state.hideSubs;
      node.setAttribute('aria-pressed', state.hideSubs ? 'true' : 'false');
      paintOverlay();
      return true;
    }
    if (action === 'toggle-parse') {
      state.parseMode = !state.parseMode;
      node.setAttribute('aria-pressed', state.parseMode ? 'true' : 'false');
      setNote(state.parseMode ? 'Режим разбора включён: пауза в конце каждой реплики.' : 'Режим разбора выключен.');
      return true;
    }
    if (action === 'toggle-phrase') {
      state.phraseMode = !state.phraseMode;
      state.anchor = null;
      node.setAttribute('aria-pressed', state.phraseMode ? 'true' : 'false');
      setNote(state.phraseMode ? 'Режим фразы: нажми первое и последнее слово.' : 'Режим одного слова.');
      return true;
    }
    if (action === 'breakdown') return openBreakdown(Number(node.dataset.cue));
    if (action === 'gap') return openGap(Number(node.dataset.cue));
    if (action === 'toggle-hard') return toggleHard(Number(node.dataset.cue));
    if (action === 'check-gap') return checkGap();
    if (action === 'speak-panel') {
      if (state.panel && !EL.speak(state.panel.text)) window.alert('Озвучка недоступна в этом браузере.');
      return true;
    }
    if (action === 'save-panel') return savePanel();
    return false;
  }

  function onWord(node) {
    node.stop = true;
    const cueIndex = Number(node.dataset.cue);
    const wordIndex = Number(node.dataset.i);
    const cue = state.cues[cueIndex];
    if (!cue) return true;
    const event = window.event;
    if (event) event.stopPropagation();
    if (state.phraseMode || state.anchor) {
      if (!state.anchor || state.anchor.cue !== cueIndex) {
        state.anchor = { cue: cueIndex, index: wordIndex };
        state.selection = { cue: cueIndex, from: wordIndex, to: wordIndex };
        paintCues();
        return true;
      }
      const from = Math.min(state.anchor.index, wordIndex);
      const to = Math.max(state.anchor.index, wordIndex);
      state.selection = { cue: cueIndex, from: from, to: to };
      state.anchor = null;
      paintCues();
      openWord(selectedText(cue), cue);
      return true;
    }
    state.selection = { cue: cueIndex, from: wordIndex, to: wordIndex };
    paintCues();
    const part = EL.tokenize(cue.text).find(function (item) { return item.type === 'word' && item.index === wordIndex; });
    openWord(part ? part.raw : '', cue);
    return true;
  }

  function moveCue(action) {
    if (!state.cues.length) { setNote('Сначала загрузи субтитры.'); return true; }
    let idx = state.cueIndex < 0 ? 0 : state.cueIndex;
    if (action === 'cue-prev') idx = Math.max(0, idx - 1);
    if (action === 'cue-next') idx = Math.min(state.cues.length - 1, idx + 1);
    const cue = state.cues[idx];
    state.cueIndex = idx;
    state.latch = null;
    markStudied(cue);
    if (!seekTo(cue.start)) setNote('Видео не открыто — показываю реплику без перемотки.');
    else play();
    paintActive();
    paintOverlay();
    return true;
  }

  async function openBreakdown(index) {
    const cue = state.cues[index];
    if (!cue) return true;
    markStudied(cue);
    state.gap = null;
    state.panel = { text: cue.text, cue: cue, loading: true, breakdown: true, report: EL.analyzeLine(cue.text) };
    paintPanel();
    const info = await EL.lookupText(cue.text);
    if (!state.panel || state.panel.cue !== cue) return true;
    state.panel.info = info;
    state.panel.loading = false;
    paintPanel();
    return true;
  }

  function openGap(index) {
    const cue = state.cues[index];
    const word = cue && contentWord(cue);
    if (!word) { setNote('В реплике нет подходящего слова для пропуска.'); return true; }
    state.panel = null;
    state.gap = { cue: cue, word: word, message: '', ok: false };
    paintPanel();
    return true;
  }

  function checkGap() {
    const input = document.getElementById('gap-input');
    if (!state.gap || !input) return true;
    const ok = EL.canonical(input.value) === EL.canonical(state.gap.word.raw);
    state.gap.ok = ok;
    state.gap.message = ok ? 'Верно.' : 'Пока не то слово. Попробуй ещё раз.';
    const rec = record();
    if (rec) {
      const key = String(Math.round(state.gap.cue.start * 100) / 100);
      const prev = rec.gap[key] || { tries: 0, correct: false };
      rec.gap[key] = { tries: prev.tries + 1, correct: prev.correct || ok };
      EL.save();
    }
    markStudied(state.gap.cue);
    paintPanel();
    const again = document.getElementById('gap-input');
    if (again) again.focus();
    return true;
  }

  function toggleHard(index) {
    const cue = state.cues[index];
    const rec = record();
    if (!cue || !rec) { setNote('Сначала открой видео или файл субтитров.'); return true; }
    const key = Math.round(cue.start * 100) / 100;
    const exists = rec.difficult.findIndex(function (line) { return Math.round(line.start * 100) / 100 === key; });
    if (exists >= 0) rec.difficult.splice(exists, 1);
    else rec.difficult.push({ start: cue.start, end: cue.end, text: cue.text.slice(0, 500) });
    rec.updatedAt = new Date().toISOString();
    EL.save();
    paintCues();
    const hard = document.getElementById('hard-list');
    if (hard) hard.innerHTML = difficultHtml();
    return true;
  }

  function savePanel() {
    const panel = state.panel;
    if (!panel || panel.breakdown) return true;
    const info = panel.info || {};
    const rec = record();
    const added = EL.addWord({
      en: panel.text,
      ru: info.ru || '',
      source: 'cinema',
      context: panel.cue ? panel.cue.text : '',
      sourceDetail: (rec ? rec.title : 'Cinema Lab') + (panel.cue ? ' · ' + EL.formatTime(panel.cue.start) : ''),
      auto: false
    });
    if (!added.ok && added.reason === 'duplicate') { setNote('Уже есть в словаре.'); return true; }
    if (added.ok) {
      const word = added.word;
      if (info.definition) word.definition = info.definition;
      if (info.pos) word.pos = info.pos;
      if (info.phonetic) word.phonetic = info.phonetic;
      EL.save();
      setNote(info.ru ? 'Добавлено в словарь.' : 'Добавлено без перевода — впиши его в словаре.');
    }
    return true;
  }

  function onCinemaChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (event.target.id === 'video-file') {
      stopYouTube();
      if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
      const id = 'file:' + file.name + ':' + file.size;
      ensureVideo(id, { title: file.name, sourceType: 'file', fileName: file.name });
      state.objectUrl = URL.createObjectURL(file);
      const wrap = document.getElementById('yt-wrap');
      if (wrap) wrap.hidden = true;
      if (state.poll) clearInterval(state.poll);
      const video = document.getElementById('local-video');
      video.hidden = false;
      video.src = state.objectUrl;
      video.playbackRate = state.speed;
      bindLocal(video);
      const rec = record();
      if (rec && rec.lastPosition) video.currentTime = rec.lastPosition;
      restoreSubs(id).then(function () {
        if (!state.cues.length) setNote('Видео открыто только в браузере. Добавь субтитры, если они есть.');
        else setNote('Видео и локальные субтитры на месте.');
      });
      const host = document.getElementById('saved-videos');
      if (host) host.innerHTML = savedHtml();
    }
    if (event.target.id === 'sub-file') onSubFile(file);
  }

  EL.renderCinema = renderCinema;
  EL.destroyCinema = destroyCinema;
  EL.onCinemaClick = onCinemaClick;
  EL.onCinemaChange = onCinemaChange;
})();
