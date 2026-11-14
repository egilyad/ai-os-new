import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GraphStudioPanel from './GraphStudioPanel';

vi.mock('../../kernel/instances/services-core', () => ({
    projectManagerService: {
        list: vi.fn(async () => [{ id: 'p1', name: 'Demo' }]),
    },
}));

vi.mock('../../kernel/services/project-graph/project-graph-repository', () => {
    class MockRepository {
        async listNodes() {
            return [
                {
                    id: 'n1',
                    projectId: 'p1',
                    kind: 'task',
                    label: 'Write docs',
                    createdAt: 1,
                    updatedAt: 1,
                },
                {
                    id: 'n2',
                    projectId: 'p1',
                    kind: 'agent',
                    label: 'agent-x',
                    createdAt: 1,
                    updatedAt: 1,
                },
            ];
        }
        async listEdges() {
            return [
                {
                    id: 'e1',
                    projectId: 'p1',
                    from: 'n1',
                    to: 'n2',
                    relation: 'assigned_to',
                    weight: 1,
                    createdAt: 1,
                },
            ];
        }
    }
    return { ProjectGraphRepository: MockRepository };
});

vi.mock('../Common/VisGraph', () => ({
    default: ({ nodes, edges }: { nodes: unknown[]; edges: unknown[] }) => (
        <div data-testid="visgraph-mock">
            nodes:{nodes.length}:edges:{edges.length}
        </div>
    ),
}));

describe('GraphStudioPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерит студию с контролами и данными', async () => {
        render(<GraphStudioPanel />);
        expect(screen.getByText('Graph Studio')).toBeTruthy();
        expect(screen.getByText('Semantics')).toBeTruthy();
        expect(screen.getByText('Physics')).toBeTruthy();
        await waitFor(
            () => expect(screen.getByTestId('visgraph-mock').textContent).toContain('nodes:2'),
            { timeout: 4000 },
        );
        expect(screen.getByTestId('visgraph-mock').textContent).toContain('edges:1');
    });
});
