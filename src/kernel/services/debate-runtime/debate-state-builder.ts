import type { DebateArgument } from '../../contracts/debate-types';
import { DEFAULT_DEBATE_LANGUAGE } from '../config-registry';

export interface ClaimEntry {
    agentName: string;
    role: string;
    text: string;
    round: number;
}

export interface DebateRoundState {
    round: number;
    claims: ClaimEntry[];
    participants: string[];
}

export interface DebateState {
    rounds: DebateRoundState[];
    allClaims: ClaimEntry[];
    currentClaims: ClaimEntry[];
    previousClaims: ClaimEntry[];
    repeatedByAgent: Map<string, string[]>;
    resolvedClaims: ClaimEntry[];
}

function extractClaims(arg: DebateArgument): string[] {
    return arg.content
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 20 && !s.startsWith('[') && !s.startsWith('('));
}

function normalizeClaim(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-zа-яё0-9\s]/g, '')
        .trim();
}

// Maximum rounds to include in context — limits token burst for strict TPM providers (Groq, etc.)
const MAX_CONTEXT_ROUNDS = 5;
// Maximum claims per agent per round to prevent context explosion
const MAX_CLAIMS_PER_AGENT_PER_ROUND = 5;

export function buildDebateState(args: DebateArgument[], currentAgentId: string): DebateState {
    const byRound = new Map<number, DebateArgument[]>();
    for (const a of args) {
        const r = byRound.get(a.round) || [];
        r.push(a);
        byRound.set(a.round, r);
    }
    const roundNumbers = [...byRound.keys()].sort((a, b) => a - b);
    const currentRound = roundNumbers[roundNumbers.length - 1]!;
    const previousRound = roundNumbers.length >= 2 ? roundNumbers[roundNumbers.length - 2]! : -1;

    // Only include the last MAX_CONTEXT_ROUNDS rounds to limit token burst
    const recentRoundNumbers = roundNumbers.slice(-MAX_CONTEXT_ROUNDS);

    const rounds: DebateRoundState[] = recentRoundNumbers.map((r) => {
        const raws = byRound.get(r)!;
        const claims: ClaimEntry[] = [];
        for (const raw of raws) {
            const texts = extractClaims(raw).slice(0, MAX_CLAIMS_PER_AGENT_PER_ROUND);
            for (const t of texts) {
                claims.push({ agentName: raw.agentName, role: raw.position, text: t, round: r });
            }
        }
        return { round: r, claims, participants: [...new Set(raws.map((a) => a.agentName))] };
    });

    const allClaims = rounds.flatMap((r) => r.claims);
    const currentClaims =
        currentRound >= 0 ? (rounds.find((r) => r.round === currentRound)?.claims ?? []) : [];
    const previousClaims =
        previousRound >= 0 ? (rounds.find((r) => r.round === previousRound)?.claims ?? []) : [];

    // Detect what the current agent already said in prior rounds
    const repeatedByAgent = new Map<string, string[]>();
    const agentPriorClaims = allClaims.filter(
        (c) => c.agentName === currentAgentId && c.round < currentRound,
    );
    const agentCurrentClaimTexts = currentClaims
        .filter((c) => c.agentName === currentAgentId)
        .map((c) => normalizeClaim(c.text));

    for (const prior of agentPriorClaims) {
        for (const curText of agentCurrentClaimTexts) {
            const priorNorm = normalizeClaim(prior.text);
            const priorWords = new Set(priorNorm.split(/\s+/));
            const curWords = curText.split(/\s+/);
            const overlap = curWords.filter((w) => priorWords.has(w)).length;
            if (curWords.length > 0 && overlap / curWords.length > 0.6) {
                const list = repeatedByAgent.get(prior.agentName) || [];
                list.push(prior.text);
                repeatedByAgent.set(prior.agentName, list);
                break;
            }
        }
    }

    // Detect resolved claims: a claim is resolved when addressed by the other side in a subsequent round
    const resolvedClaims: ClaimEntry[] = [];
    for (let i = 0; i < roundNumbers.length - 1; i++) {
        const roundClaims = rounds[i]!.claims;
        const nextRoundClaims = rounds[i + 1]!.claims;
        for (const claim of roundClaims) {
            const addressed = nextRoundClaims.some(
                (c) =>
                    c.agentName !== claim.agentName &&
                    normalizeClaim(c.text).includes(normalizeClaim(claim.text).slice(0, 40)),
            );
            const notRepeated = !rounds
                .slice(i + 2)
                .some((r) =>
                    r.claims.some(
                        (c) =>
                            c.agentName === claim.agentName &&
                            normalizeClaim(c.text).includes(
                                normalizeClaim(claim.text).slice(0, 40),
                            ),
                    ),
                );
            if (addressed && notRepeated) {
                resolvedClaims.push(claim);
            }
        }
    }

    return { rounds, allClaims, currentClaims, previousClaims, repeatedByAgent, resolvedClaims };
}

