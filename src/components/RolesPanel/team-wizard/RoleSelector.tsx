import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import type { UnifiedRoleEntry } from '../../../kernel/contracts/unified-role';
import { card, chip, inputBase } from './wizard-constants';
import type { TeamState } from './wizard-constants';

interface RoleSelectorProps extends TeamState {
    roles: UnifiedRoleEntry[];
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ team, setTeam, roles }) => {
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');

    const categories = useMemo(() => {
        const cats = new Set(roles.map((r) => r.category));
        return Array.from(cats);
    }, [roles]);

    const filtered = useMemo(() => {
        let result = roles;
        if (category) result = result.filter((r) => r.category === category);
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (r) =>
                    r.name.toLowerCase().includes(q) ||
                    r.description.toLowerCase().includes(q) ||
                    r.category.toLowerCase().includes(q),
            );
        }
        return result;
    }, [roles, category, search]);

    const toggleRole = (roleId: string) => {
        setTeam((prev) => ({
            ...prev,
            roleIds: prev.roleIds?.includes(roleId)
                ? prev.roleIds.filter((id) => id !== roleId)
                : [...(prev.roleIds || []), roleId],
        }));
    };

    return (
        <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginBottom: 10 }}>
                Select at least one role for your team. Roles define the expertise of each team
                member.
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 10,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search roles..."
                        style={{ ...inputBase, padding: '6px 10px 6px 30px', fontSize: '0.8rem' }}
                    />
                </div>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(0,0,0,0.3)',
                        color: 'var(--slate-200)',
                        fontSize: '0.8rem',
                        outline: 'none',
                    }}
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {c} ({(roles as any).filter((r: any) => r.category === c).length})
                        </option>
                    ))}
                </select>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 6,
                    maxHeight: 300,
                    overflowY: 'auto',
                    padding: '4px 0',
                }}
            >
                {filtered.slice(0, 100).map((r) => {
                    const selected = team.roleIds?.includes(r.id);
                    return (
                        <div
                            key={r.id}
                            onClick={() => toggleRole(r.id)}
                            style={{
                                ...card,
                                padding: '8px 10px',
                                border: selected
                                    ? '1px solid rgba(59,130,246,0.4)'
                                    : '1px solid rgba(255,255,255,0.06)',
                                background: selected
                                    ? 'rgba(59,130,246,0.1)'
                                    : 'rgba(255,255,255,0.03)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            <div
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 4,
                                    border: `2px solid ${selected ? '#3b82f6' : 'rgba(255,255,255,0.2)'}`,
                                    background: selected ? '#3b82f6' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {selected && <Check size={10} color="white" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                    style={{
                                        fontWeight: 600,
                                        color: selected ? '#e2e8f0' : '#94a3b8',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {r.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--slate-500)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                    }}
                                >
                                    {r.description}
                                </div>
                            </div>
                            <span
                                style={{ ...chip('#64748b'), fontSize: '0.55rem', flexShrink: 0 }}
                            >
                                {r.category}
                            </span>
                        </div>
                    );
                })}
            </div>
            <div
                style={{
                    fontSize: '0.75rem',
                    color: '#60a5fa',
                    marginTop: 8,
                    fontWeight: 600,
                }}
            >
                {team.roleIds?.length || 0} role(s) selected
            </div>
        </div>
    );
};

export default RoleSelector;
