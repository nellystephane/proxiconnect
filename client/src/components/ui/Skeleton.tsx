interface SkeletonProps {
  className?: string;
  count?: number;
}

// ─── Placeholder de chargement unique. Remplace les
// "h-16/h-24/h-64 rounded-2xl bg-slate-100 animate-pulse" dispersés partout. ───
const Skeleton = ({ className = 'h-16 rounded-2xl', count = 1 }: SkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={`bg-slate-200/60 dark:bg-white/10 animate-pulse ${className}`} />
    ))}
  </>
);

export default Skeleton;
