/**
 * Parity domain types — GAP E.2/E.3 (tools execution, knowledge, training).
 *
 * Persistence: Dexie v32 (`knowledgeSources`, `trainGuides`).
 * Communication: EventBus (`tool:*`, `knowledge:*`, `training:*`).
 * ToolExecutor / MCPService / WorkspaceService runtimes untouched.
 */

export interface KnowledgeSource {
    id: string;
    kind: 'url' | 'text';
    title: string;
    uri?: string;
    chunks: string[];
    createdAt: number;
}

export interface TrainGuide {
    id: string;
    role: string;
    suggestions: string[];
    quality: number;
    runs: number;
    updatedAt: number;
    createdAt: number;
}
