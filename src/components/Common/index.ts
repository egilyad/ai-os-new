/**
 * Canonical shared UI primitives + design tokens.
 *
 * FA-09 (research audit): this barrel is the single sanctioned surface for
 * status badges, color helpers, ModalShell, ErrorBoundary, and the style token
 * module. New panels MUST import these from here instead of deep paths
 * (`../../components/Common/status-vocabulary`) or inline `style={{}}` reinvention
 * — that drift is the root cause behind FA-02/FA-03/FA-10.
 */
export { default as ErrorBoundary } from './ErrorBoundary';
export * from './status-vocabulary';
export { default as EmptyState } from './EmptyState';
export * from './EmptyState';
export { ModalShell } from '../ModalShell';
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';
export { AgentDisplay } from './AgentDisplay';
export * from '../../styles/common';
