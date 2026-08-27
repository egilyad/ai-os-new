export interface AuditedAgentPrompt {
  id: string;
  name: string;
  group: string;
  prompt: string;
  temperature: number;
  tools: string[];
  source: 'topology' | 'role';
  wordCount: number;
  hasTools: boolean;
  hasKeyTerms: boolean;
  avgWordLen: number;
  qualityScore: number;
}

export interface AuditedStrategy {
  id: string;
  label: string;
  prompt: string;
  wordCount: number;
  source: 'debate_strategy' | 'debate_constraint';
}

export interface PromptCollision {
  a: string;
  b: string;
  similarity: number;
}

export interface PromptSuggestion {
  agent: string;
  type: 'warning' | 'info' | 'error';
  text: string;
}

export interface PromptAuditSummary {
  agentCount: number;
  strategyCount: number;
  avgWords: number;
  withToolsCount: number;
  withKeyTermsCount: number;
  avgTemperature: number;
  strategyCoverage: Record<string, number>;
  groupCounts: Record<string, number>;
  collisions: PromptCollision[];
  suggestions: PromptSuggestion[];
  agents: AuditedAgentPrompt[];
  strategies: AuditedStrategy[];
}

export interface IPromptAuditService {
  inventoryAgents(): AuditedAgentPrompt[];
  inventoryStrategies(): AuditedStrategy[];
  buildAuditReport(): PromptAuditSummary;
  findCollisions(agents: AuditedAgentPrompt[], threshold?: number): PromptCollision[];
  computeSuggestions(agents: AuditedAgentPrompt[]): PromptSuggestion[];
}
