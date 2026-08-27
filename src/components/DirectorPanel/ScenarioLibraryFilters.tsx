import React from 'react';
import type { ScenarioStatus } from '../../kernel/contracts/conversation/scenario';
import { useTranslation } from '../../i18n/useTranslation';

export type ScenarioFilter = 'all' | ScenarioStatus;

const OPTIONS: ScenarioFilter[] = ['all', 'active', 'draft', 'archived'];

const FILTER_KEYS: Record<ScenarioFilter, string> = {
    all: 'director.library.filter_all',
    active: 'director.library.filter_active',
    draft: 'director.library.filter_draft',
    archived: 'director.library.filter_archived',
};

const ScenarioLibraryFilters: React.FC<{
    value: ScenarioFilter;
    onChange: (next: ScenarioFilter) => void;
}> = ({ value, onChange }) => {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {OPTIONS.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    style={{
                        padding: '0.3rem 0.7rem',
                        borderRadius: 6,
                        cursor: 'pointer',
                        border: '1px solid #2a2a35',
                        background: value === opt ? '#3b82f6' : 'transparent',
                        color: value === opt ? '#fff' : 'inherit',
                        fontSize: '0.8rem',
                    }}
                >
                    {t(FILTER_KEYS[opt])}
                </button>
            ))}
        </div>
    );
};

export default ScenarioLibraryFilters;
