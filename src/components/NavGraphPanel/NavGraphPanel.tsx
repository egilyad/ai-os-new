import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NAV_SECTIONS } from '../../route-registry';
import { useTranslation } from '../../i18n/useTranslation';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from '../Common/VisGraph';

const SECTION_COLORS: string[] = [
    '#8b5cf6',
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#84cc16',
    '#f97316',
    '#14b8a6',
    '#6366f1',
    '#a855f7',
    '#f87171',
    '#38bdf8',
];

const NavGraphPanel: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const { nodes, edges } = useMemo(() => {
        const nodes: VisGraphNode[] = [];
        const edges: VisGraphEdge[] = [];

        NAV_SECTIONS.forEach((section, si) => {
            const color = SECTION_COLORS[si % SECTION_COLORS.length]!;
            const sectionNodeId = `section:${section.id}`;
            nodes.push({
                id: sectionNodeId,
                label: t(section.labelKey),
                color,
                size: 34,
                title: `${t(section.labelKey)} · ${section.items.length} панелей`,
            });

            for (const item of section.items) {
                const nodeId = `nav:${item.id}`;
                nodes.push({
                    id: nodeId,
                    label: t(item.labelKey),
                    color,
                    size: 12,
                    title: `${t(item.labelKey)}\nраздел: ${t(section.labelKey)}`,
                    openTarget: item.id,
                });
                edges.push({ id: `e:${section.id}:${item.id}`, from: nodeId, to: sectionNodeId, color, width: 1 });
            }
        });

        return { nodes, edges };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [t]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0.75rem 1rem', gap: '0.5rem' }}>
            <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Граф навигации</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: 13, color: 'var(--slate-400)' }}>
                    Разделы (крупные узлы) → панели. Клик по панели открывает её. Зум, панорамирование, перетаскивание.
                </p>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
                <VisGraph
                    nodes={nodes}
                    edges={edges}
                    onClickNode={(n) => {
                        const target = n.openTarget as string | undefined;
                        if (target) navigate(`/${target}`);
                    }}
                    height={640}
                />
            </div>
        </div>
    );
};

export default NavGraphPanel;
