(function () {
  const EL = window.EL;
  const SOURCE = { manual: 'вручную', lesson: 'урок', cinema: 'Cinema Lab', starter: 'стартовый набор' };

  function renderVocab() {
    if (EL.ui.vocabView === 'review') renderReview();
    else if (EL.ui.vocabView === 'learn') EL.renderMemorize();
    else if (EL.ui.vocabView === 'starter') EL.renderStarter();
    else renderList();
  }

  function renderList() {
    const words = EL.state.data.words;
    const due = EL.dueWords().length;
    const learning = words.filter(function (word) { return word.stage === 'learn'; }).length;
    const rows = words.length ? words.map(function (word) {
      return '<div class="word"><div><strong>' + EL.esc(word.en) + '</strong> <span class="pill">' + EL.esc(SOURCE[word.source] || 'вручную') + '</span>' +
        '<div class="muted">' + (word.ru ? EL.esc(word.ru) : '<span class="warn-inline">Перевод не задан</span>') + '</div>' +
        (word.context ? '<div class="small muted">' + EL.esc(word.context) + '</div>' : '') +
        (word.sourceDetail ? '<div class="small muted">' + EL.esc(word.sourceDetail) + '</div>' : '') +
        '<div class="small muted">' + (word.stage === 'learn' ? 'В заучивании, ещё не в повторении.' : 'Повтор: ' + EL.esc(word.due || 'сегодня') + ' · интервал ' + (word.interval || 0) + ' дн.') + '</div></div>' +
        '<div class="inline">' +
        '<button class="button small" data-action="speak-word" data-en="' + EL.esc(word.en) + '">Слушать</button>' +
        '<button class="button small" data-action="edit-word" data-id="' + EL.esc(word.id) + '">Перевод</button>' +
        '<button class="button small" data-action="delete-word" data-id="' + EL.esc(word.id) + '">' + (word.auto ? 'Убрать' : 'Удалить') + '</button></div></div>';
    }).join('') : '<div class="empty">Словарь пуст. Добавь слово или ошибись в уроке — тогда слово предложится само.</div>';
    const editing = EL.ui.editWordId ? words.find(function (word) { return word.id === EL.ui.editWordId; }) : null;
    const editor = editing ? '<section class="card"><h2>Перевод для «' + EL.esc(editing.en) + '»</h2><input id="edit-ru" class="answer" value="' + EL.esc(editing.ru || '') + '" placeholder="Русский перевод"><div class="inline"><button class="button primary" data-action="save-ru" data-id="' + EL.esc(editing.id) + '">Сохранить</button></div></section>' : '';
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Личный словарь</div><h1>Слова</h1><p class="muted">К повторению сегодня: <strong>' + due + '</strong>. В заучивании: <strong>' + learning + '</strong>. Перевод из бесплатных сервисов может быть неточным. Если сервис молчит, впиши перевод сам.</p></section>' +
      '<section class="card"><div class="row"><h2>Повторение</h2><button class="button primary" data-action="start-review"' + (due ? '' : ' disabled') + '>Повторение (' + due + ')</button></div><p class="muted small">Уже выученные карточки: английское слово → вспомни значение → Не помню / Трудно / Помню. Слова из заучивания сюда не попадают.</p></section>' +
      '<section class="card"><div class="row"><h2>Заучивание</h2><button class="button primary" data-action="open-learn">Заучивание (' + learning + ')</button></div><p class="muted small">Новые слова партиями по 5 или 10: карточка, озвучка, три проверки. После партии слово идёт в обычное расписание.</p><button class="button" data-action="open-starter">Стартовый набор</button></section>' +
      '<section class="card"><h2>Добавить вручную</h2><div class="formrow"><input id="word-en" class="answer" placeholder="Английское слово" autocapitalize="off" autocorrect="off"><input id="word-ru" class="answer" placeholder="Перевод, если знаешь"><button class="button primary" data-action="add-word">В словарь</button></div><div class="inline"><button class="button" data-action="add-learn">В заучивание</button></div><p id="vocab-msg" class="muted small"></p><p class="notice">Можно оставить перевод пустым: приложение спросит словарь. Это не ИИ-проверка. «В заучивание» не ставит слово в сегодняшнее повторение.</p></section>' +
      editor + '<section class="card">' + rows + '</section>';
  }

  function renderReview() {
    const queue = EL.ui.reviewQueue || [];
    const index = EL.ui.reviewIndex || 0;
    if (!queue.length || index >= queue.length) {
      EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Повторение</div><h1>На сегодня всё</h1><p class="muted">Карточек к сроку не осталось. Новые появятся в день, который записан у слова.</p></section><button class="button" data-action="vocab-list">К словарю</button>';
      return;
    }
    const word = EL.state.data.words.find(function (item) { return item.id === queue[index]; });
    if (!word) { EL.ui.reviewIndex += 1; renderReview(); return; }
    const revealed = EL.ui.reviewRevealed;
    const face = revealed
      ? '<p class="prompt">' + EL.esc(word.ru || 'Перевод не задан') + '</p>' +
        (word.context ? '<p class="muted">' + EL.esc(word.context) + '</p>' : '') +
        (word.definition ? '<p class="small">' + EL.esc(EL.posRu(word.pos)) + (word.pos ? ' · ' : '') + EL.esc(word.definition) + '</p>' : '') +
        (word.phonetic ? '<p class="small muted">' + EL.esc(word.phonetic) + '</p>' : '') +
        '<div class="grades"><button class="button" data-action="grade" data-grade="again">Не помню</button><button class="button" data-action="grade" data-grade="hard">Трудно</button><button class="button primary" data-action="grade" data-grade="good">Помню</button></div>'
      : '<button class="button primary" data-action="reveal-card">Показать перевод</button>';
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Повторение</div><h1>' + (index + 1) + ' из ' + queue.length + '</h1></section><section class="card"><p class="prompt">' + EL.esc(word.en) + '</p><div class="inline"><button class="button" data-action="speak-word" data-en="' + EL.esc(word.en) + '">Слушать</button><span class="pill">' + EL.esc(SOURCE[word.source] || 'вручную') + '</span></div>' + face + '</section><button class="button" data-action="vocab-list">К словарю</button>';
  }

  async function addManual(stage) {
    const enInput = document.querySelector('#word-en');
    const ruInput = document.querySelector('#word-ru');
    const msg = document.querySelector('#vocab-msg');
    const en = enInput.value.trim();
    let ru = ruInput.value.trim();
    if (!en) { enInput.focus(); return; }
    if (!ru) {
      if (msg) msg.textContent = 'Ищу перевод…';
      const info = await EL.lookupText(en);
      if (info.offline) { if (msg) msg.textContent = 'Офлайн. Впиши перевод сам.'; ruInput.focus(); return; }
      if (info.ru) ru = info.ru;
      else { if (msg) msg.textContent = 'Сервис не ответил. Впиши перевод сам.'; ruInput.focus(); return; }
    }
    const added = EL.addWord({ en: en, ru: ru, source: 'manual', auto: false, stage: stage === 'learn' ? 'learn' : 'review' });
    if (!added.ok && added.reason === 'duplicate') {
      if (msg) msg.textContent = 'Такое слово уже есть: «' + added.word.en + '».';
      return;
    }
    EL.lookupText(en).then(function (info) {
      const word = EL.state.data.words.find(function (item) { return item.id === added.word.id; });
      if (!word) return;
      if (info.definition) word.definition = info.definition;
      if (info.pos) word.pos = info.pos;
      if (info.phonetic) word.phonetic = info.phonetic;
      if (info.ru && !word.ru) word.ru = info.ru;
      if (info.audio) word.audio = info.audio;
      EL.save();
    });
    EL.render();
  }

  function onVocabClick(action, node) {
    if (EL.onMemorizeClick && EL.onMemorizeClick(action, node)) return true;
    if (action === 'start-review') {
      EL.ui.reviewQueue = EL.dueWords().map(function (word) { return word.id; });
      EL.ui.reviewIndex = 0;
      EL.ui.reviewRevealed = false;
      EL.ui.vocabView = 'review';
      EL.render();
      return true;
    }
    if (action === 'vocab-list') { EL.ui.vocabView = 'list'; EL.render(); return true; }
    if (action === 'add-word') { addManual('review'); return true; }
    if (action === 'add-learn') { addManual('learn'); return true; }
    if (action === 'delete-word') { EL.deleteWord(node.dataset.id); EL.render(); return true; }
    if (action === 'edit-word') { EL.ui.editWordId = node.dataset.id; EL.render(); return true; }
    if (action === 'save-ru') {
      const word = EL.state.data.words.find(function (item) { return item.id === node.dataset.id; });
      const input = document.querySelector('#edit-ru');
      if (word && input) { word.ru = input.value.trim(); EL.save(); }
      EL.ui.editWordId = '';
      EL.render();
      return true;
    }
    if (action === 'speak-word') {
      const word = EL.state.data.words.find(function (item) { return item.en === node.dataset.en; });
      EL.pronounce(node.dataset.en, { audio: word && word.audio }).then(function (ok) {
        if (!ok) window.alert('Озвучка недоступна в этом браузере.');
      });
      return true;
    }
    if (action === 'reveal-card') { EL.ui.reviewRevealed = true; EL.render(); return true; }
    if (action === 'grade') {
      const id = EL.ui.reviewQueue[EL.ui.reviewIndex];
      EL.grade(id, node.dataset.grade);
      EL.ui.reviewIndex += 1;
      EL.ui.reviewRevealed = false;
      EL.render();
      return true;
    }
    return false;
  }

  EL.renderVocab = renderVocab;
  EL.onVocabClick = onVocabClick;
})();
