import type { TournamentBracket, TournamentMatch } from './tournament-types';

export function generateBracket(topics: string[], participantPool: string[]): TournamentBracket {
    const count = topics.length;
    const roundsNeeded = Math.ceil(Math.log2(count));
    const totalSlots = Math.pow(2, roundsNeeded);
    const paddedTopics = [...topics];
    while (paddedTopics.length < totalSlots) paddedTopics.push('(bye)');

    const shuffledParticipants = [...participantPool].sort(() => Math.random() - 0.5);
    const firstRoundMatches: TournamentMatch[] = [];
    const paired = new Set<string>();
    for (
        let i = 0;
        i < shuffledParticipants.length && firstRoundMatches.length < totalSlots / 2;
        i += 2
    ) {
        const a = shuffledParticipants[i]!;
        const b = shuffledParticipants[i + 1]!;
        if (a === b) continue;
        if (paired.has(a) || paired.has(b)) continue;
        paired.add(a);
        paired.add(b);
        const topicIdx = firstRoundMatches.length;
        const isBye = topicIdx >= paddedTopics.length || paddedTopics[topicIdx] === '(bye)';
        firstRoundMatches.push({
            id: `r0-m${firstRoundMatches.length}`,
            topic: paddedTopics[topicIdx % paddedTopics.length]!,
            participantA: { name: a, role: 'pro' },
            participantB: { name: b, role: 'con' },
            status: isBye ? 'completed' : 'pending',
            winner: isBye ? 'A' : undefined,
        });
    }

    const rounds = [{ name: 'Round 1', matches: firstRoundMatches }];
    let prevRoundMatchCount = firstRoundMatches.length;
    for (let r = 1; r < roundsNeeded; r++) {
        const matchCount = prevRoundMatchCount / 2;
        const matches: TournamentMatch[] = [];
        for (let m = 0; m < matchCount; m++) {
            matches.push({
                id: `r${r}-m${m}`,
                topic: paddedTopics[0] || 'Final Topic',
                participantA: { name: 'TBD', role: 'pro' },
                participantB: { name: 'TBD', role: 'con' },
                status: 'pending',
            });
        }
        rounds.push({ name: r === roundsNeeded - 1 ? 'Final' : `Round ${r + 1}`, matches });
        prevRoundMatchCount = matchCount;
    }

    return { title: 'Tournament Bracket', rounds };
}
