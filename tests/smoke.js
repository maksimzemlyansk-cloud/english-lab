const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8765;
const BASE = 'http://127.0.0.1:' + PORT + '/index.html';
const VIDEO = '/tmp/english-lab-sample.mp4';
const SRT = path.join(ROOT, 'tests/fixtures/sample.srt');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function startServer() {
  const child = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: ROOT, stdio: 'ignore' });
  return child;
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch(BASE);
      if (response.ok) return;
    } catch (err) { /* not up */ }
    await sleep(100);
  }
  throw new Error('server did not start');
}

function makeVideo() {
  if (fs.existsSync(VIDEO)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', ['-y', '-f', 'lavfi', '-i', 'color=c=0x111218:s=320x180:d=4', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo', '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart', VIDEO], { stdio: 'ignore' });
    child.on('exit', code => code === 0 ? resolve() : reject(new Error('ffmpeg ' + code)));
  });
}

async function clickText(page, text) {
  const ok = await page.evaluate(label => {
    const norm = value => value.replace(/\s+/g, ' ').trim();
    const nodes = [...document.querySelectorAll('button')].filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !el.disabled;
    });
    const exact = nodes.find(el => norm(el.textContent) === label);
    const partial = nodes.find(el => norm(el.textContent).includes(label));
    const node = exact || partial;
    if (!node) return false;
    node.click();
    return true;
  }, text);
  if (!ok) throw new Error('Кнопка не найдена: ' + text);
}

async function bodyText(page) {
  return page.evaluate(() => document.body.innerText);
}

async function overflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

function watch(page, errors) {
  page.on('pageerror', err => errors.push('pageerror: ' + err.message));
  page.on('console', msg => {
    if (msg.type() !== 'error') return;
    const text = msg.text();
    if (/dictionaryapi|mymemory|youtube|googleapis|gstatic|CORS policy|ERR_FAILED/i.test(text)) return;
    errors.push('console: ' + text);
  });
}

