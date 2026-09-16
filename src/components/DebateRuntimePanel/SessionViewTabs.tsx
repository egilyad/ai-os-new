import { MessageSquare, Sliders } from 'lucide-react';
import type {
    DebateSessionSnapshot,
    CognitiveMetricsSnapshot,
    CognitivePressure,
    DebateArgument,
} from '../../kernel/instances';
import { SessionOverviewTab } from './SessionOverviewTab';
import { AgentControlPanel } from './AgentControlPanel';
import DebateChat from '../DebatePanel/DebateChat';
import {
    debateRuntimeArgumentsPanel,
    debateRuntimeEmptyState,
    debateRuntimeTabBar,
} from '../../styles/common';
import { Button } from '../Common';

interface SessionViewTabsProps {
    selected: DebateSessionSnapshot;
    sessionViewTab: 'overview' | 'arguments' | 'controls';
    setSessionViewTab: (tab: 'overview' | 'arguments' | 'controls') => void;
    sessionArgs: Map<string, DebateArgument[]>;
    thinkingAgentId: string | undefined;
    cognitiveMetrics: CognitiveMetricsSnapshot | null;
    cognitivePressure: CognitivePressure | null;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const SessionViewTabs: React.FC<SessionViewTabsProps> = ({
    selected,
    sessionViewTab,
    setSessionViewTab,
    sessionArgs,
    thinkingAgentId,
    cognitiveMetrics,
    cognitivePressure,
    t,
}) => {
    const currentArgs = sessionArgs.get(selected.id) || [];
    const streamingIds = new Set(
        currentArgs.filter((a) => a.id.startsWith('streaming-')).map((a) => a.id),
    );

    return (
        <>
            <div style={debateRuntimeTabBar}>
                <Button
                    variant="ghost"
                    onClick={() => setSessionViewTab('overview')}
                    style={{
                        color: sessionViewTab === 'overview' ? '#a78bfa' : '#64748b',
                        borderBottom:
                            sessionViewTab === 'overview'
                                ? '2px solid #a78bfa'
                                : '2px solid transparent',
                    }}
                >
                    {t('debate_runtime.overview')}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setSessionViewTab('arguments')}
                    style={{
                        color: sessionViewTab === 'arguments' ? '#a78bfa' : '#64748b',
                        borderBottom:
                            sessionViewTab === 'arguments'
                                ? '2px solid #a78bfa'
                                : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <MessageSquare size={14} /> {t('debate_runtime.arguments')}
                    {currentArgs.length > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--slate-400)' }}>
                            ({currentArgs.length})
                        </span>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => setSessionViewTab('controls')}
                    style={{
                        color: sessionViewTab === 'controls' ? '#a78bfa' : '#64748b',
                        borderBottom:
                            sessionViewTab === 'controls'
                                ? '2px solid #a78bfa'
                                : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                    }}
                >
                    <Sliders size={14} /> {t('debate_runtime.controls')}
                </Button>
            </div>

            {sessionViewTab === 'overview' ? (
                <SessionOverviewTab
                    selected={selected}
                    thinkingAgentId={thinkingAgentId}
                    cognitiveMetrics={cognitiveMetrics}
                    cognitivePressure={cognitivePressure}
                />
            ) : sessionViewTab === 'arguments' ? (
                <div style={debateRuntimeArgumentsPanel}>
                    {currentArgs.length === 0 ? (
                        <div style={debateRuntimeEmptyState}>
                            {t('debate_runtime.no_arguments_yet')}
                        </div>
                    ) : (
                        <DebateChat
                            arguments={currentArgs}
                            isActive={
                                selected.phase === 'active' || selected.phase === 'deliberating'
                            }
                            t={(key: string) => t(`debate.${key}`) as string}
                            streamingArgIds={streamingIds}
                        />
                    )}
                </div>
            ) : (
                <AgentControlPanel session={selected} />
            )}
        </>
    );
};

export default SessionViewTabs;
