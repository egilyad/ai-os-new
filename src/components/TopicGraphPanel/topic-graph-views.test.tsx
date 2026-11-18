import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TopicGraphRadial from './TopicGraphRadial';
import TopicGraphTree from './TopicGraphTree';
import TopicGraphMatrix from './TopicGraphMatrix';
import type {
    TopicClaim,
    TopicConcept,
    TopicRelation,
    TopicSource,
} from '../../kernel/contracts/topic-graph/types';

const concept = (id: string, name: string, claimIds: string[]): TopicConcept => ({
    id,
    topicId: 't1',
    name,
    aliases: [],
    claimIds,
    createdAt: 1,
});

const claim = (
    id: string,
    text: string,
    sourceIds: string[],
    status: TopicClaim['status'] = 'extracted',
): TopicClaim => ({
    id,
    topicId: 't1',
    text,
    sourceIds,
    confidence: 0.9,
    status,
    createdAt: 1,
    updatedAt: 1,
});

const source = (
    id: string,
    title: string,
    kind: TopicSource['kind'] = 'document',
): TopicSource => ({
    id,
    topicId: 't1',
    kind,
    ref: `ref-${id}`,
    title,
    sha256: `sha-${id}`,
    content: 'content',
    importedAt: 1,
});

const concepts: TopicConcept[] = [
    concept('c1', 'Архитектура', ['a1', 'a2']),
    concept('c2', 'Тесты', ['b1']),
];

const claims: TopicClaim[] = [
    claim('a1', 'Система событийная', ['s1']),
    claim('a2', 'Хранилище Dexie', ['s2'], 'contradicted'),
    claim('b1', 'Тесты покрывают ядро', ['s1']),
];

const sources: TopicSource[] = [source('s1', 'ADR-001'), source('s2', 'ADR-003', 'research')];

const relations: TopicRelation[] = [
    {
        id: 'r1',
        topicId: 't1',
        fromId: 'a1',
        toId: 'a2',
        relation: 'contradicts',
        weight: 0.8,
        createdAt: 1,
    },
    {
        id: 'r2',
        topicId: 't1',
        fromId: 'a1',
        toId: 'b1',
        relation: 'supports',
        weight: 0.4,
        createdAt: 1,
    },
];

describe('TopicGraphRadial', () => {
    it('renders a sunburst svg with concept/claim/source segments', () => {
        const { container } = render(
            <TopicGraphRadial concepts={concepts} claims={claims} sources={sources} />,
        );
        expect(container.querySelector('svg')).not.toBeNull();
        expect(container.querySelectorAll('path').length).toBeGreaterThan(2);
        expect(container.textContent).toContain('Sunburst');
    });
});

describe('TopicGraphTree', () => {
    it('renders concepts with expandable claims and sources', () => {
        render(<TopicGraphTree concepts={concepts} claims={claims} sources={sources} />);
        expect(screen.getByText('Архитектура')).not.toBeNull();
        expect(screen.getByText('Тесты')).not.toBeNull();
        expect(screen.getByText('Система событийная')).not.toBeNull();
        expect(screen.getAllByText(/ADR-001/).length).toBeGreaterThan(0);
    });

    it('filters by query', () => {
        render(<TopicGraphTree concepts={concepts} claims={claims} sources={sources} />);
        const input = screen.getByPlaceholderText(/Поиск/);
        fireEvent.change(input, { target: { value: 'Dexie' } });
        expect(screen.getByText('Хранилище Dexie')).not.toBeNull();
        expect(screen.queryByText('Архитектура')).not.toBeNull();
        expect(screen.queryByText('Тесты')).toBeNull();
    });
});

describe('TopicGraphMatrix', () => {
    it('renders a heatmap with diagonal and conflict cells', () => {
        const { container } = render(
            <TopicGraphMatrix concepts={concepts} relations={relations} />,
        );
        expect(container.querySelector('svg')).not.toBeNull();
        const rects = container.querySelectorAll('rect');
        expect(rects.length).toBeGreaterThanOrEqual(4);
        expect(container.textContent).toContain('Концепт');
    });
});
