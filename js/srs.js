(function (root, factory) {
  const isNode = typeof module === 'object' && module.exports && typeof require === 'function';
  const util = isNode ? require('./util.js') : (root.EL || {});
  const api = factory(util);
  if (isNode) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (util) {
  function gradeWord(word, grade, today) {
    const base = word || {};
    const day = today || util.todayISO();
    let ease = typeof base.ease === 'number' ? base.ease : 2.5;
    let reps = typeof base.reps === 'number' ? base.reps : 0;
    let interval = typeof base.interval === 'number' ? base.interval : 0;
    let lapses = typeof base.lapses === 'number' ? base.lapses : 0;
    let box = typeof base.box === 'number' ? base.box : 0;

    if (grade === 'again') {
      lapses += 1;
      reps = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
      box = 1;
    } else if (grade === 'hard') {
      reps += 1;
      interval = reps === 1 ? 1 : Math.max(1, Math.round((interval || 1) * 1.2));
      ease = Math.max(1.3, ease - 0.15);
      box = Math.min(5, Math.max(1, box));
    } else {
      const previous = reps;
      reps += 1;
      if (previous === 0) interval = 1;
      else if (previous === 1) interval = 6;
      else interval = Math.max(1, Math.round((interval || 6) * ease));
      ease = Math.max(1.3, ease + 0.1);
      box = Math.min(5, reps);
    }

    return {
      ease: Math.round(ease * 100) / 100,
      reps: reps,
      interval: interval,
      lapses: lapses,
      box: box,
      due: util.addDays(day, interval)
    };
  }

  function isDue(word, today) {
    const day = today || util.todayISO();
    if (!word || !word.due) return true;
    return word.due <= day;
  }

  return { gradeWord: gradeWord, isDue: isDue };
});
