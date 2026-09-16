/**
 * AtomService — M.2 (OpenCog-lite hypergraph + PLN inheritance, additive).
 *
 * Concept/Predicate nodes and Inheritance/Implication/Similarity links with
 * truth values (strength/confidence) in DAL kv. `deduce()` chains
 * Inheritance with TV propagation (s1*s2, c1*c2, capped depth 4).
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IAtomService } from '../../contracts/rivals7';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Atom');

interface AtomNode {
    id: string;
    kind: 'Concept' | 'Predicate';
    name: string;
    strength: number;
    confidence: number;
}

interface AtomLink {
    id: string;
    kind: 'Inheritance' | 'Implication' | 'Similarity';
    from: string;
    to: string;
    strength: number;
    confidence: number;
}

function tv(s: number | undefined, c: number | undefined): { strength: number; confidence: number } {
    return {
        strength: Math.max(0, Math.min(1, s ?? 1)),
        confidence: Math.max(0, Math.min(1, c ?? 0.9)),
    };
}

export class AtomService implements IAtomService {
    constructor(private dal: DataAccessLayer) {}

    async init(): Promise<void> {
        LOGGER.info('Atom', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async addNode(kind: 'Concept' | 'Predicate', name: string, strength?: number, confidence?: number): Promise<string> {
        const clean = name.slice(0, 160);
        const existing = await this.dal.kv.get<AtomNode>(`atoms/${kind}/${clean}`);
        const t = tv(strength, confidence);
        if (existing) {
            existing.strength = t.strength;
            existing.confidence = t.confidence;
            await this.dal.kv.set(`atoms/${kind}/${clean}`, existing);
            return existing.id;
        }
        const node: AtomNode = { id: genId('atom'), kind, name: clean, ...t };
        await this.dal.kv.set(`atoms/${kind}/${clean}`, node);
        return node.id;
    }

    async addLink(
        kind: 'Inheritance' | 'Implication' | 'Similarity',
        from: string,
        to: string,
        strength?: number,
        confidence?: number,
    ): Promise<string> {
        const t = tv(strength, confidence);
        const link: AtomLink = { id: genId('link'), kind, from: from.slice(0, 160), to: to.slice(0, 160), ...t };
        await this.dal.kv.set(`atomlinks/${link.id}`, link);
        return link.id;
    }

    async deduce(concept: string): Promise<Array<{ concept: string; strength: number }>> {
        const rows = await this.dal.kv.list('atomlinks/');
        const links = rows.map((r) => r.value as AtomLink).filter((l) => l.kind === 'Inheritance');
        // BFS over Inheritance with TV propagation, depth ≤ 4, cycle-safe.
        const best = new Map<string, number>();
        const queue: Array<{ name: string; strength: number; depth: number }> = [
            { name: concept, strength: 1, depth: 0 },
        ];
        const seen = new Set<string>([concept]);
        while (queue.length > 0) {
            const cur = queue.shift()!;
            if (cur.depth >= 4) continue;
            for (const l of links) {
                if (l.from !== cur.name) continue;
                const s = Math.round(cur.strength * l.strength * 100) / 100;
                if (s > (best.get(l.to) ?? 0)) best.set(l.to, s);
                if (!seen.has(l.to)) {
                    seen.add(l.to);
                    queue.push({ name: l.to, strength: s, depth: cur.depth + 1 });
                }
            }
        }
        best.delete(concept);
        return [...best.entries()]
            .map(([con, strength]) => ({ concept: con, strength }))
            .sort((a, b) => b.strength - a.strength)
            .slice(0, 20);
    }
}
