import React from 'react';
import { tokens } from '../../styles/tokens';
import type { WikiEventLine, WikiStats } from './use-wiki-brain';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 6,
};

const card: React.CSSProperties = {
    background: tokens.surface,
    border: `1px solid ${tokens.borderSubtle}`,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
};

const F_STATUSES: Array<{ id: string; title: string; status: string }> = [
    { id: 'F0', title: 'KnowledgeUnit + связи', status: 'done' },
    { id: 'F1', title: 'Реальный BM25 + эмбеддинги', status: 'done' },
    { id: 'F2', title: 'SoMem Core / derived views', status: 'done' },
    { id: 'F3', title: 'Единый провенанс-граф', status: 'done' },
    { id: 'F4', title: 'События wiki:*', status: 'done' },
    { id: 'F5', title: 'Research-loop (closed-loop)', status: 'done' },
    { id: 'F6', title: 'Knowledge Potential Graph', status: 'done' },
    { id: 'F7', title: 'QC: противоречия/decay/lint', status: 'done' },
    { id: 'F8', title: 'MCP-экспонирование', status: 'done' },
    { id: 'F5b', title: 'Literature fetcher (arXiv/Perplexity)', status: 'done' },
];

export default function BrainAbout({
    stats,
    events,
}: {
    stats: WikiStats | null;
    events: WikiEventLine[];
}) {
    return (
        <div>
            <div style={card}>
                <div style={label}>О Wiki-Brain</div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: tokens.slate[200] }}>
                    <p style={{ margin: '0 0 8px' }}>
                        Wiki-Brain — локальная база знаний «второго мозга» системы: страницы, источники,
                        claim-level юниты, поиск (BM25 + эмбеддинги), граф знаний, ревью и lint.
                        Это единый слой, от которого питаются ассистент, OpenCode, проекты и внешние агенты.
                    </p>
                    <p style={{ margin: 0 }}>
                        Синхронизации: страницы ↔ <code>docs/wiki/</code> (генераторы <code>gen:wiki-*</code>),
                        файлы vault-источников ↔ Obsidian (vault sync), события <code>wiki:*</code> ↔ Universal Graph
                        (проекции и провенанс).
                    </p>
                </div>
            </div>

            <div style={card}>
                <div style={label}>Статус роадмапа</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {F_STATUSES.map((f) => (
                        <span
                            key={f.id}
                            title={f.title}
                            style={{
                                fontSize: 12,
                                padding: '4px 10px',
                                borderRadius: 999,
                                background: 'rgba(61,220,151,0.12)',
                                color: '#3ddc97',
                                border: '1px solid rgba(61,220,151,0.3)',
                            }}
                        >
                            {f.id} ✓
                        </span>
                    ))}
                </div>
                <div style={{ fontSize: 12, color: tokens.slate[400], marginTop: 8 }}>
                    Все этапы F0–F8 закрыты; подробности — [[dev-wiki-brain-progress]].
                </div>
            </div>

            <div style={card}>
                <div style={label}>Сводка</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                    {[
                        { k: 'Страницы', v: stats?.pages ?? '—' },
                        { k: 'Источники', v: stats?.sources ?? '—' },
                        { k: 'Очередь (pending)', v: stats?.pending ?? '—' },
                        { k: 'Lint-проблемы', v: stats?.issues ?? '—' },
                        { k: 'Юниты', v: stats?.units ?? '—' },
                    ].map((it) => (
                        <div key={it.k} style={{ background: tokens.surface, border: `1px solid ${tokens.borderSubtle}`, borderRadius: 8, padding: '10px 12px' }}>
                            <div style={{ fontSize: 22, fontWeight: 700, color: tokens.slate[200] }}>{it.v}</div>
                            <div style={{ fontSize: 12, color: tokens.slate[500] }}>{it.k}</div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={card}>
                <div style={label}>Последние события</div>
                {events.length === 0 ? (
                    <div style={{ color: tokens.slate[500], fontSize: 13 }}>
                        Событий пока нет
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {events.map((e) => (
                            <li
                                key={e.id}
                                style={{
                                    fontSize: 12,
                                    color: tokens.slate[400],
                                    padding: '6px 0',
                                    borderBottom: `1px solid ${tokens.borderSubtle}`,
                                }}
                            >
                                <span style={{ color: tokens.slate[300], fontWeight: 600 }}>{e.event}</span>
                                <span style={{ color: tokens.slate[500] }}>
                                    {' '}· {new Date(e.ts).toLocaleTimeString()}
                                </span>
                                <div style={{ color: tokens.slate[500], fontSize: 11 }}>{e.preview}</div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
