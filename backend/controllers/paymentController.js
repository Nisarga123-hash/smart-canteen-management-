const db = require('../config/db');

exports.makePayment = async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { order_id, payment_method } = req.body;
        const studentId = req.session.studentId;

        if (!Number.isInteger(Number(order_id)) ||
            Number(order_id) <= 0 ||
            !['Cash', 'UPI', 'Card'].includes(payment_method)) {
            return res.status(400).json({
                success: false,
                message: 'Valid order ID and payment method are required'
            });
        }

        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT order_id, total_amount, order_status
             FROM orders
             WHERE order_id = ? AND student_id = ?
             FOR UPDATE`,
            [order_id, studentId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (orders[0].order_status === 'Cancelled') {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Cannot pay for a cancelled order'
            });
        }

        const [existing] = await connection.query(
            'SELECT payment_id FROM payments WHERE order_id = ?',
            [order_id]
        );

        if (existing.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Payment already exists for this order'
            });
        }

        // Simulation only: no actual UPI or card transaction occurs.
        const paymentStatus =
            payment_method === 'Cash' ? 'Pending' : 'Successful';

        const [result] = await connection.query(
            `INSERT INTO payments
             (order_id, payment_method, payment_status, payment_date)
             VALUES (?, ?, ?, NOW())`,
            [order_id, payment_method, paymentStatus]
        );

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Payment record created',
            payment_id: result.insertId,
            payment_method,
            payment_status: paymentStatus,
            amount: orders[0].total_amount,
            note: 'UPI and Card payments are simulated, not real transactions.'
        });

    } catch (error) {
        await connection.rollback();
        console.error(error);

        res.status(500).json({
            success: false,
            message: 'Payment failed'
        });
    } finally {
        connection.release();
    }
};