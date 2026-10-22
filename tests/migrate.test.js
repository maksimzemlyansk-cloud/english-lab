const test = require('node:test');
const assert = require('node:assert/strict');
const { migrate, lessonStatus, isUnlocked, countsAsDue, forSync } = require('../js/storage.js');

test('legacy lesson 4 progress stays, current lesson becomes 1', () => {
  const data = migrate({
    lessonStep: 2,
    phrase: 'I am from Omsk.',
    practiceDraft: 'does not',
    answers: [{ step: 2, answer: 'doesnt works', correct: false, category: 'Форма глагола' }],
    words: [{ en: 'cat', ru: 'кот' }],
    settings: { dailyMinutes: 15 }
  });
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.currentLesson, 1);
  assert.equal(data.lessonStep, 2);
  assert.equal(data.lessons[4].step, 2);
  assert.equal(data.lessons[4].phrase, 'I am from Omsk.');
  assert.equal(data.phrase, 'I am from Omsk.');
  assert.equal(data.practiceDraft, 'does not');
  assert.equal(data.answers.length, 1);
  assert.equal(data.answers[0].answer, 'doesnt works');
  assert.equal(data.answers[0].lesson, 4);
  assert.equal(data.words[0].en, 'cat');
  assert.equal(data.words[0].ru, 'кот');
  assert.equal(data.words[0].source, 'manual');
  assert.equal(data.words[0].ease, 2.5);
  assert.equal(data.words[0].interval, 0);
  assert.ok(data.words[0].due);
  assert.equal(data.settings.dailyMinutes, 20);
  assert.equal(lessonStatus(4, data), 'in-progress');
  assert.equal(lessonStatus(1, data), 'not-started');
  assert.equal(isUnlocked(1, data), true);
  assert.equal(isUnlocked(2, data), false);
  assert.equal(isUnlocked(4, data), true);
});

test('finished legacy lesson stays done and a second migrate keeps ids', () => {
  const once = migrate({ lessonStep: 4, phrase: 'Hi', words: [{ en: 'work', ru: 'работа' }], answers: [] });
  assert.equal(lessonStatus(4, once), 'done');
  assert.equal(once.currentLesson, 1);
  const twice = migrate(once);
  assert.equal(twice.words[0].id, once.words[0].id);
  assert.equal(twice.currentLesson, 1);
  assert.equal(twice.lessons[4].phrase, 'Hi');
  assert.equal(twice.words[0].ru, 'работа');
});

test('new data starts at lesson 1 and does not reset a saved current lesson', () => {
  const fresh = migrate({});
  assert.equal(fresh.currentLesson, 1);
  assert.equal(isUnlocked(4, fresh), false);
  assert.equal(fresh.words.length, 0);
  const kept = migrate({ schemaVersion: 2, currentLesson: 3, lessons: { 1: { completed: true, step: 4 }, 2: { completed: true, step: 4 } }, words: [], answers: [] });
  assert.equal(kept.currentLesson, 3);
  assert.equal(kept.lessons[1].completed, true);
});

test('learn-stage words stay out of review and local pictures stay off the sync copy', () => {
  const data = migrate({
    schemaVersion: 2,
    currentLesson: 1,
    words: [
      { en: 'cat', ru: 'кот', stage: 'learn', due: '2020-01-01', mnemonic: 'хвост' },
      { en: 'dog', ru: 'собака', due: '2020-01-01', image: { kind: 'local', url: 'data:image/jpeg;base64,AAAA' } },
      { en: 'map', ru: 'карта', image: { kind: 'remote', source: 'openverse', url: 'https://example.com/a.jpg', thumb: 'https://example.com/a.jpg', license: 'cc0' } }
    ],
    answers: [],
    lessons: {}
  });
  assert.equal(data.words[0].stage, 'learn');
  assert.equal(data.words[0].mnemonic, 'хвост');
  assert.equal(countsAsDue(data.words[0], '2026-01-01'), false);
  assert.equal(data.words[1].stage, 'review');
  assert.equal(data.words[1].image.url, '');
  assert.equal(countsAsDue(data.words[1], '2026-01-01'), true);
  assert.equal(countsAsDue({ en: 'old', due: '2026-01-01' }, '2026-01-01'), true);
  const synced = forSync(data);
  assert.equal(synced.words[1].image.url, '');
  assert.equal(synced.words[1].image.kind, 'local');
  assert.equal(synced.words[2].image.url, 'https://example.com/a.jpg');
});

test('cinema subtitle bodies are not kept in synced video records', () => {
  const data = migrate({
    schemaVersion: 2,
    currentLesson: 1,
    lessons: {},
    words: [],
    answers: [],
    cinema: { videos: { a: { id: 'a', title: 'Clip', cues: [{ text: 'secret line' }], difficult: [{ start: 1, end: 2, text: 'hard line' }], studied: [1] } } }
  });
  assert.equal(data.cinema.videos.a.cues, undefined);
  assert.equal(data.cinema.videos.a.difficult[0].text, 'hard line');
  assert.equal(data.cinema.videos.a.linesStudied, 1);
});
