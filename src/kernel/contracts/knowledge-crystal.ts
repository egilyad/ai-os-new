import type { ILifecycle } from './lifecycle';
import type {
    Crystal,
    CrystalContent,
    CrystalId,
    CrystalQuery,
    CrystalSearchHit,
    ProposeCrystalInput,
} from '../types/crystal-types';

export interface ICrystalVaultService extends ILifecycle {
    /** Propose a new crystal — creates status 'semi', confidence 0.3. */
    propose(input: ProposeCrystalInput): Promise<CrystalId>;
    /** Validate a crystal through a debate — updates validation + confidence. */
    validate(crystalId: CrystalId, input: ValidateCrystalInput): Promise<Crystal | null>;
    /** Promote a crystal from semi → crystal. Emits knowledge:crystal:formed. */
    crystallize(crystalId: CrystalId): Promise<Crystal | null>;
    /** Supersede a crystal with new content — old becomes superseded. */
    supersede(
        crystalId: CrystalId,
        newContent: CrystalContent,
        reason: string,
    ): Promise<Crystal | null>;
    /** Mark a crystal as refuted. */
    refute(crystalId: CrystalId, reason: string): Promise<Crystal | null>;
    /** Get a crystal by id (latest version). */
    get(crystalId: CrystalId): Promise<Crystal | null>;
    /** Get a specific version of a crystal. */
    getVersion(crystalId: CrystalId, version: number): Promise<Crystal | null>;
    /** Query crystals — semantic search + filters. */
    query(q: CrystalQuery): Promise<Crystal[]>;
    /** Semantic search returning ranked hits. */
    search(query: string, limit?: number): Promise<CrystalSearchHit[]>;
    /** Get crystals that semantically contradict the given one. */
    getContradicting(crystalId: CrystalId): Promise<Crystal[]>;
    /** Link a lens to a crystal. */
    linkToLens(crystalId: CrystalId, lensId: string): Promise<Crystal | null>;
    /** Get all version history for a crystal. */
    getHistory(crystalId: CrystalId): Promise<Crystal[]>;
    list(opts?: { status?: string; domain?: string }): Promise<Crystal[]>;
}

export interface ValidateCrystalInput {
    debateId: string;
    proArguments: string[];
    conArguments: string[];
    reviewers: string[];
    confidence?: number;
    humanApproved?: boolean;
}
