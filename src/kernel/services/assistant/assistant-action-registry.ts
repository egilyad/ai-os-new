/**
 * AssistantActionRegistry — the assistant's toolbelt.
 *
 * Actions are declarative operations over the running system. Unlike raw
 * tools they are grouped (research / navigation / work / coordination), each
 * one declares its permission class, and each one returns a *verifiable*
 * result: what was observed, not what was intended.
 *
 * The registry is the single place that turns an action into a model-facing
 * function definition, so the assistant never sees a raw service method.
 */
import type {
    AssistantAction,
    AssistantActionGroup,
    AssistantActionResult,
} from '../../contracts/assistant';
import { createAssistantUiActions, type AssistantUiActionDeps } from './assistant-actions';
import type { CapabilityTrustService } from '../capability-trust/capability-trust-service';

export class AssistantActionRegistry {
    private actions = new Map<string, AssistantAction>();
    /** Trust ledger — when present, actions are tracked as capabilities. */
    private trust: CapabilityTrustService | null = null;

    /** Attach the trust ledger and seed the already registered actions. */
    setTrustService(trust: CapabilityTrustService | null): void {
        this.trust = trust;
        for (const action of this.actions.values()) this.markDiscovered(action);
    }

    private markDiscovered(action: AssistantAction): void {
        this.trust?.discover(
            `action:${action.id}`,
            'action',
            action.id,
            [`action ${action.id} (${action.group})`],
        );
    }

    register(action: AssistantAction): void {
        if (this.actions.has(action.id)) {
            throw new Error(`Assistant action already registered: ${action.id}`);
        }
        this.actions.set(action.id, action);
        this.markDiscovered(action);
    }

    registerAll(actions: AssistantAction[]): void {
        for (const action of actions) this.register(action);
    }

    /**
     * Add or replace an action. The UI composition root uses this to attach
     * actions for capabilities it owns without colliding with the kernel's
     * placeholders.
     */
    upsert(action: AssistantAction): void {
        this.actions.set(action.id, action);
        this.markDiscovered(action);
    }

    upsertAll(actions: AssistantAction[]): void {
        for (const action of actions) this.upsert(action);
    }

    /**
     * Attach actions for capabilities the interface owns (keys, MCP, skills,
     * scheduler, tasks). The UI composition root calls this with structurally
     * typed deps, so it never imports kernel services directly.
     */
    attachUiActions(deps: AssistantUiActionDeps): void {
        this.upsertAll(createAssistantUiActions(deps));
    }

    get(id: string): AssistantAction | undefined {
        return this.actions.get(id);
    }

    list(group?: AssistantActionGroup): AssistantAction[] {
        const all = [...this.actions.values()];
        const filtered = group ? all.filter((a) => a.group === group) : all;
        return filtered.sort((a, b) => a.id.localeCompare(b.id));
    }

    groups(): Record<AssistantActionGroup, number> {
        const out: Record<AssistantActionGroup, number> = {
            research: 0,
            navigation: 0,
            work: 0,
            coordination: 0,
        };
        for (const a of this.actions.values()) out[a.group] += 1;
        return out;
    }

    /** Model-facing function definitions. */
    definitions(): Array<{
        type: 'function';
        function: {
            name: string;
            description: string;
            parameters: Record<string, unknown>;
        };
    }> {
        return this.list().map((a) => ({
            type: 'function' as const,
            function: {
                name: a.id,
                description: a.description,
                parameters: a.parameters,
            },
        }));
    }

    /**
     * Run an action. Never throws: a failure becomes a result the model can
     * react to (it may try another way).
     *
     * A successful run promotes the action to `verified` in the trust ledger —
     * that is what makes "it works" different from "it is documented".
     */
    async run(id: string, args: Record<string, unknown> = {}): Promise<AssistantActionResult> {
        const action = this.actions.get(id);
        if (!action) {
            return { ok: false, detail: `Unknown action: ${id}` };
        }
        try {
            const result = await action.run(args);
            if (result.ok) {
                this.trust?.verify(
                    `action:${id}`,
                    'action',
                    id,
                    result.evidence ? [result.evidence] : [result.detail],
                );
            }
            return result;
        } catch (e) {
            return {
                ok: false,
                detail: `Action ${id} failed: ${e instanceof Error ? e.message : String(e)}`,
            };
        }
    }
}
