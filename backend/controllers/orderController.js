const db = require('../config/db');

// PLACE ORDER
exports.placeOrder = async (req, res) => {
    let connection;

    try {
        const studentId = req.session.studentId;

        connection = await db.getConnection();

        // Start transaction
        await connection.beginTransaction();

        // Lock and retrieve cart items
        const [cartItems] = await connection.execute(
            `SELECT
                c.food_id,
                c.quantity,
                f.food_name,
                f.price,
                f.availability
             FROM cart c
             JOIN food_items f
             ON c.food_id = f.food_id
             WHERE c.student_id = ?
             FOR UPDATE`,
            [studentId]
        );

        if (cartItems.length === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: 'Your cart is empty'
            });
        }

        // Check food availability
        const unavailable = cartItems.filter(
            item => !item.availability
        );

        if (unavailable.length > 0) {
            await connection.rollback();

            return res.status(400).json({
                message: 'Some food items are unavailable',
                items: unavailable.map(item => item.food_name)
            });
        }

        // Calculate total using integer paise
        const totalPaise = cartItems.reduce((sum, item) => {
            const pricePaise = Math.round(
                Number(item.price) * 100
            );

            return sum + pricePaise * item.quantity;
        }, 0);

        const totalAmount = (totalPaise / 100).toFixed(2);

        // Insert order
        const [orderResult] = await connection.execute(
            `INSERT INTO orders
             (student_id, total_amount, order_status)
             VALUES (?, ?, 'Pending')`,
            [studentId, totalAmount]
        );

        const orderId = orderResult.insertId;

        // Insert individual order items
        for (const item of cartItems) {
            await connection.execute(
                `INSERT INTO order_items
                 (order_id, food_id, quantity, unit_price)
                 VALUES (?, ?, ?, ?)`,
                [
                    orderId,
                    item.food_id,
                    item.quantity,
                    item.price
                ]
            );
        }

        // Clear student's cart
        await connection.execute(
            'DELETE FROM cart WHERE student_id = ?',
            [studentId]
        );

        // Save all changes
        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully!',
            order: {
                order_id: orderId,
                total_amount: totalAmount,
                order_status: 'Pending',
                items: cartItems.map(item => ({
                    food_name: item.food_name,
                    quantity: item.quantity,
                    unit_price: item.price
                }))
            }
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Order error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to place order'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};


// VIEW ALL STUDENT ORDERS
exports.getMyOrders = async (req, res) => {
    try {
        const studentId = req.session.studentId;

        const [orders] = await db.execute(
            `SELECT
                o.order_id,
                o.order_date,
                o.total_amount,
                o.order_status,
                COUNT(oi.order_item_id) AS total_items
             FROM orders o
             LEFT JOIN order_items oi
             ON o.order_id = oi.order_id
             WHERE o.student_id = ?
             GROUP BY
                o.order_id,
                o.order_date,
                o.total_amount,
                o.order_status
             ORDER BY o.order_date DESC`,
            [studentId]
        );

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Unable to fetch orders'
        });
    }
};


// VIEW SINGLE ORDER DETAILS
exports.getOrderDetails = async (req, res) => {
    try {
        const studentId = req.session.studentId;
        const orderId = Number(req.params.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Invalid order ID'
            });
        }

        const [orders] = await db.execute(
            `SELECT order_id, order_date,
                    total_amount, order_status
             FROM orders
             WHERE order_id = ? AND student_id = ?`,
            [orderId, studentId]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        const [items] = await db.execute(
            `SELECT
                oi.food_id,
                f.food_name,
                oi.quantity,
                oi.unit_price,
                (oi.quantity * oi.unit_price) AS subtotal
             FROM order_items oi
             JOIN food_items f
             ON oi.food_id = f.food_id
             WHERE oi.order_id = ?`,
            [orderId]
        );

        res.json({
            success: true,
            order: orders[0],
            items
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Unable to fetch order details'
        });
    }
};


// CANCEL PENDING ORDER
exports.cancelOrder = async (req, res) => {
    let connection;

    try {
        const studentId = req.session.studentId;
        const orderId = Number(req.params.orderId);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Invalid order ID'
            });
        }

        connection = await db.getConnection();

        await connection.beginTransaction();

        const [result] = await connection.query(
    `UPDATE orders
     SET order_status = 'Cancelled'
     WHERE order_id = ?
       AND student_id = ?
       AND order_status = 'Pending'
       AND NOT EXISTS (
           SELECT 1
           FROM payments
           WHERE payments.order_id = orders.order_id
             AND payments.payment_status = 'Successful'
       )`,
    [orderId, studentId]
);

        if (result.affectedRows === 0) {
            await connection.rollback();

            return res.status(400).json({
                message: 'Order not found or cannot be cancelled'
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(error);

        res.status(500).json({
            message: 'Unable to cancel order'
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
};