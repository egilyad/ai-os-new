/**
 * Meta & Unified Memory domain types — Roadmap Phase B (Waves 8+9).
 *
 * Self-improvement loop, skill evolution, strategy library, health agents,
 * recursive decomposition; episodic/semantic/procedural/identity memory with
 * scopes + governance, counterfactuals, knowledge packages.
 *
 * Persistence: Dexie v29 (8 tables). Communication: EventBus (`meta:*`).
 * MetaLearning / Crystal Vault / LtMemory / SkillMarket runtimes untouched.
 */

export type ImprovementKind = 'prompt' | 'team' | 'skill' | 'param' | 'workflow';

export interface ImprovementProposal {
    id: string;
    kind: ImprovementKind;
    target: string;
    suggestion: string;
    confidence: number;
    status: 'proposed' | 'accepted' | 'applied' | 'rejected';
    createdAt: number;
    updatedAt: number;
}

export interface StrategyRecord {
    id: string;
    taskClass: string;
    steps: string[];
    successRate: number;
    uses: number;
    createdAt: number;
    updatedAt: number;
}

export interface DecompositionNode {
    id: string;
    goal: string;
    children: DecompositionNode[];
    assignee?: string;
    status: 'pending' | 'done' | 'failed';
}

export interface Decomposition {
    id: string;
    rootGoal: string;
    tree: DecompositionNode;
    createdAt: number;
    updatedAt: number;
}

export type HealthKind = 'degradation' | 'loop' | 'cost' | 'quality';

export interface HealthSignal {
    id: string;
    kind: HealthKind;
    source: string;
    message: string;
    severity: number;
    createdAt: number;
}

export type CogMemoryKind = 'episodic' | 'semantic' | 'procedural' | 'identity' | 'entity';

export type MemoryScope = 'private' | 'team' | 'shared';

export interface CogMemory {
    id: string;
    kind: CogMemoryKind;
    scope: MemoryScope;
    ownerId: string;
    teamId?: string;
    content: string;
    importance: number;
    accessCount: number;
    createdAt: number;
    updatedAt: number;
    lastAccessedAt?: number;
}

export interface MemoryPolicy {
    id: string;
    scope: MemoryScope;
    maxAgeMs?: number;
    maxEntries?: number;
    minImportance?: number;
    compressAfterMs?: number;
    createdAt: number;
}

export interface CounterfactualRecord {
    id: string;
    ownerId: string;
    whatHappened: string;
    whatIf: string;
    lesson: string;
    createdAt: number;
}

export interface KnowledgePackage {
    id: string;
    name: string;
    taskClass: string;
    playbook: string[];
    strategyIds: string[];
    memoryIds: string[];
    version: number;
    createdAt: number;
    updatedAt: number;
}
