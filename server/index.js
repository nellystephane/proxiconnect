const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const uploadRoutes = require('./routes/uploadRoutes');
const connectDB = require('./config/db');

// ─── Seed admin (auto-création du compte admin au démarrage) ───
const { seedAdmin } = require('./controllers/adminController');

// ─── Routes ───
const userRoutes = require('./routes/userRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const avisRoutes = require('./routes/avisRoutes');
const paiementRoutes = require('./routes/paiementRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Dossier d'upload : créé automatiquement s'il n'existe pas ───
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ─── Middleware ───
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// ─── Routes ───
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// ─── Route d'accueil ───
app.get('/api', (req, res) => {
  res.json({ message: 'API ProxiConnect opérationnelle 🚀' });
});


const startServer = async () => {
  try {
    await connectDB();

    // Création automatique du compte admin (si pas déjà fait)
    await seedAdmin();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Serveur lancé sur http://0.0.0.0:${PORT}`);
    });

  } catch (error) {
    console.error("❌ DB error:", error.message);

    // IMPORTANT : ne pas laisser nodemon terminer sans log
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`⚠ Serveur lancé SANS DB`);
    });
  }
};

startServer();