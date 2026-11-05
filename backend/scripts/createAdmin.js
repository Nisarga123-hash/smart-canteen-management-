const db = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
    try {
        const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
            throw new Error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env');
        }

        if (ADMIN_PASSWORD.length < 12) {
            throw new Error('Use an admin password with at least 12 characters');
        }

        const [existing] = await db.query(
            'SELECT admin_id FROM admins WHERE email = ?',
            [ADMIN_EMAIL]
        );

        if (existing.length > 0) {
            console.log('Admin account already exists.');
            return;
        }

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

        await db.query(
            `INSERT INTO admins (name, email, password_hash)
             VALUES (?, ?, ?)`,
            [ADMIN_NAME, ADMIN_EMAIL, hashedPassword]
        );

        console.log('Admin account created successfully.');

    } catch (error) {
        console.error('Admin creation failed:', error.message);
    } finally {
        await db.end();
    }
}

createAdmin();