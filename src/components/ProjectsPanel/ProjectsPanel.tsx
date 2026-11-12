import React, { useEffect, useState, useCallback, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useTranslation } from '../../i18n/useTranslation';
import {
    projectManagerService,
    projectWorkspaceService,
    websitePreviewService,
    browserInspectorService,
    multiAgentProjectService,
    pythonRunnerService,
    artifactService,
    projectTemplateService,
    autonomyOrchestrator,
    projectMemoryService,
} from '../../kernel/instances/services-extras';
import { agentService } from '../../kernel/instances/services-core';
import { useProjectStore, ensureSubscribed, destroy } from '../../stores/project-store';
import type { ProjectStoreState } from '../../stores/project-store';
import { StatusBadge, Button } from '../../components/Common';
import { seedProjectDemo } from '../../kernel/services/project-demo-seed';
import ActivitiesPanel from './ActivitiesPanel';
import type { CreateProjectInput, ProjectAgentAssignment } from '../../kernel/types/project-types';
import type { Artifact } from '../../kernel/types/artifact-types';
import type { AutonomyGoal } from '../../kernel/types/autonomy-types';
import type { MemoryEntryType, ProjectMemoryEntry } from '../../kernel/types/project-memory-types';
import type { AutonomyGoal } from '../../kernel/types/autonomy-types';
import type { PythonRun } from '../../kernel/types/python-runtime-types';

const CARD: React.CSSProperties = {
    margin: '0.5rem 0',
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: '1px solid #2a2a35',
    background: 'rgba(59,130,246,0.08)',
    cursor: 'pointer',
};
const INPUT: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    border: '1px solid #2a2a35',
    background: '#1a1a2e',
    color: 'inherit',
    fontSize: '0.85rem',
    width: '100%',
    boxSizing: 'border-box',
};
const SELECT: React.CSSProperties = { ...INPUT, width: 'auto' };
const LABEL: React.CSSProperties = {
    fontSize: '0.78rem',
    opacity: 0.7,
    marginBottom: '0.2rem',
    display: 'block',
};
const FORM_ROW: React.CSSProperties = {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    marginBottom: '0.75rem',
};
const TAB_BTN = (active: boolean): React.CSSProperties => ({
    padding: '0.35rem 0.75rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : 'inherit',
    opacity: active ? 1 : 0.6,
});
const FILE_ROW: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.3rem 0',
    fontSize: '0.85rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
};
const PREVIEW_IFRAME: React.CSSProperties = {
    width: '100%',
    height: 400,
    border: '1px solid #2a2a35',
    borderRadius: 6,
    background: '#fff',
};

const PROJECT_TYPES = [
    { value: 'website', label: 'Website' },
    { value: 'python', label: 'Python' },
    { value: 'node', label: 'Node.js' },
    { value: 'react', label: 'React App' },
    { value: 'data', label: 'Data' },
    { value: 'automation', label: 'Automation' },
] as const;
const PIPELINE_STAGES = ['research', 'design', 'development', 'qa', 'done'] as const;
const MEMORY_TYPES = ['decision', 'context', 'issue', 'note', 'lesson'] as const;

type Tab =
    | 'files'
    | 'preview'
    | 'pipeline'
    | 'qa'
    | 'agents'
    | 'memory'
    | 'templates'
    | 'artifacts'
    | 'safety'
    | 'autonomy'
    | 'python'
    | 'activities';
const TABS: Tab[] = [
    'files',
    'preview',
    'pipeline',
    'qa',
    'agents',
    'memory',
    'templates',
    'artifacts',
    'autonomy',
    'activities',
];

