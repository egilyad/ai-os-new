import React from 'react';
import { FlaskConical } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation';

interface ExperimentalFeature {
    id: string;
    name: string;
    blurb: string;
}

// Collapsed from the ~33 orphaned `ComingSoonPanel` debate sub-service routes
// (Q8 hygiene). These are planned debate sub-capabilities — surfaced here as a
// single discoverable hub instead of 33 dead nav/route stubs.
const FEATURES: ExperimentalFeature[] = [
    {
        id: 'steelman',
        name: 'Steelman',
        blurb: 'Argue the strongest version of the opposing position.',
    },
    {
        id: 'bayesian-judge',
        name: 'Bayesian Judge',
        blurb: 'Probabilistic scoring of claims from evidence.',
    },
    {
        id: 'blind-eval',
        name: 'Blind Eval',
        blurb: 'Evaluate arguments without author attribution.',
    },
    {
        id: 'credibility',
        name: 'Credibility Scorer',
        blurb: 'Source credibility weighting per claim.',
    },
    {
        id: 'calibration',
        name: 'Calibration',
        blurb: 'Track confidence vs. correctness over time.',
    },
    {
        id: 'consistency',
        name: 'Consistency',
        blurb: 'Detect self-contradiction across an agent’s turns.',
    },
    {
        id: 'frame-tracker',
        name: 'Frame Tracker',
        blurb: 'Identify the framing lens applied to a topic.',
    },
    {
        id: 'stance-drift',
        name: 'Stance Drift',
        blurb: 'Detect when an agent drifts from its stated stance.',
    },
    { id: 'insight-bus', name: 'Insight Bus', blurb: 'Cross-panel insight propagation bus.' },
    {
        id: 'entanglement',
        name: 'Entanglement',
        blurb: 'Require agents to engage each other’s claims.',
    },
    {
        id: 'anchoring',
        name: 'Anchoring',
        blurb: 'Detect over-reliance on first-mentioned numbers.',
    },
    {
        id: 'meta-agent',
        name: 'Meta Agent',
        blurb: 'Agent that oversees and corrects other agents.',
    },
    {
        id: 'outcome-forecaster',
        name: 'Outcome Forecaster',
        blurb: 'Predict debate outcome from early turns.',
    },
    {
        id: 'concept-blender',
        name: 'Concept Blender',
        blurb: 'Synthesize novel concepts from two positions.',
    },
    {
        id: 'belief-mining',
        name: 'Belief Mining',
        blurb: 'Extract implicit beliefs from arguments.',
    },
    { id: 'minimax-planner', name: 'Minimax Planner', blurb: 'Adversarial strategy planning.' },
    {
        id: 'expert-witness',
        name: 'Expert Witness',
        blurb: 'Inject domain-expert counter-evidence.',
    },
    { id: 'rhetoric', name: 'Rhetorical Devices', blurb: 'Track persuasion technique usage.' },
    { id: 'bias-profiler', name: 'Bias Profiler', blurb: 'Profile systematic cognitive biases.' },
    {
        id: 'incentive-detector',
        name: 'Incentive Detector',
        blurb: 'Surface hidden incentive structures.',
    },
    {
        id: 'stakeholder',
        name: 'Stakeholder Mapper',
        blurb: 'Map affected stakeholders per claim.',
    },
    { id: 'scratchpad', name: 'Scratchpad', blurb: 'Structured private reasoning workspace.' },
    {
        id: 'persona-mixer',
        name: 'Persona Mixer',
        blurb: 'Blend multiple personas into one voice.',
    },
    { id: 'bop-tracker', name: 'BOP Tracker', blurb: 'Best-of-policy outcome tracker.' },
    {
        id: 'got-deliberation',
        name: 'Graph of Thought',
        blurb: 'Deliberate over a graph of reasoning steps.',
    },
    { id: 'similarity', name: 'Similarity Monitor', blurb: 'Detect redundancy across arguments.' },
    { id: 'drift-detector', name: 'Drift Detector', blurb: 'Persona/tone consistency monitor.' },
    { id: 'shadow-opponent', name: 'Shadow Opponent', blurb: 'Adversarial shadow debate partner.' },
    {
        id: 'adversarial-source',
        name: 'Adversarial Source',
        blurb: 'Inject adversarial evidence sources.',
    },
    {
        id: 'vuln-targeting',
        name: 'Vulnerability Targeting',
        blurb: 'Find weakest link in a position.',
    },
    {
        id: 'justification',
        name: 'Justification Enforcer',
        blurb: 'Require every claim to be justified.',
    },
    { id: 'logical-form', name: 'Logical Form', blurb: 'Translate claims into formal logic.' },
];

const ExperimentalPanel: React.FC = () => {
    const { t } = useTranslation();
    return (
        <div>
            <h2 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FlaskConical size={20} color="#a855f7" />
                {t('experimental.title')}
            </h2>
            <p style={{ opacity: 0.7 }}>{t('experimental.subtitle')}</p>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 10,
                    marginTop: 12,
                }}
            >
                {FEATURES.map((f) => (
                    <div
                        key={f.id}
                        style={{
                            border: '1px solid rgba(168,85,247,0.25)',
                            background: 'rgba(168,85,247,0.06)',
                            borderRadius: 10,
                            padding: '0.7rem 0.8rem',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 6,
                            }}
                        >
                            <span
                                style={{ fontWeight: 700, fontSize: '0.82rem', color: '#e9d5ff' }}
                            >
                                {f.name}
                            </span>
                            <span
                                style={{
                                    fontSize: '0.6rem',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(168,85,247,0.4)',
                                    borderRadius: 999,
                                    padding: '0 6px',
                                }}
                            >
                                {t('experimental.planned')}
                            </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-300)', marginTop: 4 }}>
                            {f.blurb}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ExperimentalPanel;
