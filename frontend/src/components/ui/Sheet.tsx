import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/**
 * Єдина нижня шторка застосунку (RouteSheet, TransportLayersPanel тощо
 * раніше кожен малював власну "картку знизу" — тепер один компонент з
 * однаковою анімацією sheet-up, ручкою для свайпу та фоном-затемненням).
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 animate-fade-in bg-black/40" onClick={onClose} />
      <div
        className={clsx(
          'glass-surface relative w-full max-w-lg animate-sheet-up rounded-t-xl3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-glass-lg'
        )}
      >
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-ink-text/20" />
        {title && <h2 className="px-5 pt-3 text-title text-ink-text">{title}</h2>}
        <div className="px-5 pb-4 pt-2">{children}</div>
      </div>
    </div>,
    document.body
  );
}
