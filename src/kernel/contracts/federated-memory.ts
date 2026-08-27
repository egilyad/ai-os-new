export type FederationRole = 'hub' | 'node' | 'peer';
export type FederationStatus = 'connected' | 'syncing' | 'disconnected' | 'error';
export type SyncDirection = 'push' | 'pull' | 'bidirectional';

export interface FederatedNode {
    id: string;
    name: string;
    role: FederationRole;
    endpoint: string;
    status: FederationStatus;
    lastSync: number;
    totalMemories: number;
    syncedMemories: number;
}

export interface FederationConfig {
    nodeId: string;
    nodeName: string;
    role: FederationRole;
    syncInterval: number;
    maxPayloadSize: number;
    encryptionEnabled: boolean;
    allowedPeers: string[];
}

export interface SyncSession {
    id: string;
    direction: SyncDirection;
    peerNodeId: string;
    status: 'in_progress' | 'completed' | 'failed';
    memoriesTransferred: number;
    startedAt: number;
    completedAt?: number;
    error?: string;
}

export interface IFederatedMemoryService {
    getNodes(): FederatedNode[];
    getConfig(): FederationConfig;
    updateConfig(config: Partial<FederationConfig>): FederationConfig;
    connectNode(id: string, name: string, endpoint: string, role: FederationRole): FederatedNode;
    disconnectNode(id: string): void;
    syncAll(): Promise<SyncSession[]>;
    syncNode(nodeId: string): Promise<SyncSession>;
    getSyncHistory(): SyncSession[];
}