async function run() {
  await makeVideo();
  const server = startServer();
  const errors = [];
  let browser;
  try {
    await waitForServer();
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/google-chrome',
      headless: 'new',
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required']
    });

    const migrateContext = await browser.createBrowserContext();
    const migratePage = await migrateContext.newPage();
    watch(migratePage, errors);
    await migratePage.evaluateOnNewDocument(() => {
      localStorage.setItem('english-lab-free-v1', JSON.stringify({
        lessonStep: 2,
        phrase: 'I am from Omsk.',
        practiceDraft: 'does not',
        answers: [{ step: 2, answer: 'doesnt works', correct: false, category: 'Форма глагола' }],
        words: [{ en: 'cat', ru: 'кот' }],
        settings: { dailyMinutes: 20 }
      }));
    });
    await migratePage.setViewport({ width: 1280, height: 800 });
    await migratePage.goto(BASE, { waitUntil: 'domcontentloaded' });
    await migratePage.waitForFunction(() => document.body.innerText.includes('Урок 1'));
    const migrated = await migratePage.evaluate(() => JSON.parse(localStorage.getItem('english-lab-free-v1')));
    assert.equal(migrated.currentLesson, 1);
    assert.equal(migrated.lessons['4'].step, 2);
    assert.equal(migrated.lessons['4'].phrase, 'I am from Omsk.');
    assert.equal(migrated.phrase, 'I am from Omsk.');
    assert.equal(migrated.answers[0].answer, 'doesnt works');
    assert.equal(migrated.answers[0].lesson, 4);
    assert.equal(migrated.words.find(word => word.en === 'cat').ru, 'кот');
    assert.ok(migrated.words.find(word => word.en === 'cat').due);
    assert.match(await bodyText(migratePage), /Урок 1/);
    await migratePage.click('button[data-page="learn"]');
    await migratePage.waitForFunction(() => document.body.innerText.includes('Уроки 1–4'));
    const learnText = await bodyText(migratePage);
    assert.match(learnText, /Не начат/);
    assert.match(learnText, /В процессе/);
    assert.match(learnText, /Откроется после урока 1/);
    await migrateContext.close();

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    watch(page, errors);
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Урок 1'));
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Показать ответ')), false);
    assert.match(await bodyText(page), /Урок 1/);

    await clickText(page, 'Ещё');
    await clickText(page, '5 мин');
    const minutes = await page.evaluate(() => JSON.parse(localStorage.getItem('english-lab-free-v1')).settings.dailyMinutes);
    assert.equal(minutes, 5);

    await clickText(page, 'Главная');
    await clickText(page, 'Продолжить');
    await page.waitForFunction(() => document.body.innerText.includes('late'));
    assert.equal(await page.evaluate(() => document.body.innerText.includes('Показать ответ')), false);
    await clickText(page, 'Is');
    await page.waitForFunction(() => document.body.innerText.includes('Показать ответ'));
    assert.match(await bodyText(page), /Неверный вспомогательный глагол/);
    const added = await page.evaluate(() => JSON.parse(localStorage.getItem('english-lab-free-v1')).words.some(word => word.en === 'late' && word.source === 'lesson' && word.auto && word.context));
    assert.equal(added, true);
    await clickText(page, 'Убрать');
    const removed = await page.evaluate(() => JSON.parse(localStorage.getItem('english-lab-free-v1')).words.some(word => word.en === 'late'));
    assert.equal(removed, false);
    await clickText(page, 'Am');
    await page.waitForFunction(() => document.body.innerText.includes('Верно'));
    await clickText(page, 'Дальше');
    await page.waitForFunction(() => document.body.innerText.includes('I am'));
    await clickText(page, 'Дальше');
    await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('из 3'));
    await clickText(page, 'is');
    await page.waitForFunction(() => document.body.innerText.includes('Показать ответ'));
    await clickText(page, 'am');
    await page.waitForFunction(() => document.body.innerText.includes('Верно'));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Продолжить'));
    await clickText(page, 'Продолжить');
    await page.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('верно') && text.includes('из 3');
    });
    const afterReload = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('english-lab-free-v1'));
      return { lesson: data.currentLesson, step: data.lessons['1'].step, correct: data.lessons['1'].items['l1-1'].correct };
    });
    assert.equal(afterReload.lesson, 1);
    assert.equal(afterReload.step, 2);
    assert.equal(afterReload.correct, true);

    await clickText(page, 'Слова');
    await page.waitForSelector('#word-en');
    await page.type('#word-en', 'hello');
    await page.type('#word-ru', 'привет');
    await clickText(page, 'Добавить');
    await page.waitForFunction(() => document.body.innerText.includes('hello'));
    await clickText(page, 'Повторение');
    for (let i = 0; i < 4; i++) {
      const done = await page.evaluate(() => document.body.innerText.includes('На сегодня всё'));
      if (done) break;
      await page.waitForFunction(() => document.body.innerText.includes('Показать перевод'));
      await clickText(page, 'Показать перевод');
      await clickText(page, 'Помню');
    }
    await page.waitForFunction(() => document.body.innerText.includes('На сегодня всё'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Продолжить'));
    await clickText(page, 'Слова');
    const vocab = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('english-lab-free-v1'));
      return data.words.find(word => word.en === 'hello');
    });
    assert.equal(vocab.ru, 'привет');
    assert.equal(vocab.source, 'manual');
    assert.ok(vocab.reps >= 1);
    assert.match(await bodyText(page), /hello/);

    await clickText(page, 'Кино');
    await page.waitForSelector('#video-file');
    const videoInput = await page.$('#video-file');
    await videoInput.uploadFile(VIDEO);
    await page.waitForFunction(() => {
      const video = document.querySelector('#local-video');
      return video && !video.hidden && video.readyState >= 1;
    });
    const subInput = await page.$('#sub-file');
    await subInput.uploadFile(SRT);
    await page.waitForFunction(() => document.body.innerText.includes('She is reading now.'));
    await page.waitForFunction(() => document.body.innerText.includes("I don't wanna go out."));
    const jumped = await page.evaluate(() => {
      const cue = [...document.querySelectorAll('.cue')][1];
      cue.click();
      return document.querySelector('#local-video').currentTime;
    });
    assert.ok(jumped >= 1, 'seek ' + jumped);
    await page.evaluate(() => document.querySelector('button.word-token').click());
    await page.waitForFunction(() => {
      const panel = document.querySelector('#cinema-panel');
      return panel && !panel.innerText.includes('Ищу');
    }, { timeout: 12000 });
    assert.match(await page.$eval('#cinema-panel', el => el.innerText), /She|reading|Перевод|Сервис|Офлайн|неточн/i);
    const breakdown = [...await page.$$('button')].length;
    assert.ok(breakdown > 0);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.trim() === 'Разобрать' && el.dataset.cue === '2').click());
    await page.waitForFunction(() => {
      const panel = document.querySelector('#cinema-panel');
      return panel && panel.innerText.includes('Сокращения');
    }, { timeout: 12000 });
    assert.match(await page.$eval('#cinema-panel', el => el.innerText), /wanna|going to|don't/i);
    await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.textContent.includes('Сложная')).click());
    await page.evaluate(() => [...document.querySelectorAll('button')].find(el => el.dataset.action === 'gap').click());
    await page.waitForSelector('#gap-input');
    const missing = await page.evaluate(() => {
      const line = document.querySelector('.cue .cue-line').innerText.replace(/^\d{2}:\d{2}(?::\d{2})?\s*/, '');
      const shown = document.querySelector('#cinema-panel .prompt').innerText;
      return line.split(/\s+/).find(word => word && !shown.includes(word));
    });
    assert.ok(missing, 'gap word');
    await page.type('#gap-input', missing.replace(/[^\w']/g, ''));
    await clickText(page, 'Проверить');
    await page.waitForFunction(() => document.body.innerText.includes('Верно'));

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.innerText.includes('Продолжить'));
    const cinemaSaved = await page.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('english-lab-free-v1'));
      const videos = Object.values(data.cinema.videos);
      return { count: videos.length, hard: videos.some(video => (video.difficult || []).some(line => /reading|She/.test(line.text))), cues: videos.some(video => video.cues) };
    });
    assert.ok(cinemaSaved.count >= 1);
    assert.equal(cinemaSaved.hard, true);
    assert.equal(cinemaSaved.cues, false);
    await clickText(page, 'Кино');
    await page.waitForFunction(() => document.body.innerText.includes('реплик'));
    assert.match(await bodyText(page), /Netflix/);

    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.evaluate(() => document.querySelector('button[data-page="home"]').click());
    await page.waitForFunction(() => document.body.innerText.includes('Продолжить'));
    assert.ok(await overflow(page) <= 2, 'home overflow');
    const navVisible = await page.evaluate(() => getComputedStyle(document.querySelector('.mobile-nav')).display !== 'none');
    assert.equal(navVisible, true);
    await page.evaluate(() => document.querySelector('button[data-action="continue"]').click());
    await page.waitForFunction(() => {
      const text = document.body.innerText.toLowerCase();
      return text.includes('из 3') || text.includes('late') || text.includes('i am');
    });
    assert.ok(await overflow(page) <= 2, 'lesson overflow');

    const progress = await page.evaluate(() => {
      document.querySelector('button[data-page="progress"]').click();
      return true;
    });
    assert.equal(progress, true);
    await page.waitForFunction(() => document.body.innerText.includes('Попытки'));
    const progressText = await bodyText(page);
    assert.equal(/CEFR|B2|A1\+|уровень\s+[ABC]/.test(progressText), false);
    assert.match(progressText, /не определяет уровень/);

    if (errors.length) throw new Error(errors.join('\n'));
    console.log('smoke ok');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
