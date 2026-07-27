const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);

    let uri = process.env.MONGODB_URI;

    if (!uri) {
      // Utiliser MongoDB en mémoire si aucune URI n'est fournie
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 30000 // 30 secondes pour le téléchargement/démarrage
        }
      });
      uri = mongod.getUri();
      console.log("🧠 Utilisation de MongoDB en mémoire (mongodb-memory-server)");
    }

    await mongoose.connect(uri, { dbName: "proxiconnect" });
    console.log("✅ MongoDB connecté avec succès");
    return true;
  } catch (error) {
    console.error("❌ Erreur de connexion MongoDB :", error.message);
    console.warn("⚠️  Le serveur fonctionnera sans base de données (mode dégradé)");
    return false;
  }
};

module.exports = connectDB;
