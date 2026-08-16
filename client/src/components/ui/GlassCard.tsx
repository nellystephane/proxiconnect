import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'light' | 'strong' | 'solid' | 'elevated';
  hoverEffect?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  variant = 'default',
  hoverEffect = false,
  padding = 'md',
  children,
  className = '',
  ...props
}) => {
  const variantClasses = {
    default: 'glass-card',
    light: 'glass-light',
    strong: 'glass-nav',
    solid: 'glass-solid',
    elevated: 'glass-modal shadow-xl'
  };

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  const hoverClass = hoverEffect
    ? 'transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:shadow-lg hover:border-white/60 dark:hover:border-white/20'
    : '';

  return (
    <div
      className={`rounded-2xl border transition-all ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
