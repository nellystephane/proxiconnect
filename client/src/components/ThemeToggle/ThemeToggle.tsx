import { Sun, Moon, Monitor, type LucideIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeChoice } from '../../context/ThemeContext';

const OPTIONS: { id: ThemeChoice; icon: LucideIcon; label: string }[] = [
  { id: 'light', icon: Sun, label: 'Clair' },
  { id: 'dark', icon: Moon, label: 'Sombre' },
  { id: 'system', icon: Monitor, label: 'Système' },
];

// ─── Sélecteur de thème à 3 états, en pilule — cohérent avec le langage
// "liquid glass" du reste de l'app shell (Sidebar/DashboardLayout). ───
const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Choix du thème"
      className="glass-light inline-flex items-center gap-0.5 rounded-full p-1"
    >
      {OPTIONS.map((o) => {
        const actif = theme === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={actif}
            aria-label={o.label}
            title={o.label}
            onClick={() => setTheme(o.id)}
            className={`flex items-center justify-center rounded-full transition-all duration-200 ${compact ? 'w-7 h-7' : 'w-8 h-8'} ${
              actif ? 'bg-[#007AFF] text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <o.icon className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        );
      })}
    </div>
  );
};

export default ThemeToggle;
