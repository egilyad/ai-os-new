import type { IMemoryStore, MemoryStoreSnapshot } from '../../contracts/memory-store';
import { MemoryStoreType } from '../../contracts/memory-store';

export interface PalaceRoom {
    id: string;
    name: string;
    store: MemoryStoreType;
    entryCount: number;
    description: string;
    color: string;
    icon: string;
}

export interface PalaceState {
    rooms: PalaceRoom[];
    totalEntries: number;
    totalMemoryUsage: number;
}

const ROOM_CONFIG: Record<
    MemoryStoreType,
    { name: string; description: string; color: string; icon: string }
> = {
    [MemoryStoreType.WORKING]: {
        name: 'Study',
        description: 'Current session context — volatile, fast access',
        color: '#f59e0b',
        icon: '⚡',
    },
    [MemoryStoreType.EPISODIC]: {
        name: 'Library',
        description: 'Past sessions and interactions',
        color: '#3b82f6',
        icon: '📚',
    },
    [MemoryStoreType.SEMANTIC]: {
        name: 'Archive',
        description: 'Facts, concepts, and knowledge',
        color: '#10b981',
        icon: '🏛️',
    },
    [MemoryStoreType.PROCEDURAL]: {
        name: 'Workshop',
        description: 'Tools, patterns, and procedures',
        color: '#8b5cf6',
        icon: '🔧',
    },
    [MemoryStoreType.EMOTIONAL]: {
        name: 'Garden',
        description: 'Emotional tags and affective memory',
        color: '#ef4444',
        icon: '🌺',
    },
    [MemoryStoreType.SOCIAL]: {
        name: 'Courtyard',
        description: 'Roles, relationships, and groups',
        color: '#06b6d4',
        icon: '👥',
    },
    [MemoryStoreType.SPATIAL]: {
        name: 'Observatory',
        description: 'Spatial maps and visual anchors',
        color: '#a855f7',
        icon: '🔭',
    },
};

export class MemoryPalace {
    constructor(private stores: Map<MemoryStoreType, IMemoryStore>) {}

    async getState(): Promise<PalaceState> {
        const snapshots: MemoryStoreSnapshot[] = [];
        for (const [, store] of this.stores) {
            snapshots.push(await store.snapshot());
        }

        const rooms: PalaceRoom[] = snapshots.map((s) => {
            const cfg = ROOM_CONFIG[s.type];
            return {
                id: s.type,
                name: cfg.name,
                store: s.type,
                entryCount: s.entryCount,
                description: cfg.description,
                color: cfg.color,
                icon: cfg.icon,
            };
        });

        return {
            rooms,
            totalEntries: snapshots.reduce((t, s) => t + s.entryCount, 0),
            totalMemoryUsage: snapshots.reduce((t, s) => t + s.memoryUsage, 0),
        };
    }

    getRoomConfig(store: MemoryStoreType): PalaceRoom {
        const cfg = ROOM_CONFIG[store];
        return {
            id: store,
            name: cfg.name,
            store,
            entryCount: 0,
            description: cfg.description,
            color: cfg.color,
            icon: cfg.icon,
        };
    }
}
