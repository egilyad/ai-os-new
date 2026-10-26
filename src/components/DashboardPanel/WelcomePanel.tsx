import React from 'react';
import { Sparkles } from 'lucide-react';

interface WelcomePanelProps {
    onNavigate: (page: string) => void;
}

interface SectionCard {
    id: string;
    emoji: string;
    title: string;
    text: string;
}

interface CardGroup {
    label: string;
    cards: SectionCard[];
}

const GROUPS: CardGroup[] = [
    {
        label: 'Думать и обсуждать',
        cards: [
            {
                id: 'debate',
                emoji: '💬',
                title: 'Дебаты',
                text: 'Живой спор команды агентов — аргументы, противоречия и взвешенный вердикт.',
            },
            {
                id: 'argument-graph',
                emoji: '🕸️',
                title: 'Граф аргументов',
                text: 'Увидь, как аргументы связаны: кто что поддерживает, а кто опровергает.',
            },
        ],
    },
    {
        label: 'Твоя команда',
        cards: [
            {
                id: 'agents',
                emoji: '🤖',
                title: 'Агенты',
                text: 'ИИ-работники: профили, роли и навыки. Создай и отправь на задачу.',
            },
            {
                id: 'roles',
                emoji: '🎭',
                title: 'Роли',
                text: 'Права и профили поведения — распредели, кто что может в системе.',
            },
        ],
    },
    {
        label: 'Знания и исследования',
        cards: [
            {
                id: 'knowledge',
                emoji: '📚',
                title: 'База знаний',
                text: 'Собирай источники и превращай их в базу — поиск по смыслу.',
            },
            {
                id: 'memory',
                emoji: '🧠',
                title: 'Память',
                text: 'Что система запомнила о тебе и задачах — загляни сюда.',
            },
            {
                id: 'knowledge-generator',
                emoji: '✨',
                title: 'Генератор знаний',
                text: 'Из мыслей и источников — готовые статьи и конспекты.',
            },
            {
                id: 'hypothesis-gen',
                emoji: '🔬',
                title: 'Исследование',
                text: 'Проверь идею: система поможет сгенерировать гипотезы и план.',
            },
        ],
    },
    {
        label: 'Общение',
        cards: [
            {
                id: 'chat',
                emoji: '💭',
                title: 'Чат с ИИ',
                text: 'Просто спроси ассистента — идея, вопрос, черновик.',
            },
            {
                id: 'assistant',
                emoji: '🧑‍💼',
                title: 'Ассистент',
                text: 'Личный помощник: ведёт диалог и помогает по всей системе.',
            },
        ],
    },
    {
        label: 'Система',
        cards: [
            {
                id: 'routing',
                emoji: '🔀',
                title: 'Маршрутизация',
                text: 'Какие ИИ-модели подключены и как выбирается лучшая.',
            },
            {
                id: 'wiki-brain',
                emoji: '📖',
                title: 'Wiki Brain',
                text: 'Внутренняя база знаний о самой системе — руководства и принципы.',
            },
            {
                id: 'time-machine',
                emoji: '⏪',
                title: 'Time Machine',
                text: 'Откат и просмотр прошлых состояний системы.',
            },
        ],
    },
];

const QUICK_ACTIONS: Array<{ id: string; emoji: string; label: string }> = [
    { id: 'debate', emoji: '🧑‍⚖️', label: 'Новый дебат' },
    { id: 'agents', emoji: '🤖', label: 'Новый агент' },
    { id: 'knowledge', emoji: '🔍', label: 'Новое исследование' },
];

const WelcomePanel: React.FC<WelcomePanelProps> = ({ onNavigate }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div
                style={{
                    padding: '1.75rem',
                    borderRadius: 18,
                    border: '1px solid rgba(139,92,246,0.25)',
                    background:
                        'linear-gradient(135deg, rgba(139,92,246,0.14), rgba(59,130,246,0.08))',
                }}
            >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div
                        style={{
                            fontSize: '2rem',
                            flexShrink: 0,
                            width: 56,
                            height: 56,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                        }}
                    >
                        <Sparkles size={28} color="white" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                                marginBottom: '0.4rem',
                            }}
                        >
                            Привет! 👋 Это твоя система ИИ.
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-300)', lineHeight: 1.6 }}>
                            Здесь можно всё: спросить совет, провести дебат, собрать исследование и
                            запомнить важное. Ниже — главные разделы, с которых удобно начать. ✨
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                    ⚡ Быстрые действия
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {QUICK_ACTIONS.map((a) => (
                        <button
                            key={a.id}
                            onClick={() => onNavigate(a.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '0.7rem 1.1rem',
                                borderRadius: 12,
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.12)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--slate-200)',
                                fontWeight: 700,
                                fontSize: '0.88rem',
                            }}
                        >
                            <span style={{ fontSize: '1.1rem' }}>{a.emoji}</span> {a.label}
                        </button>
                    ))}
                </div>
            </div>

            {GROUPS.map((g) => (
                <div key={g.label}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '0.6rem' }}>
                        {g.label}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                        {g.cards.map((s) => (
                            <div
                                key={s.id}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem',
                                    padding: '1.25rem',
                                    borderRadius: 16,
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(0,0,0,0.2))',
                                }}
                            >
                                <div style={{ fontSize: '1.6rem' }}>{s.emoji}</div>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                                    {s.title}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', lineHeight: 1.5, flex: 1 }}>
                                    {s.text}
                                </div>
                                <button
                                    onClick={() => onNavigate(s.id)}
                                    style={{
                                        marginTop: '0.35rem',
                                        padding: '0.55rem 0.9rem',
                                        borderRadius: 10,
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: 700,
                                        color: 'white',
                                        background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
                                        textAlign: 'left',
                                    }}
                                >
                                    Открыть →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default WelcomePanel;
