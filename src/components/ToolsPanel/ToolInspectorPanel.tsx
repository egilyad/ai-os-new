import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Braces, Shield, Cpu, Play, Key, Globe } from 'lucide-react';
import type { ToolDefinition } from '../../kernel/instances';

import { ToolSandboxTab } from './ToolSandboxTab';
import { ToolSchemaTab } from './ToolSchemaTab';
import { ToolSecurityTab } from './ToolSecurityTab';

interface ToolInspectorPanelProps {
    tool: ToolDefinition | null;
    testParams: string;
    testOutput: string;
    isExecuting: boolean;
    activeTab: 'sandbox' | 'schema' | 'security';
    onTabChange: (tab: 'sandbox' | 'schema' | 'security') => void;
    onTestParamsChange: (params: string) => void;
    onRunTest: () => void;
    onResetParams: () => void;
    t: (key: string) => string;
}

const getToolIcon = (type: string) => {
    switch (type) {
        case 'script':
            return <Cpu size={20} color="#a855f7" />;
        case 'api':
            return <Globe size={20} color="#3b82f6" />;
        case 'database':
            return <Key size={20} color="#10b981" />;
        default:
            return <Play size={20} color="#f59e0b" />;
    }
};

const getToolColor = (type: string) => {
    switch (type) {
        case 'script':
            return '#a855f7';
        case 'api':
            return '#3b82f6';
        case 'database':
            return '#10b981';
        default:
            return '#f59e0b';
    }
};

export const ToolInspectorPanel: React.FC<ToolInspectorPanelProps> = ({
    tool,
    testParams,
    testOutput,
    isExecuting,
    activeTab,
    onTabChange,
    onTestParamsChange,
    onRunTest,
    onResetParams,
    t,
}) => {
    if (!tool) {
        return (
            <div
                style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--slate-500)',
                    gap: '1.5rem',
                    padding: '2rem',
                    textAlign: 'center',
                }}
            >
                <div
                    style={{
                        padding: '1.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                >
                    <Play size={40} color="#64748b" aria-hidden="true" />
                </div>
                <div>
                    <div
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: 800,
                            color: 'var(--slate-50)',
                            marginBottom: '0.5rem',
                        }}
                    >
                        {t('tools.no_selection')}
                    </div>
                    <div
                        style={{
                            fontSize: '0.9rem',
                            maxWidth: '300px',
                            margin: '0 auto',
                            lineHeight: 1.6,
                        }}
                    >
                        Select a tool from the registry to inspect its LLM schema, security scopes,
                        and test sandbox execution.
                    </div>
                </div>
            </div>
        );
    }

    const color = getToolColor(tool.type);

    return (
        <>
            <div
                style={{
                    padding: '2rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(0,0,0,0.3)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        marginBottom: '1.5rem',
                    }}
                >
                    <div
                        style={{
                            padding: '0.75rem',
                            background: `${color}15`,
                            borderRadius: 14,
                            border: `1px solid ${color}40`,
                        }}
                    >
                        {getToolIcon(tool.type)}
                    </div>
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: '1.5rem',
                                fontWeight: 800,
                                color: 'var(--slate-50)',
                            }}
                        >
                            {tool.name}
                        </h3>
                        <div
                            style={{
                                fontSize: '0.8rem',
                                color: 'var(--slate-500)',
                                fontFamily: 'monospace',
                                marginTop: '0.3rem',
                            }}
                        >
                            ID: {tool.id}
                        </div>
                    </div>
                </div>

                <div
                    style={{
                        display: 'flex',
                        gap: '0.5rem',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '0.5rem',
                        borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}
                    role="tablist"
                    aria-label="Tool inspector tabs"
                >
                    {(['sandbox', 'schema', 'security'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => onTabChange(tab)}
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`tools-${tab}-panel`}
                            style={{
                                flex: 1,
                                padding: '0.6rem',
                                borderRadius: 10,
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background:
                                    activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent',
                                color: activeTab === tab ? 'white' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                        >
                            {tab === 'sandbox' && <PlayCircle size={16} aria-hidden="true" />}
                            {tab === 'schema' && <Braces size={16} aria-hidden="true" />}
                            {tab === 'security' && <Shield size={16} aria-hidden="true" />}
                            {tab === 'sandbox' && t('tools.tab_sandbox')}
                            {tab === 'schema' && t('tools.tab_schema')}
                            {tab === 'security' && t('tools.tab_security')}
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '2rem',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}
                        role="tabpanel"
                        id={`tools-${activeTab}-panel`}
                        aria-labelledby={`tools-${activeTab}-tab`}
                    >
                        {activeTab === 'sandbox' && (
                            <ToolSandboxTab
                                tool={tool}
                                testParams={testParams}
                                testOutput={testOutput}
                                isExecuting={isExecuting}
                                onTestParamsChange={onTestParamsChange}
                                onRunTest={onRunTest}
                                onResetParams={onResetParams}
                                t={t}
                            />
                        )}
                        {activeTab === 'schema' && <ToolSchemaTab tool={tool} t={t} />}
                        {activeTab === 'security' && <ToolSecurityTab t={t} />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </>
    );
};
