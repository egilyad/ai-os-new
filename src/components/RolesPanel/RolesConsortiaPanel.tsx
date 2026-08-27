import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { Users, BookOpen, LayoutTemplate, Search, Users2, Plus } from 'lucide-react';
import type {
    UnifiedRoleEntry,
    Consilium,
    GroupTemplate,
    IUnifiedRoleRegistry,
} from '../../kernel/contracts/unified-role';
import type { RoleTeam } from '../../kernel/contracts/role-team';
import type { ILifecycle } from '../../kernel/contracts/lifecycle';
import { roleTeamService } from '../../kernel/instances';
import RolesTab from './RolesTab';
import ConsiliaTab from './ConsiliaTab';
import TemplatesTab from './TemplatesTab';
import TeamsTab from './TeamsTab';
import { tabStyle } from './consortia-constants';

type Tab = 'roles' | 'consilia' | 'templates' | 'teams';

const RolesConsortiaPanel: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>('roles');
    const [search, setSearch] = useState('');
    const [svc, setSvc] = useState<IUnifiedRoleRegistry | null>(null);
    const [filterCat, setFilterCat] = useState<string>('');
    const teamSvc = roleTeamService;
    const [teams, setTeams] = useState<RoleTeam[]>([]);

    const isMountedRef = useRef(true);
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const m: { unifiedRoleRegistry: IUnifiedRoleRegistry } =
                    await import('../../kernel/instances');
                if (isMountedRef.current) setSvc(m.unifiedRoleRegistry);
            } catch {
                /* silent */
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                await (teamSvc as unknown as ILifecycle).init();
            } catch {
                /* silent */
            }
            if (isMountedRef.current) setTeams(teamSvc.listTeams());
        })();
    }, [teamSvc]);

    const roles = useMemo(() => {
        if (!svc) return [];
        const all: UnifiedRoleEntry[] = svc.listRoles();
        let filtered = all;
        if (filterCat) filtered = filtered.filter((r) => r.category === filterCat);
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(
                (r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
            );
        }
        return filtered;
    }, [svc, filterCat, search]);

    const consilia = useMemo(() => {
        if (!svc) return [];
        const all: Consilium[] = svc.listConsilia();
        if (search) {
            const q = search.toLowerCase();
            return all.filter(
                (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
            );
        }
        return all;
    }, [svc, search]);

    const templates = useMemo(() => {
        if (!svc) return [];
        const all: GroupTemplate[] = svc.listTemplates();
        if (search) {
            const q = search.toLowerCase();
            return all.filter(
                (tpl) =>
                    tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q),
            );
        }
        return all;
    }, [svc, search]);

    const teamTemplates = useMemo(() => teamSvc.getTemplates(), [teamSvc]);

    const categories = svc ? svc.getCategories() : [];
    const consTypes = svc ? svc.getConsiliumTypes() : [];
    const tmplCats = svc ? svc.getTemplateCategories() : [];

    return (
        <div style={{ padding: 24, maxWidth: 1100 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                }}
            >
                <div>
                    <h2
                        style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-200)' }}
                    >
                        {t('roles_consortia.title') || 'Roles & Consortia'}
                    </h2>
                    <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--slate-500)' }}>
                        {t('roles_consortia.subtitle') ||
                            'Unified role registry — 500+ roles, 50+ consilia, 100+ group templates'}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {(['roles', 'consilia', 'templates', 'teams'] as Tab[]).map((label) => (
                    <button
                        key={label}
                        style={tabStyle(tab === label)}
                        onClick={() => setTab(label)}
                    >
                        {label === 'roles' ? (
                            <Users size={16} />
                        ) : label === 'consilia' ? (
                            <BookOpen size={16} />
                        ) : label === 'templates' ? (
                            <LayoutTemplate size={16} />
                        ) : (
                            <Users2 size={16} />
                        )}
                        {label === 'roles'
                            ? `Roles (${roles.length})`
                            : label === 'consilia'
                              ? `Consilia (${consilia.length})`
                              : label === 'templates'
                                ? `Templates (${templates.length})`
                                : `Teams (${teams.length})`}
                    </button>
                ))}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 16,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 400 }}>
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
                        placeholder={t('roles_consortia.search') || 'Search...'}
                        style={{
                            width: '100%',
                            padding: '8px 12px 8px 32px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.85rem',
                            outline: 'none',
                        }}
                    />
                </div>
                {tab === 'roles' && (
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                            outline: 'none',
                        }}
                    >
                        <option value="">All Categories</option>
                        {categories.map((c: string) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                )}
                {tab === 'consilia' && (
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                            outline: 'none',
                        }}
                    >
                        <option value="">All Types</option>
                        {consTypes.map((t: string) => (
                            <option key={t} value={t}>
                                {t}
                            </option>
                        ))}
                    </select>
                )}
                {tab === 'templates' && (
                    <select
                        value={filterCat}
                        onChange={(e) => setFilterCat(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--slate-200)',
                            fontSize: '0.8rem',
                            outline: 'none',
                        }}
                    >
                        <option value="">All Categories</option>
                        {tmplCats.map((c: string) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                )}
                {tab === 'teams' && (
                    <button
                        onClick={() => setTab('teams')}
                        style={{
                            padding: '8px 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'rgba(59,130,246,0.2)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Plus size={14} /> Create Team
                    </button>
                )}
            </div>

            {tab === 'roles' && <RolesTab roles={roles} />}
            {tab === 'consilia' && <ConsiliaTab consilia={consilia} />}
            {tab === 'templates' && <TemplatesTab templates={templates} />}
            {tab === 'teams' && (
                <TeamsTab
                    teamSvc={teamSvc}
                    teams={teams}
                    setTeams={setTeams}
                    roles={roles}
                    teamTemplates={teamTemplates}
                />
            )}
        </div>
    );
};

export default RolesConsortiaPanel;
