/**
 * CapabilityTrustService — the honesty ledger of the system.
 *
 * Every capability the assistant can use passes through three levels:
 * declared (the docs say so) → discovered (the code says so) → verified
 * (we ran it and saw the result).
 *
 * The service is the single source of truth for that level, so the assistant
 * can tell the operator what is real instead of repeating documentation.
 */
import type {
    CapabilityKind,
    CapabilityRecord,
    CapabilityTrust,
    CapabilityTrustFilter,
    CapabilityTrustStats,
} from '../../contracts/capability-trust';
import { canPromote } from '../../contracts/capability-trust';
import type { IEventBus } from '../../types/interfaces';

export class CapabilityTrustService {
    private records = new Map<string, CapabilityRecord>();

    constructor(private readonly deps: { eventBus?: IEventBus } = {}) {}

    /**
     * Register a capability at a level. Trust never moves backwards: a
     * `declare()` of an already verified capability keeps it verified.
     */
    record(
        id: string,
        kind: CapabilityKind,
        title: string,
        trust: CapabilityTrust,
        evidence: string[] = [],
    ): CapabilityRecord {
        const existing = this.records.get(id);
        const now = Date.now();

        if (!existing) {
            const created: CapabilityRecord = {
                id,
                kind,
                title,
                trust,
                evidence: [...evidence],
                stale: false,
                updatedAt: now,
                verifications: 0,
            };
            this.records.set(id, created);
            this.emit(created);
            return created;
        }

        const merged: CapabilityRecord = {
            ...existing,
            kind,
            title: title || existing.title,
            trust: canPromote(existing.trust, trust) ? trust : existing.trust,
            evidence: [...new Set([...existing.evidence, ...evidence])],
            updatedAt: now,
        };
        this.records.set(id, merged);
        this.emit(merged);
        return merged;
    }

    /** The documentation says the capability exists. */
    declare(id: string, kind: CapabilityKind, title: string, evidence: string[] = []): void {
        this.record(id, kind, title, 'declared', evidence);
    }

    /** The implementation was found in the code. */
    discover(id: string, kind: CapabilityKind, title: string, evidence: string[] = []): void {
        this.record(id, kind, title, 'discovered', evidence);
    }

    /**
     * The capability was executed and the result observed.
     *
     * `evidence` is what was actually seen — the assistant must be able to
     * repeat it to the operator.
     */
    verify(
        id: string,
        kind: CapabilityKind,
        title: string,
        evidence: string[],
    ): CapabilityRecord {
        const merged = this.record(id, kind, title, 'verified', evidence);
        const updated: CapabilityRecord = {
            ...merged,
            verifications: merged.verifications + 1,
            stale: false,
        };
        this.records.set(id, updated);
        this.emit(updated);
        return updated;
    }

    /** The capability stopped working after it had been verified. */
    markStale(id: string, reason: string): void {
        const existing = this.records.get(id);
        if (!existing) return;
        const updated: CapabilityRecord = {
            ...existing,
            stale: true,
            evidence: [...new Set([...existing.evidence, `stale: ${reason}`])],
            updatedAt: Date.now(),
        };
        this.records.set(id, updated);
        this.emit(updated);
    }

    /**
     * Seed many capabilities at once (e.g. every panel of the system).
     *
     * Seeded records are `discovered` — their existence comes from the code,
     * not from a promise. One summary event is emitted instead of one per
     * record, so the bus is not flooded at boot.
     */
    seed(
        entries: Array<{ id: string; kind: CapabilityKind; title: string; evidence?: string[] }>,
    ): number {
        let added = 0;
        for (const entry of entries) {
            const existing = this.records.get(entry.id);
            if (existing) {
                existing.evidence = [...new Set([...existing.evidence, ...(entry.evidence ?? [])])];
                continue;
            }
            this.records.set(entry.id, {
                id: entry.id,
                kind: entry.kind,
                title: entry.title,
                trust: 'discovered',
                evidence: entry.evidence ?? [],
                stale: false,
                updatedAt: Date.now(),
                verifications: 0,
            });
            added += 1;
        }
        if (added > 0) {
            this.deps.eventBus?.emit('capability:trust:seeded', { added, total: this.records.size });
        }
        return added;
    }

    get(id: string): CapabilityRecord | null {
        return this.records.get(id) ?? null;
    }

    list(filter: CapabilityTrustFilter = {}): CapabilityRecord[] {
        const all = [...this.records.values()];
        return all
            .filter((r) => (filter.kind ? r.kind === filter.kind : true))
            .filter((r) => (filter.trust ? r.trust === filter.trust : true))
            .filter((r) => (filter.includeStale ? true : !r.stale))
            .sort((a, b) => a.id.localeCompare(b.id));
    }

    stats(): CapabilityTrustStats {
        const all = [...this.records.values()];
        return {
            total: all.length,
            declared: all.filter((r) => r.trust === 'declared').length,
            discovered: all.filter((r) => r.trust === 'discovered').length,
            verified: all.filter((r) => r.trust === 'verified').length,
            stale: all.filter((r) => r.stale).length,
        };
    }

    /** A compact, human-readable summary for the assistant prompt. */
    summary(): string {
        const s = this.stats();
        return `capabilities: ${s.total} (verified ${s.verified}, discovered ${s.discovered}, declared ${s.declared}${s.stale ? `, stale ${s.stale}` : ''})`;
    }

    private emit(record: CapabilityRecord): void {
        this.deps.eventBus?.emit('capability:trust:changed', {
            id: record.id,
            kind: record.kind,
            trust: record.trust,
            stale: record.stale,
        });
    }
}
