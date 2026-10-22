const test = require('node:test');
const assert = require('node:assert/strict');
const { gradeWord, isDue } = require('../js/srs.js');

test('grades move the due date', () => {
  const again = gradeWord({ ease: 2.5, reps: 2, interval: 6, lapses: 0 }, 'again', '2026-01-01');
  assert.equal(again.reps, 0);
  assert.equal(again.interval, 1);
  assert.equal(again.due, '2026-01-02');
  assert.equal(again.lapses, 1);
  const first = gradeWord({ ease: 2.5, reps: 0, interval: 0 }, 'good', '2026-01-01');
  assert.equal(first.interval, 1);
  assert.equal(first.reps, 1);
  assert.equal(first.due, '2026-01-02');
  const second = gradeWord(first, 'good', '2026-01-02');
  assert.equal(second.interval, 6);
  assert.equal(second.due, '2026-01-08');
  assert.equal(isDue({ due: '2026-01-02' }, '2026-01-02'), true);
  assert.equal(isDue({ due: '2026-01-03' }, '2026-01-02'), false);
  assert.equal(isDue({}, '2026-01-02'), true);
});
