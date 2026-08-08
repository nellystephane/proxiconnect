import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid' | 'ghost';
  'aria-label': string; // toujours obligatoire : ce sont des boutons icône-seule
}

const SIZE_CLASSES = { sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-11 h-11' };
const VARIANT_CLASSES = {
  glass: 'glass-control text-slate-600 hover:text-slate-900',
  solid: 'bg-[#007AFF] text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25',
  ghost: 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
};

// ─── Bouton icône circulaire unique : close de modale, retour, favori,
// suppression... Remplace les boutons ronds ad-hoc dupliqués partout. ───
const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', variant = 'glass', className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      className={`flex items-center justify-center rounded-full flex-shrink-0 transition-all duration-200 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed ${SIZE_CLASSES[size]} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';

export default IconButton;
