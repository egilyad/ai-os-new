// Generator: creates one real panel component per debate-quality technique
// that does not yet have a route/panel wired. Run: node scripts/gen-technique-panels.mjs
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const root = resolve(dirname(__filename), '..');

// ---------- parse catalog ----------
const catalogPath = resolve(root, 'src/kernel/contracts/debate-quality-settings.ts');
const src = readFileSync(catalogPath, 'utf8');

function parseQuoted(s, qIndex) {
    const q = s[qIndex];
    let i = qIndex + 1;
    let out = '';
    while (i < s.length) {
        const c = s[i];
        if (c === '\\') { out += s[i + 1]; i += 2; continue; }
        if (c === q) break;
        out += c; i++;
    }
    return { value: out, end: i + 1 };
}

function grab(s, key, from) {
    const idx = s.indexOf(key, from);
    if (idx === -1) return { value: '', end: from };
    const qIndex = idx + key.length - 1;
    return parseQuoted(s, qIndex);
}

const techniques = [];
let pos = 0;
const idMarker = "id: '";
while ((pos = src.indexOf(idMarker, pos)) !== -1) {
    const qIndex = pos + idMarker.length - 1;
    const idRes = parseQuoted(src, qIndex);
    const id = idRes.value;
    const nameRes = grab(src, "name: '", idRes.end);
    const nameRuRes = grab(src, "nameRu: '", nameRes.end);
    const descRes = grab(src, "description: '", nameRuRes.end);
    const descRuRes = grab(src, "descriptionRu: '", descRes.end);
    const catRes = grab(src, "category: '", descRuRes.end);
    const defMatch = /defaultEnabled:\s*(true|false)/.exec(src.slice(catRes.end));
    const def = defMatch ? defMatch[1] === 'true' : true;
    techniques.push({
        id,
        name: nameRes.value,
        nameRu: nameRuRes.value,
        description: descRes.value,
        descriptionRu: descRuRes.value,
        category: catRes.value,
        defaultEnabled: def,
    });
    pos = catRes.end;
}

// ---------- dedup against existing routes ----------
const registryDir = resolve(root, 'src');
const registryFiles = readdirSync(registryDir).filter((f) => /^route-registry.*\.ts$/.test(f));
const existingIds = new Set();
for (const f of registryFiles) {
    const txt = readFileSync(resolve(registryDir, f), 'utf8');
    const re = /id:\s*'([^']+)'/g;
    let m;
    while ((m = re.exec(txt))) existingIds.add(m[1]);
}

const missing = techniques.filter((t) => !existingIds.has(t.id));

// ---------- helpers ----------
function pascal(id) {
    return id.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Panel';
}

function modeFor(id) {
    if (/examination|socratic|question|clarif|interrogat/.test(id)) return 'qa';
    if (/burden|evidence|claim|triangulat|fact|source|verif|revel/.test(id)) return 'claims';
    if (/persona|agent|role|stakeholder|audience|alliance|strateg|whisper|status|style|dynamic|empathy/.test(id)) return 'agents';
    if (/forecast|outcome|prediction|market|narrative|uncertain|graph|abstraction|loop|pivot|concession|enthymeme|multi-hop|heat|sentinel|fingerprint|theory|bidding|speaking|deliberat|best-of/.test(id)) return 'metrics';
    return 'arguments';
}

