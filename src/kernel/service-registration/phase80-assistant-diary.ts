/**
 * Phase 80 — the assistant's diary and its self-check.
 *
 * The diary (agent journal + long-term memory) is what the assistant learns
 * from; the exam service is the gate that decides which claims it may make.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { MemoryOrchestrator } from '../services/memory-orchestrator';
import type { AgentJournalService } from '../services/agent-journal-service';
import { AssistantDiaryService } from '../services/assistant/assistant-diary-service';

export const registerPhase80: Phase = ({ register }) => {
    register('assistantDiaryService', (c: IContainer) => {
        const journal = c.get<AgentJournalService>('agentJournalService');
        const memory = c.has('memoryOrchestrator')
            ? c.get<MemoryOrchestrator>('memoryOrchestrator')
            : undefined;
        return new AssistantDiaryService({
            journal,
            memory: memory
                ? {
                      store: (entry) =>
                          memory.store({
                              content: entry.content,
                              metadata: {
                                  source: 'assistant',
                                  type: 'diary',
                                  timestamp: Date.now(),
                                  importance: 0.5,
                              },
                          }),
                  }
                : undefined,
        });
    });
};
