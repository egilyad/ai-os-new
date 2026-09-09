import { DebateConsensusEngine } from './debate-consensus';
import { DebateTimeline } from './debate-timeline';
import { DebateConclusionEngine } from './debate-conclusion-engine';
import { createDebateOrchestrator } from './index';
import type { IDebateOrchestrator } from '../../contracts/debate-runtime';
import { DebateTopologyService } from './debate-topology';

/**
 * Context for a single debate session, encapsulating per-session state.
 */
export class DebateSessionContext {
    readonly consensus: DebateConsensusEngine;
    readonly timeline: DebateTimeline;
    readonly orchestrator: IDebateOrchestrator;
    readonly conclusionEngine: DebateConclusionEngine;

    constructor(
        llmCall: (prompt: string) => Promise<string>,
        consensus?: DebateConsensusEngine,
        timeline?: DebateTimeline,
        orchestrator?: IDebateOrchestrator,
    ) {
        this.consensus = consensus ?? new DebateConsensusEngine();
        this.timeline = timeline ?? new DebateTimeline();
        this.orchestrator = orchestrator ?? createDebateOrchestrator(new DebateTopologyService());
        this.conclusionEngine = new DebateConclusionEngine(llmCall);
    }

    destroy(): void {
        this.consensus.destroy();
        this.timeline.destroy();
        this.orchestrator.destroy();
        this.conclusionEngine.destroy();
    }
}
