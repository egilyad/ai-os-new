import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { CrystalDomain, CrystalOriginKind } from '../../kernel/types/crystal-types';

const DOMAINS: CrystalDomain[] = [
    'arch',
    'prompt',
    'routing',
    'gov',
    'llm',
    'security',
    'economics',
    'general',
];

const ORIGINS: CrystalOriginKind[] = ['debate', 'observation', 'synthesis', 'human', 'imported'];

interface CrystalProposeModalProps {
    onClose: () => void;
    onPropose: (input: {
        content: {
            statement: string;
            elaboration?: string;
            evidence?: string[];
            assumptions?: string[];
            negationForm?: string;
        };
        originKind: CrystalOriginKind;
        originId: string;
        applicableDomain?: CrystalDomain;
    }) => Promise<void>;
}

const CrystalProposeModal: React.FC<CrystalProposeModalProps> = ({ onClose, onPropose }) => {
    const { t } = useTranslation();
    const [statement, setStatement] = useState('');
    const [elaboration, setElaboration] = useState('');
    const [negation, setNegation] = useState('');
    const [evidence, setEvidence] = useState('');
    const [domain, setDomain] = useState<CrystalDomain>('general');
    const [originKind, setOriginKind] = useState<CrystalOriginKind>('human');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!statement.trim() || saving) return;
        setSaving(true);
        try {
            await onPropose({
                content: {
                    statement: statement.trim(),
                    elaboration: elaboration.trim() || undefined,
                    negationForm: negation.trim() || undefined,
                    evidence: evidence
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                },
                originKind,
                originId: `manual-${Date.now()}`,
                applicableDomain: domain,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: 540,
                    maxWidth: '90vw',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    background: 'var(--slate-800)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1.25rem',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                    }}
                >
                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('lenses_crystal.propose')}
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 4,
                        }}
                    >
                        <X size={16} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={labelStyle}>
                        {t('lenses_crystal.form_statement')} *
                        <textarea
                            value={statement}
                            onChange={(e) => setStatement(e.target.value)}
                            rows={2}
                            placeholder={t('lenses_crystal.form_statement_hint')}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses_crystal.form_elaboration')}
                        <textarea
                            value={elaboration}
                            onChange={(e) => setElaboration(e.target.value)}
                            rows={2}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses_crystal.form_negation')}
                        <input
                            value={negation}
                            onChange={(e) => setNegation(e.target.value)}
                            placeholder={t('lenses_crystal.form_negation_hint')}
                            style={inputStyle}
                        />
                    </label>

                    <label style={labelStyle}>
                        {t('lenses_crystal.form_evidence')}
                        <textarea
                            value={evidence}
                            onChange={(e) => setEvidence(e.target.value)}
                            rows={2}
                            placeholder={t('lenses_crystal.form_evidence_hint')}
                            style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </label>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <label style={{ ...labelStyle, flex: 1 }}>
                            {t('lenses_crystal.form_domain')}
                            <select
                                value={domain}
                                onChange={(e) => setDomain(e.target.value as CrystalDomain)}
                                style={inputStyle}
                            >
                                {DOMAINS.map((d) => (
                                    <option key={d} value={d}>
                                        {d}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label style={{ ...labelStyle, flex: 1 }}>
                            {t('lenses_crystal.form_origin')}
                            <select
                                value={originKind}
                                onChange={(e) => setOriginKind(e.target.value as CrystalOriginKind)}
                                style={inputStyle}
                            >
                                {ORIGINS.map((o) => (
                                    <option key={o} value={o}>
                                        {o}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                        <button
                            onClick={() => void handleSave()}
                            disabled={!statement.trim() || saving}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: 7,
                                border: 'none',
                                background: 'var(--success)',
                                color: '#022c22',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                                opacity: !statement.trim() || saving ? 0.5 : 1,
                            }}
                        >
                            <Save size={13} /> {saving ? '...' : t('lenses_crystal.save')}
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 7,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            {t('lenses_crystal.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--slate-400)',
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '0.45rem 0.6rem',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
    outline: 'none',
    fontFamily: 'inherit',
};

export default CrystalProposeModal;
