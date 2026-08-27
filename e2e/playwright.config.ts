import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: '.',
    timeout: 60000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:5173',
        headless: true,
    },
    webServer: {
        command: 'npx vite preview',
        port: 5173,
        reuseExistingServer: true,
    },
});
