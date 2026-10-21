import { describe, it, expect } from 'vitest';
import { AssistantDiagnosisService } from './assistant-diagnosis-service';

describe('AssistantDiagnosisService', () => {
    const service = new AssistantDiagnosisService();

    it('routes a broken panel to the structure layer', () => {
        const plan = service.diagnose('панель памяти не открывается');
        expect(plan.layer).toBe('B');
        expect(plan.checks.map((c) => c.action)).toContain('ui.openPanel');
        expect(plan.reasons.length).toBeGreaterThan(0);
    });

    it('routes a key problem to the live state layer', () => {
        const plan = service.diagnose('провайдер отдаёт 429, ключ не работает');
        expect(plan.layer).toBe('D');
        expect(plan.checks.map((c) => c.action)).toContain('keys.health');
    });

    it('routes a forgotten decision to the memory layer', () => {
        const plan = service.diagnose('мы в прошлый раз решили иначе, я забыл');
        expect(plan.layer).toBe('C');
        expect(plan.checks.map((c) => c.action)).toContain('memory.search');
    });

    it('routes a documentation mismatch to the documentary layer', () => {
        const plan = service.diagnose('в статье описано не так, как работает');
        expect(plan.layer).toBe('A');
    });

    it('keeps the other layers as a fallback', () => {
        const plan = service.diagnose('панель не открывается и провайдер падает');
        expect(['A', 'B', 'C', 'D']).toContain(plan.layer);
        expect(plan.fallbackLayers).toContain('D');
        expect(plan.fallbackLayers).not.toContain(plan.layer);
    });

    it('falls back to the live state for an unknown symptom', () => {
        const plan = service.diagnose('хм, странно');
        expect(plan.layer).toBe('D');
        expect(plan.reasons[0]).toContain('Признаков слоя не найдено');
    });

    it('handles an empty symptom', () => {
        const plan = service.diagnose('   ');
        expect(plan.layer).toBe('B');
        expect(plan.checks.length).toBeGreaterThan(0);
    });

    it('exposes the rule for the prompt', () => {
        expect(service.rule()).toContain('system.diagnose');
    });
});
