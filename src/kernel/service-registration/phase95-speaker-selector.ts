/** Phase 95 — LLM-based speaker selection for debates/consortia. */
import type { Phase } from './helpers';
import type { ILLMClientService } from '../contracts/provider-adapter';
import { SpeakerSelectorService } from '../services/debate-runtime/speaker-selector-service';

export const registerPhase95: Phase = ({ register }) => {
    register('speakerSelectorService', (c) => {
        const llm = c.has('llmClientService')
            ? c.get<ILLMClientService>('llmClientService')
            : undefined;
        return new SpeakerSelectorService(
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
