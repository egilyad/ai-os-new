import React, { useState, useEffect, useCallback } from 'react';
import {
    Play,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    BarChart3,
    GitCompare,
    X,
    RotateCcw,
    Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roleService, roleTestingSandboxService } from '../../kernel/instances';
import { useTranslation } from '../../i18n/useTranslation';

interface RoleSandboxProps {
    isOpen: boolean;
    onClose: () => void;
}

type HistoryEntry = {
    roleId: string;
    roleName: string;
    prompt: string;
    success: boolean;
    response: string;
    latencyMs: number;
    tokens: number;
    testId: string;
    timestamp: number;
};

export const RoleSandbox: React.FC<RoleSandboxProps> = ({ isOpen, onClose }) => {
    useTranslation();
    const [roles, setRoles] = useState(() => roleService.getAllRoles());
    useEffect(() => {
        setRoles(roleService.getAllRoles());
    }, []);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [results, setResults] = useState<HistoryEntry[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [testName, setTestName] = useState('');
    const [showSaveInput, setShowSaveInput] = useState(false);

    const handleRunTest = useCallback(async () => {
        if (!prompt.trim() || selectedRoleIds.length === 0) return;
        setIsRunning(true);
        setResults([]);

        const selectedRoles = roles.filter((r) => selectedRoleIds.includes(r.id));
        const newResults: HistoryEntry[] = [];

        for (const role of selectedRoles) {
            const res = await roleTestingSandboxService.runTest(
                role.id,
                role.systemPrompt || '',
                prompt,
            );
            newResults.push({
                roleId: role.id,
                roleName: role.name,
                success: res.success,
                response: res.response,
                latencyMs: res.metrics.latencyMs,
                tokens: res.metrics.tokens,
                testId: res.testId,
                timestamp: res.timestamp,
                prompt,
            });
        }

        setResults(newResults);
        setHistory((prev) => [...prev, ...newResults].slice(-100));
        setIsRunning(false);
    }, [prompt, selectedRoleIds, roles]);

    const handleSaveTestCase = useCallback(async () => {
        if (!testName.trim() || selectedRoleIds.length === 0) return;
        for (const roleId of selectedRoleIds) {
            await roleTestingSandboxService.saveTestCase(roleId, { name: testName, prompt });
        }
        setShowSaveInput(false);
        setTestName('');
    }, [testName, selectedRoleIds, prompt]);

    const handleRerun = useCallback(
        async (testPrompt: string, roleId: string) => {
            const role = roles.find((r) => r.id === roleId);
            if (!role) return;
            const res = await roleTestingSandboxService.runTest(
                roleId,
                role.systemPrompt || '',
                testPrompt,
            );
            const newResult: HistoryEntry = {
                roleId: role.id,
                roleName: role.name,
                success: res.success,
                response: res.response,
                latencyMs: res.metrics.latencyMs,
                tokens: res.metrics.tokens,
                testId: res.testId,
                timestamp: res.timestamp,
                prompt: testPrompt,
            };
            setResults((prev) => [newResult, ...prev.filter((r) => r.roleId !== roleId)]);
            setHistory((prev) => [newResult, ...prev].slice(-100));
        },
        [roles],
    );

    const toggleRole = (roleId: string) => {
        setSelectedRoleIds((prev) =>
            prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId],
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 100,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: 780,
                            maxHeight: '90vh',
                            overflow: 'auto',
                            background:
                                'linear-gradient(145deg, rgba(20,20,40,0.98), rgba(15,15,30,0.98))',
                            borderRadius: 16,
                            border: '1px solid rgba(99,102,241,0.2)',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                        }}
                    >
                        <div
                            style={{
                                padding: '20px 24px',
                                borderBottom: '1px solid rgba(100,116,139,0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Play size={18} color="white" />
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            margin: 0,
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--slate-200)',
                                        }}
                                    >
                                        Role Testing Sandbox
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                                        Test roles with prompts, compare side-by-side
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--slate-500)',
                                    cursor: 'pointer',
                                    padding: 4,
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ padding: '20px 24px' }}>
                            <div style={{ marginBottom: 16 }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-400)',
                                        marginBottom: 8,
                                    }}
                                >
                                    Select Roles to Test
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {roles.map((role) => {
                                        const selected = selectedRoleIds.includes(role.id);
                                        return (
                                            <button
                                                key={role.id}
                                                onClick={() => toggleRole(role.id)}
                                                style={{
                                                    padding: '5px 10px',
                                                    borderRadius: 8,
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    border: `1px solid ${selected ? 'rgba(99,102,241,0.5)' : 'rgba(100,116,139,0.2)'}`,
                                                    background: selected
                                                        ? 'rgba(99,102,241,0.15)'
                                                        : 'rgba(30,30,50,0.5)',
                                                    color: selected ? '#818cf8' : '#94a3b8',
                                                }}
                                            >
                                                {selected && (
                                                    <CheckCircle2
                                                        size={12}
                                                        style={{
                                                            marginRight: 4,
                                                            verticalAlign: 'middle',
                                                        }}
                                                    />
                                                )}
                                                {role.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label
                                    style={{
                                        display: 'block',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        color: 'var(--slate-400)',
                                        marginBottom: 6,
                                    }}
                                >
                                    Test Prompt
                                </label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Enter a prompt to test with the selected roles..."
                                        rows={2}
                                        style={{
                                            flex: 1,
                                            padding: '10px 14px',
                                            borderRadius: 10,
                                            border: '1px solid rgba(100,116,139,0.25)',
                                            background: 'rgba(30,30,50,0.6)',
                                            color: 'var(--slate-200)',
                                            fontSize: '0.85rem',
                                            resize: 'vertical',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                    <button
                                        onClick={handleRunTest}
                                        disabled={
                                            !prompt.trim() ||
                                            selectedRoleIds.length === 0 ||
                                            isRunning
                                        }
                                        style={{
                                            padding: '10px 16px',
                                            borderRadius: 10,
                                            border: 'none',
                                            background: isRunning
                                                ? 'rgba(99,102,241,0.3)'
                                                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '0.85rem',
                                            cursor: isRunning ? 'wait' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 6,
                                            alignSelf: 'flex-start',
                                        }}
                                    >
                                        {isRunning ? (
                                            <Loader2 size={16} className="provider-spin" />
                                        ) : (
                                            <Play size={16} />
                                        )}
                                        {isRunning ? 'Running...' : 'Run Test'}
                                    </button>
                                </div>
                                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                    {!showSaveInput ? (
                                        <button
                                            onClick={() => setShowSaveInput(true)}
                                            disabled={
                                                !prompt.trim() || selectedRoleIds.length === 0
                                            }
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: 6,
                                                fontSize: '0.7rem',
                                                border: '1px solid rgba(16,185,129,0.3)',
                                                background: 'rgba(16,185,129,0.08)',
                                                color: '#34d399',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <Save size={12} /> Save as Test Case
                                        </button>
                                    ) : (
                                        <div
                                            style={{
                                                display: 'flex',
                                                gap: 6,
                                                alignItems: 'center',
                                            }}
                                        >
                                            <input
                                                type="text"
                                                value={testName}
                                                onChange={(e) => setTestName(e.target.value)}
                                                placeholder="Test case name..."
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    border: '1px solid rgba(100,116,139,0.25)',
                                                    background: 'rgba(30,30,50,0.6)',
                                                    color: 'var(--slate-200)',
                                                    fontSize: '0.75rem',
                                                    outline: 'none',
                                                    width: 200,
                                                }}
                                            />
                                            <button
                                                onClick={handleSaveTestCase}
                                                disabled={!testName.trim()}
                                                style={{
                                                    padding: '4px 10px',
                                                    borderRadius: 6,
                                                    fontSize: '0.7rem',
                                                    border: 'none',
                                                    background: 'rgba(16,185,129,0.3)',
                                                    color: 'white',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowSaveInput(false);
                                                    setTestName('');
                                                }}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: 6,
                                                    fontSize: '0.7rem',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    color: 'var(--slate-500)',
                                                    cursor: 'pointer',
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {results.length > 0 && (
                                <div>
                                    <label
                                        style={{
                                            display: 'block',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            color: 'var(--slate-400)',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <GitCompare
                                            size={14}
                                            style={{ verticalAlign: 'middle', marginRight: 4 }}
                                        />
                                        Results ({results.length} roles)
                                    </label>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 10,
                                        }}
                                    >
                                        {results.map((tc, i) => (
                                            <motion.div
                                                key={tc.testId}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                style={{
                                                    padding: 14,
                                                    borderRadius: 12,
                                                    background: tc.success
                                                        ? 'rgba(30,30,50,0.5)'
                                                        : 'rgba(239,68,68,0.05)',
                                                    border: `1px solid ${tc.success ? 'rgba(100,116,139,0.15)' : 'rgba(239,68,68,0.2)'}`,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: 8,
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 8,
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                                color: 'var(--slate-200)',
                                                            }}
                                                        >
                                                            {tc.roleName}
                                                        </span>
                                                        {tc.success ? (
                                                            <CheckCircle2
                                                                size={14}
                                                                color="#10b981"
                                                            />
                                                        ) : (
                                                            <XCircle size={14} color="#ef4444" />
                                                        )}
                                                    </div>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            gap: 12,
                                                            fontSize: '0.7rem',
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        <span>
                                                            <Clock
                                                                size={12}
                                                                style={{ verticalAlign: 'middle' }}
                                                            />{' '}
                                                            {tc.latencyMs}ms
                                                        </span>
                                                        <span>
                                                            <Zap
                                                                size={12}
                                                                style={{ verticalAlign: 'middle' }}
                                                            />{' '}
                                                            {tc.tokens} tokens
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: '0.8rem',
                                                        color: 'var(--slate-300)',
                                                        lineHeight: 1.6,
                                                        whiteSpace: 'pre-wrap',
                                                        maxHeight: 200,
                                                        overflow: 'auto',
                                                    }}
                                                >
                                                    {tc.response}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {history.length > 0 && (
                                <div
                                    style={{
                                        marginTop: 16,
                                        paddingTop: 16,
                                        borderTop: '1px solid rgba(100,116,139,0.15)',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            marginBottom: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-500)',
                                            }}
                                        >
                                            <BarChart3
                                                size={12}
                                                style={{ verticalAlign: 'middle', marginRight: 4 }}
                                            />
                                            Test History ({history.length})
                                        </span>
                                        <button
                                            onClick={() => setHistory([])}
                                            style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--slate-500)',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Clear
                                        </button>
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 6,
                                            maxHeight: 300,
                                            overflowY: 'auto',
                                        }}
                                    >
                                        {history.map((entry, i) => (
                                            <div
                                                key={`${entry.testId}-${i}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(100,116,139,0.1)',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 10,
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--slate-500)',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {new Date(
                                                            entry.timestamp,
                                                        ).toLocaleTimeString()}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            color: 'var(--slate-200)',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {entry.roleName}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--slate-500)',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            maxWidth: 200,
                                                        }}
                                                    >
                                                        {entry.prompt}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            padding: '1px 6px',
                                                            borderRadius: 4,
                                                            background: entry.success
                                                                ? 'rgba(16,185,129,0.15)'
                                                                : 'rgba(239,68,68,0.15)',
                                                            color: entry.success
                                                                ? '#34d399'
                                                                : '#f87171',
                                                        }}
                                                    >
                                                        {entry.success ? 'OK' : 'FAIL'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    <span
                                                        style={{
                                                            fontSize: '0.65rem',
                                                            color: 'var(--slate-500)',
                                                        }}
                                                    >
                                                        {entry.latencyMs}ms
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleRerun(entry.prompt, entry.roleId)
                                                        }
                                                        style={{
                                                            padding: '2px 6px',
                                                            borderRadius: 4,
                                                            fontSize: '0.65rem',
                                                            border: '1px solid rgba(99,102,241,0.3)',
                                                            background: 'rgba(99,102,241,0.08)',
                                                            color: '#818cf8',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 3,
                                                        }}
                                                    >
                                                        <RotateCcw size={10} /> Re-run
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
