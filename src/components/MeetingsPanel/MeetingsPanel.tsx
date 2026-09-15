import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { meetingService } from '../../kernel/instances/services-extras';
import type { Meeting } from '../../kernel/types/meeting-types';

export default function MeetingsPanel() {
    const { t } = useTranslation();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newAgenda, setNewAgenda] = useState('');

    useEffect(() => {
        loadMeetings();
    }, []);

    const loadMeetings = async () => {
        try {
            const list = await meetingService.list();
            setMeetings(list);
        } catch {
            // service not registered
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            await meetingService.create({
                title: newTitle,
                agenda: newAgenda,
                scheduledAt: Date.now(),
                creatorType: 'human',
                creatorId: 'current-user',
            });
            setNewTitle('');
            setNewAgenda('');
            await loadMeetings();
        } catch {
            // error
        } finally {
            setCreating(false);
        }
    };

    const handleStart = async (id: string) => {
        await meetingService.start(id);
        await loadMeetings();
    };

    const handleComplete = async (id: string) => {
        await meetingService.complete(id);
        await loadMeetings();
    };

    const handleCancel = async (id: string) => {
        await meetingService.cancel(id);
        await loadMeetings();
    };

    if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div style={{ padding: 20 }}>
            <h2>{t('meeting.title')}</h2>

            <div style={{ marginBottom: 20 }}>
                <input
                    type="text"
                    placeholder={t('meeting.title_label')}
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    style={{ marginRight: 8, padding: '6px 10px', borderRadius: 4, border: '1px solid #333' }}
                />
                <input
                    type="text"
                    placeholder={t('meeting.agenda_label')}
                    value={newAgenda}
                    onChange={e => setNewAgenda(e.target.value)}
                    style={{ marginRight: 8, padding: '6px 10px', borderRadius: 4, border: '1px solid #333' }}
                />
                <button
                    onClick={handleCreate}
                    disabled={creating || !newTitle.trim()}
                    style={{ padding: '6px 16px', borderRadius: 4, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                    {t('meeting.create')}
                </button>
            </div>

            {meetings.length === 0 ? (
                <p>{t('meeting.empty')}</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {meetings.map(m => (
                        <div key={m.id} style={{ padding: 12, borderRadius: 6, border: '1px solid #333', background: '#1a1a2e' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong>{m.title}</strong>
                                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: '#333', fontSize: 12 }}>
                                        {t(`meeting.status.${m.status}`)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {m.status === 'scheduled' && (
                                        <button onClick={() => handleStart(m.id)} style={{ padding: '4px 8px', borderRadius: 4, background: '#22c55e', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                            {t('meeting.start')}
                                        </button>
                                    )}
                                    {m.status === 'in_progress' && (
                                        <button onClick={() => handleComplete(m.id)} style={{ padding: '4px 8px', borderRadius: 4, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                            {t('meeting.complete')}
                                        </button>
                                    )}
                                    {(m.status === 'scheduled' || m.status === 'in_progress') && (
                                        <button onClick={() => handleCancel(m.id)} style={{ padding: '4px 8px', borderRadius: 4, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}>
                                            {t('meeting.cancel')}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {m.agenda && <p style={{ margin: '8px 0 0', color: '#aaa' }}>{m.agenda}</p>}
                            {m.summary && <p style={{ margin: '8px 0 0', color: '#10b981' }}>{m.summary}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
