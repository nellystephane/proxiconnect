export interface Localisation {
  pays?: string;
  ville: string;
  quartier?: string;
  details?: string;
}

// ─── Destination d'une livraison : la description ("details" hérité de
// Localisation) reste le repère principal — les coordonnées GPS ne sont
// qu'un complément optionnel, jamais une contrainte. ───
export interface DestinationLivraison extends Localisation {
  latitude?: number | null;
  longitude?: number | null;
  mapUrl?: string;
  formattedAddress?: string;
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

export interface Paiement {
  _id: string;
  type: string;
  montant: number;
  devise: string;
  methode: string;
  operateur?: string | null;
  numeroTransaction?: string | null;
  statut: 'en_attente' | 'confirmé' | 'échoué' | 'remboursé' | 'expiré';
  reference: string;
  createdAt: string;
}

export interface AbonnementPro {
  actif: boolean;
  plan: 'pro_mensuel' | 'pro_annuel' | null;
  dateFin: string | null;
}

export interface OffrePro {
  type: 'pro_mensuel' | 'pro_annuel';
  label: string;
  prix: number;
  duree: string;
}

export interface Restaurant {
  _id: string;
  proprietaire: CreateurResume | string;
  nom: string;
  description: string;
  logo: string;
  banniere: string;
  couleurPrincipale: string;
  localisation: Localisation;
  horaires: { jour: string; ouverture: string; fermeture: string; ferme: boolean }[];
  serviceSurPlace: boolean;
  serviceAEmporter: boolean;
  statut: 'active' | 'suspendue';
  abonnementPro: AbonnementPro;
  createdAt: string;
}

export interface Plat {
  _id: string;
  restaurant: string | Restaurant;
  createur: string;
  nom: string;
  description: string;
  categorie: string;
  prix: number;
  photos: string[];
  epice: boolean;
  disponible: boolean;
  estMisEnAvant: boolean;
  createdAt: string;
}

export interface CommandeRestaurant {
  _id: string;
  client: string | CreateurResume;
  vendeur: string | CreateurResume;
  restaurant: string | { _id: string; nom: string; logo?: string };
  articles: { plat: string; nom: string; prixUnitaire: number; quantite: number }[];
  montantTotal: number;
  modeService: 'sur_place' | 'a_emporter' | 'livraison';
  statut: 'en_attente' | 'en_préparation' | 'prête' | 'livrée' | 'annulée';
  adresseLivraison?: DestinationLivraison;
  note?: string;
  createdAt: string;
}

export interface Hotel {
  _id: string;
  proprietaire: CreateurResume | string;
  nom: string;
  description: string;
  photos: string[];
  equipements: string[];
  logo: string;
  couleurPrincipale: string;
  localisation: Localisation;
  statut: 'active' | 'suspendue';
  abonnementPro: AbonnementPro;
  createdAt: string;
}

export interface Chambre {
  _id: string;
  hotel: string | Hotel;
  createur: string;
  type: string;
  prixParNuit: number;
  capacite: number;
  photos: string[];
  equipements: string[];
  disponible: boolean;
  estMisEnAvant: boolean;
  createdAt: string;
}

export interface Reservation {
  _id: string;
  client: string | CreateurResume;
  hotelier: string | CreateurResume;
  hotel: string | { _id: string; nom: string; logo?: string };
  chambre: string | { _id: string; type: string };
  dateArrivee: string;
  dateDepart: string;
  nombreNuits: number;
  montantTotal: number;
  statut: 'en_attente' | 'confirmée' | 'annulée' | 'terminée';
  note?: string;
  createdAt: string;
}

export interface Livreur {
  _id: string;
  utilisateur: CreateurResume | string;
  zoneCouverture: string[];
  moyenTransport: 'moto' | 'vélo' | 'voiture' | 'à pied';
  tarifBase: number;
  disponibilite: 'en_ligne' | 'hors_ligne';
  statut: 'active' | 'suspendu';
  abonnementPro: AbonnementPro;
  createdAt: string;
}

export interface DemandeLivraison {
  _id: string;
  sourceType: 'vente' | 'restauration';
  sourceId: string;
  vendeur: string | CreateurResume;
  client: string | CreateurResume;
  livreur?: string | CreateurResume | null;
  adresseRecuperation?: Localisation;
  adresseLivraison?: DestinationLivraison;
  tarif: number;
statut: 'en_attente' | 'assignée' | 'en_cours' | 'en_route' | 'arrivée' | 'livrée' | 'annulée';
  createdAt: string;
}
export interface Boutique {
  _id: string;
  proprietaire: CreateurResume | string;
  nom: string;
  description: string;
  logo: string;
  banniere: string;
  couleurPrincipale: string;
  localisation: Localisation;
  statut: 'active' | 'suspendue';
  abonnementPro: AbonnementPro;
  createdAt: string;
}

export interface Produit {
  _id: string;
  boutique: string | Boutique;
  createur: string;
  nom: string;
  description: string;
  categorie: string;
  prix: number;
  quantiteDisponible: number;
  photos: string[];
  variantes: { nom: string; valeurs: string[] }[];
  etat: 'neuf' | 'occasion';
  marque: string;
  modele: string;
  livraisonPossible: boolean;
  estMisEnAvant: boolean;
  statut: 'disponible' | 'rupture' | 'archive';
  nombreVues: number;
  createdAt: string;
}

export interface CommandeArticle {
  produit: string;
  nom: string;
  prixUnitaire: number;
  quantite: number;
  varianteChoisie?: string;
}

export interface Commande {
  _id: string;
  client: string | CreateurResume;
  vendeur: string | CreateurResume;
  boutique: string | { _id: string; nom: string; logo?: string };
  articles: CommandeArticle[];
  montantTotal: number;
  livraisonDemandee: boolean;
  statut: 'en_attente' | 'confirmée' | 'expédiée' | 'livrée' | 'annulée';
  adresseLivraison?: DestinationLivraison;
  note?: string;
  createdAt: string;
}
