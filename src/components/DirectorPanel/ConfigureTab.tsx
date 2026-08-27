import React from 'react';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import ScenarioEditor from './ScenarioEditor';

const ConfigureTab: React.FC<{
    onSaved?: (scenario: ConversationScenario) => void;
}> = ({ onSaved }) => {
    return <ScenarioEditor onSaved={onSaved} />;
};

export default ConfigureTab;
