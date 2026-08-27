import { CheckCircle2, Wrench } from 'lucide-react';
import type { AgentDetailPanelProps } from './AgentDetailPanelProps';

type Props = Pick<AgentDetailPanelProps, 'agent' | 'availableTools' | 'onUpdateAgent'>;

const AgentCapabilitiesTab: React.FC<Props> = ({ agent, availableTools, onUpdateAgent }) => (
    <div className="agents-tools-grid">
        {availableTools.map((tool) => {
            const isEquipped = agent.tools.includes(tool.id);
            const toggleTool = () => {
                const newTools = isEquipped
                    ? agent.tools.filter((id) => id !== tool.id)
                    : [...agent.tools, tool.id];
                onUpdateAgent(agent.id, { tools: newTools });
            };
            return (
                <div
                    key={tool.id}
                    onClick={toggleTool}
                    className={`agents-tool-item${isEquipped ? ' agents-tool-item--equipped' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isEquipped}
                    aria-label={`${tool.name}${isEquipped ? ' (equipped)' : ''}`}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleTool();
                        }
                    }}
                >
                    <div
                        className={`agents-tool-icon${isEquipped ? ' agents-tool-icon--equipped' : ''}`}
                    >
                        {isEquipped ? (
                            <CheckCircle2 size={18} color="white" />
                        ) : (
                            <Wrench size={18} color="#64748b" />
                        )}
                    </div>
                    <div className="agents-tool-info">
                        <div
                            className={`agents-tool-name${isEquipped ? ' agents-tool-name--equipped' : ''}`}
                        >
                            {tool.name}
                        </div>
                        <div className="agents-tool-desc">
                            {tool.description || 'No tool description.'}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

export default AgentCapabilitiesTab;
