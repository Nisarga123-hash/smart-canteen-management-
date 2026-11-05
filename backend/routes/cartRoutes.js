const express = require('express');
const router = express.Router();

const {
    addToCart,
    getCart,
    updateCart,
    removeFromCart
} = require('../controllers/cartController');

const { verifyStudent } = require('../middleware/authMiddleware');

// Every cart operation requires student login
router.use(verifyStudent);

// Add food
router.post('/add', addToCart);

// View cart
router.get('/', getCart);

// Update quantity
router.put('/:cartId', updateCart);

// Remove item
router.delete('/:cartId', removeFromCart);

module.exports = router;