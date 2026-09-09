import React, { useState, useEffect, useCallback } from 'react'
import { ReactFlow, Background, Controls, Position, MarkerType } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, RefreshCw } from 'lucide-react';
import { runtime } from '../kernel/runtime';
import ModuleInfo from './ModuleInfo';
import { useTranslation } from '../i18n/useTranslation';

const nodeStyle = {
  background: 'rgba(15, 23, 42, 0.9)',
  color: 'var(--slate-50)',
  border: '1px solid rgba(59, 130, 246, 0.5)',
  borderRadius: '8px',
  padding: '10px 15px',
  fontSize: '12px',
  fontFamily: 'monospace',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
};

const DependencyMapPanel: React.FC = () => {
  const { t } = useTranslation();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [impactedNodes, setImpactedNodes] = useState<Set<string>>(new Set());

  // Calculate downstream dependencies recursively
  const calculateImpact = useCallback((startNode: string, deps: Record<string, string[]>): Set<string> => {
    const impacted = new Set<string>();
    const stack = [startNode];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      // Find who depends on 'current' (reverse lookup)
      for (const [service, dependencies] of Object.entries(deps)) {
        if (dependencies.includes(current) && !impacted.has(service)) {
          impacted.add(service);
          stack.push(service);
        }
      }
    }
    return impacted;
  }, []);

  const generateGraph = useCallback(() => {
    const deps = runtime.getDependencies();
    const services = runtime.getServices();
    
    // Fallback if no deps collected
    const allServices = new Set([...services, ...Object.keys(deps)]);
    Object.values(deps).forEach(list => list.forEach(d => allServices.add(d)));

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Simple layout algorithm (circular or layered)
    const serviceArray = Array.from(allServices);
    const radius = Math.max(300, serviceArray.length * 20);
    const center = { x: 400, y: 300 };

    serviceArray.forEach((service, index) => {
      const angle = (index / serviceArray.length) * 2 * Math.PI;
      newNodes.push({
        id: service,
        data: { label: service },
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        },
        style: nodeStyle,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      });

      if (deps[service]) {
        deps[service].forEach((dep) => {
          const isImpactedEdge = selectedNode && (selectedNode === dep || impactedNodes.has(dep)) && (impactedNodes.has(service) || service === selectedNode);
          
          newEdges.push({
            id: `e-${service}-${dep}`,
            source: service,
            target: dep,
            animated: isImpactedEdge ? true : false,
            style: { 
              stroke: isImpactedEdge ? '#ef4444' : 'rgba(59, 130, 246, 0.5)', 
              strokeWidth: isImpactedEdge ? 3 : 1 
            },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: isImpactedEdge ? '#ef4444' : 'rgba(59, 130, 246, 0.8)' 
            },
          });
        });
      }
    });

    setNodes(newNodes.map(n => {
      const isSelected = n.id === selectedNode;
      const isImpacted = impactedNodes.has(n.id);
      
      return {
        ...n,
        style: {
          ...nodeStyle,
          background: isSelected ? 'rgba(239, 68, 68, 0.2)' : isImpacted ? 'rgba(245, 158, 11, 0.2)' : nodeStyle.background,
          borderColor: isSelected ? '#ef4444' : isImpacted ? '#f59e0b' : 'rgba(59, 130, 246, 0.5)',
          boxShadow: isSelected || isImpacted ? '0 0 15px rgba(239, 68, 68, 0.3)' : nodeStyle.boxShadow,
        }
      };
    }));
    setEdges(newEdges);
  }, [selectedNode, impactedNodes]);

  useEffect(() => {
    generateGraph();
  }, [generateGraph]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (selectedNode === node.id) {
      setSelectedNode(null);
      setImpactedNodes(new Set());
    } else {
      setSelectedNode(node.id);
      const deps = runtime.getDependencies();
      setImpactedNodes(calculateImpact(node.id, deps));
    }
  }, [selectedNode, calculateImpact]);

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
            onClick={generateGraph}
            style={{ padding: '0.5rem 1rem', borderRadius: 8, background: 'var(--accent-tint)', border: '1px solid rgba(59,130,246,0.3)', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden', background: 'rgba(0,0,0,0.2)' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
          attributionPosition="bottom-right"
        >
          <Background color="rgba(255,255,255,0.05)" gap={16} />
          <Controls style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', fill: '#fff' }} />
        </ReactFlow>
      </div>
      <ModuleInfo moduleKey="dependency_graph" />
    </div>
  );
};

export default DependencyMapPanel;
