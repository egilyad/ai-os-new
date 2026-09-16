import { SreAgentDefinition } from './SreAgent';
import { ArchitectAgentDefinition } from './ArchitectAgent';
import { ResearchAgentDefinition } from './ResearchAgent';
import { NetworkAgentDefinition } from './NetworkAgent';
import { RiskAgentDefinition } from './RiskAgent';
import { DocAuditorAgentDefinition } from './DocAuditorAgent';

export interface AgentDefinition {
    metadata: {
        id: string;
        name: string;
        role: string;
        description: string;
        // Phase H canonical identity — optional for backward compat, present on all 6 migrated agents
        firstName?: string;
        lastName?: string;
        displayName?: string;
        baseRole?: string;
        avatar?: { emoji: string; color: string; url?: string };
        provider?: string;
        model?: string;
        specializations?: string[];
        lensIds?: string[];
    };
    persona: string;
    tools?: unknown;
    config?: Record<string, unknown>;
    factory?: (deps: any) => any;
    journalHooks?: Record<string, unknown>;
}

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
    [SreAgentDefinition.metadata.id]: SreAgentDefinition as AgentDefinition,
    [ArchitectAgentDefinition.metadata.id]: ArchitectAgentDefinition as AgentDefinition,
    [ResearchAgentDefinition.metadata.id]: ResearchAgentDefinition as AgentDefinition,
    [NetworkAgentDefinition.metadata.id]: NetworkAgentDefinition as AgentDefinition,
    [RiskAgentDefinition.metadata.id]: RiskAgentDefinition as AgentDefinition,
    [DocAuditorAgentDefinition.metadata.id]: DocAuditorAgentDefinition as AgentDefinition,
};
