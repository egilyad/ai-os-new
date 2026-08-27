/**
 * Service registration — phase orchestrator.
 *
 * The 686-line `registerServices()` god-function has been split into
 * six phase files.  This module runs them in dependency order:
 *
 *   0. Event Bridge     — EventBridge, ProjectionRegistry, RouterProjection
 *   1. Foundation       — settings, pricing, kernel, keyService
 *   2. Infrastructure   — rotation, policy, tool, memory, cognitive
 *   3. Debate & Runtime — debateService, debateEngine, intelligence
 *   4. Agents & Roles   — agentService, orchestrator, roleService
 *   5. Routing & LLM    — router, LLM client, cache, advisor
 *   6. High-level       — chat, workspace, probe, webhooks, etc.
 *
 *  11. Causal Debugger  — causal scope, timeline, counterfactual, replay, truth monitor
 *
 * Each phase only depends on services registered by earlier phases.
 * The container's `!has` guard inside `register()` makes re-runs
 * idempotent.
 */
import { makeHelpers } from './helpers';
import { registerPhase0 } from './phase0-event-bridge';
import { registerPhase1 } from './phase1-foundation';
import { registerPhase2 } from './phase2-infrastructure';
import { registerPhase3 } from './phase3-debate-runtime';
import { registerPhase4 } from './phase4-agents-roles';
import { registerPhase5 } from './phase5-routing-llm';
import { registerPhase6 } from './phase6-high-level';
import { registerPhase7 } from './phase7-memory-eval-metrics';
import { registerPhase8 } from './phase8-roles-consortia';
import { registerPhase9 } from './phase9-research-engine';
import { registerPhase10 } from './phase10-ecosystem';
import { registerPhase11 } from './phase11-causal-debugger';
import { registerPhase13 } from './phase13-lenses';
import { registerPhase14 } from './phase14-crystals';
import { registerPhase15 } from './phase15-junction';
import { registerPhase16 } from './phase16-synthesis';
import { registerPhase17 } from './phase17-knowledge-generator';
import { registerPhase18 } from './phase18-forum';
import { registerPhase19 } from './phase19-builder';
import { registerPhase20 } from './phase20-director';
import { registerPhase21 } from './phase21-invocation';
import { registerPhase22 } from './phase22-cost-tracker';
import type { IContainer } from '../container';
import type { IEventBus } from '../types/interfaces';

export function registerServices(
    container: IContainer,
    eventBus: IEventBus,
    registerWithLifecycle: (name: string, instance: unknown) => void,
): void {
    const ctx = { container, eventBus, registerWithLifecycle };
    const helpers = makeHelpers(ctx);

    registerPhase0(helpers, ctx);
    registerPhase1(helpers, ctx);
    registerPhase2(helpers, ctx);
    registerPhase3(helpers, ctx);
    registerPhase4(helpers, ctx);
    registerPhase5(helpers, ctx);
    registerPhase6(helpers, ctx);
    registerPhase7(helpers, ctx);
    registerPhase8(helpers, ctx);
    registerPhase9(helpers, ctx);
    registerPhase10(helpers, ctx);
    registerPhase11(helpers, ctx);
    registerPhase13(helpers, ctx);
    registerPhase14(helpers, ctx);
    registerPhase15(helpers, ctx);
    registerPhase16(helpers, ctx);
    registerPhase17(helpers, ctx);
    registerPhase18(helpers, ctx);
    registerPhase19(helpers, ctx);
    registerPhase20(helpers, ctx);
    registerPhase21(helpers, ctx);
    registerPhase22(helpers, ctx);
}

export type { PhaseContext, Phase } from './helpers';
