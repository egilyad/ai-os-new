import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Square, Volume2, VolumeX, Trash2, Loader2, ShieldCheck, BookOpen } from 'lucide-react';
import { useAssistantStore, type AssistantMessage } from '../../stores/assistant-store';
import { useKeyStore } from '../../stores/useKeyStore';
import { buildLensGuidance } from '../LensesPanel/lens-guidance';
import { loadActiveLensIds } from '../LensesPanel/lens-stack-store';
import { buildExceptionVeto } from '../ExceptionsPanel/exception-veto';
import {
    assistantNavigationService,
    capabilityTrustService,
} from '../../kernel/instances/services-core';
import { eventBus, EVENTS } from '../../kernel/instances';
import { ensureAssistantWiring } from './assistant-wiring';
import { useSpeech } from './use-speech';

type FaceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

interface TrustRow {
    id: string;
    trust: string;
    stale: boolean;
}

const AssistantFace: React.FC<{ state: FaceState }> = ({ state }) => (
    <div className={`assistant-face assistant-face--${state}`} aria-hidden="true">
        <span className="assistant-face__eye assistant-face__eye--left" />
        <span className="assistant-face__eye assistant-face__eye--right" />
        <span className="assistant-face__mouth" />
        <span className="assistant-face__ring" />
    </div>
);

const ActionChips: React.FC<{ actions: AssistantMessage['actions'] }> = ({ actions }) => {
    if (actions.length === 0) return null;
    return (
        <div className="assistant-actions">
            {actions.map((a) => (
                <span
                    key={`${a.action}-${a.status}`}
                    className={`assistant-action assistant-action--${a.status}`}
                    title={a.detail ?? a.action}
                >
                    {a.action}
                </span>
            ))}
        </div>
    );
};

const SUGGESTIONS = [
    'Где находится панель памяти и что её обслуживает?',
    'Сколько у меня ключей и все ли они живы?',
    'Кто сейчас в топологии агентов?',
    'Открой панель агентов',
];

