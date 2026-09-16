import type { FileNode } from '../contracts/workspace';
import type {
    ArchFinding,
    ArchDebtItem,
    DepGraphNode,
    ArchReadFile,
    IArchitectureReviewService,
} from '../contracts/architecture-review';

const LARGE_FILE_THRESHOLD = 25_000;
const MAX_DIR_FILES = 20;
const MAX_DEPTH = 4;
const DEFAULT_DEP_SCAN_FILES = 40;

interface FlatNode {
    node: FileNode;
    depth: number;
}

function flattenTree(nodes: FileNode[], prefix = ''): FlatNode[] {
    const result: FlatNode[] = [];
    for (const n of nodes) {
        const depth = prefix ? prefix.split('/').length : 0;
        result.push({ node: n, depth });
        if (n.type === 'dir' && n.children) {
            result.push(...flattenTree(n.children, n.path));
        }
    }
    return result;
}

function detectCycles(graph: DepGraphNode[]): { source: string; target: string; path: string[] }[] {
    const adj = new Map<string, string[]>();
    for (const n of graph) {
        adj.set(n.path, n.imports);
    }
    const cycles: { source: string; target: string; path: string[] }[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    function dfs(node: string, stack: string[]) {
        visited.add(node);
        inStack.add(node);
        stack.push(node);

        for (const dep of adj.get(node) || []) {
            const resolved = graph.find(
                (n) =>
                    n.path === dep ||
                    n.path.endsWith('/' + dep) ||
                    (n.path.endsWith('.ts') && n.path.replace(/\.ts$/, '') === dep) ||
                    n.path.replace(/\.tsx$/, '') === dep,
            );
            const target = resolved?.path || dep;
            if (!visited.has(target)) {
                dfs(target, stack);
            } else if (inStack.has(target)) {
                const cyclePath = stack.slice(stack.indexOf(target));
                cycles.push({ source: target, target: node, path: [...cyclePath, target] });
            }
        }
        stack.pop();
        inStack.delete(node);
    }

    for (const n of graph) {
        if (!visited.has(n.path)) dfs(n.path, []);
    }
    return cycles;
}

function findNearDuplicates(
    nodes: { path: string; size: number }[],
): { a: string; b: string; similarity: number }[] {
    const result: { a: string; b: string; similarity: number }[] = [];
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i]!;
            const b = nodes[j]!;
            const minSize = Math.min(a.size, b.size);
            const maxSize = Math.max(a.size, b.size);
            if (maxSize === 0) continue;
            const sizeRatio = minSize / maxSize;
            if (sizeRatio > 0.85 && Math.abs(a.size - b.size) < 2000) {
                result.push({ a: a.path, b: b.path, similarity: Math.round(sizeRatio * 100) });
            }
        }
    }
    return [
        ...new Map(
            result.map((r: { a: string; b: string; similarity: number }) => [
                r.a < r.b ? `${r.a}-${r.b}` : `${r.b}-${r.a}`,
                r,
            ]),
        ).values(),
    ].slice(0, 20);
}

