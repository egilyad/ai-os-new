import { EVENTS } from '../../events/event-names';
import type {
    DebateConfig,
    DebateParticipant,
    DebateSession,
    DebateStrategy,
} from '../../contracts/debate-types';
import type { DebateSyncManager } from './debate-sync-manager';
type DebateService = DebateSyncManager;
import type { OrchestrationService } from '../orchestration-service';
import type { ISessionManager } from '../../contracts/session-manager';
import { rootLogger } from '../logger-service';
const DA_LOGGER = rootLogger.child('DebateApi');

export interface CreateDebateBody {
    topic: string;
    participants?: string[];
    strategy?: DebateStrategy;
    maxRounds?: number;
    debateTemperature?: number;
    config?: Partial<DebateConfig>;
}

export interface DebateApiStreamEvent {
    type: 'started' | 'argument' | 'updated' | 'consensus' | 'completed' | 'error';
    sessionId: string;
    payload: unknown;
    timestamp: number;
}

interface StreamSubscriber {
    push: (event: DebateApiStreamEvent) => void;
    close: () => void;
}

export interface DebateApiServiceDeps {
    eventBus: {
        onSafe: <T>(event: string, cb: (data: T) => void) => () => void;
    };
    debateService: DebateService;
    sessionManager: ISessionManager;
    orchestrator: OrchestrationService;
}

export class DebateApiService {
    private subscribers = new Map<string, Set<StreamSubscriber>>();
    private fetchPatched = false;
    private unsubs: Array<() => void> = [];

    constructor(private deps: DebateApiServiceDeps) {}

    init(): void {
        this.unsubs.push(
            this.deps.eventBus.onSafe<DebateSession>(EVENTS.DEBATE_STARTED, (s) => {
                this.broadcast(s.id, {
                    type: 'started',
                    sessionId: s.id,
                    payload: s,
                    timestamp: Date.now(),
                });
            }),
            this.deps.eventBus.onSafe<DebateSession>(EVENTS.DEBATE_UPDATED, (s) => {
                const type = s.status === 'completed' ? 'completed' : 'updated';
                this.broadcast(s.id, { type, sessionId: s.id, payload: s, timestamp: Date.now() });
                if (s.status === 'completed' || s.status === 'cancelled' || s.status === 'failed')
                    this.closeStream(s.id);
            }),
            this.deps.eventBus.onSafe<{ sessionId: string; argument: unknown }>(
                EVENTS.DEBATE_ARGUMENT,
                ({ sessionId, argument }) => {
                    const session = this.deps.sessionManager
                        .getDebateHistory()
                        .find((s) => s.id === sessionId);
                    if (!session) return;
                    this.broadcast(sessionId, {
                        type: 'argument',
                        sessionId,
                        payload: argument,
                        timestamp: Date.now(),
                    });
                },
            ),
            this.deps.eventBus.onSafe<{
                sessionId: string;
                topic: string;
                consensus: string;
                convergenceScore: number;
            }>(EVENTS.DEBATE_CONSENSUS, (payload) => {
                const session = this.deps.sessionManager
                    .getDebateHistory()
                    .find((s) => s.id === payload.sessionId);
                if (!session) return;
                this.broadcast(payload.sessionId, {
                    type: 'consensus',
                    sessionId: payload.sessionId,
                    payload,
                    timestamp: Date.now(),
                });
            }),
        );
        // C-5: Removed installFetchBridge() — global window.fetch monkey-patch was
        // removing the global window.fetch and causing all HTTP requests to go through
        // this service. No external clients call /api/debates; the service is only used
        // internally. The global patch has been removed to prevent cascading failures.
    }

    destroy(): void {
        this.unsubs.forEach((u) => u());
        this.unsubs = [];
        for (const subs of this.subscribers.values()) {
            subs.forEach((s) => s.close());
        }
        this.subscribers.clear();
    }

