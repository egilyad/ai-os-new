import type {
    IAutoDebateService,
    AutoDebateOptions,
    AutoDebateResult,
    ProviderWinRate,
    BatchTestResult,
    TournamentResult,
    TournamentMatch,
} from '../../../contracts/auto-debate';
import type { IEventBus } from '../../../types/interfaces';
import { rootLogger } from '../../logger-service';
import { logMemoryStats } from '../../../utils/memory-tracker';
import type { DebateRole } from '../../../contracts/debate-types';
import { DEBATE_MODEL_PRIORITY } from '../debate-query-engine';

import { getAllSettings } from '../quality-settings-store';
import { SeededRng } from '../../../utils/seedable-rng';

const LOGGER = rootLogger.child('AutoDebateService');
import type {
    DebateArgument,
    DebateParticipant,
    DebateSession,
} from '../../../contracts/debate-types';
import type { ApiKey } from '../../../types/metrics-types';

/**
 * Select the best model for debate from available models.
 * 1. If requestedModel is explicit (not 'auto'), prefer it
 * 2. Match availableModels against provider's priority list
 * 3. Fall back to availableModels[0] or 'auto'
 */
export function pickBestModelForDebate(
    provider: string,
    availableModels: string[],
    requestedModel?: string,
    offset = 0,
): string {
    const p = provider.toLowerCase();

    if (requestedModel && requestedModel !== 'auto') {
        if (availableModels.includes(requestedModel)) return requestedModel;
    }

    const priorities = DEBATE_MODEL_PRIORITY[p];
    if (priorities) {
        for (let i = 0; i < priorities.length; i++) {
            const model = priorities[(i + offset) % priorities.length]!;
            if (availableModels.includes(model)) return model;
        }
    }

    return availableModels[0] || 'auto';
}

const TOPICS: Record<string, string[]> = {
    technology: [
        'Should AI development be regulated by governments?',
        'Is artificial general intelligence an existential risk?',
        'Should social media platforms be banned for minors?',
        'Will quantum computers break modern encryption?',
        'Are self-driving cars safer than human drivers?',
    ],
    science: [
        'Should human gene editing be allowed?',
        'Is space exploration worth the cost?',
        'Should animal testing be banned?',
        'Is nuclear energy the best solution for climate change?',
        'Should lab-grown meat replace traditional farming?',
    ],
    society: [
        'Should universal basic income be implemented globally?',
        'Is remote work better than office work?',
        'Should college education be free?',
        'Is four-day work week better than five-day?',
        'Should voting be mandatory?',
    ],
    philosophy: [
        'Can machines be truly conscious?',
        'Is objective morality possible?',
        'Is free will an illusion?',
        'Is it ethical to create superintelligent AI?',
        'Should AI have rights?',
    ],
};

const ALL_TOPICS = Object.values(TOPICS).flat();
let _rng = new SeededRng();

function pickRandom<T>(arr: T[]): T {
    return _rng.pick(arr);
}

export function resetAutoDebateRng(seed?: number): void {
    _rng = new SeededRng(seed);
}

import { genId } from '../../../../utils/gen-id';

function makeParticipantId(): string {
    return genId('auto');
}

const ROLES: DebateRole[] = ['pro', 'con', 'neutral'];
// 'paused' is included so waitForSessionCompletion detects
// paused debates immediately instead of waiting for the 60s timeout.
// Without this, a paused budget-exceeded debate stalls the auto-debate
// sequence for a full minute before the next debate can start.
const TERMINAL_SESSION_STATUSES = new Set(['completed', 'failed', 'cancelled', 'paused']);

export interface AutoDebateServiceDeps {
    keyService: {
        getKeys: () => ApiKey[];
        getActiveKeys: () => ApiKey[];
        getUniqueProviders: () => string[];
        recordUsage: (
            keyId: string,
            latency: number,
            tokens: number,
            model: string,
            extra?: Record<string, unknown>,
        ) => void;
    };
    getKeyStateStore?: () =>
        | {
              get: (keyId: string) =>
                  | {
                        flags?: {
                            authFailed?: boolean;
                            rateLimited?: boolean;
                            circuitOpen?: boolean;
                        };
                    }
                  | undefined;
          }
        | undefined;
    getAdapterRegistry?: () =>
        | {
              getProviderRuntimeStatus(provider: string): {
                  circuitOpen: boolean;
                  rateLimited: boolean;
              };
          }
        | undefined;
    debateService: {
        startDebate: (
            topic: string,
            participants: DebateParticipant[],
            strategy?: string,
            maxRounds?: number,
            config?: Partial<{
                roundDelayMs: number;
                maxTokens: number;
                temperature: number;
                useModerator: boolean;
                timeoutMs: number;
                language: string;
                qualitySettings: Record<string, boolean>;
            }>,
        ) => Promise<DebateSession>;
        clearVerdictCache?: () => void;
    };
    activeDebateStore: import('../../../contracts/debate-store').IDebateSessionStore;
    debateLiveStore: import('../../../contracts/debate-store').IDebateLiveStore;
    onSessionChange: import('../../../contracts/debate-store').SessionStoreSubscriber;
    eventBus?: IEventBus;
}

