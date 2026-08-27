import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import {
    Variable,
    AlertTriangle,
    Lightbulb,
    ChevronDown,
    ChevronRight,
    Copy,
    Check,
    BookOpen,
} from 'lucide-react';
import { estimateTokens } from '../../kernel/utils/tokenEstimate';
import { PromptOptimizer } from '../../kernel/services/prompt-optimizer';

const PREDEFINED_VARIABLES = [
    { id: 'user_message', label: 'User Message', value: '{{user_message}}' },
    { id: 'memory', label: 'Memory Context', value: '{{memory}}' },
    { id: 'context', label: 'Session Context', value: '{{context}}' },
    { id: 'previous_response', label: 'Previous Response', value: '{{previous_response}}' },
    { id: 'role_name', label: 'Role Name', value: '{{role_name}}' },
    { id: 'current_date', label: 'Current Date', value: '{{current_date}}' },
    { id: 'tools', label: 'Available Tools', value: '{{tools}}' },
    { id: 'task', label: 'Task Description', value: '{{task}}' },
    { id: 'input', label: 'Input Data', value: '{{input}}' },
    { id: 'output_format', label: 'Output Format', value: '{{output_format}}' },
];

const TEMPLATES = [
    {
        id: 'code_review',
        label: 'Code Review',
        prompt: 'You are an expert code reviewer. Review the following code for:\n- Bugs and logic errors\n- Performance issues\n- Security vulnerabilities\n- Code style and best practices\n\nProvide a structured review with severity levels.\n\n{{input}}',
    },
    {
        id: 'documentation',
        label: 'Documentation Writer',
        prompt: 'You are a technical writer. Generate clear, comprehensive documentation for:\n\n{{input}}\n\nInclude:\n- Overview\n- Installation\n- Usage examples\n- API reference\n- Configuration options',
    },
    {
        id: 'data_analysis',
        label: 'Data Analyst',
        prompt: 'You are a data analyst. Analyze the following data and provide:\n- Key insights and trends\n- Statistical summary\n- Anomalies detected\n- Recommendations\n\n{{input}}',
    },
    {
        id: 'troubleshooter',
        label: 'Troubleshooter',
        prompt: 'You are a troubleshooting expert. Given the following issue:\n\n{{input}}\n\nProvide:\n1. Root cause analysis\n2. Step-by-step resolution\n3. Prevention measures',
    },
    {
        id: 'architect',
        label: 'System Architect',
        prompt: 'You are a system architect. Design a solution for:\n\n{{input}}\n\nCover:\n- Architecture overview\n- Component diagram (text)\n- Data flow\n- Technology choices\n- Trade-offs considered',
    },
    {
        id: 'creative',
        label: 'Creative Writer',
        prompt: 'You are a creative writer. Given the following brief:\n\n{{input}}\n\nGenerate creative content that is:\n- Engaging and well-structured\n- Appropriate for the target audience\n- Original and imaginative',
    },
    {
        id: 'researcher',
        label: 'Research Analyst',
        prompt: 'You are a research analyst. Your task is {{task}}. Gather information, analyze data, and provide a comprehensive summary with citations where applicable.',
    },
    {
        id: 'supporter',
        label: 'Support Agent',
        prompt: 'You are a customer support specialist. Your task is {{task}}. Be helpful, empathetic, and clear. Escalate complex issues appropriately.',
    },
];

const optimizer = new PromptOptimizer();

interface PromptStudioProps {
    value: string;
    onChange: (value: string) => void;
}

