import type {
    IKeyIntelligencePipeline,
    KeyIntelligenceInput,
    KeyImportReport,
    ParsedKeyResult,
    KeyRiskAssessment,
    RiskFactor,
    AccountGroup,
} from '../contracts/key-intelligence';
import { KeyFingerprints } from './key-management/key-fingerprints';
import type { ApiKey } from '../types/metrics-types';
import { safeJsonParse } from '../../kernel/utils/safe-json';

export interface AdapterHealthCheck {
    (
        provider: string,
        apiKey: string,
    ): Promise<{ valid: boolean; latency: number; models: string[]; error?: string }>;
}

interface PipelineDeps {
    fingerprints: KeyFingerprints;
    getExistingKeys: () => ApiKey[];
    verifyKey?: AdapterHealthCheck;
}

export class KeyIntelligencePipeline implements IKeyIntelligencePipeline {
    private deps: PipelineDeps;

    constructor(deps: PipelineDeps) {
        this.deps = deps;
    }

    /**
     * Parse rawText — supports both newline/comma-separated raw keys
     * and JSON arrays/objects with a `.key` field (e.g. backup exports).
     */
    private extractRawKeys(rawText: string): string[] {
        const trimmed = rawText.trim();
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
            try {
                const parsed = safeJsonParse(trimmed);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                return items
                    .map((item: Record<string, unknown>) => {
                        if (typeof item === 'string') return item;
                        if (item && typeof item.key === 'string') return item.key;
                        if (item && typeof item.apiKey === 'string') return item.apiKey;
                        return null;
                    })
                    .filter((k): k is string => typeof k === 'string' && k.length > 0);
            } catch {
                // Not valid JSON — fall through to line-based parsing
            }
        }
        return trimmed
            .split(/[\n,;]+/)
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
    }

    async run(input: KeyIntelligenceInput): Promise<KeyImportReport> {
        const rawKeys = this.extractRawKeys(input.rawText);

        const existingFps = new Set(input.existingKeys?.map((e) => e.fingerprint) || []);
        const existingApiKeys = this.deps.getExistingKeys();

        const parsed: ParsedKeyResult[] = [];
        const batchFps = new Map<string, string>();
        const riskAssessments: KeyRiskAssessment[] = [];
        const accountInfo = new Map<string, { accountId: string; label: string }>();
        let added = 0;
        let duplicates = 0;
        let invalid = 0;

        for (const raw of rawKeys) {
            const provider = this.deps.fingerprints.detectProvider(raw);
            const fingerprint = await this.deps.fingerprints.fingerprintKey(raw);
            const isValid = !!provider && !raw.includes(' ');

            const accountId = provider
                ? this.deps.fingerprints.extractAccountId(provider, raw)
                : undefined;
            const accountLabel = provider
                ? this.deps.fingerprints.extractAccountLabel(provider, raw)
                : undefined;

            const parsedEntry: ParsedKeyResult = {
                raw: raw.slice(0, 12) + '...',
                provider,
                fingerprint,
                isValid,
                validationError: isValid
                    ? undefined
                    : provider
                      ? 'Key contains spaces or invalid characters'
                      : 'Could not detect provider from key prefix',
                accountId,
            };
            parsed.push(parsedEntry);

            if (!isValid) {
                invalid++;
                continue;
            }

            const isDuplicate = existingFps.has(fingerprint) || batchFps.has(fingerprint);
            if (isDuplicate) {
                duplicates++;
                continue;
            }
            batchFps.set(fingerprint, raw);
            existingFps.add(fingerprint);
            added++;

            if (accountId && accountLabel) {
                accountInfo.set(fingerprint, { accountId, label: accountLabel });
            }

            const risk = await this.assessKeyRisk(fingerprint, provider, raw, existingApiKeys);
            riskAssessments.push(risk);
        }

        const groups = this.buildGroups(
            parsed.filter((p) => p.isValid),
            accountInfo,
        );

        const recommendations = this.generateRecommendations(parsed, groups, riskAssessments);

        return {
            totalInput: rawKeys.length,
            parsed,
            added,
            duplicates,
            invalid,
            groups,
            riskAssessments,
            recommendations,
            timestamp: Date.now(),
        };
    }

    async assessRisk(
        fingerprint: string,
        provider: string | null,
        rawKey?: string,
    ): Promise<KeyRiskAssessment> {
        return this.assessKeyRisk(
            fingerprint,
            provider || 'Unknown',
            rawKey || '',
            this.deps.getExistingKeys(),
        );
    }

    async groupByAccount(parsed: ParsedKeyResult[]): Promise<AccountGroup[]> {
        return this.buildGroups(parsed, null, true);
    }

    private async assessKeyRisk(
        fingerprint: string,
        provider: string,
        raw: string,
        existingKeys: ApiKey[],
    ): Promise<KeyRiskAssessment> {
        const factors: RiskFactor[] = [];
        const existing = existingKeys.filter((k) => k.provider === provider);

        const existingFps = new Set<string>();
        for (const k of existing) {
            existingFps.add(await this.deps.fingerprints.fingerprintKey(k.key));
        }
        if (existingFps.has(fingerprint)) {
            factors.push({
                type: 'duplicate',
                severity: 'high',
                description: `Key already exists for ${provider}`,
            });
        }

        if (provider === 'Unknown' || !provider) {
            factors.push({
                type: 'invalid_format',
                severity: 'high',
                description: 'Could not determine provider from key prefix',
            });
        }

        if (raw && provider && provider !== 'Unknown' && this.deps.verifyKey) {
            try {
                const health = await this.deps.verifyKey(provider, raw);
                if (!health.valid) {
                    factors.push({
                        type: 'high_error_rate',
                        severity: 'critical',
                        description: `Key failed health check: ${health.error || 'invalid or unreachable'}`,
                    });
                } else if (health.models.length === 0) {
                    factors.push({
                        type: 'high_error_rate',
                        severity: 'high',
                        description: 'Key is valid but returned no available models',
                    });
                } else {
                    factors.push({
                        type: 'high_error_rate',
                        severity: 'low',
                        description: `Key verified — ${health.models.length} models available (${health.latency}ms)`,
                    });
                }
            } catch {
                factors.push({
                    type: 'high_error_rate',
                    severity: 'critical',
                    description: 'Health check request failed',
                });
            }
        }

        const highErrorKeys = existing.filter((k) => {
            const total = (k.stats?.successCount || 0) + (k.stats?.errorCount || 0);
            return total > 10 && (k.stats?.errorCount || 0) / total > 0.3;
        });
        if (highErrorKeys.length > 0) {
            factors.push({
                type: 'high_error_rate',
                severity: 'medium',
                description: `${highErrorKeys.length} existing ${provider} keys have >30% error rate`,
            });
        }

        const highLatencyKeys = existing.filter((k) => (k.stats?.avgLatency || 0) > 5000);
        if (highLatencyKeys.length > 0) {
            factors.push({
                type: 'high_latency',
                severity: 'low',
                description: `${highLatencyKeys.length} existing ${provider} keys have avg latency >5s`,
            });
        }

        const score = this.calculateRiskScore(factors);
        const level = this.riskLevel(score);

        return {
            fingerprint,
            raw: raw.slice(0, 12) + '...',
            provider,
            riskScore: score,
            riskLevel: level,
            factors,
        };
    }

    private buildGroups(
        parsed: ParsedKeyResult[],
        accountInfo: Map<string, { accountId: string; label: string }> | null,
        fromExisting?: boolean,
    ): AccountGroup[] {
        const groups = new Map<string, AccountGroup>();

        for (const p of parsed) {
            if (!p.provider) continue;

            let accountId: string;
            let label: string;

            if (fromExisting || !accountInfo || !accountInfo.has(p.fingerprint)) {
                accountId = `${p.provider.toLowerCase()}-default`;
                label = `${p.provider} Account`;
            } else {
                const info = accountInfo.get(p.fingerprint)!;
                accountId = info.accountId;
                label = info.label;
            }

            const key = `${p.provider}::${accountId}`;
            const existing = groups.get(key);
            if (existing) {
                existing.keyCount++;
                if (!existing.keyFingerprints.includes(p.fingerprint)) {
                    existing.keyFingerprints.push(p.fingerprint);
                }
            } else {
                groups.set(key, {
                    accountId,
                    provider: p.provider,
                    label,
                    keyCount: 1,
                    riskScore: 0,
                    keyFingerprints: [p.fingerprint],
                });
            }
        }

        return Array.from(groups.values());
    }

    private calculateRiskScore(factors: RiskFactor[]): number {
        const weights: Record<string, number> = { critical: 40, high: 25, medium: 15, low: 5 };
        return Math.min(
            100,
            factors.reduce((sum, f) => sum + (weights[f.severity] || 0), 0),
        );
    }

    private riskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
        if (score >= 70) return 'critical';
        if (score >= 40) return 'high';
        if (score >= 15) return 'medium';
        return 'low';
    }

    private generateRecommendations(
        parsed: ParsedKeyResult[],
        groups: AccountGroup[],
        risks: KeyRiskAssessment[],
    ): string[] {
        const recs: string[] = [];
        const byProvider = new Map<string, number>();
        for (const p of parsed) {
            if (p.provider) byProvider.set(p.provider, (byProvider.get(p.provider) || 0) + 1);
        }

        for (const [provider, count] of byProvider) {
            if (count > 3) {
                recs.push(
                    `Consider labeling ${provider} keys by purpose (prod/staging/test) for easier management`,
                );
            }
            if (count > 5) {
                recs.push(
                    `You have ${count} ${provider} keys — review if some are unused or can be consolidated`,
                );
            }
        }

        for (const group of groups) {
            if (group.keyCount > 2) {
                recs.push(
                    `Account "${group.label}" has ${group.keyCount} keys — consider distributing across multiple accounts for redundancy`,
                );
            }
        }

        const hasMultiAccount = groups.filter((g) => !g.accountId.endsWith('-default')).length > 0;
        if (!hasMultiAccount && groups.some((g) => g.label.endsWith('Account') && g.keyCount > 1)) {
            recs.push(
                `Multiple keys share the same default account — use provider-specific keys (Cloudflare account IDs, OpenAI project keys) to enable per-account management`,
            );
        }

        const highRisks = risks.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical');
        if (highRisks.length > 0) {
            recs.push(
                `${highRisks.length} key(s) have elevated risk — review health check failures and error rates`,
            );
        }

        const undetected = parsed.filter((p) => !p.provider);
        if (undetected.length > 0) {
            recs.push(
                `${undetected.length} key(s) couldn't be auto-detected — verify they belong to a supported provider`,
            );
        }
        return recs;
    }
}
