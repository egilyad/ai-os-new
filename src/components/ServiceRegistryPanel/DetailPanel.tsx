import React from 'react';
import {
    FolderOpen,
    Database,
    FileCode,
    Layers,
    ExternalLink,
    Hash,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';
import { ROUTE_PATH } from './service-phases';
import { styles, PHASE_COLORS, PHASE_LABELS, type ServiceInfo } from './service-registry-shared';

interface DetailPanelProps {
    info: ServiceInfo;
    onClose: () => void;
    allRoutes: string[];
    onAssign: (routeId: string) => void;
    onDismiss: () => void;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
    info,
    onClose,
    allRoutes,
    onAssign,
    onDismiss,
}) => (
    <div style={styles.detailPanel}>
        <div style={styles.detailHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FolderOpen size={16} color="#94a3b8" />
                <span style={styles.detailTitle}>{info.name}</span>
            </div>
            <button onClick={onClose} style={styles.detailClose}>
                ✕
            </button>
        </div>

        <div style={styles.detailBadgeRow}>
            {info.registered ? (
                <span
                    style={{
                        ...styles.detailBadge,
                        background: 'rgba(52,211,153,0.15)',
                        color: '#34d399',
                    }}
                >
                    <Database size={12} /> DI REGISTERED
                </span>
            ) : (
                <span
                    style={{
                        ...styles.detailBadge,
                        background: 'rgba(100,116,139,0.15)',
                        color: 'var(--slate-400)',
                    }}
                >
                    <FileCode size={12} /> SOURCE ONLY
                </span>
            )}
            {info.phase && (
                <span
                    style={{
                        ...styles.detailBadge,
                        background: `${PHASE_COLORS[info.phase] || '#64748b'}20`,
                        color: PHASE_COLORS[info.phase] || '#64748b',
                    }}
                >
                    <Layers size={12} /> {PHASE_LABELS[info.phase] || info.phase}
                </span>
            )}
            {info.uiPath ? (
                <a
                    href={`#${info.uiPath}`}
                    style={{
                        ...styles.detailBadge,
                        background: 'rgba(34,211,238,0.15)',
                        color: '#22d3ee',
                        textDecoration: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <ExternalLink size={12} /> {info.uiPath}
                </a>
            ) : info.uiRouteId ? (
                <span
                    style={{
                        ...styles.detailBadge,
                        background: 'rgba(251,191,36,0.15)',
                        color: 'var(--warning)',
                    }}
                >
                    <Hash size={12} /> user: {info.uiRouteId}
                </span>
            ) : null}
            {info.userNoPanel && (
                <span
                    style={{
                        ...styles.detailBadge,
                        background: 'rgba(100,116,139,0.15)',
                        color: 'var(--slate-400)',
                    }}
                >
                    ✗ No panel needed
                </span>
            )}
        </div>

        {info.sourcePath && (
            <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>File Source</div>
                <div style={styles.detailCode}>{info.sourcePath}</div>
            </div>
        )}

        {info.deps.length > 0 && (
            <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>
                    <ArrowRight size={12} /> Deps ({info.deps.length})
                </div>
                <div style={styles.detailChipList}>
                    {info.deps.map((d) => (
                        <span key={d} style={styles.detailChip}>
                            {d}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {info.dependents.length > 0 && (
            <div style={styles.detailSection}>
                <div style={styles.detailSectionTitle}>
                    <ArrowLeft size={12} /> Used by ({info.dependents.length})
                </div>
                <div style={styles.detailChipList}>
                    {info.dependents.map((d) => (
                        <span key={d} style={styles.detailChip}>
                            {d}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {info.uiRouteId === null && info.registered && !info.userNoPanel && (
            <div style={styles.detailSection}>
                <div style={{ ...styles.detailSectionTitle, color: 'var(--warning)' }}>
                    <Hash size={12} /> Assign a route
                </div>
                <select
                    value=""
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === '__no-panel__') onDismiss();
                        else if (v) onAssign(v);
                    }}
                    style={styles.detailSelect}
                >
                    <option value="">— choose route —</option>
                    <option value="__no-panel__">✗ No panel needed</option>
                    <option disabled>── routes ──</option>
                    {allRoutes.map((r) => (
                        <option key={r} value={r}>
                            {r} ({ROUTE_PATH[r]})
                        </option>
                    ))}
                </select>
            </div>
        )}
    </div>
);

export default DetailPanel;
