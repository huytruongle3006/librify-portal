const express = require('express');
const router = express.Router();
const { summarizeBook, chatWithAssistant } = require('../controllers/aiController');

// Tuyến đường tóm tắt tác phẩm
router.post('/summarize', summarizeBook);

// Tuyến đường chat và gợi ý sách
router.post('/chat', chatWithAssistant);

module.exports = router;