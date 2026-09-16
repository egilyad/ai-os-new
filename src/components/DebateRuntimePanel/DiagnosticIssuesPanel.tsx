import { AlertCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/useTranslation';
import type { CognitiveIssue } from '../../kernel/instances';
import { debateRuntimeIssuePanel } from '../../styles/common';

interface DiagnosticIssuesPanelProps {
    issues: CognitiveIssue[];
}

export function DiagnosticIssuesPanel({ issues }: DiagnosticIssuesPanelProps) {
    const { t } = useTranslation();
    if (issues.length === 0) return null;
    return (
        <div style={debateRuntimeIssuePanel}>
            <h4
                style={{
                    margin: '0 0 0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#fca5a5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                }}
            >
                <AlertCircle size={14} />{' '}
                {t('debate_runtime.active_issues', { count: issues.length })}
            </h4>
            {issues.map((issue) => (
                <div
                    key={issue.message}
                    style={{
                        padding: '0.4rem 0.6rem',
                        marginBottom: '0.25rem',
                        borderRadius: 6,
                        fontSize: '0.75rem',
                        background:
                            issue.severity === 'critical'
                                ? 'rgba(239,68,68,0.1)'
                                : 'rgba(245,158,11,0.1)',
                        color: issue.severity === 'critical' ? '#fca5a5' : '#fbbf24',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <span
                        style={{
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            fontSize: '0.65rem',
                        }}
                    >
                        {issue.severity}
                    </span>
                    {issue.message}
                </div>
            ))}
        </div>
    );
}
