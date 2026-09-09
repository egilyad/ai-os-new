import type {
    DebatePhase,
    AgentPhase,
    AgentStateEntry,
    DebateTopology,
    ParticipantConfig,
    DebateSessionSnapshot,
    IDebateSession,
} from '../../contracts/debate-runtime';
import type { ITransaction } from '../../contracts/transaction';
import type { TransitionEvent, TransitionOutcome } from '../../contracts/debate-state-machine';
import { DEFAULT_DEBATE_LANGUAGE } from '../config-registry';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-registry';
import { StateMachine, phaseToEvent } from './debate-state-machine';

const LOGGER = rootLogger.child('DebateSession');

export class DebateSession implements IDebateSession {
    readonly id: string;
    readonly topic: string;
    readonly topology: DebateTopology;
    readonly createdAt: number;
    readonly participants: ParticipantConfig[];

    private _sm: StateMachine;
    private _round = 0;
    private _version = 1;
    private _agentStates = new Map<string, AgentStateEntry>();
    private _totalTokens = 0;
    private _totalCost = 0;
    private _startedAt = 0;
    private _phaseListeners: Array<(from: DebatePhase, to: DebatePhase) => void> = [];
    private _transitioning = false;

    private _language: string;
    private _failedProviders = new Set<string>();
    private _failedModels = new Set<string>();
    private _arguments: DebateSessionSnapshot['arguments'] = [];
    private _qualitySettings?: Record<string, boolean>;

    get qualitySettings(): Record<string, boolean> | undefined {
        return this._qualitySettings;
    }

    get arguments(): DebateSessionSnapshot['arguments'] {
        return this._arguments;
    }

    hasProviderFailed(provider: string): boolean {
        return this._failedProviders.has(provider);
    }

    markProviderFailed(provider: string): void {
        this._failedProviders.add(provider);
    }

    hasModelFailed(model: string): boolean {
        return this._failedModels.has(model);
    }

    markModelFailed(model: string): void {
        this._failedModels.add(model);
    }

    get failedModels(): string[] {
        return Array.from(this._failedModels);
    }

    constructor(
        id: string,
        topic: string,
        topology: DebateTopology,
        participants: ParticipantConfig[],
        language = DEFAULT_DEBATE_LANGUAGE,
    ) {
        this.id = id;
        this.topic = topic;
        this.topology = topology;
        this.participants = participants;
        this._language = language;
        this.createdAt = Date.now();
        this._sm = new StateMachine('created');

        for (const p of participants) {
            this._agentStates.set(p.agentId, {
                agentId: p.agentId,
                nodeId: p.nodeId,
                phase: 'idle',
                round: 0,
                tokensUsed: 0,
                latency: 0,
                lastActiveAt: Date.now(),
            });
        }
    }

    get phase(): DebatePhase {
        return this._sm.current;
    }
    get round(): number {
        return this._round;
    }
    get version(): number {
        return this._version;
    }
    get agentStates(): Map<string, AgentStateEntry> {
        return new Map(this._agentStates);
    }
    get totalTokens(): number {
        return this._totalTokens;
    }
    get totalCost(): number {
        return this._totalCost;
    }
    get language(): string {
        return this._language;
    }

    onPhaseChange(cb: (from: DebatePhase, to: DebatePhase) => void): () => void {
        this._phaseListeners.push(cb);
        return () => {
            this._phaseListeners = this._phaseListeners.filter((l) => l !== cb);
        };
    }

