import React, { useState } from 'react';
import {
    Mic,
    Square,
    FileUp,
    Image,
    Music,
    FileText,
    Trash2,
    CheckCircle,
    XCircle,
    Loader,
} from 'lucide-react';
import PanelLoader from './PanelLoader';
import { voiceInputService } from '../kernel/instances';
import type { VoiceInputSession } from '../kernel/contracts/voice-input';

const TYPE_ICONS: Record<string, React.ReactNode> = {
    image: <Image size={14} />,
    audio: <Music size={14} />,
    video: <Music size={14} />,
    file: <FileText size={14} />,
};

const VoiceInputPanelContent: React.FC = () => {
    const [sessions, setSessions] = useState(() => voiceInputService.getSessions());
    const [attachments, setAttachments] = useState(() => voiceInputService.getAttachments());
    const [recording, setRecording] = useState(false);
    const [activeSession, setActiveSession] = useState<VoiceInputSession | null>(null);

    const refresh = () => {
        setSessions([...voiceInputService.getSessions()]);
        setAttachments([...voiceInputService.getAttachments()]);
    };

    const handleStartRecording = async () => {
        setRecording(true);
        const session = await voiceInputService.startRecording('push_to_talk');
        setActiveSession(session);
        refresh();
    };

    const handleStopRecording = async () => {
        if (!activeSession) return;
        setRecording(false);
        await voiceInputService.stopRecording(activeSession.id);
        setActiveSession(null);
        refresh();
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
                <Mic size={20} color="#3b82f6" /> Voice & Multimodal Input
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--slate-400)' }}>
                Record voice input, attach files, and process multimodal data
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <button
                    onClick={recording ? handleStopRecording : handleStartRecording}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 20px',
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 700,
                        background: recording ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.15)',
                        color: recording ? '#ef4444' : '#3b82f6',
                        animation: recording ? 'pulse 1.5s infinite' : 'none',
                    }}
                >
                    {recording ? <Square size={18} /> : <Mic size={18} />}
                    {recording ? 'Stop Recording' : 'Start Recording'}
                </button>
                <label
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '12px 20px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 14,
                        fontWeight: 600,
                        background: 'rgba(16,185,129,0.15)',
                        color: 'var(--success)',
                    }}
                >
                    <FileUp size={18} /> Attach File
                    <input
                        type="file"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                await voiceInputService.attachFile(file);
                                refresh();
                            }
                        }}
                    />
                </label>
            </div>

            {activeSession && (
                <div
                    style={{
                        background: 'var(--slate-800)',
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 16,
                        border: '1px solid rgba(239,68,68,0.3)',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 13,
                            color: 'var(--error)',
                        }}
                    >
                        <Loader size={14} /> Recording in progress...
                        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--slate-500)' }}>
                            Started {new Date(activeSession.startedAt).toLocaleTimeString()}
                        </span>
                    </div>
                </div>
            )}

            <div style={{ marginBottom: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--slate-200)' }}>
                    Attachments ({attachments.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attachments.map((att) => (
                        <div
                            key={att.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '8px 12px',
                                borderRadius: 8,
                                background: 'var(--slate-900)',
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}
                        >
                            {TYPE_ICONS[att.type] || <FileText size={14} />}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, color: 'var(--slate-200)', fontWeight: 600 }}>
                                    {att.name}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--slate-500)' }}>
                                    {(att.size / 1024).toFixed(0)}KB · {att.mimeType}
                                </div>
                            </div>
                            {att.status === 'uploaded' ? (
                                <CheckCircle size={14} color="#10b981" />
                            ) : (
                                <Loader size={14} color="#3b82f6" />
                            )}
                            <button
                                onClick={() => {
                                    voiceInputService.removeAttachment(att.id);
                                    refresh();
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
                    ))}
                    {attachments.length === 0 && (
                        <div
                            style={{
                                fontSize: 12,
                                color: 'var(--slate-600)',
                                textAlign: 'center',
                                padding: 16,
                            }}
                        >
                            No attachments yet
                        </div>
                    )}
                </div>
            </div>

            <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--slate-200)' }}>
                Recording History ({sessions.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sessions.map((s) => (
                    <div
                        key={s.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '10px 12px',
                            borderRadius: 8,
                            background: 'var(--slate-900)',
                            border: '1px solid rgba(255,255,255,0.04)',
                        }}
                    >
                        <div
                            style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background:
                                    s.status === 'ready'
                                        ? '#10b981'
                                        : s.status === 'error'
                                          ? '#ef4444'
                                          : '#3b82f6',
                            }}
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, color: 'var(--slate-200)' }}>
                                {s.duration > 0 ? `${s.duration}s recording` : 'In progress'}
                            </div>
                            {s.transcript && (
                                <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                    {s.transcript.slice(0, 100)}...
                                </div>
                            )}
                        </div>
                        {s.status === 'ready' && <CheckCircle size={14} color="#10b981" />}
                        {s.status === 'error' && <XCircle size={14} color="#ef4444" />}
                        {s.status === 'processing' && <Loader size={14} color="#3b82f6" />}
                    </div>
                ))}
                {sessions.length === 0 && (
                    <div
                        style={{ fontSize: 12, color: 'var(--slate-600)', textAlign: 'center', padding: 16 }}
                    >
                        No recordings yet
                    </div>
                )}
            </div>
        </div>
    );
};

const VoiceInputPanel: React.FC = () => (
    <PanelLoader name="Voice Input">
        <VoiceInputPanelContent />
    </PanelLoader>
);

export default VoiceInputPanel;
