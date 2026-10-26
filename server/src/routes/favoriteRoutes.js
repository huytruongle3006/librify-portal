const express = require('express');
const router = express.Router();
const {
  toggleFavorite,
  getUserFavoriteIds,
  getUserFavorites,
} = require('../controllers/favoriteController');

router.post('/toggle', toggleFavorite);
router.get('/ids/:userId', getUserFavoriteIds);
router.get('/my-list/:userId', getUserFavorites);

module.exports = router;