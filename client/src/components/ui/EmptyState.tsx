import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

// ─── État vide unique : remplace le motif "icône dans un rond + texte gris"
// réécrit à la main sur Favoris, Conversations, Boutiques, Notifications... ───
const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center gap-3 px-4">
    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center">
      <Icon className="w-6 h-6 text-[#007AFF]" />
    </div>
    <p className="text-slate-600 dark:text-slate-300 font-semibold text-sm">{title}</p>
    {description && <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[240px]">{description}</p>}
    {action && <div className="mt-1">{action}</div>}
  </div>
);

export default EmptyState;
