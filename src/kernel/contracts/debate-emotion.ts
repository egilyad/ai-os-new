export type DebateEmotion =
    | 'joy'
    | 'anger'
    | 'sadness'
    | 'surprise'
    | 'fear'
    | 'disgust'
    | 'confidence'
    | 'doubt'
    | 'curiosity'
    | 'triumph'
    | 'defeat'
    | 'neutral';

export const DEBATE_EMOTION_COLORS: Record<DebateEmotion, string> = {
    joy: '#fbbf24',
    anger: '#ef4444',
    sadness: '#3b82f6',
    surprise: '#a855f7',
    fear: '#6b7280',
    disgust: '#22c55e',
    confidence: '#3b82f6',
    doubt: '#f97316',
    curiosity: '#06b6d4',
    triumph: '#fbbf24',
    defeat: '#6b7280',
    neutral: '#e2e8f0',
};

export const DEBATE_EMOTION_LABELS: Record<DebateEmotion, string> = {
    joy: 'Joy',
    anger: 'Anger',
    sadness: 'Sadness',
    surprise: 'Surprise',
    fear: 'Fear',
    disgust: 'Disgust',
    confidence: 'Confidence',
    doubt: 'Doubt',
    curiosity: 'Curiosity',
    triumph: 'Triumph',
    defeat: 'Defeat',
    neutral: 'Neutral',
};

export type ArenaLayout =
    | 'circle'
    | 'proscenium'
    | 'colosseum'
    | 'parliament'
    | 'round-table'
    | 'lecture'
    | 'ring'
    | 'triangle'
    | 'tree'
    | 'freeform';

export interface ArenaLayoutConfig {
    id: ArenaLayout;
    label: string;
    labelRu: string;
    icon: string;
    description: string;
}

export const ARENA_LAYOUTS: ArenaLayoutConfig[] = [
    {
        id: 'circle',
        label: 'Circle',
        labelRu: 'Круг',
        icon: '⭕',
        description: 'Classic circle — equal footing',
    },
    {
        id: 'proscenium',
        label: 'Proscenium',
        labelRu: 'Сцена',
        icon: '🎭',
        description: 'Theatrical stage for presentations',
    },
    {
        id: 'colosseum',
        label: 'Colosseum',
        labelRu: 'Колизей',
        icon: '🏟️',
        description: 'Roman amphitheater for tournaments',
    },
    {
        id: 'parliament',
        label: 'Parliament',
        labelRu: 'Парламент',
        icon: '🏛️',
        description: 'British parliament for policy debates',
    },
    {
        id: 'round-table',
        label: 'Round Table',
        labelRu: 'Круглый стол',
        icon: '🪑',
        description: 'King Arthur style for consensus',
    },
    {
        id: 'lecture',
        label: 'Lecture',
        labelRu: 'Лекция',
        icon: '📚',
        description: 'Auditorium for learning',
    },
    {
        id: 'ring',
        label: 'Ring',
        labelRu: 'Ринг',
        icon: '🥊',
        description: 'Boxing ring for 1v1 debates',
    },
    {
        id: 'triangle',
        label: 'Triangle',
        labelRu: 'Треугольник',
        icon: '🔺',
        description: 'Triad for 3-participant debates',
    },
    {
        id: 'tree',
        label: 'Tree',
        labelRu: 'Дерево',
        icon: '🌳',
        description: 'Hierarchical tree for argument branching',
    },
    {
        id: 'freeform',
        label: 'Freeform',
        labelRu: 'Свободная',
        icon: '✨',
        description: 'User-placed custom arrangement',
    },
];
