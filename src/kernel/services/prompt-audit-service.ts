import type { ISNode } from '../contracts/topology';
import type { Role } from '../types/role-types';
import { AuditorTopology } from '../state/topology-defaults';
import {
    ARGUMENT_STRATEGY_INSTRUCTIONS,
    CONSTRAINT_PROMPTS,
} from './debate-runtime/debate-prompt-builder';
import type {
    AuditedAgentPrompt,
    AuditedStrategy,
    IPromptAuditService,
    PromptAuditSummary,
    PromptCollision,
    PromptSuggestion,
} from '../contracts/prompt-audit';

const GROUP_BY_NODE_ID: Record<string, string> = {
    'agent-pm': 'Management',
    'agent-po': 'Management',
    'agent-lead': 'Management',
    'agent-creative': 'Creative',
    'agent-designer': 'Creative',
    'agent-content': 'Creative',
    'agent-ux': 'Creative',
    'agent-critic': 'Analytical',
    'agent-data': 'Analytical',
    'agent-research': 'Analytical',
    'agent-risk': 'Analytical',
    'agent-ethics': 'Analytical',
    'agent-writer': 'Specialized',
};

const ROLE_CATEGORY_LABEL: Record<string, string> = {
    technical: 'Technical',
    analytical: 'Analytical',
    creative: 'Creative',
    management: 'Management',
    custom: 'Specialized',
};

export interface PromptAuditServiceDeps {
    getAllRoles?: () => Role[];
}

function inferGroup(node: ISNode): string {
    if (node.id.startsWith('agent-doc-')) return 'Documentation';
    return GROUP_BY_NODE_ID[node.id] || 'Technical';
}

function enrichAgent(
    base: Omit<
        AuditedAgentPrompt,
        'wordCount' | 'hasTools' | 'hasKeyTerms' | 'avgWordLen' | 'qualityScore'
    >,
): AuditedAgentPrompt {
    const words = base.prompt.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const hasTools = base.tools.length > 0;
    const hasKeyTerms = /\b(?:must|never|always|only|every|any|all|none)\b/i.test(base.prompt);
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / Math.max(1, wordCount);
    let qualityScore = 50;
    if (wordCount >= 20 && wordCount <= 80) qualityScore += 15;
    if (hasKeyTerms) qualityScore += 15;
    if (hasTools) qualityScore += 10;
    if (base.temperature >= 0.1 && base.temperature <= 0.6) qualityScore += 10;
    qualityScore = Math.min(100, qualityScore);
    return { ...base, wordCount, hasTools, hasKeyTerms, avgWordLen, qualityScore };
}

function jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size === 0 ? 0 : intersection.size / union.size;
}

function classifyStrategy(prompt: string): string {
    const lower = prompt.toLowerCase();
    if (/\b(?:audit|check|verify|validate|inspect|reject|flag)\b/.test(lower)) return 'Critical';
    if (/\b(?:analyze|evaluate|asses|measure|quantify|benchmark)\b/.test(lower))
        return 'Analytical';
    if (/\b(?:design|create|generate|craft|build|architect)\b/.test(lower)) return 'Creative';
    if (/\b(?:document|describe|explain|report|summarize|clarify)\b/.test(lower))
        return 'Documentary';
    if (/\b(?:manage|plan|coordinate|prioritize|guide|mentor)\b/.test(lower)) return 'Managerial';
    return 'General';
}

export class PromptAuditService implements IPromptAuditService {
    constructor(private deps?: PromptAuditServiceDeps) {}

    inventoryAgents(): AuditedAgentPrompt[] {
        const seen = new Set<string>();
        const agents: AuditedAgentPrompt[] = [];

        for (const node of AuditorTopology.nodes) {
            if (node.type !== 'agent' || !node.config.prompt) continue;
            seen.add(node.id);
            agents.push(
                enrichAgent({
                    id: node.id,
                    name: node.label,
                    group: inferGroup(node),
                    prompt: node.config.prompt,
                    temperature: node.config.temperature ?? 0.3,
                    tools: [...(node.config.tools || [])],
                    source: 'topology',
                }),
            );
        }

        const roles = this.deps?.getAllRoles?.() || [];
        for (const role of roles) {
            if (!role.systemPrompt || seen.has(role.id)) continue;
            agents.push(
                enrichAgent({
                    id: role.id,
                    name: role.name,
                    group:
                        ROLE_CATEGORY_LABEL[role.metadata?.category || 'custom'] || 'Specialized',
                    prompt: role.systemPrompt,
                    temperature: role.baseTemperature ?? 0.3,
                    tools: [...(role.capabilities || [])],
                    source: 'role',
                }),
            );
        }

        return agents;
    }

