import { canTransition, TaskIllegalTransitionError } from './task-state-machine';
import type { AgemsTaskStatus } from '../types/agems-task';

const ALL_STATUSES: AgemsTaskStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'IN_REVIEW',
    'IN_TESTING',
    'VERIFIED',
    'AWAITING_APPROVAL',
    'COMPLETED',
    'FAILED',
    'BLOCKED',
    'CANCELLED',
];

describe('task-state-machine', () => {
    it('terminal states have no outgoing transitions', () => {
        expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
        expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
    });

    it('FAILED allows re-queue to PENDING', () => {
        expect(canTransition('FAILED', 'PENDING')).toBe(true);
    });

    it('PENDING allows IN_PROGRESS and BLOCKED', () => {
        expect(canTransition('PENDING', 'IN_PROGRESS')).toBe(true);
        expect(canTransition('PENDING', 'BLOCKED')).toBe(true);
    });

    it('does not allow arbitrary jumps', () => {
        expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
        expect(canTransition('PENDING', 'VERIFIED')).toBe(false);
        expect(canTransition('BLOCKED', 'IN_PROGRESS')).toBe(false);
    });

    it('all statuses are covered by the transition table', () => {
        for (const s of ALL_STATUSES) {
            expect(canTransition(s, s)).toBe(false);
            expect(typeof canTransition(s, 'PENDING')).toBe('boolean');
        }
    });

    it('produces a descriptive error', () => {
        const err = new TaskIllegalTransitionError('PENDING', 'COMPLETED');
        expect(err.message).toBe('illegal transition: PENDING -> COMPLETED');
        expect(err.name).toBe('TaskIllegalTransitionError');
    });
});
