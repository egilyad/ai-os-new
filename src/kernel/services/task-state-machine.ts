import type { AgemsTaskStatus } from '../types/agems-task';

const TRANSITIONS: Record<AgemsTaskStatus, AgemsTaskStatus[]> = {
    PENDING: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED'],
    BLOCKED: ['PENDING', 'CANCELLED'],
    IN_PROGRESS: ['IN_REVIEW', 'IN_TESTING', 'BLOCKED', 'FAILED', 'COMPLETED', 'PENDING'],
    IN_REVIEW: ['IN_TESTING', 'VERIFIED', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'FAILED'],
    IN_TESTING: ['VERIFIED', 'IN_REVIEW', 'FAILED'],
    VERIFIED: ['AWAITING_APPROVAL', 'COMPLETED', 'IN_REVIEW'],
    AWAITING_APPROVAL: ['COMPLETED', 'IN_REVIEW', 'FAILED'],
    COMPLETED: [],
    FAILED: ['PENDING', 'CANCELLED'],
    CANCELLED: [],
};

export function canTransition(from: AgemsTaskStatus, to: AgemsTaskStatus): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
}

export class TaskIllegalTransitionError extends Error {
    constructor(from: AgemsTaskStatus, to: AgemsTaskStatus) {
        super(`illegal transition: ${from} -> ${to}`);
        this.name = 'TaskIllegalTransitionError';
    }
}
