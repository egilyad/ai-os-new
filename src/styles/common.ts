import type { CSSProperties } from 'react';

/**
 * DEPRECATION NOTICE (FA-02 / FA-10 design-system sweep, 2026-08-19):
 * All button-idiom helpers below (`button`, `buttonSm`, `buttonGhost`, `btnDangerSm`,
 * `btnSuccessSm`, `btnGhostWithBorder`, `buttonSmAction`, `btnGhostRounded8`, `btnImportExport`,
 * `btnActionCompact`, `buttonGroupPill`, `btnEventControl`, `btnSecondaryLg`, `btnDangerLg`,
 * `exportImportBtn`, `btnMdPadding`, `btnNavShape`, `btnControlBase`, `btnOutlineMuted`,
 * `debateInjectButton`, `debateReturnActiveBtn`, `debateVoteDismissBtn`, `tabBase`, `tabButtonBase`,
 * `debateTabButton`, `debateRuntimeTabButton`) are deprecated in favor of the canonical
 * `<Button>` primitive from `components/Common/Button` (variants: primary/secondary/ghost/danger/
 * success/accent/warning/neutral; sizes: md/sm/lg). New code must use `<Button>`; existing usages
 * are being migrated off `styles/common.ts` incrementally. Layout-only helpers (`flexButtonRow`,
 * `buttonGroupPill`) should become plain flex containers, not `<Button>`.
 */

export const flexCenter: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
export const flexBetween: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
};
export const flexCol: CSSProperties = { display: 'flex', flexDirection: 'column' };
export const flexCenterCol: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
};

export const textMuted: CSSProperties = { color: 'var(--slate-400)' };
export const textPrimary: CSSProperties = { color: 'var(--slate-100)' };
export const textSecondary: CSSProperties = { color: 'var(--slate-500)' };
export const textSm: CSSProperties = { fontSize: '0.8rem' };
export const textXs: CSSProperties = { fontSize: '0.75rem' };
export const textLg: CSSProperties = { fontSize: '1.1rem' };

export const panel: CSSProperties = {
    background: 'var(--slate-800)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '1rem',
};
export const card: CSSProperties = {
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    padding: '0.75rem',
};
export const input: CSSProperties = {
    background: 'var(--slate-900)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '0.5rem 0.75rem',
    color: 'var(--slate-100)',
    fontSize: '0.8rem',
    outline: 'none',
};
/** @deprecated Use <Button variant="primary"> from components/Common/Button. */
export const button: CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.8rem',
};
/** @deprecated Use <Button variant="primary" size="sm"> from components/Common/Button. */
export const buttonSm: CSSProperties = {
    padding: '0.35rem 0.75rem',
    borderRadius: 6,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
};
/** @deprecated Use <Button variant="ghost"> from components/Common/Button. */
export const buttonGhost: CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: 'var(--slate-400)',
    cursor: 'pointer',
    fontSize: '0.8rem',
};
export const label: CSSProperties = {
    color: 'var(--slate-400)',
    fontSize: '0.75rem',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
export const divider: CSSProperties = {
    border: 'none',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '0.75rem 0',
};
export const iconBtn: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--slate-500)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
};
export const badge: CSSProperties = {
    padding: '0.15rem 0.5rem',
    borderRadius: 999,
    fontSize: '0.7rem',
    fontWeight: 600,
};
export const scrollY: CSSProperties = { overflowY: 'auto', overflowX: 'hidden' };
export const truncate: CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};
export const gap2: CSSProperties = { gap: '0.5rem' };
export const gap1: CSSProperties = { gap: '0.25rem' };

export const textMutedSm: CSSProperties = { color: 'var(--slate-400)', fontSize: '0.75rem' };
export const textSecondarySm: CSSProperties = { color: 'var(--slate-500)', fontSize: '0.75rem' };
export const textMutedXs: CSSProperties = { color: 'var(--slate-400)', fontSize: '0.7rem' };
export const textSecondaryXs: CSSProperties = { color: 'var(--slate-500)', fontSize: '0.7rem' };
export const textWhiteXs: CSSProperties = { color: 'var(--slate-50)', fontSize: '0.75rem' };

export const grid2: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
};
export const grid3: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '1rem',
};
export const grid4: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: '1rem',
};

export const emptyState: CSSProperties = {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--slate-500)',
    fontSize: '0.85rem',
    fontStyle: 'italic',
};

export const glassPanel: CSSProperties = {
    padding: '1.25rem',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.05)',
};
export const glassPanelAlt: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.05)',
};

