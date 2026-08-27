import React, { useState } from 'react';
import { Download, Upload, FileJson, FileText, Table, Eye } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { memoryTransferService } from '../kernel/instances';
import type { ExportFormat } from '../kernel/contracts/memory-transfer';

const FORMATS: { value: ExportFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'json', label: 'JSON', icon: <FileJson size={14} /> },
    { value: 'csv', label: 'CSV', icon: <Table size={14} /> },
    { value: 'markdown', label: 'Markdown', icon: <FileText size={14} /> },
];

const SECTIONS = [
    'Episodic Memories',
    'Semantic Memories',
    'Procedural Memories',
    'Emotional Memories',
    'Spatial Memories',
    'Social Memories',
    'Working Memory',
];

const MemoryTransferPanelContent: React.FC = () => {
    const [exports, setExports] = useState(() => memoryTransferService.getExportHistory());
    const [imports, setImports] = useState(() => memoryTransferService.getImportHistory());
    const [format, setFormat] = useState<ExportFormat>('json');
    const [selectedSections, setSelectedSections] = useState<string[]>([
        'Episodic Memories',
        'Semantic Memories',
    ]);
    const [importData, setImportData] = useState('');
    const [importFormat, setImportFormat] = useState<ExportFormat>('json');
    const [preview, setPreview] = useState<{ sections: string[]; entries: number } | null>(null);

    const handleExport = () => {
        const result = memoryTransferService.export(format, selectedSections);
        setExports(memoryTransferService.getExportHistory());
        const blob = new Blob([result.data], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memory-export.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handlePreview = () => {
        if (!importData.trim()) return;
        setPreview(memoryTransferService.previewImport(importData, importFormat));
    };

    const handleImport = async () => {
        if (!importData.trim()) return;
        await memoryTransferService.import(importData, importFormat);
        setImports(memoryTransferService.getImportHistory());
        setImportData('');
        setPreview(null);
    };

    const toggleSection = (s: string) => {
        setSelectedSections((prev) =>
            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
        );
    };

    return (
        <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
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
                <Upload size={20} color="#3b82f6" /> Memory Export/Import
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Export and import memories across instances
            </p>

            <div
                style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    marginBottom: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                }}
            >
                <span>Supports JSON, CSV, and Markdown formats with real parsers.</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Download size={16} color="#10b981" /> Export
                    </h3>
                    <div style={{ marginBottom: 12 }}>
                        <label
                            style={{
                                fontSize: 12,
                                color: 'var(--slate-400)',
                                marginBottom: 6,
                                display: 'block',
                            }}
                        >
                            Format
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {FORMATS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFormat(f.value)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        background:
                                            format === f.value
                                                ? 'rgba(59,130,246,0.2)'
                                                : 'rgba(255,255,255,0.05)',
                                        color: format === f.value ? '#3b82f6' : '#94a3b8',
                                    }}
                                >
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <label
                            style={{
                                fontSize: 12,
                                color: 'var(--slate-400)',
                                marginBottom: 6,
                                display: 'block',
                            }}
                        >
                            Sections
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {SECTIONS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => toggleSection(s)}
                                    style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 11,
                                        background: selectedSections.includes(s)
                                            ? 'rgba(59,130,246,0.2)'
                                            : 'rgba(255,255,255,0.04)',
                                        color: selectedSections.includes(s) ? '#3b82f6' : '#64748b',
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={selectedSections.length === 0}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '8px 16px',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            background: 'rgba(16,185,129,0.2)',
                            color: 'var(--success)',
                            opacity: selectedSections.length === 0 ? 0.5 : 1,
                        }}
                    >
                        <Download size={14} /> Export & Download
                    </button>
                </div>

                <div
                    style={{
                        padding: 16,
                        borderRadius: 12,
                        background: 'var(--slate-800)',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}
                >
                    <h3
                        style={{
                            margin: '0 0 12px',
                            fontSize: 14,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Upload size={16} color="#f59e0b" /> Import
                    </h3>
                    <div style={{ marginBottom: 12 }}>
                        <label
                            style={{
                                fontSize: 12,
                                color: 'var(--slate-400)',
                                marginBottom: 6,
                                display: 'block',
                            }}
                        >
                            Format
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {FORMATS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setImportFormat(f.value)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 12px',
                                        borderRadius: 6,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        background:
                                            importFormat === f.value
                                                ? 'rgba(245,158,11,0.2)'
                                                : 'rgba(255,255,255,0.05)',
                                        color: importFormat === f.value ? '#f59e0b' : '#94a3b8',
                                    }}
                                >
                                    {f.icon} {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="Paste exported memory data here..."
                        style={{
                            width: '100%',
                            minHeight: 100,
                            padding: 8,
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'var(--slate-900)',
                            color: 'var(--slate-200)',
                            fontSize: 12,
                            fontFamily: 'monospace',
                            outline: 'none',
                            resize: 'vertical',
                            marginBottom: 8,
                        }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={handlePreview}
                            disabled={!importData.trim()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                background: 'rgba(139,92,246,0.15)',
                                color: 'var(--purple)',
                                opacity: importData.trim() ? 1 : 0.5,
                            }}
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!importData.trim()}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '8px 14px',
                                borderRadius: 6,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 12,
                                background: 'rgba(245,158,11,0.2)',
                                color: 'var(--warning)',
                                opacity: importData.trim() ? 1 : 0.5,
                            }}
                        >
                            <Upload size={14} /> Import
                        </button>
                    </div>
                    {preview && (
                        <div
                            style={{
                                marginTop: 8,
                                padding: 8,
                                borderRadius: 6,
                                background: 'var(--slate-900)',
                                fontSize: 11,
                                color: 'var(--slate-400)',
                            }}
                        >
                            Sections: {preview.sections.join(', ')} · Entries: {preview.entries}
                        </div>
                    )}
                </div>
            </div>

            <div
                style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Export History ({exports.length})
                    </h3>
                    {exports.map((e) => (
                        <div
                            key={e.createdAt}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11,
                                color: 'var(--slate-500)',
                                marginBottom: 4,
                            }}
                        >
                            {e.format.toUpperCase()} · {(e.size / 1024).toFixed(1)}KB ·{' '}
                            {new Date(e.createdAt).toLocaleString()}
                        </div>
                    ))}
                </div>
                <div>
                    <h3
                        style={{
                            margin: '0 0 8px',
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--slate-200)',
                        }}
                    >
                        Import History ({imports.length})
                    </h3>
                    {imports.map((imp) => (
                        <div
                            key={imp.id}
                            style={{
                                padding: '8px 10px',
                                borderRadius: 6,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11,
                                marginBottom: 4,
                            }}
                        >
                            <span
                                style={{
                                    color: imp.status === 'completed' ? '#10b981' : '#ef4444',
                                }}
                            >
                                {imp.status}
                            </span>
                            <span style={{ color: 'var(--slate-500)' }}>
                                {' '}
                                · {imp.entriesCount} entries ·{' '}
                                {new Date(imp.createdAt).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const MemoryTransferPanel: React.FC = () => (
    <PanelLoader name="Memory Export/Import">
        <MemoryTransferPanelContent />
    </PanelLoader>
);

export default MemoryTransferPanel;
