import { useEffect, useState } from 'react';
import { Download, RefreshCw, X as XIcon, WifiOff } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button, IconButton } from '../ui';

// L'événement beforeinstallprompt n'est pas encore dans le lib.dom.d.ts standard de TS
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const CLE_INSTALL_MASQUEE = 'proxiconnect_install_masque';

// ─── Bandeau d'installation (Android / desktop Chrome, Edge...) ───
// iOS Safari ne déclenche jamais beforeinstallprompt : l'installation s'y
// fait via "Partager → Sur l'écran d'accueil", donc ce bandeau n'apparaît
// simplement pas sur iOS, ce qui est le comportement attendu.
const InstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CLE_INSTALL_MASQUEE)) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const installer = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setVisible(false);
    setPromptEvent(null);
  };

  const fermer = () => {
    setVisible(false);
    localStorage.setItem(CLE_INSTALL_MASQUEE, '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] max-w-sm mx-auto animate-slide-up">
      <div className="glass-modal rounded-2xl p-4 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-[#007AFF]" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Installer ProxiConnect</p>
          <p className="text-xs text-slate-500">Accès rapide depuis votre écran d'accueil, même hors connexion.</p>
        </div>
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <Button size="sm" onClick={installer}>Installer</Button>
          <button onClick={fermer} className="text-[11px] text-slate-400 hover:text-slate-600 transition">Plus tard</button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast de mise à jour disponible / prêt pour le hors-ligne ───
const UpdateToast = () => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Vérifie régulièrement s'il existe une nouvelle version du service worker
      if (registration) {
        setInterval(() => { registration.update(); }, 60 * 60 * 1000); // toutes les heures
      }
    },
  });

  const fermer = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[60] max-w-sm mx-auto animate-slide-up">
      <div className="glass-modal rounded-2xl p-4 flex items-center gap-3 shadow-lg">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          {needRefresh ? <RefreshCw className="w-5 h-5 text-[#007AFF]" aria-hidden="true" /> : <WifiOff className="w-5 h-5 text-emerald-500" aria-hidden="true" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {needRefresh ? 'Nouvelle version disponible' : 'Prêt pour le hors-ligne'}
          </p>
          <p className="text-xs text-slate-500">
            {needRefresh ? 'Rechargez pour profiter des dernières améliorations.' : "L'application fonctionne maintenant même sans connexion."}
          </p>
        </div>
        {needRefresh ? (
          <Button size="sm" onClick={() => updateServiceWorker(true)}>Recharger</Button>
        ) : (
          <IconButton size="sm" onClick={fermer} aria-label="Fermer"><XIcon className="w-4 h-4" /></IconButton>
        )}
      </div>
    </div>
  );
};

const PwaManager = () => (
  <>
    <InstallPrompt />
    <UpdateToast />
  </>
);

export default PwaManager;