const MAX_AUTO_DEBATE_RESULTS = 100;

export class AutoDebateService implements IAutoDebateService {
    private deps: AutoDebateServiceDeps;
    private results: AutoDebateResult[] = [];
    private _abortController = new AbortController();
    private _pendingPromise: Promise<unknown> | null = null;

    constructor(deps: AutoDebateServiceDeps) {
        this.deps = deps;
    }

    private isKeyHealthy(key: ApiKey): boolean {
        const keyState = this.deps.getKeyStateStore?.()?.get(key.id);
        if (
            keyState?.flags?.authFailed ||
            keyState?.flags?.rateLimited ||
            keyState?.flags?.circuitOpen
        ) {
            return false;
        }

        const runtimeStatus = this.deps
            .getAdapterRegistry?.()
            ?.getProviderRuntimeStatus(key.provider);
        if (runtimeStatus?.circuitOpen || runtimeStatus?.rateLimited) {
            return false;
        }

        return true;
    }

    /** Create debate participants from active API keys */
    createParticipants(max?: number): DebateParticipant[] {
        const keys = this.deps.keyService.getActiveKeys().filter((key) => this.isKeyHealthy(key));
        if (!keys.length) return [];

        const selected = max && max < keys.length ? keys.slice(0, max) : keys;
        const providerOffsets: Record<string, number> = {};
        const participants: DebateParticipant[] = selected.map((key, i) => {
            const role = ROLES[i % ROLES.length]!;
            const systemPrompts: Partial<Record<DebateRole, string>> = {
                pro: `You are "Pro-${key.label ?? key.provider}". Argue in favour of the topic. Use evidence, logic, and persuasive rhetoric. Be concise but thorough.`,
                con: `You are "Con-${key.label ?? key.provider}". Argue against the topic. Use evidence, logic, and persuasive rhetoric. Be concise but thorough.`,
                neutral: `You are "Neutral-${key.label ?? key.provider}". Analyse both sides objectively. Identify strengths and weaknesses. Do not take a side. Be concise and balanced.`,
            };
            const offset = providerOffsets[key.provider] ?? 0;
            providerOffsets[key.provider] = offset + 1;
            const modelId = pickBestModelForDebate(
                key.provider,
                key.availableModels ?? [],
                undefined,
                offset,
            );
            return {
                id: makeParticipantId(),
                name: `${key.label ?? key.provider}-${role}`,
                role,
                systemPrompt: systemPrompts[role] ?? '',
                provider: key.provider,
                modelId,
            };
        });

        LOGGER.debug('AutoDebateService', 'Debate models resolved', {
            participants: participants.map((p) => ({
                id: p.id.slice(0, 8),
                name: p.name,
                provider: p.provider,
                model: p.modelId,
            })),
        });

        return participants;
    }

    /** Pick a random topic, optionally filtered by category */
    pickTopic(category?: string): string {
        if (category && TOPICS[category]) return pickRandom(TOPICS[category]);
        return pickRandom(ALL_TOPICS);
    }

    private waitForSessionCompletion(
        session: DebateSession,
        timeoutMs = 60_000,
        signal?: AbortSignal,
    ): Promise<DebateSession> {
        if (TERMINAL_SESSION_STATUSES.has(session.status)) return Promise.resolve(session);
        if (signal?.aborted) return Promise.resolve(session);
        // M-4: use Zustand subscribe instead of polling to avoid race with concurrent runAutoDebate
        return new Promise((resolve) => {
            const unsub = this.deps.onSessionChange((state) => {
                if (signal?.aborted) {
                    unsub();
                    clearTimeout(timer);
                    resolve(structuredClone(session));
                    return;
                }
                if (
                    state.session?.id === session.id &&
                    TERMINAL_SESSION_STATUSES.has(state.session.status)
                ) {
                    unsub();
                    clearTimeout(timer);
                    resolve(structuredClone(state.session));
                }
            });
            const timer = setTimeout(() => {
                unsub();
                if (signal?.aborted) {
                    resolve(structuredClone(session));
                    return;
                }
                const final = this.deps.activeDebateStore.session;
                if (final && final.id === session.id && TERMINAL_SESSION_STATUSES.has(final.status))
                    resolve(structuredClone(final));
                else resolve(session);
            }, timeoutMs);
        });
    }

