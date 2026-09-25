// Negative patterns keep *.test.ts / *.spec.ts out of the Rollup graph.
// Runtime .filter() below is belt-and-braces: by the time it runs, Rollup
// has already emitted chunks for every matched file, so filtering must
// happen here, at glob level — otherwise vitest leaks into the prod bundle
// and crashes boot (runner.config undefined).
const SERVICE_GLOB_PATTERNS = [
    '/src/kernel/services/**/*.ts',
    '!/src/kernel/services/**/*.test.ts',
    '!/src/kernel/services/**/*.spec.ts',
    '!/src/kernel/services/**/*.d.ts',
    '!/src/kernel/services/**/node_modules/**',
];

export const serviceSourceFiles: string[] = (() => {
    try {
        const glob = import.meta.glob(SERVICE_GLOB_PATTERNS, { eager: false });
        return Object.keys(glob)
            .filter(
                (p) =>
                    !p.endsWith('.test.ts') &&
                    !p.endsWith('.spec.ts') &&
                    !p.endsWith('.d.ts') &&
                    !p.includes('node_modules'),
            )
            .map((p) => p.split('/').pop()!.replace('.ts', ''))
            .filter((n) => n.length > 0);
    } catch {
        return [];
    }
})();

export const serviceSourcePaths: Record<string, string> = (() => {
    try {
        const glob = import.meta.glob(SERVICE_GLOB_PATTERNS, { eager: false });
        const map: Record<string, string> = {};
        for (const p of Object.keys(glob)) {
            if (
                p.endsWith('.test.ts') ||
                p.endsWith('.spec.ts') ||
                p.endsWith('.d.ts') ||
                p.includes('node_modules')
            )
                continue;
            const name = p.split('/').pop()!.replace('.ts', '');
            map[name] = p.startsWith('/') ? p.slice(1) : p;
        }
        return map;
    } catch {
        return {};
    }
})();
