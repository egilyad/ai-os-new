import type React from 'react';

export type ViewTab = 'all' | 'di' | 'source' | 'ui' | 'unmapped';
export type Decision = 'no-panel' | string;
export type SortKey = 'name' | 'phase' | 'type' | 'route' | 'deps' | 'used';

export interface ServiceInfo {
    name: string;
    registered: boolean;
    phase: string | null;
    deps: string[];
    dependents: string[];
    uiRouteId: string | null;
    uiPath: string | null;
    uiValid: boolean;
    sourcePath: string | null;
    userRoute: string | null;
    userNoPanel: boolean;
}

export interface PanelStats {
    di: number;
    source: number;
    total: number;
    hasUi: number;
    unmapped: number;
    dismissed: number;
}

export const CORE_SERVICES = new Set([
    'eventBus',
    'container',
    'database',
    'storageLayer',
    'runtime',
    'lifecycleManager',
    'securityService',
]);

export const PHASE_COLORS: Record<string, string> = {
    core: '#60a5fa',
    phase0: '#a78bfa',
    phase1: '#34d399',
    phase2: '#fbbf24',
    phase3: '#f472b6',
    phase4: '#fb923c',
    phase5: '#22d3ee',
    phase6: '#a78bfa',
    phase7: '#34d399',
    phase8: '#fbbf24',
    phase9: '#f472b6',
    phase10: '#fb923c',
    phase11: '#22d3ee',
};

export const PHASE_LABELS: Record<string, string> = {
    core: 'CORE',
    phase0: 'EVENT BRIDGE',
    phase1: 'FOUNDATION',
    phase2: 'INFRASTRUCTURE',
    phase3: 'DEBATE',
    phase4: 'AGENTS',
    phase5: 'ROUTING',
    phase6: 'HIGH-LEVEL',
    phase7: 'MEMORY',
    phase8: 'CONSORTIA',
    phase9: 'RESEARCH',
    phase10: 'ECOSYSTEM',
    phase11: 'CAUSAL',
};

export const PHASE_ORDER = [
    'core',
    'phase0',
    'phase1',
    'phase2',
    'phase3',
    'phase4',
    'phase5',
    'phase6',
    'phase7',
    'phase8',
    'phase9',
    'phase10',
    'phase11',
];

export const STORAGE_KEY = 'service_registry_decisions';

export const loadDecisions = (): Record<string, Decision> => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

