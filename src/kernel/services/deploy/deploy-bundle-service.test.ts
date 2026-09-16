/**
 * DeployBundleService static test (G4) — no filesystem, fake DB.
 * Verifies: buildBundle (env redacted, startScript per target), get/list/remove, logs, events.
 */

import { describe, it, expect } from 'vitest';
import { DeployBundleService } from './deploy-bundle-service';

function fakeDeployService(configs: Array<{ id: string; name: string; target: 'vercel'|'docker'|'custom'; environment: 'production'; domain: string; apiKeys: string[]; envVars: Record<string,string>; buildCommand: string; outputDir: string; region: string; autoDeploy: boolean; createdAt: number; updatedAt: number }>) {
    return {
        getConfigs: () => configs,
    } as unknown as import('../../contracts/deploy').IDeployService;
}

function fakeDatabase() {
    const kv = new Map<string, unknown>();
    return {
        getKv: async (id: string) => kv.get(id) ?? null,
        setKv: async (id: string, v: unknown) => { kv.set(id, v); },
        keyValue: { delete: async (id: string) => { kv.delete(id); } },
        _kv: kv,
    } as unknown as import('../database-service').DatabaseService & { _kv: Map<string, unknown> };
}

function fakeBus() {
    const emitted: Array<{ name: string; payload: unknown }> = [];
    return {
        emitted,
        emit: (name: string, payload: unknown) => emitted.push({ name, payload }),
        on: () => () => {},
        off: () => {},
    } as unknown as import('../../types/interfaces').IEventBus & { emitted: unknown[] };
}

describe('G4 DeployBundleService (static)', () => {
    it('buildBundle per target, env redacted, logs BLOCKED note', async () => {
        const cfgId = 'cfg-1';
        const deploySvc = fakeDeployService([{
            id: cfgId, name: 'MyApp', target: 'docker', environment: 'production', domain: 'app.example.com',
            apiKeys: [], envVars: { NODE_ENV: 'production', SECRET_TOKEN: 'abc123' }, buildCommand: 'npm run build', outputDir: 'dist',
            region: 'us-east', autoDeploy: false, createdAt: Date.now(), updatedAt: Date.now(),
        }]);
        const db = fakeDatabase();
        const bus = fakeBus();
        const svc = new DeployBundleService({ deployService: deploySvc, database: db, events: bus });
        await svc.init();

        const bundle = await svc.buildBundle(cfgId);
        expect(bundle.configId).toBe(cfgId);
        expect(bundle.target).toBe('docker');
        expect(bundle.envManifest.SECRET_TOKEN).toBe('[REDACTED]');
        expect(bundle.envManifest.NODE_ENV).toBe('production');
        expect(bundle.startScript).toContain('Dockerfile');
        expect(bundle.files.some((f) => f.path === 'Dockerfile')).toBe(true);
        expect(bundle.manifestHash).toMatch(/^[0-9a-f]{8}$/);
        expect(bundle.logs.some((l) => l.message.includes('BLOCKED-RUNTIME'))).toBe(true);
        expect((bus as unknown as { emitted: Array<{ name: string }> }).emitted.some((e) => String(e.name).includes('deploy:bundle'))).toBe(true);

        const fetched = await svc.getBundle(bundle.id);
        expect(fetched?.id).toBe(bundle.id);

        const list = await svc.listBundles(cfgId);
        expect(list.length).toBe(1);

        const logs = await svc.getLogs(bundle.id);
        expect(logs.length).toBeGreaterThanOrEqual(2);

        await svc.removeBundle(bundle.id);
        expect(await svc.getBundle(bundle.id)).toBeNull();

        await svc.destroy();
    });

    it('vercel & custom startScript', async () => {
        for (const target of ['vercel', 'custom'] as const) {
            const db = fakeDatabase();
            const id = `cfg-${target}`;
            const svc = new DeployBundleService({
                deployService: fakeDeployService([{ id, name: 'App', target, environment: 'production', domain: 'app.example.com', apiKeys: [], envVars: {}, buildCommand: '', outputDir: 'dist', region: 'us', autoDeploy: false, createdAt: 1, updatedAt: 1 }]),
                database: db,
                events: fakeBus(),
            });
            await svc.init();
            const b = await svc.buildBundle(id);
            if (target === 'vercel') expect(b.startScript).toContain('buildCommand');
            else expect(b.startScript).toContain('start.sh');
            await svc.destroy();
        }
    });

    it('unknown config throws', async () => {
        const svc = new DeployBundleService({ deployService: fakeDeployService([]), database: fakeDatabase(), events: fakeBus() });
        await svc.init();
        await expect(svc.buildBundle('missing')).rejects.toThrow(/not found/);
        await svc.destroy();
    });
});
