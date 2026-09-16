/**
 * ArgTech → Consensus Bridge — D2.2 minimal real integration (no second runtime).
 *
 * Canonical point: DebateConsensusEngine (existing, canonical) optionally receives
 * ArgTech bonus via setArgTechBonus(). This bridge computes bonus from
 * ArgTechService state (Dung grounded / Toulmin completeness / Brier) without
 * creating a parallel judging pipeline.
 *
 * Kialo live >12 args → RUNTIME-PENDING (throw cap in preferredExtensions keeps it blocked).
 * Brier live calibration → RUNTIME-PENDING (needs real resolved claims).
 * Provenance not touched (D2.3).
 */

import type { IArgTechService } from '../../contracts/debateplus';
import type { DebateConsensusEngine } from '../debate-runtime/debate-consensus';

/**
 * N1 — Check Toulmin persisted result before using it.
 * Only Dal-kv toulmin/* entries with valid {completeness 0..1, gaps} are considered.
 * Valid = completeness number 0..1, gaps array. Invalid → skip. No valid → no Toulmin bonus.
 */
async function toulminBonus(argTech: IArgTechService): Promise<{ bonus: number; hasData: boolean; validCount: number }> {
    // ArgTechService does not expose list, so we probe via dal via private access if available
    const dal = (argTech as unknown as { dal?: { kv: { get?: (k: string) => Promise<unknown>; list?: (prefix: string) => Promise<Array<{ id: string; value: unknown }>> } } }).dal;
    if (!dal?.kv) return { bonus: 0, hasData: false, validCount: 0 };
    try {
        // Try list toulmin/* if available (used in argtech-service for claimtree/*)
        const list = dal.kv.list ? await dal.kv.list('toulmin/') : [];
        const cards = Array.isArray(list) ? list.map((r: { value: unknown }) => r.value as { completeness?: unknown; gaps?: unknown }).filter(Boolean) : [];
        const valid = cards.filter((c) => typeof c.completeness === 'number' && c.completeness >= 0 && c.completeness <= 1 && Array.isArray(c.gaps));
        if (valid.length === 0) return { bonus: 0, hasData: false, validCount: 0 };
        const avg = valid.reduce((s, c) => s + (c.completeness as number), 0) / valid.length;
        // Bounded deterministic: completeness 0..1 → bonus (avg - 0.5) * 0.12 → range -0.06..+0.06
        // 0.5 → 0, 1.0 → +0.06, 0.0 → -0.06; deterministic, no double count with Dung
        const bonus = (avg - 0.5) * 0.12;
        return { bonus: Math.max(-0.06, Math.min(0.06, bonus)), hasData: true, validCount: valid.length };
    } catch {
        return { bonus: 0, hasData: false, validCount: 0 };
    }
}

export async function computeArgTechBonus(argTech: IArgTechService): Promise<number | null> {
    let bonus = 0;
    let hasData = false;

    // Dung grounded: non-empty → +0.04 (deterministic, bounded)
    try {
        const grounded = await argTech.groundedExtension();
        if (grounded.length > 0) {
            bonus += 0.04;
            hasData = true;
        }
    } catch {
        // capped >12 or no args → no Dung bonus
    }

    // Toulmin: only if valid persisted result exists, bounded -0.06..+0.06, deterministic via avg completeness
    const t = await toulminBonus(argTech);
    if (t.hasData) {
        bonus += t.bonus;
        hasData = true;
    }
    // Brier: live pending — not applied in N1 (needs resolved happened)

    // No double count: Dung and Toulmin are independent signals (Dung = structure, Toulmin = completeness), sum is bounded -0.2..0.2 via final clamp
    if (!hasData) return null;
    return Math.max(-0.2, Math.min(0.2, bonus));
}

/** Convenience: apply bridge to engine in one call (caller opts in). */
export async function applyArgTechToConsensus(
    engine: DebateConsensusEngine,
    argTech: IArgTechService,
): Promise<void> {
    const bonus = await computeArgTechBonus(argTech);
    engine.setArgTechBonus(bonus);
}
