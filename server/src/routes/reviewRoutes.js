const express = require('express');
const router = express.Router();
const { addReview, getReviewsByBook } = require('../controllers/reviewController');

router.post('/', addReview);
router.get('/book/:bookId', getReviewsByBook);

module.exports = router;