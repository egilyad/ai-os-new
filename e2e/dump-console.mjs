// Failure diagnostics for the e2e job: serves dist/ via vite preview,
// loads /, and publishes body text + browser console errors as
// ::notice:: annotations (visible without login, unlike full logs).
// Runs only when e2e tests already failed. Always exits 0.
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = 5180;

const note = (t) =>
    console.log(
        '::notice title=e2e-dump::' +
            String(t)
                .slice(0, 5000)
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
        if (m.type() === 'error' || m.type() === 'warning')
            logs.push(`[${m.type()}] ${m.text()}`.slice(0, 500));
    });
    page.on('pageerror', (e) =>
        logs.push(`[pageerror] ${String((e && e.stack) || e).slice(0, 900)}`),
    );
    await page.goto(`http://localhost:${PORT}/`, { timeout: 30000 });
    await page.waitForTimeout(8000);
    const bodyText = await page.evaluate(() =>
        document.body ? document.body.innerText.slice(0, 1200).replace(/\s+/g, ' ') : 'NO-BODY',
    );
    note('BODY-TEXT: ' + (bodyText || '(empty)'));
    note('CONSOLE: ' + (logs.slice(0, 10).join(' | ') || '(no console errors)'));
    await browser.close();
} catch (e) {
    note('DUMP-FAILED: ' + String(e).slice(0, 1000));
} finally {
    server.kill('SIGKILL');
}
process.exit(0);
