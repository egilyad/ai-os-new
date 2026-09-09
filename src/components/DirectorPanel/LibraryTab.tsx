import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import { scenarioRepository } from '../../kernel/instances/services-extras';
import ScenarioCard from './ScenarioCard';
import ScenarioLibraryFilters, { type ScenarioFilter } from './ScenarioLibraryFilters';

const LibraryTab: React.FC<{
    onLoad: (scenario: ConversationScenario) => void;
}> = ({ onLoad }) => {
    const { t } = useTranslation();
    const [scenarios, setScenarios] = useState<ConversationScenario[]>([]);
    const [filter, setFilter] = useState<ScenarioFilter>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await scenarioRepository.list(filter === 'all' ? {} : { status: filter });
            setScenarios(list);
        } catch {
            setError(t('director.library.error'));
        } finally {
            setLoading(false);
        }
    }, [filter, t]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleDuplicate = useCallback(
        async (id: string) => {
            try {
                await scenarioRepository.duplicate(id);
                await load();
            } catch {
                setError(t('director.library.error'));
            }
        },
        [load, t],
    );

    const handleArchive = useCallback(
        async (id: string) => {
            try {
                await scenarioRepository.archive(id);
                await load();
            } catch {
                setError(t('director.library.error'));
            }
        },
        [load, t],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await scenarioRepository.delete(id);
                await load();
            } catch {
                setError(t('director.library.error'));
            }
        },
        [load, t],
    );

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>{t('director.library.heading')}</h3>
            <ScenarioLibraryFilters value={filter} onChange={setFilter} />
            {loading && <p style={{ opacity: 0.7 }}>{t('director.library.loading')}</p>}
            {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
            {!loading && !error && scenarios.length === 0 && (
                <p style={{ opacity: 0.75 }}>{t('director.library.empty')}</p>
            )}
            {!loading && !error && scenarios.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {scenarios.map((s) => (
                        <ScenarioCard
                            key={s.id}
                            scenario={s}
                            onLoad={onLoad}
                            onDuplicate={handleDuplicate}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LibraryTab;
