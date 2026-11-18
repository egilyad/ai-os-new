import { useMemo, useState } from 'react';
import type {
    TopicClaim,
    TopicConcept,
    TopicSource,
} from '../../kernel/contracts/topic-graph/types';

type TopicGraphTreeProps = {
    concepts: TopicConcept[];
    claims: TopicClaim[];
    sources: TopicSource[];
    height?: number;
};

const CONCEPT_COLOR = '#2dd4bf';
const SOURCE_COLOR = '#64748b';
const CONTRADICTED_COLOR = '#f87171';

type TreeClaim = {
    claim: TopicClaim;
    sources: TopicSource[];
};

type TreeConcept = {
    concept: TopicConcept;
    claims: TreeClaim[];
};

function matches(text: string, q: string): boolean {
    if (!q) return true;
    return text.toLowerCase().includes(q.toLowerCase());
}

export default function TopicGraphTree(props: TopicGraphTreeProps) {
    const { concepts, claims, sources, height = 560 } = props;
    const [query, setQuery] = useState('');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const tree = useMemo<TreeConcept[]>(() => {
        return concepts.slice(0, 30).map((concept) => {
            const claimList = claims
                .filter((c) => concept.claimIds.includes(c.id))
                .filter((c) => !query || matches(c.text, query))
                .map((claim) => ({
                    claim,
                    sources: claim.sourceIds
                        .map((sid) => sources.find((s) => s.id === sid))
                        .filter((s): s is TopicSource => Boolean(s))
                        .filter((s) => !query || matches(s.title, query)),
                }));
            return { concept, claims: claimList };
        });
    }, [concepts, claims, sources, query]);

    const toggle = (id: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const visible = tree.filter(
        (t) =>
            matches(t.concept.name, query) ||
            t.claims.some(
                (c) =>
                    matches(c.claim.text, query) || c.sources.some((s) => matches(s.title, query)),
            ),
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                height,
                background: 'var(--bg-elevated)',
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: 10,
            }}
        >
            <input
                placeholder="Поиск по концептам, утверждениям, источникам…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    color: 'var(--slate-200)',
                    fontSize: 12,
                }}
            />
            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >
                {visible.map((t) => {
                    const conceptId = t.concept.id;
                    const isOpen = !collapsed.has(conceptId);
                    const hasClaims = t.claims.length > 0;
                    return (
                        <div key={conceptId} style={{ display: 'flex', flexDirection: 'column' }}>
                            <button
                                onClick={() => hasClaims && toggle(conceptId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 8px',
                                    border: 'none',
                                    borderRadius: 8,
                                    background: 'rgba(45,212,191,0.08)',
                                    color: CONCEPT_COLOR,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: hasClaims ? 'pointer' : 'default',
                                    textAlign: 'left',
                                }}
                            >
                                <span
                                    style={{
                                        width: 14,
                                        display: 'inline-block',
                                        color: 'var(--slate-500)',
                                    }}
                                >
                                    {hasClaims ? (isOpen ? '▾' : '▸') : '·'}
                                </span>
                                {t.concept.name}
                                <span
                                    style={{
                                        color: 'var(--slate-500)',
                                        fontWeight: 500,
                                        fontSize: 11,
                                    }}
                                >
                                    {t.concept.claimIds.length} утв.
                                </span>
                            </button>
                            {isOpen && (
                                <div
                                    style={{
                                        marginLeft: 20,
                                        borderLeft: '1px solid var(--border)',
                                        paddingLeft: 10,
                                    }}
                                >
                                    {t.claims.map(({ claim, sources: claimSources }) => {
                                        const isContradicted = claim.status === 'contradicted';
                                        return (
                                            <div
                                                key={claim.id}
                                                style={{ display: 'flex', flexDirection: 'column' }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'flex-start',
                                                        gap: 6,
                                                        padding: '5px 8px',
                                                        borderRadius: 6,
                                                        fontSize: 12,
                                                        color: isContradicted
                                                            ? CONTRADICTED_COLOR
                                                            : 'var(--slate-200)',
                                                        background: isContradicted
                                                            ? 'rgba(248,113,113,0.08)'
                                                            : 'rgba(59,130,246,0.07)',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            width: 14,
                                                            display: 'inline-block',
                                                            color: 'var(--slate-600)',
                                                        }}
                                                    >
                                                        ▸
                                                    </span>
                                                    <span>{claim.text}</span>
                                                    <span
                                                        style={{
                                                            marginLeft: 'auto',
                                                            color: 'var(--slate-500)',
                                                            fontSize: 11,
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        conf {claim.confidence.toFixed(2)} ·{' '}
                                                        {claim.status}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        marginLeft: 16,
                                                        borderLeft: '1px solid var(--border)',
                                                        paddingLeft: 10,
                                                    }}
                                                >
                                                    {claimSources.map((s) => (
                                                        <div
                                                            key={s.id}
                                                            style={{
                                                                padding: '3px 8px',
                                                                fontSize: 11,
                                                                color: 'var(--slate-400)',
                                                                display: 'flex',
                                                                gap: 6,
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    color: 'var(--slate-600)',
                                                                }}
                                                            >
                                                                ▸
                                                            </span>
                                                            <span style={{ color: SOURCE_COLOR }}>
                                                                [{s.kind}]
                                                            </span>
                                                            <span>{s.title}</span>
                                                        </div>
                                                    ))}
                                                    {claimSources.length === 0 && (
                                                        <div
                                                            style={{
                                                                padding: '2px 8px',
                                                                fontSize: 11,
                                                                color: 'var(--slate-600)',
                                                            }}
                                                        >
                                                            без источников
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {hasClaims && t.claims.length === 0 && (
                                        <div
                                            style={{
                                                padding: '3px 8px',
                                                fontSize: 11,
                                                color: 'var(--slate-600)',
                                            }}
                                        >
                                            нет совпадений
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {visible.length === 0 && (
                    <div style={{ padding: 12, fontSize: 12, color: 'var(--slate-500)' }}>
                        Ничего не найдено
                    </div>
                )}
            </div>
        </div>
    );
}
