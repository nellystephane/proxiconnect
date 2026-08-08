import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  error?: string;
  icon?: ReactNode;
  hint?: string;
}

// ─── Champ texte unique pour toute l'app. Remplace le motif
// "bg-gray-100/80 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
// recopié dans chaque formulaire, avec en plus label/erreur/icône gérés
// de façon cohérente (et accessible : label lié via htmlFor/id). ───
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`w-full py-3 bg-slate-100/70 border rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-2 ${
              error
                ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
                : 'border-transparent focus:ring-blue-100 focus:border-[#007AFF]'
            } ${icon ? 'pl-10 pr-4' : 'px-4'} ${className}`}
            {...props}
          />
        </div>
        {error && <p id={`${inputId}-error`} className="text-xs text-red-500 mt-1.5">{error}</p>}
        {!error && hint && <p id={`${inputId}-hint`} className="text-xs text-slate-400 mt-1.5">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export default Input;
