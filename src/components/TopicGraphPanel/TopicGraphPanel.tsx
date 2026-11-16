import React, { useCallback, useEffect, useState } from 'react';
import { getContainer } from '../../kernel/service-helper';
import { projectManagerService } from '../../kernel/instances/services-extras';
import { tokens } from '../../styles/tokens';
import type {
    Topic,
    TopicSource,
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicConflict,
} from '../../kernel/contracts/topic-graph/types';
import type { TopicGraphService } from '../../kernel/contracts/topic-graph';

type View = 'graph' | 'knowledge' | 'sources' | 'coverage';

const VIEWS: Array<{ id: View; label: string }> = [
    { id: 'graph', label: 'Graph' },
    { id: 'knowledge', label: 'Knowledge' },
    { id: 'sources', label: 'Sources' },
    { id: 'coverage', label: 'Coverage' },
];

const KIND_COLORS: Record<string, string> = {
    concept: '#2dd4bf',
    claim: '#3b82f6',
    source: '#64748b',
};

function claimColor(kind: string): string {
    return KIND_COLORS[kind] ?? '#94a3b8';
}

export default function TopicGraphPanel() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [view, setView] = useState<View>('graph');
    const [claims, setClaims] = useState<TopicClaim[]>([]);
    const [concepts, setConcepts] = useState<TopicConcept[]>([]);
    const [relations, setRelations] = useState<TopicRelation[]>([]);
    const [conflicts, setConflicts] = useState<TopicConflict[]>([]);
    const [sources, setSources] = useState<TopicSource[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [ingestText, setIngestText] = useState('');
    const [ingestTitle, setIngestTitle] = useState('');
    const [coverage, setCoverage] = useState<{ totalClaims: number; uniqueConcepts: number; conflicts: number; sources: number; coverage: number } | null>(null);
    const [message, setMessage] = useState('');
    const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
    const [exportProjectId, setExportProjectId] = useState('');

    const svc = useCallback((): TopicGraphService => {
        return getContainer().get<TopicGraphService>('topicGraphService');
    }, []);

    const loadTopics = useCallback(async () => {
        try {
            const list = await svc().listTopics();
            setTopics(list);
            if (list.length > 0 && !selectedTopic) setSelectedTopic(list[0]!.id);
        } catch (e) {
            setMessage(`Ошибка загрузки тем: ${e instanceof Error ? e.message : String(e)}`);
        }
    }, [svc, selectedTopic]);

    useEffect(() => {
        void loadTopics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void projectManagerService
            .list()
            .then((list) => {
                const mapped = list.map((p) => ({ id: p.id, name: p.name }));
                setProjects(mapped);
                if (mapped.length > 0) setExportProjectId(mapped[0]!.id);
            })
            .catch(() => setMessage('Не удалось загрузить проекты'));
    }, []);

    useEffect(() => {
        if (!selectedTopic) return;
        void (async () => {
            try {
                const [c, cp, r, cf, s, cov] = await Promise.all([
                    svc().claims(selectedTopic),
                    svc().concepts(selectedTopic),
                    svc().relations(selectedTopic),
                    svc().conflicts(selectedTopic),
                    svc().sources(selectedTopic),
                    svc().completeness(selectedTopic),
                ]);
                setClaims(c);
                setConcepts(cp);
                setRelations(r);
                setConflicts(cf);
                setSources(s);
                setCoverage(cov);
            } catch (e) {
                setMessage(`Ошибка загрузки темы: ${e instanceof Error ? e.message : String(e)}`);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTopic]);

    const createTopic = async () => {
        if (!newTitle.trim()) return;
        try {
            const topic = await svc().createTopic(newTitle.trim(), newDesc.trim());
            setSelectedTopic(topic.id);
            setNewTitle('');
            setNewDesc('');
            await loadTopics();
        } catch (e) {
            setMessage(`Ошибка создания: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const exportToProject = async () => {
        if (!selectedTopic || !exportProjectId) return;
        try {
            const repo = getContainer().get<{
                putFile(input: { projectId: string; path: string; content: string; createdAt: number; updatedAt: number }): Promise<void>;
            }>('projectRepository');
            const path = await svc().exportToProject(
                { putFile: (input) => repo.putFile(input) },
                exportProjectId,
                selectedTopic,
            );
            setMessage(path ? `Экспортировано: ${path.path}` : 'Экспорт не выполнен');
        } catch (e) {
            setMessage(`Ошибка экспорта: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const ingest = async () => {
        if (!selectedTopic || !ingestText.trim()) return;
        try {
            const run = await svc().ingest(selectedTopic, {
                kind: 'document',
                ref: ingestTitle.trim() || `manual-${Date.now()}`,
                title: ingestTitle.trim() || 'Manual input',
                content: ingestText,
            });
            setMessage(
                `Обработка: ${run.stats.newClaims} новых, ${run.stats.duplicates} дублей, ` +
                `${run.stats.conflicts} конфликтов`,
            );
            setIngestText('');
            setIngestTitle('');
            // перезагрузить данные
            const [c, cp, r, cf, s, cov] = await Promise.all([
                svc().claims(selectedTopic),
                svc().concepts(selectedTopic),
                svc().relations(selectedTopic),
                svc().conflicts(selectedTopic),
                svc().sources(selectedTopic),
                svc().completeness(selectedTopic),
            ]);
            setClaims(c);
            setConcepts(cp);
            setRelations(r);
            setConflicts(cf);
            setSources(s);
            setCoverage(cov);
        } catch (e) {
            setMessage(`Ошибка ингеста: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const topConcepts = concepts.slice(0, 20);
    const claimById = new Map<string, TopicClaim>();
    claims.forEach((c) => claimById.set(c.id, c));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 12, padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Topic Graph</h2>
                <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-elevated)',
                        fontSize: 12,
                    }}
                >
                    {topics.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                </select>
                <div style={{ display: 'flex', gap: 6 }}>
                    {VIEWS.map((v) => (
                        <button
                            key={v.id}
                            onClick={() => setView(v.id)}
                            style={{
                                padding: '5px 12px',
                                borderRadius: 999,
                                border: '1px solid var(--border)',
                                background: view === v.id ? tokens.accent : 'transparent',
                                color: view === v.id ? tokens.slate[950] : 'var(--slate-300)',
                                cursor: 'pointer',
                                fontSize: 12,
                            }}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {message && (
                <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>{message}</div>
            )}

            {/* Создание темы */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                    placeholder="Название темы"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                />
                <input
                    placeholder="Описание"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    style={{ flex: 1, minWidth: 180, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                />
                <button onClick={() => void createTopic()} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: tokens.accent, color: tokens.slate[950], fontWeight: 700, cursor: 'pointer' }}>
                    Создать тему
                </button>
            </div>

            {/* Ингест */}
            {selectedTopic && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <input
                        placeholder="Заголовок источника"
                        value={ingestTitle}
                        onChange={(e) => setIngestTitle(e.target.value)}
                        style={{ width: 200, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                    />
                    <input
                        placeholder="Вставьте текст документа/ответа модели…"
                        value={ingestText}
                        onChange={(e) => setIngestText(e.target.value)}
                        style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                    />
                    <button onClick={() => void ingest()} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: tokens.accent, color: tokens.slate[950], fontWeight: 700, cursor: 'pointer' }}>
                        Ingest
                    </button>
                    <select
                        value={exportProjectId}
                        onChange={(e) => setExportProjectId(e.target.value)}
                        title="Проект для экспорта"
                        style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--slate-300)', maxWidth: 180 }}
                    >
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => void exportToProject()}
                        disabled={!exportProjectId}
                        title="Экспорт отчёта темы в проект (TopicResults/)"
                        style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: exportProjectId ? 'var(--slate-300)' : 'var(--slate-600)', fontWeight: 600, cursor: exportProjectId ? 'pointer' : 'not-allowed' }}
                    >
                        Экспорт в проект
                    </button>
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {view === 'graph' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Концепты</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {topConcepts.map((c) => (
                                <span
                                    key={c.id}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: 999,
                                        border: `1px solid ${claimColor('concept')}40`,
                                        background: `${claimColor('concept')}18`,
                                        color: claimColor('concept'),
                                        fontSize: 12,
                                    }}
                                >
                                    {c.name} ({c.claimIds.length})
                                </span>
                            ))}
                            {topConcepts.length === 0 && (
                                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Нет концептов</span>
                            )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Утверждения</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {claims.map((c) => (
                                <div
                                    key={c.id}
                                    style={{
                                        padding: '8px 10px',
                                        borderRadius: 8,
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        background: 'rgba(255,255,255,0.02)',
                                        fontSize: 12,
                                    }}
                                >
                                    <div style={{ color: 'var(--slate-200)' }}>{c.text}</div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)', marginTop: 4 }}>
                                        {c.sourceIds.length} источн. · conf {c.confidence.toFixed(2)} · {c.status}
                                    </div>
                                </div>
                            ))}
                            {claims.length === 0 && (
                                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Нет утверждений</span>
                            )}
                        </div>
                    </div>
                )}

                {view === 'knowledge' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {concepts.map((c) => (
                            <div key={c.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px' }}>
                                <div style={{ fontWeight: 700, fontSize: 13, color: claimColor('concept') }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{c.claimIds.length} утверждений</div>
                            </div>
                        ))}
                        {concepts.length === 0 && <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Пусто</span>}
                    </div>
                )}

                {view === 'sources' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {sources.map((s) => (
                            <div key={s.id} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
                                <div style={{ fontWeight: 600 }}>{s.title} <span style={{ color: 'var(--slate-500)' }}>[{s.kind}]</span></div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{s.ref}</div>
                            </div>
                        ))}
                        {sources.length === 0 && <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Нет источников</span>}
                    </div>
                )}

                {view === 'coverage' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                            {[
                                { k: 'Утверждения', v: coverage?.totalClaims ?? 0 },
                                { k: 'Концепты', v: coverage?.uniqueConcepts ?? 0 },
                                { k: 'Конфликты', v: coverage?.conflicts ?? 0 },
                                { k: 'Источники', v: coverage?.sources ?? 0 },
                            ].map((it) => (
                                <div key={it.k} style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '10px' }}>
                                    <div style={{ fontSize: 22, fontWeight: 700 }}>{it.v}</div>
                                    <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>{it.k}</div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: 'var(--slate-500)', marginBottom: 4 }}>
                                Полнота: {Math.round((coverage?.coverage ?? 0) * 100)}%
                            </div>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.round((coverage?.coverage ?? 0) * 100)}%`, background: tokens.accent }} />
                            </div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>Противоречия</div>
                        {conflicts.map((c) => (
                            <div key={c.id} style={{ border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '8px 10px', fontSize: 12 }}>
                                <div style={{ color: 'var(--error)' }}>{c.claimAId} ↔ {c.claimBId}</div>
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>{c.reason} · conf {c.confidence.toFixed(2)}</div>
                            </div>
                        ))}
                        {conflicts.length === 0 && <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>Конфликтов нет</span>}
                    </div>
                )}
            </div>

            {relations.length > 0 && view === 'graph' && (
                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                    Связей: {relations.length} (показаны концепты и утверждения)
                </div>
            )}
        </div>
    );
}