export const errorContainer: CSSProperties = {
    padding: '0.75rem 1rem',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};
export const errorCard: CSSProperties = {
    padding: '0.75rem',
    borderRadius: 8,
    background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.1)',
    color: 'var(--error)',
    fontSize: '0.85rem',
};

export const inputBase: CSSProperties = {
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(100,116,139,0.3)',
    background: 'rgba(15,15,30,0.6)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
};
export const selectBase: CSSProperties = {
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(100,116,139,0.3)',
    background: 'rgba(15,15,30,0.6)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    outline: 'none',
};

/* Cross-file common patterns (x3+) */
export const flexJustifyBetween: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
};
export const flexCenterSmGap: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
};
export const flexCenterGap2: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
};
export const flexCenterGap3: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
};
export const flexCenterGap4: CSSProperties = { display: 'flex', alignItems: 'center', gap: '1rem' };
export const flexColGap2: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
};
export const flexColGap3: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
};
export const flexColGap4: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
export const flexWrapGap2: CSSProperties = { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' };
export const flexAlignStart: CSSProperties = { display: 'flex', alignItems: 'flex-start' };
export const flexAlignEnd: CSSProperties = { display: 'flex', alignItems: 'flex-end' };
export const flexColGap6: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
};
export const flexColGap5: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
};

export const textWhiteWeight700Sm: CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--slate-50)',
};
export const textMutedWeight700Xs: CSSProperties = {
    fontSize: '0.6rem',
    color: 'var(--slate-500)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};

export const panelRounded16: CSSProperties = {
    padding: '1.25rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const panelDark: CSSProperties = {
    padding: '0.75rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.2)',
};

export const h3Section: CSSProperties = {
    margin: '0 0 0.5rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--slate-400)',
};
export const h3SectionFlex: CSSProperties = {
    margin: '0 0 0.5rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--slate-400)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};

export const btnDangerSm: CSSProperties = {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    border: '1px solid rgba(239,68,68,0.2)',
    background: 'rgba(239,68,68,0.1)',
    color: 'var(--error)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};
export const btnSuccessSm: CSSProperties = {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    border: '1px solid rgba(34,197,94,0.2)',
    background: 'rgba(34,197,94,0.1)',
    color: 'var(--success)',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};

export const sectionHeader: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--slate-50)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
};

export const flexBetweenMarginBottom: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
};
export const flexCenterFull: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

export const metricCard: CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(0,0,0,0.2)',
};
export const proseLine: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
};

/* Additional helpers referenced by script */
export const flex1: CSSProperties = { flex: 1 };
export const flex1Min0: CSSProperties = { flex: 1, minWidth: 0 };
export const flex1Min100: CSSProperties = { flex: 1, minWidth: 100 };
export const posRelative: CSSProperties = { position: 'relative' };
export const textCenter: CSSProperties = { textAlign: 'center' };
export const flexGap2: CSSProperties = { display: 'flex', gap: '0.5rem' };
export const flexCenterGap6px: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 };
export const flexColFull: CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
};
export const inputDarkBg: CSSProperties = {
    padding: '0.6rem 0.75rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.2)',
};
export const textMutedWeight700XsMargin: CSSProperties = {
    fontSize: '0.6rem',
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.2rem',
};
export const textMutedWeight600Xs: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--slate-400)',
    marginBottom: '0.4rem',
};
export const flexCenterGap6: CSSProperties = {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
};
export const flexColGap1: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
};
export const iconBtnBlue: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 6,
    border: '1px solid rgba(59,130,246,0.25)',
    background: 'rgba(59,130,246,0.1)',
    color: '#60a5fa',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
};
export const textSecondaryItalic: CSSProperties = {
    color: 'var(--slate-500)',
    fontStyle: 'italic',
};
export const alignCenter: CSSProperties = { alignItems: 'center' };
export const textMutedWeightSm: CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--slate-400)',
    marginBottom: '1rem',
};

/* From DebatePanel.tsx extraction */
export const glassPanelRounded24: CSSProperties = {
    padding: '1.5rem',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const flexBetweenCenterSm: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.3rem',
};
export const borderTopSection: CSSProperties = {
    borderTop: '1px solid rgba(255,255,255,0.05)',
    paddingTop: '0.6rem',
};
export const flexColGap3MarginTop3: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '0.75rem',
};
export const grid2TinyGap: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.3rem',
    fontSize: '0.62rem',
    color: 'var(--slate-400)',
};
export const metricBoxSmall: CSSProperties = {
    flex: 1,
    textAlign: 'center',
    padding: '0.3rem',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.03)',
};
export const textXsSubtle: CSSProperties = { fontSize: '0.55rem', color: 'var(--slate-500)' };
export const progressBgSmall: CSSProperties = {
    marginTop: '0.3rem',
    height: 4,
    borderRadius: 2,
    background: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
};
export const textWeight600: CSSProperties = { fontSize: '1rem', fontWeight: 600 };

