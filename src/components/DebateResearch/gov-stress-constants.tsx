import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import type { GovScenarioOutcome } from '../../kernel/contracts/gov-stress-test';

export const CATEGORY_COLORS: Record<string, string> = {
    SLA: '#06b6d4',
    Cost: '#f59e0b',
    Privacy: '#a855f7',
    'Rate Limit': '#3b82f6',
    Safety: '#ef4444',
    Content: '#f97316',
    Security: '#10b981',
};

export const iconForResult = (r: GovScenarioOutcome) => {
    switch (r) {
        case 'pass':
            return <CheckCircle size={14} color="#10b981" />;
        case 'warn':
            return <AlertTriangle size={14} color="#f59e0b" />;
        case 'block':
            return <XCircle size={14} color="#ef4444" />;
    }
};