    installFetchBridge(): void {
        if (typeof window === 'undefined' || this.fetchPatched) return;
        this.fetchPatched = true;
        const native = window.fetch.bind(window);
        const { handleHttp } = this;
        window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const url = new URL(
                typeof input === 'string'
                    ? input
                    : input instanceof Request
                      ? input.url
                      : input.href,
                window.location.origin,
            );
            if (url.pathname.startsWith('/api/debates')) {
                const req = input instanceof Request ? input : new Request(url.toString(), init);
                return handleHttp(req);
            }
            return native(input, init);
        };
    }

    async createDebate(body: CreateDebateBody): Promise<DebateSession> {
        const participants = this.resolveParticipants(body.participants);
        if (participants.length < 2) {
            throw new Error('Need at least 2 participants');
        }
        const strategy = body.strategy ?? 'round_robin';
        const maxRounds = body.maxRounds ?? 5;
        const config: Partial<DebateConfig> = {
            ...body.config,
            ...(body.debateTemperature !== undefined
                ? { debateTemperature: body.debateTemperature }
                : {}),
        };
        return this.deps.debateService.startDebate(
            body.topic,
            participants,
            strategy,
            maxRounds,
            config,
        );
    }

    getSession(id: string): DebateSession | null {
        return this.deps.sessionManager.getDebateHistory().find((s) => s.id === id) ?? null;
    }

    subscribeStream(
        sessionId: string,
        onEvent: (event: DebateApiStreamEvent) => void,
        onClose?: () => void,
        _authToken?: string,
    ): () => void {
        if (!this.getSession(sessionId)) {
            onEvent({
                type: 'error',
                sessionId,
                payload: 'Session not found',
                timestamp: Date.now(),
            });
            return () => {};
        }
        const sub: StreamSubscriber = {
            push: onEvent,
            close: onClose ?? (() => {}),
        };
        if (!this.subscribers.has(sessionId)) this.subscribers.set(sessionId, new Set());
        this.subscribers.get(sessionId)!.add(sub);
        const session = this.getSession(sessionId);
        if (session) {
            onEvent({ type: 'updated', sessionId, payload: session, timestamp: Date.now() });
            if (session.status === 'completed') {
                onEvent({ type: 'completed', sessionId, payload: session, timestamp: Date.now() });
            }
        }
        return () => {
            const set = this.subscribers.get(sessionId);
            if (set) {
                set.delete(sub);
                if (set.size === 0) this.subscribers.delete(sessionId);
            }
            sub.close();
        };
    }

    async handleHttp(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname.replace(/\/+$/, '');

        if (request.method === 'POST' && path === '/api/debates') {
            try {
                const body = (await request.json()) as CreateDebateBody;
                const session = await this.createDebate(body);
                return Response.json(
                    { id: session.id, status: session.status, topic: session.topic },
                    { status: 201 },
                );
            } catch (e) {
                return Response.json(
                    { error: e instanceof Error ? e.message : 'Failed to start debate' },
                    { status: 400 },
                );
            }
        }

        const streamMatch = path.match(/^\/api\/debates\/([^/]+)\/stream$/);
        if (request.method === 'GET' && streamMatch) {
            const sessionId = streamMatch[1]!;
            if (!this.getSession(sessionId)) {
                return Response.json({ error: 'Debate not found' }, { status: 404 });
            }
            return this.createSseResponse(sessionId);
        }

        const getMatch = path.match(/^\/api\/debates\/([^/]+)$/);
        if (request.method === 'GET' && getMatch) {
            const session = this.getSession(getMatch[1]!);
            if (!session) return Response.json({ error: 'Debate not found' }, { status: 404 });
            return Response.json(session);
        }

        return Response.json({ error: 'Not found' }, { status: 404 });
    }

    private createSseResponse(sessionId: string): Response {
        const encoder = new TextEncoder();
        let unsubscribe: (() => void) | null = null;
        const stream = new ReadableStream({
            start: (controller) => {
                const send = (event: DebateApiStreamEvent) => {
                    const line = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
                    controller.enqueue(encoder.encode(line));
                };
                unsubscribe = this.subscribeStream(sessionId, send, () => {
                    try {
                        controller.close();
                    } catch {
                        /* already closed */
                    }
                });
                send({
                    type: 'updated',
                    sessionId,
                    payload: { connected: true },
                    timestamp: Date.now(),
                });
            },
            cancel: () => {
                unsubscribe?.();
            },
        });
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
            },
        });
    }

    private broadcast(sessionId: string, event: DebateApiStreamEvent): void {
        const subs = this.subscribers.get(sessionId);
        if (subs) {
            for (const sub of subs) {
                try {
                    sub.push(event);
                } catch (e) {
                    DA_LOGGER.warn('DebateApi', 'broadcast skipped bad subscriber', { error: e });
                }
            }
        }
    }

    private closeStream(sessionId: string): void {
        const subs = this.subscribers.get(sessionId);
        if (!subs) return;
        for (const sub of subs) {
            sub.close();
        }
        this.subscribers.delete(sessionId);
    }

    private resolveParticipants(ids?: string[]): DebateParticipant[] {
        const topology = this.deps.orchestrator.getActiveTopology();
        const agentNodes = topology?.nodes.filter((n) => n.type === 'agent') ?? [];
        const selected = ids?.length
            ? ids
                  .map((id) => agentNodes.find((n) => n.id === id))
                  .filter((n): n is NonNullable<typeof n> => !!n)
            : agentNodes.slice(0, 3);
        const roleOrder: Array<'pro' | 'con' | 'neutral'> = ['pro', 'con', 'neutral'];
        return selected.map((node, i) => ({
            id: node.id,
            name: node.label || node.id,
            role: roleOrder[i % roleOrder.length]!,
            systemPrompt:
                (node.config?.prompt as string) ||
                `You are ${node.label}. Debate from your expertise.`,
            provider: (node.config?.provider as string) || undefined,
            modelId:
                (node.config?.model as string) !== 'auto'
                    ? (node.config?.model as string)
                    : undefined,
        }));
    }
}
