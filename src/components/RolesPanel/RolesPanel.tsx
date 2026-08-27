import { genId } from '../../utils/gen-id';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Play, BookOpen, UserCog, AlertTriangle, Archive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roleService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('RolesPanel');
import type { Role } from '../../types/role';
import type { RoleUsageStats } from '../../kernel/instances';
import { RoleCard } from './RoleCard';
import { RoleEditorModal } from './RoleEditorModal';
import { toolService } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { RoleAnalytics } from './RoleAnalytics';
import { PermissionMatrix } from './PermissionMatrix';
import RoleLibrary from './RoleLibrary';
import { RoleSandbox } from './RoleSandbox';
import {
    dismissBtnRed,
    errorBannerLg,
    pageSubtitleMuted,
    pageTitleLarge,
    searchIconAbsolute,
    searchInputLarge,
    sectionHeaderBottom,
} from '../../styles/common';
import { useConfirm } from '../../hooks/useConfirm';

const generateId = (): string => genId();

const RolesPanel: React.FC = () => {
    const { confirm, ConfirmDialog } = useConfirm();
    const [view, setView] = useState<'my-roles' | 'library'>('my-roles');
    const [showSandbox, setShowSandbox] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSource, setFilterSource] = useState<'all' | 'builtin' | 'custom'>('all');
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [stats, setStats] = useState<Record<string, RoleUsageStats>>({});
    const [retireCandidates, setRetireCandidates] = useState<
        Array<{ id: string; name: string; daysInactive: number }>
    >([]);
    const [error, setError] = useState<string | null>(null);

    const availableTools = (() => {
        try {
            return toolService.getTools();
        } catch {
            return [];
        }
    })();
    const { t } = useTranslation();
    const isMountedRef = useRef(true);
    const nameInputRef = useRef<HTMLInputElement>(null);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        isMountedRef.current = true;
        const load = () => {
            const allRoles = roleService.getAllRoles() ?? [];
            if (isMountedRef.current) setRoles(allRoles);
            if (isMountedRef.current) setStats(roleService.getAllStats() ?? {});
            if (isMountedRef.current) setLoading(false);
        };
        load();

        const unsub = eventBus.on(EVENTS.ROLES_UPDATED, () => {
            if (!isMountedRef.current) return;
            setRoles(roleService.getAllRoles() ?? []);
            setStats(roleService.getAllStats() ?? {});
        });

        return () => {
            isMountedRef.current = false;
            unsub();
        };
    }, []);

    const getAssignmentCount = (roleId: string) => roleService.getAgentsByRole(roleId).length;
    const validate = (roleId: string) => roleService.validateRole(roleId);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (
            !(await confirm({
                title: 'Delete Role',
                message: t('roles.confirm_delete'),
                variant: 'danger',
            }))
        )
            return;
        try {
            roleService.deleteRole(id);
            if (isMountedRef.current) setError(null);
        } catch (err) {
            LOGGER.warn('Failed to delete role', String(err));
            if (isMountedRef.current) {
                setError(t('roles.error_delete'));
                clearError();
            }
            eventBus.emit(EVENTS.NOTIFICATION, { message: t('roles.error_delete'), type: 'error' });
        }
    };

    const handleSave = () => {
        if (!editingRole) return;
        try {
            const existing = roles.find((r) => r.id === editingRole.id);
            if (existing) {
                roleService.updateRole(editingRole.id, editingRole);
            } else {
                const newRole: Omit<Role, 'id'> = {
                    name: editingRole.name,
                    description: editingRole.description,
                    systemPrompt: editingRole.systemPrompt,
                    baseTemperature: editingRole.baseTemperature,
                    capabilities: editingRole.capabilities,
                    permissions: editingRole.permissions,
                    metadata: { ...editingRole.metadata, created: Date.now(), updated: Date.now() },
                };
                roleService.addRole(newRole);
            }
            if (isMountedRef.current) {
                setEditingRole(null);
                setError(null);
            }
        } catch (err) {
            LOGGER.warn('Failed to save role', String(err));
            if (isMountedRef.current) {
                setError(t('roles.error_save'));
                clearError();
            }
            eventBus.emit(EVENTS.NOTIFICATION, { message: t('roles.error_save'), type: 'error' });
        }
    };

    const handleFeedback = useCallback((roleId: string, positive: boolean) => {
        roleService.recordRoleFeedback(roleId, positive);
        setStats(roleService.getAllStats() ?? {});
    }, []);

    const handlePromote = useCallback((roleId: string) => {
        roleService.promoteToBuiltin(roleId);
        setRoles(roleService.getAllRoles() ?? []);
        setRetireCandidates(roleService.getRetirementCandidates(90) ?? []);
        eventBus.emit(EVENTS.NOTIFICATION, {
            message: 'Role promoted to built-in',
            type: 'success',
        });
    }, []);

    useEffect(() => {
        setRetireCandidates(roleService.getRetirementCandidates(90) ?? []);
    }, [stats]);

    const handleDuplicate = useCallback(
        (role: Role, e: React.MouseEvent) => {
            e.stopPropagation();
            const now = Date.now();
            const clone: Omit<Role, 'id'> = {
                name: `${role.name} (copy)`,
                description: role.description,
                systemPrompt: role.systemPrompt,
                baseTemperature: role.baseTemperature,
                capabilities: [...(role.capabilities || [])],
                permissions: [...role.permissions],
                metadata: { ...role.metadata, created: now, updated: now },
            };
            try {
                roleService.addRole(clone);
                if (isMountedRef.current) setError(null);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: `Role '${role.name}' duplicated`,
                    type: 'success',
                });
            } catch (err) {
                LOGGER.warn('Failed to duplicate role', String(err));
                if (isMountedRef.current) {
                    setError(t('roles.error_duplicate'));
                    clearError();
                }
            }
        },
        [clearError, t],
    );

    const createNewRole = () => {
        if (isMountedRef.current) {
            setEditingRole({
                id: generateId(),
                name: 'New Agent Role',
                description: 'A new specialized agent...',
                systemPrompt: 'You are an autonomous AI agent. Your primary objective is {{task}}.',
                baseTemperature: 0.5,
                capabilities: [],
                permissions: [],
                metadata: { category: 'technical', created: Date.now(), updated: Date.now() },
            });
        }
    };

    const getSystemVariables = (prompt: string) => {
        const regex = /{{(.*?)}}/g;
        const vars: string[] = [];
        let match;
        while ((match = regex.exec(prompt)) !== null) {
            if (!vars.includes(match[1]!)) vars.push(match[1]!);
        }
        return vars;
    };

    const filteredRoles = roles
        .filter((r) => {
            if (filterSource === 'builtin') return r.isBuiltin;
            if (filterSource === 'custom') return !r.isBuiltin;
            return true;
        })
        .filter(
            (r) =>
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (r.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
        );

    const roleCategoryColor = (cat: string) => {
        switch (cat) {
            case 'technical':
                return '#3b82f6';
            case 'creative':
                return '#a855f7';
            case 'analytical':
                return '#10b981';
            case 'management':
                return '#f59e0b';
            default:
                return '#64748b';
        }
    };

    useEffect(() => {
        if (editingRole && isMountedRef.current) {
            const timeout = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timeout);
        }
    }, [editingRole]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--slate-400)',
                }}
            >
                <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {t('roles.loading')}
                </motion.div>
            </div>
        );
    }

    return (
        <div
            style={{
                color: 'var(--text-main)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto',
            }}
        >
            <div style={sectionHeaderBottom}>
                <div>
                    <h2 style={pageTitleLarge}>
                        <UserCog size={28} color="#3b82f6" aria-hidden="true" /> {t('roles.title')}
                    </h2>
                    <p style={pageSubtitleMuted}>{t('roles.subtitle')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* View toggle tabs */}
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.3rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 12,
                            padding: '0.3rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                        }}
                    >
                        <button
                            onClick={() => setView('my-roles')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: 'none',
                                background:
                                    view === 'my-roles' ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: view === 'my-roles' ? '#60a5fa' : '#94a3b8',
                                fontWeight: view === 'my-roles' ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            <UserCog size={14} /> My Roles
                        </button>
                        <button
                            onClick={() => setView('library')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: 'none',
                                background:
                                    view === 'library' ? 'rgba(59,130,246,0.2)' : 'transparent',
                                color: view === 'library' ? '#60a5fa' : '#94a3b8',
                                fontWeight: view === 'library' ? 800 : 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                            }}
                        >
                            <BookOpen size={14} /> Library
                        </button>
                    </div>
                    <button
                        onClick={() => setShowSandbox(true)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.5rem 1rem',
                            borderRadius: 10,
                            border: '1px solid rgba(99,102,241,0.3)',
                            background: 'rgba(99,102,241,0.08)',
                            color: '#818cf8',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                        }}
                    >
                        <Play size={14} /> Sandbox
                    </button>
                    {view === 'my-roles' && (
                        <button
                            onClick={createNewRole}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                border: 'none',
                                color: 'white',
                                borderRadius: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                            }}
                            aria-label="Create new role blueprint"
                        >
                            <Plus size={18} aria-hidden="true" /> {t('roles.create')}
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBannerLg}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={18} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={dismissBtnRed}
                            aria-label={t('common.dismiss_error')}
                        >
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {view === 'library' ? (
                <RoleLibrary />
            ) : (
                <>
                    {roles.length > 0 && <RoleAnalytics stats={stats} roles={roles} />}

                    {retireCandidates.length > 0 && (
                        <div
                            style={{
                                background: 'rgba(245,158,11,0.05)',
                                borderRadius: 10,
                                padding: '0.75rem',
                                border: '1px solid rgba(245,158,11,0.15)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    marginBottom: '0.5rem',
                                }}
                            >
                                <Archive size={14} color="#f59e0b" />
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: 'var(--warning)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}
                                >
                                    Retirement Candidates ({retireCandidates.length})
                                </span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {retireCandidates.slice(0, 5).map((c) => (
                                    <div
                                        key={c.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            padding: '0.4rem 0.5rem',
                                            background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 8,
                                        }}
                                    >
                                        <AlertTriangle size={12} color="#f59e0b" />
                                        <span
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--slate-200)',
                                                flex: 1,
                                            }}
                                        >
                                            {c.name}
                                        </span>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--slate-500)' }}>
                                            {c.daysInactive} days inactive
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {roles.length > 0 && (
                        <PermissionMatrix
                            roles={roles}
                            onUpdate={(roleId, permissions) => {
                                roleService.updateRole(roleId, { permissions });
                            }}
                        />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', width: '100%', maxWidth: 450 }}>
                            <Search size={16} style={searchIconAbsolute} aria-hidden="true" />
                            <input
                                type="text"
                                placeholder={t('roles.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={searchInputLarge}
                                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                                onBlur={(e) =>
                                    (e.target.style.borderColor = 'rgba(255,255,255,0.05)')
                                }
                                aria-label="Search role blueprints"
                            />
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 4,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                                padding: 3,
                                border: '1px solid rgba(255,255,255,0.05)',
                            }}
                        >
                            {(['all', 'builtin', 'custom'] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilterSource(f)}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background:
                                            filterSource === f
                                                ? 'rgba(59,130,246,0.2)'
                                                : 'transparent',
                                        color: filterSource === f ? '#60a5fa' : '#94a3b8',
                                        fontWeight: filterSource === f ? 700 : 500,
                                        fontSize: '0.75rem',
                                    }}
                                >
                                    {f === 'all' ? 'All' : f === 'builtin' ? 'Built-in' : 'Custom'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredRoles.length === 0 ? (
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 16,
                                height: '100%',
                                color: 'var(--slate-500)',
                            }}
                        >
                            <Search size={48} style={{ opacity: 0.3 }} aria-hidden="true" />
                            <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                {searchQuery ? t('roles.empty_search') : t('roles.empty_none')}
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                                {searchQuery
                                    ? t('roles.empty_search_desc')
                                    : t('roles.empty_none_desc')}
                            </p>
                        </div>
                    ) : (
                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                                gap: '1.5rem',
                                alignContent: 'start',
                                paddingRight: '0.5rem',
                            }}
                        >
                            <AnimatePresence>
                                {filteredRoles.map((role) => {
                                    const vars = getSystemVariables(role.systemPrompt || '');
                                    const s = stats[role.id];
                                    const validation = validate(role.id);
                                    const assignmentCount = getAssignmentCount(role.id);
                                    const catColor = roleCategoryColor(role.metadata.category);
                                    const shortId = role.id ? role.id.split('-')[0] : 'new';
                                    return (
                                        <RoleCard
                                            key={role.id}
                                            role={role}
                                            stats={s}
                                            availableTools={availableTools}
                                            assignmentCount={assignmentCount}
                                            validation={validation}
                                            vars={vars}
                                            catColor={catColor}
                                            shortId={shortId!}
                                            onEdit={() =>
                                                setEditingRole({
                                                    ...role,
                                                    capabilities: role.capabilities || [],
                                                })
                                            }
                                            onDelete={(e) => handleDelete(role.id, e)}
                                            onDuplicate={(e) => handleDuplicate(role, e)}
                                            onFeedback={handleFeedback}
                                            onPromote={handlePromote}
                                            t={t}
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}

            {editingRole && (
                <RoleEditorModal
                    role={editingRole}
                    allRoles={roles}
                    availableTools={availableTools}
                    onSave={handleSave}
                    onClose={() => setEditingRole(null)}
                    onChange={(updated) => setEditingRole(updated)}
                    t={t}
                    nameInputRef={nameInputRef}
                />
            )}
            <RoleSandbox isOpen={showSandbox} onClose={() => setShowSandbox(false)} />
            <ModuleInfo moduleKey="roles" />
            <ConfirmDialog />
        </div>
    );
};

export default RolesPanel;
