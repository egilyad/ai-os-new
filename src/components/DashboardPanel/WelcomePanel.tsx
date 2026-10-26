import React from 'react';
import {
    Bot,
    BookOpen,
    Brain,
    FlaskConical,
    MessageCircle,
    Sparkles,
    Users,
} from 'lucide-react';

interface WelcomePanelProps {
    onNavigate: (page: string) => void;
}

interface SectionCard {
    id: string;
    emoji: string;
    title: string;
    text: string;
    cta: string;
}

const SECTIONS: SectionCard[] = [
    {
        id: 'debate',
        emoji: '💬',
        title: 'Дебаты',
        text: 'Pобери команду агентов и проведи живой спор — система соберёт аргументы, найдёт противоречия и вынесет взвешенный вердикт.',
        cta: 'Открыть дебаты',
    },
    {
        id: 'agents',
        emoji: '🤖',
        title: 'Агенты',
        text: 'Твои ИИ-работники: создавай профили, давай роли и навыки, отправляй их на задачи — от анализа до творчества.',
        cta: 'К агентам',
    },
    {
        id: 'knowledge',
        emoji: '📚',
        title: 'Знания и RAG',
        text: 'Собирай источники и превращай их в базу знаний — система найдёт нужное по смыслу и поможет на его основе сделать выводы.',
        cta: 'База знаний',
    },
    {
        id: 'memory',
        emoji: '🧠',
        title: 'Память',
        text: 'Система помнит важное. Загляни сюда, чтобы понять, что она запомнила о тебе и твоих задачах.',
        cta: 'Открыть память',
    },
    {
        id: 'chat',
        emoji: '💭',
        title: 'Чат с ИИ',
        text: 'Просто поговори с ассистентом — начни с вопроса, идеи или черновика. Умный помощник всегда рядом.',
        cta: 'Начать чат',
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
            {/* Приветствие + о системе */}
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
                            Здесь можно всё: спросить совет, провести живой дебат, собрать исследование
                            и запомнить важное. Ниже — главные разделы, с которых удобно начать.
                            Выбери то, что больше всего нужно прямо сейчас. ✨
                        </div>
                    </div>
                </div>
            </div>

            {/* Быстрые действия */}
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

            {/* Главные разделы */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                {SECTIONS.map((s) => (
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
                            {s.cta} →
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WelcomePanel;
