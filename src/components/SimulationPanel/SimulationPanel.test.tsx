import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const list = vi.fn(async () => [] as unknown);
const get = vi.fn(async () => undefined);
const create = vi.fn(async () => ({}) as unknown);
const remove = vi.fn(async () => undefined);
const run = vi.fn(async () => ({}) as unknown);
const step = vi.fn(async () => ({}) as unknown);
const spawnParallel = vi.fn(async () => [] as unknown);

vi.mock('../../kernel/service-helper', () => ({
    lazyService: (name: string) => {
        if (name === 'worldStateService') return { list, get, create, remove };
        if (name === 'simulationEngineService') return { run, step };
        if (name === 'agentFactory') return { spawnParallel };
        return {};
    },
}));

describe('SimulationPanel', () => {
    it('renders the title', async () => {
        const { SimulationPanel } = await import('./SimulationPanel');
        render(<SimulationPanel />);
        expect(await screen.findByText('Simulation Lab')).toBeDefined();
    });

    it('tolerates a non-array world list', async () => {
        list.mockResolvedValueOnce(null);
        const { SimulationPanel } = await import('./SimulationPanel');
        render(<SimulationPanel />);
        expect(await screen.findByText('Simulation Lab')).toBeDefined();
        expect(screen.getByText('+ New World (6 agents)')).toBeDefined();
    });
});
