import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../../i18n/useTranslation', () => ({
    useTranslation: () => {
        const labels: Record<string, string> = {
            'tasks.cron.mode': 'Schedule',
            'tasks.cron.preset.hourly': 'Hourly',
            'tasks.cron.preset.daily': 'Daily',
            'tasks.cron.preset.weekday': 'Weekdays',
            'tasks.cron.preset.weekly': 'Weekly',
            'tasks.cron.preset.monthly': 'Monthly',
            'tasks.cron.preset.custom': 'Custom',
            'tasks.cron.minute': 'Minute',
            'tasks.cron.hour': 'Hour',
            'tasks.cron.day_week': 'Day of week',
            'tasks.cron.day_month': 'Day of month',
            'tasks.cron.custom_label': 'Cron expression',
            'tasks.cron.invalid': 'Invalid schedule',
            'tasks.cron.preview.hourly': 'Runs every hour at minute {minute}',
            'tasks.cron.preview.daily': 'Runs every day at {time}',
            'tasks.cron.preview.weekday': 'Runs on weekdays at {time}',
            'tasks.cron.preview.weekly': 'Runs every {day} at {time}',
            'tasks.cron.preview.monthly': 'Runs on day {dom} each month at {time}',
            'tasks.cron.preview.custom': 'Custom schedule: {cron}',
            'tasks.cron.day.mon': 'Monday',
            'tasks.cron.day.tue': 'Tuesday',
            'tasks.cron.day.wed': 'Wednesday',
            'tasks.cron.day.thu': 'Thursday',
            'tasks.cron.day.fri': 'Friday',
            'tasks.cron.day.sat': 'Saturday',
            'tasks.cron.day.sun': 'Sunday',
        };
        return {
            t: (key: string, params?: Record<string, string | number>) => {
                let s = labels[key] || key;
                if (params) {
                    for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
                }
                return s;
            },
        };
    },
}));

describe('CronBuilder', () => {
    const onChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('emits the daily preset cron by default with preview', async () => {
        const CronBuilder = (await import('./CronBuilder')).default;
        render(<CronBuilder onChange={onChange} />);
        expect(await screen.findByText('Runs every day at 09:00 (0 9 * * *)')).toBeDefined();
        expect(onChange).toHaveBeenLastCalledWith('0 9 * * *');
    });

    it('switching to hourly emits an hourly cron', async () => {
        const CronBuilder = (await import('./CronBuilder')).default;
        render(<CronBuilder onChange={onChange} />);
        await screen.findByText('Runs every day at 09:00 (0 9 * * *)');
        fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: 'hourly' } });
        expect(await screen.findByText('Runs every hour at minute 00 (0 * * * *)')).toBeDefined();
        expect(onChange).toHaveBeenLastCalledWith('0 * * * *');
    });

    it('weekly preset reflects the chosen weekday', async () => {
        const CronBuilder = (await import('./CronBuilder')).default;
        render(<CronBuilder onChange={onChange} />);
        await screen.findByText('Runs every day at 09:00 (0 9 * * *)');
        fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: 'weekly' } });
        expect(await screen.findByText('Runs every Monday at 09:00 (0 9 * * 1)')).toBeDefined();
        fireEvent.change(screen.getByLabelText('Day of week'), { target: { value: '5' } });
        expect(await screen.findByText('Runs every Friday at 09:00 (0 9 * * 5)')).toBeDefined();
        expect(onChange).toHaveBeenLastCalledWith('0 9 * * 5');
    });

    it('custom mode validates and reports the raw expression', async () => {
        const CronBuilder = (await import('./CronBuilder')).default;
        render(<CronBuilder onChange={onChange} />);
        await screen.findByText('Runs every day at 09:00 (0 9 * * *)');
        fireEvent.change(screen.getByLabelText('Schedule'), { target: { value: 'custom' } });
        expect(await screen.findByText('Custom schedule: 0 9 * * *')).toBeDefined();
        fireEvent.change(screen.getByLabelText('Cron expression'), {
            target: { value: 'not a cron' },
        });
        expect(await screen.findByText('Invalid schedule')).toBeDefined();
        expect(onChange).toHaveBeenLastCalledWith(undefined);
    });
});