    async runAutoDebate(options: AutoDebateOptions = {}): Promise<AutoDebateResult> {
        if (this._abortController.signal.aborted)
            return {
                id: '',
                timestamp: 0,
                topic: '',
                strategy: '',
                maxRounds: 0,
                participants: [],
                session: null,
                durationMs: 0,
                completed: false,
                error: 'Service destroyed',
            } as AutoDebateResult;
        const start = Date.now();
        const topic = options.topic ?? this.pickTopic(options.category);
        const participants =
            options.participants ?? this.createParticipants(options.maxParticipants);

        if (!participants.length) {
            return {
                id: makeParticipantId(),
                timestamp: start,
                topic,
                strategy: options.strategy ?? 'round_robin',
                maxRounds: options.maxRounds ?? 3,
                participants: [],
                session: null,
                durationMs: 0,
                completed: false,
                error: 'No active API keys available. Add keys first.',
            };
        }

        try {
            const initialSession = await this.deps.debateService.startDebate(
                topic,
                participants,
                options.strategy ?? 'round_robin',
                options.maxRounds ?? 3,
                {
                    temperature: 0.7,
                    maxTokens: 1024,
                    roundDelayMs: 100,
                    useModerator: true,
                    timeoutMs: 30000,
                    language: 'ru',
                    qualitySettings: getAllSettings(),
                },
            );
            const session = await this.waitForSessionCompletion(initialSession);

            const result: AutoDebateResult = {
                id: makeParticipantId(),
                timestamp: start,
                topic,
                strategy: options.strategy ?? 'round_robin',
                maxRounds: options.maxRounds ?? 3,
                participants: participants.map((p) => ({
                    id: p.id,
                    name: p.name,
                    provider: p.provider ?? 'unknown',
                    role: p.role,
                })),
                session,
                durationMs: Date.now() - start,
                completed: session.status === 'completed',
            };
            this.results.push(result);
            if (this.results.length > MAX_AUTO_DEBATE_RESULTS)
                this.results = this.results.slice(-MAX_AUTO_DEBATE_RESULTS);
            return result;
        } catch (e) {
            const result: AutoDebateResult = {
                id: makeParticipantId(),
                timestamp: start,
                topic,
                strategy: options.strategy ?? 'round_robin',
                maxRounds: options.maxRounds ?? 3,
                participants: participants.map((p) => ({
                    id: p.id,
                    name: p.name,
                    provider: p.provider ?? 'unknown',
                    role: p.role,
                })),
                session: null,
                durationMs: Date.now() - start,
                completed: false,
                error: e instanceof Error ? e.message : String(e),
            };
            this.results.push(result);
            if (this.results.length > MAX_AUTO_DEBATE_RESULTS)
                this.results = this.results.slice(-MAX_AUTO_DEBATE_RESULTS);
            return result;
        }
    }

    /** One-click random debate */
    async runQuickTest(): Promise<AutoDebateResult> {
        return this.runAutoDebate({});
    }

    /** Run N debates sequentially */
    async stressTest(count = 5): Promise<AutoDebateResult[]> {
        const out: AutoDebateResult[] = [];
        for (let i = 0; i < count; i++) {
            const r = await this.runAutoDebate({});
            out.push(r);
        }
        return out;
    }

    /** Same topic N times for A/B comparison */
    async batchTest(topic: string, runs = 3): Promise<BatchTestResult> {
        const results: AutoDebateResult[] = [];
        for (let i = 0; i < runs; i++) {
            const r = await this.runAutoDebate({ topic });
            results.push(r);
        }
        return { topic, runs, results, winRates: this.computeWinRates(results) };
    }

