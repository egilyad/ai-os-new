// ── Rhetorical Device Selector (P2.6) ────────────────────────────
// Matches rhetorical devices to agent role and round progression.

import type {
    IRhetoricalDeviceSelector,
    RhetoricalDevice,
} from '../../contracts/debate-rhetorical-device';

const DEVICES: RhetoricalDevice[] = [
    {
        id: 'socratic_irony',
        name: 'Socratic Irony',
        description: 'Feigned ignorance to expose contradictions',
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
        promptInstruction:
            "Use Socratic irony: pretend not to understand, ask naive questions that expose logical flaws in the opponent's position.",
    },
    {
        id: 'reductio',
        name: 'Reductio ad absurdum',
        description: 'Push opponent logic to absurd extreme',
        suitableRoles: ['pro', 'con'],
        minRound: 2,
        promptInstruction:
            "Use reductio ad absurdum: take the opponent's logic to its extreme conclusion to show why it cannot be correct.",
    },
    {
        id: 'anaphora',
        name: 'Anaphora',
        description: 'Repetition for rhetorical emphasis',
        suitableRoles: ['pro', 'con'],
        minRound: 3,
        promptInstruction:
            'Use anaphora: repeat a key phrase at the start of successive sentences to build rhetorical momentum and emphasis.',
    },
    {
        id: 'pathos',
        name: 'Pathos',
        description: 'Emotional appeal through concrete examples',
        suitableRoles: ['pro', 'con'],
        minRound: 1,
        promptInstruction:
            'Appeal to emotion: use a concrete human story or vivid example that illustrates the real-world impact of your position.',
    },
    {
        id: 'logos',
        name: 'Logos',
        description: 'Structured logical argument with premises',
        suitableRoles: ['neutral', 'pro', 'con'],
        minRound: 1,
        promptInstruction:
            'Build a formal logical argument: state your premises clearly, show how the conclusion follows, and invite the opponent to challenge specific premises.',
    },
    {
        id: 'analogy',
        name: 'Analogy',
        description: 'Compare to familiar domain',
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
        promptInstruction:
            'Use analogical reasoning: compare the current topic to a well-understood domain where the outcome is known, and draw parallels.',
    },
    {
        id: 'rhetorical_question',
        name: 'Rhetorical Question',
        description: 'Questions that imply their own answer',
        suitableRoles: ['pro', 'con'],
        minRound: 1,
        promptInstruction:
            'Use rhetorical questions: ask pointed questions that force the audience to draw the conclusion you want, without stating it directly.',
    },
    {
        id: 'concession_rebuttal',
        name: 'Concession & Rebuttal',
        description: 'Concede a point then reframe',
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 3,
        promptInstruction:
            'Use the concession-rebuttal pattern: concede one valid point made by the opponent, then immediately show why it is outweighed by stronger considerations.',
    },
    {
        id: 'historical_precedent',
        name: 'Historical Precedent',
        description: 'Reference to past events',
        suitableRoles: ['pro', 'con', 'neutral'],
        minRound: 2,
        promptInstruction:
            'Ground your argument in historical precedent: reference a specific historical event or pattern that supports your position.',
    },
    {
        id: 'triad',
        name: 'Rule of Three',
        description: 'Triple listing for memorability',
        suitableRoles: ['pro', 'con'],
        minRound: 3,
        promptInstruction:
            'Use the rule of three: group your key points into triples — three reasons, three examples, three consequences. This makes arguments more memorable and persuasive.',
    },
];

function selectDevices(role: string, round: number, usedIds: Set<string>): RhetoricalDevice[] {
    const roleLower = role.toLowerCase();
    const available = DEVICES.filter(
        (d) =>
            d.minRound <= round &&
            (d.suitableRoles.includes(roleLower as 'pro' | 'con' | 'neutral') ||
                roleLower === 'neutral') &&
            !usedIds.has(d.id),
    );
    if (available.length === 0) return [];

    // Select 1-2 devices deterministically based on round
    const count = round >= 4 ? 2 : 1;
    const index = (round * 7 + roleLower.length) % available.length;
    const selected = [available[index]!];
    if (count === 2 && available.length > 1) {
        const secondIndex = (index + 3 + round) % available.length;
        if (secondIndex !== index) {
            selected.push(available[secondIndex]!);
        }
    }
    return selected;
}

export class RhetoricalDeviceSelector implements IRhetoricalDeviceSelector {
    private selected = new Map<string, string>();

    getDevicePrompt(role: string, round: number, language: string): string | undefined {
        const usedIds = new Set<string>();
        const devices = selectDevices(role, round, usedIds);
        if (devices.length === 0) return undefined;

        const names = devices.map((d) => d.name).join(', ');

        // Track the primary device for this call
        const key = `${role}-r${round}`;
        this.selected.set(key, names);

        if (language.startsWith('ru')) {
            return `### Риторический приём\nИспользуй ${names} в своём ответе. ${devices.map((d) => d.promptInstruction).join(' ')}`;
        }
        return `### Rhetorical Device\nEmploy ${names} in your response. ${devices.map((d) => d.promptInstruction).join(' ')}`;
    }

    getSelectedDevice(agentId: string): string | undefined {
        return this.selected.get(agentId);
    }
}
