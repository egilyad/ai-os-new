/**
 * AuditService — append-only hash-chained log (Wave 5.1, HexorOS transparency).
 *
 * Chain: hash = fnv1a(prevHash + seq + actor + action + target + detail + ts).
 * verify() replays the chain; any tamper breaks it at the edited index.
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService } from '../../contracts/ops';
import type { AuditEntry } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Audit');

function fnv1a(s: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

export const GENESIS_HASH = '00000000';

export function auditHash(prev: string, seq: number, actor: string, action: string, target: string, detail: string, ts: number): string {
    return fnv1a(`${prev}|${seq}|${actor}|${action}|${target}|${detail}|${ts}`);
}

export class AuditService implements IAuditService {
    constructor(
        private repo: OpsRepository,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async append(actor: string, action: string, target = '', detail = ''): Promise<AuditEntry> {
        const last = await this.repo.lastAuditSeq();
        const seq = last + 1;
        const prevRows = await this.repo.listAudit(1);
        const prevHash = prevRows.length > 0 ? (prevRows[prevRows.length - 1]!.hash as string) : GENESIS_HASH;
        const createdAt = Date.now();
        const entry: AuditEntry = {
            id: genId('audit'),
            seq,
            actor,
            action,
            target,
            detail: detail.slice(0, 2000),
            prevHash,
            hash: auditHash(prevHash, seq, actor, action, target, detail.slice(0, 2000), createdAt),
            createdAt,
        };
        await this.repo.appendAudit(entry);
        try {
            this.events.emit(EVENTS.OPS_AUDIT, { seq, actor, action, target });
        } catch {
            // observability must never break the write path
        }
        return entry;
    }

    async list(limit = 200): Promise<AuditEntry[]> {
        return this.repo.listAudit(limit);
    }

    async verify(): Promise<{ ok: boolean; brokenAt?: number }> {
        const rows = await this.repo.listAudit(100000);
        let prev = GENESIS_HASH;
        for (const r of rows) {
            const expect = auditHash(prev, r.seq, r.actor, r.action, r.target ?? '', r.detail ?? '', r.createdAt);
            if (r.prevHash !== prev || r.hash !== expect) {
                return { ok: false, brokenAt: r.seq };
            }
            prev = r.hash;
        }
        return { ok: true };
    }
}
