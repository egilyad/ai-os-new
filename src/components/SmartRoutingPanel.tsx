import { useState } from 'react';
import {
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown,
    Play,
    Clock,
    Route,
    Gauge,
    DollarSign,
} from 'lucide-react';
import { smartRoutingService, providerAchievementService } from '../kernel/instances';
import { AchievementList } from './ProviderManager/AchievementList';
import type {
    RoutingRule,
    SmartRoutingConfig,
    RoutingDecision,
} from '../kernel/contracts/smart-routing';

const CONDITION_LABELS: Record<string, string> = {
    model_match: 'Model matches',
    provider_match: 'Provider matches',
    max_latency: 'Max latency (ms)',
    max_cost: 'Max cost ($)',
    priority_min: 'Min priority',
    has_capability: 'Has capability',
};

const COST_OPTIONS = [
    { value: 'speed', label: 'Speed 🏎️' },
    { value: 'balanced', label: 'Balanced ⚖️' },
    { value: 'cost', label: 'Cost 💰' },
];

function RuleCard({
    rule,
    index,
    total,
    onChange,
    onDelete,
    onMove,
}: {
    rule: RoutingRule;
    index: number;
    total: number;
    onChange: (id: string, updates: Partial<RoutingRule>) => void;
    onDelete: (id: string) => void;
    onMove: (from: number, to: number) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            style={{
                background: rule.enabled ? 'rgba(168,85,247,0.04)' : 'rgba(0,0,0,0.02)',
                border: `1px solid ${rule.enabled ? 'rgba(168,85,247,0.15)' : 'rgba(0,0,0,0.06)'}`,
                borderRadius: 10,
                padding: 12,
                opacity: rule.enabled ? 1 : 0.5,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <button
                        disabled={index === 0}
                        onClick={() => onMove(index, index - 1)}
                        style={moveBtnStyle}
                    >
                        <ChevronUp size={14} />
                    </button>
                    <button
                        disabled={index === total - 1}
                        onClick={() => onMove(index, index + 1)}
                        style={moveBtnStyle}
                    >
                        <ChevronDown size={14} />
                    </button>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                            type="text"
                            value={rule.name}
                            onChange={(e) => onChange(rule.id, { name: e.target.value })}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                color: 'inherit',
                                flex: 1,
                                outline: 'none',
                            }}
                        />
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                fontSize: '0.8rem',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={rule.enabled}
                                onChange={(e) => onChange(rule.id, { enabled: e.target.checked })}
                            />
                            Active
                        </label>
                    </div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: 2 }}>
                        → {rule.targetProvider}
                        {rule.targetModel ? ` / ${rule.targetModel}` : ''}
                        {rule.conditions.length > 0 && ` (${rule.conditions.length} conditions)`}
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    style={{ ...iconBtnStyle, opacity: 0.5 }}
                >
                    {expanded ? '▲' : '▼'}
                </button>
                <button
                    onClick={() => onDelete(rule.id)}
                    style={{ ...iconBtnStyle, color: 'var(--error)' }}
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {expanded && (
                <div
                    style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(0,0,0,0.06)',
                    }}
                >
                    <div style={{ fontSize: '0.85rem', marginBottom: 8 }}>
                        <strong>Target:</strong> {rule.targetProvider}
                        {rule.targetModel ? ` / ${rule.targetModel}` : ' (default model)'}
                    </div>

                    {rule.conditions.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                                Conditions:
                            </div>
                            {rule.conditions.map((c, i) => (
                                <div
                                    key={`${rule.id}-cond-${i}`}
                                    style={{ fontSize: '0.8rem', opacity: 0.7, paddingLeft: 12 }}
                                >
                                    {CONDITION_LABELS[c.type] ?? c.type}: {String(c.value)}
                                </div>
                            ))}
                        </div>
                    )}

                    {rule.fallbackChain.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
                                Fallback Chain:
                            </div>
                            {rule.fallbackChain.map((f, i) => (
                                <div
                                    key={`${rule.id}-fb-${i}`}
                                    style={{
                                        fontSize: '0.8rem',
                                        opacity: 0.7,
                                        paddingLeft: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 4,
                                    }}
                                >
                                    <Route size={12} /> {i + 1}. {f.provider}
                                    {f.model ? ` / ${f.model}` : ''}
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                                        ({f.action})
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const moveBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
    opacity: 0.4,
    color: 'inherit',
};
const iconBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    color: 'inherit',
};

export default function SmartRoutingPanel() {
    // B-21: smartRoutingService is a WHAT-IF simulator only. Rules edited here do NOT
    // affect live routing — `RouterService.getRankedProviders` is the authoritative path.
    const [config, setConfig] = useState<SmartRoutingConfig>(() => smartRoutingService.getConfig());
    const [rules, setRules] = useState<RoutingRule[]>(() => smartRoutingService.getRules());
    const [history, setHistory] = useState<RoutingDecision[]>(() =>
        smartRoutingService.getDecisionHistory(),
    );
    const [simResult, setSimResult] = useState<RoutingDecision | null>(null);
    const [simModel, setSimModel] = useState('');

    const refresh = () => {
        setConfig(smartRoutingService.getConfig());
        setRules(smartRoutingService.getRules());
        setHistory(smartRoutingService.getDecisionHistory());
    };

    const handleConfigChange = (updates: Partial<SmartRoutingConfig>) => {
        smartRoutingService.updateConfig(updates);
        refresh();
    };

    const handleRuleChange = (id: string, updates: Partial<RoutingRule>) => {
        smartRoutingService.updateRule(id, updates);
        refresh();
    };

    const handleDeleteRule = (id: string) => {
        smartRoutingService.deleteRule(id);
        refresh();
    };

    const handleMoveRule = (from: number, to: number) => {
        smartRoutingService.reorderRules(from, to);
        refresh();
    };

    const handleAddRule = () => {
        smartRoutingService.addRule({
            name: `Rule ${rules.length + 1}`,
            description: '',
            priority: rules.length,
            enabled: true,
            conditions: [],
            targetProvider: 'openrouter',
            targetModel: undefined,
            fallbackChain: [],
        });
        refresh();
    };

    const handleSimulate = () => {
        const result = smartRoutingService.simulateRouting({
            model: simModel || undefined,
            provider: undefined,
        });
        setSimResult(result);
        refresh();
    };

    return (
        <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <Route size={24} style={{ color: '#a855f7' }} />
                <div>
                    <h2 style={{ margin: 0 }}>OpenRouter Smart Routing</h2>
                    <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>
                        Routing rules · Fallback chains · Simulation
                    </div>
                </div>
            </div>

            {/* Config Section */}
            <div
                style={{
                    background: 'rgba(168,85,247,0.04)',
                    border: '1px solid rgba(168,85,247,0.12)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                }}
            >
                <h3
                    style={{
                        margin: '0 0 12px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Gauge size={16} /> Routing Configuration
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label style={{ fontSize: '0.85rem' }}>
                        Default Provider
                        <select
                            value={config.defaultProvider}
                            onChange={(e) =>
                                handleConfigChange({ defaultProvider: e.target.value })
                            }
                            style={selectStyle}
                        >
                            <option value="openrouter">OpenRouter</option>
                            <option value="groq">Groq</option>
                            <option value="nvidia">NVIDIA</option>
                            <option value="gemini">Gemini</option>
                        </select>
                    </label>
                    <label style={{ fontSize: '0.85rem' }}>
                        Default Model
                        <input
                            type="text"
                            value={config.defaultModel}
                            onChange={(e) => handleConfigChange({ defaultModel: e.target.value })}
                            style={inputStyle}
                        />
                    </label>
                    <label style={{ fontSize: '0.85rem' }}>
                        Cost Optimization
                        <select
                            value={config.costOptimization}
                            onChange={(e) =>
                                handleConfigChange({
                                    costOptimization: e.target
                                        .value as SmartRoutingConfig['costOptimization'],
                                })
                            }
                            style={selectStyle}
                        >
                            {COST_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label style={{ fontSize: '0.85rem' }}>
                        Latency Threshold (ms)
                        <input
                            type="number"
                            value={config.latencyThreshold}
                            onChange={(e) =>
                                handleConfigChange({ latencyThreshold: Number(e.target.value) })
                            }
                            style={inputStyle}
                        />
                    </label>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                    <label
                        style={{
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={config.enableAutoRouting}
                            onChange={(e) =>
                                handleConfigChange({ enableAutoRouting: e.target.checked })
                            }
                        />
                        Auto-routing
                    </label>
                    <label
                        style={{
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={config.enableFallback}
                            onChange={(e) =>
                                handleConfigChange({ enableFallback: e.target.checked })
                            }
                        />
                        Enable fallback
                    </label>
                </div>
            </div>

            {/* Rules Section */}
            <div style={{ marginBottom: 24 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Route size={16} /> Routing Rules ({rules.length})
                    </h3>
                    <button onClick={handleAddRule} style={addBtnStyle}>
                        <Plus size={16} /> Add Rule
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rules.length === 0 && (
                        <div
                            style={{
                                fontSize: '0.85rem',
                                opacity: 0.5,
                                textAlign: 'center',
                                padding: 24,
                            }}
                        >
                            No routing rules yet. Add one to start customizing route selection.
                        </div>
                    )}
                    {rules.map((rule, i) => (
                        <RuleCard
                            key={rule.id}
                            rule={rule}
                            index={i}
                            total={rules.length}
                            onChange={handleRuleChange}
                            onDelete={handleDeleteRule}
                            onMove={handleMoveRule}
                        />
                    ))}
                </div>
            </div>

            {/* Simulator Section */}
            <div
                style={{
                    background: 'rgba(59,130,246,0.04)',
                    border: '1px solid rgba(59,130,246,0.12)',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 24,
                }}
            >
                <h3
                    style={{
                        margin: '0 0 12px',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Play size={16} /> Route Simulator
                </h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                        type="text"
                        placeholder="Model name (e.g. gpt-4)"
                        value={simModel}
                        onChange={(e) => setSimModel(e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                    />
                    <button onClick={handleSimulate} style={simBtnStyle}>
                        <Play size={16} /> Simulate
                    </button>
                </div>
                {simResult && (
                    <div
                        style={{
                            background: 'rgba(59,130,246,0.06)',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: '0.85rem',
                        }}
                    >
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <div>
                                <span style={{ opacity: 0.6 }}>Selected: </span>
                                <strong>{simResult.selectedProvider}</strong>
                                {simResult.selectedModel && ` / ${simResult.selectedModel}`}
                            </div>
                            <div>
                                <span style={{ opacity: 0.6 }}>Fallback: </span>
                                {simResult.fallbackUsed ? 'Yes' : 'No'}
                            </div>
                            <div>
                                <Clock
                                    size={14}
                                    style={{ verticalAlign: 'middle', marginRight: 4 }}
                                />
                                <span style={{ opacity: 0.6 }}>Latency: </span>
                                {Math.round(simResult.latency)}ms
                            </div>
                            <div>
                                <DollarSign
                                    size={14}
                                    style={{ verticalAlign: 'middle', marginRight: 4 }}
                                />
                                <span style={{ opacity: 0.6 }}>Cost: </span>$
                                {simResult.estimatedCost.toFixed(5)}
                            </div>
                        </div>
                        {simResult.matchedConditions.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <span style={{ opacity: 0.6 }}>Matched: </span>
                                {simResult.matchedConditions.join(', ')}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* History Section */}
            <div>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 12,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}
                    >
                        <Clock size={16} /> Decision History ({history.length})
                    </h3>
                    <button
                        onClick={() => {
                            smartRoutingService.clearHistory();
                            refresh();
                        }}
                        style={{ ...iconBtnStyle, fontSize: '0.8rem', opacity: 0.6 }}
                    >
                        Clear
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {history.length === 0 && (
                        <div
                            style={{
                                fontSize: '0.85rem',
                                opacity: 0.5,
                                textAlign: 'center',
                                padding: 16,
                            }}
                        >
                            No routing decisions yet. Use the simulator to generate one.
                        </div>
                    )}
                    {[...history]
                        .reverse()
                        .slice(0, 20)
                        .map((d, i) => (
                            <div
                                key={`${d.selectedProvider}-${d.selectedModel}-${i}`}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '6px 10px',
                                    background: 'rgba(0,0,0,0.02)',
                                    borderRadius: 6,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <span>
                                    {d.selectedProvider}/{d.selectedModel}
                                    {d.ruleId && ' (rule)'}
                                </span>
                                <span style={{ opacity: 0.5 }}>
                                    {Math.round(d.latency)}ms · ${d.estimatedCost.toFixed(5)}
                                </span>
                            </div>
                        ))}
                </div>
            </div>

            {/* Achievements */}
            <div style={{ marginTop: 24 }}>
                <AchievementList
                    achievements={providerAchievementService.getAchievements('openrouter')}
                    progress={providerAchievementService.getProgress('openrouter', {
                        requests: history.length * 2 + 1,
                        modelsUsed: Math.min(10, config.defaultModel ? 3 : 0),
                        failovers: config.enableFallback ? rules.length : 0,
                        routingRules: rules.length,
                        costRules: config.enableAutoRouting ? 1 : 0,
                        activeRoutes: rules.filter((r) => r.enabled !== false).length,
                        abTests: 0,
                        openrouterAchievements: providerAchievementService
                            .getAwardedIds()
                            .filter(
                                (id) =>
                                    id.startsWith('pa-') &&
                                    parseInt(id.split('-')[1]!) > 15 &&
                                    parseInt(id.split('-')[1]!) <= 30,
                            ).length,
                    })}
                />
            </div>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: '0.85rem',
    background: 'rgba(0,0,0,0.02)',
    color: 'inherit',
    width: '100%',
    marginTop: 4,
    outline: 'none',
    boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
};

const addBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid rgba(168,85,247,0.3)',
    borderRadius: 8,
    padding: '6px 14px',
    background: 'rgba(168,85,247,0.08)',
    color: '#a855f7',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
};

const simBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 8,
    padding: '6px 14px',
    background: 'rgba(59,130,246,0.08)',
    color: 'var(--accent)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
};