export class ArchitectureReviewService implements IArchitectureReviewService {
    parseDebtReport(content: string): ArchDebtItem[] {
        const lines = content.split('\n');
        const items: ArchDebtItem[] = [];
        let current: Partial<ArchDebtItem> | null = null;

        for (const line of lines) {
            const headerMatch = line.match(/^### (D-\d+): (.+)$/);
            if (headerMatch) {
                if (current?.id) items.push(current as ArchDebtItem);
                const rawTitle = headerMatch[2]!;
                const done = /\b✅\s*Done\b/i.test(rawTitle) || rawTitle.includes('split ✅');
                current = {
                    id: headerMatch[1]!,
                    title: rawTitle
                        .replace(/\s*✅\s*Done\s*/gi, '')
                        .replace(/\s*split\s*✅\s*/gi, ' split')
                        .trim(),
                    priority: 'P2',
                    effort: '',
                    description: '',
                    status: done ? 'resolved' : 'open',
                    files: [],
                };
                continue;
            }
            if (
                current &&
                /^\|\s*D-\d+.*\|\s*.*\|\s*.*\|\s*.*\|\s*✅/.test(line) &&
                current.id &&
                line.includes(current.id)
            ) {
                current.status = 'resolved';
            }
            if (!current) continue;
            const priorityMatch = line.match(/^\|?\s*\*\*P(\d)\*\*|Priority.*P(\d)/);
            if (priorityMatch) {
                current.priority =
                    `P${priorityMatch[1]! || priorityMatch[2]!}` as ArchDebtItem['priority'];
            }
            const effortMatch = line.match(/Усилия\s*\|\s*([\d\s\-чмин]+)/);
            if (effortMatch) current.effort = effortMatch[1]!.trim();
            const fileMatch = line.match(/`([^`]+\.(?:ts|tsx|md))`/g);
            if (fileMatch) {
                current.files = [
                    ...new Set([
                        ...(current.files || []),
                        ...fileMatch.map((f: string) => f.replace(/`/g, '')),
                    ]),
                ];
            }
            if (line.includes('**Что делать:**')) {
                current.description += line.split('**Что делать:**')[1] || '';
            } else if (line.startsWith('**Что делать:**')) {
                current.description += line.replace('**Что делать:**', '').trim();
            }
        }
        if (current?.id) items.push(current as ArchDebtItem);
        return items;
    }

    checkProjectStructure(tree: FileNode[]): ArchFinding[] {
        const flat = flattenTree(tree);
        const dirs = flat.filter((f) => f.node.type === 'dir');
        const files = flat.filter((f) => f.node.type === 'file');
        const tsFiles = files.filter((f) => /\.(ts|tsx)$/i.test(f.node.name));
        const result: ArchFinding[] = [];

        for (const dir of dirs) {
            if (dir.node.children && dir.node.children.length > MAX_DIR_FILES) {
                result.push({
                    type: 'warning',
                    category: 'Structure',
                    message: `Directory has ${dir.node.children.length} items (max ${MAX_DIR_FILES})`,
                    file: dir.node.path,
                    value: `${dir.node.children.length} files`,
                });
            }
            if (dir.depth > MAX_DEPTH) {
                result.push({
                    type: 'info',
                    category: 'Nesting',
                    message: `Deep nesting at depth ${dir.depth}`,
                    file: dir.node.path,
                    value: `depth ${dir.depth}`,
                });
            }
        }

        for (const f of files) {
            if (f.node.size && f.node.size > LARGE_FILE_THRESHOLD) {
                result.push({
                    type: 'warning',
                    category: 'Size',
                    message: `Large file (${(f.node.size / 1000).toFixed(0)}KB)`,
                    file: f.node.path,
                    value: `${(f.node.size / 1000).toFixed(0)}KB`,
                });
            }
        }

        const tsBySize = tsFiles
            .filter((f) => f.node.size)
            .sort((a, b) => (b.node.size || 0) - (a.node.size || 0))
            .slice(0, 5);
        if (tsBySize.length > 0) {
            result.push({
                type: 'info',
                category: 'Summary',
                message: `Largest TS files: ${tsBySize.map((f) => `${f.node.name} (${(f.node.size! / 1000).toFixed(0)}KB)`).join(', ')}`,
                value: `${(tsBySize[0]!.node.size! / 1000).toFixed(0)}KB max`,
            });
        }

        const extCounts: Record<string, number> = {};
        for (const f of files) {
            const ext = f.node.name.includes('.')
                ? f.node.name.split('.').pop()!.toLowerCase()
                : 'none';
            extCounts[ext] = (extCounts[ext] || 0) + 1;
        }
        const topExts = Object.entries(extCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        result.push({
            type: 'info',
            category: 'Summary',
            message: `Top extensions: ${topExts.map(([e, c]) => `.${e} (${c})`).join(', ')}`,
            value: `${files.length} total files`,
        });

        const tsRatio = files.length > 0 ? ((tsFiles.length / files.length) * 100).toFixed(0) : '0';
        result.push({
            type: 'info',
            category: 'Summary',
            message: `TypeScript ratio: ${tsFiles.length}/${files.length} (${tsRatio}%)`,
            value: `${tsFiles.length} .ts/.tsx`,
        });

        return result;
    }

    findDuplicates(fileSizes: { path: string; size: number }[]): ArchFinding[] {
        const duplicates = findNearDuplicates(fileSizes);
        return duplicates.map((d) => ({
            type: 'warning' as const,
            category: 'Duplicate',
            message: `Possible duplicate (${d.similarity}% size similarity)`,
            file: d.a,
            items: [d.a, d.b],
        }));
    }

    async reportDependencies(
        tsFilePaths: string[],
        readFile: ArchReadFile,
        maxFiles = DEFAULT_DEP_SCAN_FILES,
    ): Promise<ArchFinding[]> {
        const result: ArchFinding[] = [];
        const depGraph: DepGraphNode[] = [];

        for (const path of tsFilePaths.slice(0, maxFiles)) {
            try {
                const content = await readFile(path);
                const imports: string[] = [];
                for (const line of content.split('\n')) {
                    const match = line.match(/from\s+['"]([^'"]+)['"]/);
                    if (match && (match[1]!.startsWith('.') || match[1]!.startsWith('src/'))) {
                        imports.push(match[1]!);
                    }
                }
                if (imports.length > 0) depGraph.push({ path, imports });
            } catch {
                /* unreadable file */
            }
        }

        const cycles = detectCycles(depGraph);
        for (const cycle of cycles) {
            result.push({
                type: 'error',
                category: 'Circular Dep',
                message: 'Circular dependency detected',
                file: cycle.source,
                value: `${cycle.path.length - 1} files`,
                items: cycle.path,
            });
        }
        if (cycles.length === 0 && depGraph.length > 5) {
            result.push({
                type: 'info',
                category: 'Circular Dep',
                message: `No circular dependencies found in top ${depGraph.length} TS files`,
                value: 'Clean',
            });
        }

        return result;
    }

    async runFullAnalysis(tree: FileNode[], readFile: ArchReadFile): Promise<ArchFinding[]> {
        const flat = flattenTree(tree);
        const files = flat.filter((f) => f.node.type === 'file');
        const tsFiles = files.filter((f) => /\.(ts|tsx)$/i.test(f.node.name));

        const structure = this.checkProjectStructure(tree);
        const fileSizes = files
            .filter((f) => f.node.size)
            .map((f) => ({ path: f.node.path, size: f.node.size! }));
        const duplicates = this.findDuplicates(fileSizes);

        const topTs = tsFiles
            .filter((f) => f.node.size)
            .sort((a, b) => (b.node.size || 0) - (a.node.size || 0))
            .slice(0, DEFAULT_DEP_SCAN_FILES)
            .map((f) => f.node.path);
        const deps = await this.reportDependencies(topTs, readFile);

        return [...structure, ...deps, ...duplicates];
    }
}
