import React, { useState, useCallback, useMemo } from 'react';
import PanelLoader from './PanelLoader';

interface ExportSection {
    id: string;
    label: string;
    icon: string;
    exportData: () => Promise<Record<string, unknown>>;
    importData: (data: Record<string, unknown>) => Promise<string>;
}

function makeSection(
    id: string,
    label: string,
    icon: string,
    exportFn: () => Promise<Record<string, unknown>>,
    importFn: (data: Record<string, unknown>) => Promise<string>,
): ExportSection {
    return { id, label, icon, exportData: exportFn, importData: importFn };
}

function loadServices() {
    return import('../kernel/instances');
}

const ExportImportPanel: React.FC = () => {
    const [tab, setTab] = useState<'export' | 'import'>('export');
    const [selected, setSelected] = useState<Set<string>>(
        new Set(['keys', 'config', 'memory', 'agents', 'settings']),
    );
    const [exporting, setExporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importJson, setImportJson] = useState<Record<string, unknown> | null>(null);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const sections: ExportSection[] = useMemo(
        () => [
            makeSection(
                'keys',
                'API Keys',
                '\uD83D\uDD11',
                async () => {
                    const m = await loadServices();
                    const raw = await m.keyService.exportKeys();
                    return { keys: JSON.parse(raw) };
                },
                async (data) => {
                    const m = await loadServices();
                    const count = await m.keyService.importKeys(JSON.stringify(data.keys || []));
                    return `Imported ${count} API keys`;
                },
            ),
            makeSection(
                'memory',
                'Memory',
                '\uD83E\uDDE0',
                async () => {
                    const m = await loadServices();
                    const result = m.memoryTransferService.export('json', [
                        'episodic',
                        'semantic',
                        'working',
                    ]);
                    return { memory: result.data };
                },
                async (data) => {
                    const m = await loadServices();
                    const result = await m.memoryTransferService.import(
                        typeof data.memory === 'string' ? data.memory : JSON.stringify(data.memory),
                        'json',
                    );
                    return `Imported memory: ${result.entriesCount} entries`;
                },
            ),
            makeSection(
                'agents',
                'Agents',
                '\uD83E\uDD16',
                async () => {
                    const m = await loadServices();
                    const raw = m.agentService.exportAgents();
                    return { agents: JSON.parse(raw) };
                },
                async (data) => {
                    const m = await loadServices();
                    const count = m.agentService.importAgents(JSON.stringify(data.agents || []));
                    return `Imported ${count} agents`;
                },
            ),
            makeSection(
                'config',
                'Configuration',
                '\u2699\uFE0F',
                async () => {
                    const m = await loadServices();
                    const state = m.kernel.getStateSnapshot?.() || {};
                    return { config: state };
                },
                async () => {
                    return 'Config import requires manual reconciliation. Use Settings panel.';
                },
            ),
            makeSection(
                'settings',
                'Settings & Themes',
                '\uD83C\uDFA8',
                async () => {
                    const m = await loadServices();
                    const s = m.settingsService.getSettings();
                    return { settings: JSON.parse(JSON.stringify(s)) };
                },
                async (data) => {
                    const m = await loadServices();
                    const s = data.settings as Record<string, unknown>;
                    if (s && typeof s === 'object') {
                        m.settingsService.updateSettings(
                            s as Parameters<typeof m.settingsService.updateSettings>[0],
                        );
                    }
                    return 'Settings restored';
                },
            ),
            makeSection(
                'debates',
                'Debate History',
                '\uD83C\uDF96\uFE0F',
                async () => {
                    const m = await loadServices();
                    const sessions = m.debateEngine?.getAllSessions?.() || [];
                    return {
                        debates: sessions.map((s) => ({
                            id: (s as { id: unknown }).id,
                            topic: (s as { topic: unknown }).topic,
                            phase: (s as { phase: unknown }).phase,
                            round: (s as { round: unknown }).round,
                            startedAt: (s as { startedAt: unknown }).startedAt,
                            updatedAt: (s as { updatedAt: unknown }).updatedAt,
                        })),
                    };
                },
                async () => 'Debate import not supported yet',
            ),
            makeSection(
                'prompts',
                'Prompt Library',
                '\uD83D\uDCDD',
                async () => {
                    const m = await loadServices();
                    if (m.promptLibraryService?.getAll) {
                        const prompts = m.promptLibraryService.getAll();
                        return { prompts: JSON.parse(JSON.stringify(prompts)) };
                    }
                    return { prompts: [] };
                },
                async () => 'Prompt import not supported yet',
            ),
            makeSection(
                'workflows',
                'Workflows',
                '\uD83D\uDD17',
                async () => {
                    const m = await loadServices();
                    if (m.workflowService?.getAll) {
                        const list = await m.workflowService.getAll();
                        return { workflows: JSON.parse(JSON.stringify(list)) };
                    }
                    return { workflows: [] };
                },
                async () => 'Workflow import not supported yet',
            ),
            makeSection(
                'topologies',
                'Topologies',
                '\uD83D\uDCCA',
                async () => {
                    const m = await loadServices();
                    const active = m.orchestrator?.getActiveTopology?.();
                    return { topologies: active ? [JSON.parse(JSON.stringify(active))] : [] };
                },
                async () => 'Topology import not supported yet',
            ),
        ],
        [],
    );

    const toggle = (id: string) => {
        setSelected((p) => {
            const next = new Set(p);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleExport = useCallback(async () => {
        setExporting(true);
        setResult(null);
        try {
            const data: Record<string, unknown> = {
                version: '1.0.0',
                exportedAt: new Date().toISOString(),
            };
            const failed: string[] = [];
            for (const section of sections) {
                if (selected.has(section.id)) {
                    try {
                        const sectionData = await section.exportData();
                        data[section.id] = sectionData;
                    } catch {
                        failed.push(section.label);
                        data[section.id] = { error: 'Failed to export' };
                    }
                }
            }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `superagents-export-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            const succeeded = selected.size - failed.length;
            const msg =
                failed.length === 0
                    ? `Export complete! ${succeeded} sections exported.`
                    : `Export complete (${succeeded}/${selected.size}): ${failed.join(', ')} failed. Check logs.`;
            setResult({ ok: failed.length === 0, msg });
        } catch (e) {
            setResult({
                ok: false,
                msg: `Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`,
            });
        } finally {
            setExporting(false);
        }
    }, [selected, sections]);

    const handleFileSelect = useCallback((file: File | null) => {
        setImportFile(file);
        setResult(null);
        if (!file) {
            setImportJson(null);
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const parsed = JSON.parse(reader.result as string);
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                    throw new Error('Expected a JSON object');
                }
                setImportJson(parsed as Record<string, unknown>);
            } catch (e) {
                setResult({
                    ok: false,
                    msg: e instanceof Error ? e.message : 'Invalid JSON file',
                });
                setImportJson(null);
            }
        };
        reader.readAsText(file);
    }, []);

    const handleImport = useCallback(async () => {
        if (!importJson) return;
        setResult(null);
        const results: string[] = [];
        for (const section of sections) {
            const sectionData = importJson[section.id] as Record<string, unknown> | undefined;
            if (sectionData) {
                try {
                    const msg = await section.importData(sectionData);
                    results.push(`${section.label}: ${msg}`);
                } catch (e) {
                    results.push(
                        `${section.label}: Failed — ${e instanceof Error ? e.message : 'Error'}`,
                    );
                }
            }
        }
        setResult({
            ok: true,
            msg: `Import finished:\n${results.join('\n')}`,
        });
        setImportFile(null);
        setImportJson(null);
    }, [importJson, sections]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    paddingBottom: '0.4rem',
                }}
            >
                <button
                    onClick={() => setTab('export')}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: tab === 'export' ? 'rgba(59,130,246,0.2)' : 'transparent',
                        color: tab === 'export' ? '#60a5fa' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: tab === 'export' ? 600 : 400,
                    }}
                >
                    {'\u2B06'} Export
                </button>
                <button
                    onClick={() => setTab('import')}
                    style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: tab === 'import' ? 'rgba(59,130,246,0.2)' : 'transparent',
                        color: tab === 'import' ? '#60a5fa' : 'var(--text-muted)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: tab === 'import' ? 600 : 400,
                    }}
                >
                    {'\u2B07'} Import
                </button>
            </div>

            {tab === 'export' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Select data to export:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {sections.map((s) => (
                            <label
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.4rem 0.6rem',
                                    borderRadius: '6px',
                                    background: selected.has(s.id)
                                        ? 'rgba(59,130,246,0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${selected.has(s.id) ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.has(s.id)}
                                    onChange={() => toggle(s.id)}
                                    style={{ accentColor: '#3b82f6' }}
                                />
                                <span>{s.icon}</span>
                                <span style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                            </label>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button
                            onClick={() => setSelected(new Set(sections.map((s) => s.id)))}
                            style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            Select All
                        </button>
                        <button
                            onClick={() => setSelected(new Set())}
                            style={{
                                padding: '0.2rem 0.6rem',
                                borderRadius: '4px',
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                            }}
                        >
                            Clear
                        </button>
                        <div style={{ flex: 1 }} />
                        <button
                            onClick={handleExport}
                            disabled={exporting || selected.size === 0}
                            style={{
                                padding: '0.4rem 1.2rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: exporting
                                    ? 'rgba(59,130,246,0.3)'
                                    : 'rgba(59,130,246,0.2)',
                                color: exporting ? '#93c5fd' : '#60a5fa',
                                cursor: exporting || selected.size === 0 ? 'default' : 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}
                        >
                            {exporting ? 'Exporting...' : `Export ${selected.size} sections`}
                        </button>
                    </div>
                </div>
            )}

            {tab === 'import' && (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        alignItems: 'center',
                        padding: '2rem',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{'\uD83D\uDCC2'}</div>
                    <div
                        style={{
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                        }}
                    >
                        Import Data
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 400 }}>
                        Upload a previously exported JSON file to restore your data. The import will
                        merge with existing data.
                    </div>
                    <label
                        style={{
                            padding: '0.5rem 1.5rem',
                            borderRadius: '6px',
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            border: '1px solid rgba(59,130,246,0.2)',
                        }}
                    >
                        {importFile ? importFile.name : 'Choose File'}
                        <input
                            type="file"
                            accept=".json"
                            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                        />
                    </label>
                    {importJson && (
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            Detected sections:{' '}
                            {sections
                                .filter((s) => importJson[s.id])
                                .map((s) => s.label)
                                .join(', ') || 'none'}
                        </div>
                    )}
                    {importFile && importJson && (
                        <button
                            onClick={handleImport}
                            style={{
                                padding: '0.4rem 1.2rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: 'rgba(34,197,94,0.2)',
                                color: 'var(--success)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                            }}
                        >
                            Start Import
                        </button>
                    )}
                </div>
            )}

            {result && (
                <div
                    style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        background: result.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${result.ok ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                        color: result.ok ? '#22c55e' : '#ef4444',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {result.msg}
                </div>
            )}
        </div>
    );
};

export default function ExportImportWrapper() {
    return (
        <PanelLoader title="Export / Import">
            <ExportImportPanel />
        </PanelLoader>
    );
}
