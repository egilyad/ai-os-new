import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { groupManager, keyService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('GroupsPanel');
import { useKeyStore, refreshKeyStore } from '../../stores/useKeyStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Users, Plus, Check, X, Shield, FolderTree } from 'lucide-react';
import type { KeyGroup } from '../../kernel/contracts/group-manager';
import GroupDetail from './GroupDetail';

const CARD: React.CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};

const GroupsPanel: React.FC = () => {
    const { t } = useTranslation();
    const keys = useKeyStore((s) => s.keys);
    const [groups, setGroups] = useState<KeyGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setGroups(groupManager.getGroups());
        refreshKeyStore();
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const selectedGroup = useMemo(
        () => groups.find((g) => g.id === selectedGroupId) ?? null,
        [groups, selectedGroupId],
    );

    const groupKeys = useMemo(() => {
        if (!selectedGroup) return [];
        return keys.filter((k) => selectedGroup.keyIds.includes(k.id));
    }, [selectedGroup, keys]);

    const poolStatsByProvider = useMemo(() => {
        const providers = [...new Set(groupKeys.map((k) => k.provider))];
        return providers.map((p) => ({
            provider: p,
            burst: keyService.getBurstCapacity(p),
            quota: keyService.getQuotaShare(p),
        }));
    }, [groupKeys]);

    const unassignedKeys = useMemo(() => {
        if (!selectedGroup) return [];
        const defaultGroup = groups.find((g) => g.id === '__default__');
        if (!defaultGroup) return [];
        return keys.filter((k) => defaultGroup.keyIds.includes(k.id));
    }, [selectedGroup, groups, keys]);

    const handleCreate = async () => {
        if (!createName.trim()) return;
        try {
            await groupManager.createGroup(createName.trim());
            setCreateName('');
            setCreateOpen(false);
            await refresh();
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const handleRename = async (id: string, name: string) => {
        if (!name.trim()) return;
        try {
            await groupManager.renameGroup(id, name.trim());
            await refresh();
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const handleDelete = async (id: string) => {
        if (id === '__default__') return;
        try {
            await groupManager.deleteGroup(id);
            if (selectedGroupId === id) setSelectedGroupId(null);
            await refresh();
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const handleMoveKey = async (keyId: string, targetGroup: string) => {
        try {
            await groupManager.assignKeyToGroup(keyId, targetGroup);
            await refresh();
        } catch (e) {
            LOGGER.error('Failed to move key', String(e));
            setError('Failed to move key to group');
        }
    };

    if (groups.length === 0) {
        return (
            <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto', color: 'var(--slate-200)' }}>
                {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                    <FolderTree size={24} color="#3b82f6" />
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                        {t('groups.title')}
                    </h1>
                </div>
                <div style={{ ...CARD, textAlign: 'center', padding: 40 }}>
                    <Users size={40} color="#64748b" style={{ marginBottom: 12 }} />
                    <div style={{ color: 'var(--slate-400)', marginBottom: 16 }}>{t('groups.empty')}</div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={{
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: 8,
                            padding: '0.5rem 1rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                        }}
                    >
                        <Plus size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />{' '}
                        {t('groups.create')}
                    </button>
                </div>
                {createOpen && (
                    <CreateGroupForm
                        name={createName}
                        onNameChange={setCreateName}
                        onSave={handleCreate}
                        onCancel={() => {
                            setCreateOpen(false);
                            setCreateName('');
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div
            style={{
                padding: 24,
                maxWidth: 1200,
                margin: '0 auto',
                color: 'var(--slate-200)',
                display: 'flex',
                gap: 20,
                height: 'calc(100vh - 120px)',
            }}
        >
            {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}
            <div
                style={{
                    width: 260,
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FolderTree size={18} color="#3b82f6" />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            {t('groups.title')}
                        </span>
                    </div>
                    <button
                        onClick={() => setCreateOpen(true)}
                        style={{
                            background: 'rgba(59,130,246,0.15)',
                            color: '#60a5fa',
                            border: 'none',
                            borderRadius: 6,
                            padding: '0.3rem 0.5rem',
                            cursor: 'pointer',
                        }}
                        title={t('groups.create')}
                        aria-label={t('groups.create')}
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div
                    style={{
                        flex: 1,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                    }}
                >
                    {groups.map((g) => {
                        const isDefault = g.id === '__default__';
                        return (
                            <button
                                key={g.id}
                                onClick={() => {
                                    setSelectedGroupId(g.id);
                                    setCreateOpen(false);
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    background:
                                        selectedGroupId === g.id
                                            ? 'rgba(59,130,246,0.12)'
                                            : 'transparent',
                                    border:
                                        selectedGroupId === g.id
                                            ? '1px solid rgba(59,130,246,0.25)'
                                            : '1px solid transparent',
                                    borderRadius: 8,
                                    padding: '0.55rem 0.75rem',
                                    cursor: 'pointer',
                                    color: selectedGroupId === g.id ? '#e2e8f0' : '#94a3b8',
                                    fontSize: '0.82rem',
                                    textAlign: 'left',
                                    width: '100%',
                                    transition: 'all 0.15s',
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    {isDefault ? (
                                        <Shield size={14} color="#64748b" />
                                    ) : (
                                        <FolderTree size={14} color="#60a5fa" />
                                    )}
                                    <span
                                        style={{ fontWeight: selectedGroupId === g.id ? 600 : 400 }}
                                    >
                                        {g.name}
                                    </span>
                                </span>
                                <span
                                    style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--slate-500)',
                                        background: 'rgba(148,163,184,0.1)',
                                        borderRadius: 10,
                                        padding: '0.1rem 0.45rem',
                                    }}
                                >
                                    {g.keyIds.length}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {createOpen && (
                    <div style={{ ...CARD, padding: '0.75rem' }}>
                        <input
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            placeholder={t('groups.name_placeholder')}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            style={{
                                width: '100%',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(148,163,184,0.2)',
                                borderRadius: 6,
                                padding: '0.4rem 0.6rem',
                                color: 'var(--slate-200)',
                                fontSize: '0.8rem',
                                outline: 'none',
                                marginBottom: 6,
                            }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button
                                onClick={handleCreate}
                                style={{
                                    background: 'rgba(59,130,246,0.2)',
                                    color: '#60a5fa',
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '0.3rem 0.75rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <Check size={12} style={{ marginRight: 4 }} /> {t('common.save')}
                            </button>
                            <button
                                onClick={() => {
                                    setCreateOpen(false);
                                    setCreateName('');
                                }}
                                style={{
                                    background: 'transparent',
                                    color: 'var(--slate-400)',
                                    border: 'none',
                                    padding: '0.3rem 0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                }}
                            >
                                <X size={12} style={{ marginRight: 4 }} /> {t('common.cancel')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
                {selectedGroup ? (
                    <GroupDetail
                        group={selectedGroup}
                        groups={groups}
                        groupKeys={groupKeys}
                        unassignedKeys={unassignedKeys}
                        poolStatsByProvider={poolStatsByProvider}
                        onRename={handleRename}
                        onDelete={handleDelete}
                        onMoveKey={handleMoveKey}
                        refresh={refresh}
                    />
                ) : (
                    <div style={{ ...CARD, textAlign: 'center', padding: 60 }}>
                        <FolderTree size={48} color="#64748b" style={{ marginBottom: 12 }} />
                        <div style={{ color: 'var(--slate-400)', fontSize: '0.9rem' }}>
                            {t('groups.select_hint')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ErrorBanner: React.FC<{ error: string; onDismiss: () => void }> = ({ error, onDismiss }) => (
    <button
        onClick={onDismiss}
        style={{
            position: 'fixed',
            top: 20,
            right: 20,
            padding: '8px 14px',
            borderRadius: 6,
            fontSize: 11,
            background: 'rgba(239,68,68,0.9)',
            color: '#fff',
            zIndex: 9999,
            cursor: 'pointer',
            border: 'none',
        }}
    >
        {error}
    </button>
);

const CreateGroupForm: React.FC<{
    name: string;
    onNameChange: (n: string) => void;
    onSave: () => void;
    onCancel: () => void;
}> = ({ name, onNameChange, onSave, onCancel }) => {
    const { t } = useTranslation();
    return (
        <div style={{ ...CARD, marginTop: 16, padding: '1rem' }}>
            <input
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                placeholder={t('groups.name_placeholder')}
                onKeyDown={(e) => e.key === 'Enter' && onSave()}
                style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(148,163,184,0.2)',
                    borderRadius: 8,
                    padding: '0.5rem 0.75rem',
                    color: 'var(--slate-200)',
                    fontSize: '0.85rem',
                    outline: 'none',
                    marginBottom: 8,
                }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
                <button
                    onClick={onSave}
                    style={{
                        background: 'rgba(59,130,246,0.2)',
                        color: '#60a5fa',
                        border: '1px solid rgba(59,130,246,0.3)',
                        borderRadius: 8,
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('common.save')}
                </button>
                <button
                    onClick={onCancel}
                    style={{
                        background: 'transparent',
                        color: 'var(--slate-400)',
                        border: 'none',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                    }}
                >
                    {t('common.cancel')}
                </button>
            </div>
        </div>
    );
};

export default GroupsPanel;
