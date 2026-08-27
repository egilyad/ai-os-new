import React, { useState, useCallback } from 'react';
import type { CognitiveTrace } from '../../kernel/instances';
import MicroscopeTimeline from './MicroscopeTimeline';
import StepAnalysisPanel from './StepAnalysisPanel';

interface Props {
    trace: CognitiveTrace;
    onClose?: () => void;
}

const CognitiveMicroscope: React.FC<Props> = ({ trace, onClose }) => {
    const [selectedStepId, setSelectedStepId] = useState<string | null>(trace.steps[0]?.id || null);
    const selectedStep = trace.steps.find((s) => s.id === selectedStepId);
    const handleKeyDown = useCallback((e: React.KeyboardEvent, stepId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setSelectedStepId(stepId);
        }
    }, []);

    return (
        <div
            style={{
                height: '100%',
                display: 'grid',
                gridTemplateColumns: '320px 1fr',
                overflow: 'hidden',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(10px)',
            }}
        >
            <MicroscopeTimeline
                trace={trace}
                selectedStepId={selectedStepId}
                onSelectStep={setSelectedStepId}
                onKeyDown={handleKeyDown}
            />
            <div style={{ overflowY: 'auto', padding: '2rem' }}>
                <StepAnalysisPanel step={selectedStep} onClose={onClose} />
            </div>
        </div>
    );
};

export default CognitiveMicroscope;
