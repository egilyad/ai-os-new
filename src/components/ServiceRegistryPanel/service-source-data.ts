export const serviceSourceFiles: string[] = (() => {
    try {
        const glob = import.meta.glob('/src/kernel/services/**/*.ts', { eager: false });
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
        const glob = import.meta.glob('/src/kernel/services/**/*.ts', { eager: false });
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
