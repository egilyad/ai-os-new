import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<AgentDetailPanelProps, 'agent' | 'onUpdateAgent'>;

const AgentInfraTab: React.FC<Props> = ({ agent, onUpdateAgent }) => (
    <div className="agents-infra-panel">
        <div className="agents-infra-row">
            <div className="agents-infra-header">
                <label className="agents-infra-label" htmlFor="agents-temp-slider">
                    Entropy (Temperature)
                </label>
                <span className="agents-infra-value-badge">{agent.temperature}</span>
            </div>
            <input
                id="agents-temp-slider"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={agent.temperature}
                onChange={(e) =>
                    onUpdateAgent(agent.id, { temperature: parseFloat(e.target.value) })
                }
                className="agents-infra-slider"
            />
            <div className="agents-infra-range">
                <span>Strict (0.0)</span>
                <span>Creative (2.0)</span>
            </div>
        </div>
    </div>
);

export default AgentInfraTab;
