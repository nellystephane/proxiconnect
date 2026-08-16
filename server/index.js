const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const uploadRoutes = require('./routes/uploadRoutes');
const connectDB = require('./config/db');
const { JWT_SECRET } = require('./config/jwt');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const { creerNotification } = require('./utils/notifier');
const { marquerEnLigne, marquerHorsLigne, estEnLigne } = require('./utils/presence');


// ─── Routes ───
const userRoutes = require('./routes/userRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const avisRoutes = require('./routes/avisRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const boutiqueRoutes = require('./routes/boutiqueRoutes');
const produitRoutes = require('./routes/produitRoutes');
const commandeRoutes = require('./routes/commandeRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const platRoutes = require('./routes/platRoutes');
const commandeRestaurantRoutes = require('./routes/commandeRestaurantRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const chambreRoutes = require('./routes/chambreRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const livreurRoutes = require('./routes/livreurRoutes');
const demandeLivraisonRoutes = require('./routes/demandeLivraisonRoutes');
const evaluationLivreurRoutes = require('./routes/evaluationLivreurRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Dossier d'upload : créé automatiquement s'il n'existe pas ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Origines autorisées (CORS) ───
// Configurable via la variable d'environnement CORS_ORIGINS (liste séparée par
// des virgules) pour ne pas avoir à modifier le code si le domaine change.
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://nellystephane.github.io,http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Autorise aussi les requêtes sans origine (apps mobiles, curl, health checks)
    if (!origin || CORS_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origine non autorisée par CORS.'));
    }
  },
  credentials: true
};

// ─── Limitation du débit sur les routes sensibles (anti brute-force) ───
const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Trop de tentatives. Réessayez dans quelques minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ─── Middleware ───
app.use(helmet({
  // L'app sert des photos uploadées consommées cross-origin par le front GitHub Pages
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors(corsOptions));
app.use(express.json());
app.use(mongoSanitize()); // neutralise les opérateurs Mongo ($gt, $ne...) injectés dans le body/query
app.use('/uploads', express.static(uploadsDir));

app.use('/api/users/login', limiteurAuth);
app.use('/api/users/register', limiteurAuth);
app.use('/api/users/password', limiteurAuth);

// ─── Routes ───
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/boutiques', boutiqueRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/commandes', commandeRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/plats', platRoutes);
app.use('/api/commandes-restaurant', commandeRestaurantRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/chambres', chambreRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/livreurs', livreurRoutes);
app.use('/api/demandes-livraison', demandeLivraisonRoutes);
app.use('/api/evaluations-livreur', evaluationLivreurRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Route d'accueil ───
app.get('/api', (req, res) => {
  res.json({ message: 'API ProxiConnect opérationnelle 🚀' });
});

// ─── Healthcheck : utile pour le monitoring (Render, uptime checks...) ───
app.get('/api/health', (req, res) => {
  const dbConnecte = mongoose.connection.readyState === 1;
  res.status(dbConnecte ? 200 : 503).json({
    statut: dbConnecte ? 'ok' : 'degrade',
    base_de_donnees: dbConnecte ? 'connectee' : 'deconnectee'
  });
});

// ─── Serveur HTTP + Socket.io (chat en temps réel) ───
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});
app.set('io', io); // pour que les contrôleurs REST puissent aussi émettre (voir conversationController)

// ─── Authentification des sockets via le même JWT que les routes REST ───
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentification requise.'));
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return next(new Error('Utilisateur introuvable.'));
    socket.userId = user._id.toString();
    socket.userNomComplet = `${user.prenom} ${user.nom}`;
    next();
  } catch {
    next(new Error('Token invalide.'));
  }
});

// ─── Diffuse un changement de présence aux personnes qui partagent une
// conversation avec cet utilisateur (pas de broadcast global : inutile et
// plus coûteux que de cibler les seules personnes concernées). ───
const diffuserPresence = async (userId, enLigneVal) => {
  try {
    const conversations = await Conversation.find({ participants: userId }).select('participants');
    const autres = new Set();
    conversations.forEach((c) => c.participants.forEach((p) => {
      if (p.toString() !== userId) autres.add(p.toString());
    }));
    if (autres.size === 0) return;

    let dernierActivite = null;
    if (!enLigneVal) {
      dernierActivite = new Date();
      await User.findByIdAndUpdate(userId, { dernierActivite }).catch(() => {});
    }

    autres.forEach((id) => {
      io.to(`user:${id}`).emit('presence:maj', { userId, enLigne: enLigneVal, dernierActivite });
    });
  } catch (error) {
    console.error('Erreur diffusion présence :', error);
  }
};

io.on('connection', (socket) => {
  // Salle personnelle : permet de notifier l'utilisateur même hors d'une conversation ouverte
  socket.join(`user:${socket.userId}`);

  // ─── Présence : ce socket compte comme une connexion active pour cet
  // utilisateur. S'il en avait déjà une autre ouverte (autre onglet,
  // autre appareil), on ne redouble pas l'annonce "en ligne". ───
  const etaitDejaEnLigne = estEnLigne(socket.userId);
  marquerEnLigne(socket.userId, socket.id);
  if (!etaitDejaEnLigne) diffuserPresence(socket.userId, true);

  socket.on('conversation:rejoindre', (conversationId) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('conversation:quitter', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('message:envoyer', async ({ conversationId, contenu, pieceJointe }, callback) => {
    try {
      const texte = (contenu || '').trim();
      if (!texte && !pieceJointe?.url) return callback?.({ erreur: 'Message vide.' });

      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.participants.some((p) => p.toString() === socket.userId)) {
        return callback?.({ erreur: "Vous ne participez pas à cette conversation." });
      }

      const message = await Message.create({
        conversation: conversationId,
        expediteur: socket.userId,
        contenu: texte,
        pieceJointe: pieceJointe?.url ? pieceJointe : undefined
      });

      conversation.dernierMessage = texte || (pieceJointe ? `📎 ${pieceJointe.nom || 'Pièce jointe'}` : '');
      conversation.derniereActivite = new Date();
      await conversation.save();

      io.to(`conversation:${conversationId}`).emit('message:nouveau', message);
      // Notifie aussi l'autre personne même si elle n'a pas la conversation ouverte
      for (const p of conversation.participants) {
        if (p.toString() !== socket.userId) {
          io.to(`user:${p.toString()}`).emit('conversation:maj', conversation._id);
          await creerNotification(
            io,
            p,
            pieceJointe?.url ? 'piece_jointe' : 'nouveau_message',
            pieceJointe?.url ? `${socket.userNomComplet} vous a envoyé un fichier` : `Nouveau message de ${socket.userNomComplet}`,
            texte.length > 100 ? `${texte.slice(0, 100)}…` : (texte || pieceJointe?.nom || ''),
            `/messages/${conversationId}`
          );
        }
      }

      callback?.({ message });
    } catch (error) {
      callback?.({ erreur: 'Erreur serveur.' });
    }
  });

  socket.on('disconnect', () => {
    const vientDePasserHorsLigne = marquerHorsLigne(socket.userId, socket.id);
    if (vientDePasserHorsLigne) diffuserPresence(socket.userId, false);
  });
});


const startServer = async () => {
  try {
    await connectDB();

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error("❌ DB error:", error.message);

    // IMPORTANT : ne pas laisser nodemon terminer sans log
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`⚠ Serveur lancé SANS DB`);
    });
  }
};

startServer();