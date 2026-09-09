/**
 * ChartService — Q.2 (Observable-style specs + SVG, additive).
 *
 * Vega-lite-ish JSON specs from label/value series (line/bar/pie/scatter),
 * minimal SVG renderer for line/bar, and a MeterService bridge
 * (`fromMeter`) turning our metric series into specs.
 */
import type { DataAccessLayer } from '../../dal/types';
import type { IMeterService } from '../../contracts/rivals7';
import type { IChartService } from '../../contracts/rivals11';
import { rootLogger } from '../logger-service';

const LOGGER = rootLogger.child('Charts');

type Series = Array<{ label: string; values: number[] }>;

function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export class ChartService implements IChartService {
    constructor(
        private dal: DataAccessLayer,
        private meters?: IMeterService,
    ) {
        void this.dal;
    }

    async init(): Promise<void> {
        LOGGER.info('init', {});
    }

    async destroy(): Promise<void> {
        // nothing to tear down
    }

    spec(kind: 'line' | 'bar' | 'pie' | 'scatter', series: Series): Record<string, unknown> {
        const clean = series
            .map((s) => ({ label: s.label.slice(0, 80), values: s.values.filter(Number.isFinite).slice(0, 500) }))
            .filter((s) => s.values.length > 0);
        return {
            $schema: 'superagents-chart/v1',
            kind,
            series: clean,
            generatedAt: Date.now(),
        };
    }

    svg(kind: 'line' | 'bar', series: Series): string {
        const W = 480;
        const H = 220;
        const pad = 28;
        const clean = series
            .map((s) => ({ label: s.label, values: s.values.filter(Number.isFinite).slice(0, 200) }))
            .filter((s) => s.values.length > 0)
            .slice(0, 6);
        if (clean.length === 0) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><text x="12" y="20">no data</text></svg>`;
        }
        const all = clean.flatMap((s) => s.values);
        const min = Math.min(...all);
        const max = Math.max(...all);
        const span = max - min || 1;
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        const parts: string[] = [
            `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img">`,
        ];
        if (kind === 'bar') {
            const first = clean[0]!;
            const bw = (W - pad * 2) / first.values.length;
            first.values.forEach((v, i) => {
                const h = ((v - min) / span) * (H - pad * 2);
                const x = pad + i * bw + 1;
                const y = H - pad - h;
                parts.push(
                    `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw - 2).toFixed(1)}" height="${h.toFixed(1)}" fill="${colors[0]}"><title>${esc(first.label)}: ${v}</title></rect>`,
                );
            });
        } else {
            clean.forEach((s, si) => {
                const pts = s.values.map((v, i) => {
                    const x = pad + (i / Math.max(1, s.values.length - 1)) * (W - pad * 2);
                    const y = H - pad - ((v - min) / span) * (H - pad * 2);
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                });
                parts.push(
                    `<polyline points="${pts.join(' ')}" fill="none" stroke="${colors[si % colors.length]}" stroke-width="2"><title>${esc(s.label)}</title></polyline>`,
                );
            });
        }
        parts.push('</svg>');
        return parts.join('');
    }

    async fromMeter(metric: string, kind: 'line' | 'bar' = 'line'): Promise<Record<string, unknown>> {
        if (!this.meters) throw new Error('Meter backend unavailable');
        const pts = await this.meters.series(metric, 200);
        return this.spec(kind, [{ label: metric, values: pts.map((p) => p.value) }]);
    }
}
