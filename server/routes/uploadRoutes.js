const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo max
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Seuls les fichiers image sont autorisés.'));
    }
    cb(null, true);
  }
});

// Middleware d'authentification
const auth = require('../middleware/auth');

// POST /api/upload
router.post('/', auth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Erreur lors de l\'upload.' });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
});

module.exports = router;