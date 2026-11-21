#!/usr/bin/env node
/**
 * gen-skill-from-docs.mjs — turn a set of project docs into reusable agent skills.
 *
 * Usage:
 *   node scripts/gen-skill-from-docs.mjs \
 *     --name superagents-architecture \
 *     --description "Explains SuperAgents OS architecture to agents." \
 *     --docs docs/01-system-architecture.md docs/STRUCTURE.md docs/wiki/dev-overview.md \
 *     --out .superagents/skills/superagents-architecture
 *
 * Output: SKILL.md (frontmatter + steps) + Chapters/<slug>.md (lazy-loaded),
 * Patterns.md, Cheatsheet.md. Each chapter carries its source path so an agent
 * can open the original document. No new dependencies; deterministic fallback
 * when no LLM is configured.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
    const out = { docs: [], name: '', description: '', out: '' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--docs') {
            while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out.docs.push(argv[++i]);
        } else if (a === '--name') {
            out.name = argv[++i] || '';
        } else if (a === '--description') {
            out.description = argv[++i] || '';
        } else if (a === '--out') {
            out.out = argv[++i] || '';
        }
    }
    return out;
}

function topicsFromMarkdown(markdown) {
    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const topics = [];
    for (const line of lines) {
        const m = /^(#{1,3})\s+(.+)$/.exec(line);
        if (!m) continue;
        const level = m[1].length;
        const title = m[2].trim();
        if (level <= 3 && title.length > 2) topics.push(title);
    }
    return topics;
}

function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zа-яё0-9]+/giu, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48) || 'section';
}

function readDocs(paths) {
    return paths
        .map((p) => {
            const abs = resolve(ROOT, p);
            if (!existsSync(abs)) return null;
            return { path: p, text: readFileSync(abs, 'utf8') };
        })
        .filter(Boolean);
}

function buildSkill(args, docs) {
    const name = args.name || slugify(basename(args.docs[0] ?? 'skill'));
    const description = (args.description || `Knowledge skill built from ${docs.length} docs.`).slice(0, 60).replace(/\.$/, '') + '.';
    const chapters = [];
    for (const doc of docs) {
        const topics = topicsFromMarkdown(doc.text);
        const slices = topics.length > 0 ? topics : [basename(doc.path, '.md')];
        for (const topic of slices.slice(0, 30)) {
            chapters.push({ title: topic, source: doc.path, slug: slugify(topic) });
        }
    }

    const skill = [
        '---',
        `name: ${name}`,
        `description: ${description}`,
        'version: 1.0.0',
        'tags: knowledge, docs, superagents-os',
        '---',
        '',
        '# Purpose',
        '',
        `This skill packages ${docs.length} project documents into an on-demand knowledge base.`,
        '',
        '# Procedure',
        '',
        ...chapters.map((c, i) => `${i + 1}. Read \`Chapters/${c.slug}.md\` when you need: ${c.title}.`),
        '',
        'Use Patterns.md for recurring solutions and Cheatsheet.md for quick decisions.',
        '',
        '# Completion criteria',
        '',
        '- Answer the question using loaded chapters only, cite the source path.',
        '- If a chapter is insufficient, open the original document in sources and extract more.',
    ].join('\n');

    const patterns = [
        '# Patterns',
        '',
        ...chapters.map(
            (c) => `## ${c.title}\n\nSource: \`${c.source}\`\n\nApply this knowledge when the task touches: ${c.title.toLowerCase()}.`,
        ),
    ].join('\n');

    const cheatsheet = [
        '# Cheatsheet',
        '',
        '| Topic | Chapter | Source |',
        '| --- | --- | --- |',
        ...chapters.map((c) => `| ${c.title} | \`Chapters/${c.slug}.md\` | \`${c.source}\` |`),
    ].join('\n');

    const chapterFiles = chapters.map((c) => ({
        slug: c.slug,
        title: c.title,
        text: [
            `# ${c.title}`,
            '',
            `> Source: \`${c.source}\``,
            '',
            'Load the original document via the source path for full detail.',
            '',
            `This chapter covers: ${c.title}. Relevant decisions and constraints are in the source.`,
        ].join('\n'),
    }));

    return { skill, patterns, cheatsheet, chapters: chapterFiles, name };
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (args.docs.length === 0) {
        console.error('Usage: gen-skill-from-docs.mjs --name <id> --description <text> --docs <files...> --out <dir>');
        process.exit(2);
    }
    const docs = readDocs(args.docs);
    if (docs.length === 0) {
        console.error('No existing docs found');
        process.exit(1);
    }
    const built = buildSkill(args, docs);
    const outDir = resolve(ROOT, args.out || join('.superagents', 'skills', built.name));
    const chaptersDir = join(outDir, 'Chapters');
    mkdirSync(chaptersDir, { recursive: true });
    writeFileSync(join(outDir, 'SKILL.md'), built.skill, 'utf8');
    writeFileSync(join(outDir, 'Patterns.md'), built.patterns, 'utf8');
    writeFileSync(join(outDir, 'Cheatsheet.md'), built.cheatsheet, 'utf8');
    for (const c of built.chapters) {
        writeFileSync(join(chaptersDir, `${c.slug}.md`), c.text, 'utf8');
    }
    console.log(`skill: ${built.name} → ${outDir} (${built.chapters.length} chapters)`);
}

main();
