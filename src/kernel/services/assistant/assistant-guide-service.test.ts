import { describe, it, expect } from 'vitest';
import { AssistantGuideService } from './assistant-guide-service';
import type { ProjectKnowledgeService } from './project-knowledge-service';

function knowledge(panels: Array<{ id: string; route: string; component: string | null }>) {
    return {
        panelsMatching: () => panels,
    } as unknown as ProjectKnowledgeService;
}

describe('AssistantGuideService', () => {
    it('turns a goal into an ordered plan with real routes', () => {
        const service = new AssistantGuideService({
            knowledge: knowledge([
                { id: 'agents', route: '/agents', component: 'src/components/AgentsPanel' },
                { id: 'roles', route: '/roles', component: 'src/components/RolesPanel' },
            ]),
        });

        const plan = service.plan('создать агента');
        expect(plan.steps.length).toBeGreaterThan(0);
        expect(plan.steps[0]?.route).toBe('/agents');
        expect(plan.steps[0]?.action).toBe('ui.openPanel');
        expect(plan.steps[0]?.args?.['panelId']).toBe('agents');
        expect(plan.steps[1]?.order).toBe(2);
    });

    it('adds a check that fits the topic', () => {
        const service = new AssistantGuideService({
            knowledge: knowledge([{ id: 'keys', route: '/keys', component: null }]),
        });

        const plan = service.plan('проверить ключи');
        const check = plan.steps.find((s) => s.kind === 'check');
        expect(check?.action).toBe('keys.health');
    });

    it('says so when nothing matches', () => {
        const service = new AssistantGuideService({ knowledge: knowledge([]) });
        const plan = service.plan('что-то странное');
        expect(plan.steps).toHaveLength(0);
        expect(plan.note).toContain('не найдены');
    });

    it('asks for a clearer goal when it is empty', () => {
        const service = new AssistantGuideService({ knowledge: knowledge([]) });
        expect(service.plan('   ').note).toContain('Цель пустая');
    });

    it('mentions the component behind the panel', () => {
        const service = new AssistantGuideService({
            knowledge: knowledge([
                { id: 'agents', route: '/agents', component: 'src/components/AgentsPanel' },
            ]),
        });
        expect(service.plan('агенты').steps[0]?.detail).toContain('AgentsPanel');
    });
});
