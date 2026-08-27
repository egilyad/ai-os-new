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

const StrategySelector: React.FC<StrategySelectorProps> = ({ value, onChange, t }) => {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 8,
            }}
        >
            {STRATEGIES.map((s, i) => {
                const Icon = s.icon;
                const isSelected = value === s.id;
                return (
                    <motion.div
                        key={s.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        onClick={() => onChange(s.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onChange(s.id);
                            }
                        }}
                        style={{
                            padding: '0.7rem 0.8rem',
                            borderRadius: 10,
                            border: '1px solid',
                            borderColor: isSelected ? s.color : s.border,
                            background: isSelected ? s.bg : 'rgba(255,255,255,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            outline: isSelected ? `2px solid ${s.color}20` : 'none',
                            outlineOffset: 1,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Icon size={18} color={isSelected ? s.color : 'var(--slate-500)'} />
                            <span
                                style={{
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    color: isSelected ? s.color : 'var(--slate-300)',
                                }}
                            >
                                {t(`debate.strategy.${s.id}`)}
                            </span>
                        </div>
                        <span
                            style={{
                                fontSize: '0.68rem',
                                color: isSelected ? '#94a3b8' : '#64748b',
                                lineHeight: 1.4,
                            }}
                        >
                            {t(`debate.strategy.${s.id}_desc`)}
                        </span>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default StrategySelector;
