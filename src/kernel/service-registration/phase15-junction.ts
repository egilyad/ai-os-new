/**
 * Phase 15 — Junction Engine.
 *
 * Registers the Junction Engine (cross-domain synthesis) service.
 * Depends on phase 0 (dal + eventBus) and phase 14 (crystalVault).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal';
import type { ICrystalVaultService } from '../contracts/knowledge-crystal';
import { JunctionEngineService } from '../services/junction-engine/junction-engine-service';
import type { JunctionSourceView } from '../contracts/junction-engine';
import { rootLogger } from '../services/logger-service';

const LOGGER = rootLogger.child('Phase15Junction');

export const registerPhase15: Phase = ({ register }) => {
    register(
        'junctionEngine',
        (c: IContainer) =>
            new JunctionEngineService({
                repository: c.get<DataAccessLayer>('dal').junction,
                eventBus: c.get<IEventBus>('eventBus'),
                crystalVault: c.get<ICrystalVaultService>('crystalVault'),
                debateSources: () => loadDebateSources(c.get<DataAccessLayer>('dal')),
            }),
    );
};

/** Load mature debate sessions as junction sources. */
async function loadDebateSources(dal: DataAccessLayer): Promise<JunctionSourceView[]> {
    try {
        const sessions = await dal.debate.listSessions();
        const views: JunctionSourceView[] = [];
        for (const s of sessions) {
            if (s.phase !== 'completed') continue;
            const topic = s.topic?.trim();
            if (!topic || topic.length < 12) continue;
            views.push({
                kind: 'debate',
                id: `debate://${s.id}`,
                label: topic.slice(0, 72),
                domain: 'debate',
                statement: topic,
            });
        }
        return views;
    } catch (e) {
        LOGGER.warn('Phase15Junction', 'failed to load debate sources', { error: e });
        return [];
    }
}
