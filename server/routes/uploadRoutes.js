const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configuration de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

// Middleware d'authentification
const auth = require('../middleware/auth');

// POST /api/upload
router.post('/', auth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier envoyé.' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

module.exports = router;