const ROUND_STRATEGIES: Record<string, string> = {
    '0': 'Establish your position with concrete evidence and clear reasoning. Lay out your strongest 2-3 points.',
    '1': "Respond directly to your opponent's opening arguments. Identify specific weaknesses or gaps.",
    '2': 'Introduce a new angle or perspective not yet discussed. Avoid repeating prior points.',
    '3': "Challenge the underlying assumptions of your opponent's position.",
    '4': 'Synthesize: connect your arguments into a coherent case. Anticipate final rebuttals.',
    '5': 'Deliver your closing argument: summarize your strongest points and explain why your position prevails.',
};

export function buildDebateStatePrompt(
    state: DebateState,
    participantName: string,
    round: number,
    language = DEFAULT_DEBATE_LANGUAGE,
): string {
    const parts: string[] = [];
    const strategy = ROUND_STRATEGIES[String(Math.min(round, 5))] || ROUND_STRATEGIES['5'];

    // ── Your own previous arguments ──
    const myClaims = state.allClaims.filter((c) => c.agentName === participantName);
    if (myClaims.length > 0) {
        parts.push('### Your Previous Arguments');
        for (const c of myClaims) {
            parts.push(`- ${c.text}`);
        }
    }

    // ── Opponent's arguments ──
    const theirClaims = state.allClaims.filter((c) => c.agentName !== participantName);
    if (theirClaims.length > 0) {
        const byOpponent = new Map<string, string[]>();
        for (const c of theirClaims) {
            const list = byOpponent.get(c.agentName) || [];
            list.push(`- ${c.text}`);
            byOpponent.set(c.agentName, list);
        }
        parts.push("\n### Opponents' Arguments");
        for (const [name, claims] of byOpponent) {
            parts.push(`\n**${name}**:`);
            parts.push(claims.join('\n'));
        }
    }

    // ── Resolved points (don't re-argue) ──
    const myResolved = state.resolvedClaims.filter((c) => c.agentName === participantName);
    const theirResolved = state.resolvedClaims.filter((c) => c.agentName !== participantName);
    if (myResolved.length > 0 || theirResolved.length > 0) {
        parts.push('\n### Resolved Points');
        parts.push(
            'The following points have been addressed by both sides. Do NOT re-argue them — they are settled:',
        );
        for (const r of theirResolved) {
            parts.push(`- ${r.agentName}: ${r.text.slice(0, 100)}`);
        }
        for (const r of myResolved) {
            parts.push(`- ${r.agentName}: ${r.text.slice(0, 100)}`);
        }
    }

    // ── What's new this round ──
    if (state.currentClaims.length > 0) {
        const newContent = state.currentClaims
            .filter((c) => {
                const norm = normalizeClaim(c.text);
                return !state.previousClaims.some((p) => normalizeClaim(p.text) === norm);
            })
            .map((c) => `- [${c.agentName}]: ${c.text}`);

        if (newContent.length > 0) {
            parts.push('\n### New This Round');
            parts.push(newContent.join('\n'));
        }
    }

    // ── Unanswered counter-arguments ──
    const pending = state.previousClaims.filter((c) => {
        const addressed = state.currentClaims.some((cur) =>
            normalizeClaim(cur.text).includes(normalizeClaim(c.text).slice(0, 40)),
        );
        return !addressed;
    });
    if (pending.length > 0) {
        parts.push('\n### Unanswered Arguments');
        parts.push(
            'Your opponent made these points that you have not yet addressed. Respond to them:',
        );
        for (const p of pending) {
            parts.push(`- [${p.agentName}]: ${p.text}`);
        }
    }

    // ── Avoid repetition ──
    const repeats = state.repeatedByAgent.get(participantName);
    if (repeats && repeats.length > 0) {
        parts.push('\n### ⚠️ Detected Repetition');
        parts.push(
            'You have made these points before. Do NOT repeat them. Present new evidence or address unanswered arguments:',
        );
        for (const r of repeats) {
            parts.push(`- "${r.slice(0, 100)}..."`);
        }
    }

    parts.push(`\n### Current Strategy`);
    parts.push(strategy!);

    parts.push(`\n### Your Task (Round ${round})`);
    parts.push(
        'You are responding as ' +
            participantName +
            '. DO NOT speak for your opponents. Address their unresolved arguments directly. If all their points are answered, introduce a new angle. Respond in ' +
            language +
            '.',
    );

    return parts.join('\n');
}

export { normalizeClaim };
