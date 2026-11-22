/** Phase 111 — predicate agent registry + config snapshot. */
import type { Phase } from './helpers';
import { AgentRegistryQueryService } from '../services/agents/agent-registry-query-service';

export const registerPhase111: Phase = ({ register }) => {
    register('agentRegistryQueryService', () => new AgentRegistryQueryService());
};
