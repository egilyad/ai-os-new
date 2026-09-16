/**
 * QuotaGuardService — P.3 (per-key quotas, additive).
 *
 * Token usage per key accumulates in DAL kv; crossing the quota flips a
 * disabled flag and emits + notifies once (re-armed when usage resets
 * or the quota is raised). Router/key layers consult `check()`.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IMobileAccessService } from '../../contracts/ops';
import type { IQuotaGuardService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('QuotaGuard');

export class QuotaGuardService implements IQuotaGuardService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private inbox?: IMobileAccessService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('QuotaGuard', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async recordUse(keyId: string, tokens: number): Promise<void> {
        const clean = keyId.slice(0, 120);
        const used = ((await this.dal.kv.get<number>(`quota-use/${clean}`)) ?? 0) + Math.max(0, tokens);
        await this.dal.kv.set(`quota-use/${clean}`, used);
        const quota = await this.dal.kv.get<number>(`quota-max/${clean}`);
        if (quota !== null && quota !== undefined && used >= quota) {
            const already = await this.dal.kv.get<boolean>(`quota-off/${clean}`);
            if (!already) {
                await this.dal.kv.set(`quota-off/${clean}`, true);
                this.events.emit(EVENTS.QUOTA_BREACH, { keyId: clean, used });
                if (this.inbox) {
                    try {
                        await this.inbox.notify({
                            title: `Quota breached: ${clean}`,
                            body: `${used} / ${quota} tokens — key paused.`,
                            actionRef: `quota:${clean}`,
                        });
                    } catch {
                        // inbox best-effort
                    }
                }
            }
        }
    }

    async setQuota(keyId: string, maxTokens: number): Promise<void> {
        const clean = keyId.slice(0, 120);
        await this.dal.kv.set(`quota-max/${clean}`, Math.max(1, maxTokens));
        // Raising the quota re-arms the key.
        const used = (await this.dal.kv.get<number>(`quota-use/${clean}`)) ?? 0;
        const max = await this.dal.kv.get<number>(`quota-max/${clean}`);
        if (max !== null && used < (max ?? 0)) {
            await this.dal.kv.set(`quota-off/${clean}`, false);
        }
    }

    async check(keyId: string): Promise<{ ok: boolean; used: number; quota?: number }> {
        const clean = keyId.slice(0, 120);
        const used = (await this.dal.kv.get<number>(`quota-use/${clean}`)) ?? 0;
        const quota = (await this.dal.kv.get<number>(`quota-max/${clean}`)) ?? undefined;
        const off = (await this.dal.kv.get<boolean>(`quota-off/${clean}`)) ?? false;
        return { ok: !off, used, quota: quota ?? undefined };
    }
}
