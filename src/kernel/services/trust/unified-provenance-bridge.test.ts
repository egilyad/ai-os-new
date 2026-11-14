import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { UnifiedProvenanceBridge } from './unified-provenance-bridge';
import { eventBus } from '../../events/event-bus';
import { EVENTS } from '../../events/event-names';

function makeProvenanceMock() {
    let n = 0;
    const nodes: Array<{ id: string; kind: string; label: string; ref?: string }> = [];
    const edges: Array<{ fromId: string; toId: string; relation: string }> = [];
    return {
        addNode: vi.fn(async (kind: string, label: string, ref?: string) => {
            const id = `pv-${++n}`;
            nodes.push({ id, kind, label, ref });
            return { id, kind, label, ref, createdAt: Date.now() };
        }),
        link: vi.fn(async (fromId: string, toId: string, relation: string) => {
            edges.push({ fromId, toId, relation });
            return { id: 'edge-1', fromId, toId, relation, createdAt: Date.now() };
        }),
        nodes,
        edges,
    };
}

describe('UnifiedProvenanceBridge', () => {
    let bridge: UnifiedProvenanceBridge;
    let provenance: ReturnType<typeof makeProvenanceMock>;

    beforeEach(() => {
        provenance = makeProvenanceMock();
        bridge = new UnifiedProvenanceBridge({ provenance: provenance as never });
        bridge.start();
    });

    afterEach(() => {
        bridge.stop();
    });

    it('PROJECT_CREATED → provenance project node', async () => {
        eventBus.emit(EVENTS.PROJECT_CREATED, {
            projectId: 'p1',
            name: 'Demo',
            type: 'website',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(provenance.addNode).toHaveBeenCalledWith('project', 'Demo', 'proj:p1');
    });

    it('TASK_CREATED → task node + contains + assigned_to', async () => {
        eventBus.emit(EVENTS.TASK_CREATED, {
            taskId: 't1',
            title: 'Write docs',
            projectId: 'p1',
            assigneeId: 'agent-x',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(provenance.addNode).toHaveBeenCalledWith('task', 'Write docs', 'pg:t1');
        expect(provenance.addNode).toHaveBeenCalledWith('agent', 'agent-x', 'pg:agent-x');
        expect(provenance.link).toHaveBeenCalledWith(
            expect.stringMatching(/^pv-/),
            expect.stringMatching(/^pv-/),
            'contains',
        );
        expect(provenance.link).toHaveBeenCalledWith(
            expect.stringMatching(/^pv-/),
            expect.stringMatching(/^pv-/),
            'assigned_to',
        );
    });

    it('PROJECT_DEBATE_STARTED → debate node + contains', async () => {
        eventBus.emit(EVENTS.PROJECT_DEBATE_STARTED, {
            projectId: 'p1',
            debateId: 'd1',
            decision: 'choose-stack',
            trigger: 'manual',
        });
        await new Promise((r) => setTimeout(r, 30));
        expect(provenance.addNode).toHaveBeenCalledWith('debate', 'choose-stack', 'pg:d1');
        expect(provenance.link).toHaveBeenCalledWith(
            expect.stringMatching(/^pv-/),
            expect.stringMatching(/^pv-/),
            'contains',
        );
    });
});
