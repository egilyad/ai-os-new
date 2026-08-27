import React from 'react';
import { Circle, ExternalLink, CircleAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { styles, PHASE_COLORS, type ServiceInfo, type SortKey } from './service-registry-shared';

const Th: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    width?: string;
}> = ({ children, onClick, width }) => (
    <th
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
            onClick
                ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onClick();
                      }
                  }
                : undefined
        }
        style={{ ...styles.th, width, cursor: onClick ? 'pointer' : 'default' }}
    >
        {children}
    </th>
);

const SortIcon: React.FC<{ col: SortKey; sortKey: SortKey; sortAsc: boolean }> = ({
    col,
    sortKey,
    sortAsc,
}) => {
    if (sortKey !== col) return null;
    return sortAsc ? (
        <ChevronUp size={12} style={{ marginLeft: 2 }} />
    ) : (
        <ChevronDown size={12} style={{ marginLeft: 2 }} />
    );
};

interface ServiceTableProps {
    items: { name: string; info: ServiceInfo }[];
    search: string;
    sortKey: SortKey;
    sortAsc: boolean;
    onSort: (key: SortKey) => void;
    selectedService: string | null;
    onToggleSelect: (name: string) => void;
}

const ServiceTable: React.FC<ServiceTableProps> = ({
    items,
    search,
    sortKey,
    sortAsc,
    onSort,
    selectedService,
    onToggleSelect,
}) => (
    <table style={styles.table}>
        <thead>
            <tr>
                <Th onClick={() => onSort('name')} width="28%">
                    Name <SortIcon col="name" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
                <Th onClick={() => onSort('type')} width="60px">
                    Type <SortIcon col="type" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
                <Th onClick={() => onSort('phase')} width="80px">
                    Phase <SortIcon col="phase" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
                <Th onClick={() => onSort('route')} width="120px">
                    Route <SortIcon col="route" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
                <Th onClick={() => onSort('deps')} width="55px">
                    Deps <SortIcon col="deps" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
                <Th onClick={() => onSort('used')} width="50px">
                    Used <SortIcon col="used" sortKey={sortKey} sortAsc={sortAsc} />
                </Th>
            </tr>
        </thead>
        <tbody>
            {items.length === 0 && (
                <tr>
                    <td colSpan={6} style={styles.emptyCell}>
                        No services match "{search}"
                    </td>
                </tr>
            )}
            {items.map(({ name, info }) => (
                <tr
                    key={name}
                    onClick={() => onToggleSelect(name)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onToggleSelect(name);
                        }
                    }}
                    style={{
                        ...styles.tableRow,
                        background:
                            selectedService === name
                                ? 'rgba(99,102,241,0.08)'
                                : info.userNoPanel
                                  ? 'rgba(100,116,139,0.05)'
                                  : info.userRoute
                                    ? 'rgba(52,211,153,0.05)'
                                    : 'transparent',
                    }}
                >
                    <td style={styles.cellName}>
                        <Circle
                            size={7}
                            color={
                                !info.registered
                                    ? '#64748b'
                                    : info.userNoPanel
                                      ? '#64748b'
                                      : info.uiValid
                                        ? '#22c55e'
                                        : info.uiRouteId
                                          ? '#f59e0b'
                                          : '#f59e0b'
                            }
                            fill={
                                !info.registered
                                    ? '#64748b'
                                    : info.userNoPanel
                                      ? '#64748b'
                                      : info.uiValid
                                        ? '#22c55e'
                                        : info.uiRouteId
                                          ? '#f59e0b'
                                          : '#f59e0b'
                            }
                            style={{ flexShrink: 0 }}
                        />
                        <span
                            style={{
                                ...styles.nameText,
                                opacity: info.userNoPanel ? 0.5 : 1,
                            }}
                        >
                            {name}
                        </span>
                        {info.userNoPanel && <span style={styles.badgeDismissed}>dismissed</span>}
                        {info.userRoute && <span style={styles.badgeUserRoute}>user</span>}
                    </td>
                    <td>
                        {info.registered ? (
                            <span style={styles.badgeDi}>DI</span>
                        ) : (
                            <span style={styles.badgeSource}>source</span>
                        )}
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
                    <td>
                        {info.uiPath ? (
                            <a
                                href={`#${info.uiPath}`}
                                style={styles.uiLink}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink size={10} />
                                <span>{info.uiPath}</span>
                            </a>
                        ) : info.uiRouteId ? (
                            <span style={styles.badRoute}>
                                <CircleAlert size={10} />
                                <span>{info.uiRouteId} ?</span>
                            </span>
                        ) : (
                            <span style={styles.noRoute}>—</span>
                        )}
                    </td>
                    <td style={styles.cellNum}>{info.deps.length}</td>
                    <td style={styles.cellNum}>{info.dependents.length}</td>
                </tr>
            ))}
        </tbody>
    </table>
);

export default ServiceTable;
