/** Phase 94 — natural language → validated team spec. */
import type { Phase } from './helpers';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { AutoSwarmBuilderService } from '../services/builder/auto-swarm-builder-service';

export const registerPhase94: Phase = ({ register }) => {
    register('autoSwarmBuilderService', (c) => {
        const llm = c.has('llmClientService')
            ? c.get<ILLMClientService>('llmClientService')
            : undefined;
        return new AutoSwarmBuilderService(
            llm
                ? {
                      chat: async (messages) => {
                          const res = await llm.sendMessage(messages as never);
                          return { content: res.content };
                      },
                  }
                : { chat: async () => ({ content: '' }) },
        );
    });
};
