import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationStore } from './useNotificationStore';

describe('useNotificationStore', () => {
    beforeEach(() => {
        useNotificationStore.setState({ badges: {} });
    });

    it('initializes with empty badges', () => {
        expect(useNotificationStore.getState().badges).toEqual({});
    });

    it('increment creates a badge for a new route', () => {
        useNotificationStore.getState().increment('/debates');
        expect(useNotificationStore.getState().badges['/debates']).toBe(1);
    });

    it('increment accumulates badges for the same route', () => {
        useNotificationStore.getState().increment('/agents');
        useNotificationStore.getState().increment('/agents');
        expect(useNotificationStore.getState().badges['/agents']).toBe(2);
    });

    it('increment tracks multiple routes independently', () => {
        useNotificationStore.getState().increment('/a');
        useNotificationStore.getState().increment('/a');
        useNotificationStore.getState().increment('/b');
        const { badges } = useNotificationStore.getState();
        expect(badges['/a']).toBe(2);
        expect(badges['/b']).toBe(1);
    });

    it('clear removes an existing badge', () => {
        useNotificationStore.getState().increment('/debates');
        useNotificationStore.getState().clear('/debates');
        expect(useNotificationStore.getState().badges).toEqual({});
    });

    it('clear is a no-op for a missing route', () => {
        useNotificationStore.getState().increment('/keep');
        useNotificationStore.getState().clear('/missing');
        expect(useNotificationStore.getState().badges['/keep']).toBe(1);
    });

    it('clear keeps other badges intact', () => {
        useNotificationStore.getState().increment('/a');
        useNotificationStore.getState().increment('/b');
        useNotificationStore.getState().clear('/a');
        const { badges } = useNotificationStore.getState();
        expect(badges['/a']).toBeUndefined();
        expect(badges['/b']).toBe(1);
    });

    it('clearAll resets every badge', () => {
        useNotificationStore.getState().increment('/a');
        useNotificationStore.getState().increment('/b');
        useNotificationStore.getState().clearAll();
        expect(useNotificationStore.getState().badges).toEqual({});
    });
});
