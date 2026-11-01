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
    it('discover Ñ‡Ð¸Ñ‚Ð°ÐµÑ‚ agent-card.json', async () => {
        const fetchImpl = vi.fn(async () => jsonResponse({ name: 'peer', url: 'https://peer.example' }));
        const client = new A2AClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const c = await client.discover('https://peer.example');
        expect(c.name).toBe('peer');
        expect(fetchImpl).toHaveBeenCalledWith(
            'https://peer.example/.well-known/agent-card.json',
            expect.anything(),
        );
    });

    it('sendMessage POST /tasks Ð¸ Ð²Ð¾Ð·Ð²Ñ€Ð°Ñ‰Ð°ÐµÑ‚ Ð·Ð°Ð´Ð°Ñ‡Ñƒ', async () => {
        const task = { id: 't1', status: 'SUBMITTED' as const };
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse(task));
        const client = new A2AClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const res = await client.sendMessage(card, { role: 'user', parts: [{ text: 'hi' }] });
        expect(res.id).toBe('t1');
        const [url, init] = fetchImpl.mock.calls[0];
        expect(url).toBe('https://peer.example/tasks');
        expect(init!.method).toBe('POST');
    });

    it('getTask GET /tasks/:id', async () => {
        const task = { id: 't1', status: 'COMPLETED' as const };
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse(task));
        const client = new A2AClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        const res = await client.getTask(card, 't1');
        expect(res.status).toBe('COMPLETED');
        expect(fetchImpl.mock.calls[0][0]).toBe('https://peer.example/tasks/t1');
    });

    it('Ð±Ñ€Ð¾ÑÐ°ÐµÑ‚ Ð½Ð° Ð½Ðµ-ok Ð¾Ñ‚Ð²ÐµÑ‚', async () => {
        const fetchImpl = vi.fn(async (_input: RequestInfo, _init?: RequestInit) => jsonResponse({}, false, 500));
        const client = new A2AClient({ fetchImpl: fetchImpl as unknown as typeof fetch });
        await expect(client.sendMessage(card, { role: 'user', parts: [] })).rejects.toThrow(/HTTP 500/);
    });
});
