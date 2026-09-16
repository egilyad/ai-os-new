import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { projectManagerService, projectWorkspaceService, websitePreviewService, browserInspectorService, multiAgentProjectService, pythonRunnerService, artifactService, projectTemplateService, autonomyOrchestrator, projectMemoryService } from '../../kernel/instances/services-extras';
import { useProjectStore, ensureSubscribed, destroy } from '../../stores/project-store';
import { StatusBadge, Button } from '../../components/Common';
import ActivitiesPanel from './ActivitiesPanel';
import type { CreateProjectInput } from '../../kernel/types/project-types';
import type { WorkspaceTreeEntry } from '../../kernel/types/workspace-types';
import type { TemplateSummary } from '../../kernel/types/template-types';
import type { Artifact } from '../../kernel/types/artifact-types';

const CARD: React.CSSProperties = { margin: '0.5rem 0', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #2a2a35', background: 'rgba(59,130,246,0.08)', cursor: 'pointer' };
const INPUT: React.CSSProperties = { padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #2a2a35', background: '#1a1a2e', color: 'inherit', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box' };
const SELECT: React.CSSProperties = { ...INPUT, width: 'auto' };
const LABEL: React.CSSProperties = { fontSize: '0.78rem', opacity: 0.7, marginBottom: '0.2rem', display: 'block' };
const FORM_ROW: React.CSSProperties = { display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '0.75rem' };
const TAB_BTN = (active: boolean): React.CSSProperties => ({ padding: '0.35rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : 'inherit', opacity: active ? 1 : 0.6 });
const FILE_ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' };
const PREVIEW_IFRAME: React.CSSProperties = { width: '100%', height: 400, border: '1px solid #2a2a35', borderRadius: 6, background: '#fff' };

const PROJECT_TYPES = [{ value: 'website', label: 'Website' }, { value: 'python', label: 'Python' }, { value: 'node', label: 'Node.js' }, { value: 'react', label: 'React App' }, { value: 'data', label: 'Data' }, { value: 'automation', label: 'Automation' }] as const;
const PIPELINE_STAGES = ['research', 'design', 'development', 'qa', 'done'] as const;
const MEMORY_TYPES = ['decision', 'context', 'issue', 'note', 'lesson'] as const;

type Tab = 'files' | 'preview' | 'pipeline' | 'qa' | 'memory' | 'templates' | 'artifacts' | 'safety' | 'autonomy' | 'python' | 'activities';
const TABS: Tab[] = ['files', 'preview', 'pipeline', 'qa', 'memory', 'templates', 'artifacts', 'autonomy', 'activities'];

const ProjectsPanel: React.FC = () => {
    const { t } = useTranslation();
    const { projects, order, loading, error, loadProjects, select, refresh, selectedProjectId: selectedId } = useProjectStore();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newType, setNewType] = useState<string>('website');
    const [creating, setCreating] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('files');
    const [files, setFiles] = useState<string[]>([]);
    const [previewHtml, setPreviewHtml] = useState('');
    const [qaScore, setQaScore] = useState<number | null>(null);
    const [qaIssues, setQaIssues] = useState<string[]>([]);
    const [pipelineStage, setPipelineStage] = useState('');
    const [templateCount, setTemplateCount] = useState(0);
    const [snapshotCount, setSnapshotCount] = useState(0);
    const [memories, setMemories] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [pyHistory, setPyHistory] = useState<any[]>([]);

    useEffect(() => { ensureSubscribed(); loadProjects(); return () => { destroy(); }; }, [loadProjects]);

    const loadTab = useCallback(async () => {
        if (!selectedId) return;
        try {
            if (activeTab === 'files') {
                const tree = await projectWorkspaceService.getTree(selectedId);
                setFiles(tree.map((e: WorkspaceTreeEntry) => e.path));
            } else if (activeTab === 'preview') {
                const r = await websitePreviewService.generatePreview(selectedId);
                setPreviewHtml(r.html);
            } else if (activeTab === 'qa') {
                const r = await browserInspectorService.inspect(selectedId);
                setQaScore(r.score);
                setQaIssues(r.issues);
            } else if (activeTab === 'pipeline') {
                let pipe = await multiAgentProjectService.getPipeline(selectedId);
                if (!pipe) pipe = await multiAgentProjectService.createPipeline(selectedId);
                setPipelineStage(pipe.currentStage);
            } else if (activeTab === 'templates') {
                setTemplateCount(projectTemplateService.listTemplates().length);
            } else if (activeTab === 'artifacts') {
                setSnapshotCount(artifactService.listSnapshots(selectedId).length);
            } else if (activeTab === 'memory') {
                setMemories(projectMemoryService.getEntries(selectedId));
            } else if (activeTab === 'autonomy') {
                setGoals(autonomyOrchestrator.listGoals(selectedId));
            } else if (activeTab === 'python') {
                setPyHistory(pythonRunnerService.getRunHistory(selectedId));
            }
        } catch (e) { console.error('[ProjectsPanel] loadTab error', e); }
    }, [selectedId, activeTab]);

    useEffect(() => { loadTab(); }, [loadTab]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setCreating(true);
        try {
            await projectManagerService.create({ name: newName.trim(), description: newDesc.trim(), type: newType as CreateProjectInput['type'] });
            setNewName(''); setNewDesc(''); setShowCreate(false);
            await refresh();
        } finally { setCreating(false); }
    };

    const handleApplyTemplate = async (templateId: string) => {
        if (!selectedId) return;
        await projectTemplateService.applyTemplate(templateId, selectedId);
        setFiles((await projectWorkspaceService.getTree(selectedId)).map((e: WorkspaceTreeEntry) => e.path));
        setActiveTab('files');
    };

    const handleBuild = async () => {
        if (!selectedId) return;
        await artifactService.build(selectedId, `Build ${Date.now()}`);
        setSnapshotCount(artifactService.listSnapshots(selectedId).length);
    };

    const handleSnapshot = async () => {
        if (!selectedId) return;
        await artifactService.createSnapshot(selectedId, `Snapshot ${Date.now()}`);
        setSnapshotCount(artifactService.listSnapshots(selectedId).length);
    };

    const handleAdvancePipeline = async () => {
        if (!selectedId) return;
        const pipe = await multiAgentProjectService.getPipeline(selectedId);
        if (pipe) {
            await multiAgentProjectService.completeStage(selectedId, pipe.currentStage, 'Done');
            await multiAgentProjectService.advancePipeline(selectedId);
            const updated = await multiAgentProjectService.getPipeline(selectedId);
            setPipelineStage(updated?.currentStage || 'done');
        }
    };

    const handleAddMemory = (type: string) => {
        if (!selectedId) return;
        projectMemoryService.addEntry(selectedId, { projectId: selectedId, type: type as any, title: `New ${type}`, content: '', tags: [] });
        setMemories(projectMemoryService.getEntries(selectedId));
    };

    const handleCreateGoal = () => {
        if (!selectedId) return;
        autonomyOrchestrator.createGoal(selectedId, 'New goal');
        setGoals(autonomyOrchestrator.listGoals(selectedId));
    };

    // ── Project list view ──
    if (!selectedId) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a35', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{t('projects.title')}</h2>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>{t('projects.subtitle')}</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={() => setShowCreate(!showCreate)}>{showCreate ? t('projects.cancel') : t('projects.new')}</Button>
                </div>
                {showCreate && (
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #2a2a35', background: 'rgba(59,130,246,0.05)' }}>
                        <div style={FORM_ROW}>
                            <div style={{ flex: 1, minWidth: 180 }}><label style={LABEL}>{t('projects.name')}</label><input style={INPUT} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t('projects.namePlaceholder')} /></div>
                            <div style={{ flex: 2, minWidth: 250 }}><label style={LABEL}>{t('projects.description')}</label><input style={INPUT} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder={t('projects.descPlaceholder')} /></div>
                            <div><label style={LABEL}>{t('projects.type')}</label><select style={SELECT} value={newType} onChange={(e) => setNewType(e.target.value)}>{PROJECT_TYPES.map((pt) => <option key={pt.value} value={pt.value}>{pt.label}</option>)}</select></div>
                            <Button variant="accent" onClick={handleCreate} disabled={creating || !newName.trim()}>{creating ? t('projects.creating') : t('projects.create')}</Button>
                        </div>
                    </div>
                )}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                    {loading && order.length === 0 && <p style={{ opacity: 0.5 }}>{t('projects.loading')}</p>}
                    {error && <p style={{ color: '#ef4444' }}>{error}</p>}
                    {!loading && order.length === 0 && <p style={{ opacity: 0.5 }}>{t('projects.empty')}</p>}
                    {order.map((id) => {
                        const p = projects.get(id);
                        if (!p) return null;
                        return (
                            <div key={id} style={CARD} onClick={() => select(id)}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong>{p.name}</strong>
                                    <StatusBadge status={p.status} label={t(`projects.status.${p.status}`)} />
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>{p.description || t('projects.noDescription')}</div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                                    <span>{t('projects.typeLabel')}: {p.type}</span>
                                    <span>{p.agentIds.length} {t('projects.agents')}</span>
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
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.5rem 1rem', borderBottom: '1px solid #2a2a35' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Button variant="ghost" size="sm" onClick={() => select('')}>{'< ' + t('projects.back')}</Button>
                    <strong>{project?.name || selectedId}</strong>
                    {project && <StatusBadge status={project.status} label={t(`projects.status.${project.status}`)} />}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', overflowX: 'auto' }}>
                    {TABS.map((tab) => (
                        <button key={tab} style={TAB_BTN(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                            {t(`projects.tab.${tab}`)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem' }}>
                {/* ── Files Tab ── */}
                {activeTab === 'files' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('projects.files')}</h3>
                        {files.length === 0 && <p style={{ opacity: 0.5 }}>No files. Apply a template or create files via agent.</p>}
                        {files.map((f) => (
                            <div key={f} style={FILE_ROW}><span>{f}</span><span style={{ opacity: 0.5, fontSize: '0.8rem' }}></span></div>
                        ))}
                    </div>
                )}

                {/* ── Preview Tab ── */}
                {activeTab === 'preview' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('preview.title')}</h3>
                            <Button variant="ghost" size="sm" onClick={loadTab}>{t('preview.refresh')}</Button>
                        </div>
                        {previewHtml ? (
                            <iframe srcDoc={previewHtml} style={PREVIEW_IFRAME} title="Preview" />
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
                                <div key={s} style={{ padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.8rem', background: s === pipelineStage ? '#3b82f6' : 'rgba(255,255,255,0.05)', color: s === pipelineStage ? '#fff' : 'inherit', fontWeight: s === pipelineStage ? 600 : 400 }}>
                                    {t(`pipeline.${s}`)}
                                </div>
                            ))}
                        </div>
                        <Button variant="primary" size="sm" onClick={handleAdvancePipeline} disabled={pipelineStage === 'done'}>{t('pipeline.advance')}</Button>
                    </div>
                )}

                {/* ── QA Tab ── */}
                {activeTab === 'qa' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('qa.title')}</h3>
                            <Button variant="ghost" size="sm" onClick={loadTab}>{t('preview.refresh')}</Button>
                        </div>
                        {qaScore !== null ? (
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: qaScore >= 80 ? '#22c55e' : qaScore >= 50 ? '#eab308' : '#ef4444' }}>{qaScore}%</div>
                                <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{qaScore >= 80 ? t('qa.passed') : t('qa.failed')}</p>
                                {qaIssues.length > 0 && (
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <strong style={{ fontSize: '0.85rem' }}>{t('qa.issues')}:</strong>
                                        {qaIssues.map((issue, i) => <div key={i} style={{ fontSize: '0.8rem', color: '#ef4444', padding: '0.15rem 0' }}>- {issue}</div>)}
                                    </div>
                                )}
                            </div>
                        ) : <p style={{ opacity: 0.5 }}>Click refresh to inspect</p>}
                    </div>
                )}

                {/* ── Memory Tab ── */}
                {activeTab === 'memory' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('memory.title')}</h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                {MEMORY_TYPES.map((mt) => (
                                    <Button key={mt} variant="ghost" size="sm" onClick={() => handleAddMemory(mt)}>{t('memory.addEntry')}</Button>
                                ))}
                            </div>
                        </div>
                        {memories.length === 0 && <p style={{ opacity: 0.5 }}>No memories yet.</p>}
                        {memories.map((m) => (
                            <div key={m.id} style={{ ...CARD, cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{m.title}</strong>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{m.type}</span>
                                </div>
                                {m.content && <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>{m.content}</div>}
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Templates Tab ── */}
                {activeTab === 'templates' && (
                    <div>
                        <h3 style={{ margin: '0 0 0.5rem' }}>{t('templates.title')}</h3>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.75rem' }}>{templateCount} templates available</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                            {projectTemplateService.listTemplates().map((tpl: TemplateSummary) => (
                                <div key={tpl.id} style={{ ...CARD, cursor: 'default' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{tpl.name}</strong>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.7, margin: '0.25rem 0' }}>{tpl.description}</div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{tpl.fileCount} files - {tpl.category}</div>
                                    <Button variant="primary" size="sm" style={{ marginTop: '0.5rem' }} onClick={() => handleApplyTemplate(tpl.id)}>{t('templates.apply')}</Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Artifacts Tab ── */}
                {activeTab === 'artifacts' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('artifacts.title')}</h3>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <Button variant="primary" size="sm" onClick={handleBuild}>{t('artifacts.build')}</Button>
                                <Button variant="ghost" size="sm" onClick={handleSnapshot}>{t('artifacts.snapshot')}</Button>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Snapshots: {snapshotCount}</p>
                        {artifactService.listArtifacts(selectedId).map((art: Artifact) => (
                            <div key={art.id} style={{ ...CARD, cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{art.name}</strong>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{art.type}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{art.files.length} files</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Autonomy Tab ── */}
                {activeTab === 'autonomy' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('autonomy.title')}</h3>
                            <Button variant="primary" size="sm" onClick={handleCreateGoal}>{t('autonomy.goal')}</Button>
                        </div>
                        {goals.length === 0 && <p style={{ opacity: 0.5 }}>No goals yet. Create one to start autonomous execution.</p>}
                        {goals.map((g) => (
                            <div key={g.id} style={{ ...CARD, cursor: 'default' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong style={{ fontSize: '0.85rem' }}>{g.description}</strong>
                                    <StatusBadge status={g.status} label={g.status} />
                                </div>
                                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.2rem' }}>
                                    Priority: {g.priority} | Created: {new Date(g.createdAt).toLocaleDateString()}
                                </div>
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0 }}>{t('python.title')}</h3>
                            <Button variant="primary" size="sm" onClick={async () => {
                                await pythonRunnerService.createPythonProject(selectedId);
                                await pythonRunnerService.run(selectedId);
                                setPyHistory(pythonRunnerService.getRunHistory(selectedId));
                            }}>{t('python.run')}</Button>
                        </div>
                        {pyHistory.length === 0 && <p style={{ opacity: 0.5 }}>No runs yet. Write a main.py via agent, then run.</p>}
                        {pyHistory.map((run) => (
                            <div key={run.id} style={{ ...CARD, cursor: 'default', borderLeft: `3px solid ${run.exitCode === 0 ? '#22c55e' : '#ef4444'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: '0.85rem' }}>{run.command}</span>
                                    <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{run.durationMs}ms</span>
                                </div>
                                {run.stdout && <pre style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>{run.stdout}</pre>}
                                {run.stderr && <pre style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '0.3rem', whiteSpace: 'pre-wrap' }}>{run.stderr}</pre>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsPanel;
