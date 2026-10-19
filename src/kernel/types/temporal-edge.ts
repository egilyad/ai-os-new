/**
 * Shared temporal-validity fields for relation edges (Zep/Graphiti-style).
 *
 * Distinction that matters:
 *   - `createdAt`  — when the row was written (record-insertion time).
 *   - `validFrom`  — when the relation becomes true in the modeled world.
 *   - `validTo`    — when it stops being true (exclusive; absent = still valid).
 *   - `observedAt` — when this system learned/observed the relation.
 */

export interface TemporalEdgeFields {
    /** World-time from which the relation holds. Defaults to createdAt when absent. */
    validFrom?: number;
    /** World-time until which the relation holds (exclusive). null/undefined = still valid. */
    validTo?: number | null;
    /** When the system observed the relation (may differ from validFrom). Defaults to createdAt. */
    observedAt?: number;
}

/**
 * True when the relation holds at `asOf`: it started at `validFrom` (falling
 * back to `createdAt`) and has not ended (`validTo` is exclusive; absent means
 * still valid).
 */
export function isEdgeValidAt(
    edge: TemporalEdgeFields & { createdAt?: number },
    asOf: number,
): boolean {
    const from = edge.validFrom ?? edge.createdAt ?? 0;
    const to = edge.validTo;
    return from <= asOf && (to == null || to > asOf);
}
