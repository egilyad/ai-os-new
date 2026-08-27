/**
 * Curated canonical identities for the 25 seeded workforce agents.
 *
 * The user explicitly requested fully fleshed-out agent personas (first name,
 * last name, base role / profession, avatar, model, specializations) — these
 * are intentionally authored (not derived from ids) so every agent reads as a
 * distinct, named character across the UI. Node ids are the keys.
 *
 * Phase H — AGENT_REGISTRY is now the canonical source of static declarative
 * identity for migrated agents (agent-architect, agent-research, agent-network,
 * agent-risk, agent-doc-auditor, sre-agent). Their entries below are LEGACY
 * DUPLICATES (sre-agent has no AGENT_PROFILES entry — it is not in
 * AuditorTopology — but its Registry definition is already canonical): they
 * remain only so `AGENT_PROFILES` still covers all 25 nodes for the
 * transitional `AuditorTopology agent identity` test and for the 19 non-migrated
 * agents that have not yet been moved to `src/kernel/agents/`. For migrated
 * ids, `topology-defaults.ts:normalizeAgentIdentity` now prefers Registry and
 * never overwrites a registry-authored config with this map. After mass
 * migration, this file will be pruned to only unmigrated agents and finally
 * to a derived view `AGENT_PROFILES = fromRegistry(AGENT_REGISTRY)`.
 */

export interface CuratedAgentIdentity {
    firstName: string;
    lastName: string;
    displayName: string;
    baseRole: string;
    avatar: { emoji: string; color: string };
    provider: string;
    model: string;
    specializations: string[];
}

