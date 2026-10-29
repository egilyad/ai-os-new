/**
 * Browser sidecar — выполняет browser/computer действия через Playwright.
 * Запуск: node server/browser-sidecar.mjs   (по умолчанию :3100)
 * Протокол: POST /act  { action, url?, x?, y?, text?, ... } -> { screenshot?, output?, error? }
 *
 * Actions: open_url, click_at, type_text, scroll, screenshot, extract_text, browser_navigate
 */
import http from 'node:http';
import { chromium } from 'playwright';

const PORT = Number(process.env.BROWSER_SIDECAR_PORT || 3100);
const MAX_BODY = 2 * 1024 * 1024;

let browser = null;
async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({ channel: 'chrome', headless: false });
  }
  return browser;
}

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function extractUrl(task) {
  const m = String(task || '').match(/https?:\/\/[^\s"<>]+/i);
  return m ? m[0] : null;
}

/** Выполнить «задачу» (свободный текст) эвристически. */
async function handleExecute(body, ctx) {
  const task = String(body.task || '');
  const page = ctx.page;
  const url = extractUrl(task) || body.url;
  if (url) {
    if (!/^https?:\/\//i.test(url)) throw new Error('url must be http(s)');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  }

  let output;
  const lower = task.toLowerCase();

  if (/таблиц|таблиц/.test(lower)) {
    const out = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      return tables.slice(0, 5).map((t) => {
        const rows = Array.from(t.querySelectorAll('tr')).slice(0, 20).map((tr) =>
          Array.from(tr.querySelectorAll('th, td')).map((c) => c.innerText.trim()).join(' | '),
        );
        return rows.join('\n');
      });
    });
    output = out.join('\n\n---\n\n');
  } else if (/цен|цену|прайс|price/.test(lower)) {
    output = await page.evaluate(() => {
      const hits = Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const t = (el.textContent || '').trim();
          return t && t.length < 60 && /\d[.,]\d{2}|[₽$€£]/.test(t);
        })
        .slice(0, 20)
        .map((el) => el.textContent.trim());
      return hits.join('\n');
    });
  } else {
    output = await page.evaluate(() => document.body.innerText);
  }

  const buf = await page.screenshot({ fullPage: false });
  return {
    output: String(output || '').slice(0, 6000),
    screenshot: buf.toString('base64'),
    finalState: { mode: 'browser', title: await page.title(), url: page.url() },
  };
}

async function handleAct(body, ctx) {
  const action = body.action;
  const page = ctx.page;
  switch (action) {
    case 'open_url':
    case 'browser_navigate': {
      const url = String(body.url || '');
      if (!/^https?:\/\//i.test(url)) throw new Error('url must be http(s)');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      return { output: `opened ${page.url()}` };
    }
    case 'click_at': {
      const x = Number(body.x), y = Number(body.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('click_at: x/y required');
      await page.mouse.click(x, y);
      return { output: `clicked ${x},${y}` };
    }
    case 'click_selector': {
      const sel = String(body.selector || '');
      if (!sel) throw new Error('click_selector: selector required');
      await page.locator(sel).first().waitFor({ state: 'visible', timeout: 15000 });
      await page.locator(sel).first().click();
      return { output: `clicked selector ${sel}` };
    }
    case 'type_text': {
      const text = String(body.text || '');
      if (!text) throw new Error('type_text: text required');
      const field = String(body.field || '');
      if (field) {
        await page.locator(field).first().waitFor({ state: 'visible', timeout: 15000 });
        await page.locator(field).first().fill(text);
      } else {
        await page.keyboard.type(text, { delay: 5 });
      }
      return { output: `typed ${text.length} chars` };
    }
    case 'extract_text_selector': {
      const sel = String(body.selector || '');
      if (!sel) throw new Error('extract_text_selector: selector required');
      const count = await page.locator(sel).count();
      const texts = await page.locator(sel).allInnerTexts();
      return { output: `[${count}] ${texts.slice(0, 20).join(' | ')}`.slice(0, 6000) };
    }
    case 'extract_table': {
      const out = await page.evaluate(() => {
        const tables = Array.from(document.querySelectorAll('table'));
        return tables.slice(0, 5).map((t) => {
          const rows = Array.from(t.querySelectorAll('tr')).slice(0, 20).map((tr) =>
            Array.from(tr.querySelectorAll('th, td')).map((c) => c.innerText.trim()).join(' | '),
          );
          return rows.join('\n');
        });
      });
      return { output: out.join('\n\n---\n\n').slice(0, 6000) };
    }
    case 'extract_schema': {
      const schema = body.schema;
      if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
        throw new Error('extract_schema: schema object required ({ field: selector })');
      }
      const out = {};
      for (const [key, sel] of Object.entries(schema)) {
        const s = String(sel || '').trim();
        if (!s) { out[key] = null; continue; }
        try {
          const loc = page.locator(s);
          if ((await loc.count()) === 0) { out[key] = null; continue; }
          const txt = ((await loc.first().innerText()) || '').trim();
          out[key] = txt ? txt.slice(0, 2000) : null;
        } catch {
          out[key] = null;
        }
      }
      return { output: JSON.stringify(out, null, 2).slice(0, 6000) };
    }
    case 'scroll': {
      const dir = String(body.direction || 'down');
      const amount = Number(body.amount || 400);
      const dx = dir === 'left' ? -amount : dir === 'right' ? amount : 0;
      const dy = dir === 'up' ? -amount : dir === 'down' ? amount : 0;
      await page.mouse.wheel(dx, dy);
      return { output: `scrolled ${dir} ${amount}` };
    }
    case 'screenshot': {
      const buf = await page.screenshot({ fullPage: Boolean(body.fullPage) });
      return { screenshot: buf.toString('base64') };
    }
    case 'extract_text': {
      const text = await page.evaluate(() => document.body.innerText);
      return { output: text.slice(0, 6000) };
    }
    case 'get_url': {
      return { output: page.url() };
    }
    default:
      throw new Error(`unknown action: ${action}`);
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });

  if (req.method === 'POST' && (url.pathname === '/act' || url.pathname === '/execute')) {
    let bodyRaw = '';
    req.on('data', (c) => {
      bodyRaw += c;
      if (bodyRaw.length > MAX_BODY) req.destroy();
    });
    req.on('end', async () => {
      let body;
      try {
        body = JSON.parse(bodyRaw || '{}');
      } catch {
        return send(res, 400, { error: 'invalid JSON' });
      }
      try {
        const b = await getBrowser();
        const ctx = await b.newContext();
        const page = await ctx.newPage();
        try {
          const result =
            url.pathname === '/execute' ? await handleExecute(body, { page }) : await handleAct(body, { page });
          return send(res, 200, result);
        } finally {
          await ctx.close();
        }
      } catch (e) {
        return send(res, 500, { error: e instanceof Error ? e.message : String(e) });
      }
    });
    return;
  }

  send(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Browser sidecar listening on http://localhost:${PORT}`);
});
