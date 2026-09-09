import { useState, useCallback, useRef, useEffect } from 'react';
import { FocusScope } from '@react-aria/focus';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
}

/**
 * Reusable confirmation state hook — returns { confirm, ConfirmDialog }.
 * confirm() shows the dialog and returns a Promise<boolean>.
 * ConfirmDialog is a renderless wrapper — render it in your JSX tree.
 */
export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    variant: 'default',
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  useEffect(() => {
    if (state.open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [state.open]);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({
        ...options,
        open: true,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(true);
    resolveRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    setState(s => ({ ...s, open: false }));
    resolveRef.current?.(false);
    resolveRef.current = null;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      handleCancel();
    }
  }, [handleCancel]);

  const ConfirmDialog = useCallback(() => {
    if (!state.open) return null;
    const dialogId = 'confirm-dialog-title';
    return (
      <div className="modal-overlay" onClick={handleCancel} onKeyDown={handleKeyDown} role="presentation">
        <FocusScope contain restoreFocus autoFocus>
          <div
            className={`modal-content ${state.variant === 'danger' ? 'confirm-danger' : ''}`}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogId}
          >
            <h3 id={dialogId}>{state.title}</h3>
            <p>{state.message}</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={handleCancel}>
                {state.cancelLabel || 'Cancel'}
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </FocusScope>
      </div>
    );
  }, [state, handleConfirm, handleCancel, handleKeyDown]);

  return { confirm, ConfirmDialog };
}
