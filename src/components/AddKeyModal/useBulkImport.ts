import { useState, useCallback } from 'react';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useKeyStore } from '../../stores/useKeyStore';
import { useKeyIntelligence } from '../../stores/useKeyIntelligence';
import { useTranslation } from '../../i18n/useTranslation';
import { keyService } from '../../kernel/instances';
import type { ParsedKeyResult } from '../../kernel/contracts/key-intelligence';
import type { BulkImportReport } from './add-key-constants';
import { safeJsonParse } from '../../kernel/utils/safe-json';

export interface BulkImportState {
    bulkInput: string;
    setBulkInput: (v: string) => void;
    loading: boolean;
    error: string;
    setError: (v: string) => void;
    bulkReport: BulkImportReport | null;
    bulkProgress: { current: number; total: number } | null;
    runBulkImport: (account: string, group: string) => Promise<void>;
    reset: () => void;
}

export function useBulkImport(): BulkImportState {
    const { addKey, keys } = useKeyStore();
    const pipeline = useKeyIntelligence();
    const { t } = useTranslation();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bulkInput, setBulkInput] = useState('');
    const [bulkReport, setBulkReport] = useState<BulkImportReport | null>(null);
    const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(
        null,
    );

    const runBulkImport = useCallback(
        async (account: string, group: string) => {
            if (!bulkInput.trim()) {
                setError(t('add_key.error_paste'));
                return;
            }
            setLoading(true);
            setError('');
            setBulkReport(null);
            try {
                const existingFps = await Promise.all(
                    keys.map(async (k) => ({
                        fingerprint: await keyService.fingerprintKey(k.key),
                        provider: k.provider,
                        label: k.label,
                    })),
                );
                await pipeline.runPipeline({ rawText: bulkInput, existingKeys: existingFps });
                const r = pipeline.report;
                if (!r) throw new Error('Pipeline returned no report');
                const healthIssuesList: { provider: string; issue: string }[] = [];
                const report: BulkImportReport = {
                    added: r.added,
                    duplicates: r.duplicates,
                    invalid: r.invalid,
                    total: r.totalInput,
                    breakdown: {},
                    groups: r.groups,
                    healthIssues: healthIssuesList,
                };
                for (const p of r.parsed) {
                    const prov = p.provider || 'Custom';
                    if (!report.breakdown[prov])
                        report.breakdown[prov] = { added: 0, duplicates: 0, invalid: 0 };
                    if (p.isValid) report.breakdown[prov].added++;
                    else report.breakdown[prov].invalid++;
                }
                for (const risk of r.riskAssessments) {
                    const critical = risk.factors.find((f) => f.severity === 'critical');
                    if (critical)
                        healthIssuesList.push({
                            provider: risk.provider || 'Unknown',
                            issue: critical.description,
                        });
                }
                setBulkReport(report);

                if (r.added > 0) {
                    const parsedByFp = new Map<string, ParsedKeyResult>();
                    for (const p of r.parsed) if (p.isValid) parsedByFp.set(p.fingerprint, p);
                    const rawToLabel = new Map<string, string>();
                    const trimmedInput = bulkInput.trim();
                    let rawKeys: string[];
                    if (trimmedInput.startsWith('[') || trimmedInput.startsWith('{')) {
                        try {
                            const jsonParsed = safeJsonParse(trimmedInput);
                            const items = Array.isArray(jsonParsed) ? jsonParsed : [jsonParsed];
                            rawKeys = [];
                            for (const item of items) {
                                const raw = item?.key || item?.apiKey;
                                if (typeof raw === 'string' && raw.length > 0) {
                                    rawKeys.push(raw);
                                    if (item.label) rawToLabel.set(raw, String(item.label));
                                }
                            }
                        } catch {
                            rawKeys = bulkInput
                                .split(/[\n,;]+/)
                                .map((k) => k.trim())
                                .filter((k) => k.length > 0);
                        }
                    } else {
                        rawKeys = bulkInput
                            .split(/[\n,;]+/)
                            .map((k) => k.trim())
                            .filter((k) => k.length > 0);
                    }
                    setBulkProgress({ current: 0, total: rawKeys.length });
                    const addedFps = new Set<string>();
                    let processed = 0;
                    for (const raw of rawKeys) {
                        processed++;
                        setBulkProgress({ current: processed, total: rawKeys.length });
                        const fp = await keyService.fingerprintKey(raw);
                        const prov = keyService.detectProvider(raw) || 'Custom';
                        if (!(await keyService.verifyKey(prov, raw))) continue;
                        if (addedFps.has(fp)) continue;
                        addedFps.add(fp);
                        const parsedEntry = parsedByFp.get(fp);
                        const existingCount = keys.filter((k) => k.provider === prov).length;
                        const label =
                            rawToLabel.get(raw) ||
                            `${prov.toLowerCase()}-${String(existingCount + addedFps.size).padStart(2, '0')}`;
                        addKey({
                            provider: prov,
                            label,
                            key: raw,
                            status: 'pending',
                            group: group.trim() || parsedEntry?.accountId || undefined,
                            account: account.trim() || parsedEntry?.accountId || undefined,
                            accountId: parsedEntry?.accountId,
                        });
                    }
                    setBulkProgress(null);
                }

                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Bulk import complete: ${r.added} added (pending verification), ${r.duplicates} duplicates, ${r.invalid} invalid${healthIssuesList.length > 0 ? ' — ' + healthIssuesList.length + ' key(s) failed health check' : ''}`,
                    type: r.added > 0 ? 'info' : 'warning',
                });
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Bulk import failed.');
            } finally {
                setLoading(false);
            }
        },
        [bulkInput, addKey, keys, pipeline, t],
    );

    const reset = useCallback(() => {
        setBulkReport(null);
        setBulkProgress(null);
        setError('');
        setBulkInput('');
    }, []);

    return {
        bulkInput,
        setBulkInput,
        loading,
        error,
        setError,
        bulkReport,
        bulkProgress,
        runBulkImport,
        reset,
    };
}
