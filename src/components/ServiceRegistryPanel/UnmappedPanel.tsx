import React from 'react';
import { Layers } from 'lucide-react';
import { ROUTE_PATH } from './service-phases';
import {
    styles,
    PHASE_COLORS,
    PHASE_LABELS,
    type Decision,
    type ServiceInfo,
} from './service-registry-shared';

export interface UnmappedGroup {
    phase: string;
    items: { name: string; info: ServiceInfo }[];
}

interface UnmappedPanelProps {
    groups: UnmappedGroup[];
    listByName: string[];
    decisions: Record<string, Decision>;
    onAssign: (service: string, decision: Decision) => void;
    onDismissAll: (names: string[]) => void;
}

const UnmappedPanel: React.FC<UnmappedPanelProps> = ({
    groups,
    listByName,
    decisions,
    onAssign,
    onDismissAll,
}) => {
    const dismissedCount = Object.keys(decisions).filter((k) => decisions[k] === 'no-panel').length;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                }}
            >
                <span style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                    Services without a UI panel — assign a route or mark "no panel needed"
                </span>
                <button
                    onClick={() => onDismissAll(groups.flatMap((g) => g.items.map((x) => x.name)))}
                    style={{
                        fontSize: 10,
                        padding: '3px 10px',
                        borderRadius: 4,
                        border: '1px solid rgba(148,163,184,0.2)',
                        background: 'rgba(148,163,184,0.1)',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                    }}
                >
                    Dismiss all {groups.reduce((s, g) => s + g.items.length, 0)}
                </button>
            </div>
            {groups.map(({ phase, items }) => (
                <div key={phase} style={styles.phaseBlock}>
                    <div style={styles.phaseBlockHeader}>
                        <Layers size={12} color={PHASE_COLORS[phase] || '#64748b'} />
                        <span style={styles.phaseBlockLabel}>
                            {PHASE_LABELS[phase] || phase.toUpperCase()}
                        </span>
                        <span style={styles.phaseBlockCount}>{items.length}</span>
                    </div>
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <Th width="28%">Name</Th>
                                <Th width="90px">Phase</Th>
                                <Th width="120px">Deps</Th>
                                <Th width="80px">Used</Th>
                                <Th width="170px">Assign Route</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(({ name, info }) => (
                                <tr key={name} style={styles.tableRow}>
                                    <td style={styles.cellName}>
                                        <span style={styles.nameText}>{name}</span>
                                    </td>
                                    <td>
                                        {info.phase && (
                                            <span
                                                style={{
                                                    ...styles.badgePhase,
                                                    background: `${PHASE_COLORS[info.phase] || '#64748b'}18`,
                                                    color: PHASE_COLORS[info.phase] || '#64748b',
                                                }}
                                            >
                                                {info.phase}
                                            </span>
                                        )}
                                    </td>
                                    <td style={styles.cellNum}>{info.deps.length}</td>
                                    <td style={styles.cellNum}>{info.dependents.length}</td>
                                    <td>
                                        <select
                                            value=""
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '__no-panel__') {
                                                    onAssign(name, 'no-panel');
                                                } else if (val) {
                                                    onAssign(name, val);
                                                }
                                            }}
                                            style={styles.routeSelect}
                                        >
                                            <option value="">— assign —</option>
                                            <option value="__no-panel__">✗ No panel needed</option>
                                            <option disabled>── routes ──</option>
                                            {listByName.map((r) => (
                                                <option key={r} value={r}>
                                                    {r} ({ROUTE_PATH[r]})
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
            {dismissedCount > 0 && (
                <div style={styles.phaseBlock}>
                    <div style={styles.phaseBlockHeader}>
                        <span
                            style={{
                                color: 'var(--slate-500)',
                                fontSize: 11,
                                fontWeight: 600,
                            }}
                        >
                            DISMISSED ({dismissedCount})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

const Th: React.FC<{ children: React.ReactNode; width?: string }> = ({ children, width }) => (
    <th style={{ ...styles.th, width }}>{children}</th>
);

export default UnmappedPanel;
