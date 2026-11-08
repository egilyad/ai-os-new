/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/tests/setup-light.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
        testTimeout: 15000,
        hookTimeout: 15000,
        // Heavy store tests under v8 coverage can need longer worker teardown
        // on shared GH runners ("Timeout terminating forks worker").
        teardownTimeout: 30000,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov', 'html'],
            // P1.8: coverage.include is scoped to directories with stable, passing
            // tests. With `all: true` (v8 default) every file matching include is
            // counted, so a broad include of all of src would report ~4% and make
            // any threshold meaningless. Extend this list as P1.3–P1.7 add tests
            // to kernel/services, memory, key-management, llm, and workers.
            include: [
                'src/stores/**',
                'src/hooks/**',
                'src/kernel/events/**',
                'src/kernel/workers/**',
                'src/kernel/container.ts',
                'src/kernel/utils/**',
                'src/kernel/services/key-management/**',
                'src/components/WikiPanel/**',
                // QW-1: extend include to directories covered by the stable
                // test set (same paths as test:coverage) with a high
                // test-to-file ratio. Measured 2026-11-08: All files
                // 36.22% stmts / 29.91% branch / 36.03% funcs / 37.3% lines.
                'src/kernel/services/storage/**',
                'src/kernel/services/event-sourcing/**',
                'src/kernel/services/trust/**',
                'src/kernel/services/llm-bridge/**',
                'src/kernel/services/ops/**',
                'src/kernel/services/browser/**',
                'src/llm/http/**',
                'src/llm/decorators/**',
                'src/llm/registry/**',
            ],
            exclude: ['src/**/*.test.*', 'src/**/*.d.ts', 'src/types/**'],
            // P1.8: 30% floor on covered code. Measured 2026-08-01:
            //   stores+hooks:                66.68% stmts / 50.51% branch
            //   kernel events+workers+cont:  62.76% stmts / 57.67% branch
            //   combined set:                ~46% stmts / ~40% branch
            thresholds: {
                statements: 30,
                branches: 20,
                functions: 30,
                lines: 30,
            },
        },
    },
});
