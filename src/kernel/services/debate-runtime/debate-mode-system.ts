import type {
    DebateMode,
    DebateModePreset,
    PolicyType,
    ModePolicy,
} from '../../contracts/debate-mode-system';
import type { StrategyDefinition } from '../../contracts/debate-strategy-dsl';
import { safeJsonParse } from '../../../kernel/utils/safe-json';

// ── Built-in Modes ─────────────────────────────────────────────────

const BUILTIN_MODES: DebateMode[] = [
    {
        id: 'strict_logic',
        name: 'Strict Logic',
        description: 'Formal logical analysis with evidence requirements. No emotional arguments.',
        icon: 'scale',
        color: '#3b82f6',
        strategyRef: 'builtin.round_robin',
        constraint: 'facts_only',
        policies: [
            { type: 'require_evidence', value: true, description: 'All claims must cite evidence' },
            { type: 'forbid_emotion', value: true, description: 'Emotional language is flagged' },
            { type: 'require_sources', value: true, description: 'Sources must be provided' },
            { type: 'max_rounds', value: 6, description: 'Maximum 6 rounds' },
            {
                type: 'temperature_cap',
                value: 0.3,
                description: 'Low temperature for deterministic output',
            },
            {
                type: 'contradiction_penalty',
                value: 0.2,
                description: 'Contradictions reduce score by 20%',
            },
        ],
        defaultTemperature: 0.3,
        defaultMaxRounds: 6,
        tags: ['formal', 'analytical', 'evidence-based'],
    },
    {
        id: 'scientific_review',
        name: 'Scientific Review',
        description:
            'Peer review process with structured evaluation criteria. Authors vs Reviewers.',
        icon: 'microscope',
        color: '#8b5cf6',
        strategyRef: 'builtin.peer_review',
        constraint: 'data_driven',
        policies: [
            { type: 'require_evidence', value: true, description: 'Empirical evidence required' },
            { type: 'min_participants', value: 3, description: 'At least 1 author + 2 reviewers' },
            { type: 'auto_summarize', value: true, description: 'Auto-generate review summary' },
            { type: 'max_rounds', value: 4, description: '2 submission + 2 revision rounds' },
            { type: 'budget_cap_tokens', value: 50000, description: 'Token budget cap' },
        ],
        defaultTemperature: 0.4,
        defaultMaxRounds: 4,
        tags: ['academic', 'peer-review', 'structured'],
    },
    {
        id: 'brainstorming',
        name: 'Brainstorming',
        description:
            'Open creative exploration. All ideas welcome. High diversity, low constraint.',
        icon: 'lightbulb',
        color: '#f59e0b',
        constraint: 'none',
        policies: [
            { type: 'max_rounds', value: 8, description: 'Extended rounds for idea generation' },
            {
                type: 'temperature_cap',
                value: 0.9,
                description: 'High temperature for creative output',
            },
            {
                type: 'require_evidence',
                value: false,
                description: 'Evidence not required for brainstorming',
            },
            { type: 'auto_summarize', value: true, description: 'Auto-cluster ideas at the end' },
        ],
        defaultTemperature: 0.9,
        defaultMaxRounds: 8,
        tags: ['creative', 'open', 'divergent'],
    },
    {
        id: 'jury_trial',
        name: 'Jury Trial',
        description:
            'Prosecution vs Defense with jury voting. Adversarial format with structured verdict.',
        icon: 'gavel',
        color: '#ef4444',
        strategyRef: 'builtin.jury_trial',
        constraint: 'first_principles',
        policies: [
            { type: 'min_participants', value: 5, description: '2 advocates + 3 jurors minimum' },
            { type: 'require_evidence', value: true, description: 'Legal-style evidence required' },
            { type: 'max_rounds', value: 5, description: 'Opening + rebuttals + closing + vote' },
            { type: 'auto_summarize', value: true, description: 'Auto-generate verdict summary' },
        ],
        defaultTemperature: 0.5,
        defaultMaxRounds: 5,
        tags: ['adversarial', 'legal', 'voting'],
    },
    {
        id: 'socratic_inquiry',
        name: 'Socratic Inquiry',
        description: 'Question-driven exploration. Each round probes assumptions and logical gaps.',
        icon: 'question',
        color: '#06b6d4',
        strategyRef: 'builtin.socratic',
        constraint: 'first_principles',
        policies: [
            { type: 'max_rounds', value: 6, description: 'Iterative questioning rounds' },
            {
                type: 'temperature_cap',
                value: 0.5,
                description: 'Moderate temperature for focused inquiry',
            },
            { type: 'require_evidence', value: false, description: 'Questions, not assertions' },
        ],
        defaultTemperature: 0.5,
        defaultMaxRounds: 6,
        tags: ['inquiry', 'philosophical', 'questioning'],
    },
    {
        id: 'red_team',
        name: 'Red Team',
        description: 'Adversarial security review. Attacker tries to break the Defender position.',
        icon: 'shield',
        color: '#dc2626',
        constraint: 'data_driven',
        policies: [
            { type: 'max_rounds', value: 4, description: 'Attack + defense cycles' },
            {
                type: 'require_evidence',
                value: true,
                description: 'Concrete attack vectors required',
            },
            { type: 'temperature_cap', value: 0.4, description: 'Focused adversarial analysis' },
        ],
        defaultTemperature: 0.4,
        defaultMaxRounds: 4,
        tags: ['security', 'adversarial', 'stress-test'],
    },
    {
        id: 'consensus_builder',
        name: 'Consensus Builder',
        description: 'Collaborative synthesis. Agents seek agreement and common ground.',
        icon: 'handshake',
        color: '#10b981',
        constraint: 'ethical_framework',
        policies: [
            { type: 'max_rounds', value: 6, description: 'Enough rounds to converge' },
            {
                type: 'auto_summarize',
                value: true,
                description: 'Auto-generate consensus statement',
            },
            {
                type: 'contradiction_penalty',
                value: 0.1,
                description: 'Mild penalty for contradictions',
            },
            { type: 'temperature_cap', value: 0.5, description: 'Moderate temperature' },
        ],
        defaultTemperature: 0.5,
        defaultMaxRounds: 6,
        tags: ['collaborative', 'synthesis', 'agreement'],
    },
    {
        id: 'open_forum',
        name: 'Open Forum',
        description: 'Unstructured debate with minimal constraints. Agents speak freely.',
        icon: 'chat',
        color: '#6b7280',
        constraint: 'none',
        policies: [
            { type: 'max_rounds', value: 10, description: 'Extended discussion' },
            {
                type: 'temperature_cap',
                value: 0.8,
                description: 'High temperature for diverse views',
            },
            { type: 'require_evidence', value: false, description: 'No evidence requirement' },
        ],
        defaultTemperature: 0.8,
        defaultMaxRounds: 10,
        tags: ['open', 'free', 'diverse'],
    },
];

