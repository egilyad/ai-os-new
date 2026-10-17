// Code-truth catalogs shared by the wiki generators. Each parser reads the
// source constants that actually define the entities, so the wiki article and
// the machine manifest cannot disagree about the counts.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => readFileSync(resolve(root, p), 'utf8');

// --- roles / agents (src/data/role-library.ts) ---
export function roleCatalog() {
    const roleSrc = read('src/data/role-library.ts');
    return roleSrc
        .split(/\n {4}\{\n/)
        .slice(1)
        .map((chunk) => {
            const f = (re) => re.exec(chunk)?.[1];
            const caps = f(/capabilities: \[([^\]]*)\]/);
            return {
                id: f(/id: '([^']+)'/),
                name: f(/name: '([^']+)'/),
                category: f(/category: '([^']+)'/),
                temp: f(/baseTemperature: ([\d.]+)/),
                model: f(/recommendedModel: '([^']+)'/),
                caps: caps ? caps.split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean) : [],
            };
        })
        .filter((r) => r.id && r.name);
}

// --- provider pools (src/constants/pools.ts) ---
export function poolCatalog() {
    const poolSrc = read('src/constants/pools.ts');
    return [
        ...poolSrc.matchAll(
            /\{ id: '([^']+)', name: '([^']+)', color: '[^']*', description: '([^']*)', providers: \[([^\]]*)\] \}/g,
        ),
    ].map((m) => ({
        id: m[1],
        name: m[2],
        description: m[3],
        providers: m[4].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean),
    }));
}

// --- debate strategies (src/components/DebatePanel/wizard-constants.ts) ---
export function strategyCatalog() {
    const wizSrc = read('src/components/DebatePanel/wizard-constants.ts');
    const namesBlock = /const names: Record<string, string> = \{([\s\S]*?)\};/.exec(wizSrc)?.[1] ?? '';
    return [...namesBlock.matchAll(/(\w+): '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }));
}
