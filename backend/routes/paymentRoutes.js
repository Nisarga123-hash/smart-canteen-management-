const express = require('express');
const router = express.Router();

const { makePayment } =
    require('../controllers/paymentController');

const { verifyStudent } =
    require('../middleware/authMiddleware');

router.use(verifyStudent);

router.post('/', makePayment);

module.exports = router;