// ── Mode Manager ───────────────────────────────────────────────────

export class DebateModeManager {
    private modes = new Map<string, DebateModePreset>();

    constructor() {
        for (const mode of BUILTIN_MODES) {
            this.modes.set(mode.id, { mode, builtin: true, createdAt: Date.now() });
        }
    }

    get(id: string): DebateMode | undefined {
        return this.modes.get(id)?.mode;
    }

    list(): DebateModePreset[] {
        return [...this.modes.values()];
    }

    listBuiltin(): DebateMode[] {
        return this.list()
            .filter((p) => p.builtin)
            .map((p) => p.mode);
    }

    search(query: string): DebateMode[] {
        const q = query.toLowerCase();
        return this.list()
            .map((p) => p.mode)
            .filter(
                (m) =>
                    m.name.toLowerCase().includes(q) ||
                    m.description.toLowerCase().includes(q) ||
                    m.tags?.some((t) => t.toLowerCase().includes(q)),
            );
    }

    register(mode: DebateMode): void {
        if (this.modes.get(mode.id)?.builtin) {
            throw new Error(`Cannot overwrite builtin mode: ${mode.id}`);
        }
        this.modes.set(mode.id, { mode, builtin: false, createdAt: Date.now() });
    }

    unregister(id: string): boolean {
        const preset = this.modes.get(id);
        if (preset?.builtin) return false;
        return this.modes.delete(id);
    }

    exportJson(id: string): string | null {
        const preset = this.modes.get(id);
        if (!preset) return null;
        return JSON.stringify(preset.mode, null, 2);
    }

    importJson(json: string): { success: boolean; mode?: DebateMode; error?: string } {
        try {
            const mode = safeJsonParse(json) as DebateMode;
            if (!mode.id || !mode.name) {
                return { success: false, error: 'Mode must have id and name' };
            }
            if (this.modes.get(mode.id)?.builtin) {
                return { success: false, error: `Cannot overwrite builtin mode: ${mode.id}` };
            }
            this.register(mode);
            return { success: true, mode };
        } catch {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    getPolicy(modeId: string, policyType: PolicyType): ModePolicy | undefined {
        const mode = this.get(modeId);
        return mode?.policies.find((p) => p.type === policyType);
    }

    getPolicyValue<T extends number | boolean | string>(
        modeId: string,
        policyType: PolicyType,
        fallback: T,
    ): T {
        const policy = this.getPolicy(modeId, policyType);
        return (policy?.value as T) ?? fallback;
    }

    applyDefaults(modeId: string): {
        constraint: string;
        temperature: number;
        maxRounds: number;
        topology?: Record<string, unknown>;
    } {
        const mode = this.get(modeId);
        if (!mode) {
            return { constraint: 'none', temperature: 0.7, maxRounds: 5 };
        }
        return {
            constraint: mode.constraint,
            temperature: mode.defaultTemperature ?? 0.7,
            maxRounds: mode.defaultMaxRounds ?? 5,
            topology: mode.defaultTopology as Record<string, unknown> | undefined,
        };
    }

    resolveStrategy(
        modeId: string,
        registry: { get(id: string): StrategyDefinition | undefined },
    ): StrategyDefinition | undefined {
        const mode = this.get(modeId);
        if (!mode?.strategyRef) return undefined;
        return registry.get(mode.strategyRef);
    }

    destroy(): void {
        this.modes.clear();
    }
}
