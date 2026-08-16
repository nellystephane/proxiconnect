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

// ─── Pièces jointes de messagerie : images, PDF et documents courants.
// Route distincte de l'upload photo ci-dessus (limite de taille et types
// acceptés différents), pour ne jamais modifier son comportement existant. ───
const TYPES_PIECE_JOINTE = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

const uploadPieceJointe = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo max
  fileFilter: (req, file, cb) => {
    if (!TYPES_PIECE_JOINTE.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé. Formats acceptés : images, PDF, Word, Excel, texte.'));
    }
    cb(null, true);
  }
});

// POST /api/upload/piece-jointe
router.post('/piece-jointe', auth, (req, res) => {
  uploadPieceJointe.single('fichier')(req, res, (err) => {
    if (err) {
      const tropVolumineux = err.code === 'LIMIT_FILE_SIZE';
      return res.status(400).json({
        message: tropVolumineux ? 'Fichier trop volumineux (10 Mo maximum).' : (err.message || "Erreur lors de l'envoi du fichier.")
      });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier envoyé.' });
    }
    res.json({
      url: `/uploads/${req.file.filename}`,
      nom: req.file.originalname,
      type: req.file.mimetype,
      taille: req.file.size
    });
  });
});

module.exports = router;