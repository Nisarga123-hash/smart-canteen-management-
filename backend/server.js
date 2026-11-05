const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');


const express = require('express');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');
const cartRoutes = require('./routes/cartRoutes');

// Create Express application FIRST
const app = express();

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    name: 'canteen.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 2
    }
}));

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// Home route
app.get('/', (req, res) => {
    res.send('Smart Canteen Management System API is running!');
});

// Test MySQL
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT DATABASE() AS db_name'
        );

        res.json({
            success: true,
            message: 'MySQL connected successfully!',
            database: rows[0].db_name
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.SESSION_SECRET) {
            throw new Error('SESSION_SECRET is missing in .env');
        }

        await db.query('SELECT 1');

        console.log('MySQL connected successfully!');

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error('Startup failed:', error.message);
        process.exit(1);
    }
}

startServer();