const ProjectsPanel: React.FC = () => {
    const { t } = useTranslation();
    // Selective subscription: tasks/runs/files/assignments churn on every
    // run update — this panel only needs the project list slice.
    const {
        projects,
        order,
        loading,
        error,
        loadProjects,
        select,
        refresh,
        selectedProjectId: selectedId,
    } = useProjectStore(
        (s: ProjectStoreState) => ({
            projects: s.projects,
            order: s.order,
            loading: s.loading,
            error: s.error,
            loadProjects: s.loadProjects,
            select: s.select,
            refresh: s.refresh,
            selectedProjectId: s.selectedProjectId,
        }),
        shallow,
    );
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<string>('website');
    const [creating, setCreating] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('files');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [qaScore, setQaScore] = useState<number | null>(null);
    const [qaIssues, setQaIssues] = useState<string[]>([]);
    const [pipelineStage, setPipelineStage] = useState('');
    const [templateCount, setTemplateCount] = useState(0);
    const [snapshotCount, setSnapshotCount] = useState(0);
    const [memories, setMemories] = useState<ProjectMemoryEntry[]>([]);
    const [goals, setGoals] = useState<AutonomyGoal[]>([]);
    const [pyHistory, setPyHistory] = useState<PythonRun[]>([]);
    const [tabError, setTabError] = useState<string | null>(null);
    const tabRequestRef = useRef(0);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFileContent, setSelectedFileContent] = useState('');
    const [fileError, setFileError] = useState<string | null>(null);
    const [showCreateFile, setShowCreateFile] = useState(false);
    const [newFilePath, setNewFilePath] = useState('');
    const [newFileContent, setNewFileContent] = useState('');
    const [assignments, setAssignments] = useState<ProjectAgentAssignment[]>([]);
    const [allAgents, setAllAgents] = useState<Array<{ id: string; name: string }>>([]);
    const [newAgentId, setNewAgentId] = useState('');
    const [newAgentRole, setNewAgentRole] = useState('developer');
    const [artifactsList, setArtifactsList] = useState<Artifact[]>([]);
    const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);
    const [snapshotsList, setSnapshotsList] = useState<
        Array<{ id: string; name: string; fileCount: number; createdAt: number }>
    >([]);
    const [goalsList, setGoalsList] = useState<AutonomyGoal[]>([]);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
    const [editGoalDesc, setEditGoalDesc] = useState('');
    const [editGoalPriority, setEditGoalPriority] = useState<
        'low' | 'medium' | 'high' | 'critical'
    >('medium');

    useEffect(() => {
        ensureSubscribed();
        loadProjects();
        return () => {
            destroy();
        };
    }, [loadProjects]);

    const loadTab = useCallback(async () => {
        if (!selectedId) return;
        const requestId = ++tabRequestRef.current;
        const isCurrent = () => tabRequestRef.current === requestId;
        try {
            setTabError(null);
            if (activeTab === 'files') {
                const tree = await projectWorkspaceService.getTree(selectedId);
                if (!isCurrent()) return;
                setFiles(Array.isArray(tree) ? tree.map((e) => e.path) : []);
            } else if (activeTab === 'preview') {
                const r = await websitePreviewService.generatePreview(selectedId);
                if (!isCurrent()) return;
                setPreviewHtml(r?.html ?? '');
            } else if (activeTab === 'qa') {
                const r = await browserInspectorService.inspect(selectedId);
                if (!isCurrent()) return;
                setQaScore(typeof r?.score === 'number' ? r.score : null);
                setQaIssues(Array.isArray(r?.issues) ? r.issues : []);
            } else if (activeTab === 'pipeline') {
                let pipe = await multiAgentProjectService.getPipeline(selectedId);
                if (!pipe) pipe = await multiAgentProjectService.createPipeline(selectedId);
                if (!isCurrent()) return;
                setPipelineStage(pipe?.currentStage ?? '');
            } else if (activeTab === 'templates') {
                const count = projectTemplateService.listTemplates().length;
                if (!isCurrent()) return;
                setTemplateCount(count);
            } else if (activeTab === 'artifacts') {
                const snapshots = artifactService.listSnapshots(selectedId);
                const arts = artifactService.listArtifacts(selectedId);
                if (!isCurrent()) return;
                setSnapshotCount(snapshots.length);
                setSnapshotsList(
                    snapshots.map((s) => ({
                        id: s.id,
                        name: s.name,
                        fileCount: s.fileCount,
                        createdAt: s.createdAt,
                    })),
                );
                setArtifactsList(arts);
            } else if (activeTab === 'agents') {
                const list = await projectManagerService.listAgents(selectedId);
                if (!isCurrent()) return;
                setAssignments(Array.isArray(list) ? list : []);
                try {
                    const agents = agentService.getAgents();
                    setAllAgents(agents.map((a) => ({ id: a.id, name: a.name })));
                } catch {
                    setAllAgents([]);
                }
            } else if (activeTab === 'memory') {
                const entries = projectMemoryService.getEntries(selectedId);
                if (!isCurrent()) return;
                setMemories(Array.isArray(entries) ? entries : []);
            } else if (activeTab === 'autonomy') {
                const list = autonomyOrchestrator.listGoals(selectedId);
                if (!isCurrent()) return;
                setGoals(Array.isArray(list) ? list : []);
                setGoalsList(Array.isArray(list) ? list : []);
            } else if (activeTab === 'python') {
                const hist = pythonRunnerService.getRunHistory(selectedId);
                if (!isCurrent()) return;
                setPyHistory(Array.isArray(hist) ? hist : []);
            }
        } catch (e) {
            // A stale request may be rejected after the current one started;
            // do not surface its error over the fresh tab.
            if (tabRequestRef.current !== requestId) return;
            console.error('[ProjectsPanel] loadTab error', e);
            // Stale/empty tabs must not masquerade as "no data".
            setTabError(t('projects.error_load_tab'));
        }
    }, [selectedId, activeTab, t]);

    useEffect(() => {
        loadTab();
    }, [loadTab]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await projectManagerService.create({
                name: newName.trim(),
                description: newDesc.trim(),
                type: newType as CreateProjectInput['type'],
            });
            setNewName('');
            setNewDesc('');
            setShowCreate(false);
            await refresh();
        } finally {
            setCreating(false);
        }
    };

    const handleSeedDemo = async () => {
        if (seeding) return;
        setSeeding(true);
        try {
            const id = await seedProjectDemo(projectManagerService);
            await refresh();
            select(id);
        } finally {
            setSeeding(false);
        }
    };

    // Every mutating action funnels through here so failures surface in the
    // tab banner instead of failing silent (or pretending success).
    const runGuarded = async (fn: () => void | Promise<void>) => {
        setTabError(null);
        try {
            await fn();
        } catch (e) {
            console.error('[ProjectsPanel] action failed', e);
            setTabError(t('projects.error_action'));
        }
    };

    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedId) return;
        await runGuarded(async () => {
            await projectTemplateService.applyTemplate(templateId, selectedId);
            const tree = await projectWorkspaceService.getTree(selectedId);
            setFiles(Array.isArray(tree) ? tree.map((e) => e.path) : []);
            setActiveTab('files');
        });
    };

    const handleBuild = async () => {
        if (!selectedId) return;
        await runGuarded(async () => {
            await artifactService.build(selectedId, `Build ${Date.now()}`);
            const snapshots = artifactService.listSnapshots(selectedId);
            setSnapshotCount(snapshots.length);
            setSnapshotsList(
                snapshots.map((s) => ({
                    id: s.id,
                    name: s.name,
                    fileCount: s.fileCount,
                    createdAt: s.createdAt,
                })),
            );
            setArtifactsList(artifactService.listArtifacts(selectedId));
        });
    };

    const handleSnapshot = async () => {
        if (!selectedId) return;
        await runGuarded(async () => {
            await artifactService.createSnapshot(selectedId, `Snapshot ${Date.now()}`);
            const snapshots = artifactService.listSnapshots(selectedId);
            setSnapshotCount(snapshots.length);
            setSnapshotsList(
                snapshots.map((s) => ({
                    id: s.id,
                    name: s.name,
                    fileCount: s.fileCount,
                    createdAt: s.createdAt,
                })),
            );
        });
    };

    const handleAdvancePipeline = async () => {
        if (!selectedId) return;
        await runGuarded(async () => {
            const pipe = await multiAgentProjectService.getPipeline(selectedId);
            if (pipe) {
                await multiAgentProjectService.completeStage(selectedId, pipe.currentStage, 'Done');
                await multiAgentProjectService.advancePipeline(selectedId);
                const updated = await multiAgentProjectService.getPipeline(selectedId);
                // Never fabricate a terminal state: if the refresh comes back
                // empty, keep showing the last known stage.
                setPipelineStage((prev) => updated?.currentStage ?? prev);
            }
        });
    };

    const [editingName, setEditingName] = useState(false);
    const [editNameValue, setEditNameValue] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const startEditName = (project: { id: string; name: string }) => {
        setEditNameValue(project.name);
        setEditingName(true);
    };

    const saveName = async (projectId: string) => {
        const name = editNameValue.trim();
        if (!name) {
            setEditingName(false);
            return;
        }
        await runGuarded(async () => {
            await projectManagerService.update(projectId, { name });
            setEditingName(false);
            await refresh();
        });
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirmDeleteId !== projectId) {
            setConfirmDeleteId(projectId);
            return;
        }
        await runGuarded(async () => {
            await projectManagerService.delete(projectId);
            setConfirmDeleteId(null);
            if (selectedId === projectId) select('');
            await refresh();
        });
    };

    const handleArchiveProject = async (projectId: string) => {
        await runGuarded(async () => {
            const p = projects.get(projectId);
            if (!p) return;
            await projectManagerService.update(projectId, {
                status: p.status === 'archived' ? 'draft' : 'archived',
            });
            await refresh();
        });
    };

    const handleReadFile = async (path: string) => {
        if (!selectedId) return;
        setFileError(null);
        try {
            const file = await projectWorkspaceService.readFile(selectedId, path);
            setSelectedFile(path);
            setSelectedFileContent(file?.content ?? '');
        } catch {
            setSelectedFile(path);
            setSelectedFileContent('');
            setFileError(t('projects.error_load_tab'));
        }
    };

    const handleCreateFile = async () => {
        if (!selectedId || !newFilePath.trim()) return;
        await runGuarded(async () => {
            await projectWorkspaceService.writeFile(selectedId, newFilePath.trim(), newFileContent);
            setShowCreateFile(false);
            setNewFilePath('');
            setNewFileContent('');
            const tree = await projectWorkspaceService.getTree(selectedId);
            setFiles(Array.isArray(tree) ? tree.map((e) => e.path) : []);
            await handleReadFile(newFilePath.trim());
        });
    };

    const handleAssignAgent = async () => {
        if (!selectedId || !newAgentId) return;
        await runGuarded(async () => {
            await projectManagerService.assignAgent(selectedId, newAgentId, newAgentRole);
            setNewAgentId('');
            const list = await projectManagerService.listAgents(selectedId);
            setAssignments(Array.isArray(list) ? list : []);
            await refresh();
        });
    };

    const handleRemoveAgent = async (agentId: string) => {
        if (!selectedId) return;
        await runGuarded(async () => {
            await projectManagerService.removeAgent(selectedId, agentId);
            const list = await projectManagerService.listAgents(selectedId);
            setAssignments(Array.isArray(list) ? list : []);
            await refresh();
        });
    };

    const handleAddMemory = (type: MemoryEntryType) => {
        if (!selectedId) return;
        void runGuarded(() => {
            projectMemoryService.addEntry(selectedId, {
                projectId: selectedId,
                type,
                title: `New ${type}`,
                content: '',
                tags: [],
            });
            const entries = projectMemoryService.getEntries(selectedId);
            setMemories(Array.isArray(entries) ? entries : []);
        });
    };

    const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
    const [editMemoryTitle, setEditMemoryTitle] = useState('');
    const [editMemoryContent, setEditMemoryContent] = useState('');

    const startEditMemory = (m: ProjectMemoryEntry) => {
        setEditingMemoryId(m.id);
        setEditMemoryTitle(m.title);
        setEditMemoryContent(m.content);
    };

    const saveMemory = async (m: ProjectMemoryEntry) => {
        if (!selectedId) return;
        await runGuarded(() => {
            projectMemoryService.updateEntry(selectedId, m.id, {
                title: editMemoryTitle,
                content: editMemoryContent,
            });
            const entries = projectMemoryService.getEntries(selectedId);
            setMemories(Array.isArray(entries) ? entries : []);
            setEditingMemoryId(null);
        });
    };

    const deleteMemory = async (m: ProjectMemoryEntry) => {
        if (!selectedId) return;
        await runGuarded(() => {
            projectMemoryService.deleteEntry(selectedId, m.id);
            const entries = projectMemoryService.getEntries(selectedId);
            setMemories(Array.isArray(entries) ? entries : []);
        });
    };

    const handleDeleteArtifact = (artifactId: string) => {
        void runGuarded(() => {
            artifactService.deleteArtifact(artifactId);
            if (selectedId) {
                setArtifactsList(artifactService.listArtifacts(selectedId));
            }
            setOpenArtifact(null);
        });
    };

    const handleRestoreSnapshot = (snapshotId: string) => {
        void runGuarded(async () => {
            await artifactService.restoreSnapshot(snapshotId);
            if (selectedId) {
                const tree = await projectWorkspaceService.getTree(selectedId);
                setFiles(Array.isArray(tree) ? tree.map((e) => e.path) : []);
            }
        });
    };

    const handleDownloadArtifact = (art: Artifact) => {
        try {
            const filesJson = JSON.stringify(
                art.files.map((f) => ({ path: f.path, content: f.content })),
                null,
                2,
            );
            const blob = new Blob([filesJson], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${art.name.replace(/[^a-z0-9-_]+/gi, '-')}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
            /* best-effort */
        }
    };

    const startEditGoal = (g: AutonomyGoal) => {
        setEditingGoalId(g.id);
        setEditGoalDesc(g.description);
        setEditGoalPriority(g.priority);
    };

    const saveGoal = (g: AutonomyGoal) => {
        void runGuarded(() => {
            autonomyOrchestrator.updateGoal(g.id, {
                description: editGoalDesc.trim() || g.description,
                priority: editGoalPriority,
            });
            const list = autonomyOrchestrator.listGoals(g.projectId);
            setGoals(Array.isArray(list) ? list : []);
            setGoalsList(Array.isArray(list) ? list : []);
            setEditingGoalId(null);
        });
    };

    const deleteGoal = (g: AutonomyGoal) => {
        void runGuarded(() => {
            autonomyOrchestrator.deleteGoal(g.id);
            const list = autonomyOrchestrator.listGoals(g.projectId);
            setGoals(Array.isArray(list) ? list : []);
            setGoalsList(Array.isArray(list) ? list : []);
        });
    };

    const handleCreateGoal = () => {
        if (!selectedId) return;
        void runGuarded(() => {
            autonomyOrchestrator.createGoal(selectedId, 'New goal');
            const list = autonomyOrchestrator.listGoals(selectedId);
            setGoals(Array.isArray(list) ? list : []);
            setGoalsList(Array.isArray(list) ? list : []);
        });
    };

    const filteredOrder = order.filter((id) => {
        const p = projects.get(id);
        if (!p) return false;
        if (statusFilter && p.status !== statusFilter) return false;
        if (typeFilter && p.type !== typeFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            const hay = `${p.name} ${p.description} ${p.type}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    // ── Project list view ──
    if (!selectedId) {
        return (
            <div
                style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #2a2a35',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('projects.title')}</h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>
                            {t('projects.subtitle')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void handleSeedDemo()}
                            disabled={seeding}
                            title={t('projects.seed_demo')}
                            aria-label={t('projects.seed_demo')}
                        >
                            ☕
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setShowCreate(!showCreate)}
                        >
                            {showCreate ? t('projects.cancel') : t('projects.new')}
                        </Button>
                    </div>
                </div>
                {showCreate && (
                    <div
                        style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #2a2a35',
                            background: 'rgba(59,130,246,0.05)',
                        }}
                    >
                        <div style={FORM_ROW}>
                            <div style={{ flex: 1, minWidth: 180 }}>
                                <label style={LABEL}>{t('projects.name')}</label>
                                <input
                                    style={INPUT}
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder={t('projects.namePlaceholder')}
                                />
                            </div>
                            <div style={{ flex: 2, minWidth: 250 }}>
                                <label style={LABEL}>{t('projects.description')}</label>
                                <input
                                    style={INPUT}
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    placeholder={t('projects.descPlaceholder')}
                                />
                            </div>
                            <div>
                                <label style={LABEL}>{t('projects.type')}</label>
                                <select
                                    style={SELECT}
                                    value={newType}
                                    onChange={(e) => setNewType(e.target.value)}
                                >
                                    {PROJECT_TYPES.map((pt) => (
                                        <option key={pt.value} value={pt.value}>
                                            {pt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="accent"
                                onClick={handleCreate}
                                disabled={creating || !newName.trim()}
                            >
                                {creating ? t('projects.creating') : t('projects.create')}
                            </Button>
                        </div>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            flexWrap: 'wrap',
                            marginBottom: '0.75rem',
                        }}
                    >
                        <input
                            style={{ ...INPUT, flex: 1, minWidth: 180 }}
                            placeholder="Поиск по проектам…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            aria-label="Поиск проектов"
                        />
                        <select
                            style={SELECT}
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            aria-label="Фильтр по типу"
                        >
                            <option value="">Все типы</option>
                            {PROJECT_TYPES.map((pt) => (
                                <option key={pt.value} value={pt.value}>
                                    {pt.label}
                                </option>
                            ))}
                        </select>
                        <select
                            style={SELECT}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            aria-label="Фильтр по статусу"
                        >
                            <option value="">Все статусы</option>
                            {['draft', 'building', 'running', 'ready', 'failed', 'archived'].map(
                                (s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                    {loading && order.length === 0 && (
                        <p style={{ opacity: 0.5 }}>{t('projects.loading')}</p>
                    )}
                    {error && <p style={{ color: 'var(--error)' }}>{error}</p>}
                    {!loading && order.length === 0 && (
                        <p style={{ opacity: 0.5 }}>{t('projects.empty')}</p>
                    )}
                    {!loading && order.length > 0 && filteredOrder.length === 0 && (
                        <p style={{ opacity: 0.5 }}>Ничего не найдено по фильтру.</p>
                    )}
                    {filteredOrder.map((id) => {
                        const p = projects.get(id);
                        if (!p) return null;
                        return (
                            <div key={id} style={CARD} onClick={() => select(id)}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <strong>{p.name}</strong>
                                    <StatusBadge
                                        status={p.status}
                                        label={t(`projects.status.${p.status}`)}
                                    />
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        opacity: 0.7,
                                        marginTop: '0.25rem',
                                    }}
                                >
                                    {p.description || t('projects.noDescription')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.75rem',
                                        opacity: 0.5,
                                        marginTop: '0.2rem',
                                        display: 'flex',
                                        gap: '0.75rem',
                                    }}
                                >
                                    <span>
                                        {t('projects.typeLabel')}: {p.type}
                                    </span>
                                    <span>
                                        {(p.agentIds ?? []).length} {t('projects.agents')}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ── Project detail view with tabs ──
    const project = projects.get(selectedId);
    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #2a2a35' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <Button variant="ghost" size="sm" onClick={() => select('')}>
                        {'< ' + t('projects.back')}
                    </Button>
                    {editingName && project ? (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <input
                                style={{ ...INPUT, width: 200 }}
                                value={editNameValue}
                                onChange={(e) => setEditNameValue(e.target.value)}
                                autoFocus
                                aria-label="Имя проекта"
                            />
                            <Button
                                variant="accent"
                                size="sm"
                                onClick={() => void saveName(project.id)}
                            >
                                {t('projects.save')}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingName(false)}>
                                {t('projects.cancel')}
                            </Button>
                        </div>
                    ) : (
                        <strong>{project?.name || selectedId}</strong>
                    )}
                    {project && (
                        <StatusBadge
                            status={project.status}
                            label={t(`projects.status.${project.status}`)}
                        />
                    )}
                    {project && !editingName && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditName(project)}
                            >
                                ✏️
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleArchiveProject(project.id)}
                            >
                                {project.status === 'archived' ? '↩️' : '📦'}
                            </Button>
                            <Button
                                variant={confirmDeleteId === project.id ? 'danger' : 'ghost'}
                                size="sm"
                                onClick={() => void handleDeleteProject(project.id)}
                            >
                                {confirmDeleteId === project.id
                                    ? t('projects.confirmDelete')
                                    : '🗑️'}
                            </Button>
                        </>
                    )}
                </div>
                <div
                    style={{
                        display: 'flex',
                        gap: '0.25rem',
                        marginTop: '0.5rem',
                        overflowX: 'auto',
                    }}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            style={TAB_BTN(activeTab === tab)}
                            onClick={() => setActiveTab(tab)}
                        >
                            {t(`projects.tab.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {tabError && (
                    <div
                        role="alert"
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: 8,
                            background: 'rgba(239,68,68,0.08)',
                            border: 'var(--1px solid var(--error-tint))',
                            color: '#fca5a5',
                            fontSize: '0.8rem',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <span>{tabError}</span>
                        <button
                            onClick={() => {
                                setTabError(null);
                                void loadTab();
                            }}
                            style={{
                                background: 'none',
                                border: '1px solid rgba(239,68,68,0.3)',
                                color: '#fca5a5',
                                borderRadius: 6,
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.6rem',
                                cursor: 'pointer',
                            }}
                        >
                            {t('projects.retry')}
                        </button>
                    </div>
                )}
                {/* ── Files Tab ── */}
                {activeTab === 'files' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('projects.files')}</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateFile(!showCreateFile)}
                            >
                                + {t('projects.newFile')}
                            </Button>
                        </div>
                        {showCreateFile && (
                            <div style={{ ...CARD, cursor: 'default', marginBottom: '0.75rem' }}>
                                <input
                                    style={INPUT}
                                    placeholder="path/to/file.ts"
                                    value={newFilePath}
                                    onChange={(e) => setNewFilePath(e.target.value)}
                                    aria-label="Путь файла"
                                />
                                <textarea
                                    style={{ ...INPUT, marginTop: '0.4rem', minHeight: 80 }}
                                    placeholder="Содержимое (необязательно)"
                                    value={newFileContent}
                                    onChange={(e) => setNewFileContent(e.target.value)}
                                    aria-label="Содержимое файла"
                                />
                                <div style={{ marginTop: '0.4rem' }}>
                                    <Button
                                        variant="accent"
                                        size="sm"
                                        onClick={() => void handleCreateFile()}
                                        disabled={!newFilePath.trim()}
                                    >
                                        {t('projects.create')}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {files.length === 0 && (
                            <p style={{ opacity: 0.5 }}>
                                No files. Apply a template or create files via agent.
                            </p>
                        )}
                        {files.map((f) => (
                            <div
                                key={f}
                                style={{ ...FILE_ROW, cursor: 'pointer' }}
                                onClick={() => void handleReadFile(f)}
                            >
                                <span>{f}</span>
                                <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>👁</span>
                            </div>
                        ))}
                        {selectedFile && fileError && (
                            <p style={{ color: 'var(--error)', fontSize: '0.8rem' }}>{fileError}</p>
                        )}
                        {selectedFile && !fileError && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    borderTop: '1px solid #2a2a35',
                                    paddingTop: '0.5rem',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.4rem',
                                    }}
                                >
                                    <strong style={{ fontSize: '0.85rem' }}>{selectedFile}</strong>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFile(null)}
                                    >
                                        ✕
                                    </Button>
                                </div>
                                <pre
                                    style={{
                                        fontSize: '0.78rem',
                                        opacity: 0.8,
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        maxHeight: 320,
                                        overflowY: 'auto',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '0.6rem',
                                        borderRadius: 6,
                                    }}
                                >
                                    {selectedFileContent || '(пусто)'}
                                </pre>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Preview Tab ── */}
                {activeTab === 'preview' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('preview.title')}</h3>
                            <Button variant="ghost" size="sm" onClick={loadTab}>
                                {t('preview.refresh')}
                            </Button>
                        </div>
                        {previewHtml ? (
                            // sandbox without allow-same-origin: generated site scripts
                            // may run, but in an opaque origin that cannot touch the app.
                            <iframe
                                srcDoc={previewHtml}
                                sandbox="allow-scripts"
                                style={PREVIEW_IFRAME}
                                title="Preview"
                            />
                        ) : (
                            <p style={{ opacity: 0.5 }}>{t('preview.noFiles')}</p>
                        )}
                    </div>
                )}

                {/* ── Pipeline Tab ── */}
                {activeTab === 'pipeline' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('pipeline.title')}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            {PIPELINE_STAGES.map((s) => (
                                <div
                                    key={s}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: 6,
                                        fontSize: '0.8rem',
                                        background:
                                            s === pipelineStage
                                                ? '#3b82f6'
                                                : 'rgba(255,255,255,0.05)',
                                        color: s === pipelineStage ? '#fff' : 'inherit',
                                        fontWeight: s === pipelineStage ? 600 : 400,
                                    }}
                                >
                                    {t(`pipeline.${s}`)}
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleAdvancePipeline}
                            disabled={pipelineStage === 'done'}
                        >
                            {t('pipeline.advance')}
                        </Button>
                    </div>
                )}

                {/* ── QA Tab ── */}
                {activeTab === 'qa' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('qa.title')}</h3>
                            <Button variant="primary" size="sm" onClick={loadTab}>
                                {t('qa.run')}
                            </Button>
                        </div>
                        {qaScore !== null ? (
                            <div>
                                <div
                                    style={{
                                        fontSize: '2rem',
                                        fontWeight: 700,
                                        color:
                                            qaScore >= 80
                                                ? '#22c55e'
                                                : qaScore >= 50
                                                  ? '#eab308'
                                                  : '#ef4444',
                                    }}
                                >
                                    {qaScore}%
                                </div>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                    {qaScore >= 80 ? t('qa.passed') : t('qa.failed')}
                                </p>
                                {qaIssues.length > 0 && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.85rem' }}>
                                            {t('qa.issues')}:
                                        </strong>
                                        {qaIssues.map((issue, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    fontSize: '0.8rem',
                                                    color: 'var(--error)',
                                                    padding: '0.15rem 0',
                                                }}
                                            >
                                                - {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p style={{ opacity: 0.5 }}>{t('projects.qa_hint_refresh')}</p>
                        )}
                    </div>
                )}

                {/* ── Agents Tab ── */}
                {activeTab === 'agents' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('projects.agents')}</h3>
                        <div
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.75rem',
                            }}
                        >
                            <select
                                style={SELECT}
                                value={newAgentId}
                                onChange={(e) => setNewAgentId(e.target.value)}
                                aria-label="Агент"
                            >
                                <option value="">— выберите агента —</option>
                                {allAgents.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                style={SELECT}
                                value={newAgentRole}
                                onChange={(e) => setNewAgentRole(e.target.value)}
                                aria-label="Роль"
                            >
                                {[
                                    'director',
                                    'researcher',
                                    'developer',
                                    'designer',
                                    'content',
                                    'qa',
                                ].map((r) => (
                                    <option key={r} value={r}>
                                        {r}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => void handleAssignAgent()}
                                disabled={!newAgentId}
                            >
                                {t('projects.assignAgent')}
                            </Button>
                        </div>
                        {assignments.length === 0 && (
                            <p style={{ opacity: 0.5 }}>{t('projects.noAgents')}</p>
                        )}
                        {assignments.map((a) => (
                            <div key={a.agentId} style={{ ...CARD, cursor: 'default' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '0.85rem' }}>{a.agentId}</strong>
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.6,
                                                marginLeft: 8,
                                            }}
                                        >
                                            {a.role}
                                        </span>
                                        {a.capabilities.length > 0 && (
                                            <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                                {a.capabilities.join(', ')}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => void handleRemoveAgent(a.agentId)}
                                    >
                                        ✕
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Memory Tab ── */}
                {activeTab === 'memory' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('memory.title')}</h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {MEMORY_TYPES.map((mt) => (
                                    <Button
                                        key={mt}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleAddMemory(mt)}
                                    >
                                        {t('memory.addEntry')}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        {memories.length === 0 && <p style={{ opacity: 0.5 }}>No memories yet.</p>}
                        {memories.map((m) => (
                            <div key={m.id} style={{ ...CARD, cursor: 'default' }}>
                                {editingMemoryId === m.id ? (
                                    <div>
                                        <input
                                            style={INPUT}
                                            value={editMemoryTitle}
                                            onChange={(e) => setEditMemoryTitle(e.target.value)}
                                            aria-label="Заголовок записи"
                                        />
                                        <textarea
                                            style={{ ...INPUT, marginTop: '0.4rem', minHeight: 70 }}
                                            value={editMemoryContent}
                                            onChange={(e) => setEditMemoryContent(e.target.value)}
                                            aria-label="Содержимое записи"
                                        />
                                        <div
                                            style={{
                                                marginTop: '0.4rem',
                                                display: 'flex',
                                                gap: '0.4rem',
                                            }}
                                        >
                                            <Button
                                                variant="accent"
                                                size="sm"
                                                onClick={() => void saveMemory(m)}
                                            >
                                                {t('projects.save')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingMemoryId(null)}
                                            >
                                                {t('projects.cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <strong style={{ fontSize: '0.85rem' }}>
                                                {m.title}
                                            </strong>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.3rem',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                                    {m.type}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEditMemory(m)}
                                                >
                                                    ✏️
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => void deleteMemory(m)}
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                        {m.content && (
                                            <div
                                                style={{
                                                    fontSize: '0.8rem',
                                                    opacity: 0.7,
                                                    marginTop: '0.2rem',
                                                }}
                                            >
                                                {m.content}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Templates Tab ── */}
                {activeTab === 'templates' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('templates.title')}</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.75rem' }}>
                            {templateCount} templates available
                        </p>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                gap: '0.5rem',
                            }}
                        >
                            {projectTemplateService.listTemplates().map((tpl) => (
                                <div key={tpl.id} style={{ ...CARD, cursor: 'default' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{tpl.name}</strong>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            opacity: 0.7,
                                            margin: '0.25rem 0',
                                        }}
                                    >
                                        {tpl.description}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                        {tpl.fileCount} files - {tpl.category}
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        style={{ marginTop: '0.5rem' }}
                                        onClick={() => handleApplyTemplate(tpl.id)}
                                    >
                                        {t('templates.apply')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Artifacts Tab ── */}
                {activeTab === 'artifacts' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('artifacts.title')}</h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Button variant="primary" size="sm" onClick={handleBuild}>
                                    {t('artifacts.build')}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleSnapshot}>
                                    {t('artifacts.snapshot')}
                                </Button>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                            Snapshots: {snapshotCount}
                        </p>
                        {snapshotsList.map((s) => (
                            <div
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.3rem 0.5rem',
                                    fontSize: '0.78rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <span>
                                    {s.name}{' '}
                                    <span style={{ opacity: 0.5 }}>({s.fileCount} файлов)</span>
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRestoreSnapshot(s.id)}
                                >
                                    ↺ Восстановить
                                </Button>
                            </div>
                        ))}
                        {artifactsList.map((art) => (
                            <div key={art.id} style={{ ...CARD, cursor: 'default' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <strong style={{ fontSize: '0.85rem' }}>{art.name}</strong>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.3rem',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                            {art.type}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setOpenArtifact(art)}
                                        >
                                            👁
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDownloadArtifact(art)}
                                        >
                                            ⬇
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteArtifact(art.id)}
                                        >
                                            🗑️
                                        </Button>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>
                                    {art.files.length} files
                                </div>
                            </div>
                        ))}
                        {openArtifact && (
                            <div
                                style={{
                                    marginTop: '0.75rem',
                                    borderTop: '1px solid #2a2a35',
                                    paddingTop: '0.5rem',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.4rem',
                                    }}
                                >
                                    <strong style={{ fontSize: '0.85rem' }}>
                                        {openArtifact.name}
                                    </strong>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setOpenArtifact(null)}
                                    >
                                        ✕
                                    </Button>
                                </div>
                                {openArtifact.files.map((f) => (
                                    <details key={f.path} style={{ marginBottom: '0.3rem' }}>
                                        <summary style={{ fontSize: '0.78rem', cursor: 'pointer' }}>
                                            {f.path}{' '}
                                            <span style={{ opacity: 0.5 }}>({f.sizeBytes} B)</span>
                                        </summary>
                                        <pre
                                            style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.8,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '0.5rem',
                                                borderRadius: 6,
                                                maxHeight: 300,
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {f.content}
                                        </pre>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── Autonomy Tab ── */}
                {activeTab === 'autonomy' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('autonomy.title')}</h3>
                            <Button variant="primary" size="sm" onClick={handleCreateGoal}>
                                {t('autonomy.goal')}
                            </Button>
                        </div>
                        {goals.length === 0 && (
                            <p style={{ opacity: 0.5 }}>
                                No goals yet. Create one to start autonomous execution.
                            </p>
                        )}
                        {goalsList.map((g) => (
                            <div key={g.id} style={{ ...CARD, cursor: 'default' }}>
                                {editingGoalId === g.id ? (
                                    <div>
                                        <input
                                            style={INPUT}
                                            value={editGoalDesc}
                                            onChange={(e) => setEditGoalDesc(e.target.value)}
                                            aria-label="Описание цели"
                                        />
                                        <select
                                            style={{ ...SELECT, marginTop: '0.4rem' }}
                                            value={editGoalPriority}
                                            onChange={(e) =>
                                                setEditGoalPriority(
                                                    e.target.value as AutonomyGoal['priority'],
                                                )
                                            }
                                            aria-label="Приоритет цели"
                                        >
                                            {(['low', 'medium', 'high', 'critical'] as const).map(
                                                (p) => (
                                                    <option key={p} value={p}>
                                                        {p}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <div
                                            style={{
                                                marginTop: '0.4rem',
                                                display: 'flex',
                                                gap: '0.4rem',
                                            }}
                                        >
                                            <Button
                                                variant="accent"
                                                size="sm"
                                                onClick={() => saveGoal(g)}
                                            >
                                                {t('projects.save')}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingGoalId(null)}
                                            >
                                                {t('projects.cancel')}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <strong style={{ fontSize: '0.85rem' }}>
                                                {g.description}
                                            </strong>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.3rem',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <StatusBadge status={g.status} label={g.status} />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => startEditGoal(g)}
                                                >
                                                    ✏️
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => deleteGoal(g)}
                                                >
                                                    🗑️
                                                </Button>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                opacity: 0.7,
                                                marginTop: '0.2rem',
                                            }}
                                        >
                                            Priority: {g.priority} | Created:{' '}
                                            {g.createdAt
                                                ? new Date(g.createdAt).toLocaleDateString()
                                                : '—'}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Activities Tab ── */}
                {activeTab === 'activities' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('observability.title')}</h3>
                        <ActivitiesPanel projectId={selectedId} />
                    </div>
                )}

                {/* ── Python Tab ── */}
                {activeTab === 'python' && (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '0.5rem',
                            }}
                        >
                            <h3 style={{ margin: 0 }}>{t('python.title')}</h3>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                    void runGuarded(async () => {
                                        await pythonRunnerService.createPythonProject(selectedId);
                                        await pythonRunnerService.run(selectedId);
                                        const hist = pythonRunnerService.getRunHistory(selectedId);
                                        setPyHistory(Array.isArray(hist) ? hist : []);
                                    })
                                }
                            >
                                {t('python.run')}
                            </Button>
                        </div>
                        {pyHistory.length === 0 && (
                            <p style={{ opacity: 0.5 }}>
                                No runs yet. Write a main.py via agent, then run.
                            </p>
                        )}
                        {pyHistory.map((run) => (
                            <div
                                key={run.id}
                                style={{
                                    ...CARD,
                                    cursor: 'default',
                                    borderLeft: `3px solid ${run.exitCode === 0 ? '#22c55e' : '#ef4444'}`,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{run.command}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                                        {run.durationMs}ms
                                    </span>
                                </div>
                                {run.stdout && (
                                    <pre
                                        style={{
                                            fontSize: '0.8rem',
                                            opacity: 0.7,
                                            marginTop: '0.3rem',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {run.stdout}
                                    </pre>
                                )}
                                {run.stderr && (
                                    <pre
                                        style={{
                                            fontSize: '0.8rem',
                                            color: 'var(--error)',
                                            marginTop: '0.3rem',
                                            whiteSpace: 'pre-wrap',
                                        }}
                                    >
                                        {run.stderr}
                                    </pre>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsPanel;
