/** Phase 87 — unified mission orchestrator (goal → DAG → execution). */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { OrchestratorService } from '../services/orchestrator/orchestrator-service';
import { DispatcherService } from '../services/orchestrator/dispatcher-service';
import type { DispatcherAgent } from '../contracts/dispatcher';

export const registerPhase87: Phase = ({ register }) => {
    register('dispatcherService', (c: IContainer) => {
        const directory = c.has('agentDirectoryService')
            ? c.get<{ listAgents(): DispatcherAgent[] }>('agentDirectoryService')
            : null;
        const agents = directory
            ? directory.listAgents()
            : c.has('runtimeSystem')
              ? ([
                    ...(c
                        .get<{
                            getAllAgents?(): Array<{
                                id: string;
                                name?: string;
                                role: string;
                                specializations?: string[];
                            }>;
                        }>('runtimeSystem')
                        .getAllAgents?.() ?? []),
                ] as DispatcherAgent[])
              : [];
        return new DispatcherService(agents);
    });

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
