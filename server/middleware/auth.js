const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/jwt');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Utilisateur non trouvé.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide.' });
  }
};

// ─── Authentification optionnelle ───
// Pour les routes publiques qui adaptent leur comportement quand
// l'utilisateur est connecté, sans jamais bloquer un visiteur anonyme.
// En cas de token absent ou invalide, on continue simplement sans req.user.
const authOptionnel = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) req.user = user;
  } catch (error) {
    // Token invalide ou expiré : on ignore, la route reste accessible.
  }
  next();
};

module.exports = auth;
module.exports.authOptionnel = authOptionnel;