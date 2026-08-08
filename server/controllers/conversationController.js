const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { creerNotification } = require('../utils/notifier');

// ─── Mes conversations, triées par activité récente ───
// GET /api/conversations
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'nom prenom photo')
      .sort({ derniereActivite: -1 });

    // Nombre de messages non lus par conversation (envoyés par l'autre personne)
    const conversationsAvecCompteur = await Promise.all(
      conversations.map(async (conv) => {
        const nonLus = await Message.countDocuments({
          conversation: conv._id,
          expediteur: { $ne: req.user._id },
          lu: false
        });
        return { ...conv.toObject(), nonLus };
      })
    );

    res.json(conversationsAvecCompteur);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Démarrer une conversation avec quelqu'un (ou récupérer l'existante) ───
// POST /api/conversations
const createConversation = async (req, res) => {
  try {
    const { destinataireId, contexte } = req.body;

    if (!destinataireId) {
      return res.status(400).json({ message: 'Destinataire obligatoire.' });
    }
    if (destinataireId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas vous écrire à vous-même.' });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, destinataireId], $size: 2 }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, destinataireId],
        contexte: contexte || undefined
      });
    }

    conversation = await conversation.populate('participants', 'nom prenom photo');
    res.status(201).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Historique des messages d'une conversation ───
// GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation introuvable.' });
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Vous ne participez pas à cette conversation." });
    }

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

    // Marquer comme lus les messages de l'autre personne
    await Message.updateMany(
      { conversation: conversation._id, expediteur: { $ne: req.user._id }, lu: false },
      { lu: true }
    );

    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Envoyer un message (fallback REST ; le temps réel passe par Socket.io) ───
// POST /api/conversations/:id/messages
const envoyerMessage = async (req, res) => {
  try {
    const { contenu } = req.body;
    if (!contenu || !contenu.trim()) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide.' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) return res.status(404).json({ message: 'Conversation introuvable.' });
    if (!conversation.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: "Vous ne participez pas à cette conversation." });
    }

    const message = await Message.create({
      conversation: conversation._id,
      expediteur: req.user._id,
      contenu: contenu.trim()
    });

    conversation.dernierMessage = contenu.trim().slice(0, 120);
    conversation.derniereActivite = new Date();
    await conversation.save();

    // Diffusion en temps réel aux participants connectés (voir index.js)
    const io = req.app.get('io');
    if (io) io.to(`conversation:${conversation._id}`).emit('message:nouveau', message);

    const destinataire = conversation.participants.find((p) => p.toString() !== req.user._id.toString());
    if (destinataire) {
      await creerNotification(
        io,
        destinataire,
        'nouveau_message',
        `Nouveau message de ${req.user.prenom} ${req.user.nom}`,
        contenu.trim().length > 100 ? `${contenu.trim().slice(0, 100)}…` : contenu.trim(),
        `/messages/${conversation._id}`
      );
    }

    res.status(201).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

// ─── Nombre total de messages non lus (badge global) ───
// GET /api/conversations/non-lus
const getNombreNonLus = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id }).select('_id');
    const total = await Message.countDocuments({
      conversation: { $in: conversations.map((c) => c._id) },
      expediteur: { $ne: req.user._id },
      lu: false
    });
    res.json({ total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
};

module.exports = { getConversations, createConversation, getMessages, envoyerMessage, getNombreNonLus };
