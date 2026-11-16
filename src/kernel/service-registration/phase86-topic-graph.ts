/**
 * Phase 86 — Topic Graph (самостоятельный домен знаний).
 *
 *  - topicGraphService: накопление/структурирование знаний по темам:
 *    ingest → нормализация → дедупликация → противоречия → связи → полнота.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { IEmbeddingPort } from '../contracts/parity';
import { TopicGraphServiceImpl } from '../services/topic-graph/topic-graph-service';
import { createTopicGraphDB } from '../services/topic-graph/topic-graph-dexie';

export const registerPhase86: Phase = ({ register }) => {
    register('topicGraphService', (c: IContainer) => {
        createTopicGraphDB();
        const llm = c.has('llmClientService')
            ? c.get<ILLMClientService>('llmClientService')
            : null;
        const embedder = c.has('embeddingServiceHub')
            ? c.get<IEmbeddingPort>('embeddingServiceHub')
            : null;
        return new TopicGraphServiceImpl(undefined, {
            llm: llm
                ? {
                      chat: async (messages) => {
                          const res = await llm.sendMessage(messages as never);
                          return { content: res.content };
                      },
                  }
                : undefined,
            embedder: embedder ? { embed: (texts) => embedder.embed(texts) } : undefined,
        });
    });
};