export const PromptStudio: React.FC<PromptStudioProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [showVars, setShowVars] = useState(false);
    const [showLint, setShowLint] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    const tokens = useMemo(() => estimateTokens(value), [value]);
    const charCount = value.length;

    const lintIssues = useMemo(() => {
        const issues: { type: string; message: string; severity: 'warning' | 'info' }[] = [];
        if (!value) return issues;

        const vagueWords = [
            'sometimes',
            'maybe',
            'if possible',
            'perhaps',
            'eventually',
            'might',
            'could be',
            'sort of',
            'kind of',
        ];
        for (const w of vagueWords) {
            const re = new RegExp('\\b' + w + '\\b', 'gi');
            const match = re.exec(value);
            if (match) {
                issues.push({
                    type: 'vague',
                    message: `Vague language: "${w}" at position ${match.index}. Consider being more specific.`,
                    severity: 'warning',
                });
            }
        }

        if (!value.toLowerCase().includes('you are') && !value.toLowerCase().includes('act as')) {
            issues.push({
                type: 'role',
                message: 'No role definition found. Consider adding "You are..." at the start.',
                severity: 'info',
            });
        }

        const sentences = value.split(/[.!?]\s+/);
        const longSentences = sentences.filter((s) => s.split(' ').length > 30);
        longSentences.forEach((s) => {
            issues.push({
                type: 'length',
                message: `Overlong sentence (${s.split(' ').length} words). Consider splitting for clarity.`,
                severity: 'warning',
            });
        });

        if (!value.includes('{{') && value.length > 50) {
            issues.push({
                type: 'variables',
                message:
                    'No variables used. Consider adding {{input}}, {{task}}, or {{user_message}} for dynamic content.',
                severity: 'info',
            });
        }

        return issues.slice(0, 8);
    }, [value]);

    const suggestions = useMemo(() => {
        if (!value || value.length < 10) return [];
        return optimizer.analyze(value, {});
    }, [value]);

    const insertAtCursor = useCallback(
        (text: string) => {
            onChange(value + text);
        },
        [value, onChange],
    );

    const unusedVars = useMemo(() => {
        if (!value) return [];
        return PREDEFINED_VARIABLES.filter((v) => !value.includes(v.value));
    }, [value]);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 1500);
        });
    };

    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: showTemplates ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.1)',
                        border: '1px solid rgba(139,92,246,0.3)',
                        borderRadius: 8,
                        color: 'var(--purple-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <BookOpen size={12} /> Templates{' '}
                    {showTemplates ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <button
                    onClick={() => setShowVars(!showVars)}
                    style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: showVars ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 8,
                        color: '#34d399',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <Variable size={12} /> Variables{' '}
                    {showVars ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
                <button
                    onClick={() => setShowLint(!showLint)}
                    style={{
                        padding: '0.3rem 0.7rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        background: showLint ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
                        border: '1px solid rgba(245,158,11,0.3)',
                        borderRadius: 8,
                        color: 'var(--warning)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <AlertTriangle size={12} /> Lint ({lintIssues.length + suggestions.length}){' '}
                    {showLint ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
            </div>

            {showTemplates && (
                <div
                    style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(139,92,246,0.05)',
                        borderRadius: 10,
                        border: '1px solid rgba(139,92,246,0.15)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: 'var(--purple-muted)',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        Prompt Templates
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {TEMPLATES.map((tpl) => (
                            <button
                                key={tpl.id}
                                onClick={() => onChange(tpl.prompt)}
                                style={{
                                    padding: '0.25rem 0.6rem',
                                    fontSize: '0.65rem',
                                    fontWeight: 600,
                                    background: 'var(--purple-tint)',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                    borderRadius: 6,
                                    color: '#c4b5fd',
                                    cursor: 'pointer',
                                }}
                                title={tpl.prompt.slice(0, 60)}
                            >
                                {tpl.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {showVars && (
                <div
                    style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(16,185,129,0.05)',
                        borderRadius: 10,
                        border: '1px solid rgba(16,185,129,0.15)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            color: '#34d399',
                            marginBottom: '0.5rem',
                            textTransform: 'uppercase',
                        }}
                    >
                        Variables{' '}
                        {unusedVars.length > 0 ? `(${unusedVars.length} available)` : '(all used)'}
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {PREDEFINED_VARIABLES.map((v) => {
                            const isUsed = value.includes(v.value);
                            return (
                                <button
                                    key={v.id}
                                    onClick={() => !isUsed && insertAtCursor(v.value)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 600,
                                        fontFamily: 'monospace',
                                        background: isUsed
                                            ? 'rgba(16,185,129,0.15)'
                                            : 'rgba(16,185,129,0.05)',
                                        border: `1px solid ${isUsed ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.15)'}`,
                                        borderRadius: 6,
                                        color: isUsed ? '#34d399' : '#6ee7b7',
                                        cursor: isUsed ? 'default' : 'pointer',
                                        opacity: isUsed ? 0.6 : 1,
                                    }}
                                    title={v.label}
                                >
                                    {v.value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {showLint && (lintIssues.length > 0 || suggestions.length > 0) && (
                <div
                    style={{
                        marginBottom: '0.75rem',
                        padding: '0.75rem',
                        background: 'rgba(245,158,11,0.05)',
                        borderRadius: 10,
                        border: '1px solid rgba(245,158,11,0.15)',
                    }}
                >
                    {lintIssues.map((iss, i) => (
                        <div
                            key={`lint-${i}`}
                            style={{
                                display: 'flex',
                                gap: 6,
                                alignItems: 'flex-start',
                                padding: '0.3rem 0',
                                fontSize: '0.7rem',
                                color: iss.severity === 'warning' ? '#fbbf24' : '#94a3b8',
                                borderBottom:
                                    i < lintIssues.length - 1
                                        ? '1px solid rgba(255,255,255,0.03)'
                                        : 'none',
                            }}
                        >
                            <AlertTriangle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                            <span>{iss.message}</span>
                        </div>
                    ))}
                    {suggestions.map((s, i) => (
                        <div
                            key={`opt-${i}`}
                            style={{
                                display: 'flex',
                                gap: 6,
                                alignItems: 'flex-start',
                                padding: '0.3rem 0',
                                fontSize: '0.7rem',
                                color: 'var(--purple-muted)',
                                borderBottom:
                                    i < suggestions.length - 1
                                        ? '1px solid rgba(255,255,255,0.03)'
                                        : 'none',
                            }}
                        >
                            <Lightbulb size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <strong>{s.title}</strong>: {s.description}
                                <button
                                    onClick={() => onChange(s.apply(value))}
                                    style={{
                                        marginLeft: 6,
                                        padding: '0.1rem 0.4rem',
                                        fontSize: '0.6rem',
                                        borderRadius: 4,
                                        border: '1px solid rgba(139,92,246,0.3)',
                                        background: 'var(--purple-tint)',
                                        color: 'var(--purple-muted)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <textarea
                rows={10}
                style={{
                    width: '100%',
                    padding: '1.25rem',
                    background: 'var(--slate-950)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'var(--slate-200)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    resize: 'vertical',
                    fontFamily: '"JetBrains Mono", monospace',
                    outline: 'none',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
                    transition: 'border-color 0.2s',
                }}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#3b82f6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                aria-label={t('common.aria.system_prompt')}
            />

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '0.5rem',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.03)',
                }}
            >
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                    <span>
                        Tokens:{' '}
                        <strong
                            style={{
                                color:
                                    tokens > 4000
                                        ? '#ef4444'
                                        : tokens > 2000
                                          ? '#f59e0b'
                                          : '#e2e8f0',
                            }}
                        >
                            {tokens}
                        </strong>
                    </span>
                    <span>
                        Chars: <strong style={{ color: 'var(--slate-200)' }}>{charCount}</strong>
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={() => handleCopy(value, 'prompt')}
                        style={{
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.65rem',
                            borderRadius: 6,
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                        }}
                        title="Copy prompt"
                    >
                        {copied === 'prompt' ? (
                            <Check size={10} color="#10b981" />
                        ) : (
                            <Copy size={10} />
                        )}
                        {copied === 'prompt' ? 'Copied' : 'Copy'}
                    </button>
                </div>
            </div>
        </div>
    );
};
