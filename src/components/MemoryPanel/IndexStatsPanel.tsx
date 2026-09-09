import { Network, Zap } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { sectionPanelTitle, statBox, progressLabel, progressBarSmall } from '../../styles/common';
import type { MemoryEntry } from '../../types/memory';

interface IndexStatsPanelProps {
    memories: MemoryEntry[];
    filteredMemories: MemoryEntry[];
    totalEntries: number;
    avgRetrievalMs: number;
}

const IndexStatsPanel: React.FC<IndexStatsPanelProps> = ({
    memories,
    filteredMemories,
    totalEntries,
    avgRetrievalMs,
}) => {
    const { t } = useTranslation();
    const indexDensity = Math.min((totalEntries / 1000) * 100, 100);
    const semanticClarity =
        totalEntries > 0
            ? Math.round(
                  (filteredMemories.filter((m) => m.vector || m.embedding).length / totalEntries) *
                      100,
              )
            : 0;
    const dimensions =
        memories[0]?.vector?.length || memories[0]?.metadata?.vectorData?.dimensions || 1536;

    return (
        <div
            className="glass-panel"
            style={{
                padding: '1.5rem',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            <h3 style={sectionPanelTitle}>
                <Network size={18} color="#10b981" /> {t('memory.index_params')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={statBox}>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--slate-500)',
                                marginBottom: '0.4rem',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                            }}
                        >
                            {t('memory.entries_label')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                            {totalEntries.toLocaleString()}
                        </div>
                    </div>
                    <div style={statBox}>
                        <div
                            style={{
                                fontSize: '0.65rem',
                                color: 'var(--slate-500)',
                                marginBottom: '0.4rem',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                            }}
                        >
                            {t('memory.dimensions_label')}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-50)' }}>
                            {dimensions}
                        </div>
                    </div>
                </div>
                <div>
                    <div style={progressLabel}>
                        <span style={{ color: 'var(--slate-400)' }}>{t('memory.density_label')}</span>
                        <span style={{ color: 'var(--success)' }}>{indexDensity.toFixed(0)}%</span>
                    </div>
                    <div style={progressBarSmall}>
                        <div
                            style={{
                                width: `${indexDensity.toFixed(0)}%`,
                                height: '100%',
                                background: 'var(--success)',
                                borderRadius: 3,
                                boxShadow: '0 0 10px #10b981',
                            }}
                        />
                    </div>
                </div>
                <div>
                    <div style={progressLabel}>
                        <span style={{ color: 'var(--slate-400)' }}>{t('memory.clarity_label')}</span>
                        <span style={{ color: 'var(--accent)' }}>{semanticClarity}%</span>
                    </div>
                    <div style={progressBarSmall}>
                        <div
                            style={{
                                width: `${semanticClarity}%`,
                                height: '100%',
                                background: 'var(--accent)',
                                borderRadius: 3,
                                boxShadow: '0 0 10px #3b82f6',
                            }}
                        />
                    </div>
                </div>
                <div
                    style={{
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        padding: '1.25rem',
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                    }}
                >
                    <div
                        style={{
                            padding: '0.5rem',
                            background: 'var(--success-tint)',
                            borderRadius: 8,
                        }}
                    >
                        <Zap size={18} color="#10b981" aria-hidden="true" />
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)' }}>
                        {t('memory.retrieval_latency')}
                        <strong style={{ color: 'var(--success)', fontSize: '0.9rem' }}>
                            {avgRetrievalMs || '—'}ms
                        </strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndexStatsPanel;
