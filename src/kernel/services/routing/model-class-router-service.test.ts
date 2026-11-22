import { describe, it, expect } from 'vitest';
import { ModelClassRouterService } from './model-class-router-service';

describe('ModelClassRouterService', () => {
    it('routes code requests', () => {
        const svc = new ModelClassRouterService();
        expect(svc.classify('Please refactor this TypeScript function and fix the bug')).toBe(
            'code',
        );
    });

    it('routes short requests as trivial', () => {
        expect(new ModelClassRouterService().classify('hi')).toBe('trivial');
    });

    it('routes vision and creative requests', () => {
        const svc = new ModelClassRouterService();
        expect(
            svc.classify('Look at this screenshot image and describe what you see in detail'),
        ).toBe('vision');
        expect(
            svc.classify('Write a short creative story about a journey beyond the mountains'),
        ).toBe('creative');
    });

    it('uses per-class model mapping with a reasoning fallback', () => {
        const svc = new ModelClassRouterService();
        const d = svc.route('Refactor this function and fix the bug in the code', {
            code: 'claude-sonnet',
            reasoning: 'gpt-4o',
        });
        expect(d.model).toBe('claude-sonnet');
        expect(d.cls).toBe('code');
        const fallback = svc.route('Analyze and compare two architectures in depth', {
            reasoning: 'gpt-4o',
        });
        expect(fallback.model).toBe('gpt-4o');
    });
});