    transition(to: DebatePhase, tx?: ITransaction): boolean {
        if (this._transitioning) {
            LOGGER.warn('DebateSession', 'Re-entrant transition blocked', {
                from: this._sm.current,
                to,
                sessionId: this.id,
            });
            return false;
        }
        this._transitioning = true;
        try {
            const from = this._sm.current;
            if (from === to) return true;
            const event = phaseToEvent(to);
            if (!event) {
                LOGGER.warn('DebateSession', `No event mapped for phase ${to}`, {
                    sessionId: this.id,
                });
                if (tx && 'deferEmit' in tx) {
                    (tx as unknown as { deferEmit: (e: string, d: unknown) => void }).deferEmit(
                        EVENTS.DEBATE_TRANSITION_INVALID,
                        { from, to, sessionId: this.id },
                    );
                }
                return false;
            }
            if (!this._sm.can(event)) {
                LOGGER.warn('DebateSession', `Invalid transition: ${from} -> ${to}`, {
                    sessionId: this.id,
                });
                if (tx && 'deferEmit' in tx) {
                    (tx as unknown as { deferEmit: (e: string, d: unknown) => void }).deferEmit(
                        EVENTS.DEBATE_TRANSITION_INVALID,
                        { from, to, sessionId: this.id },
                    );
                }
                return false;
            }
            this._sm.reset(to);
            if (to === 'active' && !this._startedAt) this._startedAt = Date.now();
            for (const cb of this._phaseListeners) cb(from, to);
            return true;
        } finally {
            this._transitioning = false;
        }
    }

    async send(event: TransitionEvent): Promise<TransitionOutcome> {
        const outcome = await this._sm.send(event);
        if (outcome.success) {
            for (const cb of this._phaseListeners) cb(outcome.from, outcome.to!);
        }
        return outcome;
    }

    incrementRound(): void {
        this._round++;
    }

    setAgentPhase(agentId: string, phase: AgentPhase, _tx?: ITransaction): void {
        const existing = this._agentStates.get(agentId);
        if (!existing) return;
        this._agentStates.set(agentId, {
            ...existing,
            phase,
            lastActiveAt: Date.now(),
        });
    }

    recordUsage(agentId: string, tokens: number, cost: number, latency: number): void {
        const existing = this._agentStates.get(agentId);
        if (!existing) return;
        this._agentStates.set(agentId, {
            ...existing,
            tokensUsed: existing.tokensUsed + tokens,
            latency: existing.latency === 0 ? latency : (existing.latency + latency) / 2,
            round: this._round,
        });
        this._totalTokens += tokens;
        this._totalCost += cost;
    }

    setAgentError(agentId: string, error: string): void {
        const existing = this._agentStates.get(agentId);
        if (!existing) return;
        this._agentStates.set(agentId, {
            ...existing,
            error,
            phase: 'errored',
            lastActiveAt: Date.now(),
        });
    }

    snapshot(): DebateSessionSnapshot {
        return {
            id: this.id,
            topic: this.topic,
            topology: { ...this.topology },
            phase: this._sm.current,
            round: this._round,
            version: this._version,
            agentStates: Array.from(this._agentStates.values()),
            totalTokens: this._totalTokens,
            totalCost: this._totalCost,
            startedAt: this._startedAt || this.createdAt,
            updatedAt: Date.now(),
            language: this.language,
            arguments: this._arguments ? [...this._arguments] : [],
            failedProviders: Array.from(this._failedProviders),
            failedModels: Array.from(this._failedModels),
            qualitySettings: this._qualitySettings ? { ...this._qualitySettings } : undefined,
        };
    }

    setQualitySettings(settings: Record<string, boolean> | undefined): void {
        this._qualitySettings = settings ? { ...settings } : undefined;
    }

    incrementVersion(newVersion: number): void {
        this._version = newVersion;
    }

    destroy(): void {
        this._sm.destroy();
        this._agentStates.clear();
        this._phaseListeners = [];
        this._failedProviders.clear();
        this._failedModels.clear();
    }

    restoreInternalState(snapshot: DebateSessionSnapshot): void {
        this._sm.reset(snapshot.phase);
        this._round = snapshot.round;
        this._version = snapshot.version;
        this._totalTokens = snapshot.totalTokens;
        this._totalCost = snapshot.totalCost;
        this._startedAt = snapshot.startedAt;
        this._language = snapshot.language;

        this._agentStates.clear();
        for (const as of snapshot.agentStates) {
            this._agentStates.set(as.agentId, as);
        }
        this._arguments = snapshot.arguments ? [...snapshot.arguments] : [];

        this._failedProviders.clear();
        for (const p of snapshot.failedProviders ?? []) {
            this._failedProviders.add(p);
        }
        this._failedModels.clear();
        for (const m of snapshot.failedModels ?? []) {
            this._failedModels.add(m);
        }
        this._qualitySettings = snapshot.qualitySettings
            ? { ...snapshot.qualitySettings }
            : undefined;
    }
}
