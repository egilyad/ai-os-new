import React, { useState, useCallback, useMemo } from 'react';
import { strategyRegistry } from '../../kernel/instances';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import type {
    StrategyPrimitive,
    StrategyDefinition,
    ValidationResult,
    SequencePrimitive,
} from '../../kernel/contracts/debate-strategy-dsl';
import { Save, Upload, Play, CheckCircle, AlertCircle, FileCode } from 'lucide-react';
import { Skeleton } from '../Common/Skeleton';
import { s } from './debate-strategy-styles';
import { PRIMITIVE_META, createDefaultPrimitive, clonePrimitive } from './debate-strategy-utils';
import { PrimitiveCard } from './PrimitiveCard';
import { PrimitiveInspector } from './PrimitiveInspector';

const DebateStrategyBuilder: React.FC = () => {
    const [primitives, setPrimitives] = useState<StrategyPrimitive[]>([]);
    const [strategyName, setStrategyName] = useState('Custom Strategy');
    const [strategyDesc, setStrategyDesc] = useState('');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [jsonOutput, setJsonOutput] = useState('');
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [draggedType, setDraggedType] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
    const [loadingBuiltins, setLoadingBuiltins] = useState(false);

    const showToast = useCallback((msg: string, ok = true) => {
        setToast({ msg, ok });
        setTimeout(() => setToast(null), 3000);
    }, []);

    const addPrimitive = useCallback((type: string) => {
        setPrimitives((prev) => [...prev, createDefaultPrimitive(type)]);
        setSelectedIndex(null);
    }, []);

    const removePrimitive = useCallback((index: number) => {
        setPrimitives((prev) => prev.filter((_, i) => i !== index));
        setSelectedIndex((i) => (i === index ? null : i));
    }, []);

    const duplicatePrimitive = useCallback((index: number) => {
        setPrimitives((prev) => {
            const c = {
                ...clonePrimitive(prev[index]!),
                id: `${prev[index]!.type}-${Date.now()}`,
            } as StrategyPrimitive;
            return [...prev.slice(0, index + 1), c, ...prev.slice(index + 1)];
        });
    }, []);

    const movePrimitive = useCallback(
        (index: number, dir: -1 | 1) => {
            const target = index + dir;
            if (target < 0 || target >= primitives.length) return;
            setPrimitives((prev) => {
                const c = [...prev];
                [c[index]!, c[target]!] = [c[target]!, c[index]!];
                return c;
            });
            setSelectedIndex(target);
        },
        [primitives.length],
    );

    const updatePrimitive = useCallback((index: number, upd: StrategyPrimitive) => {
        setPrimitives((prev) => {
            const c = [...prev];
            c[index] = upd;
            return c;
        });
    }, []);

    const toggleSelected = useCallback((index: number) => {
        setSelectedIndex((i) => (i === index ? null : index));
    }, []);

    const buildStrategy = useCallback((): StrategyDefinition => {
        const root =
            primitives.length === 1
                ? primitives[0]!
                : {
                      type: 'sequence' as const,
                      id: 'custom-root',
                      steps: primitives.map((p, i) => ({ stepId: `step-${i}`, primitive: p })),
                  };
        return {
            id: `custom-${Date.now()}`,
            name: strategyName,
            description: strategyDesc || 'Custom strategy built with visual builder',
            version: '1.0.0',
            root,
        };
    }, [primitives, strategyName, strategyDesc]);

    const handleValidate = useCallback(() => {
        setValidation(strategyRegistry.validate(buildStrategy()));
    }, [buildStrategy]);

    const handleExport = useCallback(() => {
        const def = buildStrategy();
        setJsonOutput(JSON.stringify(def, null, 2));
        setValidation(strategyRegistry.validate(def));
    }, [buildStrategy]);

    const handleImport = useCallback(() => {
        if (!jsonOutput) return;
        try {
            safeJsonParse(jsonOutput);
            const result = strategyRegistry.importJson(jsonOutput);
            if (result.success) {
                setValidation({ valid: true, errors: [], warnings: [] });
                showToast('Strategy imported successfully');
            } else {
                setValidation({
                    valid: false,
                    errors: result.errors || [
                        { path: 'json', message: 'Import failed', code: 'IMPORT_ERROR' },
                    ],
                    warnings: [],
                });
                showToast('Import failed', false);
            }
        } catch {
            showToast('Invalid JSON', false);
        }
    }, [jsonOutput, showToast]);

    const handleSaveMode = useCallback(() => {
        try {
            const def = buildStrategy();
            const result = strategyRegistry.validate(def);
            if (!result.valid) {
                showToast('Cannot save: validation errors', false);
                return;
            }
            strategyRegistry.register(def, false);
            showToast(`Strategy "${def.name}" saved to registry`);
        } catch (e) {
            showToast(`Save failed: ${e}`, false);
        }
    }, [buildStrategy, showToast]);

    const handleDeploy = useCallback(() => {
        try {
            const def = buildStrategy();
            const result = strategyRegistry.validate(def);
            if (!result.valid) {
                showToast('Cannot deploy: validation errors', false);
                return;
            }
            showToast(`Deployed: "${def.name}" — ready for debate`);
        } catch (e) {
            showToast(`Deploy failed: ${e}`, false);
        }
    }, [buildStrategy, showToast]);

    const loadBuiltin = useCallback(
        (id: string) => {
            setLoadingBuiltins(true);
            try {
                const def = strategyRegistry.get(id);
                if (!def) {
                    showToast(`Strategy "${id}" not found`, false);
                    return;
                }
                const extracted: StrategyPrimitive[] = [];
                if (def.root.type === 'sequence') {
                    const seq = def.root as SequencePrimitive;
                    extracted.push(...(seq.steps?.map((s) => s.primitive) || []));
                } else {
                    extracted.push(clonePrimitive(def.root));
                }
                setPrimitives(extracted.length > 0 ? extracted : [clonePrimitive(def.root)]);
                setStrategyName(def.name);
                setStrategyDesc(def.description);
                setSelectedIndex(null);
                showToast(`Loaded: "${def.name}"`);
            } catch (e) {
                showToast(`Failed to load: ${e}`, false);
            } finally {
                setLoadingBuiltins(false);
            }
        },
        [showToast],
    );

    const handleDragStart = useCallback((type: string) => {
        setDraggedType(type);
    }, []);
    const handleDrop = useCallback(() => {
        if (draggedType) {
            addPrimitive(draggedType);
            setDraggedType(null);
        }
    }, [draggedType, addPrimitive]);
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const builtinList = useMemo(() => strategyRegistry.list().filter((e) => e.builtin), []);

    const selectedPrimitive = selectedIndex !== null ? primitives[selectedIndex] : null;

    return (
        <div style={s.panel}>
            <div style={s.toolbar}>
                <input
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    style={{ ...s.input, width: 140 }}
                    placeholder="Strategy name"
                />
                <input
                    value={strategyDesc}
                    onChange={(e) => setStrategyDesc(e.target.value)}
                    style={{ ...s.input, width: 180 }}
                    placeholder="Description (optional)"
                />
                <button style={s.btn} onClick={handleValidate}>
                    <CheckCircle size={12} /> Validate
                </button>
                <button style={s.btnPrimary} onClick={handleExport}>
                    <Save size={12} /> Export
                </button>
                <button style={s.btn} onClick={handleImport}>
                    <Upload size={12} /> Import
                </button>
                <button style={s.btnSuccess} onClick={handleSaveMode}>
                    <FileCode size={12} /> Save to Registry
                </button>
                <button style={s.btn} onClick={handleDeploy}>
                    <Play size={12} /> Deploy
                </button>
                {validation && (
                    <span style={s.validBadge(validation.valid)}>
                        {validation.valid ? '✓ Valid' : `✗ ${validation.errors.length} error(s)`}
                    </span>
                )}
                <span style={{ fontSize: 10, color: 'var(--slate-500)', marginLeft: 'auto' }}>
                    {primitives.length} primitive{primitives.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Templates bar */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 12px',
                    borderBottom: '1px solid rgba(100,116,139,0.1)',
                    background: 'rgba(0,0,0,0.15)',
                }}
            >
                <span
                    style={{
                        fontSize: 9,
                        color: 'var(--slate-500)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        marginRight: 4,
                    }}
                >
                    Templates:
                </span>
                {loadingBuiltins && <Skeleton width={60} height={12} />}
                {builtinList.map((entry) => (
                    <button
                        key={entry.definition.id}
                        onClick={() => loadBuiltin(entry.definition.id)}
                        style={{
                            padding: '2px 8px',
                            borderRadius: 3,
                            border: '1px solid rgba(100,116,139,0.2)',
                            background: 'rgba(30,41,59,0.6)',
                            color: 'var(--slate-400)',
                            cursor: 'pointer',
                            fontSize: 10,
                        }}
                    >
                        {entry.definition.name}
                    </button>
                ))}
            </div>

            <div style={s.main}>
                {/* Palette */}
                <div style={s.palette}>
                    <div style={s.paletteTitle}>Primitives</div>
                    {Object.entries(PRIMITIVE_META).map(([type, meta]) => (
                        <div
                            key={type}
                            style={s.paletteItem}
                            draggable
                            onDragStart={() => handleDragStart(type)}
                            onClick={() => addPrimitive(type)}
                            title={meta.description}
                        >
                            <div style={s.paletteDot(meta.color)} />
                            {meta.label}
                        </div>
                    ))}
                </div>

                {/* Canvas */}
                <div style={s.canvas} onDrop={handleDrop} onDragOver={handleDragOver}>
                    {primitives.length === 0 && (
                        <div style={s.canvasEmpty}>Drag primitives here or click to add</div>
                    )}
                    {primitives.map((p, i) => (
                        <PrimitiveCard
                            key={p.id}
                            primitive={p}
                            index={i}
                            total={primitives.length}
                            isSelected={selectedIndex === i}
                            onSelect={toggleSelected}
                            onMove={movePrimitive}
                            onDuplicate={duplicatePrimitive}
                            onRemove={removePrimitive}
                        />
                    ))}
                </div>

                {/* Inspector */}
                <div style={s.inspector}>
                    {!selectedPrimitive ? (
                        <div style={{ fontSize: 10, color: 'var(--slate-500)', fontStyle: 'italic' }}>
                            Click a primitive to edit its properties
                        </div>
                    ) : (
                        <PrimitiveInspector
                            primitive={selectedPrimitive}
                            onUpdate={(upd) => updatePrimitive(selectedIndex!, upd)}
                        />
                    )}
                </div>

                {/* JSON Preview */}
                <div style={s.preview}>
                    <div style={s.previewTitle}>JSON Output</div>
                    {jsonOutput ? (
                        <>
                            <div style={s.json}>{jsonOutput}</div>
                            {validation && validation.errors.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                    {validation.errors.map((e, _i) => (
                                        <div
                                            key={e.path}
                                            style={{
                                                fontSize: 9,
                                                color: 'var(--error)',
                                                marginBottom: 1,
                                            }}
                                        >
                                            {e.path}: {e.message}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ fontSize: 10, color: 'var(--slate-500)', fontStyle: 'italic' }}>
                            Click <strong>Export</strong> to generate the strategy JSON
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast && (
                <div
                    style={{
                        ...s.toast,
                        background: toast.ok ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                    }}
                >
                    {toast.ok ? (
                        <CheckCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    ) : (
                        <AlertCircle size={12} style={{ display: 'inline', marginRight: 4 }} />
                    )}
                    {toast.msg}
                </div>
            )}
        </div>
    );
};

export default DebateStrategyBuilder;