/* From RoutingIntelligence + ChatPanel extraction (2026-05-27) */
export const textXsMuted: CSSProperties = { fontSize: '0.75rem', color: 'var(--slate-500)' };
export const textXsSecondary: CSSProperties = { fontSize: '0.75rem', color: 'var(--slate-400)' };
export const textXxsMuted: CSSProperties = { fontSize: '0.65rem', color: 'var(--slate-500)' };
export const textXsItalicMuted: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-500)',
    fontStyle: 'italic',
};

export const detailRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.2)',
};
export const flexBetweenGapMd: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: '0.75rem',
};
export const tabBase: CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};
export const flexWrapCenter: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
};

export const labelUppercase: CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'block',
    marginBottom: '0.35rem',
};
export const selectDark: CSSProperties = {
    width: '100%',
    padding: '0.6rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'var(--slate-200)',
    fontSize: '0.85rem',
    fontWeight: 600,
};
export const inputDarkSm: CSSProperties = {
    minWidth: 0,
    padding: '0.45rem 0.5rem',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0,0,0,0.25)',
    fontSize: '0.75rem',
};

export const toastBase: CSSProperties = {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 200,
    padding: '0.5rem 1rem',
    borderRadius: 10,
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backdropFilter: 'blur(8px)',
};
export const iconBtnMuted: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 4,
};

/* From OverviewTab.tsx extraction (2026-05-27) */
export const glassCard: CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: '1.25rem',
    border: '1px solid rgba(255,255,255,0.05)',
};
export const flexBetweenMb1: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
};
export const flexCenterGap2Mb1: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
};
export const flexCenterGap2Mb075: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
};
export const flexCenterGap2Mb05: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
};
export const btnGhostWithBorder: CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 600,
};
export const flexBetweenTextSm: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    color: 'var(--text-muted)',
};
export const progressBar6: CSSProperties = {
    height: 6,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginBottom: '0.5rem',
    overflow: 'hidden',
};
export const textWeight600Muted: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
};

/* From HealthPanel.tsx extraction */
export const statusDot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--success)',
    boxShadow: '0 0 10px #10b981',
};
export const sectionHeaderRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '1rem',
};
export const flexBetweenXsMargin: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.65rem',
    marginBottom: '0.2rem',
};
export const textWeight700Capitalize: CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'var(--slate-200)',
    textTransform: 'capitalize',
};
export const h3White: CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 800,
    margin: 0,
    color: 'var(--slate-50)',
};
export const textSmSecondaryMargin: CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--slate-500)',
    marginTop: 2,
};
export const progressBar4: CSSProperties = {
    height: 4,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: '0.5rem',
};

/* From InstalledProvidersView.tsx extraction */
export const textResultBox: CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--slate-200)',
    whiteSpace: 'pre-wrap',
    maxHeight: 100,
    overflowY: 'auto',
};
export const flexBetweenSuccessLabel: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.25rem',
    fontSize: '0.7rem',
    color: 'var(--success)',
    fontWeight: 700,
};
export const textErrorLabel: CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--error)',
    fontWeight: 700,
    marginBottom: '0.25rem',
};
export const successBox: CSSProperties = {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: 8,
};
export const errorBox: CSSProperties = {
    marginTop: '0.5rem',
    padding: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: 8,
};
export const selectSmall: CSSProperties = {
    padding: '0.35rem 0.5rem',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'var(--slate-200)',
    fontSize: '0.75rem',
    outline: 'none',
    cursor: 'pointer',
};
export const infoIcon: CSSProperties = { marginLeft: 4, opacity: 0.6, fontSize: '0.6rem' };
export const iconBtn36: CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
};
export const textErrorContent: CSSProperties = { fontSize: '0.85rem', color: '#fca5a5' };

