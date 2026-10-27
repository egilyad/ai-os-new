import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Network, RefreshCw } from 'lucide-react';
import { runtime } from '../kernel/runtime';
import ModuleInfo from './ModuleInfo';
import { useTranslation } from '../i18n/useTranslation';
import VisGraph, { type VisGraphNode, type VisGraphEdge } from './Common/VisGraph';

const DependencyMapPanel: React.FC = () => {
    const { t } = useTranslation();
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [impactedNodes, setImpactedNodes] = useState<Set<string>>(new Set());
    const [version, setVersion] = useState(0);

    const calculateImpact = useCallback(
        (startNode: string, deps: Record<string, string[]>): Set<string> => {
            const impacted = new Set<string>();
            const stack = [startNode];
            while (stack.length > 0) {
                const current = stack.pop()!;
                for (const [service, dependencies] of Object.entries(deps)) {
                    if (dependencies.includes(current) && !impacted.has(service)) {
                        impacted.add(service);
                        stack.push(service);
                    }
                }
            }
            return impacted;
        },
        [],
    );

    const { nodes, edges } = useMemo(() => {
        const deps = runtime.getDependencies();
        const services = runtime.getServices();
        const allServices = new Set<string>([...services, ...Object.keys(deps)]);
        Object.values(deps).forEach((list) => list.forEach((d) => allServices.add(d)));
        const serviceArray = Array.from(allServices);

        const visNodes: VisGraphNode[] = serviceArray.map((service) => {
            const isSelected = service === selectedNode;
            const isImpacted = impactedNodes.has(service);
            const color = isSelected ? '#ef4444' : isImpacted ? '#f59e0b' : '#3b82f6';
            return {
                id: service,
                label: service,
                color,
                borderColor: isSelected || isImpacted ? '#fff' : '#0f172a',
                size: isSelected || isImpacted ? 22 : 14,
                title: `${service}${isSelected ? '\n(выбран)' : ''}${isImpacted ? '\n(зависим от выбранного)' : ''}`,
            };
        });

        const visEdges: VisGraphEdge[] = [];
        for (const service of serviceArray) {
            for (const dep of deps[service] ?? []) {
                if (!allServices.has(dep)) continue;
                const isImpactedEdge =
                    selectedNode &&
                    (selectedNode === dep || impactedNodes.has(dep)) &&
                    (impactedNodes.has(service) || service === selectedNode);
                visEdges.push({
                    id: `e-${service}-${dep}`,
                    from: service,
                    to: dep,
                    color: isImpactedEdge ? '#ef4444' : 'rgba(59,130,246,0.5)',
                    width: isImpactedEdge ? 3 : 1,
                });
            }
        }

        return { nodes: visNodes, edges: visEdges };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode, impactedNodes, version]);

    const handleNodeClick = useCallback(
        (node: VisGraphNode) => {
            if (selectedNode === node.id) {
                setSelectedNode(null);
                setImpactedNodes(new Set());
            } else {
                setSelectedNode(node.id);
                const deps = runtime.getDependencies();
                setImpactedNodes(calculateImpact(node.id, deps));
            }
        },
        [selectedNode, calculateImpact],
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--slate-50)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Network size={28} color="#3b82f6" /> {t('nav.dependency_graph') || 'Dependency Graph'}
                </h2>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {selectedNode && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--slate-400)', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: 8 }}>
                            <span style={{ color: 'var(--error)', fontWeight: 700 }}>Impact Analysis:</span> {impactedNodes.size} downstream services affected by <strong style={{ color: 'var(--slate-50)' }}>{selectedNode}</strong>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            setSelectedNode(null);
                            setImpactedNodes(new Set());
                            setVersion((v) => v + 1);
                        }}
                        style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--accent-tint)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
                    >
                        <RefreshCw size={16} /> Refresh
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
                <VisGraph nodes={nodes} edges={edges} onClickNode={handleNodeClick} height={640} />
            </div>
            <ModuleInfo moduleKey="dependency_graph" />
        </div>
    );
};

export default DependencyMapPanel;
