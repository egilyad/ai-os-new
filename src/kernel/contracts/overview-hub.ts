export type OverviewHubId = 'agents' | 'memory' | 'debates' | 'providers' | 'background';

export type OverviewHubStatus = 'ok' | 'warning' | 'error';

export interface OverviewHubCard {
    id: OverviewHubId;
    title: string;
    value: number;
    hint: string;
    status: OverviewHubStatus;
    link: string;
}

/** Read-only aggregate for the five overview hubs (Э2.1). No execution side effects. */
export interface IOverviewHubService {
    snapshot(): Promise<OverviewHubCard[]>;
}
