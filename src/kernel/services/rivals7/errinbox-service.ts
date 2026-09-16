/**
 * ErrorInboxService — M.3 (Sentry-style error inbox, additive).
 *
 * Errors normalize into fingerprints (message skeleton + top frame);
 * groups count occurrences with first/last timestamps and a sample;
 * resolve/ignore flip group status. All in DAL kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IErrorInboxService } from '../../contracts/rivals7';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('ErrInbox');

interface ErrGroup {
    fingerprint: string;
    count: number;
    status: 'open' | 'resolved' | 'ignored';
    sample: string;
    firstAt: number;
    lastAt: number;
}

function fingerprint(error: string, context?: string): string {
    const skeleton = error
        .toLowerCase()
        .replace(/\b[0-9a-f]{8,}([-_][0-9a-f]{4,})+\b/g, '<id>')
        .replace(/\b\d{4,}\b/g, '<n>')
        .replace(/["'][^"']{1,80}["']/g, '<s>')
        .split('\n')[0]!
        .trim()
        .slice(0, 160);
    let h = 2166136261;
    const src = `${skeleton}|${(context ?? '').split('\n')[0]?.slice(0, 80) ?? ''}`;
    for (let i = 0; i < src.length; i++) {
        h ^= src.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

export class ErrorInboxService implements IErrorInboxService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async capture(error: string, context?: string): Promise<string> {
        const fp = fingerprint(error, context);
        const key = `errgroup/${fp}`;
        const existing = await this.dal.kv.get<ErrGroup>(key);
        const t = Date.now();
        if (existing) {
            existing.count += 1;
            existing.lastAt = t;
            if (existing.status === 'resolved') existing.status = 'open';
            await this.dal.kv.set(key, existing);
        } else {
            await this.dal.kv.set(key, {
                fingerprint: fp,
                count: 1,
                status: 'open',
                sample: `${error.slice(0, 300)}${context ? `\n@ ${context.slice(0, 160)}` : ''}`,
                firstAt: t,
                lastAt: t,
            } as ErrGroup);
        }
        this.events.emit(EVENTS.ERR_CAPTURED, { fingerprint: fp });
        return fp;
    }

    async groups(): Promise<Array<{ fingerprint: string; count: number; status: string; sample: string }>> {
        const rows = await this.dal.kv.list('errgroup/');
        return rows
            .map((r) => {
                const g = r.value as ErrGroup;
                return { fingerprint: g.fingerprint, count: g.count, status: g.status, sample: g.sample };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 100);
    }

    async resolve(fingerprint: string): Promise<void> {
        await this.setStatus(fingerprint, 'resolved');
    }

    async ignore(fingerprint: string): Promise<void> {
        await this.setStatus(fingerprint, 'ignored');
    }

    private async setStatus(fingerprint: string, status: ErrGroup['status']): Promise<void> {
        const group = await this.dal.kv.get<ErrGroup>(`errgroup/${fingerprint}`);
        if (!group) throw new Error(`Error group not found: ${fingerprint}`);
        group.status = status;
        await this.dal.kv.set(`errgroup/${fingerprint}`, group);
    }
}
