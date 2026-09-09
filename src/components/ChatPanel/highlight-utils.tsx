import DOMPurify from 'dompurify';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const HIGHLIGHT_KEYWORDS: Record<string, string[]> = {
    ts: [
        'abstract',
        'as',
        'async',
        'await',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'enum',
        'export',
        'extends',
        'false',
        'finally',
        'for',
        'from',
        'function',
        'if',
        'implements',
        'import',
        'in',
        'instanceof',
        'interface',
        'let',
        'new',
        'null',
        'of',
        'package',
        'private',
        'protected',
        'public',
        'readonly',
        'return',
        'static',
        'super',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'type',
        'typeof',
        'undefined',
        'var',
        'void',
        'while',
        'with',
        'yield',
    ],
    js: [
        'async',
        'await',
        'break',
        'case',
        'catch',
        'class',
        'const',
        'continue',
        'debugger',
        'default',
        'delete',
        'do',
        'else',
        'export',
        'extends',
        'false',
        'finally',
        'for',
        'function',
        'if',
        'import',
        'in',
        'instanceof',
        'let',
        'new',
        'null',
        'of',
        'return',
        'static',
        'super',
        'switch',
        'this',
        'throw',
        'true',
        'try',
        'typeof',
        'undefined',
        'var',
        'void',
        'while',
        'with',
        'yield',
    ],
    python: [
        'False',
        'None',
        'True',
        'and',
        'as',
        'assert',
        'async',
        'await',
        'break',
        'class',
        'continue',
        'def',
        'del',
        'elif',
        'else',
        'except',
        'finally',
        'for',
        'from',
        'global',
        'if',
        'import',
        'in',
        'is',
        'lambda',
        'nonlocal',
        'not',
        'or',
        'pass',
        'raise',
        'return',
        'try',
        'while',
        'with',
        'yield',
    ],
    go: [
        'break',
        'case',
        'chan',
        'const',
        'continue',
        'default',
        'defer',
        'else',
        'fallthrough',
        'for',
        'func',
        'go',
        'goto',
        'if',
        'import',
        'interface',
        'map',
        'package',
        'range',
        'return',
        'select',
        'struct',
        'switch',
        'type',
        'var',
    ],
    rust: [
        'as',
        'async',
        'await',
        'break',
        'const',
        'continue',
        'crate',
        'dyn',
        'else',
        'enum',
        'extern',
        'false',
        'fn',
        'for',
        'if',
        'impl',
        'in',
        'let',
        'loop',
        'match',
        'mod',
        'move',
        'mut',
        'pub',
        'ref',
        'return',
        'self',
        'static',
        'struct',
        'super',
        'trait',
        'true',
        'type',
        'unsafe',
        'use',
        'where',
        'while',
    ],
};

const highlightCache = new Map<string, string[]>();
const CACHE_MAX = 100;

export function highlightCode(code: string, lang: string): React.ReactNode {
    const cacheKey = `${lang}:${code.slice(0, 256)}:${code.length}`;
    const cachedLines = highlightCache.get(cacheKey);
    if (cachedLines) {
        highlightCache.delete(cacheKey);
        highlightCache.set(cacheKey, cachedLines);
        return (
            <>
                {cachedLines.map((ln, i) => (
                    <div
                        key={`hl-cache-${i}`}
                        style={{ minHeight: '1.2em' }}
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(ln) }}
                    />
                ))}
            </>
        );
    }

    if (highlightCache.size >= CACHE_MAX) {
        const lruKey = highlightCache.keys().next().value;
        if (lruKey != null) highlightCache.delete(lruKey);
    }
    const langLower = lang
        .toLowerCase()
        .replace(/^node/i, 'js')
        .replace(/^javascript/i, 'js')
        .replace(/^typescript/i, 'ts');
    const kw = HIGHLIGHT_KEYWORDS[langLower] || HIGHLIGHT_KEYWORDS['ts']!;
    const parts: React.ReactNode[] = [];

    const tokenize = (str: string): string => {
        const re =
            /\/\/.*$|\/\*[\s\S]*?\*\/|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|\b(\d+\.?\d*)\b|[+\-*/%&|^~<>!=]+|(\b[a-zA-Z_$][\w$]*\b)/gm;
        const chunks: string[] = [];
        let m;
        let last = 0;
        while ((m = re.exec(str)) !== null) {
            if (m.index > last) chunks.push(str.slice(last, m.index));
            const matched = m[0];
            if (matched.startsWith('//') || matched.startsWith('/*') || matched.startsWith('#')) {
                chunks.push(
                    `<span style="color:#6b7280">${matched.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`,
                );
            } else if (
                matched.startsWith("'") ||
                matched.startsWith('"') ||
                matched.startsWith('`')
            ) {
                chunks.push(
                    `<span style="color:#34d399">${matched.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`,
                );
            } else if (m[1]) {
                chunks.push(`<span style="color:#fbbf24">${escapeHtml(matched)}</span>`);
            } else if (m[2] && kw!.includes(m[2])) {
                chunks.push(
                    `<span style="color:#c084fc;font-weight:600">${escapeHtml(matched)}</span>`,
                );
            } else {
                chunks.push(matched.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
            }
            last = m.index + matched.length;
        }
        if (last < str.length)
            chunks.push(str.slice(last).replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        return chunks.join('');
    };

    const codeLines: string[] = [];
    for (const ln of code.split('\n')) {
        const html = tokenize(ln);
        parts.push(
            <div
                key={`hl-${parts.length}`}
                style={{ minHeight: '1.2em' }}
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
            />,
        );
        codeLines.push(html);
    }
    highlightCache.set(cacheKey, codeLines);
    return <>{parts}</>;
}