export const AGENT_PROFILES: Record<string, CuratedAgentIdentity> = {
    'agent-network': {
        firstName: 'Nadia',
        lastName: 'Volkov',
        displayName: 'Nadia Volkov',
        baseRole: 'Network Engineer',
        avatar: { emoji: '🌐', color: '#06b6d4' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['TCP/IP', 'SDN', 'Latency Optimization'],
    },
    'agent-risk': {
        firstName: 'Rafael',
        lastName: 'Stone',
        displayName: 'Rafael Stone',
        baseRole: 'Risk Analyst',
        avatar: { emoji: '📊', color: '#ef4444' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Risk Modeling', 'Monte Carlo', 'Compliance'],
    },
    'agent-ethics': {
        firstName: 'Elena',
        lastName: 'Marchetti',
        displayName: 'Elena Marchetti',
        baseRole: 'Ethics Officer',
        avatar: { emoji: '🛡️', color: '#a855f7' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Ethical Reasoning', 'Policy', 'Bias Audit'],
    },
    'agent-architect': {
        firstName: 'Marcus',
        lastName: 'Hale',
        displayName: 'Marcus Hale',
        baseRole: 'System Architect',
        avatar: { emoji: '🏗️', color: '#8b5cf6' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['Distributed Systems', 'Event-Driven', 'Scalability'],
    },
    'agent-security': {
        firstName: 'Yara',
        lastName: 'Haddad',
        displayName: 'Yara Haddad',
        baseRole: 'Security Engineer',
        avatar: { emoji: '🛡️', color: '#10b981' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Threat Modeling', 'AppSec', 'Zero Trust'],
    },
    'agent-devops': {
        firstName: 'Tomas',
        lastName: 'Berg',
        displayName: 'Tomas Berg',
        baseRole: 'DevOps Engineer',
        avatar: { emoji: '⚙️', color: '#f59e0b' },
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        specializations: ['CI/CD', 'Kubernetes', 'Observability'],
    },
    'agent-database': {
        firstName: 'Priya',
        lastName: 'Nair',
        displayName: 'Priya Nair',
        baseRole: 'Database Engineer',
        avatar: { emoji: '🧩', color: '#06b6d4' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['SQL Tuning', 'Replication', 'Data Modeling'],
    },
    'agent-perf': {
        firstName: 'Leon',
        lastName: 'Ortiz',
        displayName: 'Leon Ortiz',
        baseRole: 'Performance Engineer',
        avatar: { emoji: '🚀', color: '#f97316' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['Profiling', 'Caching', 'Load Testing'],
    },
    'agent-critic': {
        firstName: 'Greta',
        lastName: 'Lindqvist',
        displayName: 'Greta Lindqvist',
        baseRole: 'Critical Auditor',
        avatar: { emoji: '🔍', color: '#ec4899' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Critical Analysis', 'Fallacy Detection', 'Logic'],
    },
    'agent-data': {
        firstName: 'Sam',
        lastName: 'Okafor',
        displayName: 'Sam Okafor',
        baseRole: 'Data Scientist',
        avatar: { emoji: '🔬', color: '#14b8a6' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['Machine Learning', 'Statistics', 'Forecasting'],
    },
    'agent-research': {
        firstName: 'Mira',
        lastName: 'Castellan',
        displayName: 'Mira Castellan',
        baseRole: 'Research Analyst',
        avatar: { emoji: '🧪', color: '#6366f1' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Literature Review', 'Synthesis', 'Citations'],
    },
    'agent-quality': {
        firstName: 'Noah',
        lastName: 'Ferreira',
        displayName: 'Noah Ferreira',
        baseRole: 'Quality Engineer',
        avatar: { emoji: '🎯', color: '#10b981' },
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        specializations: ['Test Automation', 'QA', 'Coverage'],
    },
    'agent-creative': {
        firstName: 'Indira',
        lastName: 'Sun',
        displayName: 'Indira Sun',
        baseRole: 'Creative Visionary',
        avatar: { emoji: '🎨', color: '#a855f7' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Ideation', 'Narrative', 'Brand'],
    },
    'agent-designer': {
        firstName: 'Kai',
        lastName: 'Mendez',
        displayName: 'Kai Mendez',
        baseRole: 'Product Designer',
        avatar: { emoji: '🎨', color: '#ec4899' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['UX', 'Prototyping', 'Design Systems'],
    },
    'agent-content': {
        firstName: 'Lena',
        lastName: 'Petrova',
        displayName: 'Lena Petrova',
        baseRole: 'Content Strategist',
        avatar: { emoji: '📝', color: '#f59e0b' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Editorial', 'SEO', 'Messaging'],
    },
    'agent-ux': {
        firstName: 'Theo',
        lastName: 'Nakamura',
        displayName: 'Theo Nakamura',
        baseRole: 'UX Researcher',
        avatar: { emoji: '🔍', color: '#06b6d4' },
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        specializations: ['User Research', 'Usability', 'Interviews'],
    },
    'agent-pm': {
        firstName: 'Dana',
        lastName: 'Whitfield',
        displayName: 'Dana Whitfield',
        baseRole: 'Project Manager',
        avatar: { emoji: '🧩', color: '#3b82f6' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Planning', 'Agile', 'Risk'],
    },
    'agent-po': {
        firstName: 'Sofia',
        lastName: 'Romano',
        displayName: 'Sofia Romano',
        baseRole: 'Product Owner',
        avatar: { emoji: '🎯', color: '#8b5cf6' },
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        specializations: ['Backlog', 'Vision', 'Prioritization'],
    },
    'agent-lead': {
        firstName: 'Victor',
        lastName: 'Soto',
        displayName: 'Victor Soto',
        baseRole: 'Team Lead',
        avatar: { emoji: '⚡', color: '#f59e0b' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Mentoring', 'Coordination', 'Architecture'],
    },
    'agent-writer': {
        firstName: 'Clara',
        lastName: 'Bengtsson',
        displayName: 'Clara Bengtsson',
        baseRole: 'Technical Writer',
        avatar: { emoji: '📝', color: '#14b8a6' },
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        specializations: ['Documentation', 'Tutorials', 'API Docs'],
    },
    'agent-doc-architect': {
        firstName: 'Bianca',
        lastName: 'Conti',
        displayName: 'Bianca Conti',
        baseRole: 'Documentation Architect',
        avatar: { emoji: '🏛️', color: '#a855f7' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Information Architecture', 'Taxonomy', 'Standards'],
    },
    'agent-doc-auditor': {
        firstName: 'Felix',
        lastName: 'Moreau',
        displayName: 'Felix Moreau',
        baseRole: 'Documentation Auditor',
        avatar: { emoji: '🔍', color: '#ec4899' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Compliance', 'Review', 'Accuracy'],
    },
    'agent-doc-simplifier': {
        firstName: 'Maya',
        lastName: 'Lindholm',
        displayName: 'Maya Lindholm',
        baseRole: 'Documentation Simplifier',
        avatar: { emoji: '💡', color: '#10b981' },
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        specializations: ['Plain Language', 'Clarity', 'Restructure'],
    },
    'agent-doc-historian': {
        firstName: 'Oscar',
        lastName: 'Vilhelm',
        displayName: 'Oscar Vilhelm',
        baseRole: 'Documentation Historian',
        avatar: { emoji: '📚', color: '#6366f1' },
        provider: 'openrouter',
        model: 'openrouter/meta-llama/llama-3.3-70b-instruct',
        specializations: ['Changelog', 'Context', 'Lineage'],
    },
    'agent-doc-checker': {
        firstName: 'Iris',
        lastName: 'Tanaka',
        displayName: 'Iris Tanaka',
        baseRole: 'Consistency Checker',
        avatar: { emoji: '🎯', color: '#ef4444' },
        provider: 'nvidia',
        model: 'meta/llama-3.3-70b-instruct',
        specializations: ['Consistency', 'Cross-Reference', 'Validation'],
    },
};
