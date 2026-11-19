/**
 * ReplanningService — dynamic plan revision (PentAGI-inspired).
 *
 * Given the original goal and the current step outcomes, it produces a
 * revised plan: how what works, rewords what failed, and drops what is no
 * longer needed. When an LLM client is available the revision is drafted by
 * the model; otherwise a deterministic fallback rewrites failed steps.
 */
import type { ILLMClientService, AdapterMessage } from '../../contracts/provider-adapter';
import type {
    IReplanningService,
    ReplanRequest,
    ReplanResponse,
    ReplannedStep,
} from '../../contracts/replanning';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Replan');

const DEFAULT_MAX_STEPS = 8;
const MAX_REVISED_STEPS = 12;

export class ReplanningService implements IReplanningService {
    constructor(private llm?: ILLMClientService) {}

    async init(): Promise<void> {
        // nothing to set up
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async replan(req: ReplanRequest): Promise<ReplanResponse> {
        const maxSteps = Math.max(1, Math.min(20, req.maxSteps ?? DEFAULT_MAX_STEPS));
        if (this.llm) {
            try {
                const revised = await this.draftWithLLM(req, maxSteps);
                if (revised) return revised;
            } catch (e) {
                LOGGER.warn('Replan', 'llm draft failed', {
                    error: e instanceof Error ? e.message : String(e),
                });
            }
        }
        return this.draftFallback(req, maxSteps);
    }

    private async draftWithLLM(
        req: ReplanRequest,
        maxSteps: number,
    ): Promise<ReplanResponse | null> {
        const stepsText = req.steps
            .map(
                (s) =>
                    `- [${s.id}] (${s.status}) ${s.description}` +
                    (s.result && s.status !== 'done' ? ` | result: ${s.result.slice(0, 160)}` : ''),
            )
            .join('\n');
        const messages: AdapterMessage[] = [
            {
                role: 'system',
                content:
                    'You revise execution plans. Reply with ONLY a JSON array of revised steps: ' +
                    '[{"id":"<seq>","description":"<step>"}] . Keep steps that still make sense, ' +
                    'reword failed ones, drop completed/unneeded ones. ' +
                    `At most ${maxSteps} steps. No markdown, no explanations.`,
            },
            {
                role: 'user',
                content: `Goal: ${req.goal.slice(0, 1500)}\n\nCurrent plan state:\n${stepsText.slice(0, 5000)}`,
            },
        ];
        const res = await this.llm!.chat(messages, { temperature: 0.2, maxTokens: 900 });
        if (res.error) return null;
        const start = res.content.indexOf('[');
        const end = res.content.lastIndexOf(']');
        if (start < 0 || end <= start) return null;
        let parsed: Array<{ id?: unknown; description?: unknown }>;
        try {
            parsed = JSON.parse(res.content.slice(start, end + 1)) as Array<{
                id?: unknown;
                description?: unknown;
            }>;
        } catch {
            return null;
        }
        const revisedSteps: ReplannedStep[] = [];
        for (const item of parsed) {
            if (typeof item.description !== 'string' || !item.description.trim()) continue;
            revisedSteps.push({
                id: typeof item.id === 'string' ? item.id : String(revisedSteps.length),
                description: item.description.trim(),
            });
            if (revisedSteps.length >= MAX_REVISED_STEPS) break;
        }
        if (revisedSteps.length === 0) return null;
        const changed = this.hasChanges(req.steps, revisedSteps);
        return { revisedSteps, rationale: 'LLM revision', changed };
    }

    private draftFallback(req: ReplanRequest, maxSteps: number): ReplanResponse {
        const open = req.steps.filter((s) => s.status === 'pending' || s.status === 'failed');
        if (open.length === 0) {
            return { revisedSteps: [], rationale: 'no open steps', changed: false };
        }
        const revisedSteps: ReplannedStep[] = [];
        for (const s of open) {
            if (s.status === 'failed') {
                revisedSteps.push({
                    id: `${s.id}-revised`,
                    description: `[revised] ${s.description}`,
                });
            } else {
                revisedSteps.push({ id: s.id, description: s.description });
            }
            if (revisedSteps.length >= maxSteps) break;
        }
        if (revisedSteps.length === 0) {
            return { revisedSteps: [], rationale: 'nothing to revise', changed: false };
        }
        const changed = this.hasChanges(req.steps, revisedSteps);
        return {
            revisedSteps,
            rationale: 'deterministic revision (failed steps reworded)',
            changed,
        };
    }

    private hasChanges(prev: ReplanRequest['steps'], next: ReplannedStep[]): boolean {
        if (prev.length !== next.length) return true;
        for (let i = 0; i < next.length; i++) {
            if (prev[i]?.description !== next[i]!.description) return true;
        }
        return false;
    }
}