/* From DashboardPanel.tsx extraction */
export const textLabelSmall: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-500)',
    marginBottom: '0.25rem',
};
export const metricBox: CSSProperties = {
    padding: '0.4rem 0.6rem',
    borderRadius: 6,
    background: 'rgba(0,0,0,0.2)',
};
export const textXxsSecondary: CSSProperties = { fontSize: '0.6rem', color: 'var(--slate-500)' };
export const progressBar8: CSSProperties = {
    height: 8,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    overflow: 'hidden',
};
export const textSmMutedMarginTop: CSSProperties = {
    fontSize: '0.7rem',
    color: 'var(--slate-400)',
    marginTop: '0.25rem',
};

/* Cross-file common patterns */
export const errorBanner: CSSProperties = {
    padding: '0.5rem 1rem',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 10,
    color: '#fca5a5',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
export const dismissBtn: CSSProperties = {
    cursor: 'pointer',
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: 'inherit',
};

/* From DebateRuntimePanel.tsx extraction */
export const iconMarginRight: CSSProperties = { verticalAlign: 'middle', marginRight: 4 };
export const flexColGap3FontSize075: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
    fontSize: '0.75rem',
};
export const purpleBorderSection: CSSProperties = {
    padding: '1.25rem',
    borderRadius: 12,
    background: 'rgba(30,30,50,0.4)',
    border: '1px solid rgba(139,92,246,0.15)',
};
export const cognitiveCard: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(30,30,50,0.3)',
    border: '1px solid rgba(100,116,139,0.15)',
};
export const phaseBadge: CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '0.2rem 0.5rem',
    borderRadius: 4,
};
export const buttonSmAction: CSSProperties = {
    padding: '0.4rem 0.75rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};

/* Debate surface extraction */
export const debatePanelRoot: CSSProperties = {
    display: 'block',
    overflow: 'visible',
};
export const debateStatusText: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--slate-50)',
};
export const debateStatusDot: CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'var(--success)',
};
export const debateTabBar: CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '0.75rem',
};
export const debateTabButton: CSSProperties = {
    padding: '0.5rem 1.25rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
export const debateHistoryCountBadge: CSSProperties = {
    background: 'rgba(59,130,246,0.2)',
    padding: '1px 8px',
    borderRadius: 8,
    fontSize: '0.75rem',
    color: 'var(--accent)',
};
export const debateReturnActiveBtn: CSSProperties = {
    marginLeft: 'auto',
    padding: '0.5rem 1rem',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    background: 'rgba(16,185,129,0.1)',
    color: 'var(--success)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};
export const debateLoadingState: CSSProperties = {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--slate-500)',
    gap: '1.5rem',
    padding: '6rem',
};
export const debateArenaPanel: CSSProperties = {
    display: 'block',
    overflow: 'visible',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const debateLogArea: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
};
export const debateVotePanel: CSSProperties = {
    margin: '0 2rem 1rem',
    padding: '1.25rem',
    borderRadius: 16,
    background: 'rgba(168,85,247,0.08)',
    border: '1px solid rgba(168,85,247,0.2)',
};
export const debateVoteHeader: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: '0.75rem',
};
export const debateVoteTitle: CSSProperties = {
    fontWeight: 700,
    color: 'var(--slate-200)',
    fontSize: '0.95rem',
};
export const debateVoteChoices: CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
};
export const debateVoteStatusRow: CSSProperties = {
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};
export const debateVoteStatusText: CSSProperties = {
    fontSize: '0.8rem',
    color: 'var(--slate-400)',
};
export const debateVoteDismissBtn: CSSProperties = {
    marginLeft: 'auto',
    padding: '2px 10px',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--slate-400)',
};
export const debateInjectButton: CSSProperties = {
    padding: '0 1.5rem',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'linear-gradient(90deg, #10b981, #059669)',
    boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
    fontWeight: 800,
};
export const debateRuntimeRoot: CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    overflowY: 'auto',
    padding: '1rem 0',
    position: 'relative',
};
export const debateRuntimeOverlay: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderRadius: 'inherit',
};
export const debateRuntimeOverlayTitle: CSSProperties = {
    marginTop: '1rem',
    fontSize: '1rem',
    fontWeight: 700,
    color: 'var(--slate-200)',
};
export const debateRuntimeOverlayDesc: CSSProperties = {
    marginTop: '0.5rem',
    fontSize: '0.85rem',
    color: 'var(--slate-500)',
};
export const debateRuntimeTitle: CSSProperties = {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--slate-200)',
};
export const debateRuntimeSubtitle: CSSProperties = {
    margin: '0.25rem 0 0',
    fontSize: '0.8rem',
    color: 'var(--slate-500)',
};
export const debateRuntimeGrid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
};
export const debateRuntimeSectionTitle: CSSProperties = {
    margin: 0,
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--purple-muted)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};
export const debateRuntimeEmptyState: CSSProperties = {
    padding: '2rem',
    textAlign: 'center',
    color: 'var(--slate-500)',
    fontSize: '0.85rem',
};
export const debateRuntimeTabBar: CSSProperties = {
    display: 'flex',
    gap: '0.25rem',
    marginBottom: '1rem',
    borderBottom: '1px solid rgba(100,116,139,0.2)',
};
export const debateRuntimeTabButton: CSSProperties = {
    padding: '0.4rem 1rem',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    background: 'transparent',
    transition: 'all 0.2s',
};
export const debateRuntimeArgumentsPanel: CSSProperties = {
    maxHeight: 400,
    overflowY: 'auto',
    borderRadius: 8,
    border: '1px solid rgba(100,116,139,0.15)',
};
export const debateRuntimeIssuePanel: CSSProperties = {
    padding: '1rem 1.25rem',
    borderRadius: 12,
    background: 'rgba(239,68,68,0.05)',
    border: '1px solid rgba(239,68,68,0.15)',
};

