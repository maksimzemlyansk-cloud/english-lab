(function () {
  const EL = window.EL;
  const app = document.querySelector('#app');
  EL.app = app;
  EL.ui = {
    page: 'home',
    learnView: 'list',
    activeLesson: 1,
    vocabView: 'list',
    reviewQueue: [],
    reviewIndex: 0,
    reviewRevealed: false,
    editWordId: ''
  };
  EL.load();

  const navItems = [
    ['home', 'Главная', '⌂'],
    ['learn', 'Уроки', '▤'],
    ['vocabulary', 'Слова', '▧'],
    ['cinema', 'Кино', '▶'],
    ['progress', 'Прогресс', '⌁'],
    ['settings', 'Ещё', '⚙']
  ];

  function badge() {
    const node = document.querySelector('.badge');
    if (!node) return;
    node.textContent = localStorage.getItem(EL.DRIVE_ENABLED_KEY) === 'true' ? 'Google Диск · синхронизация' : 'Локально · без аккаунта';
  }

  function nav() {
    [document.querySelector('.side'), document.querySelector('.mobile-nav')].forEach(function (host) {
      host.innerHTML = navItems.map(function (item) {
        const id = item[0];
        const label = item[1];
        const icon = item[2];
        return '<button class="navbtn' + (EL.ui.page === id ? ' active' : '') + '" data-page="' + id + '"><span aria-hidden="true">' + icon + '</span> ' + label + '</button>';
      }).join('');
    });
  }

  function renderHome() {
    const data = EL.state.data;
    const lesson = EL.getLesson(data.currentLesson);
    const due = EL.dueWords().length;
    const learning = data.words.filter(function (word) { return word.stage === 'learn'; }).length;
    const videos = Object.keys(data.cinema.videos).length;
    app.innerHTML = '<section class="hero"><div class="eyebrow">Американский английский</div><h1>Урок ' + lesson.id + '. ' + EL.esc(lesson.title) + '</h1><p class="muted">Короткий шаг за раз. Прогресс остаётся в этом браузере. «Продолжить» открывает текущий урок, сейчас это урок ' + lesson.id + '.</p></section>' +
      '<section class="card"><div class="row"><div><div class="eyebrow">Сейчас</div><h2>' + EL.esc(lesson.subtitle) + '</h2><p class="muted">Сессия ' + data.settings.dailyMinutes + ' мин · к повторению слов: ' + due + '</p></div><span class="pill">' + EL.esc(lesson.title) + '</span></div><div class="inline"><button class="button primary" data-action="continue">Продолжить</button><button class="button" data-page="learn">Все уроки</button></div></section>' +
      '<h2 class="section-title">На этом устройстве</h2><div class="grid"><section class="card"><div class="muted small">Слов к повторению</div><div class="stat">' + due + '</div><div class="muted small">в заучивании: ' + learning + '</div><button class="button" data-page="vocabulary">Словарь</button></section><section class="card"><div class="muted small">Видео в Cinema Lab</div><div class="stat">' + videos + '</div><button class="button" data-page="cinema">Открыть кино</button></section></div>';
  }

  function renderProgress() {
    const data = EL.state.data;
    const answers = data.answers || [];
    const rows = EL.LESSONS.map(function (lesson) {
      const items = answers.filter(function (item) { return Number(item.lesson) === lesson.id && typeof item.correct === 'boolean'; });
      if (!items.length) return '<li>Урок ' + lesson.id + ': попыток пока нет.</li>';
      const correct = items.filter(function (item) { return item.correct; }).length;
      return '<li>Урок ' + lesson.id + ': ' + correct + ' верных из ' + items.length + ' попыток (' + Math.round(100 * correct / items.length) + '%).</li>';
    }).join('');
    const cats = {};
    answers.forEach(function (item) {
      if (item.correct || !item.category) return;
      cats[item.category] = (cats[item.category] || 0) + 1;
    });
    const top = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 5);
    const videos = Object.keys(data.cinema.videos).map(function (id) { return data.cinema.videos[id]; });
    const lines = videos.reduce(function (sum, video) { return sum + (video.linesStudied || 0); }, 0);
    const reviewed = data.words.filter(function (word) { return word.reps > 0 && word.stage !== 'learn'; }).length;
    const learning = data.words.filter(function (word) { return word.stage === 'learn'; }).length;
    app.innerHTML = '<section class="hero"><div class="eyebrow">Только сохранённые данные</div><h1>Прогресс</h1><p class="muted">Цифры из этого браузера. Приложение не определяет уровень языка.</p></section>' +
      '<div class="grid"><section class="card"><div class="muted small">Попытки</div><div class="stat">' + answers.length + '</div></section><section class="card"><div class="muted small">Слова в словаре</div><div class="stat">' + data.words.length + '</div><div class="muted small">к повторению сегодня: ' + EL.dueWords().length + ' · уже оценивал: ' + reviewed + ' · в заучивании: ' + learning + '</div></section><section class="card"><div class="muted small">Cinema Lab</div><div class="stat">' + videos.length + '</div><div class="muted small">разобранных реплик: ' + lines + '</div></section><section class="card"><div class="muted small">Текущий урок</div><div class="stat">' + data.currentLesson + '</div></section></div>' +
      '<section class="card"><h2>Уроки</h2><ul class="list">' + rows + '</ul></section>' +
      '<section class="card"><h2>Частые ошибки</h2>' + (top.length ? '<ul class="list">' + top.map(function (name) { return '<li>' + EL.esc(name) + ' · ' + cats[name] + '</li>'; }).join('') + '</ul>' : '<div class="empty">Ошибок с категорией пока нет.</div>') + '</section>';
  }

  function renderSettings() {
    const data = EL.state.data;
    const enabled = localStorage.getItem(EL.DRIVE_ENABLED_KEY) === 'true';
    const minutes = [5, 20, 40].map(function (value) {
      const on = data.settings.dailyMinutes === value ? ' primary' : '';
      return '<button class="button' + on + '" data-action="minutes" data-minutes="' + value + '">' + value + ' мин</button>';
    }).join('');
    app.innerHTML = '<section class="hero"><div class="eyebrow">Настройки</div><h1>Данные и занятие</h1><p class="muted">Прогресс хранится на устройстве. Google Диск — по желанию, один файл приложения.</p></section>' +
      '<section class="card"><h2>Длина сессии</h2><p class="muted small">5 минут — 3 задания, 20 минут — 6, 40 минут — все 8. Повторение, объяснение и своя фраза остаются.</p><div class="inline">' + minutes + '</div></section>' +
      '<section class="card"><h2>Google Диск</h2><p>Приложение создаёт файл <code>' + EL.DRIVE_FILE_NAME + '</code> и видит только файлы, которые само создало. Разрешение <code>drive.file</code>.</p><button class="button primary" data-action="drive-connect">' + (enabled ? 'Подключить / синхронизировать' : 'Подключить Google Диск') + '</button><p id="drive-status" class="muted small">' + (enabled ? 'Синхронизация включена в этом браузере.' : 'Синхронизация выключена.') + '</p><p id="settings-message" class="muted small"></p></section>' +
      '<section class="card"><h2>Резервная копия</h2><div class="inline"><button class="button" data-action="export">Скачать копию</button><label class="button" for="import-file">Восстановить из копии</label><input hidden id="import-file" type="file" accept="application/json"></div><p class="notice">В копии нет полного текста субтитров. Есть прогресс уроков, словарь и заметки Cinema Lab.</p></section>' +
      '<section class="card"><h2>Словарь, озвучка и картинки</h2><ul class="list"><li>dictionaryapi.dev — определение, часть речи, транскрипция и аудиофайл. Бесплатно, без ключа. Официального лимита нет; сервис на пожертвованиях и может молчать. Если файла нет, слово читает голос браузера en-US. «Медленно» замедляет файл или голос.</li><li>MyMemory — перевод en→ru. Без ключа около 5000 символов в день на IP, до 500 байт за запрос. Текст уходит на их сервер. Перевод может быть неточным.</li><li>Картинки: Openverse (анонимно, без ключа; ориентир 20 запросов в минуту и 200 в день, точные числа в заголовках X-RateLimit и могут меняться) и, если он молчит, Wikimedia Commons. Оба отдают чужие свободные файлы. Под картинкой — автор и лицензия. Сервисы лицензию не гарантируют.</li><li>Своя картинка сжимается и лежит в браузере. В Google Диск и в файл копии она не попадает.</li><li>Офлайн перевод, словарь и поиск картинок не работают. Уроки, свои слова и загруженные субтитры открываются.</li></ul></section>';
  }

  function render() {
    badge();
    nav();
    if (EL.ui.page !== 'cinema' && EL.cinemaMounted) EL.destroyCinema();
    if (EL.ui.page === 'home') renderHome();
    else if (EL.ui.page === 'learn') EL.renderLearn();
    else if (EL.ui.page === 'vocabulary') EL.renderVocab();
    else if (EL.ui.page === 'cinema') { if (!EL.cinemaMounted) EL.renderCinema(); }
    else if (EL.ui.page === 'progress') renderProgress();
    else renderSettings();
  }
  EL.render = render;

  function exportData() {
    const blob = new Blob([JSON.stringify(EL.exportPayload(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'english-lab-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  document.addEventListener('click', function (event) {
    const pageBtn = event.target.closest('[data-page]');
    if (pageBtn) {
      EL.ui.page = pageBtn.dataset.page;
      if (EL.ui.page === 'learn') EL.ui.learnView = 'list';
      if (EL.ui.page === 'vocabulary') EL.ui.vocabView = 'list';
      render();
      app.focus();
      return;
    }
    const node = event.target.closest('[data-action]');
    if (!node) return;
    const action = node.dataset.action;
    if (action === 'continue') { EL.openCurrentLesson(); return; }
    if (action === 'export') { exportData(); return; }
    if (action === 'drive-connect') { EL.connectDrive(); return; }
    if (action === 'minutes') {
      EL.state.data.settings.dailyMinutes = EL.snapMinutes(node.dataset.minutes);
      EL.save();
      render();
      return;
    }
    if (EL.ui.page === 'learn') EL.onLearnClick(action, node);
    else if (EL.ui.page === 'vocabulary') EL.onVocabClick(action, node);
    else if (EL.ui.page === 'cinema') EL.onCinemaClick(action, node);
  });

  document.addEventListener('input', function (event) {
    if (EL.ui.page === 'learn') EL.onLearnInput(event);
    if (EL.ui.page === 'vocabulary' && EL.onMemorizeInput) EL.onMemorizeInput(event);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    if (event.target.id === 'practice') { event.preventDefault(); EL.onLearnClick('check', event.target); }
    if (event.target.id === 'learn-type') { event.preventDefault(); EL.onMemorizeClick('check-type', event.target); }
    if (event.target.id === 'gap-input') { event.preventDefault(); EL.onCinemaClick('check-gap', event.target); }
  });

  document.addEventListener('paste', function (event) {
    if (EL.ui.page === 'vocabulary' && EL.onMemorizePaste) EL.onMemorizePaste(event);
  });

  document.addEventListener('change', async function (event) {
    if (event.target.id === 'own-image') {
      const file = event.target.files && event.target.files[0];
      if (file && EL.onOwnImage) await EL.onOwnImage(file);
      event.target.value = '';
      return;
    }
    if (event.target.id === 'import-file') {
      const file = event.target.files && event.target.files[0];
      const message = function (text) {
        const node = document.querySelector('#settings-message');
        if (node) node.textContent = text;
      };
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || !parsed.data || (parsed.version !== 1 && parsed.version !== 2)) throw new Error('format');
        EL.replaceData(parsed.data);
        message('Копия восстановлена на этом устройстве.');
        render();
      } catch (err) {
        message('Не удалось прочитать файл копии.');
      }
      return;
    }
    if (EL.ui.page === 'cinema') EL.onCinemaChange(event);
  });

  render();
  setTimeout(function () { EL.syncFromDrive(); }, 1800);
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(function () {});
  }
})();
