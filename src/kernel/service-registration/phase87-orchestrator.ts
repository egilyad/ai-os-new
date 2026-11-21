/** Phase 87 — unified mission orchestrator (goal → DAG → execution). */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { OrchestratorService } from '../services/orchestrator/orchestrator-service';

export const registerPhase87: Phase = ({ register }) => {
    register('orchestratorService', (c: IContainer) => {
        const llm = c.has('llmClientService')
            ? c.get<ILLMClientService>('llmClientService')
            : undefined;
        return new OrchestratorService(
            c.get<IEventBus>('eventBus'),
            llm
                ? {
                      chat: async (messages) => {
                          const res = await llm.sendMessage(messages as never);
                          return { content: res.content };
                      },
                  }
                : undefined,
        );
    });
};
