import type {
    ISystemStatusService,
    SystemStatusReport,
    SystemStatusValue,
} from '../contracts/system-status';
import type { IGroupManager } from '../contracts/group-manager';
import type { IKeyStateStore } from '../contracts/key-state';
import type { KeyService } from './key-management/key-service';
import { rootLogger } from './logger-service';

const LOGGER = rootLogger.child('SystemStatusService');

export interface SystemStatusServiceDeps {
    groupManager: IGroupManager;
    keyService: KeyService;
    keyStateStore?: IKeyStateStore;
}

/**
 * Computes system status from live data — never stores state, never introduces new truth.
 * Aggregates GroupManager.ready, key count, passport coverage, and projection sync.
 */
export class SystemStatusService implements ISystemStatusService {
    private deps: SystemStatusServiceDeps;

    constructor(deps: SystemStatusServiceDeps) {
        this.deps = deps;
    }

    getStatus(): SystemStatusReport {
        try {
            return this._computeStatus();
        } catch (e) {
            LOGGER.error('SystemStatusService', 'getStatus failed', { error: String(e) });
            return {
                status: 'DEGRADED',
                summary: `Status computation failed: ${String(e).slice(0, 120)}`,
                areas: {
                    groupManager: 'loading',
                    keys: 'empty',
                    passports: 'missing',
                    projections: 'unavailable',
                },
                warnings: [`Status computation error: ${String(e).slice(0, 200)}`],
                timestamp: Date.now(),
            };
        }
    }

    private _computeStatus(): SystemStatusReport {
        const { groupManager, keyService, keyStateStore } = this.deps;
        const warnings: string[] = [];

        // Area: GroupManager
        const gmReady = groupManager.ready;
        const areaGroupManager: 'ready' | 'loading' = gmReady ? 'ready' : 'loading';

        // Area: Keys — single source of truth (keyService.getKeys)
        const rawKeys = keyService.getKeys();
        const totalKeys = rawKeys.length;
        const totalRawKeys = rawKeys.length;
        const activeKeys = rawKeys.filter((k) => k.status === 'active').length;
        const brokenKeys = rawKeys.filter((k) => k.status === 'error').length;

        let areaKeys: 'populated' | 'empty' | 'partial' | 'degraded';
        if (totalKeys === 0) {
            areaKeys = 'empty';
        } else if (brokenKeys === totalKeys) {
            areaKeys = 'degraded';
        } else if (activeKeys < totalKeys) {
            areaKeys = 'partial';
        } else {
            areaKeys = 'populated';
        }

        // Area: Passports
        let passportsFullCoverage = 0;
        for (const k of rawKeys) {
            if (groupManager.getPassport(k.id)) passportsFullCoverage++;
        }
        let areaPassports: 'full' | 'partial' | 'missing';
        if (totalRawKeys === 0) {
            areaPassports = 'missing';
        } else if (passportsFullCoverage === totalRawKeys) {
            areaPassports = 'full';
        } else if (passportsFullCoverage > 0) {
            areaPassports = 'partial';
            warnings.push(`${totalRawKeys - passportsFullCoverage} key(s) without passport`);
        } else {
            areaPassports = 'missing';
            warnings.push('No keys have passports');
        }

        // Area: Projections
        let areaProjections: 'synced' | 'stale' | 'unavailable';
        const projSnapshot = keyStateStore?.getAll();
        if (!projSnapshot) {
            areaProjections = 'unavailable';
        } else if (projSnapshot.length === totalKeys) {
            areaProjections = 'synced';
        } else {
            areaProjections = 'stale';
            warnings.push(`Projection has ${projSnapshot.length} entries, expected ${totalKeys}`);
        }

        // Overall status
        let status: SystemStatusValue;
        let summary: string;

        if (!gmReady) {
            status = 'LOADING';
            summary = 'System initializing — GroupManager not ready';
        } else if (totalKeys === 0) {
            status = 'EMPTY';
            summary = 'No API keys configured';
        } else if (areaPassports === 'missing' || areaKeys === 'degraded') {
            status = 'DEGRADED';
            summary = `System running with issues: ${warnings.length} warning(s)`;
        } else if (areaPassports === 'partial' || areaProjections === 'stale') {
            status = 'DEGRADED';
            summary = `System partially consistent: ${warnings.length} warning(s)`;
        } else {
            status = 'READY';
            summary = `${totalKeys} key(s), ${activeKeys} active, all passports synced`;
        }

        LOGGER.debug('SystemStatusService', `Status computed: ${status} — ${summary}`);
        if (warnings.length > 0) {
            LOGGER.warn('SystemStatusService', `Warnings: ${warnings.join('; ')}`);
        }

        return {
            status,
            summary,
            areas: {
                groupManager: areaGroupManager,
                keys: areaKeys,
                passports: areaPassports,
                projections: areaProjections,
            },
            warnings,
            timestamp: Date.now(),
        };
    }
}
