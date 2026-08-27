import React, { useCallback, useEffect, useState } from 'react';
import { Waypoints, RefreshCw, Radar } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { junctionEngine } from '../../kernel/instances';
import type { Junction } from '../../kernel/types/junction-types';
import type { JunctionSourceView } from '../../kernel/contracts/junction-engine';
import JunctionList from './JunctionList';

/**
 * JunctionPanel — cross-domain synthesis engine UI.
 * Run detection over knowledge sources, review candidates, validate/reject.
 */
const JunctionPanel: React.FC = () => {
    const { t } = useTranslation();
    const [junctions, setJunctions] = useState<Junction[]>([]);
    const [sources, setSources] = useState<JunctionSourceView[]>([]);
    const [detecting, setDetecting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setJunctions(await junctionEngine.list());
        setSources(await junctionEngine.getSources());
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const handleDetect = async () => {
        setDetecting(true);
        setMessage(null);
        try {
            const candidates = await junctionEngine.detect();
            setMessage(`${candidates.length} ${t('junctions.detected_suffix')}`);
            await refresh();
        } finally {
            setDetecting(false);
        }
    };

    const handleChallenge = async (id: string, argument: string) => {
        await junctionEngine.submitCounterargument(id, argument, 'human');
        setMessage(t('junctions.verified'));
        await refresh();
    };

    const crystalCount = sources.filter((s) => s.kind === 'crystal').length;
    const debateCount = sources.filter((s) => s.kind === 'debate').length;

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            {/* Header */}
            <div
                style={{
                    padding: '1rem 1.25rem 0.6rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Waypoints size={18} color="#8b5cf6" />
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('junctions.title')}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--slate-500)' }}>
                        {junctions.length} {t('junctions.total')}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => void refresh()}
                        title={t('junctions.refresh')}
                        style={{
                            padding: '0.45rem 0.8rem',
                            borderRadius: 7,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <RefreshCw size={13} />
                    </button>
                    <button
                        onClick={() => void handleDetect()}
                        disabled={detecting}
                        style={{
                            padding: '0.45rem 0.9rem',
                            borderRadius: 7,
                            border: 'none',
                            background: 'var(--purple)',
                            color: '#fff',
                            cursor: detecting ? 'wait' : 'pointer',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            opacity: detecting ? 0.7 : 1,
                        }}
                    >
                        <Radar size={13} /> {t('junctions.detect')}
                    </button>
                </div>
            </div>

            {/* Source stats */}
            <div
                style={{
                    padding: '0.45rem 1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex',
                    gap: 14,
                    fontSize: '0.7rem',
                    color: 'var(--slate-400)',
                }}
            >
                <span>
                    <span style={{ color: 'var(--purple)' }}>{crystalCount}</span>{' '}
                    {t('junctions.sources_crystals')}
                </span>
                <span>
                    <span style={{ color: 'var(--success)' }}>{debateCount}</span>{' '}
                    {t('junctions.sources_debates')}
                </span>
                {message && <span style={{ color: 'var(--warning)' }}>{message}</span>}
            </div>

            {/* List */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                <JunctionList junctions={junctions} onChallenge={handleChallenge} />
            </div>
        </div>
    );
};

export default JunctionPanel;
