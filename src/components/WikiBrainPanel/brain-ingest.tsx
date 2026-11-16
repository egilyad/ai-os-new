import React, { useCallback, useEffect, useState } from 'react';
import { tokens } from '../../styles/tokens';
import { useTranslation } from '../../i18n/useTranslation';
import { getBrain } from './use-wiki-brain';
import type { TWikiLogEntry } from '../../kernel/contracts/wiki-brain/types';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const input: React.CSSProperties = {
    width: '100%',
    background: tokens.surface,
    border: `1px solid ${tokens.borderDefault}`,
    borderRadius: 8,
    padding: '8px 10px',
    color: tokens.slate[200],
    fontSize: 14,
    marginBottom: 10,
};

const buttonStyle: React.CSSProperties = {
    background: tokens.accent,
    color: tokens.slate[950],
    border: 'none',
    borderRadius: 8,
    padding: '8px 14px',
    fontWeight: 700,
    cursor: 'pointer',
};

interface QueueRow {
    id: string;
    status: string;
}

export default function BrainIngest() {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [queue, setQueue] = useState<QueueRow[]>([]);
    const [log, setLog] = useState<TWikiLogEntry[]>([]);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        try {
            const store = getBrain().store;
            const [q, lg] = await Promise.all([store.listQueue(), store.listLog()]);
            setQueue(q.slice(0, 10).map((t) => ({ id: t.id, status: t.status })));
            setLog((lg as TWikiLogEntry[]).slice(0, 8));
        } catch {
            /* ignore */
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void load();
    }, [load]);

    const enqueue = async () => {
        if (!title.trim() || !content.trim()) return;
        setBusy(true);
        setMessage('');
        try {
            const store = getBrain().store;
            const encoder = new TextEncoder();
            const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(content));
            const sha256 = Array.from(new Uint8Array(buffer))
                .map((b) => b.toString(16).padStart(2, '0'))
                .join('');
            const uid = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
            const sourceId = `src-${uid()}`;
            await store.putSource({
                id: sourceId,
                kind: 'markdown',
                title: title.trim(),
                origin: title.trim(),
                sha256,
                sizeBytes: content.length,
                language: 'auto',
                contentText: content,
                meta: {},
                importedAt: new Date().toISOString(),
            });
            await store.enqueue({ id: `task-${uid()}`, sourceId, status: 'pending', attempts: 0, priority: 0 });
            setMessage(t('wiki.queued_msg', { title }));
            setTitle('');
            setContent('');
            await load();
        } catch (e) {
            setMessage(e instanceof Error ? e.message : String(e));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div>
            <div style={label}>Новый источник</div>
            <input style={input} placeholder="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea
                style={{ ...input, minHeight: 100, resize: 'vertical' }}
                placeholder="Текст (Markdown)…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />
            <button style={buttonStyle} disabled={busy || !title.trim() || !content.trim()} onClick={() => void enqueue()}>
                {busy ? '…' : 'Добавить в очередь'}
            </button>
            {message && <div style={{ color: tokens.slate[400], fontSize: 13, marginTop: 8 }}>{message}</div>}

            <div style={{ ...label, marginTop: 24 }}>Очередь ингеста</div>
            {queue.length === 0 ? (
                <div style={{ color: tokens.slate[500], fontSize: 14 }}>{t('wiki.queue_empty')}</div>
            ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {queue.map((q) => (
                        <li
                            key={q.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                background: tokens.surface,
                                border: `1px solid ${tokens.borderSubtle}`,
                                borderRadius: 8,
                                padding: '10px 12px',
                                marginBottom: 6,
                                fontSize: 13,
                            }}
                        >
                            <span>{q.id}</span>
                            <span style={{ color: tokens.slate[500] }}>{q.status}</span>
                        </li>
                    ))}
                </ul>
            )}

            {log.length > 0 && (
                <>
                    <div style={{ ...label, marginTop: 24 }}>Последние операции</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {log.map((e) => (
                            <li key={e.id} style={{ fontSize: 12, color: tokens.slate[400], padding: '4px 0', borderBottom: `1px solid ${tokens.borderSubtle}` }}>
                                {e.op} — {e.summary}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    );
}
