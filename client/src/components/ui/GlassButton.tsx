import React from 'react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'secondary' | 'danger' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-xl',
    md: 'px-4 py-2.5 text-sm font-semibold rounded-2xl',
    lg: 'px-6 py-3.5 text-base font-semibold rounded-2xl'
  };

  const variantClasses = {
    primary: 'btn-liquid-primary',
    ghost: 'btn-liquid-ghost',
    secondary: 'bg-white/80 dark:bg-white/10 hover:bg-white text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-white/10 shadow-sm hover:shadow-md',
    danger: 'bg-rose-500/90 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25',
    accent: 'bg-teal-500 hover:bg-teal-600 text-white shadow-lg shadow-teal-500/25'
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${
        fullWidth ? 'w-full' : ''
      } ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
