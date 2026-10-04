import { afterAll } from 'vitest';
import { runtime } from '../kernel/runtime';

// T-M-2, documented boundary: this file boots the FULL runtime and is
// intentionally NOT in vitest setupFiles (it would OOM shared runners and
// slow every unit file). Import it explicitly ONLY from tests that need the
// DI container (service-registration/*, integration tests). It must stay out
// of `test:stable` (see T-C-2). Tests needing only jsdom/IDB/mocks get
// setup-light.ts via vitest.config.ts and must not import this file.

await runtime.start();

afterAll(async () => {
    await runtime.shutdown();
});
