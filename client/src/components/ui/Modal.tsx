import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X as XIcon } from 'lucide-react';
import IconButton from './IconButton';

interface ModalProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  closeOnBackdrop?: boolean;
  showCloseButton?: boolean;
}

const SIZE_CLASSES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

// ─── Modale centrée unique pour toute l'app (LocalisationPopup, Deposer,
// Abonnements, MaBoutique, MonRestaurant, MonHotel utilisaient chacune leur
// propre copie du même triptyque overlay + panneau + bouton close). ───
const Modal = ({ open, onClose, title, children, size = 'md', closeOnBackdrop = true, showCloseButton = true }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 glass-overlay animate-fade-in"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${SIZE_CLASSES[size]} max-h-[85vh] overflow-y-auto glass-modal rounded-3xl p-6 animate-scale-in`}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between mb-4">
            {title && <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>}
            {showCloseButton && onClose && (
              <IconButton size="sm" onClick={onClose} aria-label="Fermer" className="ml-auto">
                <XIcon className="w-4 h-4" />
              </IconButton>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
