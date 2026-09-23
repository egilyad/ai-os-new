import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { projectObservabilityService } from '../../kernel/instances/services-extras';
import { Button } from '../../components/Common';
import type { ActivityEvent, ToolCallRecord, ErrorRecord, FileChangeRecord } from '../../kernel/types/observability-types';

const CARD: React.CSSProperties = { margin: '0.5rem 0', padding: '0.6rem 0.75rem', borderRadius: 8, border: '1px solid #2a2a35', background: 'rgba(59,130,246,0.08)' };
const TAB_BTN = (active: boolean): React.CSSProperties => ({ padding: '0.35rem 0.75rem', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.8rem', background: active ? '#3b82f6' : 'transparent', color: active ? '#fff' : 'inherit', opacity: active ? 1 : 0.6 });
const ROW: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' };

type Tab = 'activity' | 'tools' | 'errors' | 'files';

interface ActivitiesPanelProps {
    projectId: string;
}

const ActivitiesPanel: React.FC<ActivitiesPanelProps> = ({ projectId }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>('activity');
    const [activity, setActivity] = useState<ActivityEvent[]>([]);
    const [toolCalls, setToolCalls] = useState<ToolCallRecord[]>([]);
    const [errors, setErrors] = useState<ErrorRecord[]>([]);
    const [fileChanges, setFileChanges] = useState<FileChangeRecord[]>([]);

    const load = () => {
        const svc = projectObservabilityService;
        setActivity(svc.getActivity(projectId, 50));
        setToolCalls(svc.getToolCalls(projectId, 50));
        setErrors(svc.getErrors(projectId));
        setFileChanges(svc.getFileChanges(projectId, 50));
    };

    useEffect(() => { load(); }, [projectId]);

    return (
        <div>
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
                {(['activity', 'tools', 'errors', 'files'] as Tab[]).map((tab) => (
                    <button key={tab} style={TAB_BTN(activeTab === tab)} onClick={() => setActiveTab(tab)}>
                        {t(`observability.${tab === 'activity' ? 'title' : tab === 'tools' ? 'toolCalls' : tab === 'errors' ? 'errors' : 'fileChanges'}`)}
                    </button>
                ))}
            </div>

            {activeTab === 'activity' && (
                <div>
                    <h4 style={{ margin: '0 0 0.5rem' }}>{t('observability.title')}</h4>
                    {activity.length === 0 && <p style={{ opacity: 0.5 }}>No activity yet.</p>}
                    {activity.map((e) => (
                        <div key={e.id} style={ROW}>
                            <span>{e.type}{e.agentId ? ` (${e.agentId})` : ''}</span>
                            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'tools' && (
                <div>
                    <h4 style={{ margin: '0 0 0.5rem' }}>{t('observability.toolCalls')}</h4>
                    {toolCalls.length === 0 && <p style={{ opacity: 0.5 }}>No tool calls yet.</p>}
                    {toolCalls.map((tc) => (
                        <div key={tc.id} style={ROW}>
                            <span>{tc.toolName} <span style={{ opacity: 0.5 }}>({tc.agentId})</span></span>
                            <span style={{ fontSize: '0.75rem' }}>
                                {tc.success ? <span style={{ color: '#22c55e' }}>OK</span> : <span style={{ color: '#ef4444' }}>FAIL</span>}
                                {' '}{tc.durationMs}ms
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'errors' && (
                <div>
                    <h4 style={{ margin: '0 0 0.5rem' }}>{t('observability.errors')}</h4>
                    {errors.length === 0 && <p style={{ opacity: 0.5 }}>No errors.</p>}
                    {errors.map((e) => (
                        <div key={e.id} style={{ ...CARD, borderLeft: `3px solid ${e.severity === 'critical' ? '#ef4444' : e.severity === 'error' ? '#f97316' : '#eab308'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{e.source}</span>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>{e.severity}</span>
                            </div>
                            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>{e.message}</div>
                            {!e.resolved && (
                                <Button variant="ghost" size="sm" style={{ marginTop: '0.3rem' }} onClick={() => { projectObservabilityService.resolveError(projectId, e.id); load(); }}>
                                    {t('observability.resolve')}
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'files' && (
                <div>
                    <h4 style={{ margin: '0 0 0.5rem' }}>{t('observability.fileChanges')}</h4>
                    {fileChanges.length === 0 && <p style={{ opacity: 0.5 }}>No file changes yet.</p>}
                    {fileChanges.map((fc) => (
                        <div key={fc.id} style={ROW}>
                            <span>
                                <span style={{ color: fc.changeType === 'created' ? '#22c55e' : fc.changeType === 'deleted' ? '#ef4444' : '#3b82f6' }}>
                                    {fc.changeType === 'created' ? '+' : fc.changeType === 'deleted' ? '-' : '~'}
                                </span>
                                {' '}{fc.filePath}
                            </span>
                            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>{fc.sizeBytes}B</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivitiesPanel;
