import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network/standalone/esm/vis-network';
import type { MemorySourceDescriptor, MemoryCategory } from '../../kernel/types/memory-center-types';

const CATEGORY_COLOR: Record<MemoryCategory, string> = {
    chat: '#38bdf8',
    debate: '#f472b6',
    agent: '#a78bfa',
    knowledge: '#34d399',
    research: '#fbbf24',
    config: '#fb7185',
    execution: '#60a5fa',
    fleet: '#2dd4bf',
    user: '#facc15',
};

const CATEGORY_LABEL: Record<MemoryCategory, string> = {
    chat: 'Чаты',
    debate: 'Дебаты',
    agent: 'Агенты',
    knowledge: 'Знания',
    research: 'Исследования',
    config: 'Конфигурация',
    execution: 'Выполнение',
    fleet: 'Флот',
    user: 'Пользователь',
};

interface Props {
    sources: MemorySourceDescriptor[];
    onOpen: (route: string) => void;
    height?: number;
}

const MemoryGraph: React.FC<Props> = ({ sources, onOpen, height = 520 }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const networkRef = useRef<Network | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        // Узлы: категории (крупные центры) + источники (по категории).
        const nodes: any[] = [];
        const edges: any[] = [];

        const catIndex = new Map<MemoryCategory, number>();
        for (const cat of Object.keys(CATEGORY_COLOR) as MemoryCategory[]) {
            catIndex.set(cat, nodes.length);
            nodes.push({
                id: `cat:${cat}`,
                label: CATEGORY_LABEL[cat],
                color: { background: CATEGORY_COLOR[cat], border: '#fff', highlight: { background: '#fff', border: CATEGORY_COLOR[cat] } },
                font: { color: '#e2e8f0', size: 15, face: 'Arial', bold: true },
                shape: 'dot',
                size: 30,
                level: 0,
            });
        }

        for (const s of sources) {
            const color = CATEGORY_COLOR[s.category];
            const id = s.id;
            nodes.push({
                id,
                label: s.name,
                color: { background: color, border: '#0f172a', highlight: { background: color, border: '#fff' } },
                font: { color: '#cbd5e1', size: 13 },
                shape: 'dot',
                size: s.status === 'verified' ? 14 : 10,
                title: `${s.name}\nвладелец: ${s.owner}\nтаблица: ${s.table ?? '—'}\nстатус: ${s.status}\nжми, чтобы открыть`,
                openRoute: s.openRoute,
            });
            const catIdx = catIndex.get(s.category);
            if (catIdx !== undefined) {
                edges.push({ from: id, to: `cat:${s.category}`, color: { color: color, opacity: 0.5 } });
            }
        }

        const network = new Network(
            container,
            { nodes, edges },
            {
                nodes: { borderWidth: 2, shadow: { enabled: true, size: 10 }, chosen: true },
                edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.4 }, width: 1.2 },
                layout: { hierarchical: { enabled: false } },
                physics: {
                    stabilization: { iterations: 160 },
                    barnesHut: {
                        gravitationalConstant: -4000,
                        centralGravity: 0.3,
                        springLength: 150,
                        springConstant: 0.04,
                        damping: 0.09,
                    },
                },
                interaction: { hover: true, tooltipDelay: 150, dragView: true, zoomView: true },
                groups: {},
            },
        );

        networkRef.current = network;

        network.on('click', (params: any) => {
            if (params.nodes && params.nodes.length > 0) {
                const nodeId = params.nodes[0] as string;
                const node = nodes.find((n) => n.id === nodeId);
                if (node && node.openRoute) onOpen(node.openRoute);
            }
        });

        return () => {
            network.destroy();
            networkRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources]);

    return <div ref={containerRef} style={{ width: '100%', height, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,0,0,0.2)' }} />;
};

export default MemoryGraph;
