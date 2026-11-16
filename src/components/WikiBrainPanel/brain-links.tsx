import React from 'react';
import { tokens } from '../../styles/tokens';

const label: React.CSSProperties = {
    fontSize: 12,
    color: tokens.slate[500],
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: 8,
};

interface LinkRow {
    from: string;
    to: string;
    mechanism: string;
    where: string;
}

const LINKS: LinkRow[] = [
    { from: 'Wiki-Brain', to: 'Assistant', mechanism: 'buildContext: core + search + neighbors; wiki.research', where: 'assistant-service, phase78' },
    { from: 'Wiki-Brain', to: 'OpenCode', mechanism: 'корпус WIKI_ARTICLES ↔ docs/wiki (gen:wiki-*)', where: 'WikiPanel, scripts/gen-*' },
    { from: 'Wiki-Brain', to: 'OpenCode (внеш.)', mechanism: 'MCP-сервер: search / read_page / graph_query / addKnowledgeUnit', where: 'WikiBrainMcpServer' },
    { from: 'Wiki-Brain', to: 'Universal Graph', mechanism: 'события wiki:* → проекции + провенанс', where: 'ProjectGraphProjection, UnifiedProvenanceBridge' },
    { from: 'Wiki-Brain', to: 'Obsidian', mechanism: 'vault sync: import/export, autosync', where: 'WikiVaultSyncService' },
    { from: 'Wiki-Brain', to: 'Projects/Tasks', mechanism: 'projectId в страницах/юнитах', where: 'TWikiPage, KnowledgeUnit' },
    { from: 'Wiki-Brain', to: 'Research', mechanism: 'F5 closed-loop + F5b literature fetcher', where: 'WikiResearchService, LiteratureFetcherService' },
];

export default function BrainLinks() {
    return (
        <div>
            <div style={label}>Карта связей</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LINKS.map((row, i) => (
                    <div
                        key={i}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                            background: tokens.surface,
                            border: `1px solid ${tokens.borderSubtle}`,
                            borderRadius: 10,
                            padding: '10px 12px',
                        }}
                    >
                        <span style={{ fontWeight: 700, color: tokens.slate[200], fontSize: 13 }}>{row.from}</span>
                        <span style={{ color: tokens.slate[500] }}>→</span>
                        <span style={{ fontWeight: 700, color: '#7aa2ff', fontSize: 13 }}>{row.to}</span>
                        <span style={{ flex: 1, fontSize: 12, color: tokens.slate[400] }}>{row.mechanism}</span>
                        <span style={{ fontSize: 11, color: tokens.slate[600] }}>{row.where}</span>
                    </div>
                ))}
            </div>

            <div style={{ ...label, marginTop: 20 }}>Синхронизации</div>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: tokens.slate[300] }}>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                    <li>docs/wiki ↔ корпус приложения (генераторы gen:wiki-*; CI проверяет синхронизацию).</li>
                    <li>Dexie (aios-wiki-brain) ↔ Obsidian vault (import/export + автоперечитывание).</li>
                    <li>События wiki:* → Universal Graph (узел knowledge + contains-ребро) и провенанс.</li>
                    <li>Юниты и страницы несут projectId — проектная скоупность.</li>
                </ul>
            </div>
        </div>
    );
}
