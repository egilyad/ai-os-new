/**
 * AgentforceService — I.1 (topics + reasoning transcript + trust check).
 *
 * A topic binds label/instructions/actions. `run()` thinks aloud through
 * ReasoningService, gates every action through GovernanceService.evaluate,
 * executes allowed actions via ToolRunner, and returns the full transcript.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { IReasoningService } from '../../contracts/rivals3';
import type { IGovernanceService } from '../../contracts/trust';
import type { IToolRunnerService } from '../../contracts/parity';
import type { IAgentforceService } from '../../contracts/rivals4';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Agentforce');

interface ForceTopic {
    id: string;
    label: string;
    instructions: string;
    actions: string[];
}

export class AgentforceService implements IAgentforceService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private reasoning?: IReasoningService,
        private governance?: IGovernanceService,
        private tools?: IToolRunnerService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Agentforce', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async defineTopic(input: { label: string; instructions: string; actions?: string[] }): Promise<string> {
        const topic: ForceTopic = {
            id: genId('ftopic'),
            label: input.label.slice(0, 120),
            instructions: input.instructions.slice(0, 2000),
            actions: input.actions ?? [],
        };
        await this.dal.kv.set(`force/${topic.id}`, topic);
        return topic.id;
    }

    async run(topicId: string, request: string): Promise<{ transcript: string; result: string }> {
        const topic = await this.dal.kv.get<ForceTopic>(`force/${topicId}`);
        if (!topic) throw new Error(`Topic not found: ${topicId}`);
        const lines: string[] = [`[topic: ${topic.label}]`, `[request]: ${request.slice(0, 300)}`];

        const thinking = this.reasoning
            ? await this.reasoning.think(`${topic.instructions}\nRequest: ${request}`).catch((e) => ({
                goal: request,
                steps: [] as string[],
                risks: [e instanceof Error ? e.message : String(e)],
            }))
            : { goal: request, steps: [`Handle: ${request.slice(0, 160)}`], risks: [] as string[] };
        lines.push(`[reasoning]: goal=${thinking.goal.slice(0, 200)}`);
        for (const s of thinking.steps) lines.push(`  step: ${s.slice(0, 200)}`);
        for (const r of thinking.risks) lines.push(`  risk: ${r.slice(0, 200)}`);

        const results: string[] = [];
        for (const action of topic.actions.slice(0, 6)) {
            // Trust Layer: every action is policy-checked first.
            if (this.governance) {
                const verdict = await this.governance.evaluate({ action: 'tool:call', subject: `agentforce:${topicId}` });
                if (verdict.decision === 'deny') {
                    lines.push(`[trust]: action ${action} DENIED by ${verdict.ruleId ?? 'policy'}`);
                    continue;
                }
                if (verdict.decision === 'require_hitl') {
                    lines.push(`[trust]: action ${action} needs approval — skipped (unattended run)`);
                    continue;
                }
            }
            if (!this.tools) {
                lines.push(`[act]: ${action} (no tool runner)`);
                continue;
            }
            try {
                const out = await this.tools.callTool(`agentforce:${topicId}`, action, { request });
                results.push(out.slice(0, 1000));
                lines.push(`[act]: ${action} → ok`);
            } catch (e) {
                lines.push(`[act]: ${action} FAILED (${e instanceof Error ? e.message : String(e)})`);
            }
        }
        const result = results.length > 0 ? results.join('\n---\n').slice(0, 4000) : '(no actions produced output)';
        lines.push(`[result]: ${result.slice(0, 300)}`);
        this.events.emit(EVENTS.FORCE_RUN, { topicId, actions: results.length });
        return { transcript: lines.join('\n'), result };
    }
}
