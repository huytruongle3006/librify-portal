const express = require('express');
const router = express.Router();
const readerController = require('../controllers/readerController');
const {
  saveReadingProgress,
  getReadingProgress,
  getRecentHistory,
  trackChapterRead,
  getTrendingBooks,
  toggleMarkCompleted,
  getCompletedBookIds,
  checkBookCompletedStatus
} = require('../controllers/readerController');

// 1. Tiến trình đọc dở (Redis Hashes)
router.post('/progress', saveReadingProgress);
router.get('/progress/:userId/:bookId', getReadingProgress);

// 2. Lịch sử đọc gần nhất (Redis List)
router.get('/history/:userId', getRecentHistory);

// 3. Bảng xếp hạng thịnh hành và tăng lượt đọc (Redis ZSET)
router.post('/track-read/:bookId', trackChapterRead);
router.get('/trending', getTrendingBooks);
router.post('/toggle-completed',toggleMarkCompleted);
router.get('/completed-ids/:userId',getCompletedBookIds);
router.get('/check-completed/:userId/:bookId',checkBookCompletedStatus);
module.exports = router;