-- =========================================
-- SMART CANTEEN MANAGEMENT SYSTEM
-- DATABASE CREATION
-- =========================================

DROP DATABASE IF EXISTS smart_canteen;

CREATE DATABASE smart_canteen;

USE smart_canteen;

-- 1. STUDENTS TABLE
CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(15),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ADMINS TABLE
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- 3. CATEGORIES TABLE
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- 4. FOOD ITEMS TABLE
CREATE TABLE food_items (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    food_name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(500),
    availability BOOLEAN DEFAULT TRUE,

    FOREIGN KEY (category_id)
    REFERENCES categories(category_id),

    CHECK (price >= 0)
);

-- 5. ORDERS TABLE
CREATE TABLE orders (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    order_status ENUM(
        'Pending',
        'Preparing',
        'Ready',
        'Completed',
        'Cancelled'
    ) DEFAULT 'Pending',

    FOREIGN KEY (student_id)
    REFERENCES students(student_id),

    CHECK (total_amount >= 0)
);

-- 6. ORDER ITEMS TABLE
CREATE TABLE order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    FOREIGN KEY (order_id)
    REFERENCES orders(order_id)
    ON DELETE CASCADE,

    FOREIGN KEY (food_id)
    REFERENCES food_items(food_id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0)
);

-- 7. PAYMENTS TABLE
CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    payment_method ENUM(
        'Cash',
        'UPI',
        'Card'
    ) NOT NULL,
    payment_status ENUM(
        'Pending',
        'Successful',
        'Failed',
        'Refunded'
    ) DEFAULT 'Pending',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (order_id)
    REFERENCES orders(order_id)
);

-- 8. CART TABLE
CREATE TABLE cart (
    cart_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    food_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id)
    ON DELETE CASCADE,

    FOREIGN KEY (food_id)
    REFERENCES food_items(food_id),

    UNIQUE (student_id, food_id),

    CHECK (quantity > 0)
);

-- 9. FEEDBACK TABLE
CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    food_id INT NOT NULL,
    rating INT NOT NULL,
    comments TEXT,
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
    REFERENCES students(student_id),

    FOREIGN KEY (food_id)
    REFERENCES food_items(food_id),

    CHECK (rating BETWEEN 1 AND 5)
);

-- =========================================
-- INSERT SAMPLE CATEGORIES
-- =========================================

INSERT INTO categories (category_name, description)
VALUES
('Breakfast', 'Morning food items'),
('Lunch', 'Lunch meals'),
('Snacks', 'Evening snacks'),
('Beverages', 'Drinks and juices');

-- =========================================
-- INSERT SAMPLE FOOD ITEMS
-- =========================================

INSERT INTO food_items
(category_id, food_name, description, price, availability)
VALUES
(1, 'Idli', 'Soft steamed idli with chutney', 30.00, TRUE),
(1, 'Dosa', 'Crispy masala dosa', 50.00, TRUE),
(2, 'Veg Meals', 'Complete vegetarian meals', 80.00, TRUE),
(2, 'Fried Rice', 'Vegetable fried rice', 70.00, TRUE),
(3, 'Samosa', 'Crispy vegetable samosa', 15.00, TRUE),
(3, 'Sandwich', 'Vegetable sandwich', 40.00, TRUE),
(4, 'Coffee', 'Hot filter coffee', 15.00, TRUE),
(4, 'Fresh Juice', 'Seasonal fruit juice', 35.00, TRUE);

-- =========================================
-- VERIFY DATABASE
-- =========================================

SHOW TABLES;

SELECT * FROM categories;

SELECT * FROM food_items;