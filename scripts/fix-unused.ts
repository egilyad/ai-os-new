import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname!, '..');

// Run tsc, capture errors (exit code is non-zero, so catch it)
let tscOutput: string;
try {
    tscOutput = execSync('npx tsc --noEmit -p tsconfig.app.json', {
        cwd: ROOT,
        encoding: 'utf-8',
    }).toString();
} catch (e: unknown) {
    tscOutput = (e as { stdout?: Buffer }).stdout?.toString() || '';
}

// Parse errors from tsc output (line-based, format: file(line,col): error TScode: message)
interface Err {
    file: string;
    line: number;
    code: string;
    name: string;
}
const errors: Err[] = [];
for (const rawLine of tscOutput.split('\n')) {
    const line = rawLine.trimEnd();
    const m = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
    if (!m) continue;
    const code = m[4],
        msg = m[5];
    if (code === 'TS6192') {
        errors.push({ file: m[1], line: +m[2], code, name: '' });
    } else if (code === 'TS6133' || code === 'TS6196') {
        const nm = msg.match(/'([^']+)'/);
        if (nm) errors.push({ file: m[1], line: +m[2], code, name: nm[1] });
    }
}

console.log(`tscOutput length: ${tscOutput.length}`);
console.log(`First line: ${tscOutput.split('\n')[0]?.slice(0, 100)}`);
console.log(`Found ${errors.length} fixable errors.`);

// Group by file
const byFile = new Map<string, Err[]>();
for (const e of errors) {
    const p = resolve(ROOT, e.file);
    if (!byFile.has(p)) byFile.set(p, []);
    byFile.get(p)!.push(e);
}

let totalFixed = 0;
let fileCount = 0;

for (const [filePath, fileErrors] of byFile) {
    if (!existsSync(filePath)) {
        console.warn(`Missing: ${filePath}`);
        continue;
    }

    const original = readFileSync(filePath, 'utf-8');
    const origLines = original.split('\n');
    const linesToRemove = new Set<number>();
    const lineReplacements = new Map<number, string>();

    for (const err of fileErrors) {
        const idx = err.line - 1;
        if (idx < 0 || idx >= origLines.length) continue;
        if (linesToRemove.has(idx)) continue;

        const line = origLines[idx];

        if (err.code === 'TS6192') {
            const range = findImportRange(origLines, idx);
            if (range) {
                for (let i = range.start; i <= range.end; i++) linesToRemove.add(i);
            } else {
                linesToRemove.add(idx);
            }
            totalFixed++;
            continue;
        }

        // TS6133 / TS6196 — find what kind of declaration
        const trimmed = line.trimStart();
        const ws = line.slice(0, line.length - trimmed.length);

        let replacement: string | null = null;

        // Import statement (single line)
        if (/^import\s/.test(trimmed)) {
            replacement = removeFromImportLine(trimmed, ws, err.name);
        }
        // Multi-line import continuation
        else if (isInMultiImport(origLines, idx)) {
            replacement = removeFromMultiImportLine(line, err.name);
        }
        // Destructuring
        else if (line.includes('{') && line.includes(err.name)) {
            replacement = removeFromDestructuring(line, err.name);
        }
        // Standalone declaration
        else if (isStandaloneDecl(trimmed, err.name)) {
            linesToRemove.add(idx);
            totalFixed++;
            continue;
        }
        // Class property
        else if (isClassProp(trimmed, err.name)) {
            linesToRemove.add(idx);
            totalFixed++;
            continue;
        }
        // Function parameter — prefix underscore
        else if (isFunctionParam(line, err.name)) {
            replacement = line.replace(new RegExp(`\\b${esc(err.name)}\\b`), `_${err.name}`);
        }

        if (replacement !== null) {
            if (replacement.trim() === '') {
                linesToRemove.add(idx);
            } else {
                lineReplacements.set(idx, replacement);
            }
            totalFixed++;
        } else {
            console.warn(
                `  SKIP ${err.file}:${err.line} '${err.name}' — ${line.trim().slice(0, 80)}`,
            );
        }
    }

    // Apply removals (bottom-to-top)
    const resultLines = [...origLines];
    const removed = new Set<number>();
    const sortedRemove = [...linesToRemove].sort((a, b) => b - a);
    for (const r of sortedRemove) {
        resultLines.splice(r, 1);
        removed.add(r);
    }

    // Apply replacements (adjusting for removals)
    const shiftBefore = (origLine: number): number => {
        let shift = 0;
        for (const r of removed) if (r < origLine) shift++;
        return origLine - shift;
    };

    // Sort replacements by line ascending
    const sortedReplace = [...lineReplacements.entries()].sort((a, b) => a[0] - b[0]);
    for (const [origIdx, newText] of sortedReplace) {
        const adjIdx = shiftBefore(origIdx);
        if (adjIdx >= 0 && adjIdx < resultLines.length) {
            resultLines[adjIdx] = newText;
        }
    }

    const result = resultLines.join('\n');
    if (result !== original) {
        writeFileSync(filePath, result, 'utf-8');
        fileCount++;
    }
}

console.log(`Done. Fixed ${totalFixed} errors in ${fileCount} files.`);

// === Helpers ===

