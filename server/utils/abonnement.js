const Paiement = require('../models/Paiement');

// Avantages par défaut pour un membre sans abonnement actif (offre Gratuit)
const AVANTAGES_GRATUIT = {
  nombreAnnonces: 1,
  videoAutorisee: false,
  miseEnAvant: false,
  dureeAnnonce: 15
};

// ─── Retourne les avantages actuellement actifs d'un utilisateur ───
const getAvantagesActifs = async (userId) => {
  const paiementActif = await Paiement.findOne({
    utilisateur: userId,
    statut: 'confirmé',
    dateFin: { $gt: new Date() }
  }).sort({ dateFin: -1 });

  if (!paiementActif) {
    return { estAbonne: false, type: null, avantages: AVANTAGES_GRATUIT, dateFin: null };
  }

  return {
    estAbonne: true,
    type: paiementActif.type,
    avantages: paiementActif.avantages,
    dateFin: paiementActif.dateFin
  };
};

module.exports = { getAvantagesActifs, AVANTAGES_GRATUIT };
