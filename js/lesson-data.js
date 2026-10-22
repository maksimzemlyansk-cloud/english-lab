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
        prompt: 'Excuse me. ___ I late?',
        help: 'В аэропорту или на встрече. Выбери форму be.',
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
          prompt: 'Hi! I ___ at the hotel.',
          help: 'Знакомство. Выбери am, is или are.',
          options: ['am', 'is', 'are'],
          expected: ['am', 'i am at the hotel'],
          displayAnswer: 'am',
          agree: 'i',
          subjectWords: ['i'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'hotel',
          contextSentence: 'I am at the hotel.'
        }),
        fill({
          id: 'l1-2',
          prompt: 'They ___ (not) at the airport.',
          help: 'Полная отрицательная форма или только пропущенная часть.',
          expected: ['are not', 'they are not', 'they are not at the airport'],
          displayAnswer: 'aren’t / are not',
          agree: 'they',
          subjectWords: ['they'],
          aspect: 'be',
          polarity: 'negative',
          lemma: 'airport',
          contextSentence: 'They aren’t at the airport.'
        }),
        choice({
          id: 'l1-3',
          prompt: 'She ___ my friend.',
          help: 'Знакомство. Выбери форму be.',
          options: ['am', 'is', 'are'],
          expected: ['is', 'she is my friend'],
          displayAnswer: 'is',
          agree: 'she',
          subjectWords: ['she'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'friend',
          contextSentence: 'She is my friend.'
        }),
        choice({
          id: 'l1-4',
          prompt: 'The rooms ___ on the left.',
          help: 'Дорога в отеле. Rooms — это they.',
          options: ['am', 'is', 'are'],
          expected: ['are', 'the rooms are on the left'],
          displayAnswer: 'are',
          agree: 'they',
          subjectWords: ['rooms'],
          aspect: 'be',
          polarity: 'affirmative',
          lemma: 'left',
          contextSentence: 'The rooms are on the left.'
        }),
        transform({
          id: 'l1-5',
          prompt: 'He is at the gate.',
          help: 'Сделай вопрос про выход на посадку.',
          expected: ['is he at the gate'],
          displayAnswer: 'Is he at the gate?',
          agree: 'he',
          subjectWords: ['he'],
          aspect: 'be',
          polarity: 'question',
          lemma: 'gate',
          contextSentence: 'Is he at the gate?'
        }),
        transform({
          id: 'l1-6',
          prompt: 'Maria is a tour guide.',
          help: 'Сделай отрицание.',
          expected: ['maria is not a tour guide', 'she is not a tour guide'],
          displayAnswer: 'Maria isn’t a tour guide.',
          agree: 'she',
          subjectWords: ['maria', 'she'],
          aspect: 'be',
          polarity: 'negative',
          lemma: 'guide',
          contextSentence: 'Maria isn’t a tour guide.'
        }),
        fill({
          id: 'l1-7',
          prompt: 'Is Anna at the cafe? — Yes, ___.',
          help: 'Короткий ответ.',
          expected: ['she is', 'yes she is'],
          displayAnswer: 'Yes, she is.',
          agree: 'she',
          subjectWords: ['she', 'anna'],
          aspect: 'be',
          polarity: 'short',
          shortYes: true,
          lemma: 'cafe',
          contextSentence: 'Yes, she is.'
        }),
        fill({
          id: 'l1-8',
          prompt: 'Are Tom and Anna at the station? — No, ___.',
          help: 'Короткий отрицательный ответ.',
          expected: ['they are not', 'no they are not'],
          displayAnswer: 'No, they aren’t.',
          agree: 'they',
          subjectWords: ['they'],
          aspect: 'be',
          polarity: 'short',
          shortYes: false,
          lemma: 'station',
          contextSentence: 'No, they aren’t.'
        })
      ],
      phrasePrompt: 'Напиши одну фразу про себя в поездке: I am at the hotel или I am not late.',
      phrasePlaceholder: 'I am ...',
      summary: ['I am, he/she/it is, you/we/they are.', 'В вопросе форма be стоит перед подлежащим.', 'Yes, she is. / No, they aren’t.']
    },
    {
      id: 2,
      title: 'Present Simple',
      subtitle: 'утверждение, -s и привычки',
      warmup: choice({
        id: 'l2-warm',
        prompt: 'He ___ coffee.',
        help: 'В кафе, обычный вкус. Выбери форму.',
        options: ['like', 'likes', 'is liking'],
        expected: ['likes', 'he likes coffee'],
        displayAnswer: 'likes',
        agree: 'he',
        subjectWords: ['he'],
        base: 'like',
        sForm: 'likes',
        ing: 'liking',
        aspect: 'simple',
        polarity: 'affirmative',
        timeMarker: 'habit',
        lemma: 'coffee',
        contextSentence: 'He likes coffee.'
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
          prompt: 'She ___ (work) at the hotel every day.',
          help: 'Обычная привычка.',
          options: ['works', 'work', 'is working'],
          expected: ['works', 'she works at the hotel every day'],
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
          contextSentence: 'She works at the hotel every day.'
        }),
        choice({
          id: 'l2-2',
          prompt: 'He ___ (watch) the gate at night.',
          help: 'Посмотри на конец глагола watch.',
          options: ['watches', 'watchs', 'watch'],
          expected: ['watches', 'he watches the gate at night'],
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
          contextSentence: 'He watches the gate at night.'
        }),
        choice({
          id: 'l2-3',
          prompt: 'Maria ___ (study) English before the trip.',
          help: 'Study кончается на согласную + y.',
          options: ['studies', 'studys', 'study'],
          expected: ['studies', 'maria studies english before the trip'],
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
          contextSentence: 'Maria studies English before the trip.'
        }),
        fill({
          id: 'l2-4',
          prompt: 'The bus ___ (go) to the hotel.',
          help: 'Дорога. С it у go особая форма.',
          expected: ['goes', 'the bus goes to the hotel'],
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
          contextSentence: 'The bus goes to the hotel.'
        }),
        choice({
          id: 'l2-5',
          prompt: 'He usually ___ (read) messages at night.',
          help: 'Usually и переписка — обычное действие.',
          options: ['reads', 'is reading'],
          expected: ['reads', 'he usually reads messages at night'],
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
          lemma: 'message',
          contextSentence: 'He usually reads messages at night.'
        }),
        transform({
          id: 'l2-6',
          prompt: 'She walks to the station. Добавь always.',
          help: 'Поставь наречие на обычное место.',
          expected: ['she always walks to the station', 'always she walks to the station'],
          displayAnswer: 'She always walks to the station.',
          agree: 'she',
          subjectWords: ['she'],
          base: 'walk',
          sForm: 'walks',
          ing: 'walking',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          adverb: 'always',
          lemma: 'station',
          contextSentence: 'She always walks to the station.'
        }),
        choice({
          id: 'l2-7',
          prompt: 'They ___ (meet) friends on Sundays.',
          help: 'They — без -s.',
          options: ['meet', 'meets'],
          expected: ['meet', 'they meet friends on sundays'],
          displayAnswer: 'meet',
          agree: 'they',
          subjectWords: ['they'],
          base: 'meet',
          sForm: 'meets',
          ing: 'meeting',
          aspect: 'simple',
          polarity: 'affirmative',
          timeMarker: 'habit',
          lemma: 'friend',
          contextSentence: 'They meet friends on Sundays.'
        }),
        fill({
          id: 'l2-8',
          prompt: 'She ___ (have) breakfast at the hotel at 8.',
          help: 'Have с she меняется.',
          expected: ['has', 'she has breakfast at the hotel at 8'],
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
          contextSentence: 'She has breakfast at the hotel at 8.'
        })
      ],
      phrasePrompt: 'Напиши привычку в поездке или в переписке. Если подлежащее he/she/it — не забудь -s.',
      phrasePlaceholder: 'I usually ...',
      summary: ['С he/she/it есть -s/-es, с I/you/we/they нет.', 'watch → watches, study → studies, go → goes, have → has.', 'Usually и always стоят перед основным глаголом.']
    },
    {
      id: 3,
      title: 'Present Continuous',
      subtitle: 'am / is / are + -ing',
      warmup: choice({
        id: 'l3-warm',
        prompt: 'Small talk: look, it ___ (rain) now.',
        help: 'Погода в разговоре. Действие прямо сейчас.',
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
          prompt: 'She ___ texting a friend now.',
          help: 'Сообщение другу. Выбери вспомогательный глагол.',
          options: ['is', 'are', 'does', 'am'],
          expected: ['is', 'she is texting a friend now'],
          displayAnswer: 'is',
          agree: 'she',
          subjectWords: ['she'],
          base: 'text',
          sForm: 'texts',
          ing: 'texting',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'text',
          contextSentence: 'She is texting a friend now.'
        }),
        fill({
          id: 'l3-2',
          prompt: 'I ___ (read) a message at the moment.',
          help: 'Форма be и глагол с -ing.',
          expected: ['am reading', 'i am reading', 'i am reading a message at the moment'],
          displayAnswer: 'am reading',
          agree: 'i',
          subjectWords: ['i'],
          base: 'read',
          sForm: 'reads',
          ing: 'reading',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'message',
          contextSentence: 'I am reading a message at the moment.'
        }),
        fill({
          id: 'l3-3',
          prompt: 'She ___ (make) a reservation now.',
          help: 'В отеле. Что происходит с буквой e?',
          expected: ['is making', 'she is making a reservation now'],
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
          lemma: 'reservation',
          contextSentence: 'She is making a reservation now.'
        }),
        fill({
          id: 'l3-4',
          prompt: 'He ___ (get) a taxi at the moment.',
          help: 'Короткий глагол get: перед -ing согласная удваивается.',
          expected: ['is getting', 'he is getting', 'he is getting a taxi at the moment'],
          displayAnswer: 'is getting',
          agree: 'he',
          subjectWords: ['he'],
          base: 'get',
          sForm: 'gets',
          ing: 'getting',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          misspellings: [{ wrong: 'geting', hint: sHint.double }],
          lemma: 'taxi',
          contextSentence: 'He is getting a taxi at the moment.'
        }),
        choice({
          id: 'l3-5',
          prompt: 'They ___ (run) to the gate now.',
          help: 'В аэропорту. Выбери форму.',
          options: ['are running', 'are runing', 'run'],
          expected: ['are running', 'they are running to the gate now'],
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
          contextSentence: 'They are running to the gate now.'
        }),
        choice({
          id: 'l3-6',
          prompt: 'Listen! Anna ___ (call) a friend.',
          help: 'Звонок. Listen! — действие сейчас.',
          options: ['is calling', 'calls'],
          expected: ['is calling', 'anna is calling a friend'],
          displayAnswer: 'is calling',
          agree: 'she',
          subjectWords: ['anna'],
          base: 'call',
          sForm: 'calls',
          ing: 'calling',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'call',
          contextSentence: 'Anna is calling a friend.'
        }),
        fill({
          id: 'l3-7',
          prompt: 'We ___ (sit) in the cafe now.',
          help: 'Sit — короткий глагол.',
          expected: ['are sitting', 'we are sitting', 'we are sitting in the cafe now'],
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
          lemma: 'cafe',
          contextSentence: 'We are sitting in the cafe now.'
        }),
        fill({
          id: 'l3-8',
          prompt: 'They ___ (watch) the board at the moment.',
          help: 'Табло в аэропорту. Полная форма Continuous.',
          expected: ['are watching', 'they are watching', 'they are watching the board at the moment'],
          displayAnswer: 'are watching',
          agree: 'they',
          subjectWords: ['they'],
          base: 'watch',
          sForm: 'watches',
          ing: 'watching',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'board',
          contextSentence: 'They are watching the board at the moment.'
        })
      ],
      phrasePrompt: 'Напиши, что происходит сейчас: в аэропорту, в кафе или в сообщении. Нужны am и глагол с -ing.',
      phrasePlaceholder: 'I am ...ing now.',
      summary: ['Сейчас: am/is/are + глагол-ing.', 'run → running, sit → sitting. make → making.', 'Now и at the moment — не Present Simple.']
    },
    {
      id: 4,
      title: 'Вопросы и отрицания',
      subtitle: 'Present Simple и Present Continuous',
      warmup: choice({
        id: 'l4-warm',
        prompt: '___ you texting a friend now?',
        help: 'Сообщение сейчас. Выбери начало вопроса.',
        options: ['Do', 'Are', 'Does', 'Is'],
        expected: ['are', 'are you texting a friend now'],
        displayAnswer: 'Are',
        agree: 'you',
        subjectWords: ['you'],
        base: 'text',
        sForm: 'texts',
        ing: 'texting',
        aspect: 'continuous',
        polarity: 'question',
        timeMarker: 'now',
        lemma: 'text',
        contextSentence: 'Are you texting a friend now?'
      }),
      explanation: {
        intro: 'Вопрос и отрицание строятся вспомогательным глаголом. Основной глагол после него меняется по правилу.',
        rules: [
          { code: 'Do/Does + subject + base verb?', note: 'Обычное действие. Does — с he/she/it, do — с I/you/we/they.' },
          { code: "Subject + don't/doesn't + base verb.", note: 'После don’t/doesn’t глагол без -s.' },
          { code: 'Am/Is/Are + subject + verb-ing?', note: 'Действие сейчас. Am с I, is с he/she/it, are с you/we/they.' },
          { code: 'Subject + am/is/are + not + verb-ing.', note: 'Отрицание Continuous: not после am/is/are, глагол с -ing.' }
        ],
        notes: ['Every day, usually, at the hotel on Saturdays — Simple. Now, at the moment — Continuous.', 'Не говори he works not и she not waiting.']
      },
      items: [
        choice({
          id: 'l4-1',
          prompt: '___ she waiting at the gate now?',
          help: 'Выбери вспомогательный глагол.',
          options: ['Is', 'Are', 'Do', 'Does'],
          expected: ['is', 'is she waiting at the gate now'],
          displayAnswer: 'Is',
          agree: 'she',
          subjectWords: ['she'],
          base: 'wait',
          sForm: 'waits',
          ing: 'waiting',
          aspect: 'continuous',
          polarity: 'question',
          timeMarker: 'now',
          lemma: 'gate',
          contextSentence: 'Is she waiting at the gate now?'
        }),
        fill({
          id: 'l4-2',
          prompt: 'He ___ (not / work) at the hotel on Saturdays.',
          help: 'Обычное отрицание. Можно вписать только пропуск или всю фразу.',
          expected: ['does not work', 'he does not work on saturdays', 'he does not work at the hotel on saturdays'],
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
          contextSentence: "He doesn't work at the hotel on Saturdays."
        }),
        transform({
          id: 'l4-3',
          prompt: 'You like coffee.',
          help: 'В кафе. Сделай вопрос.',
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
          prompt: 'They ___ (not / text) friends every day.',
          help: 'Обычное отрицание с they.',
          expected: ['do not text', 'they do not text friends every day'],
          displayAnswer: "don't text",
          agree: 'they',
          subjectWords: ['they'],
          base: 'text',
          sForm: 'texts',
          ing: 'texting',
          aspect: 'simple',
          polarity: 'negative',
          timeMarker: 'habit',
          lemma: 'text',
          contextSentence: "They don't text friends every day."
        }),
        choice({
          id: 'l4-5',
          prompt: 'The guests ___ (check) in at the moment.',
          help: 'В отеле. At the moment — какой вид?',
          options: ['are checking', 'check'],
          expected: ['are checking', 'the guests are checking in at the moment'],
          displayAnswer: 'are checking',
          agree: 'they',
          subjectWords: ['guests'],
          base: 'check',
          sForm: 'checks',
          ing: 'checking',
          aspect: 'continuous',
          polarity: 'affirmative',
          timeMarker: 'now',
          lemma: 'check',
          contextSentence: 'The guests are checking in at the moment.'
        }),
        choice({
          id: 'l4-6',
          prompt: 'She usually ___ (walk) to the station.',
          help: 'Дорога. Usually — какой вид?',
          options: ['walks', 'is walking'],
          expected: ['walks', 'she usually walks to the station'],
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
          lemma: 'station',
          contextSentence: 'She usually walks to the station.'
        }),
        transform({
          id: 'l4-7',
          prompt: 'I am reading the menu now.',
          help: 'В кафе. Сделай отрицание.',
          expected: ['i am not reading the menu now', 'i am not reading the menu', 'i am not reading now'],
          displayAnswer: "I'm not reading the menu now.",
          agree: 'i',
          subjectWords: ['i'],
          base: 'read',
          sForm: 'reads',
          ing: 'reading',
          aspect: 'continuous',
          polarity: 'negative',
          timeMarker: 'now',
          lemma: 'menu',
          contextSentence: "I'm not reading the menu now."
        }),
        transform({
          id: 'l4-8',
          prompt: 'He works at the hotel on Sundays.',
          help: 'Сделай вопрос.',
          expected: ['does he work on sundays', 'does he work at the hotel on sundays'],
          displayAnswer: 'Does he work at the hotel on Sundays?',
          agree: 'he',
          subjectWords: ['he'],
          base: 'work',
          sForm: 'works',
          ing: 'working',
          aspect: 'simple',
          polarity: 'question',
          timeMarker: 'habit',
          lemma: 'work',
          contextSentence: 'Does he work at the hotel on Sundays?'
        })
      ],
      phrasePrompt: 'Составь один вопрос или одно отрицание про поездку, кафе или сообщение другу.',
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
