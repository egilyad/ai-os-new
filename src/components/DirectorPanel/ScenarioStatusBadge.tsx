import React from 'react';
import type { ScenarioStatus } from '../../kernel/contracts/conversation/scenario';
import { useTranslation } from '../../i18n/useTranslation';
import { StatusBadge } from '../Common/status-vocabulary';

const STATUS_COLORS: Record<ScenarioStatus, string> = {
    draft: '#94a3b8',
    active: '#10b981',
    archived: '#64748b',
};

const STATUS_KEYS: Record<ScenarioStatus, string> = {
    draft: 'director.scenario.status.draft',
    active: 'director.scenario.status.active',
    archived: 'director.scenario.status.archived',
};

const ScenarioStatusBadge: React.FC<{ status: ScenarioStatus }> = ({ status }) => {
    const { t } = useTranslation();
    return (
        <StatusBadge status={status} color={STATUS_COLORS[status]} label={t(STATUS_KEYS[status])} />
    );
};

export default ScenarioStatusBadge;
