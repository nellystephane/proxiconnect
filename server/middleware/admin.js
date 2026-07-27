// ─── Middleware d'authentification admin ───
// Vérifie que l'utilisateur est connecté ET possède le rôle 'admin'.
// Ce middleware doit être utilisé APRÈS le middleware `auth` standard,
// car il s'appuie sur req.user déjà injecté.

const admin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Accès refusé. Authentification requise.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Droits administrateur requis.' });
    }

    // L'utilisateur qui appelle est banni ? Normalement un admin ne peut
    // pas être banni, mais on vérifie par précaution.
    if (req.user.estBanni) {
      return res.status(403).json({ message: 'Votre compte a été désactivé. Contactez un autre administrateur.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = admin;

