/**
 * DeepResearchService — P.2 (research plan + brief, additive).
 *
 * Plans topic into steps (LLM or outline fallback), runs each step through
 * RagService, and compiles a markdown brief with a source table.
 */
import type { IEventBus } from '../../types/interfaces';
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IRagService } from '../../contracts/rivals2';
import type { IDeepResearchService } from '../../contracts/rivals10';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('DeepResearch');

export class DeepResearchService implements IDeepResearchService {
    constructor(
        private events: IEventBus,
        private rag?: IRagService,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('DeepResearch', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async plan(topic: string): Promise<string[]> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        { role: 'system', content: 'Draft a research plan: 3-6 steps, one per line starting with "- ".' },
                        { role: 'user', content: topic.slice(0, 1000) },
                    ],
                    { temperature: 0.4, maxTokens: 500 },
                );
                if (!res.error) {
                    const steps = res.content
                        .split('\n')
                        .map((l) => l.replace(/^-\s*/, '').trim())
                        .filter((l) => l.length > 0)
                        .slice(0, 6);
                    if (steps.length > 0) return steps;
                }
            } catch (e) {
                LOGGER.warn('DeepResearch', 'plan failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        return [
            `Background on ${topic.slice(0, 80)}`,
            'Key evidence and sources',
            'Counter-arguments',
            'Conclusions',
        ];
    }

    async run(topic: string): Promise<{ brief: string; sources: string[] }> {
        const steps = await this.plan(topic);
        const sections: string[] = [];
        const sources = new Set<string>();
        for (const step of steps) {
            let body = '(no RAG backend)';
            if (this.rag) {
                try {
                    const res = await this.rag.answer(`${topic}: ${step}`, 1);
                    body = res.answer;
                    for (const c of res.citations) sources.add(c);
                } catch (e) {
                    body = `(failed: ${e instanceof Error ? e.message : String(e)})`;
                }
            }
            sections.push(`## ${step}\n\n${body.slice(0, 2000)}`);
            this.events.emit(EVENTS.DEEPRES_STEP, { step: step.slice(0, 120) });
        }
        const brief = [
            `# Research brief: ${topic.slice(0, 160)}`,
            '',
            ...sections,
            '',
            '## Sources',
            '',
            ...[...sources].map((s, i) => `${i + 1}. ${s}`),
        ].join('\n').slice(0, 15000);
        return { brief, sources: [...sources] };
    }
}
