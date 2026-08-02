const Notification = require('../models/Notification');

// ─── Mes notifications, les plus récentes d'abord ───
// GET /api/notifications?page=&limite=
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limite = 30 } = req.query;
    const pageNormalisee = Math.max(1, parseInt(page) || 1);
    const limiteNormalisee = Math.min(50, Math.max(1, parseInt(limite) || 30));

    const notifications = await Notification.find({ destinataire: req.user._id })
      .sort({ createdAt: -1 })
      .skip((pageNormalisee - 1) * limiteNormalisee)
      .limit(limiteNormalisee);

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Nombre de notifications non lues (badge) ───
// GET /api/notifications/non-lues
const getNombreNonLues = async (req, res) => {
  try {
    const total = await Notification.countDocuments({ destinataire: req.user._id, lu: false });
    res.json({ total });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Marquer une notification comme lue ───
// PUT /api/notifications/:id/lue
const marquerCommeLue = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: 'Notification introuvable.' });
    if (notification.destinataire.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Cette notification ne vous appartient pas." });
    }
    notification.lu = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

// ─── Marquer toutes les notifications comme lues ───
// PUT /api/notifications/lues
const marquerToutesCommeLues = async (req, res) => {
  try {
    await Notification.updateMany({ destinataire: req.user._id, lu: false }, { lu: true });
    res.json({ message: 'Toutes les notifications ont été marquées comme lues.' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur.', error: error.message });
  }
};

module.exports = { getNotifications, getNombreNonLues, marquerCommeLue, marquerToutesCommeLues };
