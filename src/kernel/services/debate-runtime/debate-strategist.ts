import type {
    IStrategist,
    StrategistPlan,
    StrategicDirective,
} from '../../contracts/debate-strategist';

const DIRECTIVE_DESCRIPTIONS: Record<StrategicDirective, string> = {
    attack: 'Identify the weakest premise in your opponent recent argument and mount a focused challenge. Do not spread your fire — concentrate on a single vulnerable point.',
    defend: 'Your last argument was challenged. Reinforce it with additional evidence or reasoning. Address the specific objection raised rather than pivoting to a new point.',
    synthesize:
        'Multiple threads of argument are converging. Identify the common theme and synthesize them into a coherent position that incorporates the strongest elements from each side.',
    clarify:
        'The debate has become muddled. Step back and clarify a key distinction or definition that the other participants are conflating. Precision here will unlock the whole discussion.',
    pivot: 'Your current line of argument is not productive. The opponent is not engaging. Shift to a different angle — a new frame, a different piece of evidence, or a fresh line of reasoning.',
    consolidate:
        'You have made several strong points in recent rounds. Do not attack further — restate your strongest case in a compact, compelling form and challenge the opponent to address it directly.',
};

const ROUND_TRANSITIONS: Record<number, StrategicDirective[]> = {
    1: ['attack', 'clarify'],
    2: ['attack', 'defend', 'clarify'],
    3: ['attack', 'defend', 'synthesize', 'pivot'],
    4: ['attack', 'defend', 'synthesize', 'consolidate'],
    5: ['attack', 'synthesize', 'pivot', 'consolidate'],
};

function getAvailableDirectives(round: number): StrategicDirective[] {
    if (round <= 1) return ['attack', 'clarify'];
    const byRound = ROUND_TRANSITIONS[round] ?? [
        'attack',
        'defend',
        'synthesize',
        'pivot',
        'consolidate',
        'clarify',
    ];
    return byRound;
}

function countAgentRecentRounds(
    agentId: string,
    history: Array<{ agentId: string; round: number }>,
): number {
    return history.filter((h) => h.agentId === agentId).length;
}

function planDirective(
    agentId: string,
    _agentRole: string,
    round: number,
    history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
): StrategistPlan {
    const available = getAvailableDirectives(round);

    // Count how many times this agent has spoken vs opponents
    const myTurns = countAgentRecentRounds(agentId, history);
    const opponentTurns = history.length - myTurns;

    // Determine which directives have been used recently by this agent
    const myRecent = history.filter((h) => h.agentId === agentId).slice(-2);
    const recentDirectives: StrategicDirective[] = ['attack'];
    const recentOpponents = history
        .filter((h) => h.agentId !== agentId)
        .map((h) => ({ agentId: h.agentId, agentName: h.agentName }));

    const used = new Set(recentDirectives);

    // Pick directive based on game state
    let directive: StrategicDirective;
    if (opponentTurns > myTurns + 1 && round >= 3) {
        // Falling behind — synthesize or consolidate
        directive = available.includes('consolidate') ? 'consolidate' : 'synthesize';
    } else if (round <= 2) {
        // Early game — attack or clarify
        directive = round === 1 ? 'clarify' : 'attack';
    } else if (myRecent.length >= 2 && round >= 4) {
        // Been talking a lot — pivot or synthesize
        directive = available.includes('pivot') ? 'pivot' : 'synthesize';
    } else {
        // Default — pick least recently used from available
        const unused = available.filter((d) => !used.has(d));
        const idx = Math.abs(
            (agentId.charCodeAt(agentId.length - 1) + round * 13) %
                (unused.length > 0 ? unused.length : available.length),
        );
        directive =
            unused.length > 0 ? unused[idx % unused.length]! : available[idx % available.length]!;
    }

    // Pick a target opponent for attack/defend
    let targetAgentId: string | undefined;
    if ((directive === 'attack' || directive === 'defend') && recentOpponents.length > 0) {
        const tgtIdx = Math.abs((agentId.charCodeAt(2) * 7 + round) % recentOpponents.length);
        targetAgentId = recentOpponents[tgtIdx % recentOpponents.length]!.agentId;
    }

    const reasoning = `Round ${round}: ${agentId} is assigned "${directive}" (agent has spoken ${myTurns} times, opponents ${opponentTurns} times)`;

    return {
        directive,
        targetAgentId,
        reasoning,
        instruction: DIRECTIVE_DESCRIPTIONS[directive],
    };
}

export class Strategist implements IStrategist {
    plan(
        agentId: string,
        agentRole: string,
        round: number,
        history: Array<{ agentId: string; agentName: string; content: string; round: number }>,
        _language: string,
    ): StrategistPlan | undefined {
        if (round < 1) return undefined;
        return planDirective(agentId, agentRole, round, history);
    }
}
