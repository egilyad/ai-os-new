import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { governanceService } from '../../kernel/instances/services-extras';

const btn: React.CSSProperties = { padding: '0.4rem 0.8rem', borderRadius: 6, border: '1px solid #2a2a35', background: '#3b82f6', color: '#fff', cursor: 'pointer' };
const card: React.CSSProperties = { border: '1px solid #2a2a35', borderRadius: 8, padding: '0.6rem 0.8rem', marginBottom: '0.5rem' };

const GovernancePanel: React.FC = () => {
    const { t } = useTranslation();
    const [userId, setUserId] = useState('demo-user');
    const [role, setRole] = useState<'observer'|'approver'|'director'|'auditor'>('observer');
    const [roles, setRoles] = useState<{ role: string; scope?: string }[]>([]);
    const [msg, setMsg] = useState<string|null>(null);
    const [error, setError] = useState<string|null>(null);

    const refresh = async () => {
        try {
            const loaded = await governanceService.rolesOf(userId);
            setRoles(Array.isArray(loaded) ? loaded : []);
            setError(null);
        } catch {
            // An empty list must mean "no roles", never a hidden load failure.
            setError(t('governance.error_load'));
        }
    };
    useEffect(() => { void refresh(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [userId]);

    return (
        <div style={{ padding: '1rem' }}>
            <h2 style={{ margin: 0 }}>{t('governance.title', { defaultValue: 'Governance / RBAC' })}</h2>
            <p style={{ opacity: 0.7, fontSize: '0.85rem' }}>{t('governance.subtitle', { defaultValue: 'Назначение ролей observer/approver/director/auditor. Проверка can() перед HITL.' })}</p>
            {msg && <p style={{ color: '#10b981' }}>{msg}</p>}
            {error && <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>{error}</p>}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input value={userId} onChange={e => setUserId(e.target.value)} placeholder={t('governance.user_id')} aria-label={t('governance.user_id')} style={{ padding: '0.4rem', borderRadius: 6, border: '1px solid #2a2a35', background: 'transparent', color: 'inherit' }} />
                <select value={role} onChange={e => setRole(e.target.value as never)} style={{ padding: '0.4rem', borderRadius: 6 }}>
                    <option value="observer">observer</option><option value="approver">approver</option><option value="director">director</option><option value="auditor">auditor</option>
                </select>
                <button
                    style={btn}
                    onClick={async () => {
                        setError(null);
                        setMsg(null);
                        try {
                            await governanceService.assignRole(userId, role);
                            setMsg(t('governance.assigned', { role, userId }));
                            void refresh();
                        } catch {
                            setError(t('governance.assign_failed'));
                        }
                    }}
                >
                    {t('governance.assign')}
                </button>
            </div>
            {roles.map((r,i) => <div key={i} style={card}>{r.role} {r.scope ? `— ${r.scope}` : ''}</div>)}
            {roles.length===0 && !error && <p style={{ opacity:0.6 }}>{t('governance.empty_roles')}</p>}
        </div>
    );
};
export default GovernancePanel;
