import React, { useState, useRef } from 'react';
import { ChevronRight, X, Target, Copy, Lightbulb } from 'lucide-react';
import { Skeleton } from '../Common/Skeleton';
import type { FileNode } from '../../kernel/contracts/workspace';
import {
    getExt,
    formatSize,
    estimateLines,
    isSensitivePath,
    highlightCode,
} from './project-os-utils';

interface FilePreviewPanelProps {
    selectedPath: string;
    previewContent: string | null;
    previewLoading: boolean;
    previewError: string | null;
    breadcrumbs: string[];
    allFiles: FileNode[];
    goToLine: string;
    onClose: () => void;
    onGoToLine: () => void;
    onSetGoToLine: (v: string) => void;
    onCopyPath: (path: string) => void;
    onCreateHypothesis: (path: string) => void;
}

export const FilePreviewPanel: React.FC<FilePreviewPanelProps> = ({
    selectedPath,
    previewContent,
    previewLoading,
    previewError,
    breadcrumbs,
    allFiles,
    goToLine,
    onClose,
    onGoToLine,
    onSetGoToLine,
    onCopyPath,
    onCreateHypothesis,
}) => {
    const [activeTab, setActiveTab] = useState<'content' | 'info'>('content');
    const previewRef = useRef<HTMLDivElement>(null);

    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div
                style={{
                    padding: '0.35rem 0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    fontSize: '0.68rem',
                    flexWrap: 'wrap',
                }}
            >
                <span
                    style={{ color: 'var(--slate-500)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    onClick={onClose}
                >
                    root
                </span>
                {breadcrumbs.map((part, i) => (
                    <React.Fragment key={`bc-${i}`}>
                        <ChevronRight size={9} color="#475569" />
                        <span
                            style={{
                                color: i === breadcrumbs.length - 1 ? '#a855f7' : '#94a3b8',
                                fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                                maxWidth: 120,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {part}
                        </span>
                    </React.Fragment>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                        onClick={() => setActiveTab('content')}
                        style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: 3,
                            border: 'none',
                            background:
                                activeTab === 'content' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: activeTab === 'content' ? '#a855f7' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '0.62rem',
                            fontWeight: 600,
                        }}
                    >
                        Content
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        style={{
                            padding: '0.15rem 0.4rem',
                            borderRadius: 3,
                            border: 'none',
                            background:
                                activeTab === 'info' ? 'rgba(139,92,246,0.2)' : 'transparent',
                            color: activeTab === 'info' ? '#a855f7' : '#64748b',
                            cursor: 'pointer',
                            fontSize: '0.62rem',
                            fontWeight: 600,
                        }}
                    >
                        Info
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--slate-500)',
                            cursor: 'pointer',
                            padding: 2,
                        }}
                    >
                        <X size={11} />
                    </button>
                </div>
            </div>

            {activeTab === 'info' ? (
                <div style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
                    <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}
                    >
                        {[
                            ['Path', selectedPath],
                            ['Extension', getExt(selectedPath).toUpperCase() || '(none)'],
                            [
                                'Size',
                                formatSize(
                                    allFiles.find((f) => f.path === selectedPath)?.size || 0,
                                ),
                            ],
                            [
                                'Est. Lines',
                                estimateLines(
                                    allFiles.find((f) => f.path === selectedPath)?.size || 0,
                                ).toLocaleString(),
                            ],
                            ['Sensitive', isSensitivePath(selectedPath) ? 'Yes' : 'No'],
                            [
                                'Lines Displayed',
                                previewContent
                                    ? previewContent.split('\n').length.toLocaleString()
                                    : '—',
                            ],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <div
                                    style={{
                                        fontSize: '0.6rem',
                                        color: 'var(--slate-500)',
                                        fontWeight: 600,
                                        marginBottom: 2,
                                    }}
                                >
                                    {label}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.72rem',
                                        color: 'var(--slate-200)',
                                        background: 'rgba(0,0,0,0.2)',
                                        borderRadius: 4,
                                        padding: '0.3rem 0.5rem',
                                        wordBreak: 'break-all',
                                    }}
                                >
                                    {String(value)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            padding: '0.25rem 0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            borderBottom: '1px solid rgba(255,255,255,0.02)',
                            fontSize: '0.65rem',
                        }}
                    >
                        <Target size={10} color="#64748b" />
                        <span style={{ color: 'var(--slate-500)' }}>Go to line:</span>
                        <input
                            type="number"
                            min={1}
                            value={goToLine}
                            onChange={(e) => onSetGoToLine(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onGoToLine();
                            }}
                            style={{
                                width: 50,
                                padding: '0.1rem 0.3rem',
                                borderRadius: 3,
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: 'var(--slate-200)',
                                fontSize: '0.65rem',
                            }}
                        />
                        <button
                            onClick={onGoToLine}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                padding: 1,
                                fontSize: '0.62rem',
                            }}
                        >
                            Go
                        </button>
                        <span style={{ marginLeft: 'auto', color: 'var(--slate-500)', fontSize: '0.6rem' }}>
                            {previewContent ? `${previewContent.split('\n').length} lines` : ''}
                            {allFiles.find((f) => f.path === selectedPath)?.size &&
                                ` · ${formatSize(allFiles.find((f) => f.path === selectedPath)!.size!)}`}
                        </span>
                        <button
                            onClick={() => onCopyPath(selectedPath)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--slate-500)',
                                cursor: 'pointer',
                                padding: 2,
                            }}
                        >
                            <Copy size={10} />
                        </button>
                        <button
                            onClick={() => onCreateHypothesis(selectedPath)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#a855f7',
                                cursor: 'pointer',
                                padding: 2,
                            }}
                            title="Create hypothesis from this file"
                        >
                            <Lightbulb size={10} />
                        </button>
                    </div>

                    <div ref={previewRef} style={{ flex: 1, overflow: 'auto', display: 'flex' }}>
                        {previewLoading ? (
                            <div
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--slate-500)',
                                    width: '100%',
                                }}
                            >
                                <Skeleton width="40%" height={14} />
                            </div>
                        ) : previewError ? (
                            <div
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--error)',
                                    fontSize: '0.78rem',
                                    width: '100%',
                                }}
                            >
                                {previewError}
                            </div>
                        ) : previewContent ? (
                            <div
                                style={{
                                    fontFamily:
                                        '"Fira Code","JetBrains Mono","Cascadia Code",monospace',
                                    fontSize: '0.7rem',
                                    lineHeight: 1.5,
                                    padding: '0.5rem 1rem',
                                    width: '100%',
                                }}
                            >
                                {highlightCode(previewContent, getExt(selectedPath))}
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: '2rem',
                                    textAlign: 'center',
                                    color: 'var(--slate-600)',
                                    fontSize: '0.75rem',
                                    width: '100%',
                                }}
                            >
                                No content
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
