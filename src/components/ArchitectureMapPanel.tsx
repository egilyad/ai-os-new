import React, { useEffect, useMemo, useState } from 'react';
import { getContainer } from '../kernel/service-helper';
import { architectureGraphService } from '../kernel/instances';
import { useTranslation } from '../i18n/useTranslation';
import { KnowledgeGraphView, type GraphViewData } from './viz/KnowledgeGraphView';
import type { IContainer } from '../kernel/container';

export default function ArchitectureMapPanel() {
    const { t } = useTranslation();
    const [graph, setGraph] = useState<GraphViewData>({ nodes: [], edges: [] });

    useEffect(() => {
        const container = getContainer() as unknown as Pick<IContainer, 'getServices' | 'getDependencies'>;
        const data = architectureGraphService.build(container);
        setGraph({
            nodes: data.nodes.map((n) => ({ id: n.id, label: n.label, type: n.type, degree: n.degree })),
            edges: data.edges.map((e) => ({ source: e.source, target: e.target, kind: 'dependency', weight: 1 })),
        });
    }, []);

    const legend = useMemo(() => {
        const groups = new Set(graph.nodes.map((n) => n.type));
        return [...groups];
    }, [graph]);

    return (
        <div
            style={{
                padding: '1.5rem',
                maxWidth: 1100,
                margin: '0 auto',
                color: 'var(--slate-200)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                height: '100%',
            }}
        >
            <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
                    {t('nav.architecture_map')}
                </h1>
                <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>
                    {graph.nodes.length} services · {graph.edges.length} dependencies — from the live DI container
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {legend.map((group) => (
                    <span
                        key={group}
                        style={{
                            fontSize: 12,
                            padding: '2px 10px',
                            borderRadius: 999,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--slate-300)',
                        }}
                    >
                        {group}
                    </span>
                ))}
            </div>
            <div
                style={{
                    flex: 1,
                    minHeight: 420,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    overflow: 'hidden',
                }}
            >
                <KnowledgeGraphView data={graph} height={420} />
            </div>
        </div>
    );
}
