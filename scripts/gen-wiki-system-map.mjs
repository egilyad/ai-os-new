// Stage 4 generator: the system map — the layers of SuperAgents OS and where each
// is documented. Existing layers link to their catalogs; the layers that had no
// catalog yet (roles/agents, debate strategies, provider pools) are generated
// here straight from their code constants (single source of truth).
// Run: node scripts/gen-wiki-system-map.mjs
// Output: src/generated/wiki-system-map.ts -> SYSTEM_MAP_MARKDOWN
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const genDir = resolve(root, 'src/generated');
mkdirSync(genDir, { recursive: true });

const read = (p) => readFileSync(resolve(root, p), 'utf8');

// --- roles / agents (src/data/role-library.ts) ---
const roleSrc = read('src/data/role-library.ts');
const roles = roleSrc
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

// --- provider pools (src/constants/pools.ts) ---
const poolSrc = read('src/constants/pools.ts');
const pools = [...poolSrc.matchAll(/\{ id: '([^']+)', name: '([^']+)', color: '[^']*', description: '([^']*)', providers: \[([^\]]*)\] \}/g)].map(
    (m) => ({
        id: m[1],
        name: m[2],
        description: m[3],
        providers: m[4].split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean),
    }),
);

// --- debate strategies (src/components/DebatePanel/wizard-constants.ts) ---
const wizSrc = read('src/components/DebatePanel/wizard-constants.ts');
const namesBlock = /const names: Record<string, string> = \{([\s\S]*?)\};/.exec(wizSrc)?.[1] ?? '';
const strategies = [...namesBlock.matchAll(/(\w+): '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }));

// --- layers (where each is described) ---
const LAYERS = [
    ['Интерфейс: панели и маршруты', 'src/route-registry-*.ts, src/route-imports.ts', '[[panels-catalog]]'],
    ['Компоненты', 'src/components/**', '[[dev-component-catalog]]'],
    ['Сервисы ядра', 'src/kernel/services/**', '[[dev-service-map]]'],
    ['События', 'src/kernel/events/**', '[[dev-event-catalog]]'],
    ['Хранилища', 'src/**/stores, Dexie', '[[dev-store-catalog]]'],
    ['Контракты', 'src/kernel/contracts/**', '[[dev-contracts]]'],
    ['Локализация', 'src/i18n/**', '[[dev-i18n-catalog]]'],
    ['Тесты', '**/*.test.*', '[[dev-tests-catalog]]'],
    ['Скрипты и генераторы', 'scripts/**', '[[dev-scripts]]'],
    ['Роли и агенты', 'src/data/role-library.ts', 'этот документ'],
    ['Стратегии дебатов', 'src/components/DebatePanel/wizard-constants.ts', 'этот документ'],
    ['Провайдеры (пулы)', 'src/constants/pools.ts', 'этот документ'],
];

const md = [];
md.push('# Карта системы');
md.push('');
md.push('> Автосгенерировано `scripts/gen-wiki-system-map.mjs` из кода (роли, стратегии, пулы) и каталогов. Не редактировать вручную.');
md.push('');
md.push('Слои SuperAgents OS и где каждый описан. Источник — код; числа и связи подтверждаются');
md.push('генераторами, а правила — [[docs-standard]]. Полный список документов — [[docs-index]].');
md.push('');
md.push('## Слои системы');
md.push('');
md.push('| Слой | Где в коде | Документация |');
md.push('| --- | --- | --- |');
for (const [layer, where, doc] of LAYERS) md.push(`| ${layer} | \`${where}\` | ${doc} |`);
md.push('');
md.push(`## Роли и агенты (${roles.length})`);
md.push('');
md.push('Библиотека ролей — `src/data/role-library.ts` (`LIBRARY_ROLES`).');
md.push('');
md.push('| ID | Название | Категория | Темп. | Реком. модель |');
md.push('| --- | --- | --- | --- | --- |');
for (const r of roles) md.push(`| \`${r.id}\` | ${r.name} | ${r.category} | ${r.temp ?? '—'} | ${r.model ? `\`${r.model}\`` : '—'} |`);
md.push('');
md.push('## Стратегии дебатов');
md.push('');
md.push('Встроенные стратегии — `src/components/DebatePanel/wizard-constants.ts`.');
md.push('');
md.push(strategies.map((s) => `\`${s.id}\``).join(' · '));
md.push('');
md.push(`Итого: **${strategies.length}** стратегий.`);
md.push('');
md.push('## Провайдеры (пулы)');
md.push('');
md.push('Определения пулов — `src/constants/pools.ts` (`POOL_DEFS`).');
md.push('');
md.push('| Пул | Провайдеры | Назначение |');
md.push('| --- | --- | --- |');
for (const p of pools) md.push(`| ${p.name} | ${p.providers.map((x) => `\`${x}\``).join(', ')} | ${p.description} |`);
md.push('');
const providers = [...new Set([...pools.flatMap((p) => p.providers), ...roles.map((r) => (r.model ? r.model.split(':')[0] : null)).filter(Boolean)])].sort();
md.push(`Упоминаемые провайдеры: ${providers.map((x) => `\`${x}\``).join(', ')}.`);
md.push('');
md.push('## Пробелы (по плану этапа)');
md.push('');
md.push('- **Внешние библиотеки** — отдельный каталог из `package.json` ещё не собран.');
md.push('- **Архитектурные решения** — реестр решений (ADR) пока не выделен: см. источники в [[docs-index]].');
md.push('- Разделы «роли», «стратегии», «провайдеры» — часть этой страницы; при росте выносятся');
md.push('  в отдельные каталоги по образцу остальных (см. [[dev-generators]]).');

writeFileSync(
    resolve(genDir, 'wiki-system-map.ts'),
    `// Generated by node scripts/gen-wiki-system-map.mjs — do not hand-edit.\nexport const SYSTEM_MAP_MARKDOWN: string = ${JSON.stringify(md.join('\n'))};\n`,
);
console.log(
    `system map: ${roles.length} roles, ${strategies.length} strategies, ${pools.length} pools -> src/generated/wiki-system-map.ts`,
);
