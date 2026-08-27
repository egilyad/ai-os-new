import React, { useState, useCallback, useRef } from 'react';
import {
    ShieldCheck,
    Check,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Download,
    Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Role, RolePermission } from '../../types/role';
import { DEFAULT_ROLE_PERMISSIONS } from '../../types/role';
import { glassPanel } from '../../styles/common';
import { rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('PermissionMatrix');

const ALL_PERMISSIONS: RolePermission[] = [
    'chat:send',
    'chat:read',
    'memory:read',
    'memory:write',
    'memory:delete',
    'tools:execute',
    'tools:manage',
    'agents:spawn',
    'agents:manage',
    'roles:manage',
    'connectors:use',
    'connectors:manage',
    'skills:use',
    'skills:manage',
    'settings:read',
    'settings:write',
    'system:admin',
    'system:monitor',
    'debate:participate',
    'orchestration:design',
];

const PERM_CATEGORIES: Record<string, RolePermission[]> = {
    Chat: ['chat:send', 'chat:read'],
    Memory: ['memory:read', 'memory:write', 'memory:delete'],
    Tools: ['tools:execute', 'tools:manage'],
    Agents: ['agents:spawn', 'agents:manage'],
    Roles: ['roles:manage'],
    Connectors: ['connectors:use', 'connectors:manage'],
    Skills: ['skills:use', 'skills:manage'],
    Settings: ['settings:read', 'settings:write'],
    System: ['system:admin', 'system:monitor'],
    Debate: ['debate:participate'],
    Orchestration: ['orchestration:design'],
};

const permColor = (p: RolePermission): string => {
    if (p.startsWith('chat')) return '#3b82f6';
    if (p.startsWith('memory')) return '#10b981';
    if (p.startsWith('tools')) return '#a855f7';
    if (p.startsWith('agents')) return '#f59e0b';
    if (p.startsWith('roles')) return '#ef4444';
    if (p.startsWith('connectors')) return '#06b6d4';
    if (p.startsWith('skills')) return '#8b5cf6';
    if (p.startsWith('settings')) return '#64748b';
    if (p.startsWith('system')) return '#dc2626';
    if (p.startsWith('debate')) return '#14b8a6';
    if (p.startsWith('orchestration')) return '#ec4899';
    return '#64748b';
};

interface PermissionMatrixProps {
    roles: Role[];
    onUpdate: (roleId: string, permissions: string[]) => void;
}

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({ roles, onUpdate }) => {
    const [expanded, setExpanded] = useState(true);
    const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
    const [selectionStart, setSelectionStart] = useState<{ row: number; col: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ row: number; col: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const toggleCategory = (cat: string) => {
        setCollapsedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const togglePerm = useCallback(
        (roleId: string, perm: RolePermission) => {
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;
            const has = role.permissions.includes(perm);
            const newPerms = has
                ? role.permissions.filter((p) => p !== perm)
                : [...role.permissions, perm];
            onUpdate(roleId, newPerms);
        },
        [roles, onUpdate],
    );

    const toggleAllInCategory = useCallback(
        (cat: string, role: Role) => {
            const perms = PERM_CATEGORIES[cat] || [];
            const rolePerms = role.permissions as RolePermission[];
            const allHave = perms.every((p) => rolePerms.includes(p));
            const newPerms = allHave
                ? rolePerms.filter((p) => !perms.includes(p))
                : [...new Set([...rolePerms, ...perms])];
            onUpdate(role.id, newPerms);
        },
        [onUpdate],
    );

    const selectAll = useCallback(() => {
        roles.forEach((r) => onUpdate(r.id, [...ALL_PERMISSIONS]));
    }, [roles, onUpdate]);

    const selectNone = useCallback(() => {
        roles.forEach((r) => onUpdate(r.id, []));
    }, [roles, onUpdate]);

    const applyPreset = useCallback(
        (cat: string) => {
            const catPerms = PERM_CATEGORIES[cat];
            if (catPerms) {
                roles.forEach((r) => onUpdate(r.id, [...catPerms]));
            } else {
                roles.forEach((r) => {
                    const defaultPerms =
                        DEFAULT_ROLE_PERMISSIONS[r.metadata.category] ||
                        DEFAULT_ROLE_PERMISSIONS.custom;
                    onUpdate(r.id, defaultPerms);
                });
            }
        },
        [roles, onUpdate],
    );

    // Range selection via mouse drag
    const getCellFromEvent = (e: React.MouseEvent): { row: number; col: number } | null => {
        const grid = gridRef.current;
        if (!grid) return null;
        const cells = grid.querySelectorAll('[data-perm-cell]');
        for (const cell of cells) {
            const rect = cell.getBoundingClientRect();
            if (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            ) {
                return {
                    row: parseInt(cell.getAttribute('data-row') || '0'),
                    col: parseInt(cell.getAttribute('data-col') || '0'),
                };
            }
        }
        return null;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const cell = getCellFromEvent(e);
        if (!cell) return;
        setSelectionStart(cell);
        setSelectionEnd(cell);
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        const cell = getCellFromEvent(e);
        if (cell) setSelectionEnd(cell);
    };

    const handleMouseUp = () => {
        if (isDragging && selectionStart && selectionEnd) {
            const minRow = Math.min(selectionStart.row, selectionEnd.row);
            const maxRow = Math.max(selectionStart.row, selectionEnd.row);
            const minCol = Math.min(selectionStart.col, selectionEnd.col);
            const maxCol = Math.max(selectionStart.col, selectionEnd.col);

            const selectedPerms = ALL_PERMISSIONS.slice(minRow, maxRow + 1);
            const selectedRoles = roles.slice(minCol, maxCol + 1);

            selectedRoles.forEach((r) => {
                const combined = new Set(r.permissions);
                selectedPerms.forEach((p) => combined.add(p));
                onUpdate(r.id, [...combined]);
            });
        }
        setIsDragging(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    const isInSelection = (row: number, col: number): boolean => {
        if (!selectionStart || !selectionEnd) return false;
        const minRow = Math.min(selectionStart.row, selectionEnd.row);
        const maxRow = Math.max(selectionStart.row, selectionEnd.row);
        const minCol = Math.min(selectionStart.col, selectionEnd.col);
        const maxCol = Math.max(selectionStart.col, selectionEnd.col);
        return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
    };

    const getPermCount = (role: Role) => role.permissions.length;

    // Export
    const exportMatrix = () => {
        const data = roles.map((r) => ({ name: r.name, permissions: r.permissions }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'permission-matrix.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyMatrix = () => {
        const lines = roles.map((r) => `${r.name}: ${r.permissions.join(', ') || '(none)'}`);
        navigator.clipboard.writeText(lines.join('\n')).catch((e) => {
            // M10-07: Clipboard write failure is user-visible — alert them
            LOGGER.warn('Clipboard write failed', e);
            alert('Failed to copy to clipboard. Please try again.');
        });
    };

    return (
        <div
            style={{ ...glassPanel, overflow: 'hidden', marginBottom: '1.5rem' }}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.5rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            padding: '0.5rem',
                            background: 'rgba(168,85,247,0.15)',
                            borderRadius: 10,
                            border: '1px solid rgba(168,85,247,0.3)',
                        }}
                    >
                        <ShieldCheck size={20} color="#a855f7" />
                    </div>
                    <div>
                        <h3
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                margin: 0,
                            }}
                        >
                            Permission Matrix
                        </h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)', margin: 0 }}>
                            {roles.length} roles × {ALL_PERMISSIONS.length} permissions — drag to
                            select range
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowPresets(!showPresets);
                        }}
                        style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: 'var(--accent-tint)',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: 6,
                            color: '#60a5fa',
                            cursor: 'pointer',
                        }}
                    >
                        Presets
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            selectAll();
                        }}
                        style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: 'var(--success-tint)',
                            border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 6,
                            color: 'var(--success)',
                            cursor: 'pointer',
                        }}
                    >
                        All
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            selectNone();
                        }}
                        style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            background: 'var(--error-tint)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            color: 'var(--error)',
                            cursor: 'pointer',
                        }}
                    >
                        None
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            exportMatrix();
                        }}
                        style={{
                            padding: '0.3rem',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                        title="Export JSON"
                    >
                        <Download size={14} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            copyMatrix();
                        }}
                        style={{
                            padding: '0.3rem',
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                        }}
                        title="Copy to clipboard"
                    >
                        <Copy size={14} />
                    </button>
                    {expanded ? (
                        <ChevronUp size={16} color="#64748b" />
                    ) : (
                        <ChevronDown size={16} color="#64748b" />
                    )}
                </div>
            </div>

            {/* Preset bar */}
            <AnimatePresence>
                {showPresets && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                            overflow: 'hidden',
                            borderTop: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        <div
                            style={{
                                padding: '0.75rem 1.5rem',
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                            }}
                        >
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--slate-400)',
                                    fontWeight: 700,
                                    marginRight: '0.5rem',
                                }}
                            >
                                Apply category defaults to all roles:
                            </span>
                            {Object.keys(PERM_CATEGORIES).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => applyPreset(cat)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 6,
                                        color: 'var(--slate-200)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Matrix grid */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div
                            ref={gridRef}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            style={{ minWidth: 'max-content', padding: '0.5rem' }}
                        >
                            {/* Column headers (role names) */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `200px repeat(${roles.length}, 60px)`,
                                    gap: 0,
                                    marginBottom: '0.25rem',
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 2,
                                    background: 'rgba(15,23,42,0.95)',
                                    backdropFilter: 'blur(8px)',
                                }}
                            >
                                <div /> {/* empty top-left corner */}
                                {roles.map((role, _ci) => (
                                    <div
                                        key={role.id}
                                        style={{
                                            textAlign: 'center',
                                            padding: '0.5rem 0.25rem',
                                            borderLeft: '1px solid rgba(255,255,255,0.05)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                color: 'var(--slate-50)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 58,
                                            }}
                                            title={role.name}
                                        >
                                            {role.name.length > 8
                                                ? role.name.slice(0, 7) + '…'
                                                : role.name}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.55rem',
                                                color: 'var(--slate-500)',
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {getPermCount(role)}/{ALL_PERMISSIONS.length}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Rows by category */}
                            {Object.entries(PERM_CATEGORIES).map(([cat, perms]) => {
                                const isCollapsed = collapsedCategories.has(cat);
                                return (
                                    <div key={cat}>
                                        {/* Category header row */}
                                        <div
                                            onClick={() => toggleCategory(cat)}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: `200px repeat(${roles.length}, 60px)`,
                                                gap: 0,
                                                cursor: 'pointer',
                                                userSelect: 'none',
                                                background: 'rgba(255,255,255,0.02)',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    padding: '0.4rem 0.75rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 800,
                                                    color: 'var(--slate-400)',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                }}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight size={12} />
                                                ) : (
                                                    <ChevronDown size={12} />
                                                )}
                                                {cat}
                                                <span
                                                    style={{
                                                        fontSize: '0.55rem',
                                                        color: 'var(--slate-500)',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    ({perms.length})
                                                </span>
                                            </div>
                                            {roles.map((role) => {
                                                const catPerms = perms;
                                                const activeCount = catPerms.filter((p) =>
                                                    role.permissions.includes(p),
                                                ).length;
                                                const allHave = activeCount === catPerms.length;
                                                const noneHave = activeCount === 0;
                                                return (
                                                    <div
                                                        key={role.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            borderLeft:
                                                                '1px solid rgba(255,255,255,0.05)',
                                                            padding: '0.25rem',
                                                        }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleAllInCategory(cat, role);
                                                            }}
                                                            style={{
                                                                width: 18,
                                                                height: 18,
                                                                borderRadius: 4,
                                                                border: `1px solid ${allHave ? '#10b981' : noneHave ? 'rgba(255,255,255,0.15)' : '#f59e0b'}`,
                                                                background: allHave
                                                                    ? '#10b98120'
                                                                    : noneHave
                                                                      ? 'transparent'
                                                                      : '#f59e0b20',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                cursor: 'pointer',
                                                                padding: 0,
                                                            }}
                                                            title={
                                                                allHave
                                                                    ? 'Remove all'
                                                                    : noneHave
                                                                      ? 'Grant all'
                                                                      : `Grant ${activeCount}/${catPerms.length}`
                                                            }
                                                        >
                                                            {allHave && (
                                                                <Check size={10} color="#10b981" />
                                                            )}
                                                            {!allHave && !noneHave && (
                                                                <span
                                                                    style={{
                                                                        fontSize: '0.45rem',
                                                                        fontWeight: 800,
                                                                        color: 'var(--warning)',
                                                                    }}
                                                                >
                                                                    {activeCount}
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Permission rows */}
                                        {!isCollapsed &&
                                            perms.map((perm) => {
                                                return (
                                                    <div
                                                        key={perm}
                                                        style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: `200px repeat(${roles.length}, 60px)`,
                                                            gap: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: '0.35rem 0.75rem',
                                                                fontSize: '0.7rem',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '0.5rem',
                                                                borderLeft: `3px solid ${permColor(perm)}`,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: 'var(--slate-200)',
                                                                    fontWeight: 600,
                                                                }}
                                                            >
                                                                {perm.split(':')[1]}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    fontSize: '0.55rem',
                                                                    color: 'var(--slate-500)',
                                                                    fontFamily: 'monospace',
                                                                }}
                                                            >
                                                                {perm.split(':')[0]}
                                                            </span>
                                                        </div>
                                                        {roles.map((role, ci) => {
                                                            const has =
                                                                role.permissions.includes(perm);
                                                            const row =
                                                                ALL_PERMISSIONS.indexOf(perm);
                                                            const selected = isInSelection(row, ci);
                                                            return (
                                                                <div
                                                                    key={role.id}
                                                                    data-perm-cell="true"
                                                                    data-row={row}
                                                                    data-col={ci}
                                                                    onClick={() =>
                                                                        togglePerm(role.id, perm)
                                                                    }
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        borderLeft:
                                                                            '1px solid rgba(255,255,255,0.05)',
                                                                        cursor: 'pointer',
                                                                        background: selected
                                                                            ? 'rgba(168,85,247,0.2)'
                                                                            : has
                                                                              ? `${permColor(perm)}10`
                                                                              : 'transparent',
                                                                        transition:
                                                                            'background 0.15s',
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            width: 22,
                                                                            height: 22,
                                                                            borderRadius: 6,
                                                                            border: `1.5px solid ${has ? permColor(perm) : 'rgba(255,255,255,0.1)'}`,
                                                                            background: has
                                                                                ? `${permColor(perm)}25`
                                                                                : 'transparent',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent:
                                                                                'center',
                                                                            transition: 'all 0.15s',
                                                                        }}
                                                                    >
                                                                        {has && (
                                                                            <Check
                                                                                size={12}
                                                                                color={permColor(
                                                                                    perm,
                                                                                )}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Coverage bar */}
                        <div
                            style={{
                                padding: '0.75rem 1.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                gap: '1.5rem',
                                alignItems: 'center',
                                fontSize: '0.7rem',
                                color: 'var(--slate-400)',
                                background: 'rgba(0,0,0,0.15)',
                            }}
                        >
                            <span style={{ fontWeight: 700 }}>Coverage:</span>
                            {Object.entries(PERM_CATEGORIES)
                                .slice(0, 6)
                                .map(([cat, perms]) => {
                                    const total = perms.length * roles.length;
                                    const active = perms.reduce(
                                        (sum, p) =>
                                            sum +
                                            roles.filter((r) => r.permissions.includes(p)).length,
                                        0,
                                    );
                                    const pct = total > 0 ? Math.round((active / total) * 100) : 0;
                                    return (
                                        <div
                                            key={cat}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.3rem',
                                            }}
                                        >
                                            <span>{cat}</span>
                                            <div
                                                style={{
                                                    width: 40,
                                                    height: 4,
                                                    borderRadius: 2,
                                                    background: 'var(--border-default)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${pct}%`,
                                                        height: '100%',
                                                        background:
                                                            pct === 100
                                                                ? '#10b981'
                                                                : pct > 50
                                                                  ? '#f59e0b'
                                                                  : '#ef4444',
                                                        borderRadius: 2,
                                                        transition: 'width 0.3s',
                                                    }}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: '0.6rem',
                                                    fontFamily: 'monospace',
                                                    color: pct === 100 ? '#10b981' : '#f59e0b',
                                                }}
                                            >
                                                {pct}%
                                            </span>
                                        </div>
                                    );
                                })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
