import { ThumbsUp, BarChart3 } from 'lucide-react';
import type { HumanVote } from '../../kernel/contracts';
import { debateHumanService, debateService } from '../../kernel/instances';
import {
    debateVotePanel,
    debateVoteHeader,
    debateVoteStatusText,
    debateVoteChoices,
    debateVoteStatusRow,
} from '../../styles/common';
import { Button } from '../Common';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';

interface Props {
    showVotePanel: number | null;
    sessionStatus: string;
    getRoundParticipants: (round: number) => string[];
    getAgentLabel: (id: string) => string;
    humanVotes: HumanVote[];
    setHumanVotes: (v: HumanVote[]) => void;
    setShowVotePanel: (r: number | null) => void;
}

const VotePanelSection: React.FC<Props> = ({
    showVotePanel,
    sessionStatus,
    getRoundParticipants,
    getAgentLabel,
    humanVotes,
    setHumanVotes,
    setShowVotePanel,
}) => {
    if (showVotePanel === null || sessionStatus !== 'active') return null;

    return (
        <div style={debateVotePanel}>
            <div style={debateVoteHeader}>
                <ThumbsUp size={18} color="#a855f7" />
                <span style={debateVoteStatusText}>
                    Round {showVotePanel} — Who made the best argument?
                </span>
            </div>
            <div style={debateVoteChoices}>
                {getRoundParticipants(showVotePanel).map((agentId) => {
                    const isBest = humanVotes.some(
                        (v) =>
                            v.round === showVotePanel &&
                            v.votedAgentId === agentId &&
                            v.score === 5,
                    );
                    return (
                        <button
                            key={agentId}
                            onClick={() => {
                                const wasBest = humanVotes.some(
                                    (v) =>
                                        v.round === showVotePanel &&
                                        v.votedAgentId === agentId &&
                                        v.score === 5,
                                );
                                if (wasBest) {
                                    debateHumanService.removeHumanVote(
                                        debateService.getActiveDebateSession(),
                                        showVotePanel,
                                        'human',
                                        agentId,
                                    );
                                } else {
                                    debateHumanService.recordHumanVote(
                                        debateService.getActiveDebateSession(),
                                        {
                                            round: showVotePanel,
                                            voter: 'human',
                                            votedAgentId: agentId,
                                            score: 5,
                                            timestamp: Date.now(),
                                        },
                                    );
                                }
                                setHumanVotes(
                                    debateHumanService.getHumanVotes(
                                        debateService.getActiveDebateSession(),
                                    ),
                                );
                            }}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: isBest
                                    ? 'rgba(250,204,21,0.15)'
                                    : 'rgba(255,255,255,0.03)',
                                color: isBest ? '#facc15' : '#cbd5e1',
                            }}
                        >
                            {isBest ? '★' : '☆'}{' '}
                            {resolveAgentIdentity(agentId).displayName || getAgentLabel(agentId)}
                        </button>
                    );
                })}
            </div>
            {humanVotes.filter((v) => v.round === showVotePanel).length > 0 && (
                <div style={debateVoteStatusRow}>
                    <BarChart3 size={14} color="#10b981" />
                    <span style={debateVoteStatusText}>
                        Vote recorded — {humanVotes.filter((v) => v.round === showVotePanel).length}{' '}
                        agent(s) marked as best
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowVotePanel(null)}
                        style={{ marginLeft: 'auto' }}
                    >
                        Dismiss
                    </Button>
                </div>
            )}
        </div>
    );
};

export default VotePanelSection;
