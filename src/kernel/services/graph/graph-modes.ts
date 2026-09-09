/**
 * Built-in orchestration mode graphs (Wave 3.1 — минимум 6 режимов).
 *
 * Each builder returns node/edge lists; GraphService.defineGraph persists them.
 * Modes delegate to real Crew/Council/Forge services when delegates are wired
 * (phase25), otherwise task nodes run deterministically.
 */
import type { DefineGraphInput } from '../../contracts/graph';

function ids(n: number, prefix: string): string[] {
    return Array.from({ length: n }, (_, i) => `${prefix}_${i + 1}`);
}

export function buildModeDefinition(
    mode: 'sequential' | 'hierarchical' | 'council' | 'swarm' | 'graph' | 'forge',
    params: Record<string, unknown> = {},
): DefineGraphInput {
    const topic = typeof params['topic'] === 'string' ? params['topic'] : 'Goal';
    const crewId = typeof params['crewId'] === 'string' ? params['crewId'] : undefined;

    switch (mode) {
        case 'sequential': {
            const [a, b, c] = ids(3, 'seq');
            return {
                name: `Sequential: ${topic}`.slice(0, 120),
                description: 'One by one — each step feeds the next.',
                mode,
                nodes: [
                    { id: a as string, kind: 'task', label: 'Decompose', config: { topic } },
                    {
                        id: b as string,
                        kind: crewId ? 'crew' : 'task',
                        label: 'Execute',
                        config: { topic, crewId },
                    },
                    { id: c as string, kind: 'reflection', label: 'Review' },
                ],
                edges: [
                    { id: 'e1', from: a as string, to: b as string },
                    { id: 'e2', from: b as string, to: c as string },
                ],
                entryNodeId: a as string,
                reflectEvery: 0,
            };
        }
        case 'hierarchical': {
            const [lead, w1, w2, agg] = ids(4, 'hier');
            return {
                name: `Hierarchical: ${topic}`.slice(0, 120),
                description: 'Leader delegates to workers, then aggregates.',
                mode,
                nodes: [
                    { id: lead as string, kind: 'task', label: 'Leader plan', config: { topic } },
                    {
                        id: w1 as string,
                        kind: crewId ? 'crew' : 'task',
                        label: 'Worker A',
                        config: { topic, crewId, branch: 'A' },
                    },
                    {
                        id: w2 as string,
                        kind: crewId ? 'crew' : 'task',
                        label: 'Worker B',
                        config: { topic, crewId, branch: 'B' },
                    },
                    { id: agg as string, kind: 'reflection', label: 'Aggregate' },
                ],
                edges: [
                    { id: 'e1', from: lead as string, to: w1 as string },
                    { id: 'e2', from: lead as string, to: w2 as string },
                    { id: 'e3', from: w1 as string, to: agg as string },
                    { id: 'e4', from: w2 as string, to: agg as string },
                ],
                entryNodeId: lead as string,
                reflectEvery: 0,
            };
        }
        case 'council': {
            const [prop, deb, cons] = ids(3, 'coun');
            return {
                name: `Council: ${topic}`.slice(0, 120),
                description: 'Proposal → debate → consensus via Council service.',
                mode,
                nodes: [
                    { id: prop as string, kind: 'council', label: 'Council run', config: { topic } },
                    { id: deb as string, kind: 'human', label: 'Human review', config: { topic } },
                    { id: cons as string, kind: 'reflection', label: 'Consensus summary' },
                ],
                edges: [
                    { id: 'e1', from: prop as string, to: deb as string },
                    { id: 'e2', from: deb as string, to: cons as string },
                ],
                entryNodeId: prop as string,
                reflectEvery: 0,
            };
        }
        case 'swarm': {
            const [s1, s2, s3, merge] = ids(4, 'swarm');
            return {
                name: `Swarm: ${topic}`.slice(0, 120),
                description: 'Parallel explorers + merge (message-passing emulation).',
                mode,
                nodes: [
                    { id: s1 as string, kind: 'task', label: 'Explorer 1', config: { topic, angle: 1 } },
                    { id: s2 as string, kind: 'task', label: 'Explorer 2', config: { topic, angle: 2 } },
                    { id: s3 as string, kind: 'task', label: 'Explorer 3', config: { topic, angle: 3 } },
                    { id: merge as string, kind: 'reflection', label: 'Merge' },
                ],
                edges: [
                    { id: 'e1', from: s1 as string, to: merge as string },
                    { id: 'e2', from: s2 as string, to: merge as string },
                    { id: 'e3', from: s3 as string, to: merge as string },
                ],
                // Swarm entry fans out: runtime starts from all roots (no incoming edges).
                entryNodeId: s1 as string,
                reflectEvery: 0,
            };
        }
        case 'forge': {
            const [f, rev, build] = ids(3, 'forge');
            return {
                name: `Forge: ${topic}`.slice(0, 120),
                description: 'Forge a team draft, human approves, crew executes.',
                mode,
                nodes: [
                    { id: f as string, kind: 'task', label: 'Forge draft', config: { topic, forge: true } },
                    { id: rev as string, kind: 'human', label: 'Approve team', config: { topic } },
                    {
                        id: build as string,
                        kind: crewId ? 'crew' : 'task',
                        label: 'Execute',
                        config: { topic, crewId },
                    },
                ],
                edges: [
                    { id: 'e1', from: f as string, to: rev as string },
                    { id: 'e2', from: rev as string, to: build as string },
                ],
                entryNodeId: f as string,
                reflectEvery: 0,
            };
        }
        case 'graph':
        default: {
            const [start, gate, end] = ids(3, 'g');
            return {
                name: `Graph: ${topic}`.slice(0, 120),
                description: 'Conditional routing demo: gate branches on state.',
                mode: 'graph',
                nodes: [
                    { id: start as string, kind: 'task', label: 'Start', config: { topic } },
                    { id: gate as string, kind: 'gate', label: 'Route', config: { key: 'route' } },
                    { id: end as string, kind: 'reflection', label: 'Finish' },
                ],
                edges: [
                    { id: 'e1', from: start as string, to: gate as string },
                    { id: 'e2', from: gate as string, to: end as string, condition: 'route=main' },
                ],
                entryNodeId: start as string,
                reflectEvery: 2,
            };
        }
    }
}
