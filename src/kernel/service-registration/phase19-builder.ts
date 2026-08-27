/**
 * Phase 19 — Builder Agent.
 *
 * Registers the Builder Agent (AI cognitive topology generator) service.
 * Depends on phase 0 (dal + eventBus).
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { DataAccessLayer } from '../dal';
import { BuilderAgentService } from '../services/builder/builder-agent-service';

export const registerPhase19: Phase = ({ register }) => {
    register(
        'builderAgent',
        (c: IContainer) =>
            new BuilderAgentService({
                repository: c.get<DataAccessLayer>('dal').builder,
                eventBus: c.get<IEventBus>('eventBus'),
            }),
    );
};
