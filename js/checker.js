(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports && typeof require === 'function';
  const util = isNode ? require('./util.js') : (root.EL || {});
  const api = factory(util);
  if (isNode) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (util) {
  const levenshtein = util.levenshtein;

  const CATEGORIES = {
    correct: 'Верно',
    'wrong-auxiliary': 'Неверный вспомогательный глагол',
    'verb-s-after-auxiliary': 'Лишнее -s',
    'missing-ing': 'Нет окончания -ing',
    'missing-auxiliary': 'Нет вспомогательного глагола',
    'question-word-order': 'Порядок слов в вопросе',
    'not-placement': 'Место not',
    'aspect-mismatch': 'Simple или Continuous',
    'near-miss': 'Опечатка',
    'subject-verb': 'Окончание -s',
    spelling: 'Правописание',
    adverb: 'Наречие частоты',
    'short-answer': 'Короткий ответ',
    other: 'Проверь форму'
  };

  const NO_APOS = {
    doesnt: "doesn't",
    dont: "don't",
    isnt: "isn't",
    arent: "aren't",
    wasnt: "wasn't",
    werent: "weren't",
    cant: "can't",
    wont: "won't",
    im: "i'm",
    hes: "he's",
    shes: "she's",
    its: "it's",
    theyre: "they're",
    youre: "you're",
    whats: "what's",
    thats: "that's",
    theres: "there's",
    lets: "let's",
    aint: "ain't",
    yall: "y'all"
  };

  function normalizeAnswer(raw) {
    return String(raw ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/\u00a0/g, ' ')
      .replace(/[’‘‛′`´]/g, "'")
      .replace(/[“”]/g, '"')
      .toLowerCase()
      .replace(/[.?!,;:()[\]{}"]/g, ' ')
      .replace(/[^a-z0-9'\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function restoreApostrophes(text) {
    return text.split(' ').map(function (word) {
      return NO_APOS[word] || word;
    }).join(' ');
  }

  function expandContractions(text) {
    let s = text;
    const pairs = [
      [/\bwon't\b/g, 'will not'],
      [/\bcan't\b/g, 'cannot'],
      [/\bain't\b/g, 'is not'],
      [/\bdon't\b/g, 'do not'],
      [/\bdoesn't\b/g, 'does not'],
      [/\bdidn't\b/g, 'did not'],
      [/\bisn't\b/g, 'is not'],
      [/\baren't\b/g, 'are not'],
      [/\bwasn't\b/g, 'was not'],
      [/\bweren't\b/g, 'were not'],
      [/\bi'm\b/g, 'i am'],
      [/\blet's\b/g, 'let us'],
      [/\by'all\b/g, 'you all'],
      [/\bwe're\b/g, 'we are'],
      [/\bthey're\b/g, 'they are'],
      [/\byou're\b/g, 'you are'],
      [/\b([a-z]+)'s\b/g, '$1 is']
    ];
    pairs.forEach(function (pair) { s = s.replace(pair[0], pair[1]); });
    return s.replace(/\s+/g, ' ').trim();
  }

  function canonical(raw) {
    return expandContractions(restoreApostrophes(normalizeAnswer(raw)));
  }

  function lemmaKey(en) {
    const c = canonical(en);
    if (!c) return '';
    const parts = c.split(' ').filter(Boolean);
    if (parts.length === 1) return util.stem(parts[0]);
    return parts.join(' ');
  }

  function tokensOf(raw) {
    const value = canonical(raw);
    return value ? value.split(' ').filter(Boolean) : [];
  }

  function beForm(agree) {
    if (agree === 'i') return 'am';
    if (agree === 'he' || agree === 'she' || agree === 'it') return 'is';
    return 'are';
  }

  function doForm(agree) {
    if (agree === 'he' || agree === 'she' || agree === 'it') return 'does';
    return 'do';
  }

  function result(correct, categoryId, text) {
    return {
      correct: correct,
      categoryId: categoryId,
      category: CATEGORIES[categoryId] || CATEGORIES.other,
      text: text
    };
  }

  function okText() {
    return 'Верно. Форма и порядок слов подходят.';
  }

  function analyze(raw, exercise) {
    const tokens = tokensOf(raw);
    const auxes = ['do', 'does', 'am', 'is', 'are'];
    const beSet = ['am', 'is', 'are'];
    const has = function (word) { return !!word && tokens.indexOf(word) !== -1; };
    const forms = [exercise.base, exercise.sForm, exercise.ing].filter(Boolean);
    let verbIdx = -1;
    forms.forEach(function (word) {
      const i = tokens.indexOf(word);
      if (i !== -1 && (verbIdx === -1 || i < verbIdx)) verbIdx = i;
    });
    const subjectWords = exercise.subjectWords || [];
    let subjectIdx = -1;
    subjectWords.forEach(function (word) {
      const i = tokens.indexOf(word);
      if (i !== -1 && (subjectIdx === -1 || i < subjectIdx)) subjectIdx = i;
    });
    const miss = (exercise.misspellings || []).find(function (item) {
      return tokens.indexOf(item.wrong) !== -1;
    });
    return {
      tokens: tokens,
      hasDo: has('do') || has('does'),
      hasBe: beSet.some(function (word) { return tokens.indexOf(word) !== -1; }),
      hasNot: has('not'),
      hasBase: has(exercise.base),
      hasS: has(exercise.sForm),
      hasIng: has(exercise.ing),
      verbIdx: verbIdx,
      notIdx: tokens.indexOf('not'),
      auxIdx: tokens.findIndex(function (token) { return auxes.indexOf(token) !== -1; }),
      subjectIdx: subjectIdx,
      miss: miss || null
    };
  }

  const DETS = { the: 1, a: 1, an: 1, my: 1, your: 1, our: 1, their: 1, his: 1, her: 1 };

  function subjectFollowsAux(info, exercise) {
    if (info.auxIdx === -1) return false;
    const words = exercise.subjectWords || [];
    if (!words.length) return false;
    const after = info.tokens.slice(info.auxIdx + 1, info.auxIdx + 4);
    for (let i = 0; i < after.length; i++) {
      if (words.indexOf(after[i]) !== -1) {
        return after.slice(0, i).every(function (token) { return DETS[token]; });
      }
    }
    return false;
  }

  function nearMiss(raw, exercise) {
    const user = canonical(raw);
    const userTokens = user ? user.split(' ') : [];
    const expected = exercise.expected || [];
    for (let n = 0; n < expected.length; n++) {
      const target = canonical(expected[n]);
      if (!target) continue;
      if (levenshtein(user, target) === 1) {
        const et = target.split(' ');
        let word = user;
        for (let i = 0; i < userTokens.length; i++) {
          if (userTokens[i] !== et[i]) { word = userTokens[i]; break; }
        }
        return { distance: 1, word: word };
      }
      const et = target.split(' ').filter(Boolean);
      if (et.length === userTokens.length && et.length) {
        const diffs = [];
        for (let i = 0; i < et.length; i++) if (et[i] !== userTokens[i]) diffs.push(i);
        if (diffs.length === 1) {
          const i = diffs[0];
          const distance = levenshtein(userTokens[i], et[i]);
          if (distance > 0 && distance <= 2) return { distance: distance, word: userTokens[i] };
        }
      }
    }
    return null;
  }

  function categorize(raw, exercise) {
    const info = analyze(raw, exercise);
    const tokens = info.tokens;
    const aspect = exercise.aspect;
    const pol = exercise.polarity;
    const agree = exercise.agree;
    const third = agree === 'he' || agree === 'she' || agree === 'it';

    if (!tokens.length) {
      return result(false, 'other', 'Впиши ответ и проверь ещё раз.');
    }
    if (info.miss) {
      return result(false, 'spelling', info.miss.hint);
    }
    if (info.hasNot && info.verbIdx !== -1 && info.notIdx > info.verbIdx) {
      return result(false, 'not-placement', 'Not стоит после вспомогательного глагола: do/does или am/is/are. Не после основного глагола. He works not — так не говорят.');
    }
    if (info.hasNot && info.auxIdx !== -1 && info.notIdx < info.auxIdx) {
      return result(false, 'not-placement', 'Сначала вспомогательный глагол, потом not: is not / does not, не not is и не not does.');
    }
    if (info.hasNot && (info.hasBe || info.hasDo) && pol !== 'question' && pol !== 'short' && tokens[info.auxIdx + 1] !== 'not') {
      return result(false, 'not-placement', 'В отрицании not стоит сразу после am/is/are или do/does.');
    }
    if (info.hasDo && info.hasS) {
      return result(false, 'verb-s-after-auxiliary', 'После do/does и don\'t/doesn\'t глагол без -s: does he work, не does he works.');
    }
    if (aspect === 'continuous' && info.hasBe && !info.hasIng && (info.hasBase || info.hasS)) {
      return result(false, 'missing-ing', 'После am/is/are нужен глагол с -ing. Без -ing форма Continuous не получается.');
    }
    if (aspect === 'simple' && pol === 'affirmative' && !info.hasBe && !info.hasIng) {
      if (third && info.hasBase && !info.hasS) {
        return result(false, 'subject-verb', 'С he/she/it в Present Simple у глагола есть окончание -s или -es. С I/you/we/they окончания нет.');
      }
      if (!third && info.hasS && !info.hasBase) {
        return result(false, 'subject-verb', 'С I/you/we/they глагол без -s. Окончание -s нужно только с he/she/it.');
      }
    }
    if (exercise.adverb && tokens.indexOf(exercise.adverb) !== -1 && info.verbIdx !== -1 && tokens.indexOf(exercise.adverb) > info.verbIdx) {
      return result(false, 'adverb', 'Наречие частоты (always, usually, often) обычно стоит перед основным глаголом: she always walks, не she walks always.');
    }

    const producedCont = info.hasBe && info.hasIng;
    const producedSimple = !info.hasIng && (info.hasS || (info.hasBase && !info.hasBe) || (info.hasDo && info.hasBase));
    if (exercise.timeMarker && aspect !== 'be') {
      if (aspect === 'simple' && producedCont) {
        return result(false, 'aspect-mismatch', 'Маркер обычного действия (every day, usually, always, on Saturdays) — Present Simple, без am/is/are и без -ing.');
      }
      if (aspect === 'continuous' && producedSimple && !info.hasBe) {
        return result(false, 'aspect-mismatch', 'Маркер «now» или «at the moment» — Present Continuous: am/is/are + глагол с -ing.');
      }
    }

    const needsAux = pol === 'question' || pol === 'negative' || pol === 'short' || aspect === 'continuous' || aspect === 'be';
    if (needsAux && !info.hasBe && !info.hasDo) {
      if (aspect === 'be') {
        return result(false, 'missing-auxiliary', 'Нужна форма глагола be: am, is или are. Нельзя пропустить её и поставить только not.');
      }
      if (pol === 'question') {
        return result(false, 'missing-auxiliary', 'В вопросе нужен вспомогательный глагол перед подлежащим. Утверждение с вопросительной интонацией — ещё не вопрос.');
      }
      return result(false, 'missing-auxiliary', 'Нужен вспомогательный глагол. Not не заменяет do/does или am/is/are: не she not working.');
    }

    if ((aspect === 'be' || aspect === 'continuous') && info.hasDo && !info.hasBe) {
      return result(false, 'wrong-auxiliary', aspect === 'be'
        ? 'С глаголом be не используй do/does. Вопрос и отрицание строятся самой формой am/is/are.'
        : 'Для действия сейчас нужен am/is/are, не do/does. Do/does — для обычного действия.');
    }
    if (aspect === 'simple' && (pol === 'question' || pol === 'negative') && info.hasBe && !info.hasDo) {
      return result(false, 'wrong-auxiliary', 'Для обычного действия в вопросе и отрицании нужен do/does, не am/is/are. Am/is/are — когда действие происходит сейчас.');
    }
    if (aspect === 'simple' && pol === 'affirmative' && info.hasDo) {
      return result(false, 'wrong-auxiliary', 'В обычном утверждении Present Simple вспомогательный do/does не нужен.');
    }
    if (aspect === 'simple' && pol === 'affirmative' && info.hasBe && !info.hasIng) {
      return result(false, 'wrong-auxiliary', 'В обычном утверждении не ставь am/is/are перед глаголом. Am/is/are + -ing — это действие сейчас.');
    }

    if (info.hasBe) {
      const need = beForm(agree);
      const used = ['am', 'is', 'are'].find(function (word) { return tokens.indexOf(word) !== -1; });
      if (used && used !== need) {
        return result(false, 'wrong-auxiliary', 'Форма be зависит от подлежащего: I am, he/she/it is, you/we/they are. Сверь подлежащее и форму.');
      }
    }
    if (info.hasDo) {
      const need = doForm(agree);
      const usedDoes = tokens.indexOf('does') !== -1;
      const usedDo = tokens.indexOf('do') !== -1;
      if (need === 'does' && usedDo && !usedDoes) {
        return result(false, 'wrong-auxiliary', 'С he/she/it в Present Simple нужен does, не do. С I/you/we/they — do.');
      }
      if (need === 'do' && usedDoes) {
        return result(false, 'wrong-auxiliary', 'С I/you/we/they нужен do, не does. Does — только с he/she/it.');
      }
    }

    if (pol === 'question' && info.auxIdx !== -1) {
      if (info.subjectIdx !== -1 && info.subjectIdx < info.auxIdx) {
        return result(false, 'question-word-order', 'В вопросе вспомогательный глагол стоит перед подлежащим.');
      }
      if (info.subjectIdx !== -1 && !subjectFollowsAux(info, exercise)) {
        return result(false, 'question-word-order', 'После вспомогательного глагола сразу идёт подлежащее, потом основной глагол.');
      }
      if (exercise.kind === 'transform' && info.subjectIdx === -1) {
        return result(false, 'question-word-order', 'В вопросе после вспомогательного глагола нужно подлежащее.');
      }
    }

    if (pol === 'short') {
      const saidYes = tokens.indexOf('yes') !== -1;
      const saidNo = tokens.indexOf('no') !== -1;
      if (exercise.shortYes && (saidNo || info.hasNot)) {
        return result(false, 'short-answer', 'Короткий ответ «да» повторяет be без not: Yes, she is. Форма с not отвечает на «нет».');
      }
      if (exercise.shortYes === false && saidYes) {
        return result(false, 'short-answer', 'Здесь ответ «нет». Нужны No и отрицательная форма be.');
      }
      if (exercise.shortYes === false && !info.hasNot) {
        return result(false, 'short-answer', 'После No нужна отрицательная форма: am not, isn’t или aren’t.');
      }
    }

    const close = nearMiss(raw, exercise);
    if (close) {
      return result(false, 'near-miss', 'Похоже на опечатку в «' + close.word + '»: отличие в ' + close.distance + ' букв. Проверь написание. Полный ответ пока скрыт.');
    }
    return result(false, 'other', 'Проверь вспомогательный глагол, форму глагола и порядок слов. Сверься с правилом урока и попробуй ещё раз.');
  }

  function checkAnswer(raw, exercise) {
    const spec = exercise || {};
    const user = canonical(raw);
    const expected = spec.expected || [];
    for (let i = 0; i < expected.length; i++) {
      if (user && user === canonical(expected[i])) return result(true, 'correct', okText());
    }
    return categorize(raw, spec);
  }

  function closeEnough(typed, expected) {
    const a = canonical(typed);
    const b = canonical(expected);
    if (!a || !b) return false;
    if (a === b) return true;
    const dist = levenshtein(a, b);
    if (dist <= 1) return true;
    if (b.length >= 6 && dist <= 2) return true;
    return false;
  }

  return {
    CATEGORIES: CATEGORIES,
    normalizeAnswer: normalizeAnswer,
    canonical: canonical,
    lemmaKey: lemmaKey,
    checkAnswer: checkAnswer,
    closeEnough: closeEnough
  };
});
