import type { ILifecycle } from './lifecycle';
import type { KnowledgeSource, TrainGuide } from '../types/parity-types';

export type { KnowledgeSource, TrainGuide } from '../types/parity-types';

export interface ToolRunResult {
    output: string;
    toolCalls: string[];
    rounds: number;
}

/**
 * GAP E.2 — real tool execution with an agentic loop.
 * Policy-gated (ToolGovernance), workspace/MCP delegates, no raw eval.
 */
export interface IToolRunnerService extends ILifecycle {
    listTools(): Array<{ name: string; description: string }>;
    /** F.2 — external packs (Letta memory tools, toolkits) register here. */
    addTool(def: {
        name: string;
        description: string;
        parameters?: Record<string, unknown>;
        run: (args: Record<string, unknown>) => Promise<string>;
    }): void;
    callTool(agentId: string, name: string, args?: Record<string, unknown>): Promise<string>;
    runWithTools(
        prompt: string,
        opts?: { agentId?: string; system?: string; maxRounds?: number; model?: string },
    ): Promise<ToolRunResult>;
}

/** GAP E.3 — embedding boundary (provider wiring lands separately). */
export interface IEmbeddingPort {
    embed(texts: string[]): Promise<number[][]>;
}

/** GAP E.2 — Knowledge RAG (url/text sources, chunked, cited). */
export interface IKnowledgeService extends ILifecycle {
    addSource(input: { kind: 'url' | 'text'; title: string; uri?: string; content?: string }): Promise<KnowledgeSource>;
    listSources(): Promise<KnowledgeSource[]>;
    removeSource(id: string): Promise<void>;
    retrieve(query: string, limit?: number): Promise<Array<{ sourceId: string; title: string; chunk: string }>>;
    /** GAP E.3 — attach embeddings to blend vector + token scores. */
    setEmbedder(embedder: IEmbeddingPort): void;
}

/** GAP E.3 — crew training guides (CrewAI `train` analogue). */
export interface ITrainingService extends ILifecycle {
    recordFeedback(role: string, feedback: string, quality?: number): Promise<TrainGuide>;
    guideFor(role: string): Promise<string>;
    listGuides(): Promise<TrainGuide[]>;
    clearGuide(role: string): Promise<void>;
}
