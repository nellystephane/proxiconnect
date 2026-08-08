import type { HTMLAttributes } from 'react';

export type BadgeTone = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  primary: 'bg-blue-50 text-[#007AFF]',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-500',
  neutral: 'bg-slate-100 text-slate-500',
};

const SIZE_CLASSES = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' };

// ─── Pastille de statut/catégorie unique : remplace les combinaisons
// bg-*-50/text-*-500/600 réinventées à chaque écran. ───
const Badge = ({ tone = 'neutral', size = 'md', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 font-semibold rounded-full whitespace-nowrap ${TONE_CLASSES[tone]} ${SIZE_CLASSES[size]} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
