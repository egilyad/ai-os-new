import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Network } from 'vis-network/standalone';
import { crystalVault } from '../../kernel/instances';
import { getArticle } from '../WikiPanel/wiki-articles';
import { PANEL_ARTICLES } from '../WikiPanel/wiki-panels';
import type { MemorySourceDescriptor, MemoryCategory } from '../../kernel/types/memory-center-types';
import type { Crystal } from '../../kernel/types/crystal-types';

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
    const [crystals, setCrystals] = useState<Crystal[]>([]);
    const onOpenRef = useRef(onOpen);
    onOpenRef.current = onOpen;

    useEffect(() => {
        let alive = true;
        crystalVault
            .list()
            .then((list) => {
                if (alive) setCrystals(Array.isArray(list) ? list.slice(0, 60) : []);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    // Глубокий переход: для кристалла ищем подходящую статью вики по его
    // домену/происхождению, иначе открываем панель кристаллов.
    const resolveDeepTarget = (c: Crystal): string => {
        const domainToSlug: Record<string, string> = {
            arch: 'architecture',
            prompt: 'panel-prompt-library',
            routing: 'panel-routing',
            gov: 'panel-governance',
            llm: 'providers',
            security: 'panel-governance',
            economics: 'panel-budget',
            general: 'idea-path',
        };
        const slug = domainToSlug[c.applicableDomain];
        if (slug && getArticle(slug)) return `/wiki?wiki=${slug}`;
        return '/crystals';
    };

    const { nodes, edges } = useMemo(() => {
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
                deepTarget: undefined,
            });
        }

        for (const s of sources) {
            const color = CATEGORY_COLOR[s.category];
            nodes.push({
                id: s.id,
                label: s.name,
                color: { background: color, border: '#0f172a', highlight: { background: color, border: '#fff' } },
                font: { color: '#cbd5e1', size: 13 },
                shape: 'dot',
                size: s.status === 'verified' ? 14 : 10,
                title: `${s.name}\nвладелец: ${s.owner}\nтаблица: ${s.table ?? '—'}\nстатус: ${s.status}\nжми, чтобы открыть`,
                deepTarget: s.openRoute ? `/${s.openRoute}` : undefined,
            });
            const catIdx = catIndex.get(s.category);
            if (catIdx !== undefined) edges.push({ from: s.id, to: `cat:${s.category}`, color: { color, opacity: 0.5 } });
        }

        for (const c of crystals) {
            const stmt = c.content?.statement ?? '';
            const id = `crystal:${c.crystalId}`;
            nodes.push({
                id,
                label: stmt.slice(0, 28) + (stmt.length > 28 ? '…' : ''),
                color: { background: CATEGORY_COLOR.research, border: '#0f172a', highlight: { background: CATEGORY_COLOR.research, border: '#fff' } },
                font: { color: '#e2e8f0', size: 11 },
                shape: 'dot',
                size: 9,
                title: `Кристалл: ${stmt.slice(0, 120)}\nстатус: ${c.status || '—'}\nдомен: ${c.applicableDomain || '—'}`,
                deepTarget: resolveDeepTarget(c),
            });
            const catIdx = catIndex.get('research');
            if (catIdx !== undefined) edges.push({ from: id, to: 'cat:research', color: { color: CATEGORY_COLOR.research, opacity: 0.4 } });
            // Связи между кристаллами (поддержка / противоречие)
            for (const sup of c.supportingCrystalIds ?? []) {
                edges.push({ from: id, to: `crystal:${sup}`, color: { color: '#34d399', opacity: 0.5 }, width: 1.5 });
            }
            for (const con of c.contradictingCrystalIds ?? []) {
                edges.push({ from: id, to: `crystal:${con}`, color: { color: '#ef4444', opacity: 0.5 }, width: 1.5 });
            }
        }

        return { nodes, edges };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sources, crystals]);

    useEffect(() => {
        if (!containerRef.current) return;
        const net = new Network(
            containerRef.current,
            { nodes, edges },
            {
                nodes: { borderWidth: 2, shadow: { enabled: true, size: 10 }, chosen: true },
                edges: { smooth: { enabled: true, type: 'continuous', roundness: 0.4 }, width: 1.2 },
                layout: { hierarchical: { enabled: false } },
                physics: {
                    stabilization: { iterations: 180 },
                    barnesHut: { gravitationalConstant: -4000, centralGravity: 0.3, springLength: 140, springConstant: 0.04, damping: 0.09 },
                },
                interaction: { hover: true, tooltipDelay: 150, dragView: true, zoomView: true },
            },
        );
        networkRef.current = net;
        net.on('click', (params: any) => {
            if (params.nodes && params.nodes.length > 0) {
                const node = nodes.find((n) => n.id === params.nodes[0]);
                if (node?.deepTarget) onOpenRef.current(node.deepTarget);
            }
        });
        return () => {
            net.destroy();
            networkRef.current = null;
        };
    }, [nodes, edges]);

    return <div ref={containerRef} style={{ width: '100%', height, border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, background: 'rgba(0,0,0,0.2)' }} />;
};

export default MemoryGraph;
