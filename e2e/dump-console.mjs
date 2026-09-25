// Failure diagnostics for the e2e job: serves dist/ via vite preview,
// visits /, /agents, /chat, /keys and publishes per-route h1 texts,
// control counts and console errors as ::notice:: annotations
// (visible without login, unlike full logs). Always exits 0.
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 5180;
const ROUTES = ['/', '/agents', '/chat', '/keys'];

const note = (t) =>
    console.log(
        '::notice title=e2e-dump::' +
            String(t)
                .slice(0, 4000)
                .replace(/%/g, '%25')
                .replace(/\r/g, '%0D')
                .replace(/\n/g, '%0A'),
    );

const server = spawn(
    'node',
    ['node_modules/vite/bin/vite.js', 'preview', '--port', String(PORT), '--strictPort'],
    { stdio: 'ignore' },
);

const waitPort = async () => {
    const start = Date.now();
    while (Date.now() - start < 60000) {
        try {
            const r = await fetch(`http://localhost:${PORT}/`);
            if (r.ok) return true;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 1000));
    }
    return false;
};

try {
    if (!(await waitPort())) {
        note('DUMP-FAILED: preview did not start on ' + PORT);
        process.exit(0);
    }
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const logs = [];
    page.on('console', (m) => {
        if (m.type() === 'error') logs.push(`[error] ${m.text()}`.slice(0, 300));
    });
    page.on('pageerror', (e) =>
        logs.push(`[pageerror] ${String((e && e.stack) || e).slice(0, 600)}`),
    );
    for (const route of ROUTES) {
        await page.goto(`http://localhost:${PORT}${route}`, { timeout: 30000 });
        let waited = 0;
        for (const waitMs of [6000, 15000, 30000]) {
            await page.waitForTimeout(waitMs - waited);
            waited = waitMs;
            const info = await page.evaluate(() => {
                const h1s = Array.from(document.querySelectorAll('h1')).map((h) =>
                    (h.textContent || '').trim().slice(0, 80),
                );
                const rootEmpty = !document.getElementById('root')?.children.length;
                const bodyLen = document.body ? document.body.innerText.length : -1;
                return { h1s, rootEmpty, bodyLen };
            });
            note(
                `ROUTE ${route} t=${waitMs}ms h1=${JSON.stringify(info.h1s)} rootEmpty=${info.rootEmpty} bodyLen=${info.bodyLen}`,
            );
        }
    }
    note('CONSOLE: ' + (logs.slice(0, 10).join(' | ') || '(no console errors)'));
    await browser.close();
} catch (e) {
    note('DUMP-FAILED: ' + String(e).slice(0, 800));
} finally {
    server.kill('SIGKILL');
}
process.exit(0);
