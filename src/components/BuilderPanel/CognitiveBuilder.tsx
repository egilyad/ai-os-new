import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    type Node,
    type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Save, Link, Activity, AlertTriangle } from 'lucide-react';
import { orchestrator, toolService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('CognitiveBuilder');
import { useKeyStore } from '../../stores/useKeyStore';
import { AuditorTopology } from '../../kernel/state/topology-defaults';
import type { ISTopology, ISNode, ISEdge } from '../../kernel/contracts/topology';
import { eventBus, EVENTS } from '../../kernel/instances';
import { database } from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import { errorBanner, dismissBtn } from '../../styles/common';
import ModuleInfo from '../ModuleInfo';
import {
    AgentNode,
    RouterNode,
    GuardrailNode,
    ToolNode,
    generateId,
    mapDSLToNodes,
    mapDSLToEdges,
} from './builder-nodes';
import ComponentPalette from './ComponentPalette';
import InspectorPanel from './InspectorPanel';

const CognitiveBuilder: React.FC = () => {
    const keys = useKeyStore((s) => s.keys);
    const availableTools = (() => {
        try {
            return toolService.getTools();
        } catch {
            return [];
        }
    })();

    const nodeTypes = useMemo(
        () => ({
            agent: AgentNode,
            router: RouterNode,
            guardrail: GuardrailNode,
            tool: ToolNode,
            aggregator: AgentNode,
            default: AgentNode,
        }),
        [],
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(mapDSLToNodes(AuditorTopology));
    const [edges, setEdges, onEdgesChange] = useEdgesState(mapDSLToEdges(AuditorTopology));
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);

    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const clearError = useAutoClearError(setError);

    useEffect(() => {
        if (selectedNode && !nodes.some((n) => n.id === selectedNode.id)) {
            setSelectedNode(null);
        }
    }, [nodes, selectedNode]);

    const activeNode = nodes.find((n) => n.id === selectedNode?.id) || null;

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge(
                    {
                        ...params,
                        animated: true,
                        style: { stroke: 'var(--accent)', strokeWidth: 2 },
                        type: 'smoothstep',
                    },
                    eds,
                ),
            ),
        [setEdges],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const updateNodeConfig = useCallback(
        (nodeId: string, updates: Record<string, unknown>) => {
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === nodeId) {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                config: { ...(n.data.config as ISNode['config']), ...updates },
                            },
                        };
                    }
                    return n;
                }),
            );
        },
        [setNodes],
    );

    const updateNodeLabel = useCallback(
        (nodeId: string, label: string) => {
            setNodes((nds) =>
                nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, label } } : n)),
            );
        },
        [setNodes],
    );

    const handleSaveWorkflow = useCallback(() => {
        const topology: ISTopology = {
            ...AuditorTopology,
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.data.type as ISNode['type'],
                label: n.data.label as string,
                config: n.data.config as ISNode['config'],
                position: n.position,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                from: e.source,
                to: e.target,
                trigger: (e.data?.trigger as ISEdge['trigger']) || 'on_success',
                label: e.data?.label as string | undefined,
            })),
        };
        database
            .saveWorkflow(topology)
            .then(() => {
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Workflow saved locally',
                    type: 'success',
                });
            })
            .catch((e) => {
                LOGGER.warn('Failed to save workflow', e);
                eventBus.emit(EVENTS.NOTIFICATION, {
                    message: 'Failed to save workflow',
                    type: 'error',
                });
            });
    }, [nodes, edges]);

    const handleDeploy = useCallback(() => {
        try {
            const newTopology: ISTopology = {
                ...AuditorTopology,
                nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.data.type as ISNode['type'],
                    label: n.data.label as string,
                    config: n.data.config as ISNode['config'],
                    position: n.position,
                })),
                edges: edges.map((e) => ({
                    id: e.id,
                    from: e.source,
                    to: e.target,
                    trigger: (e.label as ISEdge['trigger']) || 'data_flow',
                })),
            };
            orchestrator.mount(newTopology);
            eventBus.emit(EVENTS.NOTIFICATION, {
                message: 'Successfully deployed topology to Super-Agents Runtime!',
                type: 'success',
            });
            setError(null);
        } catch (err) {
            LOGGER.error('Deploy failed', String(err));
            if (isMountedRef.current) {
                setError(t('builder.error_deploy'));
                clearError();
            }
        }
    }, [nodes, edges, clearError, t]);

    const addNode = useCallback(
        (type: string, label: string) => {
            const newNode: Node = {
                id: generateId(),
                type: type,
                position: { x: 200 + Math.random() * 200, y: 200 + Math.random() * 200 },
                data: { label, type, config: { model: 'auto', tools: [] } },
            };
            setNodes((nds) => nds.concat(newNode));
            setSelectedNode(newNode);
        },
        [setNodes],
    );

    const removeNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
            setSelectedNode(null);
        },
        [setNodes, setEdges],
    );

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}
        >
            <div
                style={{
                    padding: '0 0 1rem 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <Link size={20} color="#3b82f6" aria-hidden="true" /> {t('builder.title')}
                    </h2>
                    <p
                        style={{
                            margin: '0.2rem 0 0 0',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)',
                        }}
                    >
                        {t('builder.subtitle')}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn-secondary"
                        onClick={handleSaveWorkflow}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.5rem 1rem',
                            borderRadius: 10,
                        }}
                        aria-label={t('builder.save')}
                    >
                        <Save size={16} aria-hidden="true" /> {t('builder.save')}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleDeploy}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0.5rem 1.25rem',
                            borderRadius: 10,
                            boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
                        }}
                        aria-label={t('builder.deploy')}
                    >
                        <Play size={16} aria-hidden="true" /> {t('builder.deploy')}
                    </button>
                </div>
            </div>

            {error && (
                <div role="alert" aria-live="polite" style={errorBanner}>
                    <AlertTriangle size={14} aria-hidden="true" /> {error}
                    <button
                        onClick={() => setError(null)}
                        style={dismissBtn}
                        aria-label={t('common.dismiss_error')}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr 340px',
                    gap: '1rem',
                    minHeight: 0,
                }}
            >
                <ComponentPalette onAddNode={addNode} t={t} />

                <div
                    style={{
                        position: 'relative',
                        height: '100%',
                        minHeight: 500,
                        borderRadius: 16,
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)',
                        background: 'var(--slate-950)',
                        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)',
                    }}
                    role="region"
                    aria-label="Cognitive topology canvas"
                >
                    <div style={{ position: 'absolute', inset: 0 }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onPaneClick={onPaneClick}
                            fitView
                            defaultEdgeOptions={{ type: 'smoothstep' }}
                        >
                            <Background color="rgba(255,255,255,0.05)" gap={24} size={2} />
                            <Controls
                                style={{
                                    background: 'rgba(15,23,42,0.8)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    padding: 4,
                                }}
                            />
                            <Panel
                                position="top-left"
                                style={{
                                    background: 'rgba(15,23,42,0.8)',
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        fontSize: '0.8rem',
                                        color: 'var(--slate-400)',
                                        fontWeight: 600,
                                    }}
                                >
                                    <Activity size={14} color="#10b981" aria-hidden="true" />{' '}
                                    {t('builder.runtime_idle')}
                                </div>
                            </Panel>
                        </ReactFlow>
                    </div>
                </div>

                <InspectorPanel
                    activeNode={activeNode}
                    onUpdateLabel={updateNodeLabel}
                    onUpdateConfig={updateNodeConfig}
                    onRemoveNode={removeNode}
                    keys={keys}
                    availableTools={availableTools}
                    t={t}
                />
            </div>
            <ModuleInfo moduleKey="builder" />
        </div>
    );
};

export default CognitiveBuilder;
