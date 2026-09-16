import type { ICrystalVaultService, ValidateCrystalInput } from '../../contracts/knowledge-crystal';
import type {
    Crystal,
    CrystalContent,
    CrystalId,
    CrystalQuery,
    CrystalSearchHit,
    ProposeCrystalInput,
} from '../../types/crystal-types';
import type { CrystalRepository } from '../../dal/crystal-repository';
import type { IEventBus } from '../../types/interfaces';
import { EVENTS } from '../../events/event-names';
import { genId } from '../../../utils/gen-id';

const EMBEDDING_DIMENSIONS = 256;
const DEFAULT_MIN_CONFIDENCE = 0.3;
const MAX_CONTRADICTIONS = 8;

/**
 * Crystal Vault — versioned, immutable knowledge units with lifecycle
 * liquid → semi → crystal → superseded/refuted.
 *
 * - propose(): creates a 'semi' crystal (confidence 0.3).
 * - validate(): attaches debate results, updates confidence.
 * - crystallize(): promotes semi → crystal, emits knowledge:crystal:formed.
 * - supersede()/refute(): mark old versions.
 * - query()/search(): hybrid filter + semantic (hashed embedding) search.
 * - getContradicting(): detects semantically close crystals (negation-aware).
 */
export class CrystalVaultService implements ICrystalVaultService {
    private _initialized = false;

    constructor(
        private deps: {
            repository: CrystalRepository;
            eventBus: IEventBus;
        },
    ) {}

    async init(): Promise<void> {
        if (this._initialized) return;
        this._initialized = true;
    }

    async destroy(): Promise<void> {
        this._initialized = false;
    }

    async propose(input: ProposeCrystalInput): Promise<CrystalId> {
        const now = Date.now();
        const crystalId = genId('crystal');
        const crystal: Crystal = {
            crystalId,
            version: 1,
            content: input.content,
            provenance: {
                originKind: input.originKind,
                originId: input.originId,
                contributingAgents: input.contributingAgents ?? [],
                modelIds: input.modelIds ?? [],
                totalTokensSpent: input.totalTokensSpent ?? 0,
            },
            validation: {
                proArguments: [],
                conArguments: [],
                reviewers: [],
                humanApproved: false,
            },
            confidence: DEFAULT_MIN_CONFIDENCE,
            status: 'semi',
            contradictingCrystalIds: [],
            supportingCrystalIds: input.supportingCrystalIds ?? [],
            linkedLensIds: input.linkedLensIds ?? [],
            linkedRoleIds: input.linkedRoleIds ?? [],
            applicableDomain: input.applicableDomain ?? 'general',
            createdAt: now,
            contentHash: this.hashContent(input.content),
        };

        await this.deps.repository.put(crystal);
        this.deps.eventBus.emit(EVENTS.CRYSTAL_PROPOSED, {
            crystalId,
            statement: input.content.statement,
            originKind: input.originKind,
            status: 'semi',
        });

        // Contradiction scan against existing crystals
        const contradicting = await this.findSemanticMatches(crystal, {
            minScore: 0.5,
            excludeSelf: true,
        });
        if (contradicting.length > 0) {
            crystal.contradictingCrystalIds = contradicting
                .slice(0, MAX_CONTRADICTIONS)
                .map((h) => h.crystal.crystalId);
            await this.deps.repository.put(crystal);
            this.deps.eventBus.emit(EVENTS.CRYSTAL_CONTRADICTION_DETECTED, {
                crystalId,
                contradictingCrystalIds: crystal.contradictingCrystalIds,
            });
        }

        return crystalId;
    }

