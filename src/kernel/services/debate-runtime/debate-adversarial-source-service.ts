import type {
    SourceVerificationResult,
    IAdversarialSourceService,
} from '../../contracts/debate-adversarial-source';
import { rootLogger } from '../logger-service';
const LOGGER = rootLogger.child('AdversarialSource');

const FETCH_TIMEOUT_MS = 5000;
const MAX_VERIFICATIONS_PER_CALL = 3;

/**
 * P0.3 Adversarial Source Poisoning.
 *
 * When an opponent cites a source (URL), verify it in real-time:
 * 1. Extract URLs from text
 * 2. Fetch source content
 * 3. Compare claim vs source via Jaccard similarity
 * 4. If mismatch → inject warning into prompt
 */
export class AdversarialSourceService implements IAdversarialSourceService {
    async verifyClaims(text: string, signal?: AbortSignal): Promise<SourceVerificationResult[]> {
        if (!text || text.length < 50) return [];

        const urls = this._extractUrls(text);
        if (urls.length === 0) return [];

        const results: SourceVerificationResult[] = [];
        const toCheck = urls.slice(0, MAX_VERIFICATIONS_PER_CALL);

        for (const { url, claimContext } of toCheck) {
            if (signal?.aborted) break;

            try {
                const sourceText = await this._fetchSource(url, signal);
                if (!sourceText || sourceText.length < 20) continue;

                const score = this._jaccardSimilarity(claimContext, sourceText);
                const isDistorted = score < 0.15;

                if (isDistorted) {
                    const excerpt = sourceText.slice(0, 300).replace(/\s+/g, ' ').trim();
                    results.push({
                        claimContext: claimContext.slice(0, 200),
                        sourceUrl: url,
                        sourceExcerpt: excerpt,
                        matchScore: score,
                        isDistorted: true,
                        warning: this._buildWarning(claimContext, url, excerpt),
                    });
                }
            } catch {
                LOGGER.warn('AdversarialSource', 'Failed to verify source', { url });
            }
        }

        return results;
    }

    private _extractUrls(text: string): Array<{ url: string; claimContext: string }> {
        const urlPattern = /https?:\/\/[^\s)]+/gi;
        const results: Array<{ url: string; claimContext: string }> = [];
        const seen = new Set<string>();

        let match: RegExpExecArray | null;
        while ((match = urlPattern.exec(text)) !== null) {
            const url = match[0].replace(/[.)]+$/, '');
            if (seen.has(url)) continue;
            seen.add(url);

            const start = Math.max(0, match.index - 150);
            const end = Math.min(text.length, match.index + match[0].length + 150);
            const claimContext = text.slice(start, end).replace(/\s+/g, ' ').trim();

            results.push({ url, claimContext });
        }

        return results;
    }

    private async _fetchSource(url: string, signal?: AbortSignal): Promise<string | null> {
        try {
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(new Error('FetchTimeout')), FETCH_TIMEOUT_MS);

            const mergedSignal = signal
                ? AbortSignal.any
                    ? AbortSignal.any([signal, ctrl.signal])
                    : ctrl.signal
                : ctrl.signal;

            const res = await fetch(url, { signal: mergedSignal });
            clearTimeout(timer);

            if (!res.ok) return null;

            const html = await res.text();
            const text = this._extractTextFromHtml(html);
            return text || null;
        } catch {
            return null;
        }
    }

    private _extractTextFromHtml(html: string): string {
        const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        const content = body ? body[1]! : html;
        const stripped = content
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&[a-z]+;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        return stripped.slice(0, 3000);
    }

    private _jaccardSimilarity(a: string, b: string): number {
        const wordsA = this._wordSet(a);
        const wordsB = this._wordSet(b);
        if (wordsA.size < 5 || wordsB.size < 5) return 0;
        const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)));
        const union = new Set([...wordsA, ...wordsB]);
        return intersection.size / union.size;
    }

    private _wordSet(text: string): Set<string> {
        return new Set(
            text
                .toLowerCase()
                .replace(/[^a-zа-яё0-9\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 3),
        );
    }

    private _buildWarning(claimContext: string, url: string, sourceExcerpt: string): string {
        const truncatedClaim = claimContext.slice(0, 150).replace(/\s+/g, ' ').trim();
        return `⚠️ SOURCE VERIFICATION: The source cited by your opponent (${url}) does NOT match the claim being made.

Claim context: "${truncatedClaim}..."

The original source actually says: "${sourceExcerpt.slice(0, 200)}"

You should point out this discrepancy in your response.`;
    }

    destroy(): void {
        // No subscriptions or timers to clean up — stateless service
    }
}
