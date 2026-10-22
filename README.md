# English Lab

A personal, single-user static app for learning American English. Lessons, vocabulary, and Cinema Lab notes stay in the browser (`localStorage` key `english-lab-free-v1`). Optional Google Drive sync stores one JSON file. There is no build step and no paid API.

## Lessons

Lessons 1–4 share one five-step flow: повторение, объяснение, практика, своя фраза, итог.

1. **to be** — am/is/are in statements, negatives, questions, and short answers.
2. **Present Simple affirmative** — he/she/it -s/-es, habits, frequency adverbs.
3. **Present Continuous affirmative** — am/is/are + -ing, spelling (running, making), now / at the moment.
4. **Questions and negatives** — Present Simple vs Present Continuous.

A new profile starts at lesson 1. Lessons unlock in order. Lesson 4 progress saved by the previous version stays on lesson 4 and can be reopened; the continue button still opens lesson 1 until that lesson is finished. Practice shows one item at a time. A wrong try gets a specific Russian note and can be retried. «Показать ответ» appears only after a wrong try. Session length changes how many of the 8 items are in practice: 5 minutes → 3, 20 → 6, 40 → 8.

Answers are checked locally. The checker normalizes case, punctuation, apostrophes, and contractions (`doesn't` = `does not`, `isn't` = `is not`, `he's not` = `he is not`).

## Vocabulary

Words can be added and deleted by hand. A wrong lesson answer can add the lesson word automatically (source «урок»); Cinema Lab can save a word or phrase with the subtitle line and a timecode (source «Cinema Lab»). Manual entries are marked «вручную». Duplicates are skipped with a case-insensitive, lemma-ish match. Auto-added rows can be removed.

«Повторение» shows cards that are due today: English → reveal → Не помню / Трудно / Помню. The schedule stores a due date, interval, and ease (a small SM-2-like update). The home count is the real number of cards due today.

Lookup uses two keyless browser calls, then caches the result on the device:

- [dictionaryapi.dev](https://dictionaryapi.dev/) — English definition, part of speech, phonetics, and audio. Free, no key, no published rate limit. It is donation-supported and can be unavailable.
- [MyMemory](https://mymemory.translated.net/doc/spec.php) `en|ru` — anonymous use is about 5,000 characters per day per IP, and each request is limited to 500 bytes. See their [usage notes](https://mymemory.translated.net/doc/usagelimits.php) and [terms](https://mymemory.translated.net/terms-and-conditions). The service stores submitted segments. The UI says the translation is automatic and may be wrong.
- Pronunciation uses `speechSynthesis` with an `en-US` voice when the browser has one. That audio is not uploaded.

If a service fails or the device is offline, the translation field stays editable.

## Cinema Lab

Legal sources only: a local video file (played from an object URL, never uploaded) and/or a YouTube URL through the official IFrame Player API, plus an SRT or VTT file you have the right to use. Streaming apps such as Netflix cannot be embedded, and the app does not download protected media.

Cues stay in sync with local `timeupdate` or YouTube `getCurrentTime`, can be clicked to seek, and can be replayed. Speed (0.5× / 0.75×), hiding the on-video line, and a pause-at-end-of-line mode are included where the player allows them. Words and short phrases can be looked up and saved. «Разобрать» is rule-based: translation, a fixed list of informal contractions, lesson patterns, and a short phrasal-verb list. A line can be marked difficult, and one word can be hidden for a local gap fill.

Full subtitle text is stored in IndexedDB on the device. Drive and JSON backups keep per-video metadata, difficult lines, and saved words — not the whole subtitle file. After a reload the video file has to be chosen again; YouTube id, notes, and saved words remain.

## Files

- `index.html` — shell. Scripts and styles are plain files, so the page still opens from disk.
- `js/` — checker, lessons, storage, vocabulary, Cinema Lab, Drive.
- `css/app.css` — dark layout.
- `sw.js`, `manifest.webmanifest`, `icon.svg` — offline shell. Cache name `english-lab-shell-v2`.
- `tests/` — Node tests for the checker, SRT/VTT parser, breakdown, migration, and review schedule. `npm test` runs them. No dependencies. `tests/smoke.js` loads the page in headless Chrome (needs `puppeteer-core` on `NODE_PATH` and a local Chrome).

## Local use

Open `index.html` in a browser, or serve the folder over HTTP. Lesson progress, answers, settings, and vocabulary are stored in that browser. Export/import is still available.

Google Drive sync needs the HTTPS origin configured for the OAuth client (`https://maksimzemlyansk-cloud.github.io`). A `file://` launch cannot sync. The scope is `drive.file`. The app creates and updates `english-lab-progress.json` only. Tokens stay in memory.

## GitHub Pages

The repository and the hosted app are public. Do not commit progress backups, credentials, or private subtitles. The public app is `https://maksimzemlyansk-cloud.github.io/english-lab/`.

## Costs and limits

No paid AI API. Drive calls follow Google quotas. Dictionary and translation calls follow the limits above and do not work offline. The app does not assign a CEFR level.
