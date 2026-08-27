import React, { useState, useMemo, useEffect } from 'react';
import { Search, Download, CheckCircle2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roleService, eventBus, EVENTS, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('RoleLibrary');
import { LIBRARY_ROLES, getLibraryRolesByCategory } from '../../data/role-library';
import type { LibraryRole } from '../../data/role-library';
import type { RoleCategory } from '../../types/role';

const CATEGORIES: Array<{ key: LibraryRole['category'] | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'code', label: 'Code' },
    { key: 'writing', label: 'Writing' },
    { key: 'analysis', label: 'Analysis' },
    { key: 'moderation', label: 'Moderation' },
    { key: 'devops', label: 'DevOps' },
    { key: 'design', label: 'Design' },
];

const CATEGORY_BADGE: Record<
    LibraryRole['category'],
    { bg: string; color: string; label: string }
> = {
    code: { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', label: 'Code' },
    writing: { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', label: 'Writing' },
    analysis: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', label: 'Analysis' },
    moderation: { bg: 'rgba(245,158,11,0.12)', color: 'var(--warning)', label: 'Moderation' },
    devops: { bg: 'rgba(239,68,68,0.12)', color: '#f87171', label: 'DevOps' },
    design: { bg: 'rgba(236,72,153,0.12)', color: '#f472b6', label: 'Design' },
};

const CATEGORY_MAP_TO_ROLE_CATEGORY: Record<LibraryRole['category'], RoleCategory> = {
    code: 'technical',
    writing: 'creative',
    analysis: 'analytical',
    moderation: 'management',
    devops: 'technical',
    design: 'creative',
};

const RoleLibrary: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<LibraryRole['category'] | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        const existing = roleService.getAllRoles();
        const installed = new Set<string>();
        for (const r of existing) {
            const match = LIBRARY_ROLES.find((lr) => lr.name === r.name);
            if (match) installed.add(match.id);
        }
        setInstalledIds(installed);
    }, []);

    const filteredRoles = useMemo(() => {
        const base =
            activeCategory === 'all' ? LIBRARY_ROLES : getLibraryRolesByCategory(activeCategory);
        if (!searchQuery.trim()) return base;
        const q = searchQuery.toLowerCase();
        return base.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.description.toLowerCase().includes(q) ||
                r.tags.some((t) => t.toLowerCase().includes(q)),
        );
    }, [activeCategory, searchQuery]);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleInstall = (role: LibraryRole) => {
        if (installedIds.has(role.id)) return;
        try {
            roleService.addRole({
                name: role.name,
                description: role.description,
                systemPrompt: role.systemPrompt,
                baseTemperature: role.baseTemperature,
                capabilities: [...role.capabilities],
                permissions: [],
                metadata: {
                    category: CATEGORY_MAP_TO_ROLE_CATEGORY[role.category],
                    tags: role.tags,
                    author: 'role-library',
                },
            });
            setInstalledIds((prev) => new Set(prev).add(role.id));
            showToast(`${role.name} installed to your roles`);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `${role.name} added to roles`,
                type: 'success',
            });
        } catch (err) {
            LOGGER.warn('Failed to install role', String(err));
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: `Failed to install ${role.name}`,
                type: 'error',
            });
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        style={{
                            position: 'fixed',
                            top: 20,
                            left: '50%',
                            zIndex: 9999,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(16,185,129,0.95)',
                            color: 'white',
                            borderRadius: 12,
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <CheckCircle2 size={16} /> {toastMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter bar */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}
            >
                <div
                    style={{
                        display: 'flex',
                        gap: '0.4rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        padding: '0.3rem',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.key}
                            onClick={() => setActiveCategory(cat.key)}
                            style={{
                                padding: '0.4rem 0.9rem',
                                borderRadius: 10,
                                border: 'none',
                                background:
                                    activeCategory === cat.key
                                        ? 'rgba(59,130,246,0.2)'
                                        : 'transparent',
                                color: activeCategory === cat.key ? '#60a5fa' : '#94a3b8',
                                fontWeight: activeCategory === cat.key ? 800 : 600,
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                            }}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
                <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
                    <Search
                        size={14}
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--slate-500)',
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Search roles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 10,
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                    {filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Role grid */}
            {filteredRoles.length === 0 ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 12,
                        padding: '3rem 0',
                        color: 'var(--slate-500)',
                    }}
                >
                    <Search size={40} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        No roles match your search
                    </p>
                </div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: '1rem',
                    }}
                >
                    {filteredRoles.map((role) => {
                        const badge = CATEGORY_BADGE[role.category];
                        const isInstalled = installedIds.has(role.id);
                        return (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: 14,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    background: 'rgba(255,255,255,0.02)',
                                    backdropFilter: 'blur(10px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.85rem',
                                    transition: 'all 0.2s',
                                }}
                                whileHover={{
                                    y: -3,
                                    boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
                                    borderColor: 'rgba(59,130,246,0.3)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                marginBottom: 4,
                                            }}
                                        >
                                            <h4
                                                style={{
                                                    margin: 0,
                                                    fontSize: '1rem',
                                                    fontWeight: 800,
                                                    color: 'var(--slate-50)',
                                                }}
                                            >
                                                {role.name}
                                            </h4>
                                            <span
                                                style={{
                                                    fontSize: '0.6rem',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: 6,
                                                    background: badge.bg,
                                                    color: badge.color,
                                                    letterSpacing: '0.05em',
                                                }}
                                            >
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.8rem',
                                                color: 'var(--slate-400)',
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {role.description}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                    {role.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 3,
                                                fontSize: '0.6rem',
                                                fontWeight: 700,
                                                color: 'var(--slate-500)',
                                                background: 'rgba(255,255,255,0.04)',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: 6,
                                                border: '1px solid rgba(255,255,255,0.04)',
                                            }}
                                        >
                                            <Tag size={8} /> {tag}
                                        </span>
                                    ))}
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    <span>
                                        Temp:{' '}
                                        <strong style={{ color: 'var(--slate-200)' }}>
                                            {role.baseTemperature}
                                        </strong>
                                    </span>
                                    {role.capabilities.length > 0 && (
                                        <span>
                                            Tools:{' '}
                                            <strong style={{ color: 'var(--slate-200)' }}>
                                                {role.capabilities.length}
                                            </strong>
                                        </span>
                                    )}
                                    {role.recommendedModel && (
                                        <span>
                                            Model:{' '}
                                            <strong style={{ color: 'var(--slate-200)' }}>
                                                {role.recommendedModel.split(':')[1] ||
                                                    role.recommendedModel}
                                            </strong>
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleInstall(role)}
                                    disabled={isInstalled}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        padding: '0.55rem 1rem',
                                        borderRadius: 10,
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.8rem',
                                        cursor: isInstalled ? 'default' : 'pointer',
                                        background: isInstalled
                                            ? 'rgba(16,185,129,0.12)'
                                            : 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                        color: isInstalled ? '#34d399' : 'white',
                                        opacity: isInstalled ? 0.7 : 1,
                                        transition: 'all 0.15s',
                                    }}
                                    aria-label={
                                        isInstalled
                                            ? `${role.name} already installed`
                                            : `Install ${role.name}`
                                    }
                                >
                                    {isInstalled ? (
                                        <>
                                            <CheckCircle2 size={14} /> Installed
                                        </>
                                    ) : (
                                        <>
                                            <Download size={14} /> Install
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RoleLibrary;