    async runTournament(topic: string, participantCount = 6): Promise<TournamentResult> {
        // Clear all Zustand debate store state from any previous runs
        this.deps.debateLiveStore.clearAll();
        this.deps.activeDebateStore.clearAll();

        const start = Date.now();
        const allParticipants = this.createParticipants(participantCount);
        const names = allParticipants.map((p) => p.name);
        if (names.length < 2)
            return {
                id: makeParticipantId(),
                topic,
                participants: names,
                matches: [],
                rankings: [],
                completed: false,
                timestamp: start,
                durationMs: 0,
            };

        const pairs: { a: number; b: number }[] = [];
        for (let i = 0; i < names.length; i++) {
            for (let j = i + 1; j < names.length; j++) {
                pairs.push({ a: i, b: j });
            }
        }

        const matches: TournamentMatch[] = [];

        for (let m = 0; m < pairs.length; m++) {
            const { a, b } = pairs[m]!;
            const pA = allParticipants[a]!;
            const pB = allParticipants[b]!;
            const pairStart = Date.now();

            const pro: DebateParticipant = {
                ...pA,
                role: 'pro' as const,
                systemPrompt: `You are "Pro-${pA.name}". Argue FOR the topic. Use evidence and logic.`,
            };
            const con: DebateParticipant = {
                ...pB,
                role: 'con' as const,
                systemPrompt: `You are "Con-${pB.name}". Argue AGAINST the topic. Use evidence and logic.`,
            };

            const matchScoring = async (): Promise<TournamentMatch> => {
                const initialSession = await this.deps.debateService.startDebate(
                    topic,
                    [pro, con],
                    'round_robin',
                    2,
                    {
                        temperature: 0.7,
                        maxTokens: 256,
                        roundDelayMs: 50,
                        useModerator: true,
                        timeoutMs: 20000,
                        language: 'ru',
                        qualitySettings: getAllSettings(),
                    },
                );
                const session = await this.waitForSessionCompletion(
                    initialSession,
                    60_000,
                    this._abortController.signal,
                );

                // Clean up store data + verdict cache to prevent memory leak
                this.deps.debateService.clearVerdictCache?.();
                this.deps.debateLiveStore.clearSession(session.id);
                this.deps.activeDebateStore.clearAll();

                const proArgs = session.arguments.filter(
                    (a) =>
                        a.agentId.toLowerCase() === pA.id.toLowerCase() ||
                        a.agentName.toLowerCase() === pA.name.toLowerCase(),
                );
                const conArgs = session.arguments.filter(
                    (a) =>
                        a.agentId.toLowerCase() === pB.id.toLowerCase() ||
                        a.agentName.toLowerCase() === pB.name.toLowerCase(),
                );
                const proScore = scoreParticipant(proArgs);
                const conScore = scoreParticipant(conArgs);
                // Break reference chain to argument content after scoring.
                // This lets V8 reclaim LLM response strings before finalizeInternal()
                // strips the active session's arguments in a later microtask.
                session.arguments = [];

                return {
                    pairId: `match-${m}`,
                    participantA: pA.name,
                    participantB: pB.name,
                    topic,
                    winner: proScore > conScore ? pA.name : conScore > proScore ? pB.name : null,
                    draw: proScore === conScore,
                    completed: session.status === 'completed',
                    sessionStatus: session.status,
                    durationMs: Date.now() - pairStart,
                };
            };

            try {
                const matchResult = await matchScoring();
                matches.push(matchResult);
                LOGGER.info('AutoDebateService', `Match ${m + 1}/${pairs.length} OK`, {
                    a: pA.name,
                    b: pB.name,
                    durationMs: Date.now() - pairStart,
                });
                // GC-friendly delay between matches — session objects are now
                // out of scope, so V8 can reclaim LLM response chains, decorator
                // wrappers, and argument content from the completed match.
                // 3s was insufficient for full GC sweep → increased to 10s.
                // Also allocate+freed a large buffer to encourage V8 memory pressure GC.
                try {
                    const gcHint = new ArrayBuffer(64 * 1024 * 1024);
                    gcHint.toString();
                } catch {
                    /* best-effort GC hint */
                }
                await new Promise((r) => setTimeout(r, 10000));
            } catch (e) {
                matches.push({
                    pairId: `match-${m}`,
                    participantA: pA.name,
                    participantB: pB.name,
                    topic,
                    winner: null,
                    draw: false,
                    completed: false,
                    durationMs: Date.now() - pairStart,
                    error: e instanceof Error ? e.message : String(e),
                });
                LOGGER.info('AutoDebateService', `Match ${m + 1}/${pairs.length} FAILED`, {
                    a: pA.name,
                    b: pB.name,
                    error: e instanceof Error ? e.message : String(e),
                    durationMs: Date.now() - pairStart,
                });
            }
            const liveState = this.deps.debateLiveStore;
            const streamingMapsSize =
                liveState.streamingContent.size +
                liveState.emotions.size +
                liveState.agentCountdowns.size +
                liveState.agentAddressing.size +
                liveState.memoryBubbles.size +
                liveState.currentThinking.size;
            const ebStats = this.deps.eventBus?.getSubscriptionStats();
            logMemoryStats(`TournamentMatch${m + 1}`, undefined, undefined, {
                embeddingChunks: 0,
                policyRules: 0,
                policyFirings: 0,
                modeVersions: 0,
                strategyVersions: 0,
                eventBusListeners: ebStats?.totalCallbacks ?? 0,
                completedSessions: 0,
                liveStoreAgentEvents: liveState.agentEvents.length,
                liveStoreRoundEvents: liveState.roundEvents.length,
                liveStoreStreamingMaps: streamingMapsSize,
                activeDebateSession: this.deps.activeDebateStore.session ? 1 : 0,
            });
        }

        const results = new Map<string, { wins: number; losses: number }>();
        for (const n of names) results.set(n, { wins: 0, losses: 0 });
        for (const m of matches) {
            if (m.winner) {
                const w = results.get(m.winner);
                if (w) w.wins++;
                const loser = m.winner === m.participantA ? m.participantB : m.participantA;
                const l = results.get(loser);
                if (l) l.losses++;
            }
        }

        const rankings = Array.from(results.entries())
            .map(([name, r]) => ({
                name,
                wins: r.wins,
                losses: r.losses,
                score: r.wins - r.losses,
            }))
            .sort((a, b) => b.score - a.score || b.wins - a.wins);

        return {
            id: makeParticipantId(),
            topic,
            participants: names,
            matches,
            rankings,
            completed: true,
            timestamp: start,
            durationMs: Date.now() - start,
        };
    }

