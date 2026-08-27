import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { SynthesisZone } from '../../kernel/types/synthesis-types';

const ZONE_COLORS = { consensus: '#10b981', dissent: '#ef4444', uncertainty: '#f59e0b' } as const;

/**
 * SynthesisZonesView — consensus / dissent / uncertainty zones for a synthesis.
 */
const SynthesisZonesView: React.FC<{ zones: SynthesisZone[] }> = ({ zones }) => {
    const { t } = useTranslation();
    const grouped = {
        consensus: [] as SynthesisZone[],
        dissent: [] as SynthesisZone[],
        uncertainty: [] as SynthesisZone[],
    };
    for (const z of zones) grouped[z.kind].push(z);

    return (
        <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 8 }}
        >
            {(['consensus', 'dissent', 'uncertainty'] as const).map((kind) => (
                <div
                    key={kind}
                    style={{
                        border: `1px solid ${ZONE_COLORS[kind]}55`,
                        background: '#0b1220',
                        borderRadius: 8,
                        padding: '0.6rem 0.7rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <span
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: ZONE_COLORS[kind],
                            }}
                        />
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate-200)' }}>
                            {t(`synthesis.zone_${kind}`)}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--slate-500)' }}>
                            {grouped[kind].length}
                        </span>
                    </div>
                    {grouped[kind].length === 0 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-600)' }}>—</div>
                    )}
                    {grouped[kind].slice(0, 3).map((z) => (
                        <div
                            key={z.id}
                            style={{ fontSize: '0.7rem', color: 'var(--slate-300)', marginBottom: 4 }}
                        >
                            {z.kind === 'dissent' && 'irreducible' in z && z.irreducible ? (
                                <span style={{ color: '#f87171' }}>
                                    [{t('synthesis.irreducible')}]{' '}
                                </span>
                            ) : null}
                            {z.claim}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default SynthesisZonesView;
