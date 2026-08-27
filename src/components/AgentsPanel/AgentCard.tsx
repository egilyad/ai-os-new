import { motion } from 'framer-motion';
import { Pause, Play, Wrench } from 'lucide-react';
import { memo } from 'react';
import { AgentAvatar } from './AgentAvatar';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import type { AgentWithStats } from './AgentsPanelContext';

interface AgentCardProps {
    agent: AgentWithStats;
    agentStats: Record<string, { calls: number; errors?: number; latency?: number }>;
    viewMode: 'grid' | 'list';
    onSelect: (id: string) => void;
    onToggleStatus: (id: string) => void;
    t: (key: string) => string;
}

export const AgentCard: React.FC<AgentCardProps> = memo(
    ({ agent, agentStats, onSelect, onToggleStatus, t }) => {
        const stats = agentStats[agent.id];
        const successRate =
            stats && stats.calls > 0 ? (stats.calls - (stats.errors ?? 0)) / stats.calls : null;
        const latency = stats?.latency || 0;
        const identity = resolveAgentIdentity(agent.id);

        return (
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="agents-card glass-panel"
                style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                whileHover={{
                    y: -4,
                    boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
                    borderColor: 'rgba(59,130,246,0.3)',
                }}
                onClick={() => onSelect(agent.id)}
                role="button"
                tabIndex={0}
                aria-label={`${agent.name} - ${agent.role} - ${agent.status}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(agent.id);
                    }
                }}
            >
                <div className={`agents-card-indicator agents-card-indicator--${agent.status}`} />

                <div className="agents-card-top">
                    <div className="agents-card-top-left">
                        <div
                            className={`agents-card-avatar agents-card-avatar--${agent.status === 'active' ? 'active' : 'paused'}`}
                        >
                            <AgentAvatar
                                agentId={agent.id}
                                name={agent.name}
                                size={36}
                                emoji={identity.avatar.emoji}
                                color={identity.avatar.color}
                                url={identity.avatar.url}
                            />
                        </div>
                        <div className="agents-card-info">
                            <h3 className="agents-card-name">{agent.name}</h3>
                            <p className="agents-card-role">{agent.role}</p>
                            {identity.specializations.length > 0 && (
                                <p
                                    style={{
                                        margin: '0.1rem 0 0',
                                        fontSize: '0.68rem',
                                        opacity: 0.6,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    {identity.specializations.join(' · ')}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(agent.id);
                        }}
                        className="agents-card-toggle-btn"
                        title={
                            agent.status === 'active'
                                ? t('agents.pause_agent_title')
                                : t('agents.resume_agent_title')
                        }
                        aria-label={
                            agent.status === 'active'
                                ? `Pause ${agent.name}`
                                : `Resume ${agent.name}`
                        }
                        style={{ color: agent.status === 'active' ? '#10b981' : '#64748b' }}
                    >
                        {agent.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                </div>

                <p className="agents-card-desc">{agent.description}</p>

                <div className="agents-card-tags">
                    {agent.tools.slice(0, 3).map((tool) => (
                        <span key={tool} className="agents-card-tag">
                            <Wrench size={10} className="agents-card-tag-icon" /> {tool}
                        </span>
                    ))}
                    {agent.tools.length > 3 && (
                        <span className="agents-card-tag-more">+{agent.tools.length - 3}</span>
                    )}
                    {agent.tools.length === 0 && (
                        <span className="agents-card-tag-empty">{t('agents.no_capabilities')}</span>
                    )}
                </div>

                <div className="agents-card-footer">
                    <div className="agents-card-stats">
                        <div className="agents-card-stat">
                            <span className="agents-card-stat-label">
                                {t('agents.stat_invocations')}
                            </span>
                            <span className="agents-card-stat-value">
                                {(stats?.calls || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="agents-card-stat">
                            <span className="agents-card-stat-label">
                                {t('agents.stat_success_rate')}
                            </span>
                            <span
                                className={`agents-card-stat-value${successRate !== null ? (successRate > 0.95 ? ' agents-card-stat-value--good' : successRate > 0.8 ? ' agents-card-stat-value--warn' : ' agents-card-stat-value--bad') : ''}`}
                            >
                                {successRate !== null ? `${Math.round(successRate * 100)}%` : '--'}
                            </span>
                        </div>
                        <div className="agents-card-stat">
                            <span className="agents-card-stat-label">
                                {t('agents.stat_errors')}
                            </span>
                            <span
                                className={`agents-card-stat-value${(stats?.errors || 0) > 0 ? ' agents-card-stat-value--bad' : ''}`}
                            >
                                {stats?.errors || 0}
                            </span>
                        </div>
                        <div className="agents-card-stat">
                            <span className="agents-card-stat-label">
                                {t('agents.stat_latency')}
                            </span>
                            <span
                                className={`agents-card-stat-value${latency < 500 ? ' agents-card-stat-value--good' : latency < 1000 ? ' agents-card-stat-value--warn' : ' agents-card-stat-value--bad'}`}
                            >
                                {latency}
                                <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)' }}>ms</span>
                            </span>
                        </div>
                    </div>
                    <div className="agents-card-engine">
                        <span className="agents-card-engine-label">Provider / Model</span>
                        <span className="agents-card-engine-value">
                            {agent.providerId === 'Auto' ? 'Smart Router' : agent.providerId}
                            {agent.model !== 'auto'
                                ? ` · ${agent.model.split(':').pop() || agent.model.split('/').pop()}`
                                : ''}
                        </span>
                    </div>
                </div>
            </motion.div>
        );
    },
);
