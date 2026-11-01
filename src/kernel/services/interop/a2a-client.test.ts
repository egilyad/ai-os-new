import { describe, expect, it, vi } from 'vitest';
import { A2AClient } from './a2a-client';
import type { AgentCard } from '../../contracts/a2a';

function jsonResponse(body: unknown, ok = true, status = 200) {
    return {
        ok,
        status,
        json: async () => body,
    } as Response;
}

const card: AgentCard = { name: 'peer', url: 'https://peer.example' };

describe('A2AClient (SPEC_09)', () => {
    it('discover читает agent-card.json', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ name: 'peer', url: 'https://peer.example' }));
        const client = new A2AClient({ fetchImpl });
        const c = await client.discover('https://peer.example');
        expect(c.name).toBe('peer');
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://peer.example/.well-known/agent-card.json',
            expect.anything(),
        );
    });

    it('sendMessage POST /tasks и возвращает задачу', async () => {
        const task = { id: 't1', status: 'SUBMITTED' as const };
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse(task));
        const client = new A2AClient({ fetchImpl });
        const res = await client.sendMessage(card, { role: 'user', parts: [{ text: 'hi' }] });
        expect(res.id).toBe('t1');
        const [url, init] = fetchImpl.mock.calls[0];
        expect(url).toBe('https://peer.example/tasks');
        expect(init!.method).toBe('POST');
    });

    it('getTask GET /tasks/:id', async () => {
        const task = { id: 't1', status: 'COMPLETED' as const };
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse(task));
        const client = new A2AClient({ fetchImpl });
        const res = await client.getTask(card, 't1');
        expect(res.status).toBe('COMPLETED');
        expect(fetchImpl.mock.calls[0][0]).toBe('https://peer.example/tasks/t1');
    });

    it('бросает на не-ok ответ', async () => {
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse({}, false, 500));
        const client = new A2AClient({ fetchImpl });
        await expect(client.sendMessage(card, { role: 'user', parts: [] })).rejects.toThrow(/HTTP 500/);
    });
});
