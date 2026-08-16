import React from 'react';

interface GlassBadgeProps {
  variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  icon?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  variant = 'blue',
  icon,
  children,
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20'
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs font-medium rounded-lg gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold rounded-xl gap-1.5'
  };

  return (
    <span
      className={`inline-flex items-center border backdrop-blur-md transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
