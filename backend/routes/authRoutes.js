const express = require('express');
const router = express.Router();

const {
    register,
    login,
    logout,
    getProfile
} = require('../controllers/authController');

const { verifyStudent } = require('../middleware/authMiddleware');

// Registration
router.post('/register', register);

// Login
router.post('/login', login);

// Logout
router.post('/logout', logout);

// Get student profile
router.get('/profile', verifyStudent, getProfile);

module.exports = router;