import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useConfirm } from '../../hooks/useConfirm';
import { memoryService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('KnowledgePanel');
import { eventBus, EVENTS } from '../../kernel/instances';
import ModuleInfo from '../ModuleInfo';
import GraphHeader from './GraphHeader';
import ErrorBanner from './ErrorBanner';
import SearchAndFilter from './SearchAndFilter';
import KnowledgeGraph from './KnowledgeGraph';
import NodeDetailSidebar from './NodeDetailSidebar';
import {
    buildNodes,
    buildEdges,
    computeDensity,
    computeTypeCounts,
    getUniqueTypes,
} from './graph-utils';
import type { GraphNodeData } from './graph-utils';

const KnowledgePanel: React.FC = () => {
    const { t } = useTranslation();
    const { confirm, ConfirmDialog } = useConfirm();
    const [memories, setMemories] = useState(() => {
        try {
            return memoryService.getMemories();
        } catch {
            return [];
        }
    });
    const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(memories.length === 0);
    const [editContent, setEditContent] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isMountedRef = useRef(true);
    const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearErrorAfterDelay = useCallback(() => {
        if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) setError(null);
        }, 5000);
    }, []);

    useEffect(() => {
        isMountedRef.current = true;
        const unsub = eventBus.on(EVENTS.MEMORY_UPDATED, () => {
            if (!isMountedRef.current) return;
            setMemories([...memoryService.getMemories()]);
            setIsLoading(false);
            setError(null);
        });

        loadingTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) setIsLoading(false);
        }, 3000);

        return () => {
            isMountedRef.current = false;
            unsub();
            if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
            if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (selectedNode && isMountedRef.current) {
            const content = selectedNode.fullContent;
            setEditContent(content ?? '');
        }
    }, [selectedNode]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedNode && isMountedRef.current) {
                setSelectedNode(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedNode]);

    const filteredMemories = useMemo(() => {
        return memories.filter((m: { content?: string; metadata?: { type?: string } }) => {
            if (searchQuery && !m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                return false;
            if (typeFilter && m.metadata?.type !== typeFilter) return false;
            return true;
        });
    }, [memories, searchQuery, typeFilter]);

    const nodes = useMemo(() => buildNodes(filteredMemories), [filteredMemories]);
    const edges = useMemo(() => buildEdges(nodes), [nodes]);

    const entityCount = filteredMemories.length;
    const density = computeDensity(edges.length, nodes.length);
    const typeCounts = useMemo(() => computeTypeCounts(filteredMemories), [filteredMemories]);
    const uniqueTypes = useMemo(() => getUniqueTypes(filteredMemories), [filteredMemories]);

    const handleDelete = async () => {
        if (
            !(await confirm({
                title: 'Delete Memory',
                message: 'Are you sure you want to delete this memory node?',
                variant: 'danger',
            }))
        )
            return;
        if (!selectedNode) return;
        try {
            await memoryService.deleteMemory(selectedNode.id);
            if (isMountedRef.current) {
                setSelectedNode(null);
                setMemories([...memoryService.getMemories()]);
                setError(null);
            }
        } catch (e) {
            LOGGER.warn('Failed to delete memory node', String(e));
            if (isMountedRef.current) {
                setError(t('knowledge.error_delete'));
                clearErrorAfterDelay();
            }
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedNode || !editContent.trim()) return;
        setIsSaving(true);
        try {
            const updatedId = await memoryService.updateMemory(selectedNode.id, editContent.trim());
            if (isMountedRef.current) {
                const allMemories = memoryService.getMemories();
                setMemories([...allMemories]);
                if (updatedId) {
                    const updated = allMemories.find((m) => m.id === updatedId);
                    if (updated) {
                        setSelectedNode({
                            id: updated.id,
                            label: updated.content.slice(0, 60),
                            type: updated.metadata.type ?? 'generic',
                            importance: updated.metadata.importance ?? 0.5,
                            source: updated.metadata.source ?? '',
                            fullContent: updated.content,
                            x: 0,
                            y: 0,
                            memory: updated,
                        });
                    } else {
                        setSelectedNode(null);
                    }
                } else {
                    setSelectedNode(null);
                }
                setError(null);
            }
        } catch (e) {
            LOGGER.warn('Failed to update memory node', String(e));
            if (isMountedRef.current) {
                setError(t('knowledge.error_update'));
                clearErrorAfterDelay();
            }
        } finally {
            if (isMountedRef.current) setIsSaving(false);
        }
    };

    const handleNodeClick = (node: GraphNodeData) => {
        if (isMountedRef.current) {
            setSelectedNode(selectedNode?.id === node.id ? null : node);
        }
    };

    const handleNodeKeyDown = (e: React.KeyboardEvent, node: GraphNodeData) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleNodeClick(node);
        }
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
            }}
        >
            <GraphHeader t={t} />

            <ErrorBanner error={error} onDismiss={() => setError(null)} t={t} />

            <SearchAndFilter
                searchQuery={searchQuery}
                typeFilter={typeFilter}
                typeCounts={typeCounts}
                uniqueTypes={uniqueTypes}
                totalMemories={memories.length}
                onSearchChange={setSearchQuery}
                onTypeFilterChange={setTypeFilter}
                t={t}
            />

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: selectedNode ? '1fr 350px' : '1fr',
                    gap: '1.5rem',
                    flex: 1,
                    minHeight: 0,
                    transition: 'all 0.3s ease',
                }}
            >
                <div
                    style={{
                        position: 'relative',
                        overflow: 'hidden',
                        background:
                            'radial-gradient(circle at center, rgba(168,85,247,0.05) 0%, rgba(0,0,0,0.4) 100%)',
                        borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.05)',
                        minHeight: 400,
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(255,255,255,0.02)',
                    }}
                >
                    <KnowledgeGraph
                        nodes={nodes}
                        edges={edges}
                        isLoading={isLoading}
                        selectedNodeId={selectedNode?.id ?? null}
                        entityCount={entityCount}
                        totalMemories={memories.length}
                        density={density}
                        onNodeClick={handleNodeClick}
                        onNodeKeyDown={handleNodeKeyDown}
                        t={t}
                        searchQuery={searchQuery}
                        typeFilter={typeFilter}
                    />
                </div>

                <NodeDetailSidebar
                    selectedNode={selectedNode}
                    editContent={editContent}
                    isEditing={isEditing}
                    isSaving={isSaving}
                    edges={edges}
                    onEditContentChange={setEditContent}
                    onStartEdit={() => setIsEditing(true)}
                    onCancelEdit={() => {
                        setIsEditing(false);
                        if (selectedNode) setEditContent(selectedNode.fullContent ?? '');
                    }}
                    onSaveEdit={handleSaveEdit}
                    onDelete={handleDelete}
                    onClose={() => setSelectedNode(null)}
                    t={t}
                />
            </div>

            <ModuleInfo moduleKey="knowledge" />
            <ConfirmDialog />
        </div>
    );
};

export default KnowledgePanel;
