import { Trophy } from 'lucide-react';
import PanelLoader from './PanelLoader';
import { EloLeaderboard } from './AgentsPanel/EloLeaderboard';

const SocialLeaderboardPanelContent: React.FC = () => (
    <div style={{ padding: 16, height: '100%', overflowY: 'auto' }}>
        <div style={{ marginBottom: 16 }}>
            <h2
                style={{
                    margin: '0 0 4px',
                    fontSize: 18,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                }}
            >
                <Trophy size={20} color="#f59e0b" /> Social Leaderboard
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--slate-400)' }}>
                Agent rankings by ELO rating — performance, trends, and historical data
            </p>
        </div>
        <EloLeaderboard />
    </div>
);

const SocialLeaderboardPanel: React.FC = () => (
    <PanelLoader name="Leaderboard">
        <SocialLeaderboardPanelContent />
    </PanelLoader>
);

export default SocialLeaderboardPanel;
