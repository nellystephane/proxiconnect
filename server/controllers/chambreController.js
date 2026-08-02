const Chambre = require('../models/Chambre');
const Hotel = require('../models/Hotel');

const exigerHotel = async (userId) => {
  const hotel = await Hotel.findOne({ proprietaire: userId });
  if (!hotel) {
    const err = new Error("Vous devez d'abord créer votre établissement.");
    err.status = 400;
    throw err;
  }
  return hotel;
};

const createChambre = async (req, res) => {
  try {
    const hotel = await exigerHotel(req.user._id);
    const { type, prixParNuit, capacite, photos, equipements } = req.body;

    if (!type || prixParNuit === undefined) {
      return res.status(400).json({ message: 'Type et prix par nuit sont obligatoires.' });
    }

    const chambre = await Chambre.create({
      hotel: hotel._id,
      createur: req.user._id,
      type, prixParNuit,
      capacite: capacite || 2,
      photos: photos || [],
      equipements: equipements || []
    });

    res.status(201).json(chambre);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || 'Erreur serveur.' });
  }
};

const updateChambre = async (req, res) => {
  try {
    const chambre = await Chambre.findById(req.params.id);
    if (!chambre) return res.status(404).json({ message: 'Chambre non trouvée.' });
    if (chambre.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez modifier que vos propres chambres.' });
    }

    const champsAutorises = ['type', 'prixParNuit', 'capacite', 'photos', 'equipements', 'disponible'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) chambre[champ] = req.body[champ];
    });

    if (req.body.estMisEnAvant !== undefined) {
      const hotel = await Hotel.findById(chambre.hotel);
      if (hotel?.abonnementPro?.actif) {
        chambre.estMisEnAvant = !!req.body.estMisEnAvant;
      } else if (req.body.estMisEnAvant) {
        return res.status(403).json({ message: "La mise en avant nécessite un abonnement Pro pour votre établissement." });
      }
    }

    await chambre.save();
    res.json(chambre);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const deleteChambre = async (req, res) => {
  try {
    const chambre = await Chambre.findById(req.params.id);
    if (!chambre) return res.status(404).json({ message: 'Chambre non trouvée.' });
    if (chambre.createur.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que vos propres chambres.' });
    }
    await chambre.deleteOne();
    res.json({ message: 'Chambre supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { createChambre, updateChambre, deleteChambre };
