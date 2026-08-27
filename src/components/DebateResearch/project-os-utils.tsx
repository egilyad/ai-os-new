import {
    FolderOpen,
    Code,
    Settings,
    BookOpen,
    Terminal,
    FileText,
    FileJson,
    Braces,
    Image,
    Shield,
} from 'lucide-react';
import type { FileNode } from '../../kernel/contracts/workspace';

export type FilterKey = 'all' | 'code' | 'config' | 'docs' | 'logs';
export type SortKey = 'name' | 'size' | 'type';

export const FILTER_DIRS: Record<FilterKey, string[]> = {
    all: [],
    code: ['src/kernel', 'src/llm', 'src/core', 'src/stores', 'src/types', 'src/components'],
    config: ['config', 'src/config', '.superagents', 'src/styles'],
    docs: ['docs'],
    logs: ['logs', 'prompt-vault'],
};

export const FILTER_ICONS: Record<FilterKey, React.ReactNode> = {
    all: <FolderOpen size={13} />,
    code: <Code size={13} />,
    config: <Settings size={13} />,
    docs: <BookOpen size={13} />,
    logs: <Terminal size={13} />,
};

export const SENSITIVE_PATTERNS = /(?:secret|key|token|password|credential|\.env)/i;

export const EXT_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
    ts: { icon: <Code size={13} />, color: '#3178c6' },
    tsx: { icon: <Braces size={13} />, color: '#3178c6' },
    js: { icon: <FileText size={13} />, color: '#f7df1e' },
    jsx: { icon: <Braces size={13} />, color: '#f7df1e' },
    json: { icon: <FileJson size={13} />, color: 'var(--warning)' },
    md: { icon: <BookOpen size={13} />, color: 'var(--success)' },
    css: { icon: <FileText size={13} />, color: '#06b6d4' },
    scss: { icon: <FileText size={13} />, color: '#06b6d4' },
    html: { icon: <Code size={13} />, color: '#e34f26' },
    yaml: { icon: <FileJson size={13} />, color: 'var(--warning)' },
    yml: { icon: <FileJson size={13} />, color: 'var(--warning)' },
    env: { icon: <Shield size={13} />, color: 'var(--error)' },
    mjs: { icon: <FileText size={13} />, color: '#f7df1e' },
    wasm: { icon: <Terminal size={13} />, color: '#654ff0' },
    png: { icon: <Image size={13} />, color: '#a855f7' },
    svg: { icon: <Image size={13} />, color: 'var(--warning)' },
    ico: { icon: <Image size={13} />, color: '#06b6d4' },
    lock: { icon: <Shield size={13} />, color: 'var(--slate-500)' },
};

export const KEYWORD_HIGHLIGHT: Record<
    string,
    { keywords: string[]; color: string; isComment?: boolean }[]
> = {
    ts: [
        {
            keywords: [
                'import',
                'export',
                'from',
                'const',
                'let',
                'var',
                'function',
                'return',
                'if',
                'else',
                'for',
                'while',
                'class',
                'interface',
                'type',
                'extends',
                'implements',
                'async',
                'await',
                'new',
                'throw',
                'try',
                'catch',
                'finally',
                'switch',
                'case',
                'default',
                'break',
                'continue',
                'typeof',
                'keyof',
                'readonly',
                'in',
                'of',
                'as',
                'is',
                'satisfies',
            ],
            color: '#c678dd',
        },
        {
            keywords: [
                'string',
                'number',
                'boolean',
                'void',
                'null',
                'undefined',
                'any',
                'never',
                'unknown',
                'bigint',
                'symbol',
            ],
            color: '#e5c07b',
        },
        { keywords: ['true', 'false', 'this', 'super'], color: '#56b6c2' },
        { keywords: ['//'], color: '#5c6370', isComment: true },
    ],
    json: [{ keywords: ['true', 'false', 'null'], color: '#56b6c2' }],
};

export const RECENT_KEY = 'project_os_recent';

export function getExt(filename: string): string {
    const idx = filename.lastIndexOf('.');
    return idx === -1 ? '' : filename.slice(idx + 1).toLowerCase();
}

export function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function estimateLines(size: number): number {
    return Math.round(size / 50);
}

export function isSensitivePath(path: string): boolean {
    return SENSITIVE_PATTERNS.test(path);
}

export function matchesFilter(path: string, filter: FilterKey): boolean {
    if (filter === 'all') return true;
    return FILTER_DIRS[filter].some((dir) => path.startsWith(dir));
}

export function dirSort(nodes: FileNode[], sortBy: SortKey): FileNode[] {
    return [...nodes].sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        if (sortBy === 'size') return (b.size ?? 0) - (a.size ?? 0);
        if (sortBy === 'type') {
            const extA = getExt(a.name);
            const extB = getExt(b.name);
            if (extA !== extB) return extA.localeCompare(extB);
        }
        return a.name.localeCompare(b.name);
    });
}

export function flattenTree(nodes: FileNode[]): FileNode[] {
    const result: FileNode[] = [];
    for (const node of nodes) {
        result.push(node);
        if (node.children) result.push(...flattenTree(node.children));
    }
    return result;
}

export function highlightCode(content: string, ext: string): React.ReactNode[] {
    const rules = KEYWORD_HIGHLIGHT[ext];
    if (!rules) return [content];
    const lines = content.split('\n');
    return lines.map((line, li) => {
        const parts: React.ReactNode[] = [];
        const matches: { start: number; end: number; color: string }[] = [];
        const commentMatch = line.match(/(\/\/.*)/);
        const commentStr = commentMatch?.[1];
        const codePart = commentMatch ? line.slice(0, commentMatch.index) : line;
        for (const rule of rules) {
            if (rule.isComment) continue;
            const re = new RegExp(`\\b(${rule.keywords.join('|')})\\b`, 'g');
            let m;
            while ((m = re.exec(codePart)) !== null) {
                matches.push({ start: m.index, end: m.index + m[0].length, color: rule.color });
            }
        }
        matches.sort((a, b) => a.start - b.start);
        let pos = 0;
        for (const m of matches) {
            if (m.start < pos) continue;
            if (m.start > pos) parts.push(codePart.slice(pos, m.start));
            parts.push(
                <span key={`${li}-${m.start}`} style={{ color: m.color }}>
                    {codePart.slice(m.start, m.end)}
                </span>,
            );
            pos = m.end;
        }
        if (pos < codePart.length) parts.push(codePart.slice(pos));
        if (commentStr)
            parts.push(
                <span key={`${li}-cmt`} style={{ color: '#5c6370', fontStyle: 'italic' }}>
                    {commentStr}
                </span>,
            );
        return (
            <div key={li} data-line={li + 1} style={{ whiteSpace: 'pre', minHeight: '1.2em' }}>
                {parts.length > 0 ? parts : <>&nbsp;</>}
            </div>
        );
    });
}
