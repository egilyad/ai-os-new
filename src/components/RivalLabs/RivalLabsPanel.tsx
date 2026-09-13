import { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../../components/Common';
import { RIVAL_PHASES } from './rivalLabsConfig';
import RivalServiceCard from './RivalServiceCard';

export default function RivalLabsPanel() {
    const { t } = useTranslation();
    const [phase, setPhase] = useState(RIVAL_PHASES[0]!.id);
    const active = RIVAL_PHASES.find((p) => p.id === phase) ?? RIVAL_PHASES[0]!;

    return (
        <div style={{ padding: '0.75rem 1rem' }}>
            <h2 style={{ margin: 0 }}>{t('rivalLabs.title')}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('rivalLabs.subtitle')}</p>
            <div
                role="tablist"
                aria-label={t('rivalLabs.title')}
                style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}
            >
                {RIVAL_PHASES.map((p) => (
                    <Button
                        key={p.id}
                        variant={p.id === phase ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setPhase(p.id)}
                    >
                        {t(`rivalLabs.phase.${p.id}`)}
                    </Button>
                ))}
            </div>
            {active.services.length === 0 ? (
                <p style={{ opacity: 0.6 }}>{t('rivalLabs.empty')}</p>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: '0.6rem',
                    }}
                >
                    {active.services.map((s) => (
                        <RivalServiceCard key={s.key} def={s} />
                    ))}
                </div>
            )}
        </div>
    );
}
