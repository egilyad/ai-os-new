import React, { useMemo } from 'react';
import { lazyService } from '../../kernel/service-helper';
import type { ICalibrationService } from '../../kernel/contracts/debate-calibration';

const calibrationService = lazyService<ICalibrationService>('calibrationService');

interface Bin {
    low: number;
    high: number;
    total: number;
    accurate: number;
}

const W = 520;
const H = 260;
const PAD = 34;

const CalibrationLens: React.FC = () => {
    const samples = useMemo(() => {
        try {
            return calibrationService.getCalibrationHistory?.() ?? [];
        } catch {
            return [];
        }
    }, []);

    if (samples.length === 0) {
        return (
            <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 24, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                Нет данных калибровки — запусти дебаты с техникой «epistemic-calibration», чтобы собрать замеры уверенности и точности.
            </div>
        );
    }

    const bins: Bin[] = Array.from({ length: 5 }, (_, i) => ({
        low: i * 0.2,
        high: (i + 1) * 0.2,
        total: 0,
        accurate: 0,
    }));
    samples.forEach((s) => {
        const i = Math.min(4, Math.floor(s.avgScore / 0.2));
        bins[i].total += 1;
        if (s.wasAccurate) bins[i].accurate += 1;
    });

    const brier = samples.reduce((acc, s) => acc + (s.avgScore - (s.wasAccurate ? 1 : 0)) ** 2, 0) / samples.length;

    const xOf = (v: number) => PAD + v * (W - PAD * 2);
    const yOf = (v: number) => H - PAD - v * (H - PAD * 2);
    const barW = (W - PAD * 2) / 5 - 6;

    const totalSamples = samples.length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--slate-300)' }}>Reliability diagram (уверенность → фактическая точность)</div>
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }}>
                <line x1={xOf(0)} y1={yOf(0)} x2={xOf(1)} y2={yOf(1)} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
                {Array.from({ length: 6 }, (_, i) => i / 5).map((v) => (
                    <g key={v}>
                        <line x1={xOf(0)} y1={yOf(v)} x2={xOf(1)} y2={yOf(v)} stroke="rgba(255,255,255,0.06)" />
                        <text x={PAD - 6} y={yOf(v) + 4} textAnchor="end" fontSize={10} fill="var(--slate-500)">
                            {v.toFixed(1)}
                        </text>
                    </g>
                ))}
                {bins.map((b) => {
                    const center = (b.low + b.high) / 2;
                    const reliability = b.total > 0 ? b.accurate / b.total : 0;
                    return (
                        <g key={center}>
                            <rect
                                x={xOf(center) - barW / 2}
                                y={yOf(reliability)}
                                width={barW}
                                height={Math.max(1, yOf(0) - yOf(reliability))}
                                rx={3}
                                fill={b.total > 0 ? '#3b82f6' : 'rgba(255,255,255,0.06)'}
                                opacity={b.total > 0 ? 0.85 : 1}
                            />
                            <text x={xOf(center)} y={yOf(0) + 16} textAnchor="middle" fontSize={10} fill="var(--slate-500)">
                                {center.toFixed(1)}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: -6 }}>
                Brier score: <b>{brier.toFixed(3)}</b> (0 — идеально, ближе к 1 — хуже) · замеров: <b>{totalSamples}</b>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {bins.map((b) => {
                    const reliability = b.total > 0 ? b.accurate / b.total : 0;
                    return (
                        <div key={b.low} style={{ padding: '0.5rem 0.7rem', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)', minWidth: 120 }}>
                            <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>
                                conf {b.low.toFixed(1)}–{b.high.toFixed(1)}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800 }}>
                                {b.total > 0 ? reliability.toFixed(2) : '—'}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--slate-500)' }}>
                                {b.accurate}/{b.total} точных
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CalibrationLens;
