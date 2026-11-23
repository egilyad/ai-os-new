import type {
    IOverviewHubService,
    OverviewHubCard,
    OverviewHubStatus,
} from '../../contracts/overview-hub';

interface Counted {
    id: string;
    status?: string;
}

interface OverviewHubDeps {
    agents: () => Counted[];
    memory: () => { count: number };
    debates: () => Counted[];
    providers: () => Counted[];
    runs: () => Promise<{ total: number; failures: number }>;
    unread: () => number;
}

const ACTIVE = new Set(['active', 'ready', 'running', 'completed']);

function activeCount(items: Counted[]): number {
    return items.filter((i) => !i.status || ACTIVE.has(i.status)).length;
}

function statusFor(value: number): OverviewHubStatus {
    return value > 0 ? 'ok' : 'warning';
}

export class OverviewHubService implements IOverviewHubService {
    constructor(private deps: OverviewHubDeps) {}

    async snapshot(): Promise<OverviewHubCard[]> {
        const agents = this.deps.agents();
        const memory = this.deps.memory();
        const debates = this.deps.debates();
        const providers = this.deps.providers();
        const runs = await this.deps.runs();
        const unread = this.deps.unread();

        const agentsActive = activeCount(agents);
        const providersActive = activeCount(providers);
        const backgroundStatus: OverviewHubStatus =
            runs.failures > 0 ? 'error' : runs.total > 0 ? 'ok' : 'warning';

        const cards: OverviewHubCard[] = [
            {
                id: 'agents',
                title: 'Agents',
                value: agentsActive,
                hint: `из ${agents.length}`,
                status: statusFor(agentsActive),
                link: 'agents',
            },
            {
                id: 'memory',
                title: 'Memory',
                value: memory.count,
                hint: 'записей в памяти',
                status: statusFor(memory.count),
                link: 'memory',
            },
            {
                id: 'debates',
                title: 'Debates',
                value: debates.length,
                hint: 'сессий',
                status: statusFor(debates.length),
                link: 'debate',
            },
            {
                id: 'providers',
                title: 'Providers',
                value: providersActive,
                hint: providersActive === 0 ? 'нет активных ключей' : `из ${providers.length}`,
                status: statusFor(providersActive),
                link: 'keys',
            },
            {
                id: 'background',
                title: 'Background',
                value: runs.failures,
                hint: `${runs.total} запусков · ${unread} непрочитанных`,
                status: backgroundStatus,
                link: 'diagnostics',
            },
        ];
        return cards;
    }
}
