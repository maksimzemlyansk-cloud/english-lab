const test = require('node:test');
const assert = require('node:assert/strict');
const { STARTER } = require('../js/starter-words.js');

test('starter set is a fixed travel and communication list', () => {
  assert.equal(STARTER.length, 30);
  const ens = STARTER.map(function (item) { return item.en; });
  assert.equal(new Set(ens).size, 30);
  ['airport', 'hotel', 'passport', 'menu', 'excuse me', 'message', 'the check'].forEach(function (en) {
    assert.equal(ens.includes(en), true);
  });
  STARTER.forEach(function (item) {
    assert.ok(item.ru);
    assert.ok(item.context);
    assert.ok(item.imageQuery);
  });
});
