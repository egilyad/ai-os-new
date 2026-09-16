import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CheckCircle2, AlertTriangle, Trash2, MousePointerClick } from 'lucide-react';
import type { Node } from '@xyflow/react';
import type { ISNode } from '../../kernel/contracts/topology';
import { labelSection800, labelBlockUppercase, selectDarkWide } from '../../styles/common';

interface KeyInfo {
    status?: string;
    availableModels?: string[];
    provider?: string;
}

interface ToolInfo {
    id: string;
    name: string;
}

interface InspectorPanelProps {
    activeNode: Node | null;
    onUpdateLabel: (nodeId: string, label: string) => void;
    onUpdateConfig: (nodeId: string, updates: Record<string, unknown>) => void;
    onRemoveNode: (nodeId: string) => void;
    keys: KeyInfo[];
    availableTools: ToolInfo[];
    t: (key: string) => string;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({
    activeNode,
    onUpdateLabel,
    onUpdateConfig,
    onRemoveNode,
    keys,
    availableTools,
    t,
}) => {
    return (
        <div
            className="glass-panel"
            style={{
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.2)',
            }}
        >
            <div
                style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                }}
            >
                <Settings size={18} color="#94a3b8" aria-hidden="true" />
                <div style={labelSection800}>{t('builder.inspector')}</div>
            </div>

            <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
                <AnimatePresence mode="wait">
                    {activeNode ? (
                        <motion.div
                            key={activeNode.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1.5rem',
                            }}
                        >
                            <div
                                style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '1rem',
                                    borderRadius: 12,
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '0.75rem',
                                    }}
                                >
                                    <label
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--slate-400)',
                                            fontWeight: 600,
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Node Identity
                                    </label>
                                    <span
                                        style={{
                                            fontSize: '0.65rem',
                                            fontFamily: 'monospace',
                                            color: 'var(--slate-500)',
                                        }}
                                    >
                                        {activeNode.id}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'rgba(0,0,0,0.3)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: 8,
                                        color: 'white',
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        transition: 'border-color 0.2s',
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                                    onBlur={(e) =>
                                        (e.target.style.borderColor = 'rgba(255,255,255,0.1)')
                                    }
                                    value={activeNode.data.label as string}
                                    onChange={(e) => onUpdateLabel(activeNode.id, e.target.value)}
                                    aria-label="Node name"
                                />
                            </div>

                            {activeNode.data.type === 'agent' && (
                                <>
                                    <div>
                                        <label style={labelBlockUppercase}>Model Engine</label>
                                        <select
                                            style={selectDarkWide}
                                            value={
                                                (activeNode.data.config as ISNode['config'])
                                                    ?.model || 'auto'
                                            }
                                            onChange={(e) =>
                                                onUpdateConfig(activeNode.id, {
                                                    model: e.target.value,
                                                })
                                            }
                                            aria-label={t('common.aria.select_model')}
                                        >
                                            <option value="auto">{t('builder.auto_select')}</option>
                                            {keys
                                                .filter((k) => k.status === 'active')
                                                .flatMap((k) =>
                                                    (k.availableModels || []).map((m) => (
                                                        <option
                                                            key={`${k.provider}-${m}`}
                                                            value={`${k.provider}:${m}`}
                                                        >
                                                            {k.provider?.toUpperCase()} / {m}
                                                        </option>
                                                    )),
                                                )}
                                        </select>
                                        {keys.length === 0 && (
                                            <div
                                                style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--warning)',
                                                    marginTop: '0.5rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 6,
                                                }}
                                            >
                                                <AlertTriangle size={14} aria-hidden="true" />{' '}
                                                {t('builder.no_providers_warn')}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label style={labelBlockUppercase}>
                                            {t('builder.system_prompt')}
                                        </label>
                                        <textarea
                                            rows={6}
                                            style={{
                                                width: '100%',
                                                padding: '0.85rem',
                                                background: 'rgba(0,0,0,0.3)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: 8,
                                                color: 'var(--slate-200)',
                                                outline: 'none',
                                                resize: 'vertical',
                                                fontSize: '0.85rem',
                                                lineHeight: 1.5,
                                                fontFamily: 'monospace',
                                            }}
                                            placeholder={t('builder.system_prompt_placeholder')}
                                            value={
                                                (activeNode.data.config as ISNode['config'])
                                                    ?.prompt || ''
                                            }
                                            onChange={(e) =>
                                                onUpdateConfig(activeNode.id, {
                                                    prompt: e.target.value,
                                                })
                                            }
                                            aria-label={t('common.aria.system_prompt')}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--slate-400)',
                                                fontWeight: 600,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '0.75rem',
                                                textTransform: 'uppercase',
                                            }}
                                        >
                                            {t('builder.equipped_tools')}
                                            <span
                                                style={{
                                                    background: 'rgba(59,130,246,0.2)',
                                                    color: '#60a5fa',
                                                    padding: '2px 8px',
                                                    borderRadius: 12,
                                                    fontSize: '0.65rem',
                                                }}
                                            >
                                                {
                                                    (
                                                        (activeNode.data.config as ISNode['config'])
                                                            ?.tools || []
                                                    ).length
                                                }{' '}
                                                {t('builder.active_badge')}
                                            </span>
                                        </label>
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem',
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '0.75rem',
                                                borderRadius: 8,
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                            }}
                                        >
                                            {availableTools.map((tool) => {
                                                const isEquipped = (
                                                    (activeNode.data.config as ISNode['config'])
                                                        ?.tools || []
                                                ).includes(tool.id);
                                                return (
                                                    <div
                                                        key={tool.id}
                                                        onClick={() => {
                                                            const currentTools =
                                                                (
                                                                    activeNode.data
                                                                        .config as ISNode['config']
                                                                )?.tools || [];
                                                            const newTools = isEquipped
                                                                ? currentTools.filter(
                                                                      (id: string) =>
                                                                          id !== tool.id,
                                                                  )
                                                                : [...currentTools, tool.id];
                                                            onUpdateConfig(activeNode.id, {
                                                                tools: newTools,
                                                            });
                                                        }}
                                                        style={{
                                                            padding: '0.6rem 0.75rem',
                                                            borderRadius: 6,
                                                            fontSize: '0.8rem',
                                                            cursor: 'pointer',
                                                            background: isEquipped
                                                                ? 'rgba(59,130,246,0.15)'
                                                                : 'rgba(255,255,255,0.02)',
                                                            border: `1px solid ${isEquipped ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 10,
                                                            transition: 'all 0.2s',
                                                        }}
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-pressed={isEquipped}
                                                        aria-label={`${tool.name} ${isEquipped ? 'equipped' : 'not equipped'}`}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key === 'Enter' ||
                                                                e.key === ' '
                                                            ) {
                                                                e.preventDefault();
                                                                const currentTools =
                                                                    (
                                                                        activeNode.data
                                                                            .config as ISNode['config']
                                                                    )?.tools || [];
                                                                const newTools = isEquipped
                                                                    ? currentTools.filter(
                                                                          (id: string) =>
                                                                              id !== tool.id,
                                                                      )
                                                                    : [...currentTools, tool.id];
                                                                onUpdateConfig(activeNode.id, {
                                                                    tools: newTools,
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        {isEquipped ? (
                                                            <CheckCircle2
                                                                size={16}
                                                                color="#3b82f6"
                                                                aria-hidden="true"
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: 16,
                                                                    height: 16,
                                                                    borderRadius: '50%',
                                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                                }}
                                                                aria-hidden="true"
                                                            />
                                                        )}
                                                        <span
                                                            style={{
                                                                fontWeight: isEquipped ? 600 : 400,
                                                                color: isEquipped
                                                                    ? 'white'
                                                                    : '#94a3b8',
                                                            }}
                                                        >
                                                            {tool.name}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                            {availableTools.length === 0 && (
                                                <div
                                                    style={{
                                                        fontSize: '0.75rem',
                                                        color: 'var(--slate-500)',
                                                        textAlign: 'center',
                                                        padding: '1rem 0',
                                                    }}
                                                >
                                                    {t('builder.no_tools_warn')}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {activeNode.data.type === 'tool' && (
                                <div>
                                    <label style={labelBlockUppercase}>
                                        {t('builder.bind_capability')}
                                    </label>
                                    <select
                                        style={selectDarkWide}
                                        value={
                                            ((activeNode.data.config as ISNode['config'])
                                                ?.toolId as string) || ''
                                        }
                                        onChange={(e) =>
                                            onUpdateConfig(activeNode.id, {
                                                toolId: e.target.value,
                                            })
                                        }
                                        aria-label="Bind external tool"
                                    >
                                        <option value="">{t('builder.select_tool')}</option>
                                        {availableTools.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <hr
                                style={{
                                    border: 0,
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    margin: '0.5rem 0',
                                }}
                            />

                            <button
                                style={{
                                    padding: '0.75rem',
                                    background: 'var(--error-tint)',
                                    color: 'var(--error)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                    borderRadius: 8,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                                }}
                                onClick={() => onRemoveNode(activeNode.id)}
                                aria-label={t('builder.remove_node_aria')}
                            >
                                <Trash2 size={16} aria-hidden="true" /> {t('builder.remove_node')}
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                color: 'var(--slate-500)',
                                gap: '1rem',
                            }}
                        >
                            <div
                                style={{
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    borderRadius: '50%',
                                }}
                            >
                                <MousePointerClick
                                    size={32}
                                    color="rgba(255,255,255,0.1)"
                                    aria-hidden="true"
                                />
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.95rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-400)',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    {t('builder.no_node_selected')}
                                </div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        maxWidth: '200px',
                                        margin: '0 auto',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {t('builder.no_node_hint')}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InspectorPanel;
