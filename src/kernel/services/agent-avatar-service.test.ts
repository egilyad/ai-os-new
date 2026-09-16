import { describe, it, expect } from 'vitest';
import { AgentAvatarService } from './agent-avatar-service';

describe('AgentAvatarService', () => {
    function makeSvc() {
        return new AgentAvatarService();
    }

    describe('generate', () => {
        it('should produce deterministic avatars for the same agentId', () => {
            const svc = makeSvc();
            const a1 = svc.generate('agent-alpha');
            const a2 = svc.generate('agent-alpha');
            expect(a1).toEqual(a2);
        });

        it('should produce different avatars for different agentIds', () => {
            const svc = makeSvc();
            const a = svc.generate('agent-alpha');
            const b = svc.generate('agent-beta');
            expect(a.emoji).not.toBe(b.emoji);
            expect(a.initials).not.toBe(b.initials);
        });

        it('should return seed matching agentId', () => {
            const svc = makeSvc();
            const a = svc.generate('my-agent');
            expect(a.seed).toBe('my-agent');
        });

        it('should use custom avatar when set', () => {
            const svc = makeSvc();
            svc.setCustomAvatar('agent-x', '⭐', '#ff0000');
            const a = svc.generate('agent-x');
            expect(a.emoji).toBe('⭐');
            expect(a.color).toBe('#ff0000');
        });

        it('should extract initials from agent ID', () => {
            const svc = makeSvc();
            const a = svc.generate('DataProcessor');
            expect(a.initials).toBe('DA');
        });

        it('should handle short agent IDs', () => {
            const svc = makeSvc();
            const a = svc.generate('ab');
            expect(a.initials).toBe('AB');
        });
    });

    describe('generatePreview', () => {
        it('should produce deterministic preview for same seed', () => {
            const svc = makeSvc();
            const p1 = svc.generatePreview('test');
            const p2 = svc.generatePreview('test');
            expect(p1).toEqual(p2);
        });

        it('should differ from generate for same input', () => {
            const svc = makeSvc();
            svc.generate('hello');
            const p = svc.generatePreview('hello');
            expect(p.seed).toBe('hello');
            // preview uses different seed internally
        });
    });

    describe('custom avatars', () => {
        it('should get custom avatar after set', () => {
            const svc = makeSvc();
            svc.setCustomAvatar('agent-1', '🔥', '#123456');
            expect(svc.getCustomAvatar('agent-1')).toEqual({ emoji: '🔥', color: '#123456' });
        });

        it('should return undefined for unset avatar', () => {
            const svc = makeSvc();
            expect(svc.getCustomAvatar('nonexistent')).toBeUndefined();
        });

        it('should remove custom avatar', () => {
            const svc = makeSvc();
            svc.setCustomAvatar('agent-1', '🔥', '#123456');
            svc.removeCustomAvatar('agent-1');
            expect(svc.getCustomAvatar('agent-1')).toBeUndefined();
        });

        it('should revert to deterministic after removal', () => {
            const svc = makeSvc();
            const deterministic = svc.generate('agent-1');
            svc.setCustomAvatar('agent-1', '🔥', '#000');
            svc.removeCustomAvatar('agent-1');
            expect(svc.generate('agent-1')).toEqual(deterministic);
        });

        it('should clear all custom avatars', () => {
            const svc = makeSvc();
            svc.setCustomAvatar('a', '🔥', '#000');
            svc.setCustomAvatar('b', '⭐', '#fff');
            svc.clearCustomAvatars();
            expect(svc.getCustomAvatar('a')).toBeUndefined();
            expect(svc.getCustomAvatar('b')).toBeUndefined();
        });

        it('should limit custom avatars to MAX_AVATARS (200)', () => {
            const svc = makeSvc();
            for (let i = 0; i < 210; i++) {
                svc.setCustomAvatar(`agent-${i}`, '🔥', '#000');
            }
            // First entries should be evicted
            expect(svc.getCustomAvatar('agent-0')).toBeUndefined();
            expect(svc.getCustomAvatar('agent-209')).toBeDefined();
        });
    });

    describe('available pools', () => {
        it('should return available emojis', () => {
            const svc = makeSvc();
            const emojis = svc.getAvailableEmojis();
            expect(emojis.length).toBeGreaterThan(0);
            expect(emojis).toContain('🔴');
        });

        it('should return available colors', () => {
            const svc = makeSvc();
            const colors = svc.getAvailableColors();
            expect(colors.length).toBeGreaterThan(0);
            expect(colors).toContain('#3498db');
        });
    });

    describe('getAvatarCSS', () => {
        it('should generate circle shape by default', () => {
            const svc = makeSvc();
            const css = svc.getAvatarCSS(svc.generate('test'));
            expect(css.borderRadius).toBe('50%');
        });

        it('should respect shape config', () => {
            const svc = new AgentAvatarService({ shape: 'square' });
            const css = svc.getAvatarCSS(svc.generate('test'));
            expect(css.borderRadius).toBe('8px');
        });

        it('should include background color from avatar', () => {
            const svc = makeSvc();
            const a = svc.generate('test');
            const css = svc.getAvatarCSS(a);
            expect(css.backgroundColor).toBe(a.color);
        });
    });
});
