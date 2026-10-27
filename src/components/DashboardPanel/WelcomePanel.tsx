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
            {
                id: 'forum',
                emoji: '🗣️',
                title: 'Форум агентов',
                text: 'Открытое обсуждение — много агентов обмениваются мнениями по теме.',
            },
            {
                id: 'synthesis',
                emoji: '⚗️',
                title: 'Синтезатор',
                text: 'Собери разрозненные результаты в единый цельный вывод.',
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
            {
                id: 'fleet',
                emoji: '🛰️',
                title: 'Флот',
                text: 'Обзор всех команд, совещаний и графов — кто чем занят.',
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
        label: '🧭 Конвейер знаний — 5 шагов (с происхождением)',
        cards: [
            {
                id: 'knowledge',
                emoji: '📚',
                title: '1. База знаний',
                text: 'Найди существующие знания по теме: смысловой поиск по источникам и памяти. Это стартовая точка.',
            },
            {
                id: 'crystals',
                emoji: '💎',
                title: '2. Кристаллы',
                text: 'Зафиксируй проверенные утверждения: предложи, кристаллизуй, замени или опровергни. Сохраняются доказательства и допущения.',
            },
            {
                id: 'junctions',
                emoji: '🕸️',
                title: '3. Junction',
                text: 'Обнаружь связи между источниками (кристаллы + дебаты): детекция пересечений и проверка контраргументами.',
            },
            {
                id: 'synthesis',
                emoji: '⚗️',
                title: '4. Синтез',
                text: 'Собери мультиперспективный вывод: вопрос × роли × линзы, зоны согласия, экспорт в кристалл или форум.',
            },
            {
                id: 'knowledge-generator',
                emoji: '✨',
                title: '5. Генератор знаний',
                text: 'Проведи автономный цикл: гипотеза → доказательства → ревью → новые знания. Следи за происхождением каждого результата.',
            },
        ],
    },
    {
        label: '🧪 Исследования (7)',
        cards: [
            {
                id: 'research-engine',
                emoji: '🔎',
                title: 'Research Engine',
                text: 'Базовый цикл исследования: вопрос → источники → запуск цикла анализа.',
            },
            {
                id: 'research-advanced',
                emoji: '🧬',
                title: 'Research: Advanced',
                text: 'Продвинутый движок для глубоких, тонких исследований.',
            },
            {
                id: 'debate-system-research',
                emoji: '🥊',
                title: 'Debate System Research',
                text: 'Эксперименты над самими дебатами: стратегии, A/B, стресс-тесты.',
            },
            {
                id: 'research-reports',
                emoji: '📑',
                title: 'Research Reports',
                text: 'Оформи результаты сессий в читаемые отчёты.',
            },
            {
                id: 'hypothesis-gen',
                emoji: '💡',
                title: 'Hypothesis Generator',
                text: 'Сформулируй гипотезу и проверь её авто-дебатом.',
            },
            {
                id: 'rival-labs',
                emoji: '⚔️',
                title: 'Rival Labs',
                text: 'A/B-сравнение альтернативных parity-сервисов по фазам.',
            },
            {
                id: 'rivals-catalog',
                emoji: '🗂️',
                title: 'Rivals Projects',
                text: 'Каталог всех rivals-проектов и сервисов — справка и навигация.',
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
        label: 'Работа и творчество',
        cards: [
            {
                id: 'tasks',
                emoji: '✅',
                title: 'Задачи',
                text: 'Планируй и выполняй многошаговые задачи с агентами.',
            },
            {
                id: 'projects',
                emoji: '📁',
                title: 'Проекты',
                text: 'Организуй работу по проектам и связывай её с агентами.',
            },
            {
                id: 'simulation',
                emoji: '🌍',
                title: 'Симуляция',
                text: 'Смоделируй мир с агентами и посмотри, как система поведёт себя.',
            },
            {
                id: 'builder',
                emoji: '🧱',
                title: 'Построитель',
                text: 'Собери когнитивные конвейеры и графы из готовых блоков.',
            },
        ],
    },
    {
        label: '🧩 Графы (интерактивные)',
        cards: [
            {
                id: 'memory-center',
                emoji: '🧠',
                title: 'Memory Center',
                text: 'Карта всей памяти системы: категории, источники, записей — интерактивный граф.',
            },
            {
                id: 'knowledge',
                emoji: '🕸️',
                title: 'Граф знаний',
                text: 'Связи между воспоминаниями и сущностями — зум, панорамирование, клик.',
            },
            {
                id: 'architecture-map',
                emoji: '🏗️',
                title: 'Архитектура',
                text: 'Зависимости сервисов из живого DI-контейнера — граф системы.',
            },
            {
                id: 'dependency-map',
                emoji: '🔗',
                title: 'Зависимости',
                text: 'Граф зависимостей сервисов с impact-анализом при клике.',
            },
            {
                id: 'argument-graph',
                emoji: '⚔️',
                title: 'Аргументы дебатов',
                text: 'Граф аргументов: supports/challenges/refines/contradiction, клик по узлу.',
            },
            {
                id: 'junctions',
                emoji: '🌉',
                title: 'Junction',
                text: 'Граф пересечений между источниками знаний (кристаллы + дебаты).',
            },
            {
                id: 'debugger',
                emoji: '📈',
                title: 'Трассы (DecisionGraph)',
                text: 'Когнитивные шаги — DAG с типами маршрутов и кликом по узлу.',
            },
            {
                id: 'nav-graph',
                emoji: '🧭',
                title: 'Граф навигации',
                text: 'Карта всех разделов и панелей системы — клик ведёт в панель.',
            },
            {
                id: 'graph-workbench',
                emoji: '🧰',
                title: 'Graph Workbench',
                text: 'Линзы: Routing (почему выбрана модель), Cost (куда уходят деньги), Tasks (зависимости задач).',
            },
        ],
    },
    {
        label: 'Управление и безопасность',
        cards: [
            {
                id: 'governance',
                emoji: '🛡️',
                title: 'Права и роли',
                text: 'Кто что может в системе — роли, гранты и правила.',
            },
            {
                id: 'keys',
                emoji: '🔑',
                title: 'Провайдеры и ключи',
                text: 'Подключи ИИ-модели: ключи, статус и лимиты.',
            },
            {
                id: 'analytics',
                emoji: '📊',
                title: 'Аналитика',
                text: 'Метрики использования: запросы, токены, стоимость.',
            },
            {
                id: 'audit',
                emoji: '🧾',
                title: 'Аудит',
                text: 'Журнал действий системы — кто и что делал.',
            },
        ],
    },
    {
        label: 'Разработка и интеграции',
        cards: [
            {
                id: 'workflows',
                emoji: '🔁',
                title: 'Рабочие процессы',
                text: 'Строй автоматические потоки из шагов и агентов.',
            },
            {
                id: 'prompts',
                emoji: '📝',
                title: 'Промпты',
                text: 'Библиотека готовых промптов — переиспользуй и редактируй.',
            },
            {
                id: 'mcp',
                emoji: '🔌',
                title: 'Инструменты и MCP',
                text: 'Подключай внешние инструменты и серверы MCP.',
            },
            {
                id: 'files',
                emoji: '🗂️',
                title: 'Файлы',
                text: 'Рабочее пространство: файлы и документы рядом с агентами.',
            },
        ],
    },
];

const QUICK_ACTIONS: Array<{ id: string; emoji: string; label: string }> = [
    { id: 'debate', emoji: '🧑‍⚖️', label: 'Новый дебат' },
    { id: 'agents', emoji: '🤖', label: 'Новый агент' },
    { id: 'knowledge', emoji: '🔍', label: 'Новое исследование' },
    { id: 'knowledge', emoji: '🧭', label: 'Провести тему через конвейер' },
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

            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 14,
                    border: '1px solid rgba(34,197,94,0.2)',
                    background: 'rgba(34,197,94,0.06)',
                }}
            >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '0.5rem' }}>
                    🧭 Как провести тему через конвейер знаний
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', lineHeight: 1.7 }}>
                    1. <b>База знаний</b> — найди существующие знания по теме. · 2. <b>Кристаллы</b> —
                    зафиксируй проверенные утверждения. · 3. <b>Junction</b> — обнаружь связи между
                    источниками. · 4. <b>Синтез</b> — собери мультиперспективный вывод. · 5.{' '}
                    <b>Генератор знаний</b> — проведи автономный цикл и получи новые знания.
                </div>
            </div>

            <div
                style={{
                    padding: '1rem 1.25rem',
                    borderRadius: 14,
                    border: '1px solid rgba(59,130,246,0.2)',
                    background: 'rgba(59,130,246,0.06)',
                }}
            >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-200)', marginBottom: '0.5rem' }}>
                    🔀 Режимы работы — выбери под вопрос
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--slate-400)', lineHeight: 1.7 }}>
                    <b>Понять тему</b> → конвейер знаний (5 шагов выше). · <b>Изучить новое</b> →{' '}
                    Research Engine + Hypothesis Generator + Reports. · <b>Система странно ведёт себя</b>{' '}
                    → аудиты (классы дефектов).
                </div>
                <button
                    onClick={() => onNavigate('wiki')}
                    style={{
                        marginTop: '0.6rem',
                        padding: '0.5rem 0.95rem',
                        borderRadius: 10,
                        border: '1px solid rgba(59,130,246,0.3)',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--slate-100)',
                        background: 'rgba(59,130,246,0.15)',
                    }}
                >
                    📖 Открыть шпаргалку (вики)
                </button>
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
