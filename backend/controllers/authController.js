const db = require('../config/db');
const bcrypt = require('bcryptjs');

// STUDENT REGISTRATION
exports.register = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email and password are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: 'Password must contain at least 8 characters'
            });
        }

        const [existing] = await db.execute(
            'SELECT student_id FROM students WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message: 'Email already registered'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            `INSERT INTO students
            (name, email, phone, password_hash)
            VALUES (?, ?, ?, ?)`,
            [name, email, phone || null, hashedPassword]
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful!'
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Registration failed'
        });
    }
};


// STUDENT LOGIN
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required'
            });
        }

        const [students] = await db.execute(
            'SELECT * FROM students WHERE email = ?',
            [email]
        );

        if (students.length === 0) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        const student = students[0];

        const isMatch = await bcrypt.compare(
            password,
            student.password_hash
        );

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password'
            });
        }

        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({
                    message: 'Unable to create session'
                });
            }

            req.session.studentId = student.student_id;

            res.json({
                success: true,
                message: 'Login successful!',
                student: {
                    id: student.student_id,
                    name: student.name,
                    email: student.email
                }
            });
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Login failed'
        });
    }
};


// STUDENT LOGOUT
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                message: 'Logout failed'
            });
        }

        res.clearCookie('connect.sid');

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    });
};


// GET LOGGED-IN STUDENT
exports.getProfile = async (req, res) => {
    try {
        const [students] = await db.execute(
            `SELECT student_id, name, email, phone
             FROM students
             WHERE student_id = ?`,
            [req.session.studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                message: 'Student not found'
            });
        }

        res.json(students[0]);

    } catch (error) {
        res.status(500).json({
            message: 'Unable to fetch profile'
        });
    }
};