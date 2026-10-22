(function () {
  const EL = window.EL;
  const STEP_NAMES = ['Повторение', 'Объяснение', 'Практика', 'Своя фраза', 'Итог'];
  const STATUS_LABEL = { 'not-started': 'Не начат', 'in-progress': 'В процессе', done: 'Пройден' };

  function progress(id) {
    return EL.state.data.lessons[id];
  }

  function itemState(lessonId, itemId) {
    const bag = progress(lessonId).items;
    if (!bag[itemId]) bag[itemId] = { attempts: [], draft: '', revealed: false, correct: false, autoWordId: '' };
    return bag[itemId];
  }

  function sessionList(lesson) {
    return EL.sessionItems(lesson, EL.state.data.settings.dailyMinutes);
  }

  function currentItem(lesson) {
    const items = sessionList(lesson);
    const saved = progress(lesson.id).currentId;
    const found = items.find(function (item) { return item.id === saved; });
    return found || items[0];
  }

  function doneItem(state) {
    return !!(state && (state.correct || state.revealed));
  }

  function practiceReady(lesson) {
    return sessionList(lesson).every(function (item) { return doneItem(itemState(lesson.id, item.id)); });
  }

  function recordAttempt(lessonId, itemId, raw, check) {
    const entry = {
      lesson: lessonId,
      step: progress(lessonId).step,
      itemId: itemId,
      answer: raw,
      correct: check.correct,
      category: check.category,
      categoryId: check.categoryId,
      text: check.text,
      at: new Date().toISOString()
    };
    EL.state.data.answers.push(entry);
    return entry;
  }

  function sourceDetail(exercise) {
    const lessonId = Number(String(exercise.id).replace(/^l(\d+).*/, '$1'));
    return 'Урок ' + lessonId;
  }

  function submitExercise(lesson, exercise, raw, bucket) {
    const value = String(raw || '').trim();
    if (!value) return;
    const check = EL.checkAnswer(value, exercise);
    const hadWrong = bucket.attempts.some(function (item) { return !item.correct; });
    bucket.attempts.push(recordAttempt(lesson.id, exercise.id, value, check));
    bucket.correct = bucket.correct || check.correct;
    bucket.draft = value;
    if (!check.correct && !hadWrong && exercise.lemma) {
      const added = EL.addWord({
        en: exercise.lemma,
        ru: '',
        source: 'lesson',
        context: exercise.contextSentence || '',
        sourceDetail: sourceDetail(exercise),
        auto: true
      });
      if (added.ok) {
        bucket.autoWordId = added.word.id;
        EL.lookupText(exercise.lemma).then(function (info) {
          const word = EL.state.data.words.find(function (item) { return item.id === added.word.id; });
          if (!word) return;
          if (info.ru && !word.ru) word.ru = info.ru;
          if (info.definition) word.definition = info.definition;
          if (info.pos) word.pos = info.pos;
          if (info.phonetic) word.phonetic = info.phonetic;
          EL.save();
        });
      } else if (added.reason === 'duplicate') {
        bucket.autoWordId = '';
        bucket.duplicate = true;
      }
    }
    EL.save();
    EL.render();
  }

  function feedbackHtml(check) {
    if (!check) return '';
    return '<div class="feedback ' + (check.correct ? 'good' : 'bad') + '"><strong>' + EL.esc(check.category) + '</strong><br>' + EL.esc(check.text) + '</div>';
  }

  function lastCheck(bucket) {
    const last = bucket.attempts[bucket.attempts.length - 1];
    if (!last) return null;
    return { correct: last.correct, category: last.category, text: last.text || last.category };
  }

  function autoNote(bucket) {
    if (!bucket.autoWordId) {
      return bucket.duplicate ? '<p class="notice">Это слово уже есть в словаре.</p>' : '';
    }
    const word = EL.state.data.words.find(function (item) { return item.id === bucket.autoWordId; });
    if (!word) return '';
    return '<p class="notice">В словарь добавлено «' + EL.esc(word.en) + '» · урок. <button class="button small" data-action="undo-auto" data-word="' + EL.esc(word.id) + '">Убрать</button></p>';
  }

  function answerBox(exercise, bucket) {
    const wrong = bucket.attempts.some(function (item) { return !item.correct; });
    let html = feedbackHtml(lastCheck(bucket)) + autoNote(bucket);
    if (bucket.revealed) {
      html += '<div class="rule"><code>' + EL.esc(exercise.displayAnswer) + '</code></div>';
    } else if (wrong && !bucket.correct) {
      html += '<div class="inline"><button class="button" data-action="reveal">Показать ответ</button></div>';
    }
    return html;
  }

  function choiceHtml(exercise, bucket) {
    const buttons = exercise.options.map(function (option) {
      return '<button class="button" data-action="choose" data-value="' + EL.esc(option) + '">' + EL.esc(option) + '</button>';
    }).join('');
    return '<div class="prompt">' + EL.esc(exercise.prompt) + '</div><p class="muted small">' + EL.esc(exercise.help || '') + '</p><div class="grid">' + buttons + '</div>' + answerBox(exercise, bucket);
  }

  function inputHtml(exercise, bucket) {
    const field = exercise.kind === 'transform'
      ? '<textarea class="answer" id="practice" autocapitalize="off" autocorrect="off" spellcheck="false">' + EL.esc(bucket.draft || '') + '</textarea>'
      : '<input class="answer" id="practice" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" value="' + EL.esc(bucket.draft || '') + '">';
    return '<div class="prompt">' + EL.esc(exercise.prompt) + '</div><p class="muted small">' + EL.esc(exercise.help || '') + '</p>' + field + answerBox(exercise, bucket) + '<div class="inline"><button class="button primary" data-action="check">Проверить</button></div>';
  }

  function renderList() {
    const data = EL.state.data;
    const cards = EL.LESSONS.map(function (lesson) {
      const status = EL.lessonStatus(lesson.id);
      const unlocked = EL.isUnlocked(lesson.id);
      const label = unlocked ? STATUS_LABEL[status] : 'Закрыт';
      const extra = unlocked
        ? '<button class="button primary" data-action="open-lesson" data-lesson="' + lesson.id + '">' + (status === 'not-started' ? 'Начать' : 'Открыть') + '</button>'
        : '<p class="muted small">Откроется после урока ' + (lesson.id - 1) + '.</p>';
      return '<section class="card"><div class="row"><div><div class="eyebrow">Урок ' + lesson.id + '</div><h2>' + EL.esc(lesson.title) + '</h2><p class="muted">' + EL.esc(lesson.subtitle) + '</p></div><span class="pill">' + label + '</span></div>' + extra + '</section>';
    }).join('');
    EL.app.innerHTML = '<section class="hero"><div class="eyebrow">Курс</div><h1>Уроки 1–4</h1><p class="muted">Сейчас продолжаем урок ' + data.currentLesson + '. Пройденные и уже открытые уроки можно повторять. Новый урок открывается после итога предыдущего. Примеры про поездку и общение: аэропорт, отель, дорога, кафе, знакомство, сообщения.</p></section>' + cards;
  }

  function renderRun() {
    const lesson = EL.getLesson(EL.ui.activeLesson);
    if (!EL.isUnlocked(lesson.id)) { EL.ui.learnView = 'list'; renderList(); return; }
    const bag = progress(lesson.id);
    const step = Math.max(0, Math.min(4, bag.step || 0));
    const dots = STEP_NAMES.map(function (_, i) { return '<div class="step-dot ' + (i <= step ? 'on' : '') + '"></div>'; }).join('');
    let body = '';
    if (step === 0) body = renderWarmup(lesson);
    if (step === 1) body = renderExplain(lesson);
    if (step === 2) body = renderPractice(lesson);
    if (step === 3) body = renderPhrase(lesson);
    if (step === 4) body = renderSummary(lesson);
    const back = step > 0 ? '<button class="button" data-action="step-back">Назад</button>' : '<button class="button" data-action="learn-list">К списку</button>';
    let forward = '';
    if (step === 1) forward = '<button class="button primary" data-action="step-next">Дальше</button>';
    if (step === 0 && warmupDone(lesson)) forward = '<button class="button primary" data-action="step-next">Дальше</button>';
    if (step === 3) forward = '<button class="button primary" data-action="save-phrase">Сохранить фразу</button>';
    if (step === 4) forward = '<button class="button" data-action="learn-list">К списку уроков</button>';
    EL.app.innerHTML = '<div class="row"><div><div class="eyebrow">Урок ' + lesson.id + '</div><h1 class="section-title">' + EL.esc(lesson.title) + '</h1><p class="muted">' + EL.esc(lesson.subtitle) + '</p></div><span class="pill">' + (step + 1) + ' из 5</span></div><div class="lesson-step">' + dots + '</div><div class="card"><div class="eyebrow">' + STEP_NAMES[step] + '</div>' + body + '<div class="inline">' + back + forward + '</div></div><p class="notice">Сессия ' + EL.state.data.settings.dailyMinutes + ' мин. Прогресс этого урока хранится на устройстве.</p>';
  }

  function warmupDone(lesson) {
    const warm = progress(lesson.id).warmup;
    return !!(warm.correct || warm.revealed);
  }

  function renderWarmup(lesson) {
    const warm = progress(lesson.id).warmup;
    return choiceHtml(lesson.warmup, warm);
  }

  function renderExplain(lesson) {
    const rules = lesson.explanation.rules.map(function (rule) {
      return '<div class="rule"><code>' + EL.esc(rule.code) + '</code><div class="small">' + EL.esc(rule.note) + '</div></div>';
    }).join('');
    const notes = lesson.explanation.notes.map(function (note) { return '<li>' + EL.esc(note) + '</li>'; }).join('');
    return '<p>' + EL.esc(lesson.explanation.intro) + '</p>' + rules + '<ul class="list">' + notes + '</ul>';
  }

  function renderPractice(lesson) {
    const items = sessionList(lesson);
    const exercise = currentItem(lesson);
    const index = Math.max(0, items.findIndex(function (item) { return item.id === exercise.id; }));
    const state = itemState(lesson.id, exercise.id);
    const body = exercise.kind === 'choice' ? choiceHtml(exercise, state) : inputHtml(exercise, state);
    const prev = index > 0 ? '<button class="button" data-action="item-prev">Предыдущее</button>' : '';
    const next = doneItem(state) && index < items.length - 1 ? '<button class="button primary" data-action="item-next">Следующее задание</button>' : '';
    const finish = doneItem(state) && index === items.length - 1 ? '<button class="button primary" data-action="practice-done">К своей фразе</button>' : '';
    const note = items.length < lesson.items.length
      ? '<p class="muted small">В этой сессии ' + items.length + ' из ' + lesson.items.length + ' заданий. Сессия 20 или 40 минут откроет больше.</p>'
      : '<p class="muted small">В сессии все ' + items.length + ' заданий урока.</p>';
    return note + '<p class="eyebrow">Задание ' + (index + 1) + ' из ' + items.length + '</p>' + body + '<div class="inline">' + prev + next + finish + '</div>';
  }

  function renderPhrase(lesson) {
    const bag = progress(lesson.id);
    return '<p>' + EL.esc(lesson.phrasePrompt) + '</p><textarea class="answer" id="phrase" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + EL.esc(lesson.phrasePlaceholder) + '">' + EL.esc(bag.phrase || '') + '</textarea><p class="muted small">Фраза сохранится у тебя. Автоматической проверки здесь нет.</p>';
  }

  function renderSummary(lesson) {
    const attempts = EL.state.data.answers.filter(function (item) { return Number(item.lesson) === lesson.id; });
    const correct = attempts.filter(function (item) { return item.correct; }).length;
    const items = sessionList(lesson);
    const cleared = items.filter(function (item) { return itemState(lesson.id, item.id).correct; }).length;
    const bullets = lesson.summary.map(function (line) { return '<li>' + EL.esc(line) + '</li>'; }).join('');
    const next = lesson.id < 4 && EL.isUnlocked(lesson.id + 1)
      ? '<button class="button primary" data-action="open-lesson" data-lesson="' + (lesson.id + 1) + '">Урок ' + (lesson.id + 1) + '</button>'
      : '';
    return '<div class="feedback good"><strong>Итог урока ' + lesson.id + '.</strong><br>Это след занятия, не оценка уровня и не зачёт.</div><ul class="list">' + bullets + '</ul><p>В этой сессии верно с первой или повторной попытки: ' + cleared + ' из ' + items.length + '.</p><p class="muted">Попыток по уроку: ' + attempts.length + '. Верных: ' + correct + '.</p><div class="inline"><button class="button" data-action="repeat-lesson">Пройти ещё раз</button>' + next + '</div>';
  }

  function setStep(lessonId, step) {
    const bag = progress(lessonId);
    bag.step = Math.max(0, Math.min(4, step));
    if (bag.step >= 4) {
      bag.completed = true;
      if (EL.state.data.currentLesson === lessonId && lessonId < 4) EL.state.data.currentLesson = lessonId + 1;
    }
    EL.save();
  }

  function renderLearn() {
    if (EL.ui.learnView === 'run') renderRun();
    else renderList();
  }

  function onLearnClick(action, node) {
    const lesson = EL.getLesson(EL.ui.activeLesson || EL.state.data.currentLesson);
    if (action === 'learn-list') { EL.ui.learnView = 'list'; EL.render(); return true; }
    if (action === 'open-lesson') {
      const id = Number(node.dataset.lesson);
      if (!EL.isUnlocked(id)) return true;
      EL.ui.activeLesson = id;
      EL.ui.learnView = 'run';
      EL.render();
      return true;
    }
    if (action === 'step-back') { setStep(lesson.id, progress(lesson.id).step - 1); EL.render(); return true; }
    if (action === 'step-next') {
      if (progress(lesson.id).step === 0 && !warmupDone(lesson)) return true;
      setStep(lesson.id, progress(lesson.id).step + 1);
      EL.render();
      return true;
    }
    if (action === 'choose') {
      const step = progress(lesson.id).step;
      const exercise = step === 0 ? lesson.warmup : currentItem(lesson);
      const bucket = step === 0 ? progress(lesson.id).warmup : itemState(lesson.id, exercise.id);
      submitExercise(lesson, exercise, node.dataset.value, bucket);
      return true;
    }
    if (action === 'check') {
      const input = document.querySelector('#practice');
      const exercise = currentItem(lesson);
      if (!input || !input.value.trim()) { if (input) input.focus(); return true; }
      submitExercise(lesson, exercise, input.value, itemState(lesson.id, exercise.id));
      return true;
    }
    if (action === 'reveal') {
      const step = progress(lesson.id).step;
      const exercise = step === 0 ? lesson.warmup : currentItem(lesson);
      const bucket = step === 0 ? progress(lesson.id).warmup : itemState(lesson.id, exercise.id);
      if (!bucket.attempts.some(function (item) { return !item.correct; })) return true;
      bucket.revealed = true;
      EL.save();
      EL.render();
      return true;
    }
    if (action === 'undo-auto') {
      EL.deleteWord(node.dataset.word);
      EL.render();
      return true;
    }
    if (action === 'item-prev' || action === 'item-next') {
      const items = sessionList(lesson);
      const index = items.findIndex(function (item) { return item.id === currentItem(lesson).id; });
      const next = items[index + (action === 'item-next' ? 1 : -1)];
      if (next) progress(lesson.id).currentId = next.id;
      EL.save();
      EL.render();
      return true;
    }
    if (action === 'practice-done') {
      if (!practiceReady(lesson)) return true;
      setStep(lesson.id, 3);
      EL.render();
      return true;
    }
    if (action === 'save-phrase') {
      const input = document.querySelector('#phrase');
      const value = input ? input.value.trim() : '';
      if (!value) { if (input) input.focus(); return true; }
      progress(lesson.id).phrase = value;
      setStep(lesson.id, 4);
      EL.render();
      return true;
    }
    if (action === 'repeat-lesson') {
      const bag = progress(lesson.id);
      bag.step = 0;
      bag.currentId = '';
      EL.save();
      EL.render();
      return true;
    }
    return false;
  }

  function onLearnInput(event) {
    const lesson = EL.getLesson(EL.ui.activeLesson || 1);
    if (event.target.id === 'phrase') {
      progress(lesson.id).phrase = event.target.value;
      EL.save();
    }
    if (event.target.id === 'practice' && progress(lesson.id).step === 2) {
      const exercise = currentItem(lesson);
      itemState(lesson.id, exercise.id).draft = event.target.value;
      EL.save();
    }
  }

  EL.renderLearn = renderLearn;
  EL.onLearnClick = onLearnClick;
  EL.onLearnInput = onLearnInput;
  EL.openCurrentLesson = function () {
    EL.ui.page = 'learn';
    EL.ui.learnView = 'run';
    EL.ui.activeLesson = EL.state.data.currentLesson || 1;
    EL.render();
  };
})();
