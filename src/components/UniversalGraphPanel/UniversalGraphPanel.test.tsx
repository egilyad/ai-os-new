import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UniversalGraphPanel from './UniversalGraphPanel';

vi.mock('../../kernel/instances/services-extras', () => ({
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

describe('UniversalGraphPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('рендерит проекты, узлы и рёбра', async () => {
        render(<UniversalGraphPanel />);
        expect(screen.getByText('Universal Graph')).toBeTruthy();
        await waitFor(() => expect(screen.getByText('Write docs')).toBeTruthy());
        expect(screen.getByText('agent-x')).toBeTruthy();
        expect(screen.getByText(/2 nodes · 1 edges/)).toBeTruthy();
    });
});
