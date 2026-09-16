/**
 * DeployBundleService — G4 (STATIC GAP CLOSURE).
 *
 * Local-first bundle: env manifest + start script + file manifest.
 * No cloud push, no real zip/filesystem (BLOCKED-RUNTIME until run on clean machine).
 * Stores bundles in DatabaseService.keyValue (`deploy:bundle:<id>`).
 * Events: deploy:bundle:created (count).
 * Existing DeployService untouched.
 */

import type { IDeployBundleService, DeployBundle } from '../../contracts/deploy-bundle';
import type { IDeployService } from '../../contracts/deploy';
import type { IEventBus } from '../../types/interfaces';
import type { DatabaseService } from '../database-service';
import { rootLogger } from '../logger-service';
import { EVENTS } from '../../events/event-names';

const LOGGER = rootLogger.child('DeployBundle');
const BUNDLE_PREFIX = 'deploy:bundle:';
const BUNDLE_INDEX = 'deploy:bundle:index';

function hashStub(s: string): string {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h ^= s.charCodeAt(i), h = Math.imul(h, 16777619) >>> 0;
    return h.toString(16).padStart(8, '0');
}

function redactEnv(env: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(env)) {
        const isSecret = /key|secret|token|password/i.test(k);
        out[k] = isSecret ? '[REDACTED]' : v;
    }
    return out;
}

function startScriptFor(target: import('../../contracts/deploy').DeployTarget, env: Record<string, string>, buildCommand: string, outputDir: string): string {
    if (target === 'docker') {
        return `# Dockerfile (generated, local-first)\nFROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN ${buildCommand || 'npm run build'}\nEXPOSE 3000\nCMD ["node","${outputDir}/server.js"]\n# env: ${Object.keys(env).join(',')}`;
    }
    if (target === 'vercel') {
        return JSON.stringify({ version: 2, buildCommand: buildCommand || 'npm run build', outputDirectory: outputDir || 'dist', env: Object.keys(env) }, null, 2);
    }
    // custom
    return `#!/bin/sh\n# start.sh (generated)\n${buildCommand || 'npm run build'}\nnode ${outputDir}/server.js\n# env: ${Object.keys(env).join(',')}`;
}

export class DeployBundleService implements IDeployBundleService {
    private bundles = new Map<string, DeployBundle>();

    constructor(private deps: { deployService: IDeployService; database: DatabaseService; events: IEventBus }) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
        try {
            const idx = await this.deps.database.getKv<string[]>(BUNDLE_INDEX);
            if (idx) {
                for (const id of idx) {
                    const b = await this.deps.database.getKv<DeployBundle>(`${BUNDLE_PREFIX}${id}`);
                    if (b) this.bundles.set(id, b);
                }
            }
        } catch (e) {
            LOGGER.warn('init load failed', { error: e instanceof Error ? e.message : String(e) });
        }
    }

    async destroy(): Promise<void> {
        this.bundles.clear();
    }

    async buildBundle(configId: string): Promise<DeployBundle> {
        const cfg = this.deps.deployService.getConfigs().find((c) => c.id === configId);
        if (!cfg) throw new Error(`Deploy config not found: ${configId}`);
        const envManifest = redactEnv(cfg.envVars ?? {});
        const startScript = startScriptFor(cfg.target, cfg.envVars ?? {}, cfg.buildCommand, cfg.outputDir);
        const manifestStr = JSON.stringify({ name: cfg.name, target: cfg.target, env: envManifest, version: 1 });
        const bundle: DeployBundle = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            configId,
            name: cfg.name,
            target: cfg.target,
            environment: cfg.environment,
            envManifest,
            startScript,
            files: [
                { path: 'manifest.json', kind: 'manifest' },
                { path: cfg.target === 'docker' ? 'Dockerfile' : cfg.target === 'vercel' ? 'vercel.json' : 'start.sh', kind: 'script' },
                { path: 'config.json', kind: 'config' },
            ],
            manifestHash: hashStub(manifestStr),
            logs: [
                { timestamp: Date.now(), level: 'info', message: `Bundle built for ${cfg.name} @${cfg.environment}` },
                { timestamp: Date.now(), level: 'info', message: `Target: ${cfg.target}, manifestHash: ${hashStub(manifestStr)}` },
                { timestamp: Date.now(), level: 'warn', message: 'Real zip/filesystem/cloud push = BLOCKED-RUNTIME (run on clean machine)' },
            ],
            createdAt: Date.now(),
        };
        this.bundles.set(bundle.id, bundle);
        try {
            await this.deps.database.setKv(`${BUNDLE_PREFIX}${bundle.id}`, bundle);
            const idx = (await this.deps.database.getKv<string[]>(BUNDLE_INDEX)) ?? [];
            idx.push(bundle.id);
            await this.deps.database.setKv(BUNDLE_INDEX, [...new Set(idx)]);
        } catch (e) {
            LOGGER.warn('persist bundle failed', { error: e instanceof Error ? e.message : String(e) });
        }
        try {
            (this.deps.events as unknown as { emit: (n: string, p: unknown) => void }).emit(
                (EVENTS as unknown as Record<string, string>).DEPLOY_BUNDLE_CREATED ?? ('deploy:bundle:created' as unknown as string),
                { bundleId: bundle.id, configId, target: cfg.target },
            );
        } catch { /* ignore */ }
        LOGGER.info('bundle built', { bundleId: bundle.id, configId });
        return bundle;
    }

    async getBundle(id: string): Promise<DeployBundle | null> {
        if (this.bundles.has(id)) return this.bundles.get(id)!;
        const b = await this.deps.database.getKv<DeployBundle>(`${BUNDLE_PREFIX}${id}`);
        if (b) this.bundles.set(id, b);
        return b ?? null;
    }

    async listBundles(configId?: string): Promise<DeployBundle[]> {
        const all = [...this.bundles.values()];
        if (configId) return all.filter((b) => b.configId === configId);
        return all;
    }

    async removeBundle(id: string): Promise<void> {
        this.bundles.delete(id);
        try {
            const db = this.deps.database as unknown as { keyValue: { delete: (id: string) => Promise<void> } };
            // best-effort via keyValue direct (fallback to setKv null)
            try { await db.keyValue.delete(`${BUNDLE_PREFIX}${id}`); } catch { await this.deps.database.setKv(`${BUNDLE_PREFIX}${id}`, null as unknown as DeployBundle); }
            const idx = (await this.deps.database.getKv<string[]>(BUNDLE_INDEX)) ?? [];
            await this.deps.database.setKv(BUNDLE_INDEX, idx.filter((x) => x !== id));
        } catch (e) {
            LOGGER.warn('remove bundle failed', { error: e instanceof Error ? e.message : String(e) });
        }
    }

    async getLogs(bundleId: string): Promise<import('../../contracts/deploy').DeployLog[]> {
        const b = await this.getBundle(bundleId);
        if (!b) throw new Error(`Bundle not found: ${bundleId}`);
        // BLOCKED-RUNTIME: real tail would stream from filesystem/cloud
        return b.logs;
    }
}
