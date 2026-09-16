import {
    Info,
    Lightbulb,
    BookOpen,
    Layers,
    Shield,
    Cpu,
    Zap,
    Globe,
    Database,
    Bot,
    Sparkles,
    ArrowRight,
    GitBranch,
    Activity,
    Thermometer,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';
import type { TranslationKey } from '../i18n/translations';

const EMOJI_MAP: Record<string, string> = {
    telescope: '\u{1F52D}',
    sparkles: '\u2728',
    brain: '\u{1F9E0}',
    books: '\u{1F4DA}',
    shield: '\u{1F6E1}',
    warning: '\u26A0',
    microscope: '\u{1F52C}',
    bar_chart: '\u{1F4CA}',
    chart: '\u{1F4C8}',
    link: '\u{1F517}',
    gear: '\u2699',
    robot_face: '\u{1F916}',
    speech_balloon: '\u{1F4AC}',
    left_right_arrow: '\u{2194}',
    globe: '\u{1F310}',
    satelite: '\u{1F4E1}',
    electric_plug: '\u{1F50C}',
    wrench: '\u{1F527}',
    closed_lock_with_key: '\u{1F510}',
    mag: '\u{1F50D}',
    computer: '\u{1F4BB}',
    satellite: '\u{1F4E1}',
    triangular_ruler: '\u{1F4D0}',
    floppy_disk: '\u{1F4BE}',
    honeybee: '\u{1F41D}',
    fish: '\u{1F41F}',
    ocean: '\u{1F30A}',
    thermometer: '\u{1F321}',
    vertical_traffic_light: '\u{1F6A6}',
    four_leaf_clover: '\u{1F340}',
    heartbeat: '\u{1F493}',
    stethoscope: '\u{1FA7A}',
    key: '\u{1F511}',
    mega: '\u{1F4E3}',
    newspaper: '\u{1F4F0}',
    neural: '\u{1F9E0}',
    card_index_dividers: '\u{1F5C2}',
    network: '\u{1F5FA}',
    bulb: '\u{1F4A1}',
    label: '\u{1F3F7}',
    book: '\u{1F4D6}',
    busts_in_silhouette: '\u{1F465}',
    heavy_plus_sign: '\u{2795}',
    dollar: '\u{1F4B5}',
    chart_with_upwards_trend: '\u{1F4C8}',
    chart_with_upwards_downs: '\u{1F4C9}',
    deciduous_tree: '\u{1F333}',
    art: '\u{1F3A8}',
    eye: '\u{1F441}',
    rock: '\u{1FAA8}',
    zap: '\u26A1',
    white_check_mark: '\u2705',
    leftwards_arrow: '\u{2B05}',
    robot: '\u{1F916}',
};

export type ModuleKey =
    | 'dashboard'
    | 'chat'
    | 'tasks'
    | 'sre'
    | 'providers'
    | 'pool_status'
    | 'connectors'
    | 'mcp'
    | 'skills'
    | 'tools'
    | 'policy'
    | 'roles'
    | 'analytics'
    | 'routing'
    | 'events'
    | 'traces'
    | 'memory'
    | 'health'
    | 'pressure_map'
    | 'patterns'
    | 'knowledge'
    | 'aquarium'
    | 'debate'
    | 'builder'
    | 'agents'
    | 'settings'
    | 'debate_runtime'
    | 'what_if'
    | 'runtime_pressure_map'
    | 'diagnostics'
    | 'dependency_graph'
    | 'service_registry';

const MODULE_NAV_KEY: Record<ModuleKey, TranslationKey> = {
    dashboard: 'nav.overview',
    chat: 'nav.chat',
    tasks: 'nav.tasks',
    sre: 'nav.sre_agent',
    providers: 'nav.providers',
    pool_status: 'nav.key_pools',
    connectors: 'nav.connectors',
    mcp: 'nav.mcp_servers',
    skills: 'nav.skills',
    tools: 'nav.tools',
    policy: 'nav.policies',
    roles: 'nav.roles',
    analytics: 'nav.analytics',
    routing: 'nav.routing_ai',
    events: 'nav.logs',
    traces: 'nav.traces',
    memory: 'nav.memory',
    health: 'nav.health',
    pressure_map: 'nav.pressure_map',
    patterns: 'nav.patterns',
    knowledge: 'nav.knowledge',
    aquarium: 'nav.aquarium',
    debate: 'nav.debate',
    debate_runtime: 'nav.debate_runtime',
    builder: 'nav.builder',
    agents: 'nav.agents',
    settings: 'nav.settings',
    what_if: 'nav.what_if',
    runtime_pressure_map: 'nav.runtime_pressure_map',
    dependency_graph: 'nav.dependency_graph',
    diagnostics: 'nav.diagnostics',
    service_registry: 'nav.service_registry',
};

const MODULE_INFO_KEY: Record<ModuleKey, TranslationKey> = {
    dashboard: 'info.dashboard',
    chat: 'info.chat',
    tasks: 'info.tasks',
    sre: 'info.sre',
    providers: 'info.providers',
    pool_status: 'info.pool_status',
    connectors: 'info.connectors',
    mcp: 'info.mcp',
    skills: 'info.skills',
    tools: 'info.tools',
    policy: 'info.policy',
    roles: 'info.roles',
    analytics: 'info.analytics',
    routing: 'info.routing',
    events: 'info.events',
    traces: 'info.traces',
    memory: 'info.memory',
    health: 'info.health',
    pressure_map: 'info.pressure_map',
    patterns: 'info.patterns',
    knowledge: 'info.knowledge',
    aquarium: 'info.aquarium',
    debate: 'info.debate',
    debate_runtime: 'info.debate_runtime',
    builder: 'info.builder',
    agents: 'info.agents',
    settings: 'info.settings',
    what_if: 'info.what_if',
    runtime_pressure_map: 'info.runtime_pressure_map',
    dependency_graph: 'info.dependency_graph',
    diagnostics: 'info.diagnostics',
    service_registry: 'info.service_registry',
};

const MODULE_ICONS: Record<ModuleKey, React.ReactNode> = {
    dashboard: <Layers size={18} />,
    chat: <Bot size={18} />,
    tasks: <Zap size={18} />,
    sre: <Shield size={18} />,
    providers: <Database size={18} />,
    pool_status: <Database size={18} />,
    connectors: <Globe size={18} />,
    mcp: <Cpu size={18} />,
    skills: <Sparkles size={18} />,
    tools: <Cpu size={18} />,
    policy: <Shield size={18} />,
    roles: <BookOpen size={18} />,
    analytics: <Layers size={18} />,
    routing: <Globe size={18} />,
    events: <Info size={18} />,
    traces: <Info size={18} />,
    memory: <Database size={18} />,
    health: <Shield size={18} />,
    pressure_map: <Layers size={18} />,
    patterns: <Lightbulb size={18} />,
    knowledge: <BookOpen size={18} />,
    aquarium: <Sparkles size={18} />,
    debate: <Zap size={18} />,
    debate_runtime: <GitBranch size={18} />,
    what_if: <Zap size={18} />,
    runtime_pressure_map: <Thermometer size={18} />,
    diagnostics: <Activity size={18} />,
    builder: <Cpu size={18} />,
    agents: <Bot size={18} />,
    settings: <Layers size={18} />,
    dependency_graph: <GitBranch size={18} />,
    service_registry: <Database size={18} />,
};

interface ModuleInfoProps {
    moduleKey: ModuleKey;
    relatedModules?: ModuleKey[];
}

const ModuleInfo: React.FC<ModuleInfoProps> = ({ moduleKey, relatedModules }) => {
    const { t } = useTranslation();
    // UX-001: handle ComingSoon stub keys not in MODULE_INFO_KEY (e.g. steelman) — show generic fallback instead of empty
    const infoKey = MODULE_INFO_KEY[moduleKey as ModuleKey];
    const navKey = MODULE_NAV_KEY[moduleKey as ModuleKey];
    if (!infoKey || !navKey) {
        return (
            <details style={{ marginTop: '1.5rem' }}>
                <summary style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', userSelect: 'none', padding: '0.5rem 0.75rem', borderRadius: 8, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)', fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 600 }}>Planned feature — {String(moduleKey).replace(/-/g, ' ')}</summary>
                <div style={{ marginTop: '0.5rem', padding: '1rem 1.25rem', borderRadius: 12, background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.12)', fontSize: '0.8rem', color: 'var(--slate-400)', lineHeight: 1.6 }}>This capability is planned and will be connected to its debate-runtime service. Track progress in Experimental hub.</div>
            </details>
        );
    }
    const lines = (t(infoKey) || '').split('\n').filter((l) => l.trim());

    return (
        <details style={{ marginTop: '1.5rem' }}>
            <summary
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    background: 'rgba(139,92,246,0.04)',
                    border: '1px solid rgba(139,92,246,0.12)',
                    fontSize: '0.75rem',
                    color: 'var(--slate-400)',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                }}
            >
                <span style={{ color: 'var(--purple-muted)' }}>{MODULE_ICONS[moduleKey]}</span>
                {t(MODULE_NAV_KEY[moduleKey])}
            </summary>
            <div
                style={{
                    marginTop: '0.5rem',
                    padding: '1rem 1.25rem',
                    borderRadius: 12,
                    background: 'rgba(139,92,246,0.04)',
                    border: '1px solid rgba(139,92,246,0.12)',
                    borderLeft: '3px solid rgba(139,92,246,0.4)',
                    fontSize: '0.8rem',
                    color: 'var(--slate-400)',
                    lineHeight: 1.6,
                }}
            >
                {lines.map((line, i) => {
                    const emojiMatch = line.match(/^(:[\w_]+:)\s*/);
                    const emojiCode = emojiMatch ? emojiMatch[1]!.replace(/:/g, '') : '';
                    const displayLine = emojiMatch ? line.slice(emojiMatch[0].length) : line;
                    const emojiChar = EMOJI_MAP[emojiCode] || emojiCode;
                    return (
                        <div
                            key={`line-${i}`}
                            style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '0.25rem',
                                alignItems: 'flex-start',
                            }}
                        >
                            {emojiMatch && <span style={{ flexShrink: 0 }}>{emojiChar}</span>}
                            <span>{displayLine}</span>
                        </div>
                    );
                })}
                {relatedModules && relatedModules.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            gap: '0.5rem',
                            marginTop: '0.5rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid rgba(139,92,246,0.1)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <span
                            style={{
                                color: 'var(--slate-500)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                            }}
                        >
                            <ArrowRight size={12} /> {t('info.related')}:
                        </span>
                        {relatedModules.map((rel) => (
                            <span
                                key={rel}
                                style={{
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: 4,
                                    background: 'rgba(139,92,246,0.08)',
                                    color: 'var(--purple-muted)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {MODULE_ICONS[rel]} {t(MODULE_NAV_KEY[rel])}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </details>
    );
};

export default ModuleInfo;
