const Hotel = require('../models/Hotel');
const Chambre = require('../models/Chambre');

const createHotel = async (req, res) => {
  try {
    const existant = await Hotel.findOne({ proprietaire: req.user._id });
    if (existant) {
      return res.status(409).json({ message: 'Vous avez déjà un hôtel.', hotelId: existant._id });
    }

    const { nom, description, photos, equipements, logo, couleurPrincipale, localisation } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: "Le nom de l'établissement est obligatoire." });
    }

    const hotel = await Hotel.create({
      proprietaire: req.user._id,
      nom: nom.trim(),
      description: description || '',
      photos: photos || [],
      equipements: equipements || [],
      logo: logo || '',
      couleurPrincipale: couleurPrincipale || '#007AFF',
      localisation: localisation || {}
    });

    res.status(201).json(hotel);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const getMonHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ proprietaire: req.user._id });
    if (!hotel) return res.status(404).json({ message: "Vous n'avez pas encore d'établissement." });
    const chambres = await Chambre.find({ hotel: hotel._id }).sort({ createdAt: -1 });
    res.json({ hotel, chambres });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const getHotelPublic = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate('proprietaire', 'nom prenom photo telephone localisation');
    if (!hotel || hotel.statut !== 'active') {
      return res.status(404).json({ message: 'Établissement introuvable.' });
    }
    const chambres = await Chambre.find({ hotel: hotel._id, disponible: true }).sort({ estMisEnAvant: -1, prixParNuit: 1 });
    res.json({ hotel, chambres });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const getHotels = async (req, res) => {
  try {
    const { ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));

    const filtre = { statut: 'active' };
    if (ville) filtre['localisation.ville'] = new RegExp(ville, 'i');
    if (recherche) filtre.$text = { $search: recherche };

    const [hotels, total] = await Promise.all([
      Hotel.find(filtre).sort({ 'abonnementPro.actif': -1, createdAt: -1 }).skip((pageNormalisee - 1) * limiteNormalisee).limit(limiteNormalisee),
      Hotel.countDocuments(filtre)
    ]);

    res.json({ hotels, page: pageNormalisee, pages: Math.ceil(total / limiteNormalisee) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ proprietaire: req.user._id });
    if (!hotel) return res.status(404).json({ message: "Vous n'avez pas encore d'établissement." });

    const champsAutorises = ['nom', 'description', 'photos', 'equipements', 'logo', 'couleurPrincipale', 'localisation'];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) hotel[champ] = req.body[champ];
    });

    await hotel.save();
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { createHotel, getMonHotel, getHotelPublic, getHotels, updateHotel };