function esc(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findImportRange(lines: string[], idx: number): { start: number; end: number } | null {
    if (!lines[idx]?.includes('import')) return null;
    if (lines[idx].trim().endsWith(';')) return { start: idx, end: idx };
    let end = idx;
    while (end < lines.length && !lines[end].trim().endsWith(';')) end++;
    return end < lines.length ? { start: idx, end } : null;
}

function isInMultiImport(lines: string[], idx: number): boolean {
    for (let i = idx - 1; i >= Math.max(0, idx - 20); i--) {
        const l = lines[i].trimStart();
        if (l.startsWith('import ') || l.startsWith('import type ')) return true;
        if (l.includes(';') && !l.startsWith('import')) return false;
    }
    return false;
}

function removeFromImportLine(trimmed: string, ws: string, name: string): string | null {
    // import { A, B } from 'x'
    // import type { A } from 'x'
    // import X from 'y'
    // import X, { A } from 'y'
    const m = trimmed.match(
        /^(import\s+(?:type\s+)?)(?:(\w+)\s*,\s*)?\s*\{([^}]*)\}\s*from\s+(['"`][^'"]+['"`])/,
    );
    if (m) {
        const prefix = m[1];
        const defaultName = m[2];
        const specStr = m[3];
        const fromPart = m[4];
        const specs = specStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const idx = specs.findIndex((s) => {
            const clean = s
                .replace(/^type\s+/, '')
                .replace(/\s+as\s+\w+$/, '')
                .trim();
            return clean === name;
        });

        if (idx !== -1) {
            specs.splice(idx, 1);
            if (specs.length === 0 && !defaultName) return ''; // all imports gone
            if (specs.length === 0 && defaultName)
                return ws + `${prefix}${defaultName} from ${fromPart}`;
            return (
                ws +
                `${prefix}${defaultName ? defaultName + ', ' : ''}{ ${specs.join(', ')} } from ${fromPart}`
            );
        }

        // Maybe default import is the one to remove
        if (defaultName === name) {
            // import X, { A } from 'y' -> import { A } from 'y'
            return ws + `${prefix}{ ${specs.join(', ')} } from ${fromPart}`;
        }
        return null;
    }

    // import X from 'y' (no braces)
    const m2 = trimmed.match(/^(import\s+(?:type\s+)?)(\w+)\s+from\s+(['"`][^'"]+['"`])/);
    if (m2 && m2[2] === name) return '';

    return null;
}

function removeFromMultiImportLine(line: string, name: string): string | null {
    const trimmed = line.trim();
    const ws = line.slice(0, line.length - trimmed.length);
    const pat = new RegExp(`\\b${esc(name)}\\b`);
    if (!pat.test(trimmed)) return null;

    let r = trimmed.replace(pat, '').trim();
    r = r.replace(/^,\s*/, '');
    r = r.replace(/\s*,\s*$/, '');
    r = r.replace(/,\s*,/g, ',');
    r = r.replace(/^type\s+$/, '');
    return r ? ws + r : '';
}

function removeFromDestructuring(line: string, name: string): string | null {
    const pat = new RegExp(`\\b${esc(name)}\\b`);
    if (!pat.test(line)) return null;

    // Find innermost {...} containing name
    let depth = 0,
        start = -1,
        end = -1;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '{') {
            if (depth === 0) start = i;
            depth++;
        } else if (line[i] === '}') {
            depth--;
            if (depth === 0 && start !== -1) {
                end = i + 1;
                if (line.slice(start, end).includes(name)) break;
                start = -1;
            }
        }
    }
    if (start === -1) return null;

    const before = line.slice(0, start);
    const after = line.slice(end);
    const inner = line.slice(start + 1, end - 1);
    const items = inner.split(',').map((s) => s.trim());
    const idx = items.findIndex((s) => {
        const clean = s
            .replace(/^(\.\.\.|type\s+)/, '')
            .replace(/\s*[:=].*$/, '')
            .trim();
        return clean === name;
    });
    if (idx === -1) return null;
    items.splice(idx, 1);
    return `${before}{${items.filter(Boolean).length ? ' ' + items.filter(Boolean).join(', ') + ' ' : ''}}${after}`;
}

function isStandaloneDecl(trimmed: string, name: string): boolean {
    const e = esc(name);
    if (new RegExp(`^(export\\s+)?(const|let|var)\\s+${e}(\\s*[:=!;]|\\s*$)`).test(trimmed))
        return true;
    if (
        new RegExp(`^(export\\s+)?(async\\s+)?(function|class)\\s+${e}(\\s*[<(]|\\s*$)`).test(
            trimmed,
        )
    )
        return true;
    if (new RegExp(`^(export\\s+)?\\{.*\\b${e}\\b.*\\}`).test(trimmed)) return true;
    return false;
}

function isClassProp(trimmed: string, name: string): boolean {
    return new RegExp(`^(public|private|protected|readonly)\\s+${esc(name)}\\b`).test(trimmed);
}

function isFunctionParam(line: string, name: string): boolean {
    return new RegExp(`\\([^)]*\\b${esc(name)}\\b[^)]*\\)\\s*[:\\)=>(\\{]`).test(line);
}
