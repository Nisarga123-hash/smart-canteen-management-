const express = require('express');
const router = express.Router();

const {
    placeOrder,
    getMyOrders,
    getOrderDetails,
    cancelOrder
} = require('../controllers/orderController');

const { verifyStudent } = require('../middleware/authMiddleware');

// Protect all order routes
router.use(verifyStudent);

// Place new order
router.post('/place', placeOrder);

// View all orders of logged-in student
router.get('/my-orders', getMyOrders);

// View individual order
router.get('/:orderId', getOrderDetails);

// Cancel pending order
router.put('/:orderId/cancel', cancelOrder);

module.exports = router;