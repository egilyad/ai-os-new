import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export type CronPreset = 'hourly' | 'daily' | 'weekday' | 'weekly' | 'monthly' | 'custom';

interface CronBuilderProps {
    value?: string;
    onChange: (cron: string | undefined) => void;
}

const pad = (n: number): string => String(n).padStart(2, '0');

function inRange(v: string, min: number, max: number): boolean {
    if (!/^\d+$/.test(v)) return false;
    const n = parseInt(v, 10);
    return n >= min && n <= max;
}

const CronBuilder: React.FC<CronBuilderProps> = ({ value, onChange }) => {
    const { t } = useTranslation();
    const [preset, setPreset] = useState<CronPreset>('daily');
    const [minute, setMinute] = useState('0');
    const [hour, setHour] = useState('9');
    const [dayOfWeek, setDayOfWeek] = useState('1');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [custom, setCustom] = useState(value || '0 9 * * *');

    useEffect(() => {
        if (value) setCustom(value);
    }, [value]);

    const cron = useMemo((): string | undefined => {
        const m = minute.trim();
        const h = hour.trim();
        if (!inRange(m, 0, 59) || !inRange(h, 0, 23)) return undefined;
        switch (preset) {
            case 'hourly':
                return `${parseInt(m, 10)} * * * *`;
            case 'daily':
                return `${parseInt(m, 10)} ${parseInt(h, 10)} * * *`;
            case 'weekday':
                return `${parseInt(m, 10)} ${parseInt(h, 10)} * * 1-5`;
            case 'weekly': {
                const dow = dayOfWeek.trim();
                if (!inRange(dow, 0, 7)) return undefined;
                return `${parseInt(m, 10)} ${parseInt(h, 10)} * * ${parseInt(dow, 10)}`;
            }
            case 'monthly': {
                const dom = dayOfMonth.trim();
                if (!inRange(dom, 1, 31)) return undefined;
                return `${parseInt(m, 10)} ${parseInt(h, 10)} ${parseInt(dom, 10)} * *`;
            }
            case 'custom': {
                const parts = custom.trim().split(/\s+/);
                if (parts.length !== 5) return undefined;
                const [cmin, ch, cdom, cmon, cdow] = parts as [string, string, string, string, string];
                const field = (p: string, min: number, max: number): boolean =>
                    p === '*' ||
                    /^\*\/\d+$/.test(p) ||
                    p.split(',').every((seg) => {
                        const r = seg.match(/^(\d+)-(\d+)$/);
                        if (r) {
                            const a = parseInt(r[1]!, 10);
                            const b = parseInt(r[2]!, 10);
                            return a >= min && a <= max && a <= b;
                        }
                        return inRange(seg, min, max);
                    });
                if (
                    !field(cmin, 0, 59) ||
                    !field(ch, 0, 23) ||
                    !field(cdom, 1, 31) ||
                    !field(cmon, 1, 12) ||
                    !field(cdow, 0, 7)
                )
                    return undefined;
                return parts.join(' ');
            }
        }
    }, [preset, minute, hour, dayOfWeek, dayOfMonth, custom]);

    useEffect(() => {
        onChange(cron);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cron]);

    const preview = useMemo((): string => {
        if (!cron) return t('tasks.cron.invalid');
        const time = `${pad(parseInt(hour, 10) || 0)}:${pad(parseInt(minute, 10) || 0)}`;
        const timeMin = `${pad(parseInt(minute, 10) || 0)}`;
        switch (preset) {
            case 'hourly':
                return t('tasks.cron.preview.hourly', { minute: timeMin });
            case 'daily':
                return t('tasks.cron.preview.daily', { time });
            case 'weekday':
                return t('tasks.cron.preview.weekday', { time });
            case 'weekly': {
                const dowNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
                const idx = parseInt(dayOfWeek, 10) % 7;
                return t('tasks.cron.preview.weekly', {
                    day: t(`tasks.cron.day.${dowNames[idx]}`),
                    time,
                });
            }
            case 'monthly':
                return t('tasks.cron.preview.monthly', { dom: dayOfMonth, time });
            case 'custom':
                return t('tasks.cron.preview.custom', { cron });
        }
    }, [cron, preset, minute, hour, dayOfWeek, dayOfMonth, t]);

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--slate-50)',
        padding: '0.4rem',
        width: '4rem',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                {t('tasks.cron.mode')}:{' '}
                <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value as CronPreset)}
                    aria-label={t('tasks.cron.mode')}
                    style={{ ...inputStyle, width: 'auto' }}
                >
                    {(['hourly', 'daily', 'weekday', 'weekly', 'monthly', 'custom'] as const).map(
                        (p) => (
                            <option key={p} value={p}>
                                {t(`tasks.cron.preset.${p}`)}
                            </option>
                        ),
                    )}
                </select>
            </label>

            {preset === 'hourly' && (
                <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                    {t('tasks.cron.minute')}:{' '}
                    <input
                        type="number"
                        min={0}
                        max={59}
                        value={minute}
                        onChange={(e) => setMinute(e.target.value)}
                        aria-label={t('tasks.cron.minute')}
                        style={inputStyle}
                    />
                </label>
            )}

            {['daily', 'weekday', 'weekly', 'monthly'].includes(preset) && (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                        {t('tasks.cron.hour')}:{' '}
                        <input
                            type="number"
                            min={0}
                            max={23}
                            value={hour}
                            onChange={(e) => setHour(e.target.value)}
                            aria-label={t('tasks.cron.hour')}
                            style={inputStyle}
                        />
                    </label>
                    <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                        {t('tasks.cron.minute')}:{' '}
                        <input
                            type="number"
                            min={0}
                            max={59}
                            value={minute}
                            onChange={(e) => setMinute(e.target.value)}
                            aria-label={t('tasks.cron.minute')}
                            style={inputStyle}
                        />
                    </label>
                    {preset === 'weekly' && (
                        <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                            {t('tasks.cron.day_week')}:{' '}
                            <select
                                value={dayOfWeek}
                                onChange={(e) => setDayOfWeek(e.target.value)}
                                aria-label={t('tasks.cron.day_week')}
                                style={{ ...inputStyle, width: 'auto' }}
                            >
                                {[
                                    ['1', 'mon'],
                                    ['2', 'tue'],
                                    ['3', 'wed'],
                                    ['4', 'thu'],
                                    ['5', 'fri'],
                                    ['6', 'sat'],
                                    ['0', 'sun'],
                                ].map(([v, d]) => (
                                    <option key={v} value={v}>
                                        {t(`tasks.cron.day.${d}`)}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    {preset === 'monthly' && (
                        <label style={{ color: 'var(--slate-300)', fontSize: '0.8rem' }}>
                            {t('tasks.cron.day_month')}:{' '}
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(e.target.value)}
                                aria-label={t('tasks.cron.day_month')}
                                style={inputStyle}
                            />
                        </label>
                    )}
                </div>
            )}

            {preset === 'custom' && (
                <input
                    type="text"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    aria-label={t('tasks.cron.custom_label')}
                    placeholder="0 9 * * 1"
                    spellCheck={false}
                    style={{ ...inputStyle, width: '100%', fontFamily: 'monospace' }}
                />
            )}

            <div
                role="status"
                style={{ color: cron ? 'var(--success)' : 'var(--error)', fontSize: '0.8rem' }}
            >
                {`${preview}${cron && preset !== 'custom' ? ` (${cron})` : ''}`}
            </div>
        </div>
    );
};

export default CronBuilder;
