import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronRight,
    GitBranch,
    RefreshCcw,
    Link2,
    AlertTriangle,
} from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { Crystal } from '../../kernel/types/crystal-types';
import CrystalLifecycleBadge from './CrystalLifecycleBadge';

const ORIGIN_COLORS: Record<string, string> = {
    debate: '#a855f7',
    observation: '#06b6d4',
    synthesis: '#f59e0b',
    human: '#10b981',
    imported: '#64748b',
};

interface CrystalCardProps {
    crystal: Crystal;
    onCrystallize?: (id: string) => void;
    onSupersede?: (crystal: Crystal) => void;
    onRefute?: (id: string) => void;
}

const CrystalCard: React.FC<CrystalCardProps> = ({
    crystal,
    onCrystallize,
    onSupersede,
    onRefute,
}) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const originColor = ORIGIN_COLORS[crystal.provenance.originKind] ?? '#64748b';

    return (
        <div
            style={{
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(0,0,0,0.2)',
                marginBottom: '0.5rem',
                overflow: 'hidden',
            }}
        >
            {/* Header row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '0.6rem 0.75rem',
                    cursor: 'pointer',
                }}
                onClick={() => setExpanded((e) => !e)}
            >
                <span style={{ marginTop: 1, color: 'var(--slate-500)' }}>
                    {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--slate-200)' }}>
                        {crystal.content.statement}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <CrystalLifecycleBadge
                            status={crystal.status}
                            confidence={crystal.confidence}
                        />
                        <span
                            style={{
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                color: originColor,
                            }}
                        >
                            {crystal.provenance.originKind}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: 'var(--slate-600)' }}>
                            v{crystal.version}
                        </span>
                        {crystal.linkedLensIds.length > 0 && (
                            <span
                                style={{
                                    fontSize: '0.62rem',
                                    color: 'var(--purple)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                }}
                            >
                                <Link2 size={10} /> {crystal.linkedLensIds.length}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail */}
            {expanded && (
                <div
                    style={{
                        padding: '0 0.75rem 0.75rem 2.1rem',
                        borderTop: '1px solid rgba(255,255,255,0.04)',
                        paddingTop: '0.6rem',
                    }}
                >
                    {crystal.content.elaboration && (
                        <div
                            style={{
                                fontSize: '0.75rem',
                                color: 'var(--slate-400)',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {crystal.content.elaboration}
                        </div>
                    )}

                    {crystal.content.evidence && crystal.content.evidence.length > 0 && (
                        <DetailRow label={t('lenses_crystal.evidence')}>
                            {crystal.content.evidence.map((e, i) => (
                                <div key={i} style={chipStyle}>
                                    {e}
                                </div>
                            ))}
                        </DetailRow>
                    )}

                    {crystal.content.assumptions && crystal.content.assumptions.length > 0 && (
                        <DetailRow label={t('lenses_crystal.assumptions')}>
                            {crystal.content.assumptions.map((a, i) => (
                                <div key={i} style={chipStyle}>
                                    {a}
                                </div>
                            ))}
                        </DetailRow>
                    )}

                    {crystal.content.negationForm && (
                        <DetailRow label={t('lenses_crystal.negation')}>
                            <span style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                                {crystal.content.negationForm}
                            </span>
                        </DetailRow>
                    )}

                    {crystal.validation.debateId && (
                        <DetailRow label={t('lenses_crystal.debate')}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--purple-muted)' }}>
                                {crystal.validation.debateId}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                                {crystal.validation.proArguments.length} pro /{' '}
                                {crystal.validation.conArguments.length} con
                            </span>
                        </DetailRow>
                    )}

                    {crystal.contradictingCrystalIds.length > 0 && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                fontSize: '0.7rem',
                                color: '#f87171',
                                margin: '0.4rem 0',
                            }}
                        >
                            <AlertTriangle size={11} />
                            {t('lenses_crystal.contradictions')}:{' '}
                            {crystal.contradictingCrystalIds.length}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 6, marginTop: '0.6rem', flexWrap: 'wrap' }}>
                        {crystal.status !== 'crystal' && onCrystallize && (
                            <ActionButton
                                color="#10b981"
                                onClick={() => onCrystallize(crystal.crystalId)}
                            >
                                <GitBranch size={11} /> {t('lenses_crystal.crystallize')}
                            </ActionButton>
                        )}
                        {onSupersede && (
                            <ActionButton color="#f59e0b" onClick={() => onSupersede(crystal)}>
                                <RefreshCcw size={11} /> {t('lenses_crystal.supersede')}
                            </ActionButton>
                        )}
                        {crystal.status !== 'refuted' && onRefute && (
                            <ActionButton
                                color="#ef4444"
                                onClick={() => onRefute(crystal.crystalId)}
                            >
                                {t('lenses_crystal.refute')}
                            </ActionButton>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div style={{ margin: '0.35rem 0' }}>
        <div
            style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--slate-500)',
                marginBottom: 3,
            }}
        >
            {label}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            {children}
        </div>
    </div>
);

const chipStyle: React.CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--slate-400)',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    padding: '2px 6px',
};

const ActionButton: React.FC<{ color: string; onClick: () => void; children: React.ReactNode }> = ({
    color,
    onClick,
    children,
}) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '0.25rem 0.6rem',
            borderRadius: 5,
            border: `1px solid ${color}55`,
            background: `${color}12`,
            color,
            fontSize: '0.68rem',
            fontWeight: 600,
            cursor: 'pointer',
        }}
    >
        {children}
    </button>
);

export default CrystalCard;
