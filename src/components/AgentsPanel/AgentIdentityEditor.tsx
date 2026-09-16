import React, { useMemo, useState, useEffect } from 'react';
import { lensEngine } from '../../kernel/instances/services-extras';
import { resolveAgentIdentity } from '../../kernel/services/agent-identity';
import { AgentAvatar } from './AgentAvatar';

const AVATAR_EMOJIS = [
    '🤖',
    '🧠',
    '⚡',
    '🛡️',
    '🎯',
    '💡',
    '🔬',
    '🏗️',
    '🌐',
    '🧩',
    '💻',
    '🎨',
    '📊',
    '🔍',
    '⚙️',
    '🚀',
];
const AVATAR_COLORS = [
    '#3b82f6',
    '#10b981',
    '#a855f7',
    '#f59e0b',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
    '#8b5cf6',
];

const fieldStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    color: 'inherit',
    padding: '0.4rem 0.55rem',
    fontSize: '0.8rem',
    width: '100%',
    boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.74rem',
    fontWeight: 600,
    opacity: 0.8,
    margin: '0.6rem 0 0.25rem',
};
const groupStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
};

/**
 * Editor for the canonical Agent Identity (the agent node in the active
 * topology). Writes go through `onUpdateAgent` → `AgentService.updateAgent`,
 * which merges the new fields into the node `config`. Legacy agents that only
 * have a name/role keep working: the form is prefilled from the resolved
 * identity and only the edited fields are written.
 */
