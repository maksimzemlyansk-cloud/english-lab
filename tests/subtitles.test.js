const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseSubtitles, tokenize } = require('../js/subtitles.js');

const srt = fs.readFileSync(path.join(__dirname, 'fixtures/sample.srt'), 'utf8');
const vtt = fs.readFileSync(path.join(__dirname, 'fixtures/sample.vtt'), 'utf8');

test('parses the local SRT fixture', () => {
  const parsed = parseSubtitles(srt);
  assert.equal(parsed.cues.length, 3);
  assert.equal(parsed.cues[0].text, 'She is reading now.');
  assert.equal(parsed.cues[0].start, 0);
  assert.equal(parsed.cues[1].text, 'Does he work on Sundays?');
  assert.equal(parsed.cues[2].text, "I don't wanna go out.");
  assert.ok(parsed.cues[2].start > parsed.cues[1].start);
});

test('parses VTT with note, tags, cue settings and a short timestamp', () => {
  const parsed = parseSubtitles(vtt);
  assert.equal(parsed.cues.length, 3);
  assert.equal(parsed.cues[0].text, 'She is reading now.');
  assert.equal(parsed.cues[0].end, 1.2);
  assert.equal(parsed.cues[2].text, "I don't wanna\ngo out.");
});

test('handles BOM, CRLF, html and does not keep tags', () => {
  const raw = '\uFEFF1\r\n00:00:01,000 --> 00:00:02,500\r\n<i>She is <b>reading</b> now.</i>\r\n<script>alert(1)</script>\r\n\r\n2\r\n00:00:03,000 --> 00:00:04,000\r\nDoes he work?\r\n';
  const parsed = parseSubtitles(raw);
  assert.equal(parsed.cues.length, 2);
  assert.equal(parsed.cues[0].text.includes('<'), false);
  assert.equal(parsed.cues[0].text.includes('alert'), false);
  assert.match(parsed.cues[0].text, /She is reading now/);
  assert.equal(parsed.cues[0].start, 1);
  assert.equal(parsed.cues[0].end, 2.5);
});

test('skips garbage and empty input', () => {
  assert.deepEqual(parseSubtitles('hello\n\nno times here').cues, []);
  assert.deepEqual(parseSubtitles('').cues, []);
});

test('tokenize keeps contractions as one word', () => {
  const parts = tokenize("I don't wanna go.").filter(part => part.type === 'word').map(part => part.raw);
  assert.deepEqual(parts, ['I', "don't", 'wanna', 'go']);
});
