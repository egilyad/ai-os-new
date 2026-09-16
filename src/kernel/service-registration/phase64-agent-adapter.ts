/**
 * Phase 64 — Agent Act Adapter (Simulation Lab).
 *
 * Registers (additive, no migration):
 *   - agentActAdapterService (IAgentActPort via IAgentFactory, stub fallback, PROVIDER-PENDING for real LLM)
 *
 * SimulationEngine can be wired with this adapter via constructor actPort (manual DI swap in next micro-step).
 * Real LLM still PROVIDER-PENDING until Заход 2.
 */

import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IAgentFactory } from '../contracts/capability';
import { AgentActAdapterService } from '../services/simulation/agent-act-adapter-service';

export const registerPhase64: Phase = ({ register }) => {
    register('agentActAdapterService', (c: IContainer) => new AgentActAdapterService({
        agentFactory: c.get<IAgentFactory>('agentFactory'),
    }));
};