const AssistantPanel: React.FC = () => {
    const navigate = useNavigate();
    const { messages, busy, error, send, clear } = useAssistantStore();
    const keyId = useAssistantStore((s) => s.keyId);
    const setKey = useAssistantStore((s) => s.setKey);
    const keys = useKeyStore((s) => s.keys);
    const [input, setInput] = useState('');
    const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
        try {
            return localStorage.getItem('assistant.autoSpeak') === '1';
        } catch {
            return false;
        }
    });
    const [trustRows, setTrustRows] = useState<TrustRow[]>([]);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const spokenRef = useRef<string>('');
    const submitRef = useRef<(text: string) => void>(() => {});

    useEffect(() => {
        try {
            localStorage.setItem('assistant.autoSpeak', autoSpeak ? '1' : '0');
        } catch {
            /* storage may be unavailable (private mode) */
        }
    }, [autoSpeak]);

    useEffect(() => {
        ensureAssistantWiring();
    }, []);

    // The trust ledger: what is verified, what is only documented.
    useEffect(() => {
        const read = () => {
            try {
                const rows = capabilityTrustService
                    .list()
                    .slice(0, 12)
                    .map((r) => ({ id: r.id, trust: r.trust, stale: r.stale }));
                setTrustRows(rows);
            } catch {
                setTrustRows([]);
            }
        };
        read();
        const unsub = eventBus.on(EVENTS.CAPABILITY_TRUST_CHANGED, read);
        return () => {
            unsub();
        };
    }, []);

    // The diary: what the assistant learned recently.
    const diaryRows = useAssistantStore((s) => s.diary);
    const self = useAssistantStore((s) => s.self);
    const refreshSelf = useAssistantStore((s) => s.refreshSelf);

    useEffect(() => {
        refreshSelf();
    }, [refreshSelf]);

    useEffect(() => {
        const unsub = eventBus.on(
            EVENTS.ASSISTANT_NAVIGATION,
            (payload?: { id?: string; route?: string }) => {
                if (!payload?.id || !payload.route) return;
                navigate(payload.route);
                assistantNavigationService.confirm(payload.id);
            },
        );
        return () => {
            unsub();
        };
    }, [navigate]);

    const speech = useSpeech({
        onFinalTranscript: (text) => submitRef.current(text),
    });
    const stopSpeaking = speech.stopSpeaking;

    const submit = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed) return;
            stopSpeaking();
            setInput('');
            const guidance = buildLensGuidance(loadActiveLensIds());
            const veto = buildExceptionVeto();
            const extra = [guidance, veto].filter(Boolean).join('\n\n');
            void send(extra ? `${trimmed}\n\n${extra}` : trimmed);
        },
        [send, stopSpeaking],
    );

    useEffect(() => {
        submitRef.current = submit;
    }, [submit]);

    const lastAssistant = useMemo(
        () => [...messages].reverse().find((m) => m.role === 'assistant' && !m.pending),
        [messages],
    );

    useEffect(() => {
        if (!autoSpeak || !lastAssistant || lastAssistant.id === spokenRef.current) return;
        spokenRef.current = lastAssistant.id;
        speech.speak(lastAssistant.content);
    }, [autoSpeak, lastAssistant, speech]);

    useEffect(() => {
        const node = scrollRef.current;
        if (node) node.scrollTop = node.scrollHeight;
    }, [messages]);

    const faceState: FaceState = speech.speaking
        ? 'speaking'
        : speech.listening
          ? 'listening'
          : busy
            ? 'thinking'
            : error
              ? 'error'
              : 'idle';

    return (
        <div className="assistant-panel">
            <div className="assistant-keybar">
                <span className="assistant-keybar__label">Ключ</span>
                <select
                    className="assistant-keybar__select"
                    value={keyId ?? ''}
                    onChange={(e) => setKey(e.target.value || null)}
                    disabled={busy}
                    aria-label="Ключ помощника"
                    title="Ключ, через который помощник отвечает"
                >
                    <option value="">Авто — первый активный</option>
                    {keys.map((k) => (
                        <option key={k.id} value={k.id}>
                            {k.label || k.id.slice(0, 8)} · {k.provider} ({k.status})
                        </option>
                    ))}
                </select>
            </div>
            <header className="assistant-head">
                <AssistantFace state={faceState} />
                <div className="assistant-head__text">
                    <h1>Помощник проекта</h1>
                    <p>
                        {faceState === 'listening'
                            ? 'Слушаю…'
                            : faceState === 'thinking'
                              ? 'Думаю и проверяю по коду…'
                              : faceState === 'speaking'
                                ? 'Отвечаю вслух'
                                : faceState === 'error'
                                  ? 'Не получилось — причина ниже'
                                  : 'Спросите про систему — отвечу по факту, а не по догадке'}
                    </p>
                    {self && (
                        <p
                            className="assistant-self"
                            title={`preset ${self.preset}${
                                self.denials > 0 ? `, ${self.denials} отказов подряд` : ''
                            }`}
                        >
                            агент <code>{self.id}</code> · {self.status} · {self.mode}
                        </p>
                    )}
                </div>
                <div className="assistant-head__controls">
                    <button
                        className={`assistant-icon-btn${speech.supported ? '' : ' is-disabled'}`}
                        onClick={speech.toggleListening}
                        disabled={!speech.supported}
                        aria-label={speech.listening ? 'Остановить запись' : 'Говорить'}
                        title={
                            speech.supported
                                ? 'Голосовой ввод (браузер)'
                                : 'Голосовой ввод не поддерживается'
                        }
                    >
                        {speech.listening ? <Mic size={18} /> : <MicOff size={18} />}
                    </button>
                    {speech.speaking && (
                        <button
                            className="assistant-icon-btn is-active"
                            onClick={speech.stopSpeaking}
                            aria-label="Остановить озвучку"
                            title="Остановить озвучку"
                        >
                            <Square size={16} />
                        </button>
                    )}
                    <button
                        className="assistant-icon-btn"
                        onClick={() => {
                            if (autoSpeak) {
                                speech.stopSpeaking();
                                setAutoSpeak(false);
                            } else {
                                setAutoSpeak(true);
                            }
                        }}
                        aria-label={autoSpeak ? 'Отключить озвучку' : 'Включить озвучку'}
                        title={autoSpeak ? 'Озвучка включена' : 'Озвучка выключена'}
                    >
                        {autoSpeak ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                    <button
                        className="assistant-icon-btn"
                        onClick={clear}
                        disabled={messages.length === 0}
                        aria-label="Очистить диалог"
                        title="Очистить диалог"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </header>

            <div className="assistant-thread" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="assistant-empty">
                        <p>Я знаю этот проект: панели, роуты, компоненты, тесты и статьи.</p>
                        <p>
                            Могу открыть панель, создать агента, проверить ключи, найти решение в
                            памяти. Изменения — только с вашего подтверждения.
                        </p>
                        <div className="assistant-suggestions">
                            {SUGGESTIONS.map((s) => (
                                <button key={s} onClick={() => submit(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((m) => (
                    <article
                        key={m.id}
                        className={`assistant-msg assistant-msg--${m.role}${
                            m.pending ? ' is-pending' : ''
                        }`}
                    >
                        {m.role === 'assistant' && <ActionChips actions={m.actions} />}
                        <div className="assistant-msg__body">
                            {m.content ||
                                (m.pending ? (
                                    <span className="assistant-typing">
                                        <Loader2 size={14} className="assistant-spin" />
                                        работаю…
                                    </span>
                                ) : null)}
                        </div>
                    </article>
                ))}
            </div>

            {error && <div className="assistant-error">Ошибка: {error}</div>}

            {diaryRows.length > 0 && (
                <div className="assistant-diary">
                    <BookOpen size={14} />
                    <span>Дневник:</span>
                    {diaryRows.map((d) => (
                        <span key={d.id} className="assistant-diary__entry" title={d.text}>
                            {d.kind}: {d.text.slice(0, 48)}
                            {d.text.length > 48 ? '…' : ''}
                        </span>
                    ))}
                </div>
            )}

            {trustRows.length > 0 && (
                <div className="assistant-trust">
                    <ShieldCheck size={14} />
                    <span>Возможности:</span>
                    {trustRows.map((r) => (
                        <span
                            key={r.id}
                            className={`assistant-trust__badge assistant-trust__badge--${r.trust}${
                                r.stale ? ' is-stale' : ''
                            }`}
                            title={r.id}
                        >
                            {r.id.replace(/^(action|panel):/, '')} · {r.trust}
                        </span>
                    ))}
                </div>
            )}

            <form
                className="assistant-input"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(input);
                }}
            >
                <input
                    value={speech.interim || input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                        speech.listening ? 'Говорите…' : 'Спросите про проект или попросите действие'
                    }
                    aria-label="Вопрос помощнику"
                    disabled={busy}
                />
                <button
                    type="submit"
                    className="assistant-send"
                    disabled={busy || !input.trim()}
                    aria-label="Отправить"
                >
                    {busy ? <Loader2 size={18} className="assistant-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
    );
};

export default AssistantPanel;
