(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EL = Object.assign(root.EL || {}, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function decodeEntities(text) {
    return text
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'");
  }

  function cleanCueText(text) {
    return decodeEntities(String(text || ''))
      .replace(/<script[\s\S]*?(<\/script>|$)/gi, '')
      .replace(/<style[\s\S]*?(<\/style>|$)/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function parseTimestamp(raw) {
    const token = String(raw || '').trim().split(/\s+/)[0].replace(',', '.');
    if (!token) return null;
    const parts = token.split(':');
    let h = 0;
    let m = 0;
    let s = 0;
    if (parts.length === 3) {
      h = Number(parts[0]);
      m = Number(parts[1]);
      s = Number(parts[2]);
    } else if (parts.length === 2) {
      m = Number(parts[0]);
      s = Number(parts[1]);
    } else return null;
    if ([h, m, s].some(function (n) { return Number.isNaN(n); })) return null;
    return h * 3600 + m * 60 + s;
  }

  function parseSubtitles(input) {
    const warnings = [];
    let text = String(input || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    text = text.replace(/^WEBVTT[^\n]*\n/i, '');
    const blocks = text.split(/\n{2,}/);
    const cues = [];
    blocks.forEach(function (block) {
      const lines = block.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line !== ''; });
      if (!lines.length) return;
      const head = lines[0].toUpperCase();
      if (head === 'WEBVTT' || head.indexOf('NOTE') === 0 || head === 'STYLE' || head === 'REGION') return;
      const arrow = lines.findIndex(function (line) { return line.indexOf('-->') !== -1; });
      if (arrow === -1) return;
      const sides = lines[arrow].split('-->');
      const start = parseTimestamp(sides[0]);
      const end = parseTimestamp(sides[1] || '');
      if (start == null || end == null || end < start) {
        warnings.push('Пропущена строка с непонятным временем.');
        return;
      }
      const body = cleanCueText(lines.slice(arrow + 1).join('\n'));
      if (!body) return;
      cues.push({ start: start, end: end, text: body });
    });
    cues.sort(function (a, b) { return a.start - b.start; });
    return { cues: cues, warnings: warnings };
  }

  function tokenize(text) {
    const parts = [];
    const re = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)*/g;
    let last = 0;
    let match;
    let index = 0;
    const source = String(text || '');
    while ((match = re.exec(source))) {
      if (match.index > last) parts.push({ type: 'text', raw: source.slice(last, match.index) });
      parts.push({ type: 'word', raw: match[0], index: index });
      index += 1;
      last = match.index + match[0].length;
    }
    if (last < source.length) parts.push({ type: 'text', raw: source.slice(last) });
    return parts;
  }

  return { parseSubtitles: parseSubtitles, cleanCueText: cleanCueText, parseTimestamp: parseTimestamp, tokenize: tokenize };
});
