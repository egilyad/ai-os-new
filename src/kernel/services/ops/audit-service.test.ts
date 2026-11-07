import { describe, it, expect, vi } from 'vitest';
import { AuditService, auditHash, GENESIS_HASH } from './audit-service';
import type { AuditEntry } from '../../types/ops-types';

function makeRepo() {
    const rows: AuditEntry[] = [];
    return {
        rows,
        lastAuditSeq: vi.fn(async () => rows.length),
        listAudit: vi.fn(async (limit: number) => rows.slice(-limit)),
        appendAudit: vi.fn(async (entry: AuditEntry) => {
            rows.push(entry);
        }),
    };
}

function makeDeps() {
    return {
        repo: makeRepo(),
        events: { emit: vi.fn(), on: vi.fn(() => () => {}), onSafe: vi.fn(() => () => {}) },
    };
}

describe('auditHash', () => {
    it('is deterministic for identical inputs', () => {
        const a = auditHash(GENESIS_HASH, 1, 'actor', 'action', 'target', 'detail', 1000);
        const b = auditHash(GENESIS_HASH, 1, 'actor', 'action', 'target', 'detail', 1000);
        expect(a).toBe(b);
        expect(a).toMatch(/^[0-9a-f]{8}$/);
    });

    it('changes when any input changes', () => {
        const a = auditHash(GENESIS_HASH, 1, 'actor', 'action', 'target', 'detail', 1000);
        const b = auditHash(GENESIS_HASH, 1, 'actor', 'action', 'target', 'detail', 1001);
        expect(a).not.toBe(b);
    });
});

describe('AuditService', () => {
    it('append writes a hash-chained entry with the next sequence', async () => {
        const { repo, events } = makeDeps();
        const svc = new AuditService(repo as never, events as never);
        const first = await svc.append('alice', 'policy.added', 'pol-1', 'allow');
        expect(first.seq).toBe(1);
        expect(first.prevHash).toBe(GENESIS_HASH);
        const second = await svc.append('alice', 'policy.removed', 'pol-1');
        expect(second.seq).toBe(2);
        expect(second.prevHash).toBe(first.hash);
        expect(events.emit).toHaveBeenCalledWith(expect.anything(), expect.anything());
    });

    it('verify passes on an untouched chain', async () => {
        const { repo, events } = makeDeps();
        const svc = new AuditService(repo as never, events as never);
        await svc.append('alice', 'a');
        await svc.append('bob', 'b');
        const result = await svc.verify();
        expect(result.ok).toBe(true);
    });

    it('verify flags tampered entries', async () => {
        const { repo, events } = makeDeps();
        const svc = new AuditService(repo as never, events as never);
        await svc.append('alice', 'a');
        await svc.append('bob', 'b');
        // Tamper: modify the first row's action after the fact.
        repo.rows[0] = { ...repo.rows[0]!, action: 'tampered' };
        const result = await svc.verify();
        expect(result.ok).toBe(false);
        expect(result.brokenAt).toBe(1);
    });
});
