/**
 * Phase 81 — Wiki Brain.
 *
 * Registers the LLM-compiled wiki domain: a separate Dexie store, the ingest
 * pipeline (analyze → generate → persist), BM25 search, lint and graph, plus
 * a context provider for agents. Kept isolated from the product memory.
 */
import type { Phase } from './helpers';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';
import type { ILLMClientService } from '../contracts/provider-adapter';
import type { AdapterMessage } from '../contracts/provider-adapter';
import type { WikiLlmClient } from '../contracts/wiki-brain/wiki-llm';
import { WikiDexieStore } from '../services/wiki-brain/store.dexie';
import { WikiLogService } from '../services/wiki-brain/wiki-log.service';
import { WikiIndexService } from '../services/wiki-brain/wiki-index.service';
import { WikiGraphService } from '../services/wiki-brain/wiki-graph.service';
import { WikiLintService } from '../services/wiki-brain/wiki-lint.service';
import { WikiSearchAdapter } from '../services/wiki-brain/wiki-search-adapter';
import { WikiQueryService } from '../services/wiki-brain/wiki-query.service';
import { WikiIngestService } from '../services/wiki-brain/wiki-ingest.service';
import { WikiBrainService } from '../services/wiki-brain/wiki-brain.service';
import { WikiBrainContextProvider } from '../services/wiki-brain/wiki-context-provider';

function wikiLlm(c: IContainer): WikiLlmClient | null {
    if (!c.has('llmClientService')) return null;
    const llm = c.get<ILLMClientService>('llmClientService');
    return {
        chat: (messages, opts) =>
            llm.chat(messages as AdapterMessage[], { model: opts?.model }),
    };
}

export const registerPhase81: Phase = ({ register }) => {
    register('wikiStore', (_c: IContainer) => new WikiDexieStore());

    register('wikiLogService', (c: IContainer) => new WikiLogService(c.get('wikiStore')));
    register('wikiIndexService', (c: IContainer) =>
        new WikiIndexService(c.get('wikiStore')),
    );
    register('wikiGraphService', (c: IContainer) => new WikiGraphService(c.get('wikiStore')));

    register('wikiLintService', (c: IContainer) =>
        new WikiLintService(c.get('wikiStore')),
    );

    register('wikiSearchAdapter', (c: IContainer) =>
        new WikiSearchAdapter(c.get('wikiStore')),
    );

    register('wikiQueryService', (c: IContainer) =>
        new WikiQueryService(c.get('wikiStore'), c.get('wikiSearchAdapter'), c.get('wikiGraphService')),
    );

    register('wikiIngestService', (c: IContainer) => {
        const llm = wikiLlm(c);
        if (!llm) throw new Error('Wiki Brain requires llmClientService');
        return new WikiIngestService(
            c.get('wikiStore'),
            llm,
            c.get<IEventBus>('eventBus') as unknown as { emit: (e: string, p?: unknown) => void },
            c.get('wikiIndexService'),
            c.get('wikiLogService'),
            c.get('wikiSearchAdapter'),
        );
    });

    register('wikiBrainService', (c: IContainer) =>
        new WikiBrainService(
            c.get('wikiStore'),
            c.get('wikiIngestService'),
            c.get('wikiQueryService'),
            c.get('wikiLintService'),
            c.get('wikiIndexService'),
            c.get('wikiLogService'),
            c.get('wikiGraphService'),
        ),
    );

    register('wikiBrainContextProvider', (c: IContainer) =>
        new WikiBrainContextProvider(c.get('wikiQueryService')),
    );
};
