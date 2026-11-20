import type { TopicRelationType } from '../../kernel/contracts/topic-graph/types';

export interface RelationVisualStyle {
    color: string;
    dasharray?: string;
    label?: string;
}

/**
 * Визуальная семантика типов рёбер (Фаза 3): цвет и штриховка по типу,
 * чтобы поддерживающие/опровергающие/иерархические связи читались на графе.
 */
export const RELATION_STYLES: Record<TopicRelationType, RelationVisualStyle> = {
    supports: { color: '#34d399', label: 'поддерживает' },
    contradicts: { color: '#f87171', dasharray: '6 4', label: 'противоречит' },
    refines: { color: '#fbbf24', dasharray: '2 2', label: 'уточняет' },
    depends_on: { color: '#a78bfa', label: 'зависит от' },
    example_of: { color: '#38bdf8', label: 'пример' },
    same_as: { color: '#94a3b8', dasharray: '1 3', label: 'эквивалент' },
    cites: { color: '#f472b6', label: 'цитирует' },
    related_to: { color: '#64748b', label: 'связано' },
    part_of: { color: '#4ade80', dasharray: '8 2', label: 'часть' },
};

export function relationStyle(relation: TopicRelationType): RelationVisualStyle {
    return RELATION_STYLES[relation] ?? RELATION_STYLES.related_to;
}
