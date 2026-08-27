export type GuardianAspect =
    'speed' | 'security' | 'power' | 'routing' | 'cost' | 'local' | 'creativity';

export interface GuardianBlessing {
    provider: string;
    score: number;
    reason: string;
}

export interface GuardianWarning {
    provider: string;
    severity: 'info' | 'warning' | 'critical';
    message: string;
}

export interface GuardianStatus {
    name: string;
    aspect: GuardianAspect;
    active: boolean;
    providers: string[];
    providerCount: number;
    uptime: number;
    lastActive: number;
}

export interface IGuardian {
    readonly name: string;
    readonly aspect: GuardianAspect;
    readonly providers: string[];
    getBlessing(provider: string, request: Record<string, unknown>): GuardianBlessing | null;
    getWarning(provider: string, status: Record<string, unknown>): GuardianWarning | null;
    getStatus(): GuardianStatus;
}

export interface IBridgeKeeperService {
    getGuardian(name: string): IGuardian | undefined;
    getGuardiansByAspect(aspect: GuardianAspect): IGuardian[];
    getAllGuardians(): IGuardian[];
    getGuardianForProvider(provider: string): IGuardian | undefined;
    getBlessing(provider: string, request: Record<string, unknown>): GuardianBlessing | null;
    getWarning(provider: string, status: Record<string, unknown>): GuardianWarning | null;
}
