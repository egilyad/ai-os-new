import type {
    A2AMessage,
    A2ATask,
    AgentCard,
    IA2AClient,
    SendMessageOptions,
} from '../../contracts/a2a';

export interface A2AClientConfig {
    /**
     * Опциональный транспорт. По умолчанию — fetch. В браузере запросы к
     * сторонним агентам следует гнать через прокси (auth-токены вне клиента).
     */
    fetchImpl?: typeof fetch;
    /** База для агентов без прямого доступа (напр. /proxy/a2a). */
    basePath?: string;
}

function resolveUrl(base: string, path: string): string {
    return `${base.replace(/\/$/, '')}${path}`;
}

function isTask(x: unknown): x is A2ATask {
    return (
        typeof x === 'object' &&
        x !== null &&
        typeof (x as A2ATask).id === 'string' &&
        typeof (x as A2ATask).status === 'string'
    );
}

/**
 * A2AClient — минимальный клиент A2A (SPEC_09).
 *
 * Реализует discover (Agent Card), sendMessage (POST /tasks), getTask/cancelTask.
 * JSON-RPC 2.0-совместимая обёртка над HTTP+JSON.
 */
export class A2AClient implements IA2AClient {
    private fetchImpl: typeof fetch;
    private basePath: string;

    constructor(config?: A2AClientConfig) {
        this.fetchImpl = config?.fetchImpl ?? fetch;
        this.basePath = config?.basePath ?? '';
    }

    async discover(cardUrl: string): Promise<AgentCard> {
        const url = cardUrl.endsWith('/agent-card.json') ? cardUrl : resolveUrl(cardUrl, '/.well-known/agent-card.json');
        const res = await this.fetchImpl(url, { method: 'GET', signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`A2A discover failed: HTTP ${res.status}`);
        return (await res.json()) as AgentCard;
    }

    async sendMessage(card: AgentCard, msg: A2AMessage, opts?: SendMessageOptions): Promise<A2ATask> {
        const url = resolveUrl(this.basePath + card.url, '/tasks');
        const res = await this.fetchImpl(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg }),
            signal: opts?.signal,
        });
        if (!res.ok) throw new Error(`A2A sendMessage failed: HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        if (!isTask(data)) throw new Error('A2A sendMessage: invalid task response');
        return data;
    }

    async getTask(card: AgentCard, taskId: string, opts?: SendMessageOptions): Promise<A2ATask> {
        const url = resolveUrl(this.basePath + card.url, `/tasks/${encodeURIComponent(taskId)}`);
        const res = await this.fetchImpl(url, { method: 'GET', signal: opts?.signal });
        if (!res.ok) throw new Error(`A2A getTask failed: HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        if (!isTask(data)) throw new Error('A2A getTask: invalid response');
        return data;
    }

    async cancelTask(card: AgentCard, taskId: string, opts?: SendMessageOptions): Promise<A2ATask> {
        const url = resolveUrl(this.basePath + card.url, `/tasks/${encodeURIComponent(taskId)}/cancel`);
        const res = await this.fetchImpl(url, { method: 'POST', signal: opts?.signal });
        if (!res.ok) throw new Error(`A2A cancelTask failed: HTTP ${res.status}`);
        const data = (await res.json()) as unknown;
        if (!isTask(data)) throw new Error('A2A cancelTask: invalid response');
        return data;
    }
}
