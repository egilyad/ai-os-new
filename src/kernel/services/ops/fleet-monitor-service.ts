/**
 * FleetMonitorService — Wave 5.3 (agent-swarm-dashboard-inspired, read-only).
 *
 * Subscribes to crew/council/graph events and maintains MissionWatch states.
 * Pure observer — never drives runs. Live Timeline stays in TimelineService
 * (untouched); this service is the mission-level projection for phones/dashboards.
 */
import type { IEventBus } from '../../types/interfaces';
import type { OpsRepository } from '../../dal/ops-repository';
import type { IFleetMonitorService } from '../../contracts/ops';
import type { MissionWatch } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('FleetMonitor');

function now(): number {
    return Date.now();
}

export class FleetMonitorService implements IFleetMonitorService {
    private unsubs: Array<() => void> = [];
    private subscribed = false;

    constructor(
        private repo: OpsRepository,
        private events: IEventBus,
    ) {}

    async init(): Promise<void> {
        if (this.subscribed) return;
        this.subscribed = true;
        const watchers: Array<{ event: string; kind: MissionWatch['kind']; status: string }> = [
            { event: EVENTS.CREW_STARTED, kind: 'crew', status: 'running' },
            { event: EVENTS.CREW_COMPLETED, kind: 'crew', status: 'completed' },
            { event: EVENTS.CREW_FAILED, kind: 'crew', status: 'failed' },
            { event: EVENTS.COUNCIL_CREATED, kind: 'council', status: 'running' },
            { event: EVENTS.COUNCIL_COMPLETED, kind: 'council', status: 'completed' },
            { event: EVENTS.GRAPH_STARTED, kind: 'graph', status: 'running' },
            { event: EVENTS.GRAPH_COMPLETED, kind: 'graph', status: 'completed' },
            { event: EVENTS.GRAPH_FAILED, kind: 'graph', status: 'failed' },
        ];
        for (const w of watchers) {
            this.unsubs.push(
                this.events.onSafe<Record<string, string>>(w.event, (d) => {
                    const ref = (d['crewId'] ?? d['sessionId'] ?? d['runId'] ?? '') as string;
                    if (!ref) return;
                    void this.touchWatch(w.kind, ref, w.status, w.event);
                }),
            );
        }
        LOGGER.info('init', { watchers: watchers.length });
    }

    async destroy(): Promise<void> {
        for (const u of this.unsubs) {
            try {
                u();
            } catch {
                // ignore teardown errors
            }
        }
        this.unsubs = [];
        this.subscribed = false;
    }

    async watch(kind: MissionWatch['kind'], ref: string, label?: string): Promise<MissionWatch> {
        const existing = (await this.repo.listWatches()).find((w) => w.kind === kind && w.ref === ref);
        if (existing) return existing;
        const t = now();
        const watch: MissionWatch = {
            id: genId('watch'),
            kind,
            ref,
            label: label ?? `${kind}:${ref.slice(0, 12)}`,
            status: 'watching',
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putWatch(watch);
        return watch;
    }

    async unwatch(id: string): Promise<void> {
        await this.repo.deleteWatch(id);
    }

    async list(): Promise<MissionWatch[]> {
        return this.repo.listWatches();
    }

    async snapshot(): Promise<{ missions: MissionWatch[]; counts: Record<string, number> }> {
        const missions = await this.repo.listWatches();
        const counts: Record<string, number> = {};
        for (const m of missions) counts[m.status] = (counts[m.status] ?? 0) + 1;
        return { missions, counts };
    }

    private async touchWatch(kind: MissionWatch['kind'], ref: string, status: string, event: string): Promise<void> {
        try {
            const existing = (await this.repo.listWatches()).find((w) => w.kind === kind && w.ref === ref);
            if (!existing) return; // only track explicitly watched missions
            existing.status = status;
            existing.lastEvent = event;
            existing.updatedAt = now();
            await this.repo.putWatch(existing);
        } catch (e) {
            LOGGER.warn('touchWatch failed', { error: e instanceof Error ? e.message : String(e) });
        }
    }
}
