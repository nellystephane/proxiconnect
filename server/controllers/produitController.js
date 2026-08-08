const Produit = require('../models/Produit');
const Boutique = require('../models/Boutique');

// ─── Récupérer la boutique de l'utilisateur ou renvoyer une erreur ───
const exigerBoutique = async (userId) => {
  const boutique = await Boutique.findOne({ proprietaire: userId });
  if (!boutique) {
    const err = new Error("Vous devez d'abord créer votre boutique.");
    err.status = 400;
    throw err;
  }
  return boutique;
};

// ─── Ajouter un produit à sa boutique ───
// POST /api/produits
const createProduit = async (req, res) => {
  try {
    const boutique = await exigerBoutique(req.user._id);

    const {
      nom, description, categorie, prix, quantiteDisponible,
      photos, variantes, etat, marque, modele, livraisonPossible
    } = req.body;

    if (!nom || !description || !categorie || prix === undefined) {
      return res.status(400).json({ message: 'Nom, description, catégorie et prix sont obligatoires.' });
    }

    const produit = await Produit.create({
      boutique: boutique._id,
      createur: req.user._id,
      nom, description, categorie,
      prix,
      quantiteDisponible: quantiteDisponible ?? 0,
      photos: photos || [],
      variantes: variantes || [],
      etat: etat || 'neuf',
      marque: marque || '',
      modele: modele || '',
      livraisonPossible: livraisonPossible ?? true
    });

    res.status(201).json(produit);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

// ─── Modifier un produit ───
// PUT /api/produits/:id
const updateProduit = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé.' });
    if (produit.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres produits.' });
    }

    const champsAutorises = [
      'nom', 'description', 'categorie', 'prix', 'quantiteDisponible',
      'photos', 'variantes', 'etat', 'marque', 'modele', 'livraisonPossible', 'statut'
    ];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) produit[champ] = req.body[champ];
    });

    // La mise en avant est réservée aux boutiques ayant un abonnement Pro actif.
    if (req.body.estMisEnAvant !== undefined) {
      const boutique = await Boutique.findById(produit.boutique);
      if (boutique?.abonnementPro?.actif) {
        produit.estMisEnAvant = !!req.body.estMisEnAvant;
      } else if (req.body.estMisEnAvant) {
        return res.status(403).json({ message: "La mise en avant nécessite un abonnement Pro pour votre boutique." });
      }
    }

    await produit.save();
    res.json(produit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Supprimer un produit ───
// DELETE /api/produits/:id
const deleteProduit = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé.' });
    if (produit.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres produits.' });
    }
    await produit.deleteOne();
    res.json({ message: 'Produit supprimé avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Détail d'un produit (public) ───
// GET /api/produits/:id
const getProduitById = async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id).populate('boutique');
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé.' });

    produit.nombreVues += 1;
    await produit.save();

    res.json(produit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Recherche de produits (catalogue public) ───
// GET /api/produits?categorie=&ville=&recherche=&page=&limite=
const getProduits = async (req, res) => {
  try {
    const { categorie, ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));

    const filtre = { statut: 'disponible' };
    if (categorie) filtre.categorie = categorie;
    if (recherche) filtre.$text = { $search: recherche };

    let requete = Produit.find(filtre).populate({
      path: 'boutique',
      match: ville ? { 'localisation.ville': new RegExp(ville, 'i') } : {}
    });

    const tousLesProduits = await requete
      .sort({ estMisEnAvant: -1, createdAt: -1 })
      .skip((pageNormalisee - 1) * limiteNormalisee)
      .limit(limiteNormalisee);

    // Le populate avec `match` renvoie boutique: null si le filtre ville ne correspond pas
    const produits = tousLesProduits.filter((p) => p.boutique);

    res.json({ produits, page: pageNormalisee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = {
  createProduit,
  updateProduit,
  deleteProduit,
  getProduitById,
  getProduits
};
