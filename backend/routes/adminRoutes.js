const express = require('express');
const router = express.Router();

const {
    adminLogin,
    adminLogout,
    getAllOrders,
    updateOrderStatus,
    getAdminFoods,
    addFood,
    updateFood,
    disableFood,
    getSalesReport
} = require('../controllers/adminController');

const { verifyAdmin } =
    require('../middleware/adminMiddleware');

// Admin authentication
router.post('/login', adminLogin);
router.post('/logout', verifyAdmin, adminLogout);

// All routes below require admin login
router.use(verifyAdmin);

// Orders
router.get('/orders', getAllOrders);
router.put('/orders/:orderId/status', updateOrderStatus);

// Food management
router.get('/foods', getAdminFoods);
router.post('/foods', addFood);
router.put('/foods/:foodId', updateFood);
router.delete('/foods/:foodId', disableFood);

// Reports
router.get('/reports/sales', getSalesReport);

module.exports = router;