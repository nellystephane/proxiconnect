import { forwardRef, useId } from 'react';
import type { TextareaHTMLAttributes, ReactNode } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className = '', rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          className={`w-full px-4 py-3 bg-slate-100/70 dark:bg-white/[0.06] border rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none resize-none transition-all duration-200 focus:bg-white dark:focus:bg-white/[0.1] focus:ring-2 ${
            error
              ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
              : 'border-transparent focus:ring-blue-100 focus:border-[#007AFF]'
          } ${className}`}
          {...props}
        />
        {error && <p id={`${inputId}-error`} className="text-xs text-red-500 mt-1.5">{error}</p>}
        {!error && hint && <p id={`${inputId}-hint`} className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{hint}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export default Textarea;