/* From PolicyPanel.tsx extraction */
export const modalFormSelect: CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    color: 'white',
    outline: 'none',
    fontSize: '0.9rem',
};
export const statCard: CSSProperties = {
    padding: '1.25rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
};
export const patternCard: CSSProperties = {
    padding: '1.5rem',
    borderRadius: 16,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
};
export const modalLabelUppercase: CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: 'var(--slate-500)',
    marginBottom: '0.5rem',
    display: 'block',
    textTransform: 'uppercase',
};
export const tabButtonBase: CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 700,
};
export const formFieldWhite: CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
};
export const textareaDark: CSSProperties = {
    width: '100%',
    height: 80,
    padding: '0.75rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    fontFamily: 'monospace',
};

/* From SettingsPanel.tsx extraction */
export const settingSelect: CSSProperties = {
    padding: '0.6rem 1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'white',
    outline: 'none',
    fontWeight: 600,
    cursor: 'pointer',
};
export const detailsContainer: CSSProperties = {
    marginBottom: '1rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    overflow: 'hidden',
};
export const detailsSummary: CSSProperties = {
    padding: '1rem 1.5rem',
    cursor: 'pointer',
    fontWeight: 700,
    color: 'var(--slate-50)',
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
export const sectionTitleLarge: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: 'var(--slate-50)',
    marginBottom: '1.5rem',
};
export const webhookInput: CSSProperties = {
    padding: '0.6rem 1rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'white',
    fontSize: '0.85rem',
    outline: 'none',
};
export const amberBtn: CSSProperties = {
    color: 'var(--warning)',
    padding: '0.6rem 1.25rem',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 700,
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    cursor: 'pointer',
};
export const dangerBtn: CSSProperties = {
    color: 'var(--error)',
    padding: '0.6rem 1.25rem',
    borderRadius: 8,
    fontSize: '0.85rem',
    fontWeight: 700,
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    cursor: 'pointer',
};
export const errorBannerLg: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '0.75rem 1rem',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.2)',
    borderRadius: 12,
    color: '#fca5a5',
    fontSize: '0.9rem',
};

/* From AnalyticsPanel.tsx extraction */
export const summaryMetricCard: CSSProperties = {
    padding: '1.5rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.03)',
    background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)',
    position: 'relative',
    overflow: 'hidden',
};
export const providerMetricBox: CSSProperties = {
    background: 'rgba(0,0,0,0.2)',
    padding: '1rem',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.02)',
};
export const h3ChartTitle: CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 800,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    color: 'var(--slate-50)',
};
export const workloadInfoBox: CSSProperties = {
    marginTop: '2rem',
    padding: '1rem',
    background: 'rgba(59,130,246,0.05)',
    borderRadius: 12,
    border: '1px solid rgba(59,130,246,0.2)',
};

