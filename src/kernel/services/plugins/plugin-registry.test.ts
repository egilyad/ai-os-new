import { describe, expect, it } from 'vitest';
import type { PluginManifest } from '../../contracts/plugin';
import { validateManifest, satisfiesMinKernel } from './plugin-manifest';
import { PluginRegistry } from './plugin-registry';

const validManifest: PluginManifest = {
    id: 'acme.search',
    name: 'Search',
    version: '1.2.0',
    engines: { os: '4.0.0' },
    contributes: {
        tools: [{ name: 'search' }],
    },
    permissions: ['fetch:https://api.example.com'],
};

describe('validateManifest', () => {
    it('принимает валидный манифест', () => {
        const res = validateManifest(validManifest);
        expect(res.ok).toBe(true);
        expect(res.errors).toHaveLength(0);
    });

    it('отклоняет невалидный semver', () => {
        const res = validateManifest({ ...validManifest, version: 'abc' });
        expect(res.ok).toBe(false);
        expect(res.errors.join(' ')).toContain('semver');
    });

    it('отклоняет отсутствие contributes', () => {
        const { contributes: _c, ...rest } = validManifest;
        const res = validateManifest(rest);
        expect(res.ok).toBe(false);
    });

    it('отклоняет не-объект', () => {
        expect(validateManifest(null).ok).toBe(false);
        expect(validateManifest('x').ok).toBe(false);
    });
});

describe('satisfiesMinKernel', () => {
    it('минимальная версия <= текущей', () => {
        expect(satisfiesMinKernel('4.0.0', '4.5.0')).toBe(true);
        expect(satisfiesMinKernel('4.5.0', '4.5.0')).toBe(true);
        expect(satisfiesMinKernel('5.0.0', '4.5.0')).toBe(false);
    });
});

describe('PluginRegistry', () => {
    it('регистрирует валидный плагин как inactive', async () => {
        const reg = new PluginRegistry();
        expect(await reg.register(validManifest)).toBe(true);
        expect(reg.get('acme.search')?.status).toBe('inactive');
    });

    it('отклоняет несовместимый по версии ядра', async () => {
        const reg = new PluginRegistry({ kernelVersion: '4.5.0' });
        const bad = { ...validManifest, engines: { os: '9.0.0' } };
        expect(await reg.register(bad)).toBe(false);
        expect(reg.get('acme.search')?.status).toBe('error');
    });

    it('активация/деактивация', async () => {
        const reg = new PluginRegistry();
        await reg.register(validManifest);
        expect(await reg.activate('acme.search')).toBe(true);
        expect(reg.get('acme.search')?.status).toBe('active');
        await reg.deactivate('acme.search');
        expect(reg.get('acme.search')?.status).toBe('inactive');
    });

    it('listActive возвращает только активные', async () => {
        const reg = new PluginRegistry();
        await reg.register(validManifest);
        expect(reg.listActive()).toHaveLength(0);
        await reg.activate('acme.search');
        expect(reg.listActive()).toHaveLength(1);
    });

    it('exportJson/importJson round-trip', async () => {
        const reg = new PluginRegistry();
        await reg.register(validManifest);
        const json = reg.exportJson();
        const reg2 = new PluginRegistry();
        const count = await reg2.importJson(json);
        expect(count).toBe(1);
        expect(reg2.has('acme.search')).toBe(true);
    });

    it('list/has/unregister', async () => {
        const reg = new PluginRegistry();
        await reg.register(validManifest);
        expect(reg.has('acme.search')).toBe(true);
        expect(reg.list()).toHaveLength(1);
        expect(await reg.unregister('acme.search')).toBe(true);
        expect(reg.has('acme.search')).toBe(false);
    });
});
