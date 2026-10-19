/**
 * ProvenanceService — Wave 10.25 + 10.26 (audit trail graph + sandbox continuum).
 *
 * Every decision links to its inputs (data/prompts/votes/toolcalls/agents);
 * `trace()` walks upstream so any outcome is explainable. `sandboxLevelFor()`
 * maps task risk → continuum level (isolated/restricted/standard/trusted),
 * consumed by SandboxBroker tickets.
 */
import type { TrustRepository } from '../../dal/trust-repository';
import type { IProvenanceService } from '../../contracts/trust';
import type { ProvenanceEdge, ProvenanceNode, SandboxLevel } from '../../types/trust-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Provenance');

function now(): number {
    return Date.now();
}

const RISKY_HINTS = [
    'browser', 'браузер', 'computer', 'компьютер', 'shell', 'exec', 'запуск',
    'network', 'сеть', 'payment', 'оплат', 'delete', 'удали', 'external', 'внешн',
];

/**
 * Temporal validity predicate for provenance edges. Valid at `asOf` when it
 * started (`validFrom`, else `createdAt`) and has not ended (`validTo`,
 * exclusive). Missing `validTo` means "still valid".
 */
export function isProvenanceEdgeValidAt(edge: ProvenanceEdge, asOf: number): boolean {
    const from = edge.validFrom ?? edge.createdAt;
    const to = edge.validTo;
    return from <= asOf && (to == null || to > asOf);
}

export class ProvenanceService implements IProvenanceService {
    constructor(private repo: TrustRepository) {}

    async init(): Promise<void> {
        LOGGER.info('Provenance', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async addNode(kind: ProvenanceNode['kind'], label: string, ref?: string): Promise<ProvenanceNode> {
        const node: ProvenanceNode = {
            id: genId('prov'),
            kind,
            label: label.slice(0, 500),
            ref,
            createdAt: now(),
        };
        await this.repo.putProvNode(node);
        return node;
    }

    async link(
        fromId: string,
        toId: string,
        relation: ProvenanceEdge['relation'] = 'derived_from',
        opts: { validFrom?: number; validTo?: number | null; observedAt?: number } = {},
    ): Promise<ProvenanceEdge> {
        const from = await this.repo.getProvNode(fromId);
        const to = await this.repo.getProvNode(toId);
        if (!from) throw new Error(`Provenance node not found: ${fromId}`);
        if (!to) throw new Error(`Provenance node not found: ${toId}`);
        const t = now();
        const edge: ProvenanceEdge = {
            id: genId('provedge'),
            fromId,
            toId,
            relation,
            createdAt: t,
            validFrom: opts.validFrom ?? t,
            validTo: opts.validTo ?? null,
            observedAt: opts.observedAt ?? t,
        };
        await this.repo.putProvEdge(edge);
        return edge;
    }

    async closeLink(id: string, validTo: number = now()): Promise<ProvenanceEdge> {
        const edge = await this.repo.getProvEdge(id);
        if (!edge) throw new Error(`Provenance edge not found: ${id}`);
        edge.validTo = validTo;
        await this.repo.putProvEdge(edge);
        return edge;
    }

    async trace(
        decisionId: string,
        depth = 5,
        asOf: number = now(),
    ): Promise<{ nodes: ProvenanceNode[]; edges: ProvenanceEdge[] }> {
        const start = await this.repo.getProvNode(decisionId);
        if (!start) throw new Error(`Provenance node not found: ${decisionId}`);
        const allEdges = await this.repo.listProvEdges();
        // Upstream walk: edges where toId is in the frontier (X derived from Y).
        const nodes = new Map<string, ProvenanceNode>([[start.id, start]]);
        const edges: ProvenanceEdge[] = [];
        let frontier = [decisionId];
        for (let d = 0; d < Math.max(1, depth); d++) {
            const next: string[] = [];
            for (const e of allEdges) {
                if (!isProvenanceEdgeValidAt(e, asOf)) continue;
                if (frontier.includes(e.toId) && !nodes.has(e.fromId)) {
                    const n = await this.repo.getProvNode(e.fromId);
                    if (n) {
                        nodes.set(n.id, n);
                        edges.push(e);
                        next.push(n.id);
                    }
                }
            }
            if (next.length === 0) break;
            frontier = next;
        }
        return { nodes: [...nodes.values()], edges };
    }

    sandboxLevelFor(task: string): SandboxLevel {
        const lower = task.toLowerCase();
        const hits = RISKY_HINTS.filter((h) => lower.includes(h)).length;
        if (hits >= 2) return 'isolated';
        if (hits === 1) return 'restricted';
        if (/read|read-only|анализ|analy|plan|план/i.test(task)) return 'trusted';
        return 'standard';
    }
}
