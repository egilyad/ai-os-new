import { debateEngine, rootLogger } from '../kernel/instances';
import { btn } from './DebateReplayTypes';

const LOGGER = rootLogger.child('DebateReplayLiveControls');

interface Props {
    selectedId: string | null;
}

const DebateReplayLiveControls: React.FC<Props> = ({ selectedId }) => {
    const handlePause = () => {
        if (!selectedId) return;
        try {
            debateEngine.pauseSession(selectedId);
        } catch (e) {
            LOGGER.warn('DebateReplayLiveControls', 'pause failed', { error: e });
        }
    };
    const handleResume = () => {
        if (!selectedId) return;
        try {
            debateEngine.resumeSession(selectedId);
        } catch (e) {
            LOGGER.warn('DebateReplayLiveControls', 'resume failed', { error: e });
        }
    };
    const handleCancel = () => {
        if (!selectedId) return;
        try {
            debateEngine.cancelSession(selectedId);
        } catch (e) {
            LOGGER.warn('DebateReplayLiveControls', 'cancel failed', { error: e });
        }
    };
    return (
        <div style={{ display: 'flex', gap: '0.5rem', padding: '0.3rem 0' }}>
            <button onClick={handlePause} style={btn('rgba(168,85,247,0.1)', '#a855f7')}>
                Pause
            </button>
            <button onClick={handleResume} style={btn('rgba(34,197,94,0.1)', '#22c55e')}>
                Resume
            </button>
            <button onClick={handleCancel} style={btn('rgba(239,68,68,0.1)', '#ef4444')}>
                Cancel
            </button>
        </div>
    );
};

export default DebateReplayLiveControls;
