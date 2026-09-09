import { motion } from 'framer-motion';
import { Bot, GitBranch, ShieldCheck, Blocks } from 'lucide-react';
import { labelSection800 } from '../../styles/common';

interface ComponentPaletteProps {
    onAddNode: (type: string, label: string) => void;
    t: (key: string) => string;
}

const paletteItems = [
    {
        type: 'agent',
        icon: Bot,
        labelKey: 'builder.node.agent',
        descKey: 'builder.node.agent_desc',
        color: 'var(--accent)',
        bg: 'rgba(59,130,246,0.1)',
    },
    {
        type: 'router',
        icon: GitBranch,
        labelKey: 'builder.node.router',
        descKey: 'builder.node.router_desc',
        color: 'var(--warning)',
        bg: 'rgba(245,158,11,0.1)',
    },
    {
        type: 'guardrail',
        icon: ShieldCheck,
        labelKey: 'builder.node.guardrail',
        descKey: 'builder.node.guardrail_desc',
        color: 'var(--success)',
        bg: 'rgba(16,185,129,0.1)',
    },
    {
        type: 'tool',
        icon: Blocks,
        labelKey: 'builder.node.tool',
        descKey: 'builder.node.tool_desc',
        color: 'var(--purple)',
        bg: 'rgba(139,92,246,0.1)',
    },
];

const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onAddNode, t }) => {
    return (
        <div
            className="glass-panel"
            style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.2)',
            }}
        >
            <div
                style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                }}
            >
                <div style={labelSection800}>{t('builder.blocks')}</div>
            </div>
            <div
                style={{
                    padding: '1rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                }}
            >
                {paletteItems.map((item) => (
                    <motion.div
                        key={item.type}
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 12,
                            cursor: 'grab',
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                        }}
                        onClick={() => onAddNode(item.type, t(item.labelKey))}
                        role="button"
                        tabIndex={0}
                        aria-label={t('builder.add_node_aria').replace('{0}', t(item.labelKey))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                                onAddNode(item.type, t(item.labelKey));
                        }}
                    >
                        <div
                            style={{
                                padding: '0.6rem',
                                background: item.bg,
                                borderRadius: 10,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <item.icon size={20} color={item.color} aria-hidden="true" />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    marginBottom: '2px',
                                }}
                            >
                                {t(item.labelKey)}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--text-muted)',
                                    lineHeight: 1.3,
                                }}
                            >
                                {t(item.descKey)}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ComponentPalette;
