import type { ApiKey, RotationEvent } from '../types/metrics-types';

export interface IKeyRotationManager {
    getKeys(): ApiKey[];
    getKey(id: string): ApiKey | undefined;
    addKey(data: Omit<ApiKey, 'id' | 'stats'>): Promise<ApiKey | undefined>;
    updateKey(id: string, data: Partial<ApiKey>): void;
}

export interface IRotationService {
    init(): Promise<void>;
    destroy(): void;
    scheduleRotation(keyId: string, ttlHours: number): void;
    cancelRotation(keyId: string): void;
    autoRotateKey(keyId: string): Promise<boolean>;
    rotateNow(keyId: string): Promise<boolean>;
    setKeyTTL(keyId: string, ttlHours: number, autoRotate?: boolean): void;
    getTTLRemaining(keyId: string): number;
    getTTLStatus(keyId: string): { remainingMs: number; expiresAt: string | null; active: boolean };
    getRotationHistory(keyId: string): RotationEvent[];
}