function esc(s) {
    return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ---------- panel template ----------
const PANEL_TPL = `import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Zap, Sparkles, Activity } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import { getAllSettings, setSetting, qualityImpactCollector } from '../../kernel/instances';
import { QUALITY_TECHNIQUES } from '../../kernel/contracts/debate-quality-settings';
import type { QualityTechnique } from '../../kernel/contracts/debate-quality-settings';
import type { TechniqueImpactMetrics } from '../../kernel/contracts/quality-impact';
import { useRealAgents } from '../../hooks/useRealAgents';
import { useDebateArguments } from '../../hooks/useDebateArguments';

const TECHNIQUE_ID = '%ID%';
const CATEGORY = '%CATEGORY%';

const CONFIDENCE_COLOR: Record<string, string> = {
    very_high: '#22c55e', high: '#86efac', medium: '#facc15', low: '#f97316', none: '#6b7280',
};

const formatPct = (v: number): string => {
    if (v === 0) return '0%';
    const abs = Math.abs(v);
    if (abs < 0.001) return '<0.1%';
    return (v * 100).toFixed(1) + '%';
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
    P0: <Shield size={16} />,
    P1: <Zap size={16} />,
    P2: <Sparkles size={16} />,
};

const PanelToggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
            width: 38, height: 20, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: checked ? 'var(--accent, #6366f1)' : 'var(--slate-300, #cbd5e1)',
            position: 'relative', transition: 'background 0.15s',
        }}
    >
        <span style={{
            position: 'absolute', top: 2, left: checked ? 18 : 2, width: 16, height: 16,
            borderRadius: '50%', background: '#fff', transition: 'left 0.15s',
        }} />
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ border: '1px solid var(--border, #e2e8f0)', borderRadius: 10, padding: 12, background: 'var(--surface, #fff)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--slate-700, #334155)' }}>{title}</div>
        {children}
    </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
    <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--slate-400, #94a3b8)' }}>{text}</div>
);

const Row: React.FC<{ k: string; v: string; color?: string }> = ({ k, v, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ color: 'var(--slate-500, #64748b)' }}>{k}</span>
        <span style={{ fontWeight: 600, color: color ?? 'inherit' }}>{v}</span>
    </div>
);

const FocusSection: React.FC<{ mode: string; args: any[]; agents: any[]; t: (k: string) => string }> = ({ mode, args, agents, t }) => {
    if (mode === 'qa') {
        return (
            <Section title={t('technique.focus_qa')}>
                {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12 }}>
                        {args.slice(0, 12).map((a, i) => (
                            <li key={a.id} style={{ marginBottom: 6 }}>
                                <strong>Q{i + 1}</strong> ({a.agentId}): {a.text ? a.text.slice(0, 180) : ''}
                            </li>
                        ))}
                    </ol>
                )}
            </Section>
        );
    }
    if (mode === 'claims') {
        return (
            <Section title={t('technique.focus_claims')}>
                {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                        {args.slice(0, 14).map((a) => (
                            <li key={a.id} style={{ marginBottom: 6 }}>
                                <span style={{ color: 'var(--slate-500, #64748b)' }}>{a.agentId}</span>: {a.text ? a.text.slice(0, 180) : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </Section>
        );
    }
    if (mode === 'agents') {
        return (
            <Section title={t('technique.focus_agents')}>
                {agents.length === 0 ? <Empty text={t('technique.no_agents')} /> : (
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                        {agents.slice(0, 14).map((a) => (
                            <li key={a.id}><strong>{a.name}</strong>{a.role ? ' — ' + a.role : ''}</li>
                        ))}
                    </ul>
                )}
            </Section>
        );
    }
    if (mode === 'metrics') {
        return (
            <Section title={t('technique.focus_metrics')}>
                <Empty text={t('technique.metrics_hint')} />
            </Section>
        );
    }
    return (
        <Section title={t('technique.focus_args')}>
            {args.length === 0 ? <Empty text={t('technique.no_live')} /> : (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                    {args.slice(0, 16).map((a) => (
                        <li key={a.id} style={{ marginBottom: 6 }}>
                            <span style={{ color: 'var(--slate-500, #64748b)' }}>{a.agentId}</span>: {a.text ? a.text.slice(0, 160) : ''}
                        </li>
                    ))}
                </ul>
            )}
        </Section>
    );
};

export const %COMPONENT%: React.FC = () => {
    const { t, lang } = useTranslation();
    const [enabled, setEnabled] = useState<boolean>(() => {
        try { return getAllSettings()[TECHNIQUE_ID] ?? true; } catch { return true; }
    });
    const [metrics, setMetrics] = useState<TechniqueImpactMetrics | undefined>(undefined);
    const agents = useRealAgents();
    const { args, hasLiveDebate } = useDebateArguments();
    const technique = useMemo<QualityTechnique | undefined>(
        () => QUALITY_TECHNIQUES.find((tc) => tc.id === TECHNIQUE_ID),
        [],
    );

    useEffect(() => {
        const update = () => {
            try {
                const all = qualityImpactCollector.getAllMetrics();
                setMetrics(all.find((m) => m.techniqueId === TECHNIQUE_ID));
            } catch { /* collector not ready */ }
        };
        update();
        const interval = setInterval(update, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleToggle = (v: boolean) => {
        setEnabled(v);
        try { setSetting(TECHNIQUE_ID, v); } catch { /* ignore */ }
    };

    const title = technique ? (lang === 'ru' ? (technique.nameRu || technique.name) : technique.name) : TECHNIQUE_ID;
    const description = technique ? (lang === 'ru' ? (technique.descriptionRu || technique.description) : technique.description) : '';

    return (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--slate-800, #1e293b)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-alt, #f1f5f9)', color: 'var(--accent, #6366f1)' }}>
                    {CATEGORY_ICON[CATEGORY] ?? <Activity size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
                    <div style={{ fontSize: 12, color: 'var(--slate-500, #64748b)' }}>{t('nav.' + TECHNIQUE_ID)}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: CATEGORY === 'P0' ? '#fee2e2' : CATEGORY === 'P1' ? '#ede9fe' : '#e0f2fe', color: CATEGORY === 'P0' ? '#b91c1c' : CATEGORY === 'P1' ? '#6d28d9' : '#0369a1' }}>{CATEGORY}</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--accent, #6366f1)', color: '#fff' }}>Live</span>
                <PanelToggle checked={enabled} onChange={handleToggle} />
            </div>

            {description && (
                <div style={{ fontSize: 13, lineHeight: 1.5, color: 'var(--slate-600, #475569)' }}>{description}</div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                <Section title={t('technique.agents')}>
                    {agents.length === 0 ? (
                        <Empty text={t('technique.no_agents')} />
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12 }}>
                            {agents.slice(0, 12).map((a) => (
                                <li key={a.id}><strong>{a.name}</strong>{a.role ? ' — ' + a.role : ''}</li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title={t('technique.live_args')}>
                    {!hasLiveDebate ? (
                        <Empty text={t('technique.no_live')} />
                    ) : (
                        <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, maxHeight: 220, overflow: 'auto' }}>
                            {args.slice(0, 20).map((arg) => (
                                <li key={arg.id} style={{ marginBottom: 6 }}>
                                    <span style={{ color: 'var(--slate-500, #64748b)' }}>{arg.agentId}</span>
                                    {arg.text ? ': ' + arg.text.slice(0, 160) + (arg.text.length > 160 ? '…' : '') : ''}
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>

                <Section title={t('technique.impact')}>
                    {!metrics || metrics.totalSessions === 0 ? (
                        <Empty text={t('technique.no_impact')} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                            <Row k={t('technique.judge_delta')} v={(metrics.avgJudgeScoreDelta >= 0 ? '+' : '') + formatPct(metrics.avgJudgeScoreDelta)} />
                            <Row k={t('technique.confidence')} v={metrics.confidence} color={CONFIDENCE_COLOR[metrics.confidence] ?? '#6b7280'} />
                            <Row k={t('technique.activations')} v={String(metrics.totalActivations)} />
                            <Row k={t('technique.sessions')} v={metrics.sampleSizeOn + '/' + metrics.totalSessions} />
                        </div>
                    )}
                </Section>
            </div>

            <FocusSection mode="%MODE%" args={args} agents={agents} t={t} />
        </div>
    );
};

export default %COMPONENT%;
`;

// ---------- emit panels ----------
const outDir = resolve(root, 'src/components/TechniquePanels');
mkdirSync(outDir, { recursive: true });

const COMP_MAP_ENTRIES = [];
const NAV_ENTRIES = [];

const enEntries = [];
const ruEntries = [];

const SHARED_EN = {
    'technique.agents': 'Agents',
    'technique.live_args': 'Live arguments',
    'technique.impact': 'Impact',
    'technique.no_agents': 'No real agents available',
    'technique.no_live': 'No live debate running',
    'technique.no_impact': 'No impact data yet',
    'technique.judge_delta': 'Judge score Δ',
    'technique.confidence': 'Confidence',
    'technique.activations': 'Activations',
    'technique.sessions': 'Sessions (on/total)',
    'technique.focus_qa': 'Cross-examination',
    'technique.focus_claims': 'Claims & evidence',
    'technique.focus_agents': 'Participant roles',
    'technique.focus_metrics': 'Analysis',
    'technique.focus_args': 'Argument feed',
    'technique.metrics_hint': 'Detailed metrics are collected across debate sessions.',
};
const SHARED_RU = {
    'technique.agents': 'Агенты',
    'technique.live_args': 'Живые аргументы',
    'technique.impact': 'Влияние',
    'technique.no_agents': 'Нет доступных агентов',
    'technique.no_live': 'Нет активного дебата',
    'technique.no_impact': 'Нет данных о влиянии',
    'technique.judge_delta': 'Δ оценки судьи',
    'technique.confidence': 'Уверенность',
    'technique.activations': 'Активации',
    'technique.sessions': 'Сессии (вкл/всего)',
    'technique.focus_qa': 'Перекрёстный допрос',
    'technique.focus_claims': 'Утверждения и доказательства',
    'technique.focus_agents': 'Роли участников',
    'technique.focus_metrics': 'Анализ',
    'technique.focus_args': 'Лента аргументов',
    'technique.metrics_hint': 'Детальные метрики собираются по сессиям дебатов.',
};

for (const tech of missing) {
    const comp = pascal(tech.id);
    const mode = modeFor(tech.id);
    const content = PANEL_TPL
        .replace(/%ID%/g, tech.id)
        .replace(/%CATEGORY%/g, tech.category)
        .replace(/%MODE%/g, mode)
        .replace(/%COMPONENT%/g, comp);
    writeFileSync(resolve(outDir, comp + '.tsx'), content, 'utf8');

    COMP_MAP_ENTRIES.push(`    '${tech.id}': React.lazy(() => import('./${comp}')),`);
    const icon = tech.category === 'P0' ? 'Shield' : tech.category === 'P1' ? 'Zap' : 'Sparkles';
    const color = tech.category === 'P0' ? '#8b5cf6' : tech.category === 'P1' ? '#6366f1' : '#0ea5e9';
    NAV_ENTRIES.push(`    { id: '${tech.id}', labelKey: 'nav.${tech.id}', icon: React.createElement(${icon}), color: '${color}', lazy: true },`);

    enEntries.push(`    'nav.${tech.id}': ${JSON.stringify(tech.name)},`);
    ruEntries.push(`    'nav.${tech.id}': ${JSON.stringify(tech.nameRu || tech.name)},`);
}

// ---------- bundle ----------
const bundle = `import React from 'react';
import { Shield, Zap, Sparkles } from 'lucide-react';
import type { RouteMeta } from '../../types/routing';

export const TECHNIQUE_PANEL_COMPONENTS: Record<string, React.ComponentType<any>> = {
${COMP_MAP_ENTRIES.join('\n')}
};

export const TECHNIQUE_NAV_ITEMS: RouteMeta[] = [
${NAV_ENTRIES.join('\n')}
];
`;
writeFileSync(resolve(outDir, 'technique-panels-bundle.tsx'), bundle, 'utf8');

// ---------- i18n ----------
const i18n = `// Auto-generated technique nav + shared panel labels. Merged at runtime in translations/index.ts.
export const techniqueNavEn: Record<string, string> = {
${Object.entries(SHARED_EN).map(([k, v]) => `    '${k}': ${JSON.stringify(v)},`).join('\n')}
${enEntries.join('\n')}
};

export const techniqueNavRu: Record<string, string> = {
${Object.entries(SHARED_RU).map(([k, v]) => `    '${k}': ${JSON.stringify(v)},`).join('\n')}
${ruEntries.join('\n')}
};
`;
writeFileSync(resolve(root, 'src/i18n/translations/techniques.ts'), i18n, 'utf8');

console.log('Generated panels:', missing.length);
console.log('Bundle + i18n written.');
