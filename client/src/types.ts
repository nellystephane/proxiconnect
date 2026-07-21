export interface Localisation {
  pays?: string;
  ville: string;
  quartier?: string;
  details?: string;
}

export interface CreateurResume {
  _id: string;
  nom: string;
  prenom: string;
  photo?: string;
  telephone?: string;
  localisation?: Localisation;
  createdAt?: string;
}

export interface Annonce {
  _id: string;
  titre: string;
  description: string;
  categorie: string;
  sousCategorie?: string;
  type: 'service' | 'vente' | 'autre';
  prix: { montant: number; estNegociable: boolean; estGratuit: boolean };
  photos: string[];
  video_annonce?: string | null;
  detailsSupplementaires?: Record<string, unknown>;
  localisation: Localisation;
  statut: 'actif' | 'expiré' | 'désactivé';
  estMiseEnAvant: boolean;
  estPremium: boolean;
  dateExpiration: string;
  createur: CreateurResume;
  nombreVues: number;
  createdAt: string;
}

export interface Avis {
  _id: string;
  auteur: { _id: string; nom: string; prenom: string; photo?: string };
  concerne: string;
  annonce: { _id: string; titre: string } | string;
  note: number;
  commentaire?: string;
  createdAt: string;
}

export interface AbonnementStatut {
  estAbonne: boolean;
  type?: string | null;
  avantages: {
    nombreAnnonces: number;
    videoAutorisee: boolean;
    miseEnAvant: boolean;
    dureeAnnonce: number;
  };
  dateDebut?: string;
  dateFin?: string;
  joursRestants?: number;
}

export interface Offre {
  type: string;
  label: string;
  prix: number;
  duree: string;
  avantages: AbonnementStatut['avantages'];
  avatar?: string; 
}