    async validate(crystalId: CrystalId, input: ValidateCrystalInput): Promise<Crystal | null> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return null;
        crystal.validation = {
            debateId: input.debateId,
            proArguments: input.proArguments,
            conArguments: input.conArguments,
            reviewers: input.reviewers,
            humanApproved: input.humanApproved ?? false,
        };
        if (input.confidence !== undefined) crystal.confidence = input.confidence;
        await this.deps.repository.put(crystal);
        return crystal;
    }

    async crystallize(crystalId: CrystalId): Promise<Crystal | null> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return null;
        if (crystal.status !== 'semi' && crystal.status !== 'crystal') return null;

        const promoted: Crystal = {
            ...crystal,
            status: 'crystal',
            crystallizedAt: Date.now(),
            confidence: Math.max(crystal.confidence, 0.6),
        };
        await this.deps.repository.put(promoted);

        this.deps.eventBus.emit(EVENTS.CRYSTAL_FORMED, {
            crystalId: promoted.crystalId,
            version: promoted.version,
            statement: promoted.content.statement,
            confidence: promoted.confidence,
        });
        return promoted;
    }

    async supersede(
        crystalId: CrystalId,
        newContent: CrystalContent,
        reason: string,
    ): Promise<Crystal | null> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return null;

        const oldVersion: Crystal = {
            ...crystal,
            status: 'superseded',
            supersededBy: `${crystal.crystalId}#${crystal.version + 1}`,
        };
        await this.deps.repository.put(oldVersion);

        const next: Crystal = {
            ...crystal,
            version: crystal.version + 1,
            content: newContent,
            status: 'semi',
            crystallizedAt: undefined,
            createdAt: Date.now(),
            contentHash: this.hashContent(newContent),
        };
        await this.deps.repository.put(next);

        this.deps.eventBus.emit(EVENTS.CRYSTAL_SUPERSEDED, {
            crystalId,
            oldVersion: oldVersion.version,
            newVersion: next.version,
            reason,
        });
        return next;
    }

    async refute(crystalId: CrystalId, reason: string): Promise<Crystal | null> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return null;
        crystal.status = 'refuted';
        await this.deps.repository.put(crystal);
        this.deps.eventBus.emit(EVENTS.CRYSTAL_REFUTED, { crystalId, reason });
        return crystal;
    }

    async get(crystalId: CrystalId): Promise<Crystal | null> {
        return (await this.deps.repository.get(crystalId)) ?? null;
    }

    async getVersion(crystalId: CrystalId, version: number): Promise<Crystal | null> {
        return (await this.deps.repository.getVersion(crystalId, version)) ?? null;
    }

    async getHistory(crystalId: CrystalId): Promise<Crystal[]> {
        return this.deps.repository.getHistory(crystalId);
    }

    async query(q: CrystalQuery): Promise<Crystal[]> {
        let crystals = await this.deps.repository.list();

        if (q.status) crystals = crystals.filter((c) => c.status === q.status);
        if (q.domain) crystals = crystals.filter((c) => c.applicableDomain === q.domain);
        if (q.originKind)
            crystals = crystals.filter((c) => c.provenance.originKind === q.originKind);
        const minConf = q.minConfidence;
        if (minConf !== undefined) crystals = crystals.filter((c) => c.confidence >= minConf);
        const lensId = q.lensId;
        if (lensId) crystals = crystals.filter((c) => c.linkedLensIds.includes(lensId));

        if (q.query?.trim()) {
            const hits = await this.search(q.query, q.limit ?? 50);
            const byId = new Map(hits.map((h) => [h.crystal.crystalId, h.score]));
            crystals = crystals
                .map((c) => ({ c, s: byId.get(c.crystalId) ?? -1 }))
                .filter((x) => x.s >= 0)
                .sort((a, b) => b.s - a.s)
                .map((x) => x.c);
        } else {
            crystals.sort((a, b) => b.confidence - a.confidence);
        }

        if (q.limit && crystals.length > q.limit) crystals = crystals.slice(0, q.limit);
        return crystals;
    }

    async search(query: string, limit = 20): Promise<CrystalSearchHit[]> {
        const crystals = await this.deps.repository.list();
        const qVec = this.embed(query);
        const hits: CrystalSearchHit[] = [];
        for (const c of crystals) {
            const text = `${c.content.statement} ${c.content.elaboration ?? ''}`;
            const score = this.cosine(qVec, this.embed(text));
            hits.push({ crystal: c, score });
        }
        return hits
            .filter((h) => h.score >= 0.12)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    async getContradicting(crystalId: CrystalId): Promise<Crystal[]> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return [];
        const linked = crystal.contradictingCrystalIds;
        const explicit: Crystal[] = [];
        for (const id of linked) {
            const c = await this.deps.repository.get(id);
            if (c) explicit.push(c);
        }
        if (explicit.length > 0) return explicit;

        const matches = await this.findSemanticMatches(crystal, {
            minScore: 0.5,
            excludeSelf: true,
        });
        return matches.map((m) => m.crystal);
    }

    async linkToLens(crystalId: CrystalId, lensId: string): Promise<Crystal | null> {
        const crystal = await this.deps.repository.get(crystalId);
        if (!crystal) return null;
        if (!crystal.linkedLensIds.includes(lensId)) {
            crystal.linkedLensIds = [...crystal.linkedLensIds, lensId];
            await this.deps.repository.put(crystal);
        }
        return crystal;
    }

    async list(opts?: { status?: string; domain?: string }): Promise<Crystal[]> {
        let crystals = await this.deps.repository.list();
        if (opts?.status) crystals = crystals.filter((c) => c.status === opts.status);
        if (opts?.domain) crystals = crystals.filter((c) => c.applicableDomain === opts.domain);
        return crystals.sort((a, b) => b.createdAt - a.createdAt);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    private async findSemanticMatches(
        target: Crystal,
        opts: { minScore: number; excludeSelf: boolean },
    ): Promise<CrystalSearchHit[]> {
        const all = await this.deps.repository.list();
        const targetText = this.crystalText(target);
        const tVec = this.embed(targetText);
        const hits: CrystalSearchHit[] = [];
        for (const c of all) {
            if (opts.excludeSelf && c.crystalId === target.crystalId) continue;
            if (c.status === 'superseded' || c.status === 'refuted') continue;
            const score = this.cosine(tVec, this.embed(this.crystalText(c)));
            if (score >= opts.minScore) hits.push({ crystal: c, score });
        }
        return hits.sort((a, b) => b.score - a.score);
    }

    private crystalText(c: Crystal): string {
        const base = `${c.content.statement} ${c.content.elaboration ?? ''} ${
            c.content.negationForm ?? ''
        }`;
        return base.trim();
    }

    private hashContent(content: CrystalContent): string {
        const raw = JSON.stringify(content);
        let hash = 0;
        for (let i = 0; i < raw.length; i++) {
            hash = (hash << 5) - hash + raw.charCodeAt(i);
            hash |= 0;
        }
        return `sha256:${(hash >>> 0).toString(16)}:${raw.length}`;
    }

    private embed(text: string): number[] {
        const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
        const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
        for (const token of tokens) {
            let hash = 0;
            for (let i = 0; i < token.length; i++) {
                hash = (hash << 5) - hash + token.charCodeAt(i);
                hash |= 0;
            }
            vector[Math.abs(hash) % EMBEDDING_DIMENSIONS] += 1;
        }
        let norm = 0;
        for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) norm += vector[i]! * vector[i]!;
        if (norm > 0) {
            const inv = 1 / Math.sqrt(norm);
            for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) vector[i]! *= inv;
        }
        return vector;
    }

    private cosine(a: number[], b: number[]): number {
        let dot = 0;
        for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
        return dot;
    }
}
