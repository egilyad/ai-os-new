// Generator: export the Wiki corpus to GitHub-readable markdown under docs/wiki.
// Run: node scripts/gen-wiki-docs.mjs
// The same content is bundled in the app (Wiki panel). This mirror lets people and
// coding agents read the whole wiki straight from the repository, no build needed.
import { register } from 'tsx/esm/api';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, resolve } from 'path';

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
    lines.push(linkify(a.body));
    if (a.related.length) {
        lines.push('', '---', '', '## Связанные материалы', '');
        for (const r of a.related) {
            const t = bySlug.get(r);
            lines.push(`- [${t ? t.title : r}](./${r}.md)`);
        }
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

console.log(`wiki docs: ${WIKI_ARTICLES.length} articles -> docs/wiki/`);
