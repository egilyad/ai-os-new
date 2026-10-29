// Generator: export the Wiki corpus to GitHub-readable markdown under docs/wiki.
// Run: node scripts/gen-wiki-docs.mjs
// The same content is bundled in the app (Wiki panel). This mirror lets people and
// coding agents read the whole wiki straight from the repository, no build needed.
import { register } from 'tsx/esm/api';
import { writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, readFileSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';
import { parseNavSections, routeImportComponents, techniqueComponents, testsFor, panelArticles } from './lib/route-nav.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
register();

const { WIKI_ARTICLES, WIKI_SECTIONS } = await import(
    pathToFileURL(resolve(root, 'src/components/WikiPanel/wiki-articles.ts')).href
);

const outDir = resolve(root, 'docs/wiki');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const bySlug = new Map(WIKI_ARTICLES.map((a) => [a.slug, a]));
const sectionTitle = new Map(WIKI_SECTIONS.map((s) => [s.id, s.title]));

// ---- panel -> article connections (panel -> route -> component -> tests) ----
const panelArticle = panelArticles();
const components = { ...routeImportComponents(), ...techniqueComponents() };
const articlePanels = new Map();
for (const section of parseNavSections()) {
    for (const item of section.items) {
        const slug = panelArticle[item.id];
        if (!slug) continue;
        if (!articlePanels.has(slug)) articlePanels.set(slug, []);
        articlePanels.get(slug).push({
            id: item.id,
            route: item.path ?? `/${item.id}`,
            component: components[item.id] ?? null,
        });
    }
}

const HEADER =
    '<!-- АВТОСГЕНЕРАЦИЯ: файл создан scripts/gen-wiki-docs.mjs из корпуса Wiki (src/components/WikiPanel). Не редактировать вручную. -->';

function linkify(body) {
    return body.replace(/\[\[([^\]]+)\]\]/g, (_m, slug) => {
        const t = bySlug.get(slug);
        return t ? `[${t.title}](./${slug}.md)` : slug;
    });
}

for (const a of WIKI_ARTICLES) {
    const lines = [HEADER, '', `# ${a.title}`, ''];
    const meta = [`Раздел: **${sectionTitle.get(a.section) ?? a.section}**`, `Статус: ${a.freshness}`];
    if (a.tags.length) meta.push(`Теги: ${a.tags.join(', ')}`);
    lines.push(`> ${meta.join(' · ')}`, '');
    if (a.sources.length) {
        lines.push(`Источники: ${a.sources.map((s) => `\`${s}\``).join(', ')}`, '');
    }
    if (a.reviewed) {
        lines.push(`Проверено по коду: ${a.reviewed.at} · ${a.reviewed.by}`, '');
    }
    if (a.freshness === 'not-implemented') {
        lines.push('> ⚠️ Компонент не реализован: статья описывает план/намерение, а не рабочий факт.', '');
    }
    lines.push(linkify(a.body));
    if (a.related.length) {
        lines.push('', '---', '', '## Связанные материалы', '');
        for (const r of a.related) {
            const t = bySlug.get(r);
            lines.push(`- [${t ? t.title : r}](./${r}.md)`);
        }
    }
    const conns = articlePanels.get(a.slug);
    if (conns) {
        lines.push('', '---', '', '## Связи с кодом (авто)', '');
        lines.push('Цепочка «панель → маршрут → компонент → тесты» собрана из реестра маршрутов.', '');
        for (const c of conns) {
            lines.push(`- Панель \`${c.id}\` → маршрут \`${c.route}\``);
            if (c.component) lines.push(`  - Компонент: \`${c.component}\``);
            const tests = c.component ? testsFor(c.component) : [];
            lines.push(`  - Тесты: ${tests.length ? tests.map((t) => `\`${t}\``).join(', ') : '— (рядом с компонентом не найдены)'}`);
        }
        const links = ['[Каталог панелей](./panels-catalog.md)', '[Каталог компонентов OS](./dev-component-catalog.md)'];
        lines.push('', `См. также: ${links.join(' · ')}.`);
    }
    lines.push('', '[← Все материалы](./README.md)', '');
    writeFileSync(resolve(outDir, `${a.slug}.md`), lines.join('\n'), 'utf8');
}

const idx = [];
idx.push('# Wiki SuperAgents OS', '');
idx.push('[← README (рус.)](../README.md) · [English README](../README_EN.md)', '');
idx.push(
    '> Полная документация системы: панели, агенты, дебаты, память, провайдеры, диагностика, история разработки, архитектура и руководства для разработчиков.',
);
idx.push(
    '> Страницы автосгенерированы из корпуса Wiki (`scripts/gen-wiki-docs.mjs`). Та же документация доступна в приложении в панели «Wiki».',
);
idx.push('', `Всего материалов: **${WIKI_ARTICLES.length}** в ${WIKI_SECTIONS.length} разделах.`, '');
idx.push(
    '> Разработчикам: начните с [Обзор для разработчиков](./dev-overview.md), затем [Структура](./dev-layout.md) и [Каталог компонентов](./dev-component-catalog.md).',
);
idx.push('', '## Разделы', '');
idx.push('| Раздел | Материалов |');
idx.push('| --- | --- |');
for (const section of WIKI_SECTIONS) {
    const arts = WIKI_ARTICLES.filter((a) => a.section === section.id);
    if (!arts.length) continue;
    idx.push(`| ${section.title} | ${arts.length} |`);
}
idx.push('');
for (const section of WIKI_SECTIONS) {
    const arts = WIKI_ARTICLES.filter((a) => a.section === section.id);
    if (!arts.length) continue;
    idx.push(`## ${section.title} (${arts.length})`, '');
    for (const a of arts) idx.push(`- [${a.title}](./${a.slug}.md) — _${a.freshness}_`);
    idx.push('');
}
writeFileSync(resolve(outDir, 'README.md'), idx.join('\n'), 'utf8');

// ---- sessions mirror: source drawn from docs/sessions (committed, survives regeneration) ----
const SESSIONS_SRC = resolve(root, 'docs/sessions');
if (existsSync(SESSIONS_SRC)) {
    const sessionsOut = resolve(outDir, 'sessions');
    mkdirSync(sessionsOut, { recursive: true });
    for (const f of readdirSync(SESSIONS_SRC)) {
        if (f.endsWith('.md')) {
            writeFileSync(
                resolve(sessionsOut, f),
                readFileSync(resolve(SESSIONS_SRC, f), 'utf8'),
                'utf8',
            );
        }
    }
}

console.log(`wiki docs: ${WIKI_ARTICLES.length} articles -> docs/wiki/`);
