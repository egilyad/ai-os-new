import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Code, Globe, Database, Blocks } from 'lucide-react';
import type { ToolDefinition } from '../../kernel/instances';

interface ToolCardProps {
    tool: ToolDefinition;
    selected: boolean;
    onSelect: (tool: ToolDefinition) => void;
    onToggle: (id: string) => void;
    t: (key: string) => string;
}

const getToolIcon = (type: string) => {
    switch (type) {
        case 'script':
            return <Code size={20} color="#a855f7" />;
        case 'api':
            return <Globe size={20} color="#3b82f6" />;
        case 'database':
            return <Database size={20} color="#10b981" />;
        default:
            return <Blocks size={20} color="#f59e0b" />;
    }
};

const getToolColor = (type: string) => {
    switch (type) {
        case 'script':
            return '#a855f7';
        case 'api':
            return '#3b82f6';
        case 'database':
            return '#10b981';
        default:
            return '#f59e0b';
    }
};

export const ToolCard: React.FC<ToolCardProps> = memo(
    ({ tool, selected, onSelect, onToggle, t }) => {
        const color = getToolColor(tool.type);
        return (
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => onSelect(tool)}
                whileHover={{ y: -4, boxShadow: '0 15px 35px rgba(0,0,0,0.3)', borderColor: color }}
                role="button"
                tabIndex={0}
                aria-label={`Select tool: ${tool.name}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(tool);
                    }
                }}
                style={{
                    padding: '1.5rem',
                    borderRadius: 16,
                    border: '1px solid',
                    background: selected
                        ? `linear-gradient(145deg, ${color}15 0%, rgba(255,255,255,0.02) 100%)`
                        : 'rgba(0,0,0,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    borderColor: selected ? color : 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '1.25rem',
                        alignItems: 'flex-start',
                    }}
                >
                    <div
                        style={{
                            padding: '0.75rem',
                            background: `${color}15`,
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${color}30`,
                        }}
                    >
                        {getToolIcon(tool.type)}
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <span
                            style={{
                                fontSize: '0.65rem',
                                color: tool.enabled ? '#10b981' : '#64748b',
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {tool.enabled ? t('tools.status.active') : t('tools.status.disabled')}
                        </span>
                        <button
                            role="switch"
                            aria-checked={tool.enabled}
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggle(tool.id);
                            }}
                            style={{
                                width: 44,
                                height: 24,
                                background: tool.enabled ? '#10b981' : 'rgba(255,255,255,0.1)',
                                borderRadius: 12,
                                position: 'relative',
                                cursor: 'pointer',
                                boxShadow: tool.enabled
                                    ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                    : 'none',
                                transition: 'all 0.3s',
                                border: 'none',
                            }}
                            aria-label={`Toggle ${tool.name} tool`}
                        >
                            <motion.div
                                animate={{ x: tool.enabled ? 22 : 2 }}
                                style={{
                                    width: 20,
                                    height: 20,
                                    background: 'white',
                                    borderRadius: '50%',
                                    position: 'absolute',
                                    top: 2,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                                }}
                            />
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        marginBottom: '0.5rem',
                        color: 'var(--slate-50)',
                        letterSpacing: '-0.01em',
                    }}
                >
                    {tool.name}
                </div>
                <div
                    style={{
                        fontSize: '0.85rem',
                        color: 'var(--slate-400)',
                        lineHeight: 1.6,
                        flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {tool.description}
                </div>

                <div
                    style={{
                        marginTop: '1.5rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        paddingTop: '1rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.7rem',
                            background: 'rgba(0,0,0,0.3)',
                            color,
                            padding: '0.3rem 0.6rem',
                            borderRadius: 8,
                            textTransform: 'uppercase',
                            fontWeight: 800,
                            border: `1px solid ${color}30`,
                            letterSpacing: '0.05em',
                        }}
                    >
                        {tool.type}
                    </span>
                    {tool.language && (
                        <span
                            style={{
                                fontSize: '0.7rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--slate-300)',
                                padding: '0.3rem 0.6rem',
                                borderRadius: 8,
                                textTransform: 'uppercase',
                                fontWeight: 700,
                                letterSpacing: '0.05em',
                            }}
                        >
                            {tool.language}
                        </span>
                    )}
                </div>
            </motion.div>
        );
    },
);
