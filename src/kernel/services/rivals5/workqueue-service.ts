/**
 * WorkQueueService — J.2 (UiPath-style work items + robots + assets).
 *
 * Generic payload items (not crew runs — those live in RunQueueService) with
 * retries, robot claim/complete/fail, and name-only assets. All in DAL kv.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IWorkQueueService } from '../../contracts/rivals5';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('WorkQueue');

interface WorkItem {
    id: string;
    payload: Record<string, unknown>;
    status: 'queued' | 'claimed' | 'done' | 'failed';
    robotId?: string;
    retries: number;
    maxRetries: number;
    result?: string;
    error?: string;
    createdAt: number;
}

export class WorkQueueService implements IWorkQueueService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('WorkQueue', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async push(payload: Record<string, unknown>, maxRetries = 3): Promise<string> {
        const item: WorkItem = {
            id: genId('work'),
            payload: { ...payload },
            status: 'queued',
            retries: 0,
            maxRetries: Math.max(0, Math.min(10, maxRetries)),
            createdAt: Date.now(),
        };
        await this.dal.kv.set(`work/${item.id}`, item);
        this.events.emit(EVENTS.WORK_PUSHED, { itemId: item.id });
        return item.id;
    }

    async claim(robotId: string): Promise<{ id: string; payload: Record<string, unknown> } | null> {
        const rows = await this.dal.kv.list('work/');
        const queued = rows
            .map((r) => r.value as WorkItem)
            .filter((w) => w.status === 'queued')
            .sort((a, b) => a.createdAt - b.createdAt);
        const item = queued[0];
        if (!item) return null;
        item.status = 'claimed';
        item.robotId = robotId;
        await this.dal.kv.set(`work/${item.id}`, item);
        return { id: item.id, payload: { ...item.payload } };
    }

    async complete(itemId: string, result = ''): Promise<void> {
        const item = await this.require(itemId);
        item.status = 'done';
        item.result = result.slice(0, 2000);
        await this.dal.kv.set(`work/${itemId}`, item);
    }

    async fail(itemId: string, error = ''): Promise<void> {
        const item = await this.require(itemId);
        item.retries += 1;
        item.error = error.slice(0, 500);
        item.status = item.retries > item.maxRetries ? 'failed' : 'queued';
        item.robotId = undefined;
        await this.dal.kv.set(`work/${itemId}`, item);
    }

    async setAsset(key: string, refName: string): Promise<void> {
        if (/(sk-|password\s*[:=]|bearer\s+[a-z0-9])/i.test(refName)) {
            throw new Error('Assets store reference names only — never secrets');
        }
        await this.dal.kv.set(`assets/${key.slice(0, 120)}`, refName.slice(0, 200));
    }

    async getAsset(key: string): Promise<string | null> {
        const v = await this.dal.kv.get<string>(`assets/${key.slice(0, 120)}`);
        return v ?? null;
    }

    private async require(id: string): Promise<WorkItem> {
        const item = await this.dal.kv.get<WorkItem>(`work/${id}`);
        if (!item) throw new Error(`Work item not found: ${id}`);
        return item;
    }
}
