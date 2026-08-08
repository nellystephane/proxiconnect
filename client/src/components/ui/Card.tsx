import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'glass-light' | 'glass-solid';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const VARIANT_CLASSES = { glass: 'glass', 'glass-light': 'glass-light', 'glass-solid': 'glass-solid' };
const PADDING_CLASSES = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' };

// ─── Carte de base : remplace "glass rounded-2xl p-4" (ou p-5, ou rounded-3xl...)
// recopié à la main sur chaque écran, avec une seule échelle de radius/padding. ───
const Card = ({ variant = 'glass', padding = 'md', interactive, className = '', children, ...props }: CardProps) => (
  <div
    className={`rounded-2xl ${VARIANT_CLASSES[variant]} ${PADDING_CLASSES[padding]} ${
      interactive ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export default Card;
