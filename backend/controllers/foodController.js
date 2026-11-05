const db = require('../config/db');

// GET ALL FOOD ITEMS
exports.getAllFoods = async (req, res) => {
    try {
        const [foods] = await db.execute(`
            SELECT
                f.food_id,
                f.food_name,
                f.description,
                f.price,
                f.image_url,
                f.availability,
                c.category_name
            FROM food_items f
            JOIN categories c
            ON f.category_id = c.category_id
            ORDER BY f.food_id
        `);

        res.json({
            success: true,
            foods
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to fetch food items'
        });
    }
};


// GET FOOD BY CATEGORY
exports.getFoodsByCategory = async (req, res) => {
    try {
        const categoryId = Number(req.params.categoryId);

        if (!Number.isInteger(categoryId) || categoryId <= 0) {
            return res.status(400).json({
                message: 'Invalid category ID'
            });
        }

        const [foods] = await db.execute(
            `SELECT food_id, food_name, description,
                    price, image_url, availability
             FROM food_items
             WHERE category_id = ?
             AND availability = TRUE`,
            [categoryId]
        );

        res.json({
            success: true,
            foods
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to fetch category foods'
        });
    }
};


// SEARCH FOOD ITEMS
exports.searchFoods = async (req, res) => {
    try {
        const search = req.query.q || '';

        const [foods] = await db.execute(
            `SELECT food_id, food_name, description,
                    price, availability
             FROM food_items
             WHERE food_name LIKE ?
             ORDER BY food_name`,
            [`%${search}%`]
        );

        res.json({
            success: true,
            foods
        });

    } catch (error) {
        res.status(500).json({
            message: 'Food search failed'
        });
    }
};


// GET CATEGORIES
exports.getCategories = async (req, res) => {
    try {
        const [categories] = await db.execute(
            'SELECT * FROM categories ORDER BY category_id'
        );

        res.json(categories);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to fetch categories'
        });
    }
};