import { afterAll } from 'vitest';
import { runtime } from '../kernel/runtime';

await runtime.start();

afterAll(async () => {
    await runtime.shutdown();
});
