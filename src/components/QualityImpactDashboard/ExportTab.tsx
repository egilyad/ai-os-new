import React, { useState, useCallback } from 'react';
import { qualityImpactCollector, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ExportTab');
import { useTranslation } from '../../i18n/useTranslation';
import { tableContainerStyle } from './quality-impact-shared';

const ExportTab: React.FC = () => {
    const { t } = useTranslation();
    const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);
    const [copied, setCopied] = useState(false);

    const handleExportJSON = useCallback(() => {
        setExporting('json');
        try {
            const metrics = qualityImpactCollector.getAllMetrics();
            const history = qualityImpactCollector.getSessionHistory();
            const baselines = qualityImpactCollector.getBaselineSessions();
            const blob = new Blob(
                [JSON.stringify({ metrics, sessionHistory: history, baselines }, null, 2)],
                { type: 'application/json' },
            );
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quality-impact-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            LOGGER.warn('Export JSON failed', String(e));
        }
        setExporting(null);
    }, []);

    const handleExportCSV = useCallback(() => {
        setExporting('csv');
        try {
            const metrics = qualityImpactCollector.getAllMetrics();
            const header =
                'techniqueId,totalSessions,totalActivations,avgJudgeScoreDelta,confidence,pValue,sampleSizeOn,sampleSizeOff\n';
            const rows = metrics
                .map(
                    (m) =>
                        `"${m.techniqueId}",${m.totalSessions},${m.totalActivations},${m.avgJudgeScoreDelta},${m.confidence},${m.pValue ?? ''},${m.sampleSizeOn},${m.sampleSizeOff}`,
                )
                .join('\n');
            const blob = new Blob([header + rows], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `quality-impact-${Date.now()}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            LOGGER.warn('Export CSV failed', String(e));
        }
        setExporting(null);
    }, []);

    const handleCopyJSON = useCallback(() => {
        try {
            const metrics = qualityImpactCollector.getAllMetrics();
            const history = qualityImpactCollector.getSessionHistory();
            const text = JSON.stringify({ metrics, sessionHistory: history }, null, 2);
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        } catch {
            /* clipboard not available */
        }
    }, []);

    return (
        <div style={tableContainerStyle}>
            <div style={{ padding: '24px' }}>
                <div
                    style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--slate-200)',
                        marginBottom: '20px',
                    }}
                >
                    {t('quality_impact.export_title') ?? 'Export Quality Impact Data'}
                </div>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <button
                        onClick={handleExportJSON}
                        disabled={exporting !== null}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '8px',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            opacity: exporting !== null ? 0.5 : 1,
                        }}
                    >
                        {exporting === 'json'
                            ? (t('quality_impact.exporting') ?? 'Exporting...')
                            : (t('quality_impact.export_json') ?? 'Export JSON')}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting !== null}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(34, 197, 94, 0.15)',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            borderRadius: '8px',
                            color: 'var(--success)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                            opacity: exporting !== null ? 0.5 : 1,
                        }}
                    >
                        {exporting === 'csv'
                            ? (t('quality_impact.exporting') ?? 'Exporting...')
                            : (t('quality_impact.export_csv') ?? 'Export CSV')}
                    </button>
                    <button
                        onClick={handleCopyJSON}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(148, 163, 184, 0.15)',
                            border: '1px solid rgba(148, 163, 184, 0.3)',
                            borderRadius: '8px',
                            color: copied ? '#22c55e' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px',
                        }}
                    >
                        {copied
                            ? (t('quality_impact.copied') ?? 'Copied!')
                            : (t('quality_impact.copy_json') ?? 'Copy JSON')}
                    </button>
                </div>

                <div style={{ fontSize: '14px', color: 'var(--slate-400)', marginBottom: '8px' }}>
                    {t('quality_impact.export_desc') ??
                        'Export metrics and session history for external analysis.'}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '12px',
                        marginTop: '16px',
                    }}
                >
                    {[
                        {
                            label: t('quality_impact.export_metrics') ?? 'Technique Metrics',
                            desc:
                                t('quality_impact.export_metrics_desc') ??
                                'Impact metrics per technique',
                        },
                        {
                            label: t('quality_impact.export_sessions') ?? 'Session History',
                            desc:
                                t('quality_impact.export_sessions_desc') ??
                                'All debate sessions with quality data',
                        },
                        {
                            label: t('quality_impact.export_baselines') ?? 'Baselines',
                            desc:
                                t('quality_impact.export_baselines_desc') ??
                                'Baseline sessions without techniques',
                        },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                background: 'rgba(15, 23, 42, 0.3)',
                                borderRadius: '8px',
                                padding: '16px',
                                border: '1px solid rgba(148, 163, 184, 0.08)',
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 600,
                                    color: 'var(--slate-200)',
                                    marginBottom: '4px',
                                    fontSize: '13px',
                                }}
                            >
                                {item.label}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{item.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ExportTab;
