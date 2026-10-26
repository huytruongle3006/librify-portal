const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getAllUsers,
  updateUserStatus,
  updateProfile,
} = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.put('/profile', updateProfile);
// API dành cho Admin
router.get('/', getAllUsers);
router.patch('/:id/status', updateUserStatus);

module.exports = router;