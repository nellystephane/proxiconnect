const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');


// ─── Routes ───
const userRoutes = require('./routes/userRoutes');
const annonceRoutes = require('./routes/annonceRoutes');
const avisRoutes = require('./routes/avisRoutes');
const paiementRoutes = require('./routes/paiementRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(cors());
app.use(express.json());

// ─── Routes ───
app.use('/api/users', userRoutes);
app.use('/api/annonces', annonceRoutes);
app.use('/api/avis', avisRoutes);
app.use('/api/paiements', paiementRoutes);

// ─── Route d'accueil ───
app.get('/api', (req, res) => {
  res.json({ message: 'API ProxiConnect opérationnelle 🚀' });
});


const startServer = async () => {
  try {
    await connectDB();

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