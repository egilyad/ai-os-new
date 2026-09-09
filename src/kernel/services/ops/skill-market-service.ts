/**
 * SkillMarketService — Wave 5.2 (marketplace + manifests, additive).
 *
 * Own registry of skill manifests with install lifecycle + audit. The existing
 * SkillService (cognitive skills runtime) is untouched — a future bridge can
 * materialize installed manifests into it.
 */
import type { OpsRepository } from '../../dal/ops-repository';
import type { IAuditService, ISkillMarketService } from '../../contracts/ops';
import type { SkillManifest } from '../../types/ops-types';
import { genId } from '../../../utils/gen-id';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('SkillMarket');

function now(): number {
    return Date.now();
}

export class SkillMarketService implements ISkillMarketService {
    constructor(
        private repo: OpsRepository,
        private audit: IAuditService,
    ) {}

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    async publish(input: {
        name: string;
        version: string;
        description: string;
        permissions?: string[];
        entry?: string;
        author?: string;
    }): Promise<SkillManifest> {
        const t = now();
        const manifest: SkillManifest = {
            id: genId('skill'),
            name: input.name,
            version: input.version,
            description: input.description,
            permissions: input.permissions ? [...input.permissions] : [],
            entry: input.entry ?? 'index.ts',
            author: input.author,
            installed: false,
            createdAt: t,
            updatedAt: t,
        };
        await this.repo.putSkill(manifest);
        await this.audit.append('skills', 'skill.published', manifest.id, `${manifest.name}@${manifest.version}`);
        return manifest;
    }

    async list(): Promise<SkillManifest[]> {
        const all = await this.repo.listSkills();
        for (const s of all) SkillMarketService.cache.set(s.id, s);
        return all;
    }

    async install(id: string): Promise<SkillManifest> {
        const s = await this.require(id);
        s.installed = true;
        s.updatedAt = now();
        await this.repo.putSkill(s);
        SkillMarketService.cache.set(id, s);
        await this.audit.append('skills', 'skill.installed', id, `${s.name}@${s.version}`);
        return s;
    }

    async uninstall(id: string): Promise<SkillManifest> {
        const s = await this.require(id);
        s.installed = false;
        s.updatedAt = now();
        await this.repo.putSkill(s);
        await this.audit.append('skills', 'skill.uninstalled', id, s.name);
        return s;
    }

    exportManifest(id: string): string {
        // Synchronous export from cache (populated by list()/install()).
        // Kept sync per contract so UI can download without awaiting.
        const cached = SkillMarketService.cache.get(id);
        if (!cached) throw new Error(`Manifest not cached: ${id} (call list() first)`);
        return JSON.stringify({ kind: 'skill-manifest', version: 1, manifest: cached }, null, 2);
    }

    /** Refresh the export cache (called by list()). */
    static cache = new Map<string, SkillManifest>();

    private async require(id: string): Promise<SkillManifest> {
        const s = await this.repo.getSkill(id);
        if (!s) throw new Error(`Skill not found: ${id}`);
        SkillMarketService.cache.set(id, s);
        return s;
    }
}
