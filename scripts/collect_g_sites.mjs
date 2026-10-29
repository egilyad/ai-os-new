/**
 * Collect all Google Sites (from manifest.json) into docs/fetched-sites/.
 *
 * Usage:
 *   1) npm i -D playwright
 *   2) node scripts/collect_g_sites.mjs
 *
 * It opens a persistent Chrome profile (./.gprofile). Sign in to Google once
 * in the opened window; then the script walks every site and every page,
 * saving clean content as Markdown. Finally it generates an index.html.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = path.resolve(process.cwd());
const MANIFEST = path.join(ROOT, 'docs', 'fetched-sites', 'manifest.json');
const OUT_DIR = path.join(ROOT, 'docs', 'fetched-sites');
const PROFILE_DIR = path.join(ROOT, '.gprofile');

const sites = JSON.parse(readFileSync(MANIFEST, 'utf8'));

function slug(name, id) {
  const base = (name || 'site').toLowerCase().replace(/[^a-z0-9а-яё]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'site') + '-' + id.slice(0, 8);
}

function cleanText(t) {
  return (t || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function stripUi(text) {
  // remove obvious editor/UI noise lines
  const skip = /Перейти к основному контенту|Перейти к навигации|Режим предварительного просмотра|неопубликованную версию|Открыть опубликованный сайт|Сообщить о нарушении|Открыть историю версий|Отменить последнее действие|Повторить последнее действие|Просмотр|Копировать ссылку|Невозможно скопировать|Открыть доступ|Настройки|Дополнительно|Опубликовать|Изменить текст|Создать копию|Удалить раздел|Цвета раздела|Скопировать раздел|Добавить нижний колонтитул|Оглавление|Карусель изображений|Кнопка|Разделитель|Пробел|Ссылки на социальные сети|Метка-заполнитель|YouTube|Календарь|Карта|Документы|Презентация|Таблица|Формы|Диаграмма|Вставка|Страницы|Темы|Текстовое поле|Изображения|Встроить|Диск/;
  return text.split('\n').filter((l) => !skip.test(l)).join('\n');
}

async function waitForSignIn(page) {
  for (let i = 0; i < 600; i++) {
    if (page.url().includes('sites.google.com') && i > 2) return true;
    await page.waitForTimeout(1000);
  }
  return true;
}

async function collectSite(browser, site) {
  const id = site.id;
  const dir = path.join(OUT_DIR, slug(site.name, id));
  mkdirSync(dir, { recursive: true });

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const base = `https://sites.google.com/u/0/d/${id}/p`;
  const index = [];

  try {
    await page.goto(base + '?authuser=0', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);
    const mainText = cleanText(stripUi(await page.evaluate(() => document.body.innerText)));
    const homeName = site.name || 'Главная';
    writeFileSync(path.join(dir, '_home.md'), `# ${site.name}\n\n${mainText}\n`);
    index.push({ text: homeName, file: '_home.md' });

    // gather page links
    const pages = await page.evaluate((sid) => {
      const seen = new Set();
      const out = [];
      document.querySelectorAll('a[href]').forEach((a) => {
        const m = (a.href || '').match(/\/d\/[A-Za-z0-9_-]+\/p\/([A-Za-z0-9_-]+)\/preview/);
        if (!m) return;
        const p = m[1];
        if (seen.has(p)) return;
        seen.add(p);
        out.push({ page: p, text: (a.innerText || '').replace(/\s+/g, ' ').trim() });
      });
      return out;
    }, id);

    for (const pg of pages) {
      const name = pg.text || pg.page;
      try {
        await page.goto(`${base}/${pg.page}/preview?authuser=0`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(1200);
        const text = cleanText(stripUi(await page.evaluate(() => document.body.innerText)));
        const fname = `p_${pg.page.slice(0, 8)}.md`;
        writeFileSync(path.join(dir, fname), `# ${name}\n\n${text}\n`);
        index.push({ text: name || pg.page, file: fname });
      } catch (e) {
        appendFileSync(path.join(dir, `p_${pg.page.slice(0, 8)}.md`), `# ${name}\n\n(ошибка загрузки: ${e.message})\n`);
        index.push({ text: name || pg.page, file: `p_${pg.page.slice(0, 8)}.md` });
      }
    }
  } finally {
    await ctx.close();
  }

  // site index
  const links = index.map((x) => `- [${x.text}](${x.file})`).join('\n');
  writeFileSync(path.join(dir, 'index.md'), `# ${site.name}\n\n${links}\n`);
  return { name: site.name, dir: path.relative(ROOT, dir), pages: index.length };
}

const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
  channel: 'chrome',
  headless: false,
  viewport: { width: 1280, height: 900 },
});

const page = await browser.newPage();
await page.goto('https://sites.google.com/u/0/?hl=ru', { waitUntil: 'domcontentloaded' });
console.log('🤝 Войди в Google в открытом окне (если нужно), затем дождись сбора…');
await waitForSignIn(page);

const report = [];
for (const site of sites) {
  console.log(`▶ ${site.name} (${site.id})`);
  try {
    const r = await collectSite(browser, site);
    report.push(r);
    console.log(`   → ${r.pages} страниц`);
  } catch (e) {
    console.error(`   ✖ ${e.message}`);
    report.push({ name: site.name, dir: '', pages: 0, error: e.message });
  }
}

// global index.html
const rows = report
  .map((r) => `<li><a href="${path.relative(ROOT, r.dir).replace(/\\/g, '/')}/index.md">${r.name}</a> (${r.pages} стр.)</li>`)
  .join('\n');
writeFileSync(
  path.join(OUT_DIR, 'index.html'),
  `<!doctype html><meta charset="utf-8"><title>Google Sites — сводный</title><h1>Все сайты</h1><ul>\n${rows}\n</ul>\n`,
);

await browser.close();
console.log('Готово! Смотри docs/fetched-sites/index.html');
