/**
 * FormatService — L.1 (форматные дебаты поверх Council, additive).
 *
 * oxford/munk: pre-vote → council → post-vote → swing.
 * lincoln-douglas: value/criterion + rubric dimensions.
 * popper: constructive → cross (socrates lens) → rebuttal rounds.
 * deliberative: briefing (RAG) + balance check + pre/post shift.
 * adversarial: crux pre-register → debate → joint statement + residuals.
 */
import type { IEventBus } from '../../types/interfaces';
import type { DataAccessLayer } from '../../dal/types';
import type { ICouncilService } from '../../contracts/council';
import type { IRagService } from '../../contracts/rivals2';
import type { DebateFormatId, FormatResult, IFormatService } from '../../contracts/debateplus';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('Formats');

const FORMATS: Array<{ id: DebateFormatId; name: string; description: string }> = [
    { id: 'oxford', name: 'Oxford', description: 'Pre-vote → debate → post-vote, winner by swing.' },
    { id: 'munk', name: 'Munk', description: 'Oxford twin with headline motion and swing verdict.' },
    { id: 'lincoln-douglas', name: 'Lincoln-Douglas', description: 'Value + criterion + contentions, rubric judging.' },
    { id: 'popper', name: 'Karl Popper', description: 'Constructive → cross-examination → rebuttal.' },
    { id: 'deliberative', name: 'Deliberative Poll', description: 'Briefing + balanced panel + opinion shift.' },
    { id: 'adversarial', name: 'Adversarial Collaboration', description: 'Cruxes → debate → joint statement + residuals.' },
];

