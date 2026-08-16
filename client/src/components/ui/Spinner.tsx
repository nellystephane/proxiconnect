interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = { sm: 'w-4 h-4 border-2', md: 'w-8 h-8 border-2', lg: 'w-10 h-10 border-[3px]' };

// ─── Spinner unique. Remplace "h-8 w-8 border-2 border-blue-200 border-t-[#007AFF]
// rounded-full animate-spin" recopié dans quasiment toutes les pages. ───
const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => (
  <div
    role="status"
    aria-label="Chargement"
    className={`${SIZE_CLASSES[size]} border-blue-200 border-t-[#007AFF] rounded-full animate-spin ${className}`}
  />
);

export default Spinner;
