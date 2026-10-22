const test = require('node:test');
const assert = require('node:assert/strict');
const { checkAnswer, canonical } = require('../js/checker.js');
const { LESSONS, sessionItems, sessionCount } = require('../js/lesson-data.js');

function expectCorrect(raw, exercise) {
  const result = checkAnswer(raw, exercise);
  assert.equal(result.correct, true, raw + ' → ' + result.categoryId + ' ' + result.text);
  assert.equal(result.categoryId, 'correct');
}

function expectCategory(raw, exercise, categoryId) {
  const result = checkAnswer(raw, exercise);
  assert.equal(result.correct, false, raw);
  assert.equal(result.categoryId, categoryId, raw + ' → ' + result.categoryId + ' / ' + result.text);
  assert.ok(result.text && result.category);
  return result;
}

test('normalization equates case, punctuation, apostrophes and contractions', () => {
  assert.equal(canonical("  Doesn't WORK. "), 'does not work');
  assert.equal(canonical('does not work'), 'does not work');
  assert.equal(canonical('doesn’t work'), 'does not work');
  assert.equal(canonical("isn't"), 'is not');
  assert.equal(canonical('is not'), 'is not');
  assert.equal(canonical("He's not"), 'he is not');
  assert.equal(canonical("he isn't"), 'he is not');
  assert.equal(canonical("I'm not"), 'i am not');
  assert.equal(canonical('I am not'), 'i am not');
  assert.equal(canonical("they're not"), 'they are not');
  assert.equal(canonical('they are not'), 'they are not');
});

test('every stored answer variant in lessons 1–4 is accepted', () => {
  LESSONS.forEach(lesson => {
    [lesson.warmup].concat(lesson.items).forEach(exercise => {
      exercise.expected.forEach(answer => expectCorrect(answer, exercise));
      expectCorrect(answerUpper(exercise.expected[0]), exercise);
    });
  });
});

function answerUpper(value) {
  return String(value).toUpperCase() + '!';
}

test('session length picks 3, 6 or 8 items', () => {
  assert.equal(sessionCount(5), 3);
  assert.equal(sessionCount(20), 6);
  assert.equal(sessionCount(40), 8);
  assert.equal(sessionItems(LESSONS[3], 5).length, 3);
  assert.equal(sessionItems(LESSONS[3], 20).length, 6);
  assert.equal(sessionItems(LESSONS[3], 40).length, 8);
  assert.equal(sessionItems(LESSONS[3], 5)[1].id, 'l4-2');
});

const byId = {};
LESSONS.forEach(lesson => {
  byId[lesson.warmup.id] = lesson.warmup;
  lesson.items.forEach(item => { byId[item.id] = item; });
});

test('lesson traps hit the intended categories', () => {
  const traps = [
    ['l1-1', 'is', 'wrong-auxiliary'],
    ['l1-2', 'not', 'missing-auxiliary'],
    ['l1-2', 'is not', 'wrong-auxiliary'],
    ['l1-5', 'He is tired?', 'question-word-order'],
    ['l1-6', 'Maria is a doctor not', 'not-placement'],
    ['l1-7', "Yes, she isn't.", 'short-answer'],
    ['l1-8', 'Yes, they are.', 'short-answer'],
    ['l2-1', 'work', 'subject-verb'],
    ['l2-1', 'is working', 'aspect-mismatch'],
    ['l2-2', 'watchs', 'spelling'],
    ['l2-4', 'gos', 'spelling'],
    ['l2-5', 'is reading', 'aspect-mismatch'],
    ['l2-6', 'She walks always to work.', 'adverb'],
    ['l2-7', 'plays', 'subject-verb'],
    ['l2-8', 'haves', 'spelling'],
    ['l3-1', 'Does', 'wrong-auxiliary'],
    ['l3-2', 'reading', 'missing-auxiliary'],
    ['l3-3', 'is makeing', 'spelling'],
    ['l3-4', 'is swiming', 'spelling'],
    ['l3-5', 'run', 'aspect-mismatch'],
    ['l3-5', 'are runing', 'spelling'],
    ['l4-1', 'Do', 'wrong-auxiliary'],
    ['l4-1', 'Are', 'wrong-auxiliary'],
    ['l4-1', 'Is she listen to music now?', 'missing-ing'],
    ['l4-2', "doesn't works", 'verb-s-after-auxiliary'],
    ['l4-2', 'He works not on Saturdays.', 'not-placement'],
    ['l4-2', 'do not work', 'wrong-auxiliary'],
    ['l4-2', 'does not wrok', 'near-miss'],
    ['l4-3', 'You like coffee?', 'missing-auxiliary'],
    ['l4-3', 'Does you like coffee?', 'wrong-auxiliary'],
    ['l4-4', "doesn't watch", 'wrong-auxiliary'],
    ['l4-5', 'play', 'aspect-mismatch'],
    ['l4-6', 'is walking', 'aspect-mismatch'],
    ['l4-7', 'I am not read a book now.', 'missing-ing'],
    ['l4-7', "I don't read a book now.", 'aspect-mismatch'],
    ['l4-8', 'Does he works on Sundays?', 'verb-s-after-auxiliary'],
    ['l4-8', 'He does work on Sundays?', 'question-word-order'],
    ['l4-8', 'Is he working on Sundays?', 'aspect-mismatch']
  ];
  traps.forEach(([id, raw, category]) => expectCategory(raw, byId[id], category));
});

test('contraction variants of real lesson answers are correct', () => {
  expectCorrect("doesn't work", byId['l4-2']);
  expectCorrect('DOES NOT WORK', byId['l4-2']);
  expectCorrect('He doesn’t work on Saturdays!', byId['l4-2']);
  expectCorrect("I'm not reading a book now.", byId['l4-7']);
  expectCorrect('I am not reading a book now.', byId['l4-7']);
  expectCorrect("aren't", byId['l1-2']);
  expectCorrect("They're not at home.", byId['l1-2']);
  expectCorrect("Maria's not a doctor.", byId['l1-6']);
  expectCorrect("She isn't a doctor.", byId['l1-6']);
});

test('specific phrases from the brief', () => {
  const working = {
    expected: ['she is not working'],
    agree: 'she',
    subjectWords: ['she'],
    base: 'work',
    sForm: 'works',
    ing: 'working',
    aspect: 'continuous',
    polarity: 'negative',
    timeMarker: 'now'
  };
  expectCategory('She not working', working, 'missing-auxiliary');
  const like = byId['l4-3'];
  expectCategory('You like coffee?', like, 'missing-auxiliary');
  const near = expectCategory('does not wrok', byId['l4-2'], 'near-miss');
  assert.match(near.text, /wrok/);
  assert.equal(near.text.includes('does not work'), false);
});

test('he is not and he isn\'t match', () => {
  const exercise = {
    expected: ['he is not tired'],
    agree: 'he',
    subjectWords: ['he'],
    aspect: 'be',
    polarity: 'negative'
  };
  expectCorrect("He's not tired.", exercise);
  expectCorrect("He isn't tired.", exercise);
  expectCorrect('he is not tired', exercise);
});
