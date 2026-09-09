/**
 * ReasoningService — H.1 (Agno-style think block, additive).
 *
 * Structured reasoning (goal/steps/risks) via LLM JSON or deterministic
 * fallback. Consumed by autonomy/planner/react before acting.
 */
import type { ILLMClientService } from '../../contracts/provider-adapter';
import type { IReasoningService, Reasoning } from '../../contracts/rivals3';
import type { IEventBus } from '../../types/interfaces';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Reasoning');

export class ReasoningService implements IReasoningService {
    constructor(
        private events: IEventBus,
        private llm?: ILLMClientService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async think(task: string): Promise<Reasoning> {
        if (this.llm) {
            try {
                const res = await this.llm.chat(
                    [
                        {
                            role: 'system',
                            content:
                                'You reason before acting. Reply as JSON: {"goal":"...","steps":["..."],"risks":["..."]}. Max 4 steps, 3 risks.',
                        },
                        { role: 'user', content: task.slice(0, 3000) },
                    ],
                    { temperature: 0.3, maxTokens: 500 },
                );
                if (!res.error) {
                    const start = res.content.indexOf('{');
                    if (start >= 0) {
                        const parsed = JSON.parse(
                            res.content.slice(start, res.content.lastIndexOf('}') + 1),
                        ) as Partial<Reasoning>;
                        const out: Reasoning = {
                            goal: String(parsed.goal ?? task).slice(0, 500),
                            steps: Array.isArray(parsed.steps)
                                ? parsed.steps.map((s) => String(s).slice(0, 300)).slice(0, 4)
                                : [`Do: ${task.slice(0, 200)}`],
                            risks: Array.isArray(parsed.risks)
                                ? parsed.risks.map((s) => String(s).slice(0, 300)).slice(0, 3)
                                : [],
                        };
                        this.events.emit(EVENTS.REASON_THOUGHT, { steps: out.steps.length });
                        return out;
                    }
                }
            } catch (e) {
                LOGGER.warn('think failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const fallback: Reasoning = {
            goal: task.slice(0, 500),
            steps: [`Analyze: ${task.slice(0, 160)}`, 'Execute the core action', 'Verify the result'],
            risks: ['Incomplete context'],
        };
        this.events.emit(EVENTS.REASON_THOUGHT, { steps: fallback.steps.length });
        return fallback;
    }
}
