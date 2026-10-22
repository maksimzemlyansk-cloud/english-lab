const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeLine } = require('../js/breakdown.js');

test('expands informal contractions and finds a phrasal verb', () => {
  const report = analyzeLine("I don't wanna go out.");
  const surfaces = report.contractions.map(item => item.surface.toLowerCase());
  assert.ok(surfaces.includes("don't"));
  assert.ok(surfaces.includes('wanna'));
  assert.ok(report.phrasals.some(item => item.phrase === 'go out'));
  assert.ok(report.structures.some(item => item.id === 'simple-n'));
});

test('detects studied question patterns', () => {
  const simple = analyzeLine('Does he work on Sundays?');
  assert.ok(simple.structures.some(item => item.id === 'simple-q'));
  const cont = analyzeLine('Is she reading now?');
  assert.ok(cont.structures.some(item => /cont/.test(item.id)));
  const yall = analyzeLine("Y'all ain't gonna give up.");
  const surfaces = yall.contractions.map(item => item.expansion);
  assert.ok(surfaces.some(item => /you all/i.test(item)));
  assert.ok(surfaces.some(item => /going to/i.test(item)));
  assert.ok(yall.phrasals.some(item => item.phrase === 'give up'));
});