    inventoryStrategies(): AuditedStrategy[] {
        const strategies: AuditedStrategy[] = [];
        for (const [id, prompt] of Object.entries(ARGUMENT_STRATEGY_INSTRUCTIONS)) {
            if (!prompt) continue;
            strategies.push({
                id,
                label: id.replace(/_/g, ' '),
                prompt,
                wordCount: prompt.split(/\s+/).filter(Boolean).length,
                source: 'debate_strategy',
            });
        }
        for (const [id, prompt] of Object.entries(CONSTRAINT_PROMPTS)) {
            if (!prompt || id === 'none') continue;
            strategies.push({
                id: `constraint:${id}`,
                label: `Constraint: ${id.replace(/_/g, ' ')}`,
                prompt,
                wordCount: prompt.split(/\s+/).filter(Boolean).length,
                source: 'debate_constraint',
            });
        }
        return strategies;
    }

    findCollisions(agents: AuditedAgentPrompt[], threshold = 0.5): PromptCollision[] {
        const pairs: PromptCollision[] = [];
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const sim = jaccardSimilarity(agents[i]!.prompt, agents[j]!.prompt);
                if (sim > threshold) {
                    pairs.push({
                        a: agents[i]!.name,
                        b: agents[j]!.name,
                        similarity: Math.round(sim * 100),
                    });
                }
            }
        }
        return pairs.sort((a, b) => b.similarity - a.similarity);
    }

    computeSuggestions(agents: AuditedAgentPrompt[]): PromptSuggestion[] {
        const suggestions: PromptSuggestion[] = [];
        for (const a of agents) {
            if (a.wordCount < 20) {
                suggestions.push({
                    agent: a.name,
                    type: 'warning',
                    text: `Very short prompt (${a.wordCount} words) — may lack specificity`,
                });
            }
            if (a.wordCount > 80) {
                suggestions.push({
                    agent: a.name,
                    type: 'info',
                    text: `Very long prompt (${a.wordCount} words) — consider splitting`,
                });
            }
            if (!a.hasTools && a.group !== 'Management') {
                suggestions.push({
                    agent: a.name,
                    type: 'info',
                    text: 'No tools assigned — consider adding relevant tools',
                });
            }
            if (/\b(fix|improve|optimize)\b/i.test(a.prompt) && !a.hasKeyTerms) {
                suggestions.push({
                    agent: a.name,
                    type: 'info',
                    text: 'Uses improvement verbs without constraints — consider adding "never"/"always" guardrails',
                });
            }
            if (a.temperature > 0.7 && /\b(precise|accurate|exact|strict)\b/i.test(a.prompt)) {
                suggestions.push({
                    agent: a.name,
                    type: 'warning',
                    text: `High temp (${a.temperature}) conflicts with precision keywords`,
                });
            }
            if (a.temperature < 0.15 && /\b(creative|novel|innovate|explore)\b/i.test(a.prompt)) {
                suggestions.push({
                    agent: a.name,
                    type: 'warning',
                    text: `Low temp (${a.temperature}) conflicts with creativity keywords`,
                });
            }
        }
        return suggestions;
    }

    buildAuditReport(): PromptAuditSummary {
        const agents = this.inventoryAgents();
        const strategies = this.inventoryStrategies();
        const collisions = this.findCollisions(agents);
        const suggestions = this.computeSuggestions(agents);

        const groupCounts: Record<string, number> = {};
        const strategyCoverage: Record<string, number> = {};
        for (const a of agents) {
            groupCounts[a.group] = (groupCounts[a.group] || 0) + 1;
            const s = classifyStrategy(a.prompt);
            strategyCoverage[s] = (strategyCoverage[s] || 0) + 1;
        }

        return {
            agentCount: agents.length,
            strategyCount: strategies.length,
            avgWords: agents.length
                ? Math.round(agents.reduce((s, a) => s + a.wordCount, 0) / agents.length)
                : 0,
            withToolsCount: agents.filter((a) => a.hasTools).length,
            withKeyTermsCount: agents.filter((a) => a.hasKeyTerms).length,
            avgTemperature: agents.length
                ? agents.reduce((s, a) => s + a.temperature, 0) / agents.length
                : 0,
            strategyCoverage,
            groupCounts,
            collisions,
            suggestions,
            agents,
            strategies,
        };
    }
}
