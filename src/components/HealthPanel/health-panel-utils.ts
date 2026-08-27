import { genId } from '../../utils/gen-id';

export interface Bee {
    id: string;
    providerId: string;
    x: number;
    y: number;
    delay: number;
}

export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return genId();
};
