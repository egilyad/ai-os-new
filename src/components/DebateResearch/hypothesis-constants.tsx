import { Zap, BookOpen, Route, Shield } from 'lucide-react';
import type { HypothesisCategory, HypothesisStatus } from '../../kernel/types/research-types';

export type FilterTab = 'all' | HypothesisCategory;

export interface CategoryConfig {
    icon: React.ReactNode;
    color: string;
    labelKey: string;
}

export const CATEGORY_CONFIG: Record<HypothesisCategory, CategoryConfig> = {
    arch: {
        icon: <Zap size={14} />,
        color: '#a855f7',
        labelKey: 'hypothesis_generator.category_arch',
    },
    prompt: {
        icon: <BookOpen size={14} />,
        color: 'var(--accent)',
        labelKey: 'hypothesis_generator.category_prompt',
    },
    routing: {
        icon: <Route size={14} />,
        color: 'var(--warning)',
        labelKey: 'hypothesis_generator.category_routing',
    },
    gov: {
        icon: <Shield size={14} />,
        color: 'var(--success)',
        labelKey: 'hypothesis_generator.category_gov',
    },
};

export interface StatusConfig {
    color: string;
    labelKey: string;
    nextStates: HypothesisStatus[];
}

export const STATUS_CONFIG: Record<HypothesisStatus, StatusConfig> = {
    proposed: {
        color: 'var(--slate-500)',
        labelKey: 'hypothesis_generator.status_proposed',
        nextStates: ['active'],
    },
    active: {
        color: 'var(--accent)',
        labelKey: 'hypothesis_generator.status_active',
        nextStates: ['debating'],
    },
    debating: {
        color: '#a855f7',
        labelKey: 'hypothesis_generator.status_debating',
        nextStates: ['accepted', 'rejected'],
    },
    accepted: {
        color: 'var(--success)',
        labelKey: 'hypothesis_generator.status_accepted',
        nextStates: [],
    },
    rejected: {
        color: 'var(--error)',
        labelKey: 'hypothesis_generator.status_rejected',
        nextStates: [],
    },
};

export const formatDate = (ts: number): string => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};
