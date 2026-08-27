#!/usr/bin/env node
/**
 * FA-02 codemod: replace raw hex/rgba color literals in React inline styles
 * with theme-aware `var(--token)` references (tokens defined in styles/variables.css).
 *
 * Scope: only literal string values on color-bearing style properties are
 * rewritten. Dynamic values (identifiers, template literals, `undefined`) and
 * values not present in the map are left untouched.
 *
 * Usage:
 *   node scripts/tokenize-colors.mjs <file-or-dir> [--apply]
 * Default mode is dry-run (prints files, writes nothing). Pass --apply to write.
 */
import fs from 'node:fs';
import path from 'node:path';

const HEX_MAP = {
    '#f8fafc': 'slate-50',
    '#f1f5f9': 'slate-100',
    '#e2e8f0': 'slate-200',
    '#cbd5e1': 'slate-300',
    '#94a3b8': 'slate-400',
    '#64748b': 'slate-500',
    '#475569': 'slate-600',
    '#334155': 'slate-700',
    '#1e293b': 'slate-800',
    '#0f172a': 'slate-900',
    '#020617': 'slate-950',
    '#3b82f6': 'accent',
    '#10b981': 'success',
    '#22c55e': 'success',
    '#ef4444': 'error',
    '#f59e0b': 'warning',
    '#fbbf24': 'warning',
    '#38bdf8': 'info',
    '#8b5cf6': 'purple',
    '#a78bfa': 'purple-muted',
    '#09090b': 'bg-main',
    '#111114': 'bg-elevated',
    '#27272a': 'border',
    'rgba(255,255,255,0.08)': 'border-subtle',
    'rgba(255, 255, 255, 0.08)': 'border-subtle',
    'rgba(255,255,255,0.1)': 'border-default',
    'rgba(255, 255, 255, 0.1)': 'border-default',
    'rgba(255,255,255,0.2)': 'border-strong',
    'rgba(255, 255, 255, 0.2)': 'border-strong',
    'rgba(59,130,246,0.5)': 'accent-glow',
    'rgba(59, 130, 246, 0.5)': 'accent-glow',
    // tinted state-backgrounds
    'rgba(239,68,68,0.1)': 'error-tint',
    'rgba(239, 68, 68, 0.1)': 'error-tint',
    'rgba(16,185,129,0.1)': 'success-tint',
    'rgba(16, 185, 129, 0.1)': 'success-tint',
    'rgba(34,197,94,0.1)': 'success-tint',
    'rgba(34, 197, 94, 0.1)': 'success-tint',
    'rgba(59,130,246,0.1)': 'accent-tint',
    'rgba(59, 130, 246, 0.1)': 'accent-tint',
    'rgba(245,158,11,0.1)': 'warning-tint',
    'rgba(245, 158, 11, 0.1)': 'warning-tint',
    'rgba(251,191,36,0.1)': 'warning-tint',
    'rgba(251, 191, 36, 0.1)': 'warning-tint',
    'rgba(139,92,246,0.1)': 'purple-tint',
    'rgba(139, 92, 246, 0.1)': 'purple-tint',
    'rgba(168,85,247,0.1)': 'purple-tint',
    'rgba(168, 85, 247, 0.1)': 'purple-tint',
    'rgba(56,189,248,0.1)': 'info-tint',
    'rgba(56, 189, 248, 0.1)': 'info-tint',
};

const COLOR_PROPS = [
    'color',
    'background',
    'backgroundColor',
    'border',
    'borderColor',
    'borderTop',
    'borderBottom',
    'borderLeft',
    'borderRight',
    'borderTopColor',
    'borderBottomColor',
    'outlineColor',
    'fill',
    'stroke',
    'caretColor',
];

// Pre-normalize keys (strip optional spaces inside rgba) into a lookup.
const LOOKUP = new Map();
for (const [k, v] of Object.entries(HEX_MAP)) {
    LOOKUP.set(k, v);
    LOOKUP.set(k.replace(/\s+/g, ''), v);
}

// Single combined regex: capture prop, quote, and value.
const propAlt = COLOR_PROPS.join('|');
const valueAlt = Object.keys(HEX_MAP)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
const RE = new RegExp(`(\\b(?:${propAlt})\\s*:\\s*)(['"])(${valueAlt})(['"])`, 'g');

function tokenizeLine(line) {
    let changed = false;
    const out = line.replace(RE, (_m, p1, q1, val, q2) => {
        const token = LOOKUP.get(val) || LOOKUP.get(val.replace(/\s+/g, ''));
        if (!token) return _m;
        changed = true;
        return `${p1}${q1}var(--${token})${q2}`;
    });
    return { line: out, changed };
}

function walk(dir, files) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            walk(full, files);
        } else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            if (/\.(test|spec)\.(tsx|ts)$/.test(entry.name)) continue; // never rewrite tests
            files.push(full);
        }
    }
}

function main() {
    const target = process.argv[2];
    const apply = process.argv.includes('--apply');
    if (!target) {
        console.error('Usage: node scripts/tokenize-colors.mjs <file-or-dir> [--apply]');
        process.exit(1);
    }
    const files = [];
    const stat = fs.statSync(target);
    if (stat.isDirectory()) walk(target, files);
    else files.push(target);

    let totalChanged = 0;
    for (const file of files) {
        const src = fs.readFileSync(file, 'utf8');
        const lines = src.split('\n');
        let fileChanged = false;
        const newLines = lines.map((l) => {
            const { line, changed } = tokenizeLine(l);
            if (changed) fileChanged = true;
            return line;
        });
        if (!fileChanged) continue;
        totalChanged++;
        if (!apply) {
            console.log(`[dry-run] would rewrite: ${file}`);
        } else {
            fs.writeFileSync(file, newLines.join('\n'), 'utf8');
            console.log(`rewrote: ${file}`);
        }
    }
    console.log(`\n${apply ? 'Applied to' : 'Would apply to'} ${totalChanged} file(s).`);
}

main();
