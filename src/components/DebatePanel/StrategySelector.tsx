import { motion } from 'framer-motion';
import {
    ArrowLeftRight,
    HelpCircle,
    GitBranch,
    Shield,
    Sparkles,
    Globe,
    Gavel,
} from 'lucide-react';
import type { DebateStrategy } from '../../kernel/contracts/debate-types';

interface StrategyInfo {
    id: DebateStrategy;
    icon: React.FC<{ size?: number; color?: string }>;
    color: string;
    bg: string;
    border: string;
}

const STRATEGIES: StrategyInfo[] = [
    {
        id: 'round_robin',
        icon: ArrowLeftRight,
        color: 'var(--purple)',
        bg: 'rgba(139,92,246,0.08)',
        border: 'rgba(139,92,246,0.25)',
    },
    {
        id: 'socratic',
        icon: HelpCircle,
        color: 'var(--accent)',
        bg: 'rgba(59,130,246,0.08)',
        border: 'rgba(59,130,246,0.25)',
    },
    {
        id: 'argument_tree',
        icon: GitBranch,
        color: 'var(--success)',
        bg: 'rgba(16,185,129,0.08)',
        border: 'rgba(16,185,129,0.25)',
    },
    {
        id: 'constrained',
        icon: Shield,
        color: 'var(--warning)',
        bg: 'rgba(245,158,11,0.08)',
        border: 'rgba(245,158,11,0.25)',
    },
    {
        id: 'moderated',
        icon: Sparkles,
        color: '#ec4899',
        bg: 'rgba(236,72,153,0.08)',
        border: 'rgba(236,72,153,0.25)',
    },
    {
        id: 'free_for_all',
        icon: Globe,
        color: '#06b6d4',
        bg: 'rgba(6,182,212,0.08)',
        border: 'rgba(6,182,212,0.25)',
    },
    {
        id: 'jury_trial',
        icon: Gavel,
        color: '#f97316',
        bg: 'rgba(249,115,22,0.08)',
        border: 'rgba(249,115,22,0.25)',
    },
];

interface StrategySelectorProps {
    value: string;
    onChange: (v: string) => void;
    t: (key: string) => string;
}

const STRATEGY_LABELS: Record<string, string> = {
    round_robin: 'Round Robin',
    socratic: 'Socratic',
    argument_tree: 'Argument Tree',
    constrained: 'Constrained',
    moderated: 'Moderated',
    free_for_all: 'Free for All',
    jury_trial: 'Jury Trial',
};
const StrategySelector: React.FC<StrategySelectorProps> = ({ value, onChange }) => {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(100,116,139,0.25)', background: 'rgba(15,23,42,0.6)', color: 'var(--slate-100)', fontSize: '0.9rem', outline: 'none' }}
        >
            {STRATEGIES.map(s => (
                <option key={s.id} value={s.id}>{STRATEGY_LABELS[s.id] || s.id}</option>
            ))}
        </select>
    );
};

export default StrategySelector;
