import type {
    IMemoryGraphService,
    MemoryGraphData,
    MemoryGraphEdge,
    MemoryGraphNode,
    MemoryNodeType,
} from '../../contracts/viz/memory-graph';
import type { MemoryEntry } from '../../types/memory-types';
import { stableHash } from '../../utils/hash';

const TEXT_SIMILARITY_THRESHOLD = 0.3;
const MAX_TEXT_SIMILARITY_PAIRS = 2000;
const TEXT_SIMILARITY_SIZE_CAP = 150;

function tokenize(text: string): Set<string> {
    const tokens = text
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s]/gi, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2);
    return new Set(tokens);
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let intersection = 0;
    for (const token of a) if (b.has(token)) intersection += 1;
    const union = a.size + b.size - intersection;
    return union > 0 ? intersection / union : 0;
}

function classifyType(entry: MemoryEntry): MemoryNodeType {
    const source = String(entry.metadata.source ?? '').toLowerCase();
    const type = String(entry.metadata.type ?? '').toLowerCase();
    if (source === 'fact' || type.includes('fact')) return 'fact';
    if (source === 'user_input' || type.includes('user')) return 'user';
    if (source === 'observation' || type.includes('observation')) return 'observation';
    if (type.includes('diary') || type.includes('journal') || type.includes('log')) return 'diary';
    if (type.includes('note')) return 'note';
    if (type.includes('task')) return 'task';
    if (type.includes('skill')) return 'skill';
    if (type.includes('person') || type.includes('place') || type.includes('topic') || type.includes('entity')) return 'entity';
    if (source === 'file' || type.includes('doc') || type.includes('knowledge') || type.includes('rag')) return 'doc';
    return 'knowledge';
}

function snippet(content: string, max = 44): string {
    const flat = content.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat || '(empty)';
}

export class MemoryGraphService implements IMemoryGraphService {
    build(entries: MemoryEntry[]): MemoryGraphData {
        const nodes = new Map<string, MemoryGraphNode>();
        const edges: MemoryGraphEdge[] = [];
        const edgeKey = new Set<string>();

        const addNode = (node: MemoryGraphNode) => {
            if (!nodes.has(node.id)) nodes.set(node.id, node);
        };
        const addEdge = (
            source: string,
            target: string,
            kind: MemoryGraphEdge['kind'],
            weight: number,
        ) => {
            if (source === target) return;
            const key = source < target ? `${source}|${target}` : `${target}|${source}`;
            const dedupe = `${key}|${kind}`;
            if (edgeKey.has(dedupe)) return;
            edgeKey.add(dedupe);
            edges.push({ id: `e-${edges.length}`, source, target, kind, weight });
        };

        // Tag bookkeeping.
        const tagIds = new Map<string, string>();
        const registerTag = (label: string) => {
            const key = label.trim().toLowerCase();
            if (!key) return;
            const id = `tag:${key}`;
            if (!tagIds.has(key)) {
                tagIds.set(key, id);
                addNode({ id, label: key, type: 'tag', degree: 0 });
            }
            return id;
        };

        // Entry nodes.
        for (const entry of entries) {
            addNode({
                id: entry.id,
                label: snippet(entry.content),
                type: classifyType(entry),
                degree: 0,
                meta: { timestamp: entry.metadata.timestamp, source: entry.metadata.source },
            });
        }

        // Relation edges.
        for (const entry of entries) {
            for (const relation of entry.metadata.relations ?? []) {
                addEdge(entry.id, relation.targetId, 'relation', relation.weight || 1);
            }
            if (entry.metadata.parentId) {
                addEdge(entry.id, entry.metadata.parentId, 'parent', 1);
            }
            for (const label of entry.metadata.tags?.labels ?? []) {
                const tagId = registerTag(label);
                if (tagId) addEdge(entry.id, tagId, 'tag', 1);
            }
        }

        // Text-similarity edges (bounded, deterministic).
        if (entries.length <= TEXT_SIMILARITY_SIZE_CAP) {
            const buckets = new Map<string, MemoryEntry[]>();
            for (const entry of entries) {
                const collection = entry.metadata.collection ?? 'long_term';
                const list = buckets.get(collection) ?? [];
                list.push(entry);
                buckets.set(collection, list);
            }
            let comparisons = 0;
            for (const list of buckets.values()) {
                const tokenized = list.map((entry) => ({ entry, tokens: tokenize(entry.content) }));
                for (let i = 0; i < tokenized.length && comparisons < MAX_TEXT_SIMILARITY_PAIRS; i++) {
                    for (let j = i + 1; j < tokenized.length && comparisons < MAX_TEXT_SIMILARITY_PAIRS; j++) {
                        comparisons += 1;
                        const a = tokenized[i];
                        const b = tokenized[j];
                        if (!a || !b) continue;
                        const sim = jaccard(a.tokens, b.tokens);
                        if (sim >= TEXT_SIMILARITY_THRESHOLD) {
                            addEdge(a.entry.id, b.entry.id, 'text', Number(sim.toFixed(3)));
                        }
                    }
                }
                if (comparisons >= MAX_TEXT_SIMILARITY_PAIRS) break;
            }
        }

        // Degree computation.
        const degree = new Map<string, number>();
        const bump = (id: string) => degree.set(id, (degree.get(id) ?? 0) + 1);
        for (const edge of edges) {
            bump(edge.source);
            bump(edge.target);
        }

        const nodeList = [...nodes.values()].map((node) => ({
            ...node,
            degree: degree.get(node.id) ?? 0,
        }));

        // Stability: deterministic ordering for edge creation consistency.
        nodeList.sort((a, b) => stableHash(a.id) - stableHash(b.id));

        return { nodes: nodeList, edges };
    }
}
