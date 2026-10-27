import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Thermometer } from 'lucide-react';
import { DEFECT_CLASSES, type DefectClass, type DefectFinding, type DefectSeverity } from '../../kernel/types/defect-map-types';
import { loadFindings, saveFindings } from './defect-store';

const SEVERITY_SCORE: Record<DefectSeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
};

const SEVERITY_COLOR: Record<DefectSeverity, string> = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
};

const COMMON_MODULES = ['kernel', 'stores', 'components', 'llm', 'server', 'scripts', 'docs', 'e2e'];

const DefectMapPanel: React.FC = () => {
    const [findings, setFindings] = useState<DefectFinding[]>(() => loadFindings());
    const [defectClass, setDefectClass] = useState<DefectClass>(DEFECT_CLASSES[0]);
    const [defectModule, setDefectModule] = useState<string>(COMMON_MODULES[0] ?? 'kernel');
    const [severity, setSeverity] = useState<DefectSeverity>('medium');
    const [description, setDescription] = useState('');
    const [showResolved, setShowResolved] = useState(false);

    const commit = (next: DefectFinding[]) => {
        setFindings(next);
        saveFindings(next);
    };

    const handleAdd = () => {
        const d = description.trim();
        if (!d) return;
        commit([
            {
                id: `defect-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                defectClass,
                module: defectModule.trim() || 'other',
                severity,
                description: d.slice(0, 500),
                createdAt: Date.now(),
            },
            ...findings,
        ]);
        setDescription('');
    };

    const toggleResolved = (id: string) => {
        commit(findings.map((f) => (f.id === id ? { ...f, resolved: !f.resolved } : f)));
    };

    const removeFinding = (id: string) => {
        commit(findings.filter((f) => f.id !== id));
    };

    const visible = useMemo(
        () => (showResolved ? findings : findings.filter((f) => !f.resolved)),
        [findings, showResolved],
    );

    const modules = useMemo(() => {
        const set = new Set<string>(COMMON_MODULES);
        findings.forEach((f) => set.add(f.module));
        return Array.from(set).sort();
    }, [findings]);

    // Матрица класс × модуль: суммарный балл серьёзности.
    const matrix = useMemo(() => {
        const m = new Map<string, Map<string, number>>();
        visible.forEach((f) => {
            const byModule = m.get(f.defectClass) ?? new Map<string, number>();
            byModule.set(f.module, (byModule.get(f.module) ?? 0) + SEVERITY_SCORE[f.severity]);
            m.set(f.defectClass, byModule);
        });
        return m;
    }, [visible]);

    const maxCell = useMemo(() => {
        let max = 1;
        matrix.forEach((byModule) => byModule.forEach((v) => (max = Math.max(max, v))));
        return max;
    }, [matrix]);

    const cellColor = (v: number): string => {
        if (v === 0) return 'rgba(255,255,255,0.02)';
        const t = v / maxCell;
        // зелёный → жёлтый → красный
        const r = Math.round(34 + t * 221);
        const g = Math.round(197 - t * 140);
        const b = Math.round(94 - t * 60);
        return `rgba(${r},${g},${b},0.55)`;
    };

    return (
        <div style={{ padding: '1rem 1.25rem', maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Thermometer size={18} color="#f59e0b" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Карта дефектов</h2>
                <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>
                    {findings.length} всего · {findings.filter((f) => !f.resolved).length} открыто
                </span>
            </div>
            <p style={{ margin: '0 0 1rem', fontSize: 13, color: 'var(--slate-400)' }}>
                Тепловая карта «12 классов дефектов × модули». Данные хранятся локально — добавляй находки из аудитов и следи, где копятся проблемы.
            </p>

            {/* Форма */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1rem', padding: '0.9rem', borderRadius: 12, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)' }}>
                <select value={defectClass} onChange={(e) => setDefectClass(e.target.value as DefectClass)} style={ctl} aria-label="Класс дефекта">
                    {DEFECT_CLASSES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select value={defectModule} onChange={(e) => setDefectModule(e.target.value)} style={ctl} aria-label="Модуль">
                    {modules.map((m) => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <select value={severity} onChange={(e) => setSeverity(e.target.value as DefectSeverity)} style={ctl} aria-label="Серьёзность">
                    {(['low', 'medium', 'high', 'critical'] as DefectSeverity[]).map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                <input
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Описание дефекта…"
                    style={{ ...ctl, flex: 1, minWidth: 220 }}
                />
                <button onClick={handleAdd} disabled={!description.trim()} style={addBtn}>
                    <Plus size={14} /> Добавить
                </button>
            </div>

            {/* Тепловая карта */}
            <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--slate-400)' }}>Класс \ Модуль</th>
                            {modules.map((m) => (
                                <th key={m} style={{ padding: '4px 8px', minWidth: 70, color: 'var(--slate-400)' }} title={m}>
                                    {m.slice(0, 10)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {DEFECT_CLASSES.map((cls) => (
                            <tr key={cls}>
                                <td style={{ padding: '4px 8px', color: 'var(--slate-300)', whiteSpace: 'nowrap' }}>{cls}</td>
                                {modules.map((m) => {
                                    const v = matrix.get(cls)?.get(m) ?? 0;
                                    return (
                                        <td
                                            key={m}
                                            style={{ padding: 0 }}
                                            title={v > 0 ? `${cls} / ${m}: ${v} балл(ов)` : undefined}
                                        >
                                            <div style={{ width: '100%', height: 24, background: cellColor(v), display: 'flex', alignItems: 'center', justifyContent: 'center', color: v > 0 ? '#fff' : 'transparent', fontWeight: 700, borderRadius: 4 }}>
                                                {v > 0 ? v : ''}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate-300)' }}>
                    <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} />
                    Показывать закрытые
                </label>
                {visible.length > 0 && (
                    <span style={{ fontSize: 12, color: 'var(--slate-500)' }}>{visible.length} записей</span>
                )}
            </div>

            {/* Список находок */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visible.length === 0 ? (
                    <div style={{ color: 'var(--slate-500)', fontSize: 13, padding: 16, textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                        Нет дефектов. Добавь первую находку выше.
                    </div>
                ) : (
                    visible.map((f) => (
                        <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.55rem 0.8rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.16)', opacity: f.resolved ? 0.55 : 1 }}>
                            <span
                                style={{ width: 10, height: 10, borderRadius: '50%', background: SEVERITY_COLOR[f.severity], flexShrink: 0 }}
                                title={`severity: ${f.severity}`}
                            />
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-300)', minWidth: 90 }}>{f.defectClass}</span>
                            <span style={{ fontSize: 12, color: 'var(--accent)', minWidth: 70 }}>{f.module}</span>
                            <span style={{ flex: 1, fontSize: 13, color: 'var(--slate-200)', minWidth: 0 }}>
                                {f.description}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
                                {new Date(f.createdAt).toLocaleDateString()}
                            </span>
                            <button onClick={() => toggleResolved(f.id)} style={iconBtn} title={f.resolved ? 'Открыть' : 'Закрыть'}>
                                {f.resolved ? '↩' : '✓'}
                            </button>
                            <button onClick={() => removeFinding(f.id)} style={iconBtn} title="Удалить">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const ctl: React.CSSProperties = {
    padding: '0.45rem 0.6rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'var(--slate-200)',
    fontSize: 13,
};

const addBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '0.45rem 0.9rem',
    borderRadius: 8,
    border: 'none',
    background: '#f59e0b',
    color: '#1c1917',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: 13,
};

const iconBtn: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--slate-400)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 6,
    flexShrink: 0,
};

export default DefectMapPanel;
