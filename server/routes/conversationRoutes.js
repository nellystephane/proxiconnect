const express = require('express');
const router = express.Router();
const {
  getConversations,
  createConversation,
  getMessages,
  envoyerMessage,
  getNombreNonLus
} = require('../controllers/conversationController');
const auth = require('../middleware/auth');

router.get('/', auth, getConversations);
router.post('/', auth, createConversation);
router.get('/non-lus', auth, getNombreNonLus);
router.get('/:id/messages', auth, getMessages);
router.post('/:id/messages', auth, envoyerMessage);

module.exports = router;
