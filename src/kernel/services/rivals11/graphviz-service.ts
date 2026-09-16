/**
 * GraphVizService — Q.2 (Gephi-style layouts + SVG, additive).
 *
 * Deterministic layouts (no physics loop): `layered` by BFS depth from
 * roots, `force` by hash-seeded circular placement with light repulsion
 * passes. SVG export with labeled nodes and directed edges. Pure functions
 * + service wrapper for DI symmetry.
 */
import type { IGraphVizService } from '../../contracts/rivals11';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('GraphViz');

function hashStr(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h;
}

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class GraphVizService implements IGraphVizService {
    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    layout(
        nodes: string[],
        edges: Array<[string, string]>,
        mode: 'layered' | 'force' = 'layered',
    ): Record<string, { x: number; y: number }> {
        const uniq = [...new Set(nodes)].slice(0, 300);
        const pos: Record<string, { x: number; y: number }> = {};
        if (mode === 'layered') {
            const incoming = new Map<string, number>();
            for (const n of uniq) incoming.set(n, 0);
            for (const [, to] of edges) incoming.set(to, (incoming.get(to) ?? 0) + 1);
            const depth = new Map<string, number>();
            const queue = uniq.filter((n) => (incoming.get(n) ?? 0) === 0);
            for (const r of queue) depth.set(r, 0);
            const out = new Map<string, string[]>();
            for (const [from, to] of edges) {
                const list = out.get(from) ?? [];
                list.push(to);
                out.set(from, list);
            }
            const seen = new Set(queue);
            while (queue.length > 0) {
                const cur = queue.shift() as string;
                for (const next of out.get(cur) ?? []) {
                    const d = (depth.get(cur) ?? 0) + 1;
                    if (d > (depth.get(next) ?? -1)) depth.set(next, d);
                    if (!seen.has(next)) {
                        seen.add(next);
                        queue.push(next);
                    }
                }
            }
            const layers = new Map<number, string[]>();
            for (const n of uniq) {
                const d = depth.get(n) ?? 0;
                const list = layers.get(d) ?? [];
                list.push(n);
                layers.set(d, list);
            }
            for (const [d, list] of layers) {
                list.forEach((n, i) => {
                    pos[n] = { x: 60 + i * 130, y: 50 + d * 110 };
                });
            }
            return pos;
        }
        // force-lite: seeded circle + 20 repulsion passes (deterministic).
        const R = 160;
        const cx = 240;
        const cy = 180;
        uniq.forEach((n, i) => {
            const a = (2 * Math.PI * i) / Math.max(1, uniq.length) + (hashStr(n) % 100) / 500;
            pos[n] = { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) };
        });
        const adj = new Map<string, Set<string>>();
        for (const n of uniq) adj.set(n, new Set());
        for (const [a, b] of edges) {
            if (adj.has(a) && adj.has(b) && a !== b) {
                adj.get(a)!.add(b);
                adj.get(b)!.add(a);
            }
        }
        for (let pass = 0; pass < 20; pass++) {
            for (const n of uniq) {
                let fx = 0;
                let fy = 0;
                for (const m of uniq) {
                    if (m === n) continue;
                    const dx = (pos[n]?.x ?? 0) - (pos[m]?.x ?? 0);
                    const dy = (pos[n]?.y ?? 0) - (pos[m]?.y ?? 0);
                    const dist = Math.max(20, Math.hypot(dx, dy));
                    const linked = adj.get(n)?.has(m);
                    const f = linked ? (dist - 90) * 0.02 : -1200 / (dist * dist);
                    fx += (dx / dist) * f;
                    fy += (dy / dist) * f;
                }
                pos[n] = {
                    x: Math.max(30, Math.min(450, (pos[n]?.x ?? 0) + fx)),
                    y: Math.max(30, Math.min(330, (pos[n]?.y ?? 0) + fy)),
                };
            }
        }
        return pos;
    }

    svg(
        nodes: string[],
        edges: Array<[string, string]>,
        mode: 'layered' | 'force' = 'layered',
    ): string {
        const pos = this.layout(nodes, edges, mode);
        const parts = [
            '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" role="img">',
        ];
        for (const [from, to] of edges.slice(0, 400)) {
            const a = pos[from];
            const b = pos[to];
            if (!a || !b) continue;
            parts.push(
                `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#64748b" stroke-width="1.2" marker-end="url(#arr)"/>`,
            );
        }
        parts.push(
            '<defs><marker id="arr" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="none" stroke="#64748b"/></marker></defs>',
        );
        for (const n of Object.keys(pos).slice(0, 300)) {
            const p = pos[n] as { x: number; y: number };
            parts.push(
                `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="14" fill="#1e293b" stroke="#3b82f6"/><title>${esc(n)}</title>`,
                `<text x="${p.x.toFixed(1)}" y="${(p.y + 30).toFixed(1)}" text-anchor="middle" font-size="10" fill="#cbd5e1">${esc(n.slice(0, 14))}</text>`,
            );
        }
        parts.push('</svg>');
        return parts.join('');
    }
}
