import React, { useState } from 'react';
import { Plus, Trash2, ShieldOff, CheckCircle2, XCircle } from 'lucide-react';
import type {
    ExceptionTemplate,
    ExceptionMatchMode,
    ExceptionScope,
} from '../../kernel/types/exception-template';
import { makeExceptionId } from '../../kernel/types/exception-template';
import { loadTemplates, saveTemplates, toggleTemplate } from './exception-store';

const SCOPES: ExceptionScope[] = ['all', 'global', 'assistant', 'chat'];
const MATCH_MODES: ExceptionMatchMode[] = ['contains', 'exact', 'regex'];

const scopeLabel: Record<ExceptionScope, string> = {
    all: 'Везде',
    global: 'Глобально',
    assistant: 'Ассистент',
    chat: 'Чат',
};

const matchLabel: Record<ExceptionMatchMode, string> = {
    contains: 'содержит',
    exact: 'точно',
    regex: 'regex',
};

const ExceptionsPanel: React.FC = () => {
    const [templates, setTemplates] = useState<ExceptionTemplate[]>(() => loadTemplates());

    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [scope, setScope] = useState<ExceptionScope>('all');
    const [matchMode, setMatchMode] = useState<ExceptionMatchMode>('contains');

    const commit = (next: ExceptionTemplate[]) => {
        setTemplates(next);
        saveTemplates(next);
    };

    const handleAdd = () => {
        const trimmedName = name.trim();
        const trimmedText = text.trim();
        if (!trimmedName || !trimmedText) return;
        const tpl: ExceptionTemplate = {
            id: makeExceptionId(),
            name: trimmedName.slice(0, 80),
            text: trimmedText.slice(0, 500),
            scope,
            matchMode,
            enabled: true,
            createdAt: Date.now(),
        };
        commit([tpl, ...templates]);
        setName('');
        setText('');
    };

    const handleDelete = (id: string) => {
        commit(templates.filter((t) => t.id !== id));
    };

    const handleToggle = (id: string) => {
        commit(toggleTemplate(templates, id));
    };

    const activeCount = templates.filter((t) => t.enabled).length;

    return (
        <div style={{ padding: '1rem 1.25rem', maxWidth: 900, margin: '0 auto' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: '0.5rem',
                }}
            >
                <ShieldOff size={18} color="#ef4444" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Исключения (вето)</h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                    {templates.length} шаблонов · {activeCount} активных
                </span>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.82rem', color: 'var(--slate-400)' }}>
                Каждый шаблон — это текст ответа, который агент НЕ должен давать.
                Активные шаблоны (scope «везде»/«глобально») автоматически
                добавляются в инструкции ассистента и чата перед ответом.
            </p>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    padding: '0.9rem',
                    borderRadius: 14,
                    border: '1px solid rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.04)',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Новый шаблон</div>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Название (например: «Не использовать слово “ок”»)"
                    aria-label="Название шаблона"
                    style={inputStyle}
                />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={2}
                    placeholder="Запрещённый текст ответа (агент не должен так отвечать)"
                    aria-label="Запрещённый текст"
                    style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                        value={scope}
                        onChange={(e) => setScope(e.target.value as ExceptionScope)}
                        aria-label="Где применяется"
                        style={selectStyle}
                    >
                        {SCOPES.map((s) => (
                            <option key={s} value={s}>
                                {scopeLabel[s]}
                            </option>
                        ))}
                    </select>
                    <select
                        value={matchMode}
                        onChange={(e) => setMatchMode(e.target.value as ExceptionMatchMode)}
                        aria-label="Способ сопоставления"
                        style={selectStyle}
                    >
                        {MATCH_MODES.map((m) => (
                            <option key={m} value={m}>
                                {matchLabel[m]}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim() || !text.trim()}
                        style={{
                            marginLeft: 'auto',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '0.45rem 0.9rem',
                            borderRadius: 8,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: !name.trim() || !text.trim() ? 'default' : 'pointer',
                            opacity: !name.trim() || !text.trim() ? 0.5 : 1,
                        }}
                    >
                        <Plus size={13} /> Добавить
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {templates.length === 0 ? (
                    <div
                        style={{
                            padding: '1.5rem',
                            textAlign: 'center',
                            color: 'var(--slate-500)',
                            fontSize: '0.85rem',
                            border: '1px dashed rgba(255,255,255,0.1)',
                            borderRadius: 12,
                        }}
                    >
                        Шаблонов пока нет — создайте первый выше.
                    </div>
                ) : (
                    templates.map((t) => (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '0.7rem 0.9rem',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.07)',
                                background: 'rgba(0,0,0,0.18)',
                                opacity: t.enabled ? 1 : 0.55,
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                                    {t.name}
                                    {!t.enabled && (
                                        <span style={{ marginLeft: 6, fontSize: '0.65rem', color: 'var(--slate-500)' }}>
                                            (выключена)
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--slate-300)', marginTop: 2 }}>
                                    {t.text}
                                </div>
                                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                                    <span style={badgeStyle}>{scopeLabel[t.scope]}</span>
                                    <span style={badgeStyle}>{matchLabel[t.matchMode]}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle(t.id)}
                                title={t.enabled ? 'Выключить' : 'Включить'}
                                aria-label={t.enabled ? 'Выключить' : 'Включить'}
                                style={iconBtnStyle}
                            >
                                {t.enabled ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="var(--slate-500)" />}
                            </button>
                            <button
                                onClick={() => handleDelete(t.id)}
                                title="Удалить"
                                aria-label="Удалить"
                                style={iconBtnStyle}
                            >
                                <Trash2 size={16} color="var(--slate-500)" />
                            </button>
                        </div>
                    ))
                )}
            </div>

        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: '0.8rem',
};

const selectStyle: React.CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: '0.75rem',
};

const badgeStyle: React.CSSProperties = {
    fontSize: '0.65rem',
    padding: '1px 6px',
    borderRadius: 6,
    background: 'rgba(239,68,68,0.12)',
    color: '#fca5a5',
    fontWeight: 600,
};

const iconBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    padding: 4,
    flexShrink: 0,
};

export default ExceptionsPanel;
