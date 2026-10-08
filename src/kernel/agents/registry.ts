import { SreAgentDefinition } from './SreAgent';
import { ArchitectAgentDefinition } from './ArchitectAgent';
import { ResearchAgentDefinition } from './ResearchAgent';
import { NetworkAgentDefinition } from './NetworkAgent';
import { RiskAgentDefinition } from './RiskAgent';
import { DocAuditorAgentDefinition } from './DocAuditorAgent';
import { ThermodynamicsAgentDefinition } from './ThermodynamicsAgent';
import { MaterialsAgentDefinition } from './MaterialsAgent';
import { SchematicsAgentDefinition } from './SchematicsAgent';
import { AiArchitectAgentDefinition } from './AiArchitectAgent';
import { PatentAgentDefinition } from './PatentAgent';

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
    // Heterogeneous agent factories take specific deps (e.g. AdvisorServiceDeps);
    // never-param keeps the field typed without forcing a common deps shape.
    factory?: (deps: never) => unknown;
    journalHooks?: Record<string, unknown>;
}

export const AGENT_REGISTRY: Record<string, AgentDefinition> = {
    [SreAgentDefinition.metadata.id]: SreAgentDefinition as AgentDefinition,
    [ArchitectAgentDefinition.metadata.id]: ArchitectAgentDefinition as AgentDefinition,
    [ResearchAgentDefinition.metadata.id]: ResearchAgentDefinition as AgentDefinition,
    [NetworkAgentDefinition.metadata.id]: NetworkAgentDefinition as AgentDefinition,
    [RiskAgentDefinition.metadata.id]: RiskAgentDefinition as AgentDefinition,
    [DocAuditorAgentDefinition.metadata.id]: DocAuditorAgentDefinition as AgentDefinition,
    [ThermodynamicsAgentDefinition.metadata.id]:
        ThermodynamicsAgentDefinition as AgentDefinition,
    [MaterialsAgentDefinition.metadata.id]: MaterialsAgentDefinition as AgentDefinition,
    [SchematicsAgentDefinition.metadata.id]: SchematicsAgentDefinition as AgentDefinition,
    [AiArchitectAgentDefinition.metadata.id]: AiArchitectAgentDefinition as AgentDefinition,
    [PatentAgentDefinition.metadata.id]: PatentAgentDefinition as AgentDefinition,
};
