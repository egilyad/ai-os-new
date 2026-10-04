import { defineConfig } from '@playwright/test';
import path from 'node:path';

// Absolute repo root at config-load time (npm is always invoked from root).
// Pinned via --root so the preview server can never silently serve a
// different directory if the webServer spawn cwd ever differs.
const REPO_ROOT = path.resolve('.');

export default defineConfig({
    testDir: '.',
    // Cold boot (38MB bundle + Dexie migrations) can exceed 60s on shared
    // runners; the beforeEach boot gate alone may take up to 120s.
    timeout: 180000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:5199',
        headless: true,
    },
    webServer: [
        {
            // NOTE: port pinned + strictPort + no reuse on CI. Previously the
            // tests intermittently hit a server returning an empty document
            // (no #root) while a parallel probe served the app fine.
            command: `npx vite preview ${REPO_ROOT} --port 5199 --strictPort`,
            port: 5199,
            reuseExistingServer: !process.env.CI,
            timeout: 120000,
        },
        {
            // T-H-7: live sync-server for the data-sync spec (auth +
            // broadcast paths). Test-only credentials and an isolated
            // DATA_DIR under test-results (never the repo ./data).
            // HEARTBEAT_LOOP=0 keeps background activity out of assertions.
            command: `node ${path.join(REPO_ROOT, 'server', 'sync-server.mjs')}`,
            port: 3001,
            reuseExistingServer: !process.env.CI,
            timeout: 60000,
            env: {
                SYNC_SECRET: 'e2e-test-secret',
                SYNC_PORT: '3001',
                SYNC_ORIGINS: 'http://localhost:5199',
                HEARTBEAT_LOOP: '0',
                COMPANY_DATA_DIR: path.join(REPO_ROOT, 'test-results', 'sync-data'),
            },
        },
    ],
});
