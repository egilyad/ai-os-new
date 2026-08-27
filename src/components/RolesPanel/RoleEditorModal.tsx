import React, { useState } from 'react';
import {
    X,
    Settings2,
    SlidersHorizontal,
    ShieldCheck,
    CheckCircle2,
    Wrench,
    History,
    Palette,
    Variable,
} from 'lucide-react';
import { ModalShell } from '../ModalShell';
import type { Role } from '../../types/role';
import { RoleVersions } from './RoleVersions';
import { EmojiPicker } from './EmojiPicker';
import { ColorPicker } from './ColorPicker';
import { ShapePicker } from './ShapePicker';
import { ProceduralAvatar } from './ProceduralAvatar';
import { PromptStudio } from './PromptStudio';

interface RoleEditorModalProps {
    role: Role;
    availableTools: { id: string; name: string }[];
    onSave: () => void;
    onClose: () => void;
    onChange: (updated: Role) => void;
    t: (key: string) => string;
    nameInputRef: React.RefObject<HTMLInputElement | null>;
    allRoles?: Role[];
}

export const RoleEditorModal: React.FC<RoleEditorModalProps> = ({
    role: r,
    availableTools,
    onSave,
    onClose,
    onChange,
    t,
    nameInputRef,
    allRoles = [],
}) => {
    const [tab, setTab] = useState<'editor' | 'avatar' | 'history'>('editor');
    const handleRollback = () => {
        onSave();
    };

    const updateMeta = (patch: Partial<Role['metadata']>) => {
        onChange({ ...r, metadata: { ...r.metadata, ...patch } });
    };

    return (
        <ModalShell open onClose={onClose} width={850}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        padding: '2rem',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'rgba(59,130,246,0.15)',
                                borderRadius: 14,
                                border: '1px solid rgba(59,130,246,0.3)',
                            }}
                        >
                            <Settings2 size={28} color="#3b82f6" aria-hidden="true" />
                        </div>
                        <div>
                            <h3
                                style={{
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    margin: 0,
                                    color: 'var(--slate-50)',
                                }}
                            >
                                {r.id ? t('roles.edit_title') : t('roles.new_title')}
                            </h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                                {tab === 'avatar'
                                    ? 'Customize role appearance and avatar'
                                    : tab === 'history'
                                      ? 'Review and rollback changes'
                                      : 'Define core logic, system prompts, and capability access.'}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                            onClick={() => setTab('editor')}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 8,
                                border: 'none',
                                background:
                                    tab === 'editor' ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: tab === 'editor' ? '#60a5fa' : '#64748b',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Settings2 size={14} /> Editor
                        </button>
                        <button
                            onClick={() => setTab('avatar')}
                            style={{
                                padding: '0.4rem 0.8rem',
                                borderRadius: 8,
                                border: 'none',
                                background:
                                    tab === 'avatar' ? 'rgba(16,185,129,0.2)' : 'transparent',
                                color: tab === 'avatar' ? '#34d399' : '#64748b',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <Palette size={14} /> Avatar
                        </button>
                        {r.id && (
                            <button
                                onClick={() => setTab('history')}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: 8,
                                    border: 'none',
                                    background:
                                        tab === 'history' ? 'rgba(139,92,246,0.2)' : 'transparent',
                                    color: tab === 'history' ? '#a78bfa' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                <History size={14} /> History
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            style={{
                                padding: '0.6rem',
                                borderRadius: 10,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--slate-200)',
                                cursor: 'pointer',
                            }}
                            aria-label={t('common.aria.close_modal')}
                        >
                            <X size={20} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                {tab === 'history' && r.id ? (
                    <div style={{ padding: '1.5rem', maxHeight: 500, overflowY: 'auto' }}>
                        <RoleVersions roleId={r.id} onRollback={handleRollback} />
                    </div>
                ) : tab === 'avatar' ? (
                    <div style={{ padding: '2rem', overflowY: 'auto', maxHeight: 500 }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 12,
                                    minWidth: 120,
                                }}
                            >
                                <div
                                    style={{
                                        width: 80,
                                        height: 80,
                                        borderRadius: 20,
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {r.icon ? (
                                        <span style={{ fontSize: '2.5rem' }}>{r.icon}</span>
                                    ) : (
                                        <ProceduralAvatar
                                            seed={r.id || 'new'}
                                            size={64}
                                            shape={
                                                (r.metadata.avatarShape as
                                                    | 'circle'
                                                    | 'square'
                                                    | 'rounded'
                                                    | 'hexagon'
                                                    | 'shield'
                                                    | 'star') || 'circle'
                                            }
                                        />
                                    )}
                                </div>
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        textAlign: 'center',
                                    }}
                                >
                                    Live preview
                                </span>
                            </div>
                            <div
                                style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Emoji Icon
                                    </label>
                                    <EmojiPicker
                                        value={r.icon}
                                        onChange={(emoji) => onChange({ ...r, icon: emoji })}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Avatar Shape
                                    </label>
                                    <ShapePicker
                                        value={r.metadata.avatarShape}
                                        onChange={(shape) =>
                                            updateMeta({
                                                avatarShape: shape,
                                            })
                                        }
                                        seed={r.id || 'new'}
                                    />
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.7rem',
                                            fontWeight: 800,
                                            color: 'var(--slate-500)',
                                            marginBottom: '0.5rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}
                                    >
                                        Accent Color
                                    </label>
                                    <ColorPicker
                                        value={r.metadata.avatarColor}
                                        onChange={(color) =>
                                            updateMeta({
                                                avatarColor: color,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2rem',
                            overflowY: 'auto',
                        }}
                    >
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Blueprint Name
                                </label>
                                <input
                                    type="text"
                                    ref={nameInputRef}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: 10,
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '1rem',
                                    }}
                                    value={r.name}
                                    onChange={(e) => onChange({ ...r, name: e.target.value })}
                                    aria-label="Role name"
                                />
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    <span>{t('roles.temperature')}</span>
                                    <span
                                        style={{
                                            color: '#60a5fa',
                                            background: 'var(--accent-tint)',
                                            padding: '0.1rem 0.5rem',
                                            borderRadius: 6,
                                            fontFamily: 'monospace',
                                        }}
                                    >
                                        {r.baseTemperature}
                                    </span>
                                </label>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        padding: '0.85rem 1rem',
                                        borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.05)',
                                    }}
                                >
                                    <SlidersHorizontal
                                        size={18}
                                        color="#64748b"
                                        aria-hidden="true"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="2"
                                        step="0.1"
                                        value={r.baseTemperature}
                                        onChange={(e) =>
                                            onChange({
                                                ...r,
                                                baseTemperature: parseFloat(e.target.value),
                                            })
                                        }
                                        style={{
                                            flex: 1,
                                            cursor: 'pointer',
                                            accentColor: '#3b82f6',
                                            height: 6,
                                            borderRadius: 3,
                                            outline: 'none',
                                        }}
                                        aria-label="Temperature slider"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'block',
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.5rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                Objective Description
                            </label>
                            <input
                                type="text"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem 1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 10,
                                    color: 'white',
                                    outline: 'none',
                                    fontSize: '1rem',
                                }}
                                value={r.description || ''}
                                onChange={(e) => onChange({ ...r, description: e.target.value })}
                                aria-label="Role description"
                            />
                        </div>

                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '1.5rem',
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Parent Role
                                </label>
                                <select
                                    value={r.parentRoleId || ''}
                                    onChange={(e) =>
                                        onChange({
                                            ...r,
                                            parentRoleId: e.target.value || undefined,
                                        })
                                    }
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                >
                                    <option value="">None (standalone)</option>
                                    {allRoles
                                        .filter((p: Role) => p.id !== r.id)
                                        .map((p: Role) => (
                                            <option key={p.id} value={p.id}>
                                                {p.icon || '🧠'} {p.name}
                                            </option>
                                        ))}
                                </select>
                                {r.parentRoleId && (
                                    <div
                                        style={{
                                            marginTop: 6,
                                            fontSize: '0.7rem',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        Inherits permissions and prompt from parent. Override fields
                                        to customize.
                                    </div>
                                )}
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 800,
                                        color: 'var(--slate-500)',
                                        marginBottom: '0.5rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Metadata Tags
                                </label>
                                <input
                                    type="text"
                                    placeholder="comma-separated tags"
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem 0.8rem',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(0,0,0,0.3)',
                                        color: 'var(--slate-200)',
                                        fontSize: '0.85rem',
                                        outline: 'none',
                                    }}
                                    value={(r.metadata.tags || []).join(', ')}
                                    onChange={(e) =>
                                        updateMeta({
                                            tags: e.target.value
                                                .split(',')
                                                .map((s) => s.trim())
                                                .filter(Boolean),
                                        })
                                    }
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-500)',
                                    marginBottom: '0.75rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                <Variable size={16} color="#3b82f6" /> System Prompt
                            </label>
                            <PromptStudio
                                value={r.systemPrompt || ''}
                                onChange={(v) => onChange({ ...r, systemPrompt: v })}
                            />
                        </div>

                        <div>
                            <label
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    fontSize: '0.75rem',
                                    fontWeight: 800,
                                    color: 'var(--slate-500)',
                                    marginBottom: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}
                            >
                                <ShieldCheck size={18} color="#10b981" aria-hidden="true" /> Granted
                                Capabilities (Tools)
                            </label>
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                    gap: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '1.5rem',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                {availableTools.map((tool) => {
                                    const isEquipped = r.capabilities.includes(tool.id);
                                    return (
                                        <div
                                            key={tool.id}
                                            onClick={() => {
                                                const newCaps = isEquipped
                                                    ? r.capabilities.filter((id) => id !== tool.id)
                                                    : [...r.capabilities, tool.id];
                                                onChange({ ...r, capabilities: newCaps });
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={isEquipped}
                                            aria-label={`${tool.name} ${isEquipped ? 'equipped' : 'not equipped'}`}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: 12,
                                                transition: 'all 0.2s',
                                                background: isEquipped
                                                    ? 'linear-gradient(145deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)'
                                                    : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${isEquipped ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.05)'}`,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                fontSize: '0.9rem',
                                                fontWeight: 600,
                                                color: isEquipped ? '#f8fafc' : '#94a3b8',
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    const newCaps = isEquipped
                                                        ? r.capabilities.filter(
                                                              (id) => id !== tool.id,
                                                          )
                                                        : [...r.capabilities, tool.id];
                                                    onChange({ ...r, capabilities: newCaps });
                                                }
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '0.4rem',
                                                    background: isEquipped
                                                        ? '#3b82f6'
                                                        : 'rgba(255,255,255,0.05)',
                                                    borderRadius: 8,
                                                }}
                                            >
                                                {isEquipped ? (
                                                    <CheckCircle2
                                                        size={16}
                                                        color="white"
                                                        aria-hidden="true"
                                                    />
                                                ) : (
                                                    <Wrench
                                                        size={16}
                                                        color="#64748b"
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </div>
                                            {tool.name}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                <div
                    style={{
                        padding: '1.5rem 2rem',
                        borderTop: '1px solid rgba(255,255,255,0.05)',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.8rem 1.5rem',
                            borderRadius: 12,
                            fontWeight: 700,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-200)',
                            cursor: 'pointer',
                        }}
                        aria-label={t('common.cancel')}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onSave}
                        style={{
                            padding: '0.8rem 2rem',
                            borderRadius: 12,
                            fontWeight: 800,
                            background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                        }}
                        aria-label={t('common.save')}
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
};
