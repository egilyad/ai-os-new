export type SnapshotScope = 'full' | 'config' | 'memory' | 'keys' | 'debates';

export interface TimeSnapshot {
    id: string;
    label: string;
    scope: SnapshotScope;
    timestamp: number;
    size: number;
    changes: string[];
    snapshotRefId?: string;
    keysData?: { id: string; provider: string; model: string; status: string }[];
    memoryData?: { id: string; content: string; timestamp: number }[];
}

export interface ITimeMachineService {
    getSnapshots(): TimeSnapshot[];
    createSnapshot(label: string, scope: SnapshotScope): TimeSnapshot;
    restoreSnapshot(id: string): Promise<void>;
    deleteSnapshot(id: string): void;
    compareSnapshots(id1: string, id2: string): { key: string; before: string; after: string }[];
}
