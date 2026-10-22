import { describe, it, expect } from 'vitest';
import { AssistantViewService } from './assistant-view-service';

describe('AssistantViewService', () => {
    it('starts with no view', () => {
        const service = new AssistantViewService();
        expect(service.getView()).toBeNull();
        expect(service.summary()).toBe('');
    });

    it('remembers the current screen', () => {
        const service = new AssistantViewService();
        service.setView({ route: '/memory', panelId: 'memory' });

        const view = service.getView();
        expect(view?.route).toBe('/memory');
        expect(view?.panelId).toBe('memory');
        expect(view?.updatedAt).toBeGreaterThan(0);
        expect(service.summary()).toBe('route: /memory, panel: memory');
    });

    it('includes the activity when the interface knows it', () => {
        const service = new AssistantViewService();
        service.setView({ route: '/agents', panelId: 'agents', activity: 'создание агента' });
        expect(service.summary()).toContain('activity: создание агента');
    });

    it('replaces the view on every change and can be cleared', () => {
        const service = new AssistantViewService();
        service.setView({ route: '/a' });
        service.setView({ route: '/b' });
        expect(service.getView()?.route).toBe('/b');

        service.clear();
        expect(service.getView()).toBeNull();
    });
});
