/**
 * Repetition gate regression tests (A2/A3/B — debate repeat defects).
 *
 * - T1: history prefers full-text timeline over trimmed memory; fallback
 *   keeps legacy memory behavior when the accessor is absent/empty.
 * - T2: cross-agent duplicate is caught across a multi-turn gap
 *   (previously blind past 2 steps); empty records never match.
 * - T3: similar-but-substantively-different arguments are preserved
 *   (no false positives in either detector, thresholds untouched).
 * - T4: pre-prompt warning reaches exactly the repeating participant's
 *   context (and stays silent for others / when the flag is off).
 */
import { describe, it, expect } from 'vitest';
import {
    selectHistorySteps,
    opponentCorpusForCheck,
    DEBATE_HISTORY_WINDOW,
} from './debate-llm-caller';
import { isCrossAgentDuplicate } from './debate-llm-utils';
import { isDuplicateArgument } from './debate-duplicate-detection';
import { buildRepetitionWarningPrompt } from './debate-prompt-quality-gates';
import { buildDebateSystemContent } from './debate-llm-prompt-context';
import { DebateMemory } from './debate-memory';
import type { DebateArgument } from '../../contracts/debate-types';

let argSeq = 0;
function mkArg(content: string, agentId: string, round: number): DebateArgument {
    argSeq += 1;
    return {
        id: `arg-${argSeq}`,
        agentId,
        agentName: agentId,
        content,
        confidence: 0.7,
        timestamp: Date.now(),
        round,
        position: 'neutral',
        source: 'llm',
    };
}

const VOLT_A =
    'Voltage drops thirty five percent when using copper windings at high load temperatures in industrial motors';
const EFF_B =
    'Efficiency rises twelve percent with aluminum housing under normal operating conditions in factory equipment';

describe('selectHistorySteps (A2: no history loss)', () => {
    it('prefers full timeline texts over trimmed memory', () => {
        const memSteps = [
            { agentId: 'a', content: '' },
            { agentId: 'b', content: '' },
            { agentId: 'a', content: 'fresh turn' },
        ];
        const timeline = [
            { agentId: 'a', content: 'round one full argument about voltage regulation' },
            { agentId: 'b', content: 'round one rebuttal about measurement methods' },
            { agentId: 'a', content: 'fresh turn' },
        ];
        const out = selectHistorySteps(memSteps, timeline, 6);
        expect(out).toHaveLength(3);
        expect(out[0]?.content).toContain('voltage regulation');
        expect(out.some((s) => s.content === '')).toBe(false);
    });

    it('falls back to memory when timeline accessor is absent or empty', () => {
        const memSteps = [
            { agentId: 'a', content: 'one' },
            { agentId: 'b', content: 'two' },
        ];
        expect(selectHistorySteps(memSteps, undefined, 6)).toEqual(memSteps);
        expect(selectHistorySteps(memSteps, [], 6)).toEqual(memSteps);
        expect(selectHistorySteps(memSteps, [{ agentId: 'x', content: '   ' }], 6)).toEqual(memSteps);
    });

    it('caps at count and handles non-positive counts', () => {
        const steps = [1, 2, 3, 4].map((i) => ({ agentId: 'a', content: `s${i}` }));
        expect(selectHistorySteps(steps, undefined, 2)).toHaveLength(2);
        expect(selectHistorySteps(steps, undefined, 0)).toEqual([]);
        expect(DEBATE_HISTORY_WINDOW).toBe(6);
    });
});

describe('opponentCorpusForCheck (A3: no empty records)', () => {
    it('drops emptied records, keeps everyone else', () => {
        const corpus = opponentCorpusForCheck([
            { agentId: 'a', content: '' },
            { agentId: 'b', content: '   ' },
            { agentId: 'b', content: 'real argument' },
            { agentId: 'a', content: 'own text' },
        ]);
        expect(corpus).toHaveLength(2);
        expect(corpus.every((s) => s.content.trim().length > 0)).toBe(true);
    });
});

describe('isCrossAgentDuplicate across turns (A3)', () => {
    const opponentRound1 = {
        agentId: 'opponent',
        content:
            'Solar panel output falls twenty percent under sustained cloud cover according to field measurements taken last summer',
    };
    const filler = (tag: string) => ({ agentId: tag, content: `unrelated procedural note number ${tag} about scheduling` });

    it('catches a verbatim repeat three turns later', () => {
        const corpus = opponentCorpusForCheck([
            opponentRound1,
            filler('x1'),
            filler('x2'),
            filler('x3'),
            filler('x4'),
            { agentId: 'me', content: 'my own different line' },
        ]);
        expect(isCrossAgentDuplicate(opponentRound1.content, corpus, 'me')).toBe(true);
    });

    it('ignores empty (trimmed) records', () => {
        expect(isCrossAgentDuplicate('some fresh text here', [{ agentId: 'o', content: '' }], 'me')).toBe(false);
    });

    it('skips self matches', () => {
        expect(isCrossAgentDuplicate(opponentRound1.content, [{ ...opponentRound1, agentId: 'me' }], 'me')).toBe(false);
    });
});

