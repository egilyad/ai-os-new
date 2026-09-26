import { defineConfig } from '@playwright/test';

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
        // tests intermittently hit a foreign server on :5173 (empty body,
        // no #root) while a parallel probe on :5180 served the app fine.
        command: 'npx vite preview --port 5199 --strictPort',
        port: 5199,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
    },
});
