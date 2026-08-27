import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProbeResult } from '../../kernel/contracts/probe';
import type {
    AutoDebateResult,
    BatchTestResult,
    ProviderWinRate,
} from '../../kernel/contracts/auto-debate';
import TopicStep from './TopicStep';
import AgentsStep from './AgentsStep';
import ReviewStep from './ReviewStep';
import WizardStepIndicator from './WizardStepIndicator';
import WizardNav from './WizardNav';

interface DebateSetupWizardProps {
    topic: string;
    onTopicChange: (value: string) => void;
    strategy: import('../../kernel/contracts/debate-types').DebateSessionStrategy;
    onStrategyChange: (
        value: import('../../kernel/contracts/debate-types').DebateSessionStrategy,
    ) => void;
    maxRounds: number;
    onMaxRoundsChange: (value: number) => void;
    debateTemperature: number;
    onTemperatureChange: (value: number) => void;
    agentArchetypes: Record<string, string>;
    onArchetypeChange: (id: string) => void;
    selectedAgents: string[];
    onToggleAgent: (id: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    availableAgents: Array<{ id: string; label: string }>;
    agentConstraints: Record<string, string>;
    onConstraintChange: (agentId: string, constraint: string) => void;
    probeResults: Map<string, ProbeResult> | null;
    probeLoading: boolean;
    onProbe: () => void;
    expandedProbe: string | null;
    onToggleProbe: (id: string | null) => void;
    actionLoading: 'start' | 'inject' | null;
    onStart: () => void;
    showAuto: boolean;
    onToggleAuto: () => void;
    autoResults: AutoDebateResult[];
    autoWinRates: ProviderWinRate[];
    onAutoDebate: (options?: {
        topic?: string;
        category?: string;
        maxParticipants?: number;
        maxRounds?: number;
    }) => Promise<AutoDebateResult>;
    onStressTest: (count?: number) => Promise<AutoDebateResult[]>;
    onBatchTest: (topic: string, runs?: number) => Promise<BatchTestResult>;
    onClearAuto: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
    selectedHistoricalCount: number;
    onOpenHistoricalFigures: () => void;
}

const DebateSetupWizard: React.FC<DebateSetupWizardProps> = ({
    topic,
    onTopicChange,
    strategy,
    onStrategyChange,
    maxRounds,
    onMaxRoundsChange,
    debateTemperature,
    onTemperatureChange,
    agentArchetypes,
    onArchetypeChange,
    selectedAgents,
    onToggleAgent,
    onSelectAll,
    onDeselectAll,
    availableAgents,
    agentConstraints,
    onConstraintChange,
    probeResults,
    probeLoading,
    onProbe,
    expandedProbe,
    onToggleProbe,
    actionLoading,
    onStart,
    showAuto,
    onToggleAuto,
    autoResults,
    autoWinRates,
    onAutoDebate,
    onStressTest,
    onBatchTest,
    onClearAuto,
    t,
    selectedHistoricalCount,
    onOpenHistoricalFigures,
}) => {
    const [step, setStep] = useState(0);

    const canNextStep = () => {
        if (step === 0) return topic.trim().length > 0;
        if (step === 1) return selectedAgents.length + selectedHistoricalCount >= 2;
        return true;
    };

    return (
        <div style={{ flex: 1, display: 'flex', padding: '3rem', overflowY: 'auto' }}>
            <div
                style={{
                    width: '100%',
                    maxWidth: 750,
                    margin: '0 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                }}
            >
                <WizardStepIndicator step={step} onNavigate={setStep} t={t} />

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.2 }}
                    >
                        {step === 0 && (
                            <TopicStep
                                topic={topic}
                                onTopicChange={onTopicChange}
                                strategy={strategy}
                                onStrategyChange={onStrategyChange as (v: string) => void}
                                maxRounds={maxRounds}
                                onMaxRoundsChange={onMaxRoundsChange}
                                debateTemperature={debateTemperature}
                                onTemperatureChange={onTemperatureChange}
                                t={t}
                            />
                        )}
                        {step === 1 && (
                            <AgentsStep
                                selectedAgents={selectedAgents}
                                onToggleAgent={onToggleAgent}
                                onSelectAll={onSelectAll}
                                onDeselectAll={onDeselectAll}
                                availableAgents={availableAgents}
                                strategy={strategy}
                                agentConstraints={agentConstraints}
                                onConstraintChange={onConstraintChange}
                                agentArchetypes={agentArchetypes}
                                onArchetypeChange={onArchetypeChange}
                                selectedHistoricalCount={selectedHistoricalCount}
                                onOpenHistoricalFigures={onOpenHistoricalFigures}
                                t={t}
                            />
                        )}
                        {step === 2 && (
                            <ReviewStep
                                topic={topic}
                                strategy={strategy}
                                maxRounds={maxRounds}
                                debateTemperature={debateTemperature}
                                selectedAgents={selectedAgents}
                                availableAgents={availableAgents}
                                probeResults={probeResults}
                                probeLoading={probeLoading}
                                onProbe={onProbe}
                                expandedProbe={expandedProbe}
                                onToggleProbe={onToggleProbe}
                                actionLoading={actionLoading}
                                onStart={onStart}
                                showAuto={showAuto}
                                onToggleAuto={onToggleAuto}
                                autoResults={autoResults}
                                autoWinRates={autoWinRates}
                                onAutoDebate={onAutoDebate}
                                onStressTest={onStressTest}
                                onBatchTest={onBatchTest}
                                onClearAuto={onClearAuto}
                                t={t}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                <WizardNav
                    step={step}
                    maxSteps={3}
                    canNext={canNextStep()}
                    onBack={() => setStep((s) => Math.max(0, s - 1))}
                    onNext={() => setStep((s) => Math.min(2, s + 1))}
                />
            </div>
        </div>
    );
};

export default DebateSetupWizard;
