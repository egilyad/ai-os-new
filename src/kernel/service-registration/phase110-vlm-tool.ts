/** Phase 110 — VLM as an agent-callable tool. */
import type { Phase } from './helpers';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { VlmToolService } from '../services/tools/vlm-tool-service';

export const registerPhase110: Phase = ({ register }) => {
    register('vlmToolService', (c) => {
        const llm = c.has('llmClientService')
            ? c.get<ILLMClientService>('llmClientService')
            : undefined;
        return new VlmToolService(
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
