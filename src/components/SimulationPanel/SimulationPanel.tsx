import React, { useEffect, useState, useCallback } from 'react';
import { lazyService } from '../../kernel/service-helper';
import type { IWorldStateService, SimulationWorld } from '../../kernel/contracts/simulation-world';
import type { ISimulationEngineService } from '../../kernel/contracts/simulation-engine';
import type { IAgentFactory } from '../../kernel/contracts/capability';

const worldStateService = lazyService<IWorldStateService>('worldStateService');
const simulationEngineService = lazyService<ISimulationEngineService>('simulationEngineService');
const agentFactory = lazyService<IAgentFactory>('agentFactory');

const btn: React.CSSProperties = {
    padding: '0.4rem 0.8rem',
    borderRadius: 6,
    cursor: 'pointer',
    border: '1px solid #2a2a35',
    background: 'transparent',
    color: 'inherit',
};
const primaryBtn: React.CSSProperties = { ...btn, background: '#3b82f6', color: '#fff', fontWeight: 600 };

export const SimulationPanel: React.FC = () => {
    const [worlds, setWorlds] = useState<SimulationWorld[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [world, setWorld] = useState<SimulationWorld | null>(null);
    const [ticks, setTicks] = useState(5);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [log, setLog] = useState<string[]>([]);

    const selected = world ?? worlds.find((w) => w.id === selectedId) ?? null;

    const refresh = useCallback(async () => {
        try {
            const list = await worldStateService.list();
            setWorlds(list);
            if (selectedId && list.find((w) => w.id === selectedId)) {
                const w = await worldStateService.get(selectedId);
                if (w) setWorld(w);
            } else if (list[0]) {
                setSelectedId(list[0].id);
                setWorld(list[0]);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [selectedId]);

    useEffect(() => { void refresh(); }, [refresh]);

    const createWorld = async () => {
        setBusy(true);
        setError(null);
        try {
            // Demo seed: try to create 6 real SuperAgents via AgentFactory (if available), fallback to stub ids
            let agentIds: string[] = [];
            try {
                const seeds: Array<Omit<import('../../kernel/types/capability-types').AgentDefinition, 'id'|'createdAt'|'updatedAt'>> = [
                    { name: 'Lisa Carter (curious analyst)', roleId: 'analyst', skillIds: [], toolIds: [], personaId: 'persona-analyst' },
                    { name: 'Oscar Weber (modernist architect)', roleId: 'critic', skillIds: [], toolIds: [], personaId: 'persona-architect' },
                    { name: 'Mara Singh (entrepreneur)', roleId: 'founder', skillIds: [], toolIds: [] },
                    { name: 'Ken Tanaka (engineer)', roleId: 'engineer', skillIds: [], toolIds: [] },
                    { name: 'Sofia Alvarez (designer)', roleId: 'designer', skillIds: [], toolIds: [] },
                    { name: 'David Kim (skeptic judge)', roleId: 'judge', skillIds: [], toolIds: [] },
                ];
                const created: string[] = [];
                for (const seed of seeds) {
                    try {
                        const def = await agentFactory.create(seed as Omit<import('../../kernel/types/capability-types').AgentDefinition, 'id'|'createdAt'|'updatedAt'>);
                        created.push(def.id);
                    } catch { /* seed may fail if role/persona missing — fallback below */ }
                }
                if (created.length >= 2) agentIds = created;
            } catch { /* ignore */ }
            if (agentIds.length === 0) agentIds = Array.from({ length: 6 }, (_, i) => `agent-${i + 1}`);

            // Try to wire engine → adapter if adapter registered (phase64)
            try {
                const adapter = lazyService<import('../../kernel/contracts/simulation-engine').IAgentActPort>('agentActAdapterService') as unknown as import('../../kernel/contracts/simulation-engine').IAgentActPort;
                const eng = simulationEngineService as unknown as { setActPort?: (p: unknown) => void };
                if (adapter && eng.setActPort) eng.setActPort(adapter);
            } catch { /* stub fallback */ }

            const w = await worldStateService.create({
                name: `World ${worlds.length + 1}`,
                rooms: [
                    { id: 'r-hall', name: 'Main Hall', x: 50, y: 50, w: 450, h: 400 },
                    { id: 'r-lab', name: 'Lab', x: 550, y: 50, w: 400, h: 400 },
                    { id: 'r-garden', name: 'Garden', x: 50, y: 500, w: 900, h: 400 },
                ],
                agentIds,
            });
            setLog((l) => [`created ${w.name} (${w.id}) agents:${agentIds.length} ${agentIds.join(',').slice(0, 80)}`, ...l].slice(0, 50));
            await refresh();
            setSelectedId(w.id);
            setWorld(w);
        } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
    };

    const run = async (n: number) => {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            const w = await simulationEngineService.run(selected.id, n);
            setWorld(w);
            setLog((l) => [`▶ run ${n} ticks → clock ${w.globalClock}`, ...l].slice(0, 50));
            await refresh();
        } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
    };

    const step = async () => {
        if (!selected) return;
        setBusy(true);
        setError(null);
        try {
            const { world: w, acts } = await simulationEngineService.step(selected.id);
            setWorld(w);
            setLog((l) => [`step ${w.globalClock}: ${acts.map((a) => `${a.agentId}:${a.action}`).join(', ')}`, ...l].slice(0, 50));
        } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
    };

    const reset = async () => {
        if (!selected) return;
        setBusy(true);
        try {
            await worldStateService.remove(selected.id);
            setSelectedId(null);
            setWorld(null);
            await refresh();
        } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '0.9rem 1rem', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Simulation Lab</h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>World State 1000×1000 + ExecutionViz · TinyTroupe-style parallel ticks</p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button style={primaryBtn} disabled={busy} onClick={() => void createWorld()}>+ New World (6 agents)</button>
                    <button style={btn} disabled={busy} onClick={() => void refresh()}>Refresh</button>
                </div>
            </div>

            {worlds.length > 0 && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>World:</span>
                    <select value={selectedId ?? ''} onChange={(e) => { setSelectedId(e.target.value); const w = worlds.find((x) => x.id === e.target.value); if (w) setWorld(w); }} style={{ padding: '0.3rem 0.5rem', borderRadius: 6, border: '1px solid #2a2a35', background: 'transparent', color: 'inherit' }}>
                        {worlds.map((w) => <option key={w.id} value={w.id}>{w.name} (tick {w.globalClock}, {w.agentIds.length} agents)</option>)}
                    </select>
                    {selected && <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>clock: {selected.globalClock}</span>}
                </div>
            )}

            {selected && (
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button style={primaryBtn} disabled={busy} onClick={() => void run(ticks)}>▶ SIMULATE {ticks} ticks</button>
                    <button style={btn} disabled={busy} onClick={() => void step()}>STEP 1</button>
                    <input type="number" min={1} max={50} value={ticks} onChange={(e) => setTicks(Math.max(1, Math.min(50, Number(e.target.value) || 5)))} style={{ width: 64, padding: '0.3rem 0.4rem', borderRadius: 6, border: '1px solid #2a2a35', background: 'transparent', color: 'inherit' }} />
                    <button style={btn} disabled={busy} onClick={() => void reset()}>RESET</button>
                </div>
            )}

            {error && <p style={{ color: '#ef4444', margin: 0 }}>{error}</p>}

            {selected && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 420px', minWidth: 320, border: '1px solid #2a2a35', borderRadius: 8, padding: '0.5rem', background: '#0f0f14' }}>
                        <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.4rem' }}>Rooms 1000×1000 — кружки-агенты + связи</div>
                        <svg viewBox="0 0 1000 1000" style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', maxHeight: 380, display: 'block', background: '#0a0a0f', borderRadius: 6, border: '1px solid #1e1e2e' }}>
                            {selected.rooms.map((room) => (
                                <g key={room.id}>
                                    <rect x={room.x} y={room.y} width={room.w} height={room.h} rx={8} fill="#1a1a2e" stroke="#3b82f6" strokeOpacity={0.6} />
                                    <text x={room.x + 8} y={room.y + 18} fontSize={13} fill="#a5b4fc">{room.name}</text>
                                </g>
                            ))}
                            {selected.relations.map((rel) => {
                                const aRoom = selected.rooms.find((r) => r.agents.includes(rel.from));
                                const bRoom = selected.rooms.find((r) => r.agents.includes(rel.to));
                                if (!aRoom || !bRoom) return null;
                                const ax = aRoom.x + aRoom.w / 2, ay = aRoom.y + aRoom.h / 2;
                                const bx = bRoom.x + bRoom.w / 2, by = bRoom.y + bRoom.h / 2;
                                return <line key={rel.id} x1={ax} y1={ay} x2={bx} y2={by} stroke="#f59e0b" strokeOpacity={0.35 + 0.4 * rel.weight} strokeWidth={1 + 2 * rel.weight} />;
                            })}
                            {selected.rooms.flatMap((room) => room.agents.map((agentId, idx) => {
                                const cols = Math.max(1, Math.ceil(Math.sqrt(room.agents.length)));
                                const col = idx % cols, row = Math.floor(idx / cols);
                                const cx = room.x + 28 + col * 56, cy = room.y + 44 + row * 44;
                                const hue = (agentId.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 57) % 360;
                                return (
                                    <g key={`${room.id}:${agentId}`}>
                                        <circle cx={cx} cy={cy} r={16} fill={`hsl(${hue} 70% 55%)`} stroke="#fff" strokeOpacity={0.9} />
                                        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="#fff" fontWeight={700}>{agentId.slice(-2)}</text>
                                        <text x={cx} y={cy + 28} textAnchor="middle" fontSize={8} fill="#cbd5e1">{agentId}</text>
                                    </g>
                                );
                            }))}
                        </svg>
                        <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '0.3rem' }}>{selected.rooms.map((r) => `${r.name}: ${r.agents.join(', ') || '—'}`).join(' · ')}</div>
                    </div>
                    <div style={{ flex: '1 1 260px', minWidth: 240, border: '1px solid #2a2a35', borderRadius: 8, padding: '0.5rem', maxHeight: 400, overflowY: 'auto' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Event timeline (ExecutionViz)</div>
                        {log.length === 0 && <p style={{ opacity: 0.5, fontSize: '0.8rem' }}>No ticks yet — нажми ▶ SIMULATE</p>}
                        {log.map((line, i) => <div key={i} style={{ fontSize: '0.75rem', padding: '0.25rem 0', borderBottom: '1px solid #1e1e2e', fontFamily: 'monospace' }}>{line}</div>)}
                    </div>
                </div>
            )}

            {!selected && worlds.length === 0 && <p style={{ opacity: 0.6 }}>Нет миров — создай + New World и нажми ▶ SIMULATE — 5–10 агентов побегут параллельно (StubAct, потом заменим на реальных SuperAgents).</p>}
        </div>
    );
};

export default SimulationPanel;
