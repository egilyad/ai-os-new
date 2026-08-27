import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Wrench, Plus, Search, Download, Upload, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toolService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ToolsPanel');
import type { ToolDefinition } from '../../kernel/instances';
import { eventBus, EVENTS } from '../../kernel/instances';
import type { EventMap } from '../../kernel/instances';
import { useAutoClearError } from '../../hooks/useAutoClearError';
import { useTranslation } from '../../i18n/useTranslation';
import ModuleInfo from '../ModuleInfo';
import { ToolCard } from './ToolCard';
import { ToolInspectorPanel } from './ToolInspectorPanel';
import { safeJsonParse } from '../../kernel/utils/safe-json';
import { Button } from '../Common';
import {
    dismissBtnRed,
    errorBannerLg,
    flexGap3,
    glassPanelColRounded24,
    pageSubtitleMuted,
    pageTitleLarge,
    positionRelativeFlex1,
    searchIconAbsolute,
    searchInputLarge,
    sectionHeaderBottom,
} from '../../styles/common';

type ToolTypeFilter = 'all' | 'api' | 'script' | 'database';

const ToolsPanel: React.FC = () => {
    const [tools, setTools] = useState<ToolDefinition[]>(() => {
        try {
            return toolService.getTools();
        } catch (e) {
            LOGGER.warn('ToolsPanel', 'Failed to load tools', { error: e });
            return [];
        }
    });
    const [error, setError] = useState<string | null>(null);
    const [selectedTool, setSelectedTool] = useState<ToolDefinition | null>(null);
    const [testOutput, setTestOutput] = useState<string>('');
    const [isExecuting, setIsExecuting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<ToolTypeFilter>('all');
    const [activeTab, setActiveTab] = useState<'sandbox' | 'schema' | 'security'>('sandbox');
    const [testParams, setTestParams] = useState<string>('{\n  "query": "test"\n}');
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isMountedRef = useRef(true);

    const clearError = useAutoClearError(setError);

    const handleToggleTool = useCallback(
        (id: string) => {
            try {
                toolService.toggleTool(id);
                if (isMountedRef.current) setTools(toolService.getTools());
                if (isMountedRef.current) setError(null);
            } catch (err) {
                LOGGER.warn('ToolsPanel', 'Failed to toggle tool', { error: err });
                if (isMountedRef.current) {
                    setError(t('common.unknown_error'));
                    clearError();
                }
            }
        },
        [clearError, t],
    );

    useEffect(() => {
        isMountedRef.current = true;
        const sub = eventBus.onSafe<ToolDefinition[]>('tools:updated', (data) => {
            if (!isMountedRef.current) return;
            setTools(data);
            if (selectedTool) {
                setSelectedTool(data.find((t: ToolDefinition) => t.id === selectedTool.id) || null);
            }
        });
        return () => {
            isMountedRef.current = false;
            sub();
        };
    }, [selectedTool]);

    const handleExportTools = () => {
        try {
            const data = toolService.exportTools();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tools-export-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                message: 'Tools exported successfully',
                type: 'success',
            });
            if (isMountedRef.current) setError(null);
        } catch (err) {
            LOGGER.warn('ToolsPanel', 'Export failed', { error: err });
            if (isMountedRef.current) {
                setError(t('common.unknown_error'));
                clearError();
            }
        }
    };

    const handleImportTools = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const count = await toolService.importTools(event.target?.result as string);
                if (isMountedRef.current) {
                    setTools(toolService.getTools());
                    eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                        message: `Successfully imported ${count} tool(s)`,
                        type: 'success',
                    });
                    setError(null);
                }
            } catch (err) {
                LOGGER.warn('ToolsPanel', 'Failed to import tools', { error: err });
                if (isMountedRef.current) {
                    setError(t('common.unknown_error'));
                    clearError();
                }
                eventBus.emit(EVENTS.NOTIFICATION as keyof EventMap, {
                    message: t('common.unknown_error'),
                    type: 'error',
                });
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const filteredTools = tools.filter((t) => {
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        if (
            searchQuery &&
            !t.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !t.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
            return false;
        return true;
    });

    const handleRunTest = async () => {
        if (!selectedTool) return;
        setIsExecuting(true);
        setTestOutput('Initializing secure sandbox environment...\nMounting execution context...');
        setError(null);

        try {
            let parsedParams: Record<string, unknown> = {};
            try {
                parsedParams = (safeJsonParse(testParams) as Record<string, unknown>) ?? {};
            } catch (parseErr) {
                setTestOutput(`Error: Invalid JSON parameters.\n${(parseErr as Error).message}`);
                setIsExecuting(false);
                return;
            }

            const startTime = Date.now();
            const result = await toolService.execute(selectedTool.id, parsedParams);
            if (!isMountedRef.current) return;
            const latency = Date.now() - startTime;

            const formattedOutput = `Execution completed in ${latency}ms\nStatus: ${result.status.toUpperCase()}\n\nResult:\n${JSON.stringify(result.data || result.error, null, 2)}`;
            setTestOutput(formattedOutput);
        } catch (execErr) {
            LOGGER.warn('ToolsPanel', 'Tool execution failed', { error: execErr });
            if (isMountedRef.current) {
                setTestOutput(t('common.unknown_error'));
                setError(t('common.unknown_error'));
                clearError();
            }
        } finally {
            if (isMountedRef.current) setIsExecuting(false);
        }
    };

    return (
        <div
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div style={sectionHeaderBottom}>
                <div>
                    <h2 style={pageTitleLarge}>
                        <Wrench size={28} color="#f59e0b" aria-hidden="true" /> {t('tools.title')}
                    </h2>
                    <p style={pageSubtitleMuted}>{t('tools.subtitle')}</p>
                </div>
                <div style={flexGap3}>
                    <Button
                        variant="ghost"
                        onClick={handleExportTools}
                        aria-label={t('tools.export_aria')}
                    >
                        <Download size={16} aria-hidden="true" /> {t('common.export')}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        aria-label={t('tools.import_aria')}
                    >
                        <Upload size={16} aria-hidden="true" /> {t('common.import')}
                    </Button>
                    <button
                        onClick={() =>
                            eventBus.emit(EVENTS.NOTIFICATION, {
                                message: 'Capability Registry Wizard opening...',
                                type: 'info',
                            })
                        }
                        style={{
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            borderRadius: 12,
                            background: 'linear-gradient(90deg, #f59e0b, #d97706)',
                            border: 'none',
                            color: 'white',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 15px rgba(245,158,11,0.3)',
                        }}
                        aria-label={t('tools.register')}
                    >
                        <Plus size={18} aria-hidden="true" /> {t('tools.register')}
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={errorBannerLg}
                        role="alert"
                        aria-live="polite"
                    >
                        <AlertTriangle size={18} aria-hidden="true" /> {error}
                        <button
                            onClick={() => setError(null)}
                            style={dismissBtnRed}
                            aria-label={t('common.dismiss_error')}
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div
                style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: '1fr 500px',
                    gap: '1.5rem',
                    minHeight: 0,
                }}
            >
                {/* Tools List */}
                <div style={glassPanelColRounded24}>
                    <div
                        style={{
                            display: 'flex',
                            gap: '1rem',
                            alignItems: 'center',
                            padding: '1.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={positionRelativeFlex1}>
                            <Search size={16} style={searchIconAbsolute} aria-hidden="true" />
                            <input
                                type="text"
                                placeholder={t('tools.search_placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={searchInputLarge}
                                onFocus={(e) => (e.target.style.borderColor = '#f59e0b')}
                                onBlur={(e) =>
                                    (e.target.style.borderColor = 'rgba(255,255,255,0.05)')
                                }
                                aria-label={t('tools.search_placeholder')}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as ToolTypeFilter)}
                                style={{
                                    padding: '0.85rem 1rem',
                                    background: 'rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: 12,
                                    color: 'white',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                }}
                                aria-label={t('tools.filter_aria')}
                            >
                                <option value="all">{t('tools.filter.all')}</option>
                                <option value="api">{t('tools.filter.rest')}</option>
                                <option value="script">{t('tools.filter.scripts')}</option>
                                <option value="database">{t('tools.filter.db')}</option>
                            </select>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '1rem',
                            padding: '1.5rem',
                            alignContent: 'start',
                            background: 'rgba(255,255,255,0.01)',
                        }}
                    >
                        {filteredTools.length === 0 ? (
                            <div
                                style={{
                                    gridColumn: '1 / -1',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--slate-500)',
                                    gap: '1rem',
                                    padding: '4rem 0',
                                }}
                            >
                                <Wrench size={56} opacity={0.2} aria-hidden="true" />
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>
                                    {searchQuery || typeFilter !== 'all'
                                        ? t('tools.empty_filter')
                                        : t('tools.empty_none')}
                                </span>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {filteredTools.map((tool) => (
                                    <ToolCard
                                        key={tool.id}
                                        tool={tool}
                                        selected={selectedTool?.id === tool.id}
                                        onSelect={setSelectedTool}
                                        onToggle={handleToggleTool}
                                        t={t}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
                </div>

                <div style={glassPanelColRounded24}>
                    <ToolInspectorPanel
                        tool={selectedTool}
                        testParams={testParams}
                        testOutput={testOutput}
                        isExecuting={isExecuting}
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        onTestParamsChange={setTestParams}
                        onRunTest={handleRunTest}
                        onResetParams={() => setTestParams('{\n  \n}')}
                        t={t}
                    />
                </div>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportTools}
                aria-hidden="true"
            />
            <ModuleInfo moduleKey="tools" />
        </div>
    );
};

export default ToolsPanel;
