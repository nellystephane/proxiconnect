import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';
type ThemeResolu = 'light' | 'dark';

const CLE_STOCKAGE = 'proxiconnect_theme';

interface ThemeContextType {
  theme: ThemeChoice;
  themeResolu: ThemeResolu;
  setTheme: (t: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const lireSysteme = (): ThemeResolu =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const lireChoixStocke = (): ThemeChoice => {
  const stocke = localStorage.getItem(CLE_STOCKAGE);
  return stocke === 'light' || stocke === 'dark' || stocke === 'system' ? stocke : 'system';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeChoice>(lireChoixStocke);
  const [themeResolu, setThemeResolu] = useState<ThemeResolu>(() =>
    theme === 'system' ? lireSysteme() : theme
  );

  const appliquer = useCallback((resolu: ThemeResolu) => {
    document.documentElement.setAttribute('data-theme', resolu);
    setThemeResolu(resolu);
  }, []);

  const setTheme = useCallback((choix: ThemeChoice) => {
    setThemeState(choix);
    localStorage.setItem(CLE_STOCKAGE, choix);
    appliquer(choix === 'system' ? lireSysteme() : choix);
  }, [appliquer]);

  // Si le choix est "system", suit les changements de thème du système en direct
  // (ex: bascule automatique jour/nuit du téléphone pendant que l'app est ouverte).
  useEffect(() => {
    if (theme !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => appliquer(lireSysteme());
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [theme, appliquer]);

  // Au montage, resynchronise avec ce que le script anti-flash a déjà posé
  // (évite un aller-retour visuel si jamais les deux divergeaient).
  useEffect(() => {
    const actuel = document.documentElement.getAttribute('data-theme');
    if (actuel === 'light' || actuel === 'dark') setThemeResolu(actuel);
  }, []);

  const value = useMemo(() => ({ theme, themeResolu, setTheme }), [theme, themeResolu, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
