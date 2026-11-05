const db = require('../config/db');

// ADD FOOD TO CART
exports.addToCart = async (req, res) => {
    try {
        const studentId = req.session.studentId;
        const { food_id, quantity } = req.body;

        const foodId = Number(food_id);
        const qty = Number(quantity);

        if (!Number.isInteger(foodId) || foodId <= 0 ||
            !Number.isInteger(qty) || qty <= 0) {
            return res.status(400).json({
                message: 'Valid food ID and quantity are required'
            });
        }

        const [foods] = await db.execute(
            `SELECT food_id FROM food_items
             WHERE food_id = ? AND availability = TRUE`,
            [foodId]
        );

        if (foods.length === 0) {
            return res.status(404).json({
                message: 'Food item not available'
            });
        }

        await db.execute(
            `INSERT INTO cart (student_id, food_id, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE
             quantity = quantity + ?`,
            [studentId, foodId, qty, qty]
        );

        res.status(201).json({
            success: true,
            message: 'Food added to cart successfully'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Unable to add food to cart'
        });
    }
};


// VIEW STUDENT CART
exports.getCart = async (req, res) => {
    try {
        const studentId = req.session.studentId;

        const [items] = await db.execute(
            `SELECT
                c.cart_id,
                f.food_id,
                f.food_name,
                f.price,
                f.availability,
                c.quantity,
                (f.price * c.quantity) AS subtotal
             FROM cart c
             JOIN food_items f
             ON c.food_id = f.food_id
             WHERE c.student_id = ?
             ORDER BY c.cart_id`,
            [studentId]
        );

        const total = items.reduce(
            (sum, item) => sum + Number(item.subtotal),
            0
        );

        res.json({
            success: true,
            items,
            total: Number(total.toFixed(2))
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Unable to fetch cart'
        });
    }
};


// UPDATE CART QUANTITY
exports.updateCart = async (req, res) => {
    try {
        const studentId = req.session.studentId;
        const cartId = Number(req.params.cartId);
        const quantity = Number(req.body.quantity);

        if (!Number.isInteger(cartId) || cartId <= 0 ||
            !Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: 'Valid cart ID and quantity are required'
            });
        }

        const [result] = await db.execute(
            `UPDATE cart
             SET quantity = ?
             WHERE cart_id = ? AND student_id = ?`,
            [quantity, cartId, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Cart quantity updated'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to update cart'
        });
    }
};


// REMOVE ITEM FROM CART
exports.removeFromCart = async (req, res) => {
    try {
        const studentId = req.session.studentId;
        const cartId = Number(req.params.cartId);

        if (!Number.isInteger(cartId) || cartId <= 0) {
            return res.status(400).json({
                message: 'Invalid cart ID'
            });
        }

        const [result] = await db.execute(
            `DELETE FROM cart
             WHERE cart_id = ? AND student_id = ?`,
            [cartId, studentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Cart item not found'
            });
        }

        res.json({
            success: true,
            message: 'Item removed from cart'
        });

    } catch (error) {
        res.status(500).json({
            message: 'Unable to remove cart item'
        });
    }
};