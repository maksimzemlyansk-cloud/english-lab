(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CONTRACTIONS = [
    ['gonna', 'going to', 'собираться (разг.)'],
    ['wanna', 'want to', 'хотеть (разг.)'],
    ['gotta', 'got to / have to', 'должен, надо (разг.)'],
    ['imma', 'I am going to', 'я собираюсь (разг.)'],
    ['finna', 'going to', 'собираться (разг., юг США)'],
    ['hafta', 'have to', 'должен'],
    ['kinda', 'kind of', 'вроде, отчасти'],
    ['sorta', 'sort of', 'вроде'],
    ['outta', 'out of', 'из'],
    ['lotta', 'lot of', 'много'],
    ['gimme', 'give me', 'дай мне'],
    ['lemme', 'let me', 'дай мне / позволь'],
    ['dunno', "don't know", 'не знаю'],
    ['gotcha', 'got you', 'понял тебя'],
    ['whatcha', 'what are you', 'что ты…'],
    ["c'mon", 'come on', 'давай'],
    ['cmon', 'come on', 'давай'],
    ["'em", 'them', 'их / им'],
    ["y'all", 'you all', 'вы все (разг., США)'],
    ['yall', 'you all', 'вы все (разг., США)'],
    ["ain't", 'am not / is not / are not', 'разг. отрицание be; в учебной речи лучше am not / isn’t / aren’t'],
    ['shoulda', 'should have', 'следовало'],
    ['coulda', 'could have', 'мог бы'],
    ['woulda', 'would have', 'бы'],
    ['musta', 'must have', 'должно быть'],
    ["'cause", 'because', 'потому что'],
    ['cause', 'because', 'потому что (если это не глагол)'],
    ['cos', 'because', 'потому что'],
    ["i'm", 'I am', 'я есть'],
    ["you're", 'you are', 'ты / вы есть'],
    ["we're", 'we are', 'мы есть'],
    ["they're", 'they are', 'они есть'],
    ["he's", 'he is', 'он есть (или he has)'],
    ["she's", 'she is', 'она есть (или she has)'],
    ["it's", 'it is', 'это есть (или it has)'],
    ["that's", 'that is', 'это есть'],
    ["what's", 'what is', 'что есть'],
    ["there's", 'there is', 'есть'],
    ["let's", 'let us', 'давай'],
    ["don't", 'do not', 'не (I/you/we/they)'],
    ["doesn't", 'does not', 'не (he/she/it)'],
    ["didn't", 'did not', 'не (прошедшее)'],
    ["can't", 'cannot', 'не могу'],
    ["won't", 'will not', 'не буду'],
    ["isn't", 'is not', 'не есть'],
    ["aren't", 'are not', 'не есть'],
    ["wasn't", 'was not', 'не был'],
    ["weren't", 'were not', 'не были'],
    ["i've", 'I have', 'я (уже)'],
    ["you've", 'you have', 'ты (уже)'],
    ["we've", 'we have', 'мы (уже)'],
    ["they've", 'they have', 'они (уже)'],
    ["i'd", 'I would / I had', 'я бы / я имел'],
    ["you'd", 'you would / you had', 'ты бы'],
    ["i'll", 'I will', 'я буду'],
    ["you'll", 'you will', 'ты будешь'],
    ["he'll", 'he will', 'он будет'],
    ["she'll", 'she will', 'она будет'],
    ["we'll", 'we will', 'мы будем'],
    ["they'll", 'they will', 'они будут']
  ];

  const PHRASALS = [
    ['look forward to', 'ждать с интересом'],
    ['take care of', 'заботиться'],
    ['figure out', 'понять, разобраться'],
    ['find out', 'выяснить'],
    ['come back', 'вернуться'],
    ['go back', 'вернуться'],
    ['wake up', 'просыпаться'],
    ['get up', 'вставать'],
    ['give up', 'сдаваться'],
    ['look after', 'присматривать'],
    ['look for', 'искать'],
    ['look up', 'искать в словаре / поднимать взгляд'],
    ['turn off', 'выключать'],
    ['turn on', 'включать'],
    ['pick up', 'поднимать / забирать'],
    ['put on', 'надевать'],
    ['take off', 'снимать / взлетать'],
    ['go out', 'выходить / гулять'],
    ['come on', 'давай'],
    ['hold on', 'подожди'],
    ['grow up', 'вырастать'],
    ['hang out', 'проводить время'],
    ['check out', 'проверить / посмотреть'],
    ['show up', 'появиться'],
    ['work out', 'тренироваться / получиться'],
    ['run out', 'закончиться'],
    ['sit down', 'садиться'],
    ['stand up', 'вставать'],
    ['write down', 'записывать'],
    ['fill out', 'заполнять бланк'],
    ['hurry up', 'торопиться'],
    ['calm down', 'успокаиваться'],
    ['watch out', 'осторожно'],
    ['set up', 'настраивать, устраивать'],
    ['call off', 'отменять']
  ];

  function normalizeApos(text) {
    return String(text || '').replace(/[’‘‛′`´]/g, "'");
  }

  function findContractions(text) {
    const source = normalizeApos(text);
    const lower = source.toLowerCase();
    const found = [];
    const used = [];
    CONTRACTIONS.forEach(function (row) {
      const surface = row[0];
      let from = 0;
      while (from < lower.length) {
        const at = lower.indexOf(surface, from);
        if (at === -1) break;
        const before = at === 0 ? '' : lower[at - 1];
        const after = lower[at + surface.length] || '';
        const edgeOk = !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after);
        const overlaps = used.some(function (span) { return at < span[1] && at + surface.length > span[0]; });
        if (edgeOk && !overlaps) {
          used.push([at, at + surface.length]);
          found.push({
            surface: source.slice(at, at + surface.length),
            expansion: row[1],
            ru: row[2]
          });
        }
        from = at + surface.length;
      }
    });
    return found;
  }

  function findPhrasals(text) {
    const lower = ' ' + normalizeApos(text).toLowerCase().replace(/[^a-z'\s]/g, ' ') + ' ';
    const flat = lower.replace(/\s+/g, ' ');
    return PHRASALS.filter(function (row) {
      return flat.indexOf(' ' + row[0] + ' ') !== -1;
    }).map(function (row) {
      return { phrase: row[0], ru: row[1] };
    });
  }

  function findStructures(text) {
    const source = normalizeApos(text);
    const patterns = [
      { id: 'simple-q', label: 'Вопрос Present Simple: do/does + подлежащее + глагол', re: /\b(?:do|does)\s+(?:i|you|we|they|he|she|it)\s+[a-z]+/ig },
      { id: 'simple-n', label: 'Отрицание Present Simple: don\'t/doesn\'t + глагол', re: /\b(?:i|you|we|they|he|she|it)\s+(?:don't|doesn't|do not|does not)\s+[a-z]+/ig },
      { id: 'cont-q', label: 'Вопрос Present Continuous: am/is/are + подлежащее + -ing', re: /\b(?:am|is|are)\s+(?:i|you|we|they|he|she|it|the\s+\w+)\s+[a-z]+ing\b/ig },
      { id: 'cont-n', label: 'Отрицание Present Continuous: am/is/are + not + -ing', re: /\b(?:i|you|we|they|he|she|it)\s+(?:am|is|are)\s+not\s+[a-z]+ing\b|\b(?:i|you|we|they|he|she|it)\s+(?:isn't|aren't)\s+[a-z]+ing\b|\bi'm\s+not\s+[a-z]+ing\b/ig },
      { id: 'cont-a', label: 'Present Continuous: am/is/are + глагол с -ing', re: /\b(?:i'm|you're|we're|they're|he's|she's|it's|am|is|are)\s+(?:not\s+)?[a-z]+ing\b/ig }
    ];
    const hits = [];
    patterns.forEach(function (pattern) {
      pattern.re.lastIndex = 0;
      let match;
      while ((match = pattern.re.exec(source))) {
        hits.push({ id: pattern.id, label: pattern.label, text: match[0], start: match.index, end: match.index + match[0].length });
      }
    });
    return hits;
  }

  function analyzeLine(text) {
    return {
      contractions: findContractions(text),
      phrasals: findPhrasals(text),
      structures: findStructures(text)
    };
  }

  return {
    CONTRACTIONS: CONTRACTIONS,
    analyzeLine: analyzeLine,
    findContractions: findContractions,
    findPhrasals: findPhrasals,
    findStructures: findStructures
  };
});
