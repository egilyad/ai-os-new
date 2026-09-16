import { MessageSquare } from 'lucide-react';
import StrategySelector from './StrategySelector';
import {
    textCenter,
    stepCardPanel,
    h3StepTitle,
    iconCircleBase,
    pageSubtitleMuted,
} from '../../styles/common';

interface TopicStepProps {
    topic: string;
    onTopicChange: (v: string) => void;
    strategy: string;
    onStrategyChange: (v: string) => void;
    maxRounds: number;
    onMaxRoundsChange: (v: number) => void;
    debateTemperature?: number;
    onTemperatureChange?: (v: number) => void;
    t: (key: string) => string;
}

const TopicStep: React.FC<TopicStepProps> = ({
    topic,
    onTopicChange,
    strategy,
    onStrategyChange,
    maxRounds,
    onMaxRoundsChange,
    t,
}) => {

    return (
        <div style={stepCardPanel}>
            <div style={textCenter}>
                <div style={iconCircleBase}>
                    <MessageSquare size={40} color="#a855f7" />
                </div>
                <h3 style={h3StepTitle}>{t('debate.config_title')}</h3>
                <p style={pageSubtitleMuted}>{t('debate.config_desc')}</p>
            </div>

            <div>
                <label className="debate-label debate-label--block">{t('debate.thesis')}</label>
                <textarea
                    rows={3}
                    placeholder={t('debate.thesis_placeholder')}
                    aria-label={t('debate.thesis')}
                    className="debate-input debate-textarea"
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                />
            </div>

            <div>
                <label className="debate-label debate-label--block">{t('debate.strategy')}</label>
                <StrategySelector value={strategy} onChange={onStrategyChange} t={t} />
            </div>

            <div>
                <label className="debate-label debate-label--block">
                    {t('debate.max_rounds')}
                </label>
                <input
                    type="number"
                    min={2}
                    max={50}
                    value={maxRounds}
                    onChange={(e) => onMaxRoundsChange(parseInt(e.target.value) || 10)}
                    aria-label={t('debate.max_rounds')}
                    className="debate-input"
                />
            </div>
        </div>
    );
};

export default TopicStep;
