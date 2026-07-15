const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Avis = require('../models/Avis');

// ─── Générer le token JWT ───
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_provisoire', {
    expiresIn: '30d'
  });
};

// ─── Inscription ───
// POST /api/users/register
const register = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, ville } = req.body;

    // Vérifier champs obligatoires
    if (!nom || !prenom || !email || !motDePasse || !ville) {
      return res.status(400).json({
        message: 'Tous les champs obligatoires doivent être remplis : nom, prénom, email, mot de passe, ville.'
      });
    }

    // Vérifier si l'email existe déjà
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(motDePasse, salt);

    // Créer l'utilisateur
    const user = await User.create({
      nom,
      prenom,
      email,
      motDePasse: hashedPassword,
      telephone: telephone || '',
      localisation: {
        ville: ville.trim()
      }
    });

    // Réponse (sans le mot de passe)
    res.status(201).json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      localisation: user.localisation,
      token: generateToken(user._id)
    });

  } catch (error) {
    // Gestion des erreurs de validation Mongoose (ex: email unique)
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé.' });
    }
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Connexion ───
// POST /api/users/login
const login = async (req, res) => {
  try {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
      return res.status(400).json({ message: 'Email et mot de passe sont obligatoires.' });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(motDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect.' });
    }

    res.json({
      _id: user._id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      photo: user.photo,
      localisation: user.localisation,
      estVerifie: user.estVerifie,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Profil utilisateur connecté ───
// GET /api/users/profil
const getProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Modifier profil ───
// PUT /api/users/profil
const updateProfil = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    const { nom, prenom, telephone, photo, localisation } = req.body;

    if (nom) user.nom = nom;
    if (prenom) user.prenom = prenom;
    if (telephone) user.telephone = telephone;
    if (photo) user.photo = photo;
    if (localisation) {
      // Mise à jour partielle ou complète de la localisation
      user.localisation = {
        ...user.localisation,
        ...localisation
      };
    }

    // Si mot de passe fourni, le hasher
    if (req.body.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      user.motDePasse = await bcrypt.hash(req.body.motDePasse, salt);
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      nom: updatedUser.nom,
      prenom: updatedUser.prenom,
      email: updatedUser.email,
      telephone: updatedUser.telephone,
      photo: updatedUser.photo,
      localisation: updatedUser.localisation
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};


// ─── Changer le mot de passe ───
// PUT /api/users/password
const changePassword = async (req, res) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse, confirmation } = req.body;

    // Validation simple
    if (!ancienMotDePasse || !nouveauMotDePasse || !confirmation) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }
    if (nouveauMotDePasse.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
    }
    if (nouveauMotDePasse !== confirmation) {
      return res.status(400).json({ message: 'Le nouveau mot de passe et la confirmation ne correspondent pas.' });
    }

    // Récupérer l'utilisateur (déjà injecté par le middleware auth)
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Vérifier l'ancien mot de passe
    const isMatch = await bcrypt.compare(ancienMotDePasse, user.motDePasse);
    if (!isMatch) {
      return res.status(401).json({ message: 'Ancien mot de passe incorrect.' });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    user.motDePasse = await bcrypt.hash(nouveauMotDePasse, salt);
    await user.save();

    res.json({ message: 'Mot de passe modifié avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Supprimer le compte ───
// DELETE /api/users
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé.' });
    }

    // Supprimer également toutes ses annonces (optionnel mais recommandé)
    await Annonce.deleteMany({ createur: req.user._id });
    // Supprimer ses avis (s'il y en a)
    await Avis.deleteMany({ auteur: req.user._id });
    
    await User.findByIdAndDelete(req.user._id);

    res.json({ message: 'Compte supprimé avec succès.' });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { register, login, getProfil, updateProfil, deleteAccount, changePassword };
