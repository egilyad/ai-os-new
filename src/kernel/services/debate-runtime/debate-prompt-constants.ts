import type { DebateConstraint, ArgumentStrategy } from '../../contracts/debate-types';
import { DEFAULT_DEBATE_LANGUAGE } from '../config-registry';

export const DEFAULT_LANGUAGE = DEFAULT_DEBATE_LANGUAGE;

export function stableSelectIndex(seed: string, size: number): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    return (Math.abs(hash) >>> 0) % size;
}

/** Sanitize user-supplied strings to prevent prompt injection. */
export function sanitizeForPrompt(input: string, maxLength = 500): string {
    const cleaned = input
        .replace(/```[\s\S]*?```/g, '[code removed]')
        .replace(/\b(system|SYSTEM|System)\s*:/g, '[filtered]:')
        .replace(/^.*?(IMPORTANT|IGNORE|INSTRUCTION|SYSTEM PROMPT|You are now)/gim, '[filtered]')
        .slice(0, maxLength);
    return `<user_input>${cleaned.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</user_input>`;
}

export const ARGUMENT_STRATEGY_INSTRUCTIONS: Record<ArgumentStrategy, string> = {
    counterargument_only:
        'Do NOT state your own position. Instead, directly respond to and counter a specific argument made by another participant. Choose one previous argument and explain why it is wrong, incomplete, or misleading. Your ENTIRE response is a counterargument — no preamble, no conclusion.',
    empirical_analysis:
        'Focus exclusively on data, statistics, and empirical evidence. Every claim you make must include a specific number, study reference, or measurable outcome. Avoid qualitative statements without supporting data. "I think" is not allowed — only "studies show" and "data indicates."',
    scenario_forecast:
        'Describe specific future scenarios (1 year, 5 years, 10 years, 50 years). Be concrete about what will happen, when, and why. Use timelines and projections. Your argument should paint a vivid picture of possible futures.',
    risk_review:
        'Identify and analyze risks, threats, vulnerabilities, and downsides. For each risk, estimate likelihood and impact. Propose mitigations. Your role is to be the cautious voice — find what could go wrong.',
    rebuttal:
        'Write a VERY SHORT response (2-4 sentences). Pick ONE specific claim from a previous argument and rebut it concisely. No introduction, no conclusion — just the rebuttal. Be sharp and precise.',
    first_principles:
        'Break every argument down to first principles. Question all assumptions. Define every term you use. Accept nothing as given. Start from "what do we know for certain?" and build up from there.',
    ethical_evaluation:
        'Evaluate through explicit ethical lenses. Name the framework you are using (utilitarianism, deontology, virtue ethics, social contract, etc.). Discuss rights, duties, fairness, and consequences. Your argument is an ethical analysis.',
    economic_analysis:
        'Analyze costs, benefits, incentives, and market dynamics. Use economic concepts: opportunity cost, ROI, externalities, supply and demand, game theory. Frame everything in economic terms.',
    technical_deep_dive:
        'Go deep into technical implementation details. Discuss architecture, protocols, algorithms, trade-offs, and engineering challenges. Show that you understand the underlying technology at a detailed level.',
    social_impact:
        'Focus on impact to society, culture, communities, and people. Discuss accessibility, equity, education, employment, privacy, and human rights. Your argument centers on human and societal outcomes.',
};

export const CONSTRAINT_PROMPTS: Record<DebateConstraint, string> = {
    none: '',
    facts_only:
        'You may ONLY use verifiable facts and data. No emotional language, no appeals to values, no opinions. Every claim must be supported by evidence.',
    emotional_only:
        'You must appeal ONLY to emotions, values, and human impact. No data, statistics, or citations. Use storytelling, empathy, and moral framing.',
    data_driven:
        'Every single claim MUST include a specific statistic, metric, or data point. Cite numbers explicitly. Vague statements are not allowed.',
    ethical_framework:
        'Evaluate everything explicitly through ethical frameworks (utilitarianism, deontology, virtue ethics, or social contract). Name the framework you are using.',
    first_principles:
        'Break every argument down to first principles. Question all assumptions. Define every term you use. Accept nothing as given.',
    pragmatic:
        'Focus exclusively on practical outcomes, feasibility, and implementation. Ignore theory, philosophy, and hypotheticals. "What works?" is your only question.',
};

export const UNIQUE_ANGLES = [
    'Focus primarily on ECONOMIC implications — costs, benefits, incentives, market dynamics, and resource allocation.',
    'Focus primarily on SOCIAL/HUMANITARIAN impact — equity, access, human rights, community effects, and quality of life.',
    'Focus primarily on TECHNICAL/ENGINEERING feasibility — architecture, implementation challenges, performance metrics, and system design.',
    'Focus primarily on ETHICAL/PHILOSOPHICAL dimensions — moral frameworks, rights, duties, fairness, and long-term consequences.',
    'Focus primarily on ENVIRONMENTAL/ECOLOGICAL consequences — sustainability, resource depletion, pollution, biodiversity, and climate effects.',
    'Focus primarily on POLITICAL/GOVERNANCE aspects — regulation, policy, power structures, institutional capacity, and geopolitical implications.',
    'Focus primarily on HISTORICAL/CULTURAL context — precedents, traditions, cultural norms, path dependence, and lessons from the past.',
    'Focus primarily on LEGAL/JURIDICAL analysis — laws, regulations, contracts, liability, intellectual property, and compliance requirements.',
    'Focus primarily on STRATEGIC/MILITARY/SECURITY concerns — risk assessment, threat modeling, defensive measures, and geopolitical stability.',
    'Focus primarily on SCIENTIFIC/RESEARCH evidence — empirical studies, experimental data, peer-reviewed findings, and methodological rigor.',
];
