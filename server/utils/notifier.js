const Notification = require('../models/Notification');

// ─── Crée une notification en base et la pousse en temps réel si possible ───
// `io` peut être null (ex: contexte sans requête HTTP) : la notification est
// alors simplement stockée, l'utilisateur la verra à sa prochaine connexion.
const creerNotification = async (io, destinataireId, type, titre, message, lien = '') => {
  try {
    const notification = await Notification.create({ destinataire: destinataireId, type, titre, message, lien });
    if (io) {
      io.to(`user:${destinataireId}`).emit('notification:nouvelle', notification);
    }
    return notification;
  } catch (error) {
    // Une notification manquée ne doit jamais faire échouer l'action principale
    console.error('Erreur création notification:', error.message);
    return null;
  }
};

module.exports = { creerNotification };
