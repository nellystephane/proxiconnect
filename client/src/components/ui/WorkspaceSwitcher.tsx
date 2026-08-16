import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User, Store, UtensilsCrossed, Hotel, Truck, ChevronDown, Check, Plus,
} from 'lucide-react';
import { usePlatform } from '../../context/PlatformContext';
import type { EspaceId } from '../../context/PlatformContext';

interface WorkspaceOption {
  id: EspaceId | 'personnel';
  label: string;
  subtitle: string;
  path: string;
  icon: React.ElementType;
  activeColor: string;
  isActivated: boolean;
}

// Sélecteur d'espace de travail : permet de basculer en un geste entre
// l'espace personnel et chacun des espaces pro activés (ou d'activer ceux
// qui ne le sont pas encore). Source de vérité : PlatformContext.
export const WorkspaceSwitcher: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { espacesActifs, nomsEspaces } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);

  const workspaces: WorkspaceOption[] = [
    {
      id: 'personnel',
      label: 'Espace personnel',
      subtitle: 'Annonces & favoris',
      path: '/',
      icon: User,
      activeColor: 'text-[#007AFF] bg-[#007AFF]/10',
      isActivated: true,
    },
    {
      id: 'vente',
      label: nomsEspaces.vente || 'Ma boutique',
      subtitle: espacesActifs.vente ? 'Produits & commandes' : 'Activer la vente',
      path: '/vente',
      icon: Store,
      activeColor: 'text-purple-500 bg-purple-500/10',
      isActivated: espacesActifs.vente,
    },
    {
      id: 'restauration',
      label: nomsEspaces.restauration || 'Mon restaurant',
      subtitle: espacesActifs.restauration ? 'Plats & commandes' : 'Activer la restauration',
      path: '/restauration',
      icon: UtensilsCrossed,
      activeColor: 'text-orange-500 bg-orange-500/10',
      isActivated: espacesActifs.restauration,
    },
    {
      id: 'hotel',
      label: nomsEspaces.hotel || 'Mon hôtel',
      subtitle: espacesActifs.hotel ? 'Chambres & réservations' : "Activer l'hébergement",
      path: '/hotel',
      icon: Hotel,
      activeColor: 'text-teal-500 bg-teal-500/10',
      isActivated: espacesActifs.hotel,
    },
    {
      id: 'livraison',
      label: 'Livraison',
      subtitle: espacesActifs.livraison ? 'Courses & revenus' : 'Devenir livreur',
      path: '/livraison',
      icon: Truck,
      activeColor: 'text-emerald-500 bg-emerald-500/10',
      isActivated: espacesActifs.livraison,
    },
  ];

  const currentWorkspace =
    workspaces.find((w) => w.id !== 'personnel' && location.pathname.startsWith(w.path)) ||
    workspaces.find((w) => w.path === location.pathname) ||
    workspaces[0];

  const handleSelect = (ws: WorkspaceOption) => {
    setIsOpen(false);
    navigate(ws.path);
  };

  const IconComponent = currentWorkspace.icon;

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-center p-2.5 rounded-2xl glass hover:shadow-md transition-all group"
          aria-label={`Espace actif : ${currentWorkspace.label}`}
          title={`Espace actif : ${currentWorkspace.label}`}
        >
          <div className={`p-1.5 rounded-xl transition-transform group-hover:scale-105 ${currentWorkspace.activeColor}`}>
            <IconComponent className="w-[18px] h-[18px]" />
          </div>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute left-full top-0 ml-2 z-50 glass-solid rounded-2xl p-2 w-56 animate-scale-in origin-top-left space-y-1">
              {workspaces.map((ws) => (
                <WorkspaceRow key={ws.id} ws={ws} isSelected={ws.id === currentWorkspace.id} onSelect={handleSelect} />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl glass hover:shadow-md transition-all text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${currentWorkspace.activeColor}`}>
            <IconComponent className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">Espace actif</p>
            <p className="text-sm font-bold text-ink truncate">{currentWorkspace.label}</p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-ink-3 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-2 z-50 glass-solid rounded-2xl p-2 shadow-2xl space-y-1 animate-scale-in origin-top">
            <p className="px-3 py-1.5 text-[10px] font-bold text-ink-3 uppercase tracking-wider">
              Changer d'espace
            </p>
            {workspaces.map((ws) => (
              <WorkspaceRow key={ws.id} ws={ws} isSelected={ws.id === currentWorkspace.id} onSelect={handleSelect} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const WorkspaceRow = ({
  ws, isSelected, onSelect,
}: { ws: WorkspaceOption; isSelected: boolean; onSelect: (ws: WorkspaceOption) => void }) => {
  const WSIcon = ws.icon;
  return (
    <button
      onClick={() => onSelect(ws)}
      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all text-left ${
        isSelected
          ? 'bg-[#007AFF]/10 text-[#007AFF] font-semibold'
          : 'hover:bg-black/[0.04] text-ink-2'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`p-1.5 rounded-lg shrink-0 ${ws.activeColor}`}>
          <WSIcon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-ink truncate">{ws.label}</p>
          <p className="text-[11px] text-ink-3 truncate">{ws.subtitle}</p>
        </div>
      </div>
      {isSelected ? (
        <Check className="w-4 h-4 text-[#007AFF] shrink-0" />
      ) : (
        !ws.isActivated && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/[0.05] text-ink-2 font-semibold shrink-0 flex items-center gap-1">
            <Plus className="w-2.5 h-2.5" /> Activer
          </span>
        )
      )}
    </button>
  );
};

export default WorkspaceSwitcher;
