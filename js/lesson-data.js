(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function choice(extra) {
    extra.kind = 'choice';
    return extra;
  }
  function fill(extra) {
    extra.kind = 'fill';
    return extra;
  }
  function transform(extra) {
    extra.kind = 'transform';
    return extra;
  }

  const sHint = {
    ch: 'После -ch, -sh, -s, -x, -o пишем -es, не просто -s.',
    y: 'Если перед y согласная, y меняется на i и добавляется -es.',
    double: 'Короткий глагол на гласную + согласную: перед -ing последняя согласная удваивается.',
    dropE: 'Если глагол кончается на немую e, перед -ing эта e уходит.'
  };

  const LESSONS = [
    {
      id: 1,
      title: 'Глагол to be',
      subtitle: 'am / is / are',
      warmup: choice({
        id: 'l1-warm',
        prompt: '___ I late?',
        help: 'Выбери форму be.',
        options: ['Am', 'Is', 'Are'],
        expected: ['am', 'am i late'],
        displayAnswer: 'Am',
        agree: 'i',
        subjectWords: ['i'],
        aspect: 'be',
        polarity: 'question',
        lemma: 'late',
        contextSentence: 'Am I late?'
      }),
      explanation: {
        intro: 'Be здесь значит «быть», «являться» или «находиться». Форма зависит от подлежащего.',
        rules: [
          { code: 'I am / You are / He is / She is / It is / We are / They are', note: 'Утверждение: подлежащее + am/is/are.' },
          { code: 'I am not / He isn’t / They aren’t', note: 'Отрицание: am/is/are + not. Сокращения: isn’t, aren’t. С I говорят I’m not.' },
          { code: 'Am I…? / Is she…? / Are they…?', note: 'Вопрос: am/is/are стоит перед подлежащим.' },
          { code: 'Yes, she is. / No, they aren’t.', note: 'Короткий ответ повторяет be. В «да» нет not. В «нет» not есть.' }
        ],
        notes: ['Do/does с be не ставим.', 'I’m, he’s, she’s, they’re — разговорные сокращения.']
      },
      items: [
        choice({
          id: 'l1-1',
          prompt: 'I ___ from Russia.',
          help: 'Выбери am, is или are.',
          options: ['am', 'is', 'are'],
          expected: ['am', 'i am from russia'],
          displayAnswer: 'am',
          agree: 'i',
          subjectWords: ['i'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'Russia',
          contextSentence: 'I am from Russia.'
        }),
        fill({
          id: 'l1-2',
          prompt: 'They ___ (not) at home.',
          help: 'Полная отрицательная форма или только пропущенная часть.',
          expected: ['are not', 'they are not', 'they are not at home'],
          displayAnswer: 'aren’t / are not',
          agree: 'they',
          subjectWords: ['they'],
          aspect: 'be',
          polarity: 'negative',
          lemma: 'home',
          contextSentence: 'They aren’t at home.'
        }),
        choice({
          id: 'l1-3',
          prompt: 'She ___ a student.',
          help: 'Выбери форму be.',
          options: ['am', 'is', 'are'],
          expected: ['is', 'she is a student'],
          displayAnswer: 'is',
          agree: 'she',
          subjectWords: ['she'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'student',
          contextSentence: 'She is a student.'
        }),
        choice({
          id: 'l1-4',
          prompt: 'My friends ___ at school.',
          help: 'Friends — это they.',
          options: ['am', 'is', 'are'],
          expected: ['are', 'my friends are at school'],
          displayAnswer: 'are',
          agree: 'they',
          subjectWords: ['friends'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'school',
          contextSentence: 'My friends are at school.'
        }),
        transform({
          id: 'l1-5',
          prompt: 'He is tired.',
          help: 'Сделай вопрос.',
          expected: ['is he tired'],
          displayAnswer: 'Is he tired?',
          agree: 'he',
          subjectWords: ['he'],
          aspect: 'be',
          polarity: 'question',
          lemma: 'tired',
          contextSentence: 'Is he tired?'
        }),
        transform({
          id: 'l1-6',
          prompt: 'Maria is a doctor.',
          help: 'Сделай отрицание.',
          expected: ['maria is not a doctor', 'she is not a doctor'],
          displayAnswer: 'Maria isn’t a doctor.',
          agree: 'she',
          subjectWords: ['maria', 'she'],
          aspect: 'be',
          polarity: 'negative',
          lemma: 'doctor',
          contextSentence: 'Maria isn’t a doctor.'
        }),
        fill({
          id: 'l1-7',
          prompt: 'Is Anna busy? — Yes, ___.',
          help: 'Короткий ответ.',
          expected: ['she is', 'yes she is'],
          displayAnswer: 'Yes, she is.',
          agree: 'she',
          subjectWords: ['she', 'anna'],
          aspect: 'be',
          polarity: 'short',
          shortYes: true,
          lemma: 'busy',
          contextSentence: 'Yes, she is.'
        }),
        fill({
          id: 'l1-8',
          prompt: 'Are Tom and Anna here? — No, ___.',
          help: 'Короткий отрицательный ответ.',
          expected: ['they are not', 'no they are not'],
          displayAnswer: 'No, they aren’t.',
          agree: 'they',
          subjectWords: ['they'],
          aspect: 'be',
          polarity: 'short',
          shortYes: false,
          lemma: 'here',
          contextSentence: 'No, they aren’t.'
        })
      ],
      phrasePrompt: 'Напиши одну фразу про себя с am / am not.',
      phrasePlaceholder: 'I am ...',
      summary: ['I am, he/she/it is, you/we/they are.', 'В вопросе форма be стоит перед подлежащим.', 'Yes, she is. / No, they aren’t.']
    },
    {
      id: 2,
      title: 'Present Simple',
      subtitle: 'утверждение, -s и привычки',
      warmup: choice({
        id: 'l2-warm',
        prompt: 'He ___ pizza.',
        help: 'Обычное действие. Выбери форму.',
        options: ['like', 'likes', 'is liking'],
        expected: ['likes', 'he likes pizza'],
        displayAnswer: 'likes',
        agree: 'he',
        subjectWords: ['he'],
        base: 'like',
        sForm: 'likes',
        ing: 'liking',
        aspect: 'simple',
        polarity: 'affirmative',
        timeMarker: 'habit',
        lemma: 'like',
        contextSentence: 'He likes pizza.'
      }),
      explanation: {
        intro: 'Present Simple — про привычки и факты, не про «прямо сейчас».',
        rules: [
          { code: 'I/you/we/they + глагол', note: 'Без окончания: I work, they play.' },
          { code: 'he/she/it + глагол-s', note: 'She works. He lives. It rains.' },
          { code: 'watch → watches, go → goes', note: 'После -ch, -sh, -s, -x, -o добавляем -es.' },
          { code: 'study → studies, have → has', note: 'Согласная + y → -ies. Have с he/she/it — has.' },
          { code: 'always / usually / often + глагол', note: 'Наречие частоты стоит перед основным глаголом: she always walks.' }
        ],
        notes: ['Every day, usually, on Sundays — сигналы Present Simple.', 'Вопросы и отрицания с do/does будут в уроке 4.']
      },
      items: [
        choice({
          id: 'l2-1',
          prompt: 'She ___ (work) every day.',
          help: 'Обычная привычка.',
          options: ['works', 'work', 'is working'],
          expected: ['works', 'she works every day'],
          displayAnswer: 'works',
          agree: 'she',
          subjectWords: ['she'],
          base: 'work',
          sForm: 'works',
          ing: 'working',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          lemma: 'work',
          contextSentence: 'She works every day.'
        }),
        choice({
          id: 'l2-2',
          prompt: 'He ___ (watch) films at night.',
          help: 'Посмотри на конец глагола watch.',
          options: ['watches', 'watchs', 'watch'],
          expected: ['watches', 'he watches films at night'],
          displayAnswer: 'watches',
          agree: 'he',
          subjectWords: ['he'],
          base: 'watch',
          sForm: 'watches',
          ing: 'watching',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          misspellings: [{ wrong: 'watchs', hint: sHint.ch }],
          lemma: 'watch',
          contextSentence: 'He watches films at night.'
        }),
        choice({
          id: 'l2-3',
          prompt: 'Maria ___ (study) English.',
          help: 'Study кончается на согласную + y.',
          options: ['studies', 'studys', 'study'],
          expected: ['studies', 'maria studies english'],
          displayAnswer: 'studies',
          agree: 'she',
          subjectWords: ['maria'],
          base: 'study',
          sForm: 'studies',
          ing: 'studying',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          misspellings: [{ wrong: 'studys', hint: sHint.y }],
          lemma: 'study',
          contextSentence: 'Maria studies English.'
        }),
        fill({
          id: 'l2-4',
          prompt: 'The bus ___ (go) to the center.',
          help: 'С it у go особая форма.',
          expected: ['goes', 'the bus goes to the center'],
          displayAnswer: 'goes',
          agree: 'it',
          subjectWords: ['bus'],
          base: 'go',
          sForm: 'goes',
          ing: 'going',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          misspellings: [{ wrong: 'gos', hint: 'После -o добавляем -es, не одну букву s.' }],
          lemma: 'bus',
          contextSentence: 'The bus goes to the center.'
        }),
        choice({
          id: 'l2-5',
          prompt: 'He usually ___ (read) at night.',
          help: 'Usually говорит об обычном действии.',
          options: ['reads', 'is reading'],
          expected: ['reads', 'he usually reads at night'],
          displayAnswer: 'reads',
          agree: 'he',
          subjectWords: ['he'],
          base: 'read',
          sForm: 'reads',
          ing: 'reading',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          adverb: 'usually',
          lemma: 'read',
          contextSentence: 'He usually reads at night.'
        }),
        transform({
          id: 'l2-6',
          prompt: 'She walks to work. Добавь always.',
          help: 'Поставь наречие на обычное место.',
          expected: ['she always walks to work', 'always she walks to work'],
          displayAnswer: 'She always walks to work.',
          agree: 'she',
          subjectWords: ['she'],
          base: 'walk',
          sForm: 'walks',
          ing: 'walking',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          adverb: 'always',
          lemma: 'walk',
          contextSentence: 'She always walks to work.'
        }),
        choice({
          id: 'l2-7',
          prompt: 'They ___ (play) football on Sundays.',
          help: 'They — без -s.',
          options: ['play', 'plays'],
          expected: ['play', 'they play football on sundays'],
          displayAnswer: 'play',
          agree: 'they',
          subjectWords: ['they'],
          base: 'play',
          sForm: 'plays',
          ing: 'playing',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          lemma: 'play',
          contextSentence: 'They play football on Sundays.'
        }),
        fill({
          id: 'l2-8',
          prompt: 'She ___ (have) breakfast at 8.',
          help: 'Have с she меняется.',
          expected: ['has', 'she has breakfast at 8'],
          displayAnswer: 'has',
          agree: 'she',
          subjectWords: ['she'],
          base: 'have',
          sForm: 'has',
          ing: 'having',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          misspellings: [{ wrong: 'haves', hint: 'С he/she/it глагол have становится has. Формы haves нет.' }],
          lemma: 'breakfast',
          contextSentence: 'She has breakfast at 8.'
        })
      ],
      phrasePrompt: 'Напиши одну фразу о своей привычке. Если подлежащее he/she/it — не забудь -s.',
      phrasePlaceholder: 'I usually ...',
      summary: ['С he/she/it есть -s/-es, с I/you/we/they нет.', 'watch → watches, study → studies, go → goes, have → has.', 'Usually и always стоят перед основным глаголом.']
    },
    {
      id: 3,
      title: 'Present Continuous',
      subtitle: 'am / is / are + -ing',
      warmup: choice({
        id: 'l3-warm',
        prompt: 'Look! It ___ (rain) now.',
        help: 'Действие прямо сейчас.',
        options: ['is raining', 'rains', 'rain'],
        expected: ['is raining', 'it is raining now'],
        displayAnswer: 'is raining',
        agree: 'it',
        subjectWords: ['it'],
        base: 'rain',
        sForm: 'rains',
        ing: 'raining',
        aspect: 'continuous',
        polarity: 'affirmative',
        timeMarker: 'now',
        lemma: 'rain',
        contextSentence: 'It is raining now.'
      }),
      explanation: {
        intro: 'Present Continuous — действие происходит сейчас или в этот период.',
        rules: [
          { code: 'am / is / are + глагол-ing', note: 'I am reading. She is cooking. They are playing.' },
          { code: 'now, at the moment, Look!, Listen!', note: 'Эти слова часто показывают Continuous, не Simple.' },
          { code: 'run → running, sit → sitting, swim → swimming', note: 'Короткий глагол на гласную + согласную: согласная удваивается.' },
          { code: 'make → making, write → writing', note: 'Немая e перед -ing уходит.' }
        ],
        notes: ['Вопросы и отрицания Continuous будут в уроке 4.', 'Не ставь -s и -ing вместе: не is works и не she working без is.']
      },
      items: [
        choice({
          id: 'l3-1',
          prompt: 'She ___ working now.',
          help: 'Выбери вспомогательный глагол.',
          options: ['is', 'are', 'does', 'am'],
          expected: ['is', 'she is working now'],
          displayAnswer: 'is',
          agree: 'she',
          subjectWords: ['she'],
          base: 'work',
          sForm: 'works',
          ing: 'working',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'work',
          contextSentence: 'She is working now.'
        }),
        fill({
          id: 'l3-2',
          prompt: 'I ___ (read) at the moment.',
          help: 'Форма be и глагол с -ing.',
          expected: ['am reading', 'i am reading', 'i am reading at the moment'],
          displayAnswer: 'am reading',
          agree: 'i',
          subjectWords: ['i'],
          base: 'read',
          sForm: 'reads',
          ing: 'reading',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'read',
          contextSentence: 'I am reading at the moment.'
        }),
        fill({
          id: 'l3-3',
          prompt: 'She ___ (make) coffee now.',
          help: 'Что происходит с буквой e?',
          expected: ['is making', 'she is making coffee now'],
          displayAnswer: 'is making',
          agree: 'she',
          subjectWords: ['she'],
          base: 'make',
          sForm: 'makes',
          ing: 'making',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          misspellings: [{ wrong: 'makeing', hint: sHint.dropE }],
          lemma: 'coffee',
          contextSentence: 'She is making coffee now.'
        }),
        fill({
          id: 'l3-4',
          prompt: 'He ___ (swim) at the moment.',
          help: 'Короткий глагол swim.',
          expected: ['is swimming', 'he is swimming', 'he is swimming at the moment'],
          displayAnswer: 'is swimming',
          agree: 'he',
          subjectWords: ['he'],
          base: 'swim',
          sForm: 'swims',
          ing: 'swimming',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          misspellings: [{ wrong: 'swiming', hint: sHint.double }],
          lemma: 'swim',
          contextSentence: 'He is swimming at the moment.'
        }),
        choice({
          id: 'l3-5',
          prompt: 'They ___ (run) now.',
          help: 'Выбери форму.',
          options: ['are running', 'are runing', 'run'],
          expected: ['are running', 'they are running now'],
          displayAnswer: 'are running',
          agree: 'they',
          subjectWords: ['they'],
          base: 'run',
          sForm: 'runs',
          ing: 'running',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          misspellings: [{ wrong: 'runing', hint: sHint.double }],
          lemma: 'run',
          contextSentence: 'They are running now.'
        }),
        choice({
          id: 'l3-6',
          prompt: 'Listen! The baby ___ (cry).',
          help: 'Listen! — действие сейчас.',
          options: ['is crying', 'cries'],
          expected: ['is crying', 'the baby is crying'],
          displayAnswer: 'is crying',
          agree: 'it',
          subjectWords: ['baby'],
          base: 'cry',
          sForm: 'cries',
          ing: 'crying',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'baby',
          contextSentence: 'The baby is crying.'
        }),
        fill({
          id: 'l3-7',
          prompt: 'We ___ (sit) in the kitchen now.',
          help: 'Sit — короткий глагол.',
          expected: ['are sitting', 'we are sitting', 'we are sitting in the kitchen now'],
          displayAnswer: 'are sitting',
          agree: 'we',
          subjectWords: ['we'],
          base: 'sit',
          sForm: 'sits',
          ing: 'sitting',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          misspellings: [{ wrong: 'siting', hint: sHint.double }],
          lemma: 'kitchen',
          contextSentence: 'We are sitting in the kitchen now.'
        }),
        fill({
          id: 'l3-8',
          prompt: 'They ___ (watch) a film at the moment.',
          help: 'Полная форма Continuous.',
          expected: ['are watching', 'they are watching', 'they are watching a film at the moment'],
          displayAnswer: 'are watching',
          agree: 'they',
          subjectWords: ['they'],
          base: 'watch',
          sForm: 'watches',
          ing: 'watching',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'film',
          contextSentence: 'They are watching a film at the moment.'
        })
      ],
      phrasePrompt: 'Напиши, что ты делаешь прямо сейчас. Нужны am и глагол с -ing.',
      phrasePlaceholder: 'I am ...ing now.',
      summary: ['Сейчас: am/is/are + глагол-ing.', 'run → running, sit → sitting. make → making.', 'Now и at the moment — не Present Simple.']
    },
    {
      id: 4,
      title: 'Вопросы и отрицания',
      subtitle: 'Present Simple и Present Continuous',
      warmup: choice({
        id: 'l4-warm',
        prompt: '___ you watching a video now?',
        help: 'Действие происходит сейчас. Выбери начало вопроса.',
        options: ['Do', 'Are', 'Does', 'Is'],
        expected: ['are', 'are you watching a video now'],
        displayAnswer: 'Are',
        agree: 'you',
        subjectWords: ['you'],
        base: 'watch',
        sForm: 'watches',
        ing: 'watching',
        aspect: 'continuous',
        polarity: 'question',
        timeMarker: 'now',
        lemma: 'watch',
        contextSentence: 'Are you watching a video now?'
      }),
      explanation: {
        intro: 'Вопрос и отрицание строятся вспомогательным глаголом. Основной глагол после него меняется по правилу.',
        rules: [
          { code: 'Do/Does + subject + base verb?', note: 'Обычное действие. Does — с he/she/it, do — с I/you/we/they.' },
          { code: "Subject + don't/doesn't + base verb.", note: 'После don’t/doesn’t глагол без -s.' },
          { code: 'Am/Is/Are + subject + verb-ing?', note: 'Действие сейчас. Am с I, is с he/she/it, are с you/we/they.' },
          { code: 'Subject + am/is/are + not + verb-ing.', note: 'Отрицание Continuous: not после am/is/are, глагол с -ing.' }
        ],
        notes: ['Every day, usually, on Saturdays — Simple. Now, at the moment — Continuous.', 'Не говори he works not и she not working.']
      },
      items: [
        choice({
          id: 'l4-1',
          prompt: '___ she listening to music now?',
          help: 'Выбери вспомогательный глагол.',
          options: ['Is', 'Are', 'Do', 'Does'],
          expected: ['is', 'is she listening to music now'],
          displayAnswer: 'Is',
          agree: 'she',
          subjectWords: ['she'],
          base: 'listen',
          sForm: 'listens',
          ing: 'listening',
          aspect: 'continuous',
          polarity: 'question',
          timeMarker: 'now',
          lemma: 'listen',
          contextSentence: 'Is she listening to music now?'
        }),
        fill({
          id: 'l4-2',
          prompt: 'He ___ (not / work) on Saturdays.',
          help: 'Обычное отрицание. Можно вписать только пропуск или всю фразу.',
          expected: ['does not work', 'he does not work on saturdays'],
          displayAnswer: "doesn't work",
          agree: 'he',
          subjectWords: ['he'],
          base: 'work',
          sForm: 'works',
          ing: 'working',
          aspect: 'simple',
          polarity: 'negative',
          timeMarker: 'habit',
          lemma: 'work',
          contextSentence: "He doesn't work on Saturdays."
        }),
        transform({
          id: 'l4-3',
          prompt: 'You like coffee.',
          help: 'Сделай вопрос.',
          expected: ['do you like coffee'],
          displayAnswer: 'Do you like coffee?',
          agree: 'you',
          subjectWords: ['you'],
          base: 'like',
          sForm: 'likes',
          ing: 'liking',
          aspect: 'simple',
          polarity: 'question',
          lemma: 'coffee',
          contextSentence: 'Do you like coffee?'
        }),
        fill({
          id: 'l4-4',
          prompt: 'They ___ (not / watch) TV every day.',
          help: 'Обычное отрицание с they.',
          expected: ['do not watch', 'they do not watch tv every day'],
          displayAnswer: "don't watch",
          agree: 'they',
          subjectWords: ['they'],
          base: 'watch',
          sForm: 'watches',
          ing: 'watching',
          aspect: 'simple',
          polarity: 'negative',
          timeMarker: 'habit',
          lemma: 'watch',
          contextSentence: "They don't watch TV every day."
        }),
        choice({
          id: 'l4-5',
          prompt: 'The children ___ (play) at the moment.',
          help: 'At the moment — какой вид?',
          options: ['are playing', 'play'],
          expected: ['are playing', 'the children are playing at the moment'],
          displayAnswer: 'are playing',
          agree: 'they',
          subjectWords: ['children'],
          base: 'play',
          sForm: 'plays',
          ing: 'playing',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'play',
          contextSentence: 'The children are playing at the moment.'
        }),
        choice({
          id: 'l4-6',
          prompt: 'She usually ___ (walk) to school.',
          help: 'Usually — какой вид?',
          options: ['walks', 'is walking'],
          expected: ['walks', 'she usually walks to school'],
          displayAnswer: 'walks',
          agree: 'she',
          subjectWords: ['she'],
          base: 'walk',
          sForm: 'walks',
          ing: 'walking',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          adverb: 'usually',
          lemma: 'walk',
          contextSentence: 'She usually walks to school.'
        }),
        transform({
          id: 'l4-7',
          prompt: 'I am reading a book now.',
          help: 'Сделай отрицание.',
          expected: ['i am not reading a book now', 'i am not reading a book', 'i am not reading now'],
          displayAnswer: "I'm not reading a book now.",
          agree: 'i',
          subjectWords: ['i'],
          base: 'read',
          sForm: 'reads',
          ing: 'reading',
          aspect: 'continuous',
          polarity: 'negative',
          timeMarker: 'now',
          lemma: 'read',
          contextSentence: "I'm not reading a book now."
        }),
        transform({
          id: 'l4-8',
          prompt: 'He works on Sundays.',
          help: 'Сделай вопрос.',
          expected: ['does he work on sundays'],
          displayAnswer: 'Does he work on Sundays?',
          agree: 'he',
          subjectWords: ['he'],
          base: 'work',
          sForm: 'works',
          ing: 'working',
          aspect: 'simple',
          polarity: 'question',
          timeMarker: 'habit',
          lemma: 'work',
          contextSentence: 'Does he work on Sundays?'
        })
      ],
      phrasePrompt: 'Составь один вопрос или одно отрицание: про привычку или про то, что происходит сейчас.',
      phrasePlaceholder: "I don't ... / Are you ...ing?",
      summary: ['Обычное действие: do/does и глагол без -s.', 'Действие сейчас: am/is/are и глагол с -ing.', 'Not стоит после вспомогательного глагола.']
    }
  ];

  function snapMinutes(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 20;
    if (n <= 10) return 5;
    if (n <= 25) return 20;
    return 40;
  }

  function sessionCount(minutes) {
    const m = snapMinutes(minutes);
    if (m >= 40) return 8;
    if (m >= 20) return 6;
    return 3;
  }

  function sessionItems(lesson, minutes) {
    const items = lesson.items || [];
    const count = sessionCount(minutes);
    if (count >= items.length) return items.slice();
    if (count === 6) return items.slice(0, 6);
    return [items[0], items[1], items[4]].filter(Boolean);
  }

  function getLesson(id) {
    return LESSONS.find(function (lesson) { return lesson.id === Number(id); }) || LESSONS[0];
  }

  return {
    LESSONS: LESSONS,
    snapMinutes: snapMinutes,
    sessionCount: sessionCount,
    sessionItems: sessionItems,
    getLesson: getLesson
  };
});
