/**
 * PlatformBudgetSection — AGEMS 4.x
 * Platform-level budget (hourly/daily/monthly limits, hard stop) + incident history.
 */
import React, { useState, useEffect } from 'react';
import { ShieldAlert, RotateCcw, Plus } from 'lucide-react';
import { agemsBudgetService } from '../../kernel/services/agems-budget-service';
import type { PlatformBudget, BudgetIncident } from '../../kernel/types/agems-budget';
import { StatCard } from './StatCard';
import { fmtUSD, usageColor } from './budget-utils';
import { useTranslation } from '../../i18n/useTranslation';

export const PlatformBudgetSection: React.FC = () => {
    const { lang } = useTranslation();
    const [budget, setBudget] = useState<PlatformBudget | null>(null);
    const [incidents, setIncidents] = useState<BudgetIncident[]>([]);
    const [monthly, setMonthly] = useState('');
    const [daily, setDaily] = useState('');
    const [hourly, setHourly] = useState('');
    const [hardStop, setHardStop] = useState(true);
    const [spendDraft, setSpendDraft] = useState('1');

    const load = async () => {
        const b = await agemsBudgetService.getPlatform();
        setBudget(b ?? null);
        if (b) {
            setMonthly(b.monthlyLimitUsd !== undefined ? String(b.monthlyLimitUsd) : '');
            setDaily(b.dailyLimitUsd !== undefined ? String(b.dailyLimitUsd) : '');
            setHourly(b.hourlyLimitUsd !== undefined ? String(b.hourlyLimitUsd) : '');
            setHardStop(b.hardStopEnabled);
            const list = await agemsBudgetService.incidents(b.id);
            setIncidents(list.sort((x, y) => y.createdAt - x.createdAt).slice(0, 20));
        } else {
            setIncidents([]);
        }
    };
    useEffect(() => { void load(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, []);

    const save = async () => {
        await agemsBudgetService.upsertPlatform({
            orgId: 'default',
            monthlyLimitUsd: monthly === '' ? undefined : Number(monthly),
            dailyLimitUsd: daily === '' ? undefined : Number(daily),
            hourlyLimitUsd: hourly === '' ? undefined : Number(hourly),
            hardStopEnabled: hardStop,
        } as never);
        void load();
    };

    const recordSpend = async () => {
        const amt = Number(spendDraft);
        if (!amt || amt <= 0) return;
        await agemsBudgetService.addSpend('default', amt);
        void load();
    };

    const reset = async () => {
        if (!window.confirm('Reset platform spend for a new period?')) return;
        await agemsBudgetService.resetSpend();
        void load();
    };

    const limit = budget?.monthlyLimitUsd ?? 0;
    const spent = budget?.currentSpendUsd ?? 0;
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    const blocked = !!budget?.hardStopEnabled && limit > 0 && spent >= limit;

    return (
        <div style={{ padding: '1.5rem', borderRadius: 16, border: blocked ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <ShieldAlert size={18} color={blocked ? '#ef4444' : '#8b5cf6'} />
                <span style={{ fontWeight: 700, color: 'var(--slate-200)', fontSize: '1rem' }}>Platform Budget (AGEMS)</span>
                {blocked && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700 }}>HARD STOP</span>}
            </div>
            {!budget ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: 'var(--slate-400)' }}>
                    No platform budget yet — set limits and save.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <StatCard label="Monthly limit" value={limit > 0 ? fmtUSD(limit, lang) : '—'} color="#8b5cf6" />
                    <StatCard label="Spent" value={fmtUSD(spent, lang)} color="#f59e0b" />
                    <StatCard label="Usage" value={`${pct.toFixed(1)}%`} color={usageColor(pct)} />
                </div>
            )}
            {budget && limit > 0 && (
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '1rem' }}>
                    <div style={{ height: '100%', borderRadius: 4, width: `${Math.min(pct, 100)}%`, background: usageColor(pct), transition: 'width 0.5s ease' }} />
                </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', fontSize: 12 }}>
                <label style={{ color: 'var(--slate-400)' }}>$/mo <input value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="100" style={{ width: 70, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} /></label>
                <label style={{ color: 'var(--slate-400)' }}>$/day <input value={daily} onChange={(e) => setDaily(e.target.value)} placeholder="10" style={{ width: 60, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} /></label>
                <label style={{ color: 'var(--slate-400)' }}>$/hr <input value={hourly} onChange={(e) => setHourly(e.target.value)} placeholder="2" style={{ width: 56, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} /></label>
                <label style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--slate-300)' }}><input type="checkbox" checked={hardStop} onChange={(e) => setHardStop(e.target.checked)} /> hard stop</label>
                <button onClick={save} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: '#8b5cf6', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Save</button>
            </div>
            {budget && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: '1rem', fontSize: 12 }}>
                    <input value={spendDraft} onChange={(e) => setSpendDraft(e.target.value)} style={{ width: 64, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'inherit', fontSize: 12 }} />
                    <button onClick={recordSpend} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontSize: 12, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }}><Plus size={12} /> Record spend</button>
                    <button onClick={reset} style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--slate-400)', fontSize: 12, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center' }}><RotateCcw size={12} /> Reset period</button>
                </div>
            )}
            {incidents.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Incidents ({incidents.length})</div>
                    {incidents.map((i) => (
                        <div key={i.id} style={{ display: 'flex', gap: 8, fontSize: 11, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'var(--slate-400)' }}>
                            <span style={{ fontWeight: 700, color: i.type === 'HARD_STOP' ? '#ef4444' : i.type === 'SOFT_ALERT' ? '#f59e0b' : '#94a3b8' }}>{i.type}</span>
                            <span style={{ flex: 1 }}>{i.message}</span>
                            <span>{new Date(i.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
