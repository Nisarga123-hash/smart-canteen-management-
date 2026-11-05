const express = require('express');
const router = express.Router();

const {
    getAllFoods,
    getFoodsByCategory,
    searchFoods,
    getCategories
} = require('../controllers/foodController');

// Get all food items
router.get('/', getAllFoods);

// Get all categories
router.get('/categories', getCategories);

// Search food
router.get('/search', searchFoods);

// Filter food by category
router.get('/category/:categoryId', getFoodsByCategory);

module.exports = router;