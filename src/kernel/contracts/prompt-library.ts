export interface PromptTemplate {
    id: string;
    title: string;
    content: string;
    category: string;
    tags: string[];
    variables: string[];
    createdAt: number;
    updatedAt: number;
    usageCount: number;
    isBuiltIn: boolean;
}

export const BUILT_IN_TEMPLATES: PromptTemplate[] = [
    {
        id: 'builtin-code-review',
        title: 'Code Review',
        content:
            'Review the following code for:\n1. Correctness — does it handle edge cases?\n2. Performance — any O(n²) issues?\n3. Maintainability — is it readable and well-structured?\n4. Security — any injection or validation risks?\n\n```\n{{CODE}}\n```',
        category: 'engineering',
        tags: ['code-review', 'engineering', 'best-practices'],
        variables: ['CODE'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-architecture-decision',
        title: 'Architecture Decision (ADR)',
        content:
            '# ADR: {{TITLE}}\n\n## Status\nProposed\n\n## Context\n{{CONTEXT}}\n\n## Decision\n{{DECISION}}\n\n## Consequences\n- Positive: {{POSITIVE}}\n- Negative: {{NEGATIVE}}\n\n## Alternatives Considered\n{{ALTERNATIVES}}',
        category: 'engineering',
        tags: ['adr', 'architecture', 'documentation'],
        variables: ['TITLE', 'CONTEXT', 'DECISION', 'POSITIVE', 'NEGATIVE', 'ALTERNATIVES'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-bug-analysis',
        title: 'Bug Analysis',
        content:
            '## Bug Report\n\n**Observed:** {{OBSERVED}}\n**Expected:** {{EXPECTED}}\n**Environment:** {{ENV}}\n\n## Root Cause Analysis\n{{ANALYSIS}}\n\n## Fix\n```\n{{FIX}}\n```\n\n## Verification\n{{VERIFICATION}}',
        category: 'engineering',
        tags: ['bug', 'debugging', 'root-cause'],
        variables: ['OBSERVED', 'EXPECTED', 'ENV', 'ANALYSIS', 'FIX', 'VERIFICATION'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-performance-optimization',
        title: 'Performance Optimization',
        content:
            'Analyze the performance bottleneck:\n\n**Current behavior:** {{CURRENT}}\n**Target:** {{TARGET}}\n**Context:** {{CONTEXT}}\n\nIdentify:\n1. The bottleneck location\n2. Root cause\n3. Optimization strategy (with complexity analysis)\n4. Trade-offs of the proposed change',
        category: 'engineering',
        tags: ['performance', 'optimization', 'profiling'],
        variables: ['CURRENT', 'TARGET', 'CONTEXT'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-security-audit',
        title: 'Security Audit',
        content:
            'Perform a security audit of:\n\n{{SCOPE}}\n\nCheck for:\n1. Injection vulnerabilities (SQL, XSS, command)\n2. Authentication/authorization flaws\n3. Data exposure risks\n4. Dependency vulnerabilities\n5. Rate limiting and DoS protection\n\nProvide severity ratings and remediation steps.',
        category: 'security',
        tags: ['security', 'audit', 'vulnerability'],
        variables: ['SCOPE'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-strategy-planning',
        title: 'Strategy Planning',
        content:
            'Develop a strategy for:\n\n**Goal:** {{GOAL}}\n**Current State:** {{STATE}}\n**Constraints:** {{CONSTRAINTS}}\n\nProvide:\n1. SWOT analysis\n2. 3 actionable approaches with effort/impact\n3. Recommended approach with rationale\n4. Success metrics\n5. Risk mitigation plan',
        category: 'strategy',
        tags: ['strategy', 'planning', 'swot'],
        variables: ['GOAL', 'STATE', 'CONSTRAINTS'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
    {
        id: 'builtin-research-question',
        title: 'Research Question',
        content:
            'Research the following question:\n\n**{{QUESTION}}**\n\nProvide:\n1. Key findings from multiple perspectives\n2. Evidence quality assessment\n3. Knowledge gaps\n4. Practical implications\n5. Follow-up questions generated',
        category: 'research',
        tags: ['research', 'analysis', 'knowledge'],
        variables: ['QUESTION'],
        createdAt: 0,
        updatedAt: 0,
        usageCount: 0,
        isBuiltIn: true,
    },
];
