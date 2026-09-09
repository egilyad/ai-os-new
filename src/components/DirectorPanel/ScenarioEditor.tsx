import React, { useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import type { ConversationScenario } from '../../kernel/contracts/conversation/scenario';
import type { TurnProposal } from '../../kernel/contracts/conversation/turn';
import { scenarioRepository } from '../../kernel/instances/services-extras';
import ParticipantsField, { type ParticipantInput } from './ParticipantsField';
import TurnsField from './TurnsField';

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: 'inherit',
    padding: '0.4rem 0.55rem',
    fontSize: '0.8rem',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.78rem',
    fontWeight: 600,
    opacity: 0.8,
    marginBottom: '0.25rem',
};

const btnStyle = (color: string): React.CSSProperties => ({
    background: 'none',
    border: `1px solid ${color}`,
    color,
    cursor: 'pointer',
    padding: '0.3rem 0.7rem',
    borderRadius: 6,
    fontSize: '0.78rem',
});

const ScenarioEditor: React.FC<{
    onSaved?: (scenario: ConversationScenario) => void;
}> = ({ onSaved }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [topic, setTopic] = useState('');
    const [participants, setParticipants] = useState<ParticipantInput[]>([]);
    const [turns, setTurns] = useState<TurnProposal[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const canSave = name.trim().length > 0 && participants.length > 0;

    const handleSave = async () => {
        if (!canSave) {
            setError(
                name.trim().length === 0
                    ? t('director.configure.name_required')
                    : t('director.configure.needs_participant'),
            );
            return;
        }
        setError(null);
        setSaved(false);
        const record = await scenarioRepository.create({
            name: name.trim(),
            description,
            topic: topic.trim() || undefined,
            participants,
            turns,
        });
        setSaved(true);
        onSaved?.(record);
    };

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>{t('director.configure.heading')}</h3>

            <label style={labelStyle}>{t('director.configure.name')}</label>
            <input
                aria-label={t('director.configure.name')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('director.configure.name_placeholder')}
                style={{ ...inputStyle, width: '100%', marginBottom: '0.6rem' }}
            />

            <label style={labelStyle}>{t('director.configure.description')}</label>
            <textarea
                aria-label={t('director.configure.description')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('director.configure.description_placeholder')}
                style={{ ...inputStyle, width: '100%', marginBottom: '0.6rem' }}
            />

            <label style={labelStyle}>{t('director.configure.objective')}</label>
            <input
                aria-label={t('director.configure.objective')}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('director.configure.objective_placeholder')}
                style={{ ...inputStyle, width: '100%', marginBottom: '0.8rem' }}
            />

            <div style={{ marginBottom: '0.8rem' }}>
                <ParticipantsField value={participants} onChange={setParticipants} />
            </div>

            <div style={{ marginBottom: '0.8rem' }}>
                <TurnsField
                    value={turns}
                    participantIds={participants.map((p) => p.id)}
                    onChange={setTurns}
                />
            </div>

            {error && <p style={{ color: 'var(--error)', margin: '0 0 0.5rem' }}>{error}</p>}
            {saved && (
                <p style={{ color: 'var(--success)', margin: '0 0 0.5rem' }}>
                    {t('director.configure.saved')}
                </p>
            )}

            <button onClick={handleSave} style={{ ...btnStyle('#3b82f6'), fontWeight: 600 }}>
                {t('director.configure.save_draft')}
            </button>
        </div>
    );
};

export default ScenarioEditor;
