import { motion } from 'framer-motion';
import {
    Copy,
    Trash2,
    UserCog,
    Code,
    Wrench,
    AlertTriangle,
    ThumbsUp,
    ThumbsDown,
} from 'lucide-react';
import type { Role } from '../../types/role';
import type { RoleUsageStats } from '../../kernel/instances';
import { ProceduralAvatar } from './ProceduralAvatar';

interface RoleCardProps {
    role: Role;
    stats?: RoleUsageStats;
    availableTools: { id: string; name: string }[];
    assignmentCount: number;
    validation: { valid: boolean; missingTools: string[] };
    vars: string[];
    catColor: string;
    shortId: string;
    onEdit: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onDuplicate: (e: React.MouseEvent) => void;
    onFeedback?: (roleId: string, positive: boolean) => void;
    onPromote?: (roleId: string) => void;
    t: (key: string) => string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
    role,
    stats,
    availableTools,
    assignmentCount,
    validation,
    vars,
    catColor,
    shortId,
    onEdit,
    onDelete,
    onDuplicate,
    onFeedback,
    onPromote,
    t,
}) => (
    <motion.div
        layoutId={role.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={onEdit}
        role="button"
        tabIndex={0}
        aria-label={`Role: ${role.name}, ${assignmentCount} agents assigned`}
        style={{
            padding: '1.5rem',
            cursor: 'pointer',
            position: 'relative',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            background: 'rgba(255,255,255,0.02)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s',
        }}
        whileHover={{
            y: -4,
            boxShadow: '0 15px 35px rgba(0,0,0,0.3)',
            borderColor: 'rgba(59,130,246,0.4)',
            background: 'linear-gradient(145deg, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0) 100%)',
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit();
            }
        }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: `${catColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `1px solid ${catColor}30`,
                    }}
                >
                    {role.icon ? (
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{role.icon}</span>
                    ) : (
                        <ProceduralAvatar
                            seed={role.id}
                            size={32}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            shape={(role.metadata?.avatarShape as any) || 'circle'}
                        />
                    )}
                </div>
                <div>
                    <h3
                        style={{
                            fontSize: '1.15rem',
                            fontWeight: 800,
                            margin: '0 0 0.2rem',
                            color: 'var(--slate-50)',
                        }}
                    >
                        {role.name}
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                            fontSize: '0.75rem',
                            color: 'var(--slate-500)',
                            fontFamily: 'monospace',
                        }}
                    >
                        <span>ID: {shortId}</span>
                        <span style={{ color: catColor }}>●</span>
                        <span style={{ color: catColor }}>{role.metadata.category}</span>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {onPromote && !role.isBuiltin && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onPromote(role.id);
                        }}
                        style={{
                            padding: '0.5rem',
                            borderRadius: 10,
                            background: 'rgba(16,185,129,0.05)',
                            border: '1px solid rgba(16,185,129,0.2)',
                            color: 'var(--success)',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                        title="Promote to built-in"
                    >
                        ↑ Promote
                    </button>
                )}
                <button
                    onClick={onDuplicate}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 10,
                        background: 'rgba(59,130,246,0.05)',
                        border: '1px solid rgba(59,130,246,0.2)',
                        color: 'var(--accent)',
                        cursor: 'pointer',
                    }}
                    aria-label={`Duplicate role ${role.name}`}
                >
                    <Copy size={16} aria-hidden="true" />
                </button>
                <button
                    onClick={onDelete}
                    style={{
                        padding: '0.5rem',
                        borderRadius: 10,
                        background: 'rgba(239,68,68,0.05)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: 'var(--error)',
                        cursor: 'pointer',
                    }}
                    aria-label={`Delete role ${role.name}`}
                >
                    <Trash2 size={16} aria-hidden="true" />
                </button>
            </div>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--slate-300)', lineHeight: 1.5, margin: 0, flex: 1 }}>
            {role.description}
        </p>

        {assignmentCount > 0 && (
            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    background: 'rgba(59,130,246,0.08)',
                    padding: '0.3rem 0.6rem',
                    borderRadius: 8,
                    width: 'fit-content',
                }}
            >
                <UserCog size={14} aria-hidden="true" /> {assignmentCount} node
                {assignmentCount !== 1 ? 's' : ''} assigned
            </div>
        )}

        {stats && (
            <div
                style={{
                    display: 'flex',
                    gap: '1.5rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '0.75rem',
                }}
            >
                <div>
                    <span style={{ color: 'var(--slate-500)' }}>Calls: </span>
                    <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>{stats.invocations}</span>
                </div>
                <div>
                    <span style={{ color: 'var(--slate-500)' }}>Errors: </span>
                    <span
                        style={{ color: stats.errors > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}
                    >
                        {stats.errors}
                    </span>
                </div>
                <div>
                    <span style={{ color: 'var(--slate-500)' }}>Avg: </span>
                    <span style={{ color: 'var(--slate-200)', fontWeight: 700 }}>
                        {stats.avgLatency.toFixed(0)}ms
                    </span>
                </div>
                {onFeedback && (
                    <div
                        style={{
                            display: 'flex',
                            gap: 4,
                            marginLeft: 'auto',
                            alignItems: 'center',
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback(role.id, true);
                            }}
                            style={{
                                padding: '0.25rem 0.4rem',
                                borderRadius: 6,
                                border: '1px solid rgba(16,185,129,0.3)',
                                background: 'rgba(16,185,129,0.08)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                lineHeight: 1,
                            }}
                            title="Positive feedback"
                        >
                            <ThumbsUp size={12} />{' '}
                            {stats.feedbackScore > 0 ? stats.feedbackScore : ''}
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onFeedback(role.id, false);
                            }}
                            style={{
                                padding: '0.25rem 0.4rem',
                                borderRadius: 6,
                                border: '1px solid rgba(239,68,68,0.3)',
                                background: 'rgba(239,68,68,0.08)',
                                color: 'var(--error)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                lineHeight: 1,
                            }}
                            title="Negative feedback"
                        >
                            <ThumbsDown size={12} />
                        </button>
                    </div>
                )}
            </div>
        )}

        {!validation.valid && (
            <div
                style={{
                    display: 'flex',
                    gap: 6,
                    alignItems: 'center',
                    padding: '0.4rem 0.6rem',
                    background: 'var(--warning-tint)',
                    borderRadius: 8,
                    fontSize: '0.7rem',
                    color: 'var(--warning)',
                }}
            >
                <AlertTriangle size={12} aria-hidden="true" /> Missing tools:{' '}
                {validation.missingTools.join(', ')}
            </div>
        )}

        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                paddingTop: '1rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
            }}
        >
            {vars.length > 0 && (
                <div>
                    <span
                        style={{
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            color: 'var(--slate-500)',
                            fontWeight: 800,
                            marginBottom: '0.4rem',
                            display: 'block',
                        }}
                    >
                        Dynamic Injections
                    </span>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {vars.slice(0, 3).map((v) => (
                            <span
                                key={v}
                                style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    color: 'var(--warning)',
                                    background: 'var(--warning-tint)',
                                    border: '1px solid rgba(245,158,11,0.2)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <Code size={10} aria-hidden="true" /> {v}
                            </span>
                        ))}
                        {vars.length > 3 && (
                            <span
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--slate-400)',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: 8,
                                }}
                            >
                                +{vars.length - 3}
                            </span>
                        )}
                    </div>
                </div>
            )}

            <div>
                <span
                    style={{
                        fontSize: '0.65rem',
                        textTransform: 'uppercase',
                        color: 'var(--slate-500)',
                        fontWeight: 800,
                        marginBottom: '0.4rem',
                        display: 'block',
                    }}
                >
                    Assigned Tools
                </span>
                <div
                    style={{
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.75rem',
                        borderRadius: 10,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {(role.capabilities || []).length > 0 ? (
                        (role.capabilities || []).map((cap) => (
                            <span
                                key={cap}
                                style={{
                                    fontSize: '0.7rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.3rem 0.6rem',
                                    borderRadius: 8,
                                    color: 'var(--slate-200)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <Wrench size={10} color="#3b82f6" aria-hidden="true" />{' '}
                                {availableTools.find((t) => t.id === cap)?.name || cap}
                            </span>
                        ))
                    ) : (
                        <span
                            style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontStyle: 'italic' }}
                        >
                            {t('roles.no_tools')}
                        </span>
                    )}
                </div>
            </div>
        </div>
    </motion.div>
);