    getResults(): AutoDebateResult[] {
        return [...this.results];
    }

    getWinRates(): ProviderWinRate[] {
        return this.computeWinRates(this.results);
    }

    clearResults(): void {
        this.results = [];
    }

    /** Analyse win-rates per provider from auto-debate results */
    private computeWinRates(results: AutoDebateResult[]): ProviderWinRate[] {
        const map = new Map<
            string,
            {
                debates: number;
                wins: number;
                tokens: number[];
                latencies: number[];
                costs: number[];
            }
        >();

        for (const r of results) {
            if (!r.completed || !r.session) continue;

            for (const p of r.participants) {
                const entry = map.get(p.provider) ?? {
                    debates: 0,
                    wins: 0,
                    tokens: [],
                    latencies: [],
                    costs: [],
                };
                entry.debates++;

                const session = r.session!;
                const participantArgs = session.arguments.filter(
                    (a) =>
                        a.agentName.toLowerCase() === p.name.toLowerCase() ||
                        a.agentId.toLowerCase() === p.name.toLowerCase(),
                );
                const opponentArgs = session.arguments.filter(
                    (a) =>
                        a.agentName.toLowerCase() !== p.name.toLowerCase() &&
                        a.agentId.toLowerCase() !== p.name.toLowerCase(),
                );
                const isWinner =
                    participantArgs.length > 0 &&
                    scoreParticipant(participantArgs) > scoreParticipant(opponentArgs);

                if (isWinner) entry.wins++;
                map.set(p.provider, entry);
            }
        }

        return Array.from(map.entries())
            .map(([provider, d]) => ({
                provider,
                debates: d.debates,
                wins: d.wins,
                losses: d.debates - d.wins,
                winRate: d.debates > 0 ? d.wins / d.debates : 0,
                avgTokens: d.tokens.length
                    ? d.tokens.reduce((a, b) => a + b, 0) / d.tokens.length
                    : 0,
                avgLatency: d.latencies.length
                    ? d.latencies.reduce((a, b) => a + b, 0) / d.latencies.length
                    : 0,
                avgCost: d.costs.length ? d.costs.reduce((a, b) => a + b, 0) / d.costs.length : 0,
            }))
            .sort((a, b) => b.winRate - a.winRate);
    }

    async destroy(): Promise<void> {
        this._abortController.abort();
        if (this._pendingPromise) {
            await Promise.race([
                this._pendingPromise,
                new Promise<void>((r) => setTimeout(r, 5000)),
            ]);
        }
        this.results = [];
    }
}

function scoreParticipant(args: DebateArgument[]): number {
    if (args.length === 0) return 0;
    const totalWords = args.reduce((sum, a) => sum + a.content.split(/\s+/).length, 0);
    const totalConfidence = args.reduce((sum, a) => sum + (a.confidence ?? 0), 0);
    return args.length * 1_000_000 + Math.min(totalWords, 999_999) + Math.min(totalConfidence, 999);
}