/* From RouterTraceView.tsx extraction */
export const searchInputCompact: CSSProperties = {
    width: '100%',
    padding: '0.5rem 0.75rem 0.5rem 2rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    color: 'white',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
};
export const skippedRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    background: 'rgba(0,0,0,0.12)',
};
export const liveFeedPanel: CSSProperties = {
    padding: '1rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
    maxHeight: 'calc(100vh - 200px)',
    overflowY: 'auto',
};
export const cardHeaderRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.75rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
};
export const scoreHeader: CSSProperties = {
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'var(--slate-200)',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};
export const feedItemDefault: CSSProperties = {
    padding: '0.6rem 0.75rem',
    borderRadius: 10,
    cursor: 'pointer',
    background: 'rgba(0,0,0,0.12)',
    border: '1px solid transparent',
    transition: 'all 0.15s',
};
export const tagSmall: CSSProperties = {
    fontSize: '0.6rem',
    padding: '0.15rem 0.4rem',
    borderRadius: 3,
    fontWeight: 600,
};
export const providerBadge: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.2rem 0.5rem',
    borderRadius: 4,
    fontSize: '0.65rem',
    fontWeight: 700,
};
export const scoreRowDefault: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.03)',
};
export const winnerRow: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(16,185,129,0.05)',
    border: '1px solid rgba(16,185,129,0.2)',
};

/* From ToolsPanel + RolesPanel + MemoryPanel + PricingPanel extraction (2026-05-27) */
export const sectionHeaderBottom: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '1.5rem',
};
export const pageTitleLarge: CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 800,
    margin: '0 0 0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: 'var(--slate-50)',
};
export const pageSubtitleMuted: CSSProperties = {
    color: 'var(--slate-400)',
    margin: 0,
    fontSize: '0.85rem',
};
export const searchInputLarge: CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 2.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    color: 'white',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontSize: '0.9rem',
};
export const searchIconAbsolute: CSSProperties = {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--slate-500)',
};
export const positionRelativeFlex1: CSSProperties = { position: 'relative', flex: 1 };
export const flexGap3: CSSProperties = { display: 'flex', gap: '0.75rem' };
export const exportImportBtn: CSSProperties = {
    padding: '0.6rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    cursor: 'pointer',
};
export const glassPanelColRounded24: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 24,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(10px)',
};
export const labelUppercaseBold: CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
export const dismissBtnRed: CSSProperties = {
    marginLeft: 'auto',
    background: 'none',
    border: 'none',
    color: '#fca5a5',
    cursor: 'pointer',
};
export const statBox: CSSProperties = {
    background: 'rgba(0,0,0,0.3)',
    padding: '1.25rem',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const progressLabel: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    fontWeight: 700,
};
export const progressBarSmall: CSSProperties = {
    height: 6,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    overflow: 'hidden',
};
export const sectionPanelTitle: CSSProperties = {
    fontSize: '0.9rem',
    fontWeight: 800,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--slate-50)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
export const budgetValueLarge: CSSProperties = {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: 'var(--slate-50)',
};

/* From CognitiveBuilder.tsx extraction */
export const nodeDetailRow: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-300)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
};
export const panelColDark: CSSProperties = {
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.2)',
};
export const labelSection800: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-400)',
    fontWeight: 800,
    letterSpacing: '0.05em',
};
export const labelBlockUppercase: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-400)',
    fontWeight: 600,
    display: 'block',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
};
export const selectDarkWide: CSSProperties = {
    width: '100%',
    padding: '0.75rem',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: 'white',
    outline: 'none',
    fontSize: '0.9rem',
    cursor: 'pointer',
};
export const flexButtonRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: 6 };

/* From SREAgentPanel.tsx extraction */
export const metricCardCenter: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.05)',
    textAlign: 'center',
};
export const labelMetricSub: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '0.3rem',
};
export const emptyStateCenter: CSSProperties = {
    textAlign: 'center',
    padding: '3rem',
    color: 'var(--slate-500)',
};
export const emptyStateTitle: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
};
export const emptyStateSubtitle: CSSProperties = { fontSize: '0.85rem' };

/* From DocumentationPanel.tsx extraction */
export const docPageTitle: CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 800,
    margin: 0,
    color: 'var(--slate-50)',
};
export const docPageSubtitle: CSSProperties = {
    fontSize: '1.1rem',
    color: 'var(--slate-400)',
    lineHeight: 1.6,
};
export const docCardTitle: CSSProperties = {
    margin: 0,
    fontSize: '1.05rem',
    fontWeight: 800,
    color: 'var(--slate-50)',
};
export const docIconContainer: CSSProperties = {
    padding: '0.5rem',
    background: 'rgba(59,130,246,0.1)',
    borderRadius: 10,
};
export const docCardDesc: CSSProperties = {
    margin: 0,
    fontSize: '0.9rem',
    color: 'var(--slate-400)',
    lineHeight: 1.6,
};
export const glassPanelPad15r: CSSProperties = {
    padding: '1.5rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const docSectionSubtitle: CSSProperties = {
    margin: '0 0 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontSize: '1.1rem',
    fontWeight: 800,
};

