/**
 * Cognitive-aux / research panel (Experimental).
 * Architecture review tool — research-grade, not production surface (P1.21).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Loader2 } from 'lucide-react';
import { workspaceService, architectureReviewService, rootLogger } from '../../kernel/instances';
const LOGGER = rootLogger.child('ArchitectureReview');
import type { ArchFinding, ArchDebtItem } from '../../kernel/contracts/architecture-review';
import { useTranslation } from '../../i18n/useTranslation';
import EmptyAttachState from './EmptyAttachState';
import WorkspaceBar from './WorkspaceBar';
import StatsDashboard from './StatsDashboard';
import DebtReportSection from './DebtReportSection';
import ControlsBar from './ControlsBar';
import FindingCategory from './FindingCategory';
import { filterFindings, groupByType } from './arch-review-utils';

const DEBT_REPORT_PATH = 'docs/DEBT_REPORT.md';

const ArchitectureReview: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [attached, setAttached] = useState(() => {
        try {
            return workspaceService.isAttached();
        } catch {
            return false;
        }
    });
    const [workspaceName, setWorkspaceName] = useState(() => {
        try {
            return workspaceService.getWorkspaceName();
        } catch {
            return null;
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tree, setTree] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [findings, setFindings] = useState<ArchFinding[]>([]);
    const [scanning, setScanning] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['error']));
    const [searchQuery, setSearchQuery] = useState('');
    const [debtItems, setDebtItems] = useState<ArchDebtItem[]>([]);
    const [debtOpen, setDebtOpen] = useState(true);

    const navigateFile = (path: string) => navigate(`/project-os?file=${encodeURIComponent(path)}`);
    const createHypothesis = (source: string, title: string) =>
        navigate(
            `/hypothesis-gen?source=${encodeURIComponent(source)}&title=${encodeURIComponent(title)}`,
        );

    useEffect(() => {
        if (!attached) return;
        (async () => {
            try {
                const content = await workspaceService.readFile(DEBT_REPORT_PATH);
                setDebtItems(architectureReviewService.parseDebtReport(content));
            } catch (e) {
                LOGGER.warn('ArchitectureReview', 'debt report load error', { error: e });
            }
        })();
    }, [attached]);

    const refreshTree = useCallback(async () => {
        setLoading(true);
        try {
            const nodes = await workspaceService.listTree();
            setTree(nodes);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (attached) refreshTree();
    }, [attached, refreshTree]);

    const handleAttach = async () => {
        try {
            await workspaceService.attachDirectory();
            setAttached(true);
            setWorkspaceName(workspaceService.getWorkspaceName());
            await refreshTree();
        } catch (e) {
            LOGGER.warn('ArchitectureReview', 'attach error', { error: e });
        }
    };

    const handleDetach = () => {
        workspaceService.detach();
        setAttached(false);
        setWorkspaceName(null);
        setTree([]);
        setFindings([]);
    };

    const runAnalysis = useCallback(async () => {
        if (tree.length === 0) return;
        setScanning(true);
        setFindings([]);
        try {
            const result = await architectureReviewService.runFullAnalysis(tree, (path) =>
                workspaceService.readFile(path),
            );
            setFindings(result);
        } finally {
            setScanning(false);
        }
    }, [tree]);

    const toggleCategory = (cat: string) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const filtered = useMemo(() => filterFindings(findings, searchQuery), [findings, searchQuery]);
    const grouped = useMemo(() => groupByType(filtered), [filtered]);
    const categoryCount = useMemo(() => new Set(findings.map((f) => f.category)).size, [findings]);

    return (
        <div
            style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
            <div
                style={{
                    padding: '1.5rem 1.5rem 0.75rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Zap size={20} color="#a855f7" />
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-50)' }}>
                        {t('arch_review.title')}
                    </span>
                </div>
            </div>

            {!attached ? (
                <EmptyAttachState onAttach={handleAttach} t={t} />
            ) : (
                <>
                    <WorkspaceBar workspaceName={workspaceName} onDetach={handleDetach} />

                    {findings.length > 0 && (
                        <StatsDashboard
                            errorCount={grouped.error!.length}
                            warningCount={grouped.warning!.length}
                            infoCount={grouped.info!.length}
                            categoryCount={categoryCount}
                        />
                    )}

                    {debtItems.length > 0 && (
                        <DebtReportSection
                            debtItems={debtItems}
                            open={debtOpen}
                            onToggle={() => setDebtOpen((v) => !v)}
                            onNavigateFile={navigateFile}
                            onCreateHypothesis={createHypothesis}
                        />
                    )}

                    <ControlsBar
                        scanning={scanning}
                        canRun={tree.length > 0}
                        searchQuery={searchQuery}
                        onRunScan={runAnalysis}
                        onRefresh={refreshTree}
                        onSearchChange={setSearchQuery}
                        onClearSearch={() => setSearchQuery('')}
                    />

                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1.25rem' }}>
                        {loading ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)' }}>
                                <Loader2 size={20} />
                            </div>
                        ) : findings.length === 0 && !scanning ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--slate-600)',
                                    fontSize: '0.85rem',
                                }}
                            >
                                Run a scan to see architecture findings.
                            </div>
                        ) : scanning ? (
                            <div
                                style={{
                                    textAlign: 'center',
                                    padding: '3rem',
                                    color: 'var(--slate-500)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                }}
                            >
                                <Loader2 size={18} /> <span>Analyzing project structure...</span>
                            </div>
                        ) : (
                            (['error', 'warning', 'info'] as const).map((type) => (
                                <FindingCategory
                                    key={type}
                                    type={type}
                                    items={grouped[type]!}
                                    expanded={expandedCategories.has(type)}
                                    onToggle={() => toggleCategory(type)}
                                    onNavigateFile={navigateFile}
                                    onCreateHypothesis={createHypothesis}
                                />
                            ))
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default ArchitectureReview;
