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
  const text = await page.evaluate(() => document.body.innerText);
  const buf = await page.screenshot({ fullPage: false });
  return {
    output: text.slice(0, 6000),
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
    case 'type_text': {
      const text = String(body.text || '');
      if (!text) throw new Error('type_text: text required');
      const field = String(body.field || '');
      if (field) {
        await page.locator(field).first().fill(text);
      } else {
        await page.keyboard.type(text, { delay: 5 });
      }
      return { output: `typed ${text.length} chars` };
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