/* From TracesPanel.tsx + sub-components extraction */
export const emptyStateFlex: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    color: 'var(--slate-500)',
    gap: '1.5rem',
};
export const iconBtnGhostMd: CSSProperties = {
    padding: '0.6rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    cursor: 'pointer',
};
export const flexCenterGap2rem: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '2rem',
};
export const metricBlurCard: CSSProperties = {
    padding: '1rem',
    borderRadius: 16,
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(10px)',
};
export const h3SectionLgFlex: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    marginBottom: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--slate-50)',
};
export const textXsMutedLh: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-400)',
    marginBottom: '0.25rem',
};
export const infoCardMini: CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    padding: '0.75rem',
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const flexBetweenMb05: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
};
export const flexAlignCenterGap2: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
};
export const flexAlignCenterGap5: CSSProperties = { display: 'flex', alignItems: 'center', gap: 5 };
export const flexAlignCenterGap2Mb03: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.3rem',
};

/* Cross-file patterns (this batch) */
export const flexCenterGap8: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 };
export const flexCenterGap12: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
export const flexWrapGap4: CSSProperties = { display: 'flex', gap: '1rem', flexWrap: 'wrap' };

/* From HivePanel.tsx extraction */
export const flexCenterGap2Mb02: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.2rem',
};
export const h3WhiteSm: CSSProperties = {
    margin: 0,
    fontSize: '1rem',
    fontWeight: 800,
    color: 'white',
};
export const btnGhostRounded8: CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'var(--slate-400)',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: 8,
};

/* From ChatAdminPanel.tsx extraction */
export const tableHeaderCell: CSSProperties = {
    padding: '0 1.25rem 0.75rem',
    color: 'var(--slate-500)',
    fontSize: '0.85rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
};
export const tdPadding: CSSProperties = { padding: '1.25rem' };
export const statBadgePill: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.95rem',
    color: 'var(--slate-400)',
    background: 'rgba(0,0,0,0.25)',
    padding: '0.5rem 1rem',
    borderRadius: 10,
};
export const btnImportExport: CSSProperties = {
    padding: '1rem 1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    fontSize: '1rem',
};
export const btnActionCompact: CSSProperties = {
    padding: '0.75rem',
    borderRadius: 12,
    fontSize: '0.95rem',
};
export const inputLargeSelect: CSSProperties = {
    padding: '1rem 1.25rem',
    background: 'rgba(0,0,0,0.3)',
    border: '2px solid rgba(255,255,255,0.1)',
    borderRadius: 14,
    color: 'var(--slate-200)',
    fontSize: '1rem',
    outline: 'none',
    cursor: 'pointer',
    minWidth: 160,
};

/* From TasksPanel.tsx extraction */
export const taskMetaItem: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-400)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};
export const textWhiteWeight800Sm: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 800,
    margin: 0,
    color: 'var(--slate-50)',
};

/* From ArgumentGraphPanel.tsx extraction */
export const flex1RelativeMargin075: CSSProperties = {
    flex: 1,
    position: 'relative',
    margin: '0.75rem',
};

/* From CausalDebugger.tsx extraction */
export const detailGrid2: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
};
export const preBlockMono: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-300)',
    whiteSpace: 'pre-wrap',
    margin: 0,
    maxHeight: 200,
    overflow: 'auto',
    fontFamily: 'monospace',
};
export const sectionHeaderDebug: CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--slate-400)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
};

/* From EventsPanel.tsx extraction */
export const loadingContainer: CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--slate-700)',
    flexDirection: 'column',
    gap: '1rem',
    fontFamily: 'sans-serif',
};

/* From EventsTimeline.tsx extraction */
export const buttonGroupPill: CSSProperties = {
    display: 'flex',
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    padding: '0.2rem',
};
export const btnEventControl: CSSProperties = {
    padding: '0.4rem 0.8rem',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: '0.75rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
};

/* From AgentsPanelView.tsx extraction */
export const statCardDark: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
    textAlign: 'center',
};
export const infoCardDark: CSSProperties = {
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255,255,255,0.05)',
};
export const statLabelDark: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: '0.2rem',
};

/* Cross-file patterns */
export const btnSecondaryLg: CSSProperties = {
    padding: '0.6rem 1.25rem',
    borderRadius: 10,
    fontSize: '0.85rem',
    fontWeight: 700,
};
export const btnDangerLg: CSSProperties = {
    padding: '0.6rem 1.25rem',
    borderRadius: 10,
    fontSize: '0.85rem',
    fontWeight: 700,
    background: 'var(--error)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
};