const AgentIdentityEditor: React.FC<{
    agentId: string;
    onUpdateAgent: (agentId: string, updates: Record<string, unknown>) => void;
    t: (key: string) => string;
}> = ({ agentId, onUpdateAgent, t }) => {
    const identity = useMemo(() => resolveAgentIdentity(agentId), [agentId]);
    const lenses = useMemo(() => {
        try {
            return lensEngine.listLenses();
        } catch {
            return [];
        }
    }, []);

    const [displayName, setDisplayName] = useState(identity.displayName);
    const [firstName, setFirstName] = useState(identity.firstName ?? '');
    const [lastName, setLastName] = useState(identity.lastName ?? '');
    const [baseRole, setBaseRole] = useState(identity.baseRole);
    const [specializationsText, setSpecializationsText] = useState(
        identity.specializations.join(', '),
    );
    const [selectedLenses, setSelectedLenses] = useState<string[]>(identity.lensIds);
    const [avatarEmoji, setAvatarEmoji] = useState(identity.avatar.emoji);
    const [avatarColor, setAvatarColor] = useState(identity.avatar.color);
    const [avatarUrl, setAvatarUrl] = useState(identity.avatar.url ?? '');
    const [provider, setProvider] = useState(identity.provider ?? '');
    const [model, setModel] = useState(identity.model ?? '');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setSaved(false);
    }, [
        displayName,
        firstName,
        lastName,
        baseRole,
        specializationsText,
        selectedLenses,
        avatarEmoji,
        avatarColor,
        avatarUrl,
        provider,
        model,
    ]);

    const toggleLens = (id: string) =>
        setSelectedLenses((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const previewAvatar = avatarUrl.trim()
        ? { emoji: avatarEmoji, color: avatarColor, url: avatarUrl.trim() }
        : { emoji: avatarEmoji, color: avatarColor };

    const handleSave = () => {
        const specializations = specializationsText
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        const avatar = avatarUrl.trim()
            ? { url: avatarUrl.trim() }
            : { emoji: avatarEmoji, color: avatarColor };
        const updates: Record<string, unknown> = {};
        if (displayName.trim()) updates.displayName = displayName.trim();
        if (firstName.trim()) updates.firstName = firstName.trim();
        if (lastName.trim()) updates.lastName = lastName.trim();
        if (baseRole.trim()) updates.baseRole = baseRole.trim();
        updates.specializations = specializations;
        updates.lensIds = selectedLenses;
        updates.avatar = avatar;
        if (provider.trim()) updates.provider = provider.trim();
        if (model.trim()) updates.model = model.trim();
        onUpdateAgent(agentId, updates);
        setSaved(true);
    };

    return (
        <div
            style={{ padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
        >
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {previewAvatar.url ? (
                    <img
                        src={previewAvatar.url}
                        alt={displayName}
                        width={48}
                        height={48}
                        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
                ) : (
                    <AgentAvatar agentId={agentId} name={displayName} size={48} />
                )}
                <div style={{ fontSize: '0.75rem', opacity: 0.65 }}>
                    {t('agents.identity.preview')}
                </div>
            </div>

            <label style={labelStyle}>{t('agents.identity.display_name')}</label>
            <input
                aria-label={t('agents.identity.display_name')}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={fieldStyle}
            />

            <div style={groupStyle}>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>{t('agents.identity.first_name')}</label>
                    <input
                        aria-label={t('agents.identity.first_name')}
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        style={fieldStyle}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>{t('agents.identity.last_name')}</label>
                    <input
                        aria-label={t('agents.identity.last_name')}
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        style={fieldStyle}
                    />
                </div>
            </div>

            <label style={labelStyle}>{t('agents.identity.base_role')}</label>
            <input
                aria-label={t('agents.identity.base_role')}
                value={baseRole}
                onChange={(e) => setBaseRole(e.target.value)}
                style={fieldStyle}
            />

            <label style={labelStyle}>
                {t('agents.identity.specializations')}{' '}
                <span style={{ opacity: 0.5, fontWeight: 400 }}>
                    ({t('agents.identity.specializations_help')})
                </span>
            </label>
            <input
                aria-label={t('agents.identity.specializations')}
                value={specializationsText}
                onChange={(e) => setSpecializationsText(e.target.value)}
                placeholder="Chemistry, Security"
                style={fieldStyle}
            />

            <label style={labelStyle}>{t('agents.identity.lens')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {lenses.length === 0 && (
                    <span style={{ fontSize: '0.72rem', opacity: 0.5 }}>
                        {t('agents.identity.no_lens')}
                    </span>
                )}
                {lenses.map((l) => (
                    <label
                        key={l.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.74rem',
                            opacity: 0.85,
                            cursor: 'pointer',
                        }}
                    >
                        <input
                            type="checkbox"
                            checked={selectedLenses.includes(l.id)}
                            onChange={() => toggleLens(l.id)}
                        />
                        {l.name}
                    </label>
                ))}
            </div>

            <label style={labelStyle}>{t('agents.identity.avatar')}</label>
            <div style={groupStyle}>
                <select
                    aria-label={t('agents.identity.avatar_emoji')}
                    value={avatarEmoji}
                    onChange={(e) => {
                        setAvatarEmoji(e.target.value);
                        setAvatarUrl('');
                    }}
                    style={{ ...fieldStyle, width: 'auto' }}
                >
                    {AVATAR_EMOJIS.map((em) => (
                        <option key={em} value={em}>
                            {em}
                        </option>
                    ))}
                </select>
                <input
                    aria-label={t('agents.identity.avatar_color')}
                    type="color"
                    value={avatarColor}
                    onChange={(e) => setAvatarColor(e.target.value)}
                    style={{ width: 40, height: 34, background: 'none', border: 'none' }}
                />
            </div>
            <input
                aria-label={t('agents.identity.avatar_url')}
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t('agents.identity.avatar_url')}
                style={fieldStyle}
            />

            <div style={groupStyle}>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>{t('agents.identity.provider')}</label>
                    <input
                        aria-label={t('agents.identity.provider')}
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                        placeholder="groq"
                        style={fieldStyle}
                    />
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                    <label style={labelStyle}>{t('agents.identity.model')}</label>
                    <input
                        aria-label={t('agents.identity.model')}
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="llama-3.3-70b-versatile"
                        style={fieldStyle}
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                style={{
                    marginTop: '0.8rem',
                    alignSelf: 'flex-start',
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0.45rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                }}
            >
                {t('agents.identity.save')}
            </button>
            {saved && (
                <span style={{ color: 'var(--success)', fontSize: '0.78rem' }}>
                    {t('agents.identity.saved')}
                </span>
            )}
        </div>
    );
};

export default AgentIdentityEditor;
