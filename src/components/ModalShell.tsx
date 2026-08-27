import { type ReactNode, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FocusScope } from '@react-aria/focus';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string | number;
  zIndex?: number;
}

export const ModalShell = ({ open, onClose, children, width = 500, zIndex = 9999 }: ModalShellProps) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handleKeyDown); };
  }, [open, handleKeyDown]);

  if (!open) return null;
  if (typeof document === 'undefined') return null;

  const overlay = (
    <FocusScope contain restoreFocus autoFocus>
      <div style={{
        position: 'fixed', inset: 0, zIndex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        overflowY: 'auto'
      }} onClick={onClose} role="dialog" aria-modal="true">
        <div style={{
          background: 'var(--slate-800)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '1.5rem', width: '100%',
          maxWidth: typeof width === 'number' ? width : `${width}`,
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    </FocusScope>
  );

  return createPortal(overlay, document.body);
};
