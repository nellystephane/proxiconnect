const Restaurant = require('../models/Restaurant');
const Plat = require('../models/Plat');

// ─── Créer son restaurant (un seul par utilisateur) ───
// POST /api/restaurants
const createRestaurant = async (req, res) => {
  try {
    const existant = await Restaurant.findOne({ proprietaire: req.user._id });
    if (existant) {
      return res.status(409).json({ message: 'Vous avez déjà un restaurant.', restaurantId: existant._id });
    }

    const { nom, description, logo, banniere, couleurPrincipale, localisation, horaires, serviceSurPlace, serviceAEmporter } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ message: 'Le nom du restaurant est obligatoire.' });
    }

    const restaurant = await Restaurant.create({
      proprietaire: req.user._id,
      nom: nom.trim(),
      description: description || '',
      logo: logo || '',
      banniere: banniere || '',
      couleurPrincipale: couleurPrincipale || '#007AFF',
      localisation: localisation || {},
      horaires: horaires || [],
      serviceSurPlace: serviceSurPlace ?? true,
      serviceAEmporter: serviceAEmporter ?? true
    });

    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Mon restaurant (avec sa carte) ───
// GET /api/restaurants/moi
const getMonRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ proprietaire: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Vous n'avez pas encore de restaurant." });
    }
    const plats = await Plat.find({ restaurant: restaurant._id }).sort({ categorie: 1, createdAt: -1 });
    res.json({ restaurant, plats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Carte publique d'un restaurant ───
// GET /api/restaurants/:id
const getRestaurantPublic = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('proprietaire', 'nom prenom photo telephone localisation');

    if (!restaurant || restaurant.statut !== 'active') {
      return res.status(404).json({ message: 'Restaurant introuvable.' });
    }

    const plats = await Plat.find({ restaurant: restaurant._id, disponible: true }).sort({ categorie: 1, estMisEnAvant: -1 });

    res.json({ restaurant, plats });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Annuaire des restaurants (public) ───
// GET /api/restaurants?ville=&recherche=&page=&limite=
const getRestaurants = async (req, res) => {
  try {
    const { ville, recherche, page = 1, limite = 20 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 20));

    const filtre = { statut: 'active' };
    if (ville) filtre['localisation.ville'] = new RegExp(ville, 'i');
    if (recherche) filtre.$text = { $search: recherche };

    const [restaurants, total] = await Promise.all([
      Restaurant.find(filtre).sort({ 'abonnementPro.actif': -1, createdAt: -1 }).skip((pageNormalisee - 1) * limiteNormalisee).limit(limiteNormalisee),
      Restaurant.countDocuments(filtre)
    ]);

    res.json({ restaurants, page: pageNormalisee, pages: Math.ceil(total / limiteNormalisee) });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Modifier son restaurant ───
// PUT /api/restaurants/moi
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ proprietaire: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ message: "Vous n'avez pas encore de restaurant." });
    }

    const champsAutorises = [
      'nom', 'description', 'logo', 'banniere', 'couleurPrincipale',
      'localisation', 'horaires', 'serviceSurPlace', 'serviceAEmporter'
    ];
    champsAutorises.forEach((champ) => {
      if (req.body[champ] !== undefined) restaurant[champ] = req.body[champ];
    });

    await restaurant.save();
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = {
  createRestaurant,
  getMonRestaurant,
  getRestaurantPublic,
  getRestaurants,
  updateRestaurant
};
