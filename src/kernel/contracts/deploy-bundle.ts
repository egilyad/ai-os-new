/**
 * Deploy Bundle contracts — GAP G4 (STATIC GAP CLOSURE).
 *
 * Additive over existing DeployService (which stays MOCK/localStorage).
 * Bundle is local-first: env manifest + start script + file manifest.
 * Real zip / filesystem / cloud push = BLOCKED-RUNTIME until run on clean machine.
 * Real zip generation (JSZip) and docker build = PROVIDER-PENDING if not wired.
 */

import type { ILifecycle } from './lifecycle';
import type { DeployEnvironment, DeployTarget, DeployLog } from './deploy';

export interface DeployBundle {
    id: string;
    configId: string;
    name: string;
    target: DeployTarget;
    environment: DeployEnvironment;
    /** Env manifest — keys only for secrets (value REDACTED), non-secret values included. */
    envManifest: Record<string, string>;
    /** Start script for target (Dockerfile / vercel.json / start.sh). */
    startScript: string;
    /** File manifest stub (real files would come from workspaceService, here from config). */
    files: Array<{ path: string; kind: 'manifest' | 'script' | 'config' }>;
    /** Hash of manifest for integrity (sha256 stub). */
    manifestHash: string;
    logs: DeployLog[];
    createdAt: number;
}

export interface IDeployBundleService extends ILifecycle {
    /** Build local bundle from DeployConfig (no cloud). */
    buildBundle(configId: string): Promise<DeployBundle>;
    getBundle(id: string): Promise<DeployBundle | null>;
    listBundles(configId?: string): Promise<DeployBundle[]>;
    removeBundle(id: string): Promise<void>;
    /** Stub log stream — returns stored logs (real tail = BLOCKED-RUNTIME). */
    getLogs(bundleId: string): Promise<DeployLog[]>;
}
