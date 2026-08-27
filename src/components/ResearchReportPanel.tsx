/**
 * Cognitive-aux / research panel (Experimental).
 * Research reports — research-grade, not production surface (P1.21).
 */
import React, { useState } from 'react';
import {
    FileText,
    Plus,
    Play,
    Trash2,
    Loader,
    ChevronDown,
    ChevronRight,
    BookOpen,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { researchReportService, researchEngine } from '../kernel/instances';

const FORMAT_OPTIONS = ['markdown', 'html', 'json'] as const;

const ResearchReportPanelContent: React.FC = () => {
    const [reports, setReports] = useState(() => researchReportService.getReports());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [topic, setTopic] = useState('');
    const [format, setFormat] = useState<'markdown' | 'html' | 'json'>('markdown');
    const [sessions, setSessions] = useState(() => researchEngine.getAllSessions());
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');

    const refresh = () => {
        setReports([...researchReportService.getReports()]);
        setSessions(researchEngine.getAllSessions());
    };

    const handleCreate = async () => {
        if (!title.trim() && !selectedSessionId) return;
        if (selectedSessionId) {
            await researchReportService.createFromSession(
                selectedSessionId,
                title.trim() || 'Research Report',
                format,
            );
        } else {
            researchReportService.createReport(title, topic || 'General', format);
        }
        setShowForm(false);
        setTitle('');
        setTopic('');
        setSelectedSessionId('');
        refresh();
    };

    const handleGenerate = async (id: string) => {
        await researchReportService.generateReport(id);
        refresh();
    };

    const handleDelete = (id: string) => {
        researchReportService.deleteReport(id);
        if (selectedId === id) setSelectedId(null);
        refresh();
    };

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                }}
            >
                <div>
                    <h2
                        style={{
                            margin: '0 0 4px',
                            fontSize: 18,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}
                    >
                        <BookOpen size={20} color="#a855f7" /> Research Report Generator
                    </h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                        Generate structured research reports with auto-populated sections
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                        background: showForm ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)',
                        color: showForm ? '#ef4444' : '#a855f7',
                    }}
                >
                    {showForm ? <ChevronDown size={16} /> : <Plus size={16} />}
                    {showForm ? 'Cancel' : 'New Report'}
                </button>
            </div>

            {showForm && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: 16,
                        marginBottom: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            marginBottom: 12,
                        }}
                    >
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Report title..."
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <input
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="Or enter a topic (if no session selected)..."
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        />
                        <select
                            value={selectedSessionId}
                            onChange={(e) => setSelectedSessionId(e.target.value)}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        >
                            <option value="">-- No session (manual topic) --</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                        <select
                            value={format}
                            onChange={(e) => setFormat(e.target.value as typeof format)}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--slate-900)',
                                color: 'var(--slate-200)',
                                fontSize: 13,
                                outline: 'none',
                            }}
                        >
                            {FORMAT_OPTIONS.map((f) => (
                                <option key={f} value={f}>
                                    {f.toUpperCase()}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleCreate}
                        disabled={!title.trim() && !selectedSessionId}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            background: 'rgba(168,85,247,0.2)',
                            color: '#a855f7',
                            fontSize: 13,
                            fontWeight: 600,
                            opacity: title.trim() || selectedSessionId ? 1 : 0.5,
                        }}
                    >
                        <Plus size={14} />{' '}
                        {selectedSessionId ? 'Create from Session' : 'Create Report'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {reports.map((report) => (
                    <div
                        key={report.id}
                        style={{
                            background: selectedId === report.id ? '#1e293b' : '#0f172a',
                            borderRadius: 10,
                            border:
                                selectedId === report.id
                                    ? '1px solid rgba(168,85,247,0.3)'
                                    : '1px solid rgba(255,255,255,0.04)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            onClick={() =>
                                setSelectedId(selectedId === report.id ? null : report.id)
                            }
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 14px',
                                cursor: 'pointer',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <FileText
                                    size={16}
                                    color={
                                        report.status === 'ready'
                                            ? '#10b981'
                                            : report.status === 'generating'
                                              ? '#3b82f6'
                                              : '#64748b'
                                    }
                                />
                                <div>
                                    <div
                                        style={{ fontWeight: 600, fontSize: 13, color: 'var(--slate-200)' }}
                                    >
                                        {report.title}
                                    </div>
                                    <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                        {report.topic} · {report.sections.length} sections ·{' '}
                                        {report.sources} sources
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div
                                    style={{
                                        padding: '2px 6px',
                                        borderRadius: 4,
                                        fontSize: 10,
                                        background: 'var(--purple-tint)',
                                        color: '#a855f7',
                                    }}
                                >
                                    {report.format}
                                </div>
                                {report.status === 'draft' && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGenerate(report.id);
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: 'rgba(59,130,246,0.15)',
                                            color: 'var(--accent)',
                                            fontSize: 10,
                                            fontWeight: 600,
                                        }}
                                    >
                                        <Play size={10} /> Generate
                                    </button>
                                )}
                                {report.status === 'generating' && (
                                    <Loader size={14} color="#3b82f6" />
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(report.id);
                                    }}
                                    style={{
                                        padding: 4,
                                        borderRadius: 4,
                                        border: 'none',
                                        cursor: 'pointer',
                                        background: 'rgba(239,68,68,0.15)',
                                        color: 'var(--error)',
                                    }}
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>

                        {selectedId === report.id && (
                            <div
                                style={{
                                    padding: '0 14px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 12,
                                        padding: '8px 10px',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 8,
                                        fontSize: 11,
                                        color: 'var(--slate-400)',
                                    }}
                                >
                                    <span>{report.sections.length} sections</span>
                                    <span>{report.sources} sources</span>
                                    <span>~{Math.round(report.tokens / 1000)}K tokens</span>
                                    {report.completedAt && (
                                        <span>
                                            Generated{' '}
                                            {new Date(report.completedAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                {report.sections.map((section) => (
                                    <div
                                        key={section.id}
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.04)',
                                            borderRadius: 6,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <div
                                            onClick={() => toggleSection(section.id)}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                padding: '8px 10px',
                                                cursor: 'pointer',
                                                fontSize: 12,
                                                color: 'var(--slate-200)',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {expandedSections.has(section.id) ? (
                                                <ChevronDown size={12} />
                                            ) : (
                                                <ChevronRight size={12} />
                                            )}
                                            {section.title}
                                            <span
                                                style={{
                                                    marginLeft: 'auto',
                                                    fontSize: 10,
                                                    color: 'var(--slate-500)',
                                                }}
                                            >
                                                {section.wordCount} words
                                            </span>
                                        </div>
                                        {expandedSections.has(section.id) && (
                                            <div
                                                style={{
                                                    padding: '0 10px 8px',
                                                    fontSize: 12,
                                                    color: 'var(--slate-400)',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {section.content || '_(empty)_'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {reports.length === 0 && (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--slate-500)' }}>
                    <BookOpen size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div style={{ fontSize: 14 }}>No research reports yet</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>
                        Create a new report to get started
                    </div>
                </div>
            )}
        </div>
    );
};

const ResearchReportPanel: React.FC = () => (
    <PanelLoader name="Research Report">
        <ResearchReportPanelContent />
    </PanelLoader>
);

export default ResearchReportPanel;
