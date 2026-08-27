export interface VirtualKey {
    id: string;
    realKeyId: string;
    provider: string;
    agentId?: string;
    label: string;
    createdAt: number;
    lastUsedAt?: number;
    active: boolean;
}

export interface IVirtualKeyService {
    init(): Promise<void>;
    create(realKeyId: string, label: string, agentId?: string): Promise<VirtualKey>;
    lookup(id: string): VirtualKey | undefined;
    resolve(id: string): VirtualKey | undefined;
    revoke(id: string): Promise<void>;
    list(): VirtualKey[];
    listActive(): VirtualKey[];
}

export interface VirtualKeyServiceEvents {
    'virtual:key:created': { virtualKey: VirtualKey };
    'virtual:key:resolved': { virtualKeyId: string };
    'virtual:key:revoked': { virtualKeyId: string };
}