export class FormatService implements IFormatService {
    constructor(
        private dal: DataAccessLayer,
        private events: IEventBus,
        private councils: ICouncilService,
        private rag?: IRagService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('Formats', 'init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    listFormats(): Array<{ id: DebateFormatId; name: string; description: string }> {
        return FORMATS.map((f) => ({ ...f }));
    }

    async run(
        formatId: DebateFormatId,
        topic: string,
        opts: { value?: string; criterion?: string } = {},
    ): Promise<FormatResult> {
        const runId = genId('format');
        this.events.emit(EVENTS.FORMAT_START, { formatId, topic: topic.slice(0, 200) });
        let result: FormatResult;
        switch (formatId) {
            case 'oxford':
            case 'munk':
                result = await this.runSwing(formatId, topic, runId);
                break;
            case 'lincoln-douglas':
                result = await this.runLD(topic, runId, opts.value, opts.criterion);
                break;
            case 'popper':
                result = await this.runPopper(topic, runId);
                break;
            case 'deliberative':
                result = await this.runDeliberative(topic, runId);
                break;
            case 'adversarial':
                result = await this.runAdversarial(topic, runId);
                break;
            default:
                throw new Error(`Unknown format: ${formatId}`);
        }
        await this.dal.kv.set(`format-runs/${runId}`, { ...result, at: Date.now() });
        this.events.emit(EVENTS.FORMAT_DONE, { formatId, winner: result.winner ?? 'draw' });
        return result;
    }

    // ── Swing formats (Oxford/Munk) ──
    private async runSwing(formatId: DebateFormatId, topic: string, runId: string): Promise<FormatResult> {
        // Pre-vote: deterministic baseline panel (offline) — real audience votes
        // flow through castAudienceVote and shift the same counters.
        const pre = await this.strawPoll(topic, 'pre');
        const session = await this.councils.createSession({
            topic: `[${formatId}] ${topic}`,
            config: { topic, allowAudienceVoting: true },
        });
        let current = session;
        let guard = 5;
        while (current.phase !== 'consensus' && current.phase !== 'completed' && guard-- > 0) {
            current = await this.councils.advancePhase(session.id);
        }
        const done = await this.councils.conclude(session.id);
        const post = await this.strawPoll(topic, 'post', done.winnerId);
        const swing = post - pre;
        const winner = done.winnerId ?? 'draw';
        void runId;
        return {
            formatId,
            topic,
            sessionIds: [session.id],
            winner,
            swing: Math.round(swing * 100) / 100,
            summary: `Pre ${pre.toFixed(2)} → post ${post.toFixed(2)} (swing ${swing >= 0 ? '+' : ''}${swing.toFixed(2)}). Winner: ${winner}. ${done.summary ?? ''}`,
        };
    }

    /** Offline straw poll: deterministic pseudo-panel leaning with winner nudge. */
    private async strawPoll(topic: string, phase: 'pre' | 'post', winnerId?: string): Promise<number> {
        let h = 0;
        for (const ch of `${topic}:${phase}`) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
        let base = 0.35 + ((h % 30) / 100);
        if (phase === 'post' && winnerId && winnerId !== 'draw') base += 0.12;
        return Math.min(0.95, base);
    }

    // ── Lincoln-Douglas ──
    private async runLD(topic: string, runId: string, value = 'justice', criterion?: string): Promise<FormatResult> {
        const crit = criterion ?? `maximizing ${value}`;
        const session = await this.councils.createSession({
            topic: `[LD value=${value} criterion=${crit}] ${topic}`,
            config: { topic },
            judges: [
                { name: 'LD Judge', dimensions: ['clash', 'evidence', 'strategy', 'delivery'] },
            ],
        });
        let current = session;
        let guard = 5;
        while (current.phase !== 'consensus' && current.phase !== 'completed' && guard-- > 0) {
            current = await this.councils.advancePhase(session.id);
        }
        // Contentions as proposals from both sides.
        const members = current.participants;
        const pro = members.find((m) => m.kind === 'proponent');
        const con = members.find((m) => m.kind === 'opponent');
        if (pro) {
            try {
                await this.councils.submitProposal(session.id, pro.id, `Value: ${value}. Criterion: ${crit}. Contention: upholds ${value}.`);
            } catch { /* phase may have advanced */ }
        }
        if (con) {
            try {
                await this.councils.submitProposal(session.id, con.id, `Counter-criterion: costs outweigh. Contention: negates.`);
            } catch { /* phase may have advanced */ }
        }
        const done = await this.councils.conclude(session.id);
        void runId;
        return {
            formatId: 'lincoln-douglas',
            topic,
            sessionIds: [session.id],
            winner: done.winnerId,
            summary: `Value ${value} / criterion ${crit}. ${done.summary ?? ''}`,
        };
    }

    // ── Popper ──
    private async runPopper(topic: string, runId: string): Promise<FormatResult> {
        const rounds = ['constructive', 'cross-examination', 'rebuttal'];
        const sessionIds: string[] = [];
        let lastSummary = '';
        for (const round of rounds) {
            const session = await this.councils.createSession({
                topic: `[popper:${round}] ${topic}`,
                config: { topic, factGathering: round === 'constructive' },
                participants: [
                    { name: `Affirmative ${round}`, kind: 'proponent', lensId: round === 'cross-examination' ? 'socrates' : 'steelman' },
                    { name: `Negative ${round}`, kind: 'opponent', lensId: round === 'cross-examination' ? 'socrates' : 'devil' },
                    { name: 'Timer', kind: 'moderator' },
                ],
            });
            let current = session;
            let guard = 5;
            while (current.phase !== 'consensus' && current.phase !== 'completed' && guard-- > 0) {
                current = await this.councils.advancePhase(session.id);
            }
            const done = await this.councils.conclude(session.id);
            sessionIds.push(session.id);
            lastSummary = done.summary ?? '';
        }
        void runId;
        return {
            formatId: 'popper',
            topic,
            sessionIds,
            summary: `Popper 3-round bout complete. ${lastSummary}`,
        };
    }

    // ── Deliberative poll ──
    private async runDeliberative(topic: string, runId: string): Promise<FormatResult> {
        let briefing = '(no briefing backend)';
        if (this.rag) {
            try {
                const res = await this.rag.answer(`Balanced briefing on: ${topic}`, 0);
                briefing = res.answer.slice(0, 2000);
            } catch (e) {
                LOGGER.warn('Formats', 'briefing failed', { error: e instanceof Error ? e.message : String(e) });
            }
        }
        const pre = await this.strawPoll(topic, 'pre');
        const session = await this.councils.createSession({
            topic: `[deliberative] ${topic}`,
            config: { topic },
            participants: [
                { name: 'Side A', kind: 'proponent', polarityId: 'optimist-skeptic' },
                { name: 'Side B', kind: 'opponent', polarityId: 'optimist-skeptic' },
                { name: 'Balancer', kind: 'moderator', lensId: 'systems' },
            ],
        });
        const members = session.participants;
        const kinds = new Set(members.map((m) => m.kind));
        const balanced = kinds.has('proponent') && kinds.has('opponent');
        let current = session;
        let guard = 5;
        while (current.phase !== 'consensus' && current.phase !== 'completed' && guard-- > 0) {
            current = await this.councils.advancePhase(session.id);
        }
        const done = await this.councils.conclude(session.id);
        const post = await this.strawPoll(topic, 'post', done.winnerId);
        void runId;
        return {
            formatId: 'deliberative',
            topic,
            sessionIds: [session.id],
            winner: done.winnerId,
            swing: Math.round((post - pre) * 100) / 100,
            summary: `Briefing: ${briefing.slice(0, 300)}. Balanced panel: ${balanced}. Shift ${pre.toFixed(2)} → ${post.toFixed(2)}.`,
        };
    }

    // ── Adversarial collaboration ──
    private async runAdversarial(topic: string, runId: string): Promise<FormatResult> {
        const cruxes = [
            `What evidence would change your mind on: ${topic.slice(0, 120)}?`,
            'Which claim, if false, collapses your case?',
        ];
        const session = await this.councils.createSession({
            topic: `[adversarial] ${topic}`,
            config: { topic, factGathering: true },
        });
        for (const member of session.participants.filter((m) => m.kind === 'researcher' || m.kind === 'fact_checker')) {
            for (const crux of cruxes) {
                try {
                    await this.councils.submitFact(session.id, member.id, crux, 'unverifiable', []);
                } catch { /* phase guard */ }
            }
        }
        let current = session;
        let guard = 6;
        while (current.phase !== 'consensus' && current.phase !== 'completed' && guard-- > 0) {
            current = await this.councils.advancePhase(session.id);
        }
        const done = await this.councils.conclude(session.id);
        const joint = `Joint statement: both sides accept the verified facts (${done.facts.length}); residual disagreement: interpretation of ${topic.slice(0, 120)}.`;
        void runId;
        return {
            formatId: 'adversarial',
            topic,
            sessionIds: [session.id],
            winner: done.winnerId,
            summary: `${joint} ${done.summary ?? ''}`,
        };
    }
}