describe('similar-but-different preserved (no false positives)', () => {
    it('isCrossAgentDuplicate keeps distinct electrical claims apart', () => {
        const corpus = opponentCorpusForCheck([{ agentId: 'opponent', content: VOLT_A }]);
        expect(isCrossAgentDuplicate(EFF_B, corpus, 'me')).toBe(false);
    });

    it('isDuplicateArgument keeps distinct claims apart (threshold untouched at 0.6)', () => {
        const hit = isDuplicateArgument(EFF_B, [mkArg(VOLT_A, 'opponent', 1)]);
        expect(hit.isDuplicate).toBe(false);
    });

    it('both detectors still catch true repeats (positive controls)', () => {
        const corpus = opponentCorpusForCheck([{ agentId: 'opponent', content: VOLT_A }]);
        expect(isCrossAgentDuplicate(`${VOLT_A} confirmed`, corpus, 'me')).toBe(true);
        const hit = isDuplicateArgument(VOLT_A, [mkArg(VOLT_A, 'opponent', 1)]);
        expect(hit.isDuplicate).toBe(true);
        expect(hit.match).not.toBeNull();
    });
});

describe('buildRepetitionWarningPrompt', () => {
    it('renders EN and RU variants with attribution', () => {
        const en = buildRepetitionWarningPrompt('Opponent', 2, 'English');
        expect(en).toContain('REPETITION DETECTED');
        expect(en).toContain('Opponent');
        expect(en).toContain('round 2');
        const ru = buildRepetitionWarningPrompt('Оппонент', 3, 'Russian');
        expect(ru).toContain('ПОВТОР');
        expect(ru).toContain('раунд 3');
    });
});

describe('B gate: warning reaches the repeating participant only', () => {
    function fakeSession(round = 3) {
        return {
            round,
            topic: 'Test topic',
            language: 'English',
            qualitySettings: {},
            participants: [],
        } as never;
    }

    function fakeDeps() {
        return {} as never;
    }

    function argsFor(turns: Array<{ agentId: string; content: string; round: number }>): DebateArgument[] {
        return turns.map((t) => mkArg(t.content, t.agentId, t.round));
    }

    const participants = [
        { agentId: 'agentA', role: 'pro' },
        { agentId: 'agentB', role: 'con' },
    ] as never;

    it('warns A (repeater) but not B', async () => {
        const prev = argsFor([
            {
                agentId: 'agentA',
                content:
                    'Solar panel output falls twenty percent under sustained cloud cover according to field measurements taken last summer',
                round: 1,
            },
            { agentId: 'agentB', content: EFF_B, round: 1 },
            {
                agentId: 'agentA',
                content:
                    'Solar panel output falls twenty percent under sustained cloud cover according to field measurements taken last summer season',
                round: 2,
            },
        ]);
        const mem = new DebateMemory();
        const a = await buildDebateSystemContent({
            deps: fakeDeps(),
            session: fakeSession(),
            participant: { agentId: 'agentA' } as never,
            sessionId: 's1',
            isQ: () => true,
            currentName: 'A',
            previousArguments: prev,
            allDebateParticipants: participants,
            mem,
            controller: new AbortController(),
        });
        expect(a.systemContent).toContain('REPETITION DETECTED');
        const b = await buildDebateSystemContent({
            deps: fakeDeps(),
            session: fakeSession(),
            participant: { agentId: 'agentB' } as never,
            sessionId: 's1',
            isQ: () => true,
            currentName: 'B',
            previousArguments: prev,
            allDebateParticipants: participants,
            mem,
            controller: new AbortController(),
        });
        expect(b.systemContent).not.toContain('REPETITION DETECTED');
    });

    it('stays silent when the flag is off or nothing repeats', async () => {
        const prev = argsFor([
            { agentId: 'agentA', content: VOLT_A, round: 1 },
            { agentId: 'agentB', content: EFF_B, round: 1 },
        ]);
        const mem = new DebateMemory();
        const off = await buildDebateSystemContent({
            deps: fakeDeps(),
            session: fakeSession(),
            participant: { agentId: 'agentA' } as never,
            sessionId: 's1',
            isQ: () => false,
            currentName: 'A',
            previousArguments: prev,
            allDebateParticipants: participants,
            mem,
            controller: new AbortController(),
        });
        expect(off.systemContent).not.toContain('REPETITION DETECTED');
        const clean = await buildDebateSystemContent({
            deps: fakeDeps(),
            session: fakeSession(),
            participant: { agentId: 'agentA' } as never,
            sessionId: 's1',
            isQ: () => true,
            currentName: 'A',
            previousArguments: prev,
            allDebateParticipants: participants,
            mem,
            controller: new AbortController(),
        });
        expect(clean.systemContent).not.toContain('REPETITION DETECTED');
    });
});
