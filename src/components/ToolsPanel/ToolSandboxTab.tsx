import { motion } from 'framer-motion';
import { Cpu, Play } from 'lucide-react';
import type { ToolDefinition } from '../../kernel/instances';
import { labelUppercaseBold } from '../../styles/common';

interface ToolSandboxTabProps {
    tool: ToolDefinition;
    testParams: string;
    testOutput: string;
    isExecuting: boolean;
    onTestParamsChange: (params: string) => void;
    onRunTest: () => void;
    onResetParams: () => void;
    t: (key: string) => string;
}

export const ToolSandboxTab: React.FC<ToolSandboxTabProps> = ({
    tool,
    testParams,
    testOutput,
    isExecuting,
    onTestParamsChange,
    onRunTest,
    onResetParams,
    t,
}) => (
    <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label
                style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--slate-500)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <span>{t('tools.exec_params_label')}</span>
                <span
                    style={{ cursor: 'pointer', color: 'var(--accent)', textTransform: 'none' }}
                    onClick={onResetParams}
                >
                    {t('tools.exec_reset')}
                </span>
            </label>
            <textarea
                value={testParams}
                onChange={(e) => onTestParamsChange(e.target.value)}
                style={{
                    height: 140,
                    padding: '1.25rem',
                    background: 'var(--slate-950)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: 12,
                    color: 'var(--slate-200)',
                    outline: 'none',
                    resize: 'none',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.05)')}
                aria-label="JSON parameters for tool execution"
            />
        </div>

        <button
            onClick={onRunTest}
            disabled={isExecuting || !tool.enabled}
            style={{
                width: '100%',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                borderRadius: 12,
                fontWeight: 800,
                background: tool.enabled
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'rgba(255,255,255,0.05)',
                opacity: tool.enabled ? 1 : 0.5,
                boxShadow: tool.enabled ? '0 4px 15px rgba(16,185,129,0.3)' : 'none',
                cursor: tool.enabled ? 'pointer' : 'not-allowed',
                border: 'none',
                color: 'white',
            }}
            aria-label={t('tools.exec_aria')}
        >
            {isExecuting ? (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                    <Cpu size={20} aria-hidden="true" />
                </motion.div>
            ) : (
                <Play size={20} fill="currentColor" aria-hidden="true" />
            )}
            {isExecuting ? t('tools.exec_running') : t('tools.exec_button')}
        </button>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelUppercaseBold}>{t('tools.exec_output_label')}</label>
            <div
                style={{
                    flex: 1,
                    background: 'var(--slate-950)',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.05)',
                    padding: '1.25rem',
                    overflowY: 'auto',
                    minHeight: 180,
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                }}
            >
                {testOutput ? (
                    <pre
                        style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            color: testOutput.includes('Error') ? '#ef4444' : '#10b981',
                            fontFamily: '"JetBrains Mono", monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.5,
                        }}
                    >
                        {testOutput}
                    </pre>
                ) : (
                    <div
                        style={{
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--slate-600)',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            lineHeight: 1.6,
                        }}
                    >
                        {t('tools.exec_no_output')}
                        <br />
                        {t('tools.exec_no_output_hint')}
                    </div>
                )}
            </div>
        </div>
    </>
);
