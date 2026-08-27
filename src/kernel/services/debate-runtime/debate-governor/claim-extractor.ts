import type { Claim } from './types';

let _claimCounter = 0;

function nextClaimId(): string {
    _claimCounter = (_claimCounter + 1) >>> 0;
    return `c${Date.now().toString(36)}-${_claimCounter}-${crypto.randomUUID().slice(0, 6)}`;
}

function estimateConfidence(text: string): number {
    const certaintyMarkers =
        /\b(definitely|certainly|undoubtedly|absolutely|clearly|obviously|always|never|must|without doubt|unquestionably|undeniably|in fact|indeed)\b/gi;
    const hedgingMarkers =
        /\b(maybe|perhaps|possibly|might|could|seems|appears|i think|i believe|probably|likely|somewhat|generally|often|sometimes|i suspect|i guess|i assume|i suppose|it seems|it appears)\b/gi;
    const certainty = (text.match(certaintyMarkers) || []).length;
    const hedging = (text.match(hedgingMarkers) || []).length;
    const score = 0.5 + (certainty - hedging) * 0.05;
    return Math.max(0.3, Math.min(0.95, score));
}

export function extractClaims(
    text: string,
    sourceArgumentId: string,
    speaker: string,
    role: string,
    round: number,
    agentId?: string,
    confidence?: number,
): Claim[] {
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => {
            const clean = s.replace(/[[\]()]/g, '').trim();
            return clean.length > 25 && !clean.startsWith('-') && !clean.startsWith('*');
        });

    const claims: Claim[] = [];
    const seen = new Set<string>();

    for (const raw of sentences) {
        const normal = raw
            .toLowerCase()
            .replace(/[^a-zа-яё0-9\s]/g, '')
            .trim();
        if (normal.length < 30) continue;
        const fingerprint = normal.split(/\s+/).slice(0, 8).join(' ');
        if (seen.has(fingerprint)) continue;
        seen.add(fingerprint);

        claims.push({
            id: nextClaimId(),
            text: raw,
            agentId: agentId ?? speaker,
            round,
            confidence: confidence ?? estimateConfidence(raw),
            sourceArgumentId,
            speaker,
            role,
            status: 'active',
            supportCount: 0,
            challengeCount: 0,
            createdAt: Date.now(),
        });
    }

    return claims;
}