/* From KnowledgePanel.tsx extraction */
export const textSmBoldUppercase: CSSProperties = {
    fontSize: '0.75rem',
    color: 'var(--slate-400)',
    fontWeight: 700,
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
};
export const textXsUppercaseBold: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-500)',
    textTransform: 'uppercase',
    fontWeight: 700,
    marginBottom: '0.2rem',
};
export const textSmWeight600FlexGap6: CSSProperties = {
    fontSize: '0.85rem',
    color: 'var(--slate-200)',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
};
export const infoCardBorderVar: CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    padding: '0.75rem',
    borderRadius: 10,
    border: '1px solid var(--border)',
};
export const flexBetweenStart: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
};
export const edgeRow: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.02)',
    padding: '0.5rem 0.75rem',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.05)',
};

/* From AddKeyModal.tsx extraction */
export const textXsMutedAuto: CSSProperties = {
    fontSize: '0.65rem',
    color: 'var(--slate-500)',
    marginLeft: 'auto',
};
export const btnMdPadding: CSSProperties = { padding: '0.75rem 1.25rem' };
export const flexCenterGap8Full: CSSProperties = {
    flex: 1,
    padding: '0.75rem 1.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
};
export const flexBetweenFont08: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
};

/* From CounterfactualPanel.tsx extraction */
export const cardSubtle: CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 16,
};
export const tagPill: CSSProperties = {
    display: 'inline-block',
    padding: '0.15rem 0.4rem',
    borderRadius: 4,
    fontSize: '0.6rem',
    fontWeight: 600,
};
export const subsectionLabel: CSSProperties = {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--slate-400)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
};

/* From ShadowPanel.tsx extraction */
export const cardShadow: CSSProperties = {
    background: 'rgba(15,23,42,0.6)',
    border: '1px solid rgba(148,163,184,0.1)',
    borderRadius: 12,
    padding: '1rem',
    backdropFilter: 'blur(12px)',
};
export const flexCenterGap6Mb12: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
};
export const h2Medium: CSSProperties = { fontSize: '1rem', fontWeight: 600, margin: 0 };

/* From DebateSetupWizard.tsx extraction */
export const stepCardPanel: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    background: 'rgba(0,0,0,0.3)',
    padding: '2.5rem',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.05)',
};
export const h3StepTitle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 800,
    margin: '0 0 0.25rem',
    color: 'var(--slate-50)',
};
export const btnNavShape: CSSProperties = {
    padding: '0.6rem 1.2rem',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: '0.9rem',
};
export const iconCircleBase: CSSProperties = {
    display: 'inline-flex',
    padding: '1rem',
    borderRadius: '50%',
    marginBottom: '1rem',
    border: '1px solid rgba(168,85,247,0.2)',
    background: 'rgba(168,85,247,0.1)',
};
export const iconCircleBlue: CSSProperties = {
    display: 'inline-flex',
    padding: '1rem',
    borderRadius: '50%',
    marginBottom: '1rem',
    border: '1px solid rgba(59,130,246,0.2)',
    background: 'rgba(59,130,246,0.1)',
};
export const iconCircleGreen: CSSProperties = {
    display: 'inline-flex',
    padding: '1rem',
    borderRadius: '50%',
    marginBottom: '1rem',
    border: '1px solid rgba(16,185,129,0.2)',
    background: 'rgba(16,185,129,0.1)',
};
export const btnControlBase: CSSProperties = {
    padding: '0.6rem',
    borderRadius: 10,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
};

/* From LiveWorkspace.tsx extraction */
export const sectionFlexMb15: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
};
export const h3FlexCenterGap8: CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
};
export const glassPanelBlur: CSSProperties = {
    padding: '1.5rem',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    backdropFilter: 'blur(10px)',
};
export const btnOutlineMuted: CSSProperties = {
    padding: '0.75rem',
    fontSize: '0.8rem',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'var(--slate-200)',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.2s',
};
export const grid2Gap075: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
};

/* Provider colors (shared between AquariumPanel, HealthPanel, etc.) */
export const providerColors: Record<string, string> = {
    openrouter: '#a855f7',
    gemini: '#3b82f6',
    groq: '#10b981',
    nvidia: '#76b900',
    openai: '#10a37f',
    anthropic: '#da7756',
    default: '#94a3b8',
};
