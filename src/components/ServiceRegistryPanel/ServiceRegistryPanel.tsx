import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { runtime } from '../../kernel/runtime';
import { useTranslation } from '../../i18n/useTranslation';
import { Search } from 'lucide-react';
import { eventBus, EVENTS } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import { SERVICE_PHASE, SERVICE_ROUTE_MAP, ROUTE_PATH, VALID_ROUTE_IDS } from './service-phases';
import { serviceSourceFiles, serviceSourcePaths } from './service-source-data';
import {
    styles,
    CORE_SERVICES,
    PHASE_ORDER,
    STORAGE_KEY,
    loadDecisions,
    type Decision,
    type ServiceInfo,
    type SortKey,
    type ViewTab,
} from './service-registry-shared';
import StatusBar from './StatusBar';
import DetailPanel from './DetailPanel';
import ServiceTable from './ServiceTable';
import UnmappedPanel, { type UnmappedGroup } from './UnmappedPanel';

const ServiceRegistryPanel: React.FC = () => {
    const { t } = useTranslation();
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<ViewTab>('all');
    const [services, setServices] = useState<string[]>([]);
    const [deps, setDeps] = useState<Record<string, string[]>>({});
    const [status, setStatus] = useState<{
        phase: string;
        uptime: number;
        servicesReady: number;
        servicesTotal: number;
    } | null>(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now);
    const [now, setNow] = useState(Date.now);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortAsc, setSortAsc] = useState(true);
    const [decisions, setDecisions] = useState<Record<string, Decision>>(loadDecisions);
    const [exportOpen, setExportOpen] = useState(false);

    const saveDecisions = (d: Record<string, Decision>) => {
        setDecisions(d);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
        } catch {
            /* quota exceeded */
        }
    };

    const setDecision = (service: string, decision: Decision) => {
        const next = { ...decisions };
        if (decision === 'no-panel' || decision === '') {
            if (decision === '') delete next[service];
            else next[service] = 'no-panel';
        } else {
            next[service] = decision;
        }
        saveDecisions(next);
    };

    const clearDecisions = () => saveDecisions({});

    const listByName = VALID_ROUTE_IDS.slice().sort();

    const refresh = useCallback(() => {
        setServices(runtime.getServices().sort());
        setDeps(runtime.getDependencies());
        setStatus(runtime.getStatus());
        setLastUpdated(Date.now());
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refresh();
        const unsub = eventBus.on(EVENTS.KERNEL_UPDATED, refresh);
        const interval = setInterval(refresh, 30000);
        const timeTick = setInterval(() => setNow(Date.now()), 10000);
        return () => {
            unsub();
            clearInterval(interval);
            clearInterval(timeTick);
        };
    }, [refresh]);

    const diSet = useMemo(() => new Set(services), [services]);

    const allServiceNames = useMemo(() => {
        const extras = serviceSourceFiles.filter((n) => !diSet.has(n));
        return [...services, ...extras].sort();
    }, [services, diSet]);

    const reverseDeps = useMemo(() => {
        const rev: Record<string, string[]> = {};
        for (const [svc, svcDeps] of Object.entries(deps)) {
            for (const d of svcDeps) {
                if (!rev[d]) rev[d] = [];
                if (!rev[d].includes(svc)) rev[d].push(svc);
            }
        }
        return rev;
    }, [deps]);

    const serviceMap = useMemo(() => {
        const map = new Map<string, ServiceInfo>();
        for (const name of allServiceNames) {
            const registered = diSet.has(name);
            const declaredRoute = SERVICE_ROUTE_MAP[name] ?? null;
            const userRoute =
                typeof decisions[name] === 'string' && decisions[name] !== 'no-panel'
                    ? (decisions[name] as string)
                    : null;
            const effectiveRoute = userRoute || declaredRoute;
            const uiPath = effectiveRoute ? (ROUTE_PATH[effectiveRoute] ?? null) : null;
            const uiValid = effectiveRoute ? VALID_ROUTE_IDS.includes(effectiveRoute) : false;
            map.set(name, {
                name,
                registered,
                phase: registered ? (SERVICE_PHASE[name] ?? '?') : null,
                deps: deps[name] || [],
                dependents: reverseDeps[name] || [],
                uiRouteId: effectiveRoute,
                uiPath,
                uiValid,
                sourcePath: serviceSourcePaths[name] || null,
                userRoute: userRoute || null,
                userNoPanel: decisions[name] === 'no-panel',
            });
        }
        return map;
    }, [allServiceNames, diSet, deps, reverseDeps, decisions]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortAsc(!sortAsc);
        } else {
            setSortKey(key);
            setSortAsc(true);
        }
    };

    const filteredServices = useMemo(() => {
        let list: { name: string; info: ServiceInfo }[];
        const all = allServiceNames.map((n) => ({ name: n, info: serviceMap.get(n)! }));

        switch (activeTab) {
            case 'di':
                list = all.filter((x) => x.info.registered);
                break;
            case 'source':
                list = all.filter((x) => !x.info.registered);
                break;
            case 'ui':
                list = all.filter(
                    (x) => x.info.uiRouteId !== null && x.info.uiValid && !x.info.userNoPanel,
                );
                break;
            case 'unmapped':
                list = all.filter(
                    (x) =>
                        x.info.registered &&
                        !CORE_SERVICES.has(x.name) &&
                        !x.info.userNoPanel &&
                        x.info.uiRouteId === null,
                );
                break;
            default:
                list = all;
        }

        if (search) {
            const q = search.toLowerCase();
            list = list.filter((x) => x.name.toLowerCase().includes(q));
        }

        list.sort((a, b) => {
            let cmp = 0;
            switch (sortKey) {
                case 'name':
                    cmp = a.name.localeCompare(b.name);
                    break;
                case 'phase': {
                    const pa = a.info.phase || 'zzz';
                    const pb = b.info.phase || 'zzz';
                    cmp = pa.localeCompare(pb);
                    break;
                }
                case 'type': {
                    cmp = (a.info.registered ? 0 : 1) - (b.info.registered ? 0 : 1);
                    break;
                }
                case 'route': {
                    const ra = a.info.uiPath || 'zzz';
                    const rb = b.info.uiPath || 'zzz';
                    cmp = ra.localeCompare(rb);
                    break;
                }
                case 'deps':
                    cmp = a.info.deps.length - b.info.deps.length;
                    break;
                case 'used':
                    cmp = a.info.dependents.length - b.info.dependents.length;
                    break;
            }
            return sortAsc ? cmp : -cmp;
        });

        return list;
    }, [activeTab, allServiceNames, serviceMap, search, sortKey, sortAsc]);

    const selectedInfo = selectedService ? serviceMap.get(selectedService) : null;

    const stats = useMemo(() => {
        const di = services.length;
        const source =
            serviceSourceFiles.length -
            services.filter((s) => serviceSourceFiles.includes(s)).length;
        const hasUi = allServiceNames.filter((n) => {
            const info = serviceMap.get(n);
            return info && info.uiRouteId !== null && info.uiValid && !info.userNoPanel;
        }).length;
        const unmapped = allServiceNames.filter((n) => {
            const info = serviceMap.get(n);
            return (
                info &&
                info.registered &&
                !CORE_SERVICES.has(n) &&
                !info.userNoPanel &&
                info.uiRouteId === null
            );
        }).length;
        const dismissed = Object.entries(decisions).filter(([, v]) => v === 'no-panel').length;
        return { di, source, total: allServiceNames.length, hasUi, unmapped, dismissed };
    }, [services, allServiceNames, serviceMap, decisions]);

    const unmappedByPhase = useMemo(() => {
        const groups: Record<string, { name: string; info: ServiceInfo }[]> = {};
        const all = allServiceNames.map((n) => ({ name: n, info: serviceMap.get(n)! }));
        for (const x of all) {
            if (
                !x.info.registered ||
                CORE_SERVICES.has(x.name) ||
                x.info.userNoPanel ||
                x.info.uiRouteId !== null
            )
                continue;
            const phase = x.info.phase || '?';
            if (!groups[phase]) groups[phase] = [];
            groups[phase].push(x);
        }
        const ordered: Array<{ phase: string; items: typeof all }> = [];
        for (const p of PHASE_ORDER) {
            if (groups[p]) ordered.push({ phase: p, items: groups[p] });
        }
        if (groups['?']) ordered.push({ phase: '?', items: groups['?'] });
        return ordered;
    }, [allServiceNames, serviceMap]);

    const exportCode = useMemo(() => {
        const userMapped = Object.entries(decisions).filter(
            ([, v]) => v !== 'no-panel' && v !== '',
        ) as [string, string][];
        const allDecided = [...Object.entries(SERVICE_ROUTE_MAP), ...userMapped];
        const unique = new Map<string, string>();
        for (const [k, v] of allDecided) unique.set(k, v);
        const sorted = [...unique.entries()].sort((a, b) => a[0].localeCompare(b[0]));
        return sorted.map(([svc, route]) => `    ${svc}: '${route}',`).join('\n');
    }, [decisions]);

    const progress =
        stats.unmapped === 0 && stats.dismissed > 0
            ? '100'
            : stats.di <= CORE_SERVICES.size
              ? '0'
              : String(
                    Math.round(
                        ((stats.hasUi + stats.dismissed) / (stats.di - CORE_SERVICES.size)) * 100,
                    ),
                );

    return (
        <div style={styles.root}>
            <ModuleInfo moduleKey="service_registry" />

            {status && (
                <StatusBar
                    status={status}
                    now={now}
                    lastUpdated={lastUpdated}
                    refresh={refresh}
                    stats={stats}
                    progress={progress}
                />
            )}

            <div style={styles.searchRow}>
                <div style={styles.searchInputWrap}>
                    <Search size={16} color="#64748b" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('common.search') || 'Search services...'}
                        style={styles.searchInput}
                    />
                </div>
                <div style={styles.tabs}>
                    {[
                        { id: 'all' as ViewTab, label: `ALL (${stats.total})` },
                        { id: 'di' as ViewTab, label: `DI (${stats.di})` },
                        { id: 'source' as ViewTab, label: `SOURCE (${stats.source})` },
                        { id: 'ui' as ViewTab, label: `UI (${stats.hasUi})` },
                        { id: 'unmapped' as ViewTab, label: `UNMAPPED (${stats.unmapped})` },
                    ].map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => {
                                setActiveTab(id);
                                setSelectedService(null);
                            }}
                            style={{
                                ...styles.tab,
                                background:
                                    activeTab === id ? 'rgba(99,102,241,0.2)' : 'transparent',
                                color: activeTab === id ? '#a5b4fc' : '#64748b',
                                borderColor:
                                    activeTab === id ? 'rgba(99,102,241,0.4)' : 'transparent',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        onClick={() => setExportOpen(!exportOpen)}
                        style={{
                            ...styles.tab,
                            background: exportOpen ? 'rgba(52,211,153,0.2)' : 'transparent',
                            color: exportOpen ? '#34d399' : '#64748b',
                            borderColor: exportOpen ? 'rgba(52,211,153,0.4)' : 'transparent',
                        }}
                    >
                        ⚡ EXPORT
                    </button>
                </div>
            </div>

            {exportOpen && (
                <div style={styles.exportSection}>
                    <div style={styles.exportHeader}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#34d399' }}>
                            Updated SERVICE_ROUTE_MAP — paste into service-phases.ts
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={() => navigator.clipboard.writeText(exportCode)}
                                style={styles.exportBtn}
                            >
                                Copy
                            </button>
                            <button onClick={clearDecisions} style={styles.exportBtn}>
                                Reset
                            </button>
                            <button onClick={() => setExportOpen(false)} style={styles.exportBtn}>
                                Close
                            </button>
                        </div>
                    </div>
                    <pre style={styles.exportPre}>{exportCode}</pre>
                </div>
            )}

            <div style={styles.body}>
                <div style={styles.tableWrap}>
                    {activeTab === 'unmapped' && unmappedByPhase.length > 0 ? (
                        <UnmappedPanel
                            groups={unmappedByPhase as UnmappedGroup[]}
                            listByName={listByName}
                            decisions={decisions}
                            onAssign={setDecision}
                            onDismissAll={(names) => {
                                const next = { ...decisions };
                                for (const n of names) next[n] = 'no-panel';
                                saveDecisions(next);
                            }}
                        />
                    ) : activeTab === 'unmapped' ? (
                        <div style={styles.emptyCell}>
                            All DI services are mapped or dismissed! 🎉
                        </div>
                    ) : (
                        <ServiceTable
                            items={filteredServices}
                            search={search}
                            sortKey={sortKey}
                            sortAsc={sortAsc}
                            onSort={toggleSort}
                            selectedService={selectedService}
                            onToggleSelect={(name) =>
                                setSelectedService(selectedService === name ? null : name)
                            }
                        />
                    )}
                </div>

                {selectedInfo && (
                    <DetailPanel
                        info={selectedInfo}
                        onClose={() => setSelectedService(null)}
                        allRoutes={listByName}
                        onAssign={(routeId: string) => setDecision(selectedInfo.name, routeId)}
                        onDismiss={() => setDecision(selectedInfo.name, 'no-panel')}
                    />
                )}
            </div>
        </div>
    );
};

export default ServiceRegistryPanel;