export const styles: Record<string, React.CSSProperties> = {
    root: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: 16,
        overflow: 'hidden',
    },
    statusBar: { display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
    statBox: {
        background: 'rgba(15,23,42,0.6)',
        borderRadius: 8,
        padding: '4px 12px',
        border: '1px solid transparent',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
    },
    statLabel: { fontSize: 9, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: 1 },
    statValue: { fontSize: 16, fontWeight: 700 },
    statusActions: { display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' },
    refreshBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'var(--slate-500)',
        padding: 4,
        display: 'flex',
    },
    timeAgo: { fontSize: 10 },
    searchRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    searchInputWrap: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(15,23,42,0.6)',
        borderRadius: 8,
        padding: '2px 10px',
        border: '1px solid rgba(148,163,184,0.15)',
        minWidth: 160,
    },
    searchInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        outline: 'none',
        color: 'var(--slate-50)',
        fontSize: 13,
        padding: '6px 0',
    },
    tabs: { display: 'flex', gap: 3, flexWrap: 'wrap' },
    tab: {
        padding: '4px 8px',
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 600,
        border: '1px solid transparent',
        cursor: 'pointer',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap',
    },
    body: { flex: 1, display: 'flex', gap: 12, overflow: 'hidden', minHeight: 0 },
    tableWrap: { flex: 1, overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' },
    th: {
        textAlign: 'left',
        padding: '6px 6px',
        color: 'var(--slate-500)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        borderBottom: '1px solid rgba(148,163,184,0.12)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
    },
    tableRow: {
        cursor: 'pointer',
        borderBottom: '1px solid rgba(148,163,184,0.04)',
        transition: 'background 0.1s',
    },
    cellName: { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 6px' },
    nameText: {
        color: 'var(--slate-200)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    cellNum: { padding: '5px 6px', color: 'var(--slate-500)', textAlign: 'center' },
    badgeDi: {
        fontSize: 9,
        padding: '1px 4px',
        borderRadius: 4,
        background: 'rgba(52,211,153,0.15)',
        color: '#34d399',
        fontWeight: 600,
    },
    badgeSource: {
        fontSize: 9,
        padding: '1px 4px',
        borderRadius: 4,
        background: 'rgba(100,116,139,0.15)',
        color: 'var(--slate-400)',
        fontWeight: 600,
    },
    badgePhase: { fontSize: 9, padding: '1px 4px', borderRadius: 4, fontWeight: 600 },
    badgeDismissed: {
        fontSize: 8,
        padding: '1px 4px',
        borderRadius: 3,
        background: 'rgba(100,116,139,0.15)',
        color: 'var(--slate-500)',
        fontWeight: 600,
        marginLeft: 4,
    },
    badgeUserRoute: {
        fontSize: 8,
        padding: '1px 4px',
        borderRadius: 3,
        background: 'rgba(52,211,153,0.15)',
        color: '#34d399',
        fontWeight: 600,
        marginLeft: 4,
    },
    uiLink: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        color: '#22d3ee',
        textDecoration: 'none',
        padding: '2px 6px',
        borderRadius: 4,
        background: 'rgba(34,211,238,0.1)',
    },
    badRoute: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
        color: 'var(--warning)',
        padding: '2px 6px',
        borderRadius: 4,
        background: 'var(--warning-tint)',
    },
    noRoute: { fontSize: 10, color: 'var(--slate-600)' },
    emptyCell: { padding: 24, textAlign: 'center', color: 'var(--slate-500)', fontSize: 13 },
    phaseBlock: {
        background: 'rgba(15,23,42,0.3)',
        borderRadius: 8,
        border: '1px solid rgba(148,163,184,0.06)',
        overflow: 'hidden',
    },
    phaseBlockHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'rgba(148,163,184,0.04)',
        borderBottom: '1px solid rgba(148,163,184,0.06)',
    },
    phaseBlockLabel: {
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--slate-400)',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    phaseBlockCount: { fontSize: 10, color: 'var(--slate-600)', marginLeft: 'auto' },
    routeSelect: {
        fontSize: 10,
        fontFamily: 'monospace',
        background: 'rgba(15,23,42,0.8)',
        color: 'var(--slate-200)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 4,
        padding: '3px 4px',
        maxWidth: 170,
        cursor: 'pointer',
    },
    exportSection: {
        background: 'rgba(15,23,42,0.5)',
        borderRadius: 8,
        border: '1px solid rgba(52,211,153,0.2)',
        padding: 12,
        maxHeight: 200,
        overflow: 'auto',
    },
    exportHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exportBtn: {
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 4,
        border: '1px solid rgba(148,163,184,0.2)',
        background: 'rgba(15,23,42,0.6)',
        color: 'var(--slate-400)',
        cursor: 'pointer',
    },
    exportPre: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: '#34d399',
        background: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 4,
        overflow: 'auto',
        whiteSpace: 'pre',
    },
    detailPanel: {
        width: 320,
        flexShrink: 0,
        background: 'rgba(15,23,42,0.8)',
        borderRadius: 8,
        border: '1px solid rgba(148,163,184,0.12)',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
    },
    detailHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    detailTitle: { fontSize: 13, fontWeight: 700, color: 'var(--slate-50)', fontFamily: 'monospace' },
    detailClose: {
        background: 'none',
        border: 'none',
        color: 'var(--slate-500)',
        cursor: 'pointer',
        fontSize: 16,
        padding: 4,
    },
    detailBadgeRow: { display: 'flex', gap: 5, flexWrap: 'wrap' },
    detailBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 9,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 6,
    },
    detailSection: { display: 'flex', flexDirection: 'column', gap: 5 },
    detailSectionTitle: {
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--slate-400)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailCode: {
        fontSize: 10,
        fontFamily: 'monospace',
        color: 'var(--slate-500)',
        padding: '5px 6px',
        background: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
    },
    detailChipList: { display: 'flex', gap: 3, flexWrap: 'wrap' },
    detailChip: {
        fontSize: 10,
        fontFamily: 'monospace',
        padding: '2px 6px',
        background: 'rgba(99,102,241,0.1)',
        color: '#a5b4fc',
        borderRadius: 4,
    },
    detailSelect: {
        fontSize: 11,
        fontFamily: 'monospace',
        background: 'rgba(15,23,42,0.8)',
        color: 'var(--slate-200)',
        border: '1px solid rgba(148,163,184,0.2)',
        borderRadius: 4,
        padding: '4px 6px',
        cursor: 'pointer',
        width: '100%',
    },
};
