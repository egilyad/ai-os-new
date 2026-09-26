import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Absolute repo root at config-load time (npm is always invoked from root).
// Pinned via --root so the preview server can never silently serve a
// different directory if the webServer spawn cwd ever differs.
const REPO_ROOT = path.resolve('.');

export default defineConfig({
    testDir: '.',
    timeout: 60000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:5199',
        headless: true,
    },
    webServer: {
        // NOTE: port pinned + strictPort + no reuse on CI. Previously the
        // tests intermittently hit a server returning an empty document
        // (no #root) while a parallel probe served the app fine.
        command: `npx vite preview ${REPO_ROOT} --port 5199 --strictPort`,
        port: 5199,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
