export interface OptimizationSuggestion {
    type: 'add_constraint' | 'clarify_role' | 'add_example' | 'reduce_verbosity' | 'add_structure';
    title: string;
    description: string;
    apply: (prompt: string) => string;
}

const SUGGESTIONS: OptimizationSuggestion[] = [
    {
        type: 'add_constraint',
        title: 'Add constraints',
        description: 'Add explicit output constraints to prevent hallucination',
        apply: (p) =>
            `${p}\n\nIMPORTANT: Be concise, factual, and specific. When uncertain, state your confidence level.`,
    },
    {
        type: 'clarify_role',
        title: 'Clarify role',
        description: 'Reinforce agent role at start of prompt',
        apply: (p) => `You are an expert AI assistant specialized in your domain.\n\n${p}`,
    },
    {
        type: 'add_example',
        title: 'Add example',
        description: 'Include a structured example to guide output format',
        apply: (p) =>
            `${p}\n\nExample output format:\n- Key finding: <clear statement>\n- Evidence: <supporting data>\n- Confidence: <high/medium/low>`,
    },
    {
        type: 'reduce_verbosity',
        title: 'Reduce verbosity',
        description: 'Shorten prompt by removing redundant phrases',
        apply: (p) => {
            const removals = [
                /in order to/gi,
                /please /gi,
                /kindly /gi,
                /feel free to/gi,
                /I would like you to/gi,
                /I need you to/gi,
                /Your task is to/gi,
                /You are to /gi,
                /The goal is to /gi,
            ];
            let r = p;
            for (const pat of removals) r = r.replace(pat, '');
            return r.trim();
        },
    },
    {
        type: 'add_structure',
        title: 'Add structure',
        description: 'Organize prompt with clear sections',
        apply: (p) => {
            if (p.includes('## ')) return p;
            return `## Objective\n${p}\n\n## Constraints\n- Be concise\n- Be accurate\n- Follow the specified format`;
        },
    },
];

export class PromptOptimizer {
    analyze(
        prompt: string,
        stats: { calls?: number; errors?: number; latency?: number; tokens?: number },
    ): OptimizationSuggestion[] {
        if (!prompt || prompt.length < 10) return [];
        const suggestions: OptimizationSuggestion[] = [];

        if (prompt.length > 500) suggestions.push(SUGGESTIONS[3]!);
        if (!prompt.toLowerCase().includes('you are') && !prompt.toLowerCase().includes('expert')) {
            suggestions.push(SUGGESTIONS[1]!);
        }
        if (stats.errors && stats.calls && stats.errors / stats.calls > 0.2) {
            suggestions.push(SUGGESTIONS[0]!);
        }
        if (stats.calls && stats.calls > 10 && !prompt.includes('Example')) {
            suggestions.push(SUGGESTIONS[2]!);
        }
        if (!prompt.includes('##') && !prompt.includes('---') && prompt.length > 200) {
            suggestions.push(SUGGESTIONS[4]!);
        }

        return suggestions.slice(0, 3);
    }

    getAllSuggestions(): OptimizationSuggestion[] {
        return SUGGESTIONS;
    }
}
