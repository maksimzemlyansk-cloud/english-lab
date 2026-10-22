(function () {
  const EL = window.EL;

  function words() {
    return EL.state.data.words;
  }

  function learnList() {
    return words().filter(function (word) { return word.stage === 'learn'; });
  }

  function current() {
    const id = (EL.ui.learnQueue || [])[EL.ui.learnIndex || 0];
    return words().find(function (word) { return word.id === id; }) || null;
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function choices(correct, field) {
    const pool = [];
    (EL.STARTER || []).forEach(function (item) {
      if (item[field] && item[field] !== correct) pool.push(item[field]);
    });
    words().forEach(function (word) {
      if (word[field] && word[field] !== correct) pool.push(word[field]);
    });
    const uniq = [];
    pool.forEach(function (item) { if (uniq.indexOf(item) === -1) uniq.push(item); });
    const picked = shuffle(uniq).slice(0, 3);
    const spot = Math.floor(Math.random() * (picked.length + 1));
    picked.splice(spot, 0, correct);
    return picked;
  }

  function credit(image) {
    if (!image) return '';
    if (image.kind === 'local') return '<p class="credit">Своя картинка. Файл лежит только на этом устройстве и не уходит в Google Диск.</p>';
    const bits = [];
    if (image.creator) bits.push(EL.esc(image.creator));
    if (image.license) bits.push(EL.esc(image.license));
    if (image.source) bits.push(EL.esc(image.source));
    let links = '';
    if (image.sourceUrl) links += ' <a href="' + EL.esc(image.sourceUrl) + '" target="_blank" rel="noopener">источник</a>';
    if (image.licenseUrl) links += ' <a href="' + EL.esc(image.licenseUrl) + '" target="_blank" rel="noopener">лицензия</a>';
    const line = bits.join(' · ');
    return '<p class="credit">' + (line || 'Автор и лицензия не указаны') + links + '</p><p class="credit">Openverse и Wikimedia не проверяют лицензию за тебя. Картинка — только ассоциация к слову.</p>';
  }

  function imageBlock(word) {
    if (!word.image) return '';
    const remote = word.image.kind !== 'local' && EL.safeImageUrl(word.image.url);
    if (!remote && word.image.kind !== 'local') return '';
    const alt = word.image.title || word.en;
    return '<img id="assoc-img" class="assoc" alt="' + EL.esc(alt) + '" hidden>' + credit(word.image);
  }

  function thumbs() {
    const rows = EL.ui.imageChoices || [];
    if (!rows.length) return '';
    return '<div class="thumbs">' + rows.map(function (item, index) {
      return '<button class="thumbbtn" data-action="pick-image" data-index="' + index + '" title="' + EL.esc(item.title || '') + '"><img alt="" data-thumb="' + index + '"></button>';
    }).join('') + '</div>';
  }

  function hydrate(word) {
    const img = document.querySelector('#assoc-img');
    if (img && word && word.image) {
      const show = function (url) {
        if (!url) { img.remove(); return; }
        img.onload = function () { img.hidden = false; };
        img.onerror = function () { img.remove(); };
        img.src = url;
      };
      if (word.image.kind === 'local') {
        EL.loadLocalImage(word.id).then(function (data) {
          const node = document.querySelector('#assoc-img');
          if (!node) return;
          if (data && /^data:image\/jpeg;base64,/i.test(data)) show(data);
          else node.remove();
        });
      } else show(EL.safeImageUrl(word.image.url));
    }
    document.querySelectorAll('[data-thumb]').forEach(function (node) {
      const item = (EL.ui.imageChoices || [])[Number(node.dataset.thumb)];
      const url = item && (EL.safeImageUrl(item.thumb) || EL.safeImageUrl(item.url));
      if (url) node.src = url;
    });
  }

  function fillLookup(word) {
    if (!word) return;
    EL.ui.lookupTried = EL.ui.lookupTried || {};
    if (EL.ui.lookupTried[word.id] || (word.audio && word.phonetic && word.ru)) return;
    EL.ui.lookupTried[word.id] = true;
    EL.lookupText(word.en).then(function (info) {
      const live = words().find(function (item) { return item.id === word.id; });
      if (!live) return;
      if (info.audio && !live.audio) live.audio = info.audio;
      if (info.phonetic && !live.phonetic) live.phonetic = info.phonetic;
      if (info.definition && !live.definition) live.definition = info.definition;
      if (info.pos && !live.pos) live.pos = info.pos;
      if (info.ru && !live.ru) live.ru = info.ru;
      EL.save();
      const typing = document.activeElement && document.activeElement.id === 'mnemonic';
      if (!typing && EL.ui.vocabView === 'learn' && current() && current().id === live.id && EL.ui.learnPhase === 'see') EL.render();
    });
  }

  function renderLobby() {
    const queued = learnList();
    const rows = queued.length ? queued.map(function (word) {
      return '<div class="word"><div><strong>' + EL.esc(word.en) + '</strong><div class="muted">' + EL.esc(word.ru || 'перевод не задан') + '</div></div><button class="button small" data-action="drop-learn" data-id="' + EL.esc(word.id) + '">Убрать из очереди</button></div>';
    }).join('') : '<div class="empty">Очередь пуста. Добавь слова из стартового набора или кнопкой «В заучивание».</div>';
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Новые слова</div><h1>Заучивание</h1><p class="muted">Это не повторение. Слово попадает в обычное расписание только после партии: карточка, озвучка и три проверки. В одной партии до 10 слов.</p></section>' +
      '<section class="card"><div class="inline"><button class="button primary" data-action="start-batch" data-size="5"' + (queued.length ? '' : ' disabled') + '>Начать 5</button><button class="button" data-action="start-batch" data-size="10"' + (queued.length ? '' : ' disabled') + '>Начать 10</button><button class="button" data-action="open-starter">Стартовый набор</button><button class="button" data-action="vocab-list">К словарю</button></div><p class="muted small">В очереди: ' + queued.length + '.</p></section>' +
      '<section class="card">' + rows + '</section>';
  }

  function renderSummary() {
    const done = EL.ui.learnDone || [];
    const missed = EL.ui.learnMissed || [];
    const line = function (id) {
      const word = words().find(function (item) { return item.id === id; });
      return word ? '<li>' + EL.esc(word.en) + '</li>' : '';
    };
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Партия</div><h1>Готово</h1><p class="muted">Верные слова ушли в обычное повторение. Первый срок — завтра. Остальные остаются в заучивании, прогресс по ним не записан.</p></section>' +
      '<section class="card"><h2>В повторении</h2>' + (done.length ? '<ul class="list">' + done.map(line).join('') + '</ul>' : '<p class="muted">Ни одно слово не закрыто.</p>') + '</section>' +
      '<section class="card"><h2>Ещё в заучивании</h2>' + (missed.length ? '<ul class="list">' + missed.map(line).join('') + '</ul>' : '<p class="muted">Все слова этой партии закрыты.</p>') + '</section>' +
      '<div class="inline"><button class="button primary" data-action="open-learn">Ещё партию</button><button class="button" data-action="vocab-list">К словарю</button></div>';
  }

  function renderCard() {
    const word = current();
    const queue = EL.ui.learnQueue || [];
    if (!word) { renderSummary(); return; }
    const phase = EL.ui.learnPhase || 'see';
    const head = '<section class="hero"><div class="eyebrow">Заучивание · ' + (EL.ui.learnIndex + 1) + ' из ' + queue.length + '</div><h1>' + (phase === 'see' ? 'Карточка' : 'Проверка') + '</h1></section>';
    let body = '';
    if (phase === 'see') {
      body = '<p class="learn-en">' + EL.esc(word.en) + '</p>' +
        (word.phonetic ? '<p class="phonetic">' + EL.esc(word.phonetic) + '</p>' : '') +
        '<p class="prompt">' + EL.esc(word.ru || 'Перевод не задан') + '</p>' +
        (word.context ? '<p class="muted">Пример' + (word.source === 'lesson' ? ' из урока' : word.source === 'cinema' ? ' из Cinema Lab' : '') + ': ' + EL.esc(word.context) + '</p>' : '<p class="muted small">Примера пока нет.</p>') +
        imageBlock(word) + thumbs() +
        '<p id="image-note" class="muted small">' + EL.esc(EL.ui.imageNote || '') + '</p>' +
        '<label class="small muted" for="mnemonic">Моя ассоциация</label><textarea id="mnemonic" class="answer" maxlength="500" placeholder="Своя зацепка, не проверка">' + EL.esc(word.mnemonic || '') + '</textarea>' +
        '<div class="inline"><button class="button" data-action="pronounce">Слушать</button><button class="button" data-action="pronounce" data-slow="1">Медленно</button><button class="button" data-action="find-image">Найти картинку</button><label class="button" for="own-image">Свой файл</label><input hidden id="own-image" type="file" accept="image/*"></div>' +
        '<p class="muted small">' + (EL.ui.learnHeard ? 'Можно идти к проверке.' : 'Сначала послушай слово.') + (EL.ui.learnVoice === 'voice' ? ' Играет голос браузера: файла словаря нет.' : '') + (EL.ui.learnVoice === false ? ' Озвучка недоступна.' : '') + '</p>' +
        '<div class="inline"><button class="button primary" data-action="learn-next"' + (EL.ui.learnHeard ? '' : ' disabled') + '>Дальше</button></div>';
    } else if (phase === 'meaning') {
      body = '<p class="learn-en">' + EL.esc(word.en) + '</p><p class="muted">Какой перевод?</p><div class="choice-list">' + (EL.ui.learnChoices || []).map(function (item, index) {
        return '<button class="button" data-action="pick-choice" data-index="' + index + '">' + EL.esc(item) + '</button>';
      }).join('') + '</div>' + note();
    } else if (phase === 'type') {
      body = '<p class="prompt">' + EL.esc(word.ru || word.en) + '</p><p class="muted">Напиши по-английски. Одна-две лишние буквы ещё засчитываются.</p><input id="learn-type" class="answer" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off">' + note() + '<div class="inline"><button class="button primary" data-action="check-type">Проверить</button></div>';
    } else {
      body = '<p class="muted">Слушай и выбери слово.</p><div class="inline"><button class="button" data-action="pronounce">Ещё раз</button><button class="button" data-action="pronounce" data-slow="1">Медленно</button></div><div class="choice-list">' + (EL.ui.learnChoices || []).map(function (item, index) {
        return '<button class="button" data-action="pick-choice" data-index="' + index + '">' + EL.esc(item) + '</button>';
      }).join('') + '</div>' + note();
    }
    EL.app.innerHTML = head + '<section class="card">' + body + '</section><button class="button" data-action="open-learn">Прервать</button>';
    hydrate(word);
    if (phase === 'listen' && !EL.ui.learnPlayed) {
      EL.ui.learnPlayed = true;
      play(false);
    }
    if (phase === 'see') fillLookup(word);
  }

  function note() {
    if (!EL.ui.learnNote) return '';
    return '<div class="feedback ' + (EL.ui.learnNoteOk ? 'good' : 'bad') + '">' + EL.esc(EL.ui.learnNote) + '</div>' +
      (EL.ui.learnHold ? '<button class="button" data-action="learn-next">Дальше</button>' : '');
  }

  function renderStarter() {
    const rows = (EL.STARTER || []).map(function (item) {
      const have = EL.findWord(item.en);
      const label = !have ? 'В очередь' : (have.stage === 'learn' ? 'Уже в очереди' : 'Уже в словаре');
      return '<div class="word"><div><strong>' + EL.esc(item.en) + '</strong> <span class="pill">стартовый набор</span><div class="muted">' + EL.esc(item.ru) + '</div><div class="small muted">' + EL.esc(item.context) + '</div></div>' +
        (have ? '<span class="small muted">' + label + '</span>' : '<button class="button small" data-action="add-starter" data-en="' + EL.esc(item.en) + '">В очередь</button>') + '</div>';
    }).join('');
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Не прогресс</div><h1>Стартовый набор</h1><p class="muted">' + EL.STARTER.length + ' частых слов и фраз про поездку и общение. Список сам по себе ничего не записывает в словарь и не двигает повторение. Слово появится только после «В очередь».</p></section>' +
      '<section class="card"><div class="inline"><button class="button primary" data-action="add-starter-all">Добавить все новые</button><button class="button" data-action="open-learn">К заучиванию</button><button class="button" data-action="vocab-list">К словарю</button></div><p class="notice">Это не оценка уровня. Переводы в списке заданы вручную, картинки подтянутся в карточке, если сервис ответит.</p></section><section class="card">' + rows + '</section>';
  }

  function renderMemorize() {
    if (EL.ui.learnPhase === 'summary') { renderSummary(); return; }
    if (EL.ui.learnActive) { renderCard(); return; }
    renderLobby();
  }

  function startBatch(size) {
    const queued = learnList().slice(0, Number(size) || 5);
    if (!queued.length) return;
    EL.ui.learnQueue = queued.map(function (word) { return word.id; });
    EL.ui.learnIndex = 0;
    EL.ui.learnPhase = 'see';
    EL.ui.learnActive = true;
    EL.ui.learnMissedIds = {};
    EL.ui.learnHeard = false;
    EL.ui.learnVoice = '';
    EL.ui.learnNote = '';
    EL.ui.learnHold = false;
    EL.ui.learnTries = 0;
    EL.ui.imageChoices = [];
    EL.ui.imageNote = '';
    EL.ui.learnPlayed = false;
    EL.render();
  }

  function miss() {
    const word = current();
    if (word) EL.ui.learnMissedIds[word.id] = true;
  }

  function advance() {
    const phases = ['see', 'meaning', 'type', 'listen'];
    const phase = EL.ui.learnPhase;
    const at = phases.indexOf(phase);
    EL.ui.learnNote = '';
    EL.ui.learnHold = false;
    EL.ui.learnTries = 0;
    if (at < phases.length - 1) {
      EL.ui.learnPhase = phases[at + 1];
      const word = current();
      if (EL.ui.learnPhase === 'meaning') EL.ui.learnChoices = choices(word.ru || word.en, 'ru');
      if (EL.ui.learnPhase === 'listen') {
        EL.ui.learnChoices = choices(word.en, 'en');
        EL.ui.learnPlayed = false;
      }
      EL.render();
      return;
    }
    EL.ui.learnIndex += 1;
    if (EL.ui.learnIndex >= EL.ui.learnQueue.length) finish();
    else {
      EL.ui.learnPhase = 'see';
      EL.ui.learnHeard = false;
      EL.ui.learnVoice = '';
      EL.ui.imageChoices = [];
      EL.ui.imageNote = '';
      EL.render();
    }
  }

  function finish() {
    const done = [];
    const missed = [];
    (EL.ui.learnQueue || []).forEach(function (id) {
      if (EL.ui.learnMissedIds[id]) missed.push(id);
      else done.push(id);
    });
    done.forEach(function (id) {
      const word = words().find(function (item) { return item.id === id; });
      if (!word) return;
      word.stage = 'review';
      if (!word.reps) EL.grade(id, 'good');
      else EL.save();
    });
    EL.ui.learnDone = done;
    EL.ui.learnMissed = missed;
    EL.ui.learnActive = false;
    EL.ui.learnPhase = 'summary';
    EL.render();
  }

  function play(slow) {
    const word = current();
    if (!word) return Promise.resolve(false);
    return EL.pronounce(word.en, { audio: word.audio, slow: !!slow }).then(function (mode) {
      EL.ui.learnHeard = true;
      EL.ui.learnVoice = mode;
      if (EL.ui.learnPhase === 'see') EL.render();
      return mode;
    }).catch(function () {
      EL.ui.learnHeard = true;
      EL.ui.learnVoice = false;
      if (EL.ui.learnPhase === 'see') EL.render();
      return false;
    });
  }

  function addStarter(item) {
    return EL.addWord({
      en: item.en,
      ru: item.ru,
      context: item.context,
      source: 'starter',
      sourceDetail: 'Стартовый набор',
      stage: 'learn',
      imageQuery: item.imageQuery || item.en,
      auto: false
    });
  }

  function onMemorizeClick(action, node) {
    if (action === 'open-learn') {
      EL.ui.vocabView = 'learn';
      EL.ui.learnActive = false;
      EL.ui.learnPhase = '';
      EL.render();
      return true;
    }
    if (action === 'open-starter') {
      EL.ui.vocabView = 'starter';
      EL.render();
      return true;
    }
    if (action === 'start-batch') { startBatch(node.dataset.size); return true; }
    if (action === 'drop-learn') {
      const word = words().find(function (item) { return item.id === node.dataset.id; });
      if (word) { word.stage = 'review'; EL.save(); }
      EL.render();
      return true;
    }
    if (action === 'add-starter') {
      const item = (EL.STARTER || []).find(function (row) { return row.en === node.dataset.en; });
      if (item) addStarter(item);
      EL.render();
      return true;
    }
    if (action === 'add-starter-all') {
      (EL.STARTER || []).slice().reverse().forEach(function (item) {
        if (!EL.findWord(item.en)) addStarter(item);
      });
      EL.render();
      return true;
    }
    if (action === 'pronounce') { play(node.dataset.slow === '1'); return true; }
    if (action === 'learn-next') {
      if (EL.ui.learnPhase === 'see' && !EL.ui.learnHeard) return true;
      advance();
      return true;
    }
    if (action === 'pick-choice') {
      if (EL.ui.learnHold) return true;
      const choice = (EL.ui.learnChoices || [])[Number(node.dataset.index)];
      const word = current();
      const phase = EL.ui.learnPhase;
      const correct = phase === 'meaning' ? (word.ru || word.en) : word.en;
      if (choice === correct) advance();
      else {
        miss();
        EL.ui.learnNote = phase === 'meaning' ? 'Верный перевод: ' + (word.ru || 'не задан') : 'Это «' + word.en + '».';
        EL.ui.learnNoteOk = false;
        EL.ui.learnHold = true;
        EL.render();
      }
      return true;
    }
    if (action === 'check-type') {
      const word = current();
      const input = document.querySelector('#learn-type');
      const value = input ? input.value : '';
      if (EL.closeEnough(value, word.en)) { advance(); return true; }
      EL.ui.learnTries = (EL.ui.learnTries || 0) + 1;
      if (EL.ui.learnTries >= 2) {
        miss();
        EL.ui.learnNote = 'Нужно: ' + word.en;
        EL.ui.learnHold = true;
      } else EL.ui.learnNote = 'Не совпало. Проверь буквы и попробуй ещё раз.';
      EL.ui.learnNoteOk = false;
      EL.render();
      return true;
    }
    if (action === 'find-image') {
      const word = current();
      if (!word) return true;
      EL.ui.imageNote = 'Ищу открытую картинку…';
      EL.render();
      const query = word.imageQuery || word.en;
      EL.searchImages(query).then(function (items) {
        EL.ui.imageChoices = items;
        EL.ui.imageNote = items.length ? 'Выбери картинку. Под ней будет автор и лицензия.' : 'Картинки нет. Слово можно учить без неё или загрузить свою.';
        if (EL.ui.vocabView === 'learn') EL.render();
      });
      return true;
    }
    if (action === 'pick-image') {
      const word = current();
      const item = (EL.ui.imageChoices || [])[Number(node.dataset.index)];
      if (word && item) {
        word.image = item;
        EL.save();
        EL.ui.imageChoices = [];
        EL.ui.imageNote = '';
      }
      EL.render();
      return true;
    }
    return false;
  }

  async function onOwnImage(file) {
    const word = current();
    const note = function (text) { EL.ui.imageNote = text; EL.render(); };
    if (!word || !file) return;
    try {
      const data = await EL.compressImage(file);
      await EL.saveLocalImage(word.id, data);
      word.image = { kind: 'local', source: 'own', title: 'Своя картинка' };
      EL.save();
      EL.ui.imageNote = '';
      EL.ui.imageChoices = [];
      EL.render();
    } catch (err) {
      note(err && err.message === 'size' ? 'Файл всё ещё слишком большой после сжатия.' : 'Этот файл не получилось сделать картинкой.');
    }
  }

  function onMemorizeInput(event) {
    if (event.target.id !== 'mnemonic') return;
    const word = current();
    if (!word) return;
    word.mnemonic = event.target.value.slice(0, 500);
    EL.save();
  }

  function onMemorizePaste(event) {
    if (EL.ui.vocabView !== 'learn' || EL.ui.learnPhase !== 'see') return;
    const items = event.clipboardData && event.clipboardData.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.indexOf('image') === 0) {
        event.preventDefault();
        onOwnImage(items[i].getAsFile());
        return;
      }
    }
  }

  EL.renderMemorize = renderMemorize;
  EL.renderStarter = renderStarter;
  EL.onMemorizeClick = onMemorizeClick;
  EL.onMemorizeInput = onMemorizeInput;
  EL.onMemorizePaste = onMemorizePaste;
  EL.onOwnImage = onOwnImage;
})();
