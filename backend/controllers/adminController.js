const db = require('../config/db');
const bcrypt = require('bcryptjs');

// ADMIN LOGIN
exports.adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const [admins] = await db.query(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const admin = admins[0];

        const validPassword = await bcrypt.compare(
            password,
            admin.password_hash
        );

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Session error'
                });
            }

            req.session.adminId = admin.admin_id;

            res.json({
                success: true,
                message: 'Admin login successful',
                admin: {
                    admin_id: admin.admin_id,
                    name: admin.name,
                    email: admin.email
                }
            });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ADMIN LOGOUT
exports.adminLogout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Logout failed'
            });
        }

        res.clearCookie('canteen.sid');

        res.json({
            success: true,
            message: 'Admin logged out'
        });
    });
};

// VIEW ALL ORDERS
exports.getAllOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT
                o.order_id,
                s.name AS student_name,
                s.email,
                o.order_date,
                o.total_amount,
                o.order_status,
                p.payment_method,
                p.payment_status
            FROM orders o
            JOIN students s ON o.student_id = s.student_id
            LEFT JOIN payments p ON o.order_id = p.order_id
            ORDER BY o.order_date DESC
        `);

        res.json({
            success: true,
            orders
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch orders'
        });
    }
};

// UPDATE ORDER STATUS
exports.updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const allowedStatuses = [
            'Pending',
            'Preparing',
            'Ready',
            'Completed',
            'Cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const [result] = await db.query(
            `UPDATE orders
             SET order_status = ?
             WHERE order_id = ?`,
            [status, orderId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order status updated'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to update order'
        });
    }
};

// VIEW ALL FOOD ITEMS
exports.getAdminFoods = async (req, res) => {
    try {
        const [foods] = await db.query(`
            SELECT f.*, c.category_name
            FROM food_items f
            JOIN categories c
            ON f.category_id = c.category_id
            ORDER BY f.food_id DESC
        `);

        res.json({
            success: true,
            foods
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to fetch food items'
        });
    }
};

// ADD FOOD
exports.addFood = async (req, res) => {
    try {
        const {
            category_id,
            food_name,
            description,
            price,
            image_url
        } = req.body;

        if (
            !category_id ||
            !food_name ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Valid category, food name and price are required'
            });
        }

        const [result] = await db.query(
            `INSERT INTO food_items
            (category_id, food_name, description, price, image_url, availability)
            VALUES (?, ?, ?, ?, ?, TRUE)`,
            [
                category_id,
                food_name,
                description || null,
                price,
                image_url || null
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Food added successfully',
            food_id: result.insertId
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to add food'
        });
    }
};

// UPDATE FOOD
exports.updateFood = async (req, res) => {
    try {
        const { foodId } = req.params;
        const {
            category_id,
            food_name,
            description,
            price,
            image_url,
            availability
        } = req.body;

        if (
            !category_id ||
            !food_name ||
            price === undefined ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0 ||
            ![true, false, 0, 1].includes(availability)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Provide valid food details and availability'
            });
        }

        const [result] = await db.query(
            `UPDATE food_items
             SET category_id = ?,
                 food_name = ?,
                 description = ?,
                 price = ?,
                 image_url = ?,
                 availability = ?
             WHERE food_id = ?`,
            [
                category_id,
                food_name,
                description || null,
                price,
                image_url || null,
                availability,
                foodId
            ]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        res.json({
            success: true,
            message: 'Food updated successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to update food'
        });
    }
};

// DISABLE FOOD (SOFT DELETE)
exports.disableFood = async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE food_items
             SET availability = FALSE
             WHERE food_id = ?`,
            [req.params.foodId]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                success: false,
                message: 'Food item not found'
            });
        }

        res.json({
            success: true,
            message: 'Food item disabled'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to disable food'
        });
    }
};

// SALES REPORT
exports.getSalesReport = async (req, res) => {
    try {
        const [summary] = await db.query(`
            SELECT
                COUNT(*) AS successful_payments,
                COALESCE(SUM(o.total_amount), 0) AS total_sales
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            WHERE p.payment_status = 'Successful'
        `);

        const [dailySales] = await db.query(`
            SELECT
                DATE(p.payment_date) AS sales_date,
                SUM(o.total_amount) AS total_sales
            FROM payments p
            JOIN orders o ON p.order_id = o.order_id
            WHERE p.payment_status = 'Successful'
            GROUP BY DATE(p.payment_date)
            ORDER BY sales_date DESC
            LIMIT 30
        `);

        res.json({
            success: true,
            summary: summary[0],
            dailySales
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Unable to generate sales report'
        });
    }
};