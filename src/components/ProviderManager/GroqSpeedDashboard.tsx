import { useState, useEffect, useCallback } from 'react';
import { usePolling } from '../Common/usePolling';
import { PersonalityCard } from './PersonalityCard';
import { AchievementList } from './AchievementList';
import GroqKeyTable from './GroqKeyTable';
import { keyService, providerAchievementService } from '../../kernel/instances';

interface SpeedRecord {
    timestamp: number;
    tokensPerSec: number;
    ttft: number;
    latency: number;
}

interface GroqKey {
    provider: string;
    stats?: {
        avgLatency?: number;
        extended?: {
            latencyBreakdown?: {
                tokensPerSec?: number;
                ttft?: number;
            };
        };
    };
}

const MAX_HISTORY = 100;

export default function GroqSpeedDashboard() {
    const [speedHistory, setSpeedHistory] = useState<SpeedRecord[]>([]);
    const [currentTps, setCurrentTps] = useState(0);
    const [avgTtft, setAvgTtft] = useState(0);
    const [keys, setKeys] = useState<GroqKey[]>([]);
    const [avgLatency, setAvgLatency] = useState(0);

    const load = useCallback(async () => {
        const k = (await keyService.getKeys()) as GroqKey[];
        const groqKeys = k.filter((x) => x.provider === 'groq');
        setKeys(groqKeys);

        const avgLat = groqKeys.reduce((sum, x) => sum + (x.stats?.avgLatency ?? 0), 0);
        const avgLatCount = groqKeys.filter((x) => x.stats?.avgLatency != null).length;
        setAvgLatency(avgLatCount > 0 ? Math.round(avgLat / avgLatCount) : 0);

        const newRecords: SpeedRecord[] = groqKeys
            .filter((x) => {
                const lb = x.stats?.extended?.latencyBreakdown;
                return lb && (lb.tokensPerSec || lb.ttft || x.stats?.avgLatency);
            })
            .map((x) => ({
                timestamp: Date.now(),
                tokensPerSec: x.stats!.extended!.latencyBreakdown!.tokensPerSec ?? 0,
                ttft: x.stats!.extended!.latencyBreakdown!.ttft ?? 0,
                latency: x.stats!.avgLatency ?? 0,
            }));

        setSpeedHistory((prev) => {
            if (newRecords.length === 0) return prev;
            const combined = [...prev, ...newRecords];
            return combined.slice(-MAX_HISTORY);
        });

        const tpsValues = newRecords.map((r) => r.tokensPerSec);
        const ttftValues = newRecords.map((r) => r.ttft);
        if (tpsValues.length) {
            setCurrentTps(tpsValues[tpsValues.length - 1]!);
            setAvgTtft(ttftValues.reduce((a, b) => a + b, 0) / ttftValues.length);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);
    usePolling(load, 5000);

    const peakFromHistory =
        speedHistory.length > 0 ? Math.max(...speedHistory.map((r) => r.tokensPerSec)) : 0;

    const currentTpsRounded = Math.round(currentTps);
    const peakTpsRounded = Math.round(peakFromHistory);
    const avgLatencyRounded = Math.round(avgLatency);

    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚡</span> Groq Speed Dashboard
            </h2>

            <div style={{ marginBottom: 20, maxWidth: 400 }}>
                <PersonalityCard provider="groq" currentState={keys.length ? 'active' : 'idle'} />
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                }}
            >
                <StatCard
                    icon="⚡"
                    label="Current Speed"
                    value={`${currentTpsRounded} tok/s`}
                    color="#22c55e"
                />
                <StatCard
                    icon="🏆"
                    label="Peak Today"
                    value={`${peakTpsRounded} tok/s`}
                    color="#f59e0b"
                />
                <StatCard
                    icon="⏱️"
                    label="Avg TTFT"
                    value={`${Math.round(avgTtft)}ms`}
                    color="#8b5cf6"
                />
                <StatCard icon="🔑" label="Active Keys" value={`${keys.length}`} color="#3b82f6" />
                <StatCard
                    icon="📊"
                    label="Avg Latency"
                    value={avgLatencyRounded > 0 ? `${avgLatencyRounded}ms` : '—'}
                    color="#06b6d4"
                />
            </div>

            {speedHistory.length > 0 && (
                <div
                    style={{
                        background: 'rgba(34,197,94,0.05)',
                        borderRadius: 12,
                        padding: 16,
                        border: '1px solid rgba(34,197,94,0.15)',
                    }}
                >
                    <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem' }}>
                        📈 Speed History ({speedHistory.length} data points)
                    </h3>
                    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 80 }}>
                        {speedHistory.slice(-20).map((rec, i) => {
                            const h = Math.min(
                                100,
                                (rec.tokensPerSec / (peakFromHistory || 1)) * 100,
                            );
                            return (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        background: 'var(--success)',
                                        height: `${Math.max(4, h)}%`,
                                        borderRadius: '2px 2px 0 0',
                                        opacity: 0.4 + (i / speedHistory.length) * 0.6,
                                        transition: 'height 0.3s',
                                        minWidth: 4,
                                    }}
                                    title={`${Math.round(rec.tokensPerSec)} tok/s`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            <GroqKeyTable />

            <div style={{ marginTop: 24 }}>
                <AchievementList
                    achievements={providerAchievementService.getAchievements('groq')}
                    progress={providerAchievementService.getProgress('groq', {
                        requests: keys.length * 10 + speedHistory.length,
                        fastResponses: speedHistory.filter((r) => r.ttft < 100).length,
                        sub50ms: speedHistory.filter((r) => r.ttft < 50).length,
                        speedStreak: speedHistory.filter((r) => r.ttft < 150).length > 5 ? 5 : 0,
                        avgTTFT: avgTtft,
                        modelsUsed: Math.min(3, keys.length),
                        groqAchievements: providerAchievementService
                            .getAwardedIds()
                            .filter(
                                (id) => id.startsWith('pa-') && parseInt(id.split('-')[1]!) <= 15,
                            ).length,
                    })}
                />
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    color,
}: {
    icon: string;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div
            style={{
                background: `${color}08`,
                border: `1px solid ${color}22`,
                borderRadius: 12,
                padding: 16,
            }}
        >
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginBottom: 4 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        </div>
    );
}
