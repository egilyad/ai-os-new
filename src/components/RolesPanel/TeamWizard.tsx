import React, { useState, useMemo, useCallback } from 'react';
import { Users, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import type { RoleTeam, TeamDomain, TeamTemplate } from '../../kernel/contracts/role-team';
import type { UnifiedRoleEntry } from '../../kernel/contracts/unified-role';
import DomainPicker from './team-wizard/DomainPicker';
import TemplatePicker from './team-wizard/TemplatePicker';
import RoleSelector from './team-wizard/RoleSelector';
import StrategyPicker from './team-wizard/StrategyPicker';
import LeaderAssignment from './team-wizard/LeaderAssignment';
import ConfigStep from './team-wizard/ConfigStep';
import ReviewStep from './team-wizard/ReviewStep';

const STEPS = ['Domain', 'Template', 'Roles', 'Strategy', 'Leader', 'Config', 'Review'];

interface TeamWizardProps {
    templates: TeamTemplate[];
    roles: UnifiedRoleEntry[];
    onSave: (team: Partial<RoleTeam>) => void;
    onCancel: () => void;
}

const TeamWizard: React.FC<TeamWizardProps> = ({ templates, roles, onSave, onCancel }) => {
    const [step, setStep] = useState(0);
    const [team, setTeam] = useState<Partial<RoleTeam>>({
        name: '',
        description: '',
        icon: '👥',
        color: 'var(--accent)',
        coordinationStrategy: 'parallel',
        roleIds: [],
        metadata: { domain: 'custom', tags: [], created: 0, updated: 0 },
        executionConfig: { maxRounds: 3, consensusThreshold: 0.7, parallelTimeout: 30000 },
    });
    const [selectedDomain, setSelectedDomain] = useState<TeamDomain | null>(null);

    const canNext = (): boolean => {
        switch (step) {
            case 0:
            case 1:
            case 3:
            case 5:
                return true;
            case 2:
                return (team.roleIds?.length || 0) >= 1;
            case 4:
                return team.coordinationStrategy !== 'hierarchical' || !!team.leaderRoleId;
            case 6:
                return !!team.name?.trim();
            default:
                return true;
        }
    };

    const nextStep = useCallback(() => {
        if (canNext() && step < 6) setStep(step + 1);
    }, [step, team]);

    const prevStep = useCallback(() => {
        if (step > 0) setStep(step - 1);
    }, [step]);

    const selectTemplate = useCallback((tpl: TeamTemplate) => {
        setTeam({
            name: tpl.name,
            description: tpl.description,
            icon: tpl.icon,
            color: tpl.color,
            coordinationStrategy: tpl.defaultStrategy,
            roleIds: [...tpl.recommendedRoles],
            metadata: { domain: tpl.domain, tags: [], created: 0, updated: 0 },
            executionConfig: { maxRounds: 3, consensusThreshold: 0.7, parallelTimeout: 30000 },
        });
        setStep(6);
    }, []);

    const onSelectDomain = useCallback((domain: TeamDomain) => {
        setSelectedDomain(domain);
    }, []);

    const onSkipTemplate = useCallback(() => setStep(2), []);

    const stepContent = useMemo(
        () => [
            () => (
                <DomainPicker
                    team={team}
                    setTeam={setTeam}
                    selectedDomain={selectedDomain}
                    onSelectDomain={onSelectDomain}
                />
            ),
            () => (
                <TemplatePicker
                    templates={templates}
                    selectedDomain={selectedDomain}
                    onSelectTemplate={selectTemplate}
                    onSkipTemplate={onSkipTemplate}
                />
            ),
            () => <RoleSelector team={team} setTeam={setTeam} roles={roles} />,
            () => <StrategyPicker team={team} setTeam={setTeam} />,
            () => <LeaderAssignment team={team} setTeam={setTeam} />,
            () => <ConfigStep team={team} setTeam={setTeam} />,
            () => <ReviewStep team={team} setTeam={setTeam} />,
        ],
        [team, selectedDomain, templates, roles],
    );

    return (
        <div
            style={{
                marginBottom: 20,
                padding: 20,
                background: 'rgba(59,130,246,0.05)',
                borderRadius: 12,
                border: '1px solid rgba(59,130,246,0.2)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: 'var(--slate-200)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    <Users size={16} />
                    Create Team — Step {step + 1} of 7: {STEPS[step]}
                </h3>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                    }}
                >
                    Cancel
                </button>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
                {STEPS.map((label, i) => (
                    <div
                        key={label}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background:
                                i === step
                                    ? 'rgba(59,130,246,0.2)'
                                    : i < step
                                      ? 'rgba(16,185,129,0.15)'
                                      : 'rgba(255,255,255,0.04)',
                            color: i === step ? '#60a5fa' : i < step ? '#34d399' : '#64748b',
                            border: `1px solid ${
                                i === step
                                    ? 'rgba(59,130,246,0.3)'
                                    : i < step
                                      ? 'rgba(16,185,129,0.2)'
                                      : 'rgba(255,255,255,0.06)'
                            }`,
                            cursor: i < step ? 'pointer' : 'default',
                        }}
                        onClick={() => i < step && setStep(i)}
                    >
                        {i < step ? <Check size={12} /> : `${i + 1}`}
                        {label}
                    </div>
                ))}
            </div>

            {(stepContent[step] as () => React.ReactNode)()}

            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: 20,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <div>
                    {step > 0 && (
                        <button
                            onClick={prevStep}
                            style={{
                                padding: '8px 16px',
                                borderRadius: 8,
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'var(--slate-400)',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <ArrowLeft size={14} /> Back
                        </button>
                    )}
                </div>
                <div>
                    {step < 6 ? (
                        <button
                            onClick={nextStep}
                            disabled={!canNext()}
                            style={{
                                padding: '8px 20px',
                                borderRadius: 8,
                                border: 'none',
                                background: canNext()
                                    ? 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                    : 'rgba(59,130,246,0.15)',
                                color: canNext() ? 'white' : '#64748b',
                                cursor: canNext() ? 'pointer' : 'default',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            Next <ArrowRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (team.name?.trim()) {
                                    onSave(team);
                                }
                            }}
                            disabled={!team.name?.trim()}
                            style={{
                                padding: '8px 24px',
                                borderRadius: 8,
                                border: 'none',
                                background: team.name?.trim()
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'rgba(16,185,129,0.15)',
                                color: team.name?.trim() ? 'white' : '#64748b',
                                cursor: team.name?.trim() ? 'pointer' : 'default',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                            }}
                        >
                            <Check size={14} /> Create Team
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamWizard;
