CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);


INSERT INTO products (name, description, price, image_url, stock) VALUES
('Wireless Headphones', 'Premium noise-cancelling wireless headphones with 30hr battery life', 2999.00, '/wireless-headphones.jpg', 50),
('Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard with tactile switches', 1499.00, '/mechanical-keyboard.jpg', 30),
('Laptop Stand', 'Adjustable aluminum laptop stand for better posture and airflow', 899.00, '/laptop-stand.jpg', 100),
('USB-C Hub', '7-in-1 USB-C multiport adapter with HDMI, USB 3.0 and SD card slot', 1299.00, '/usb-c-hub.jpg', 75),
('Webcam HD', '1080p HD webcam with built-in microphone, plug and play', 1799.00, '/webcam-hd.jpg', 40),
('Mouse Pad XL', 'Extended gaming mouse pad, water resistant non-slip surface', 499.00, '/mouse-pad-xl.jpg', 200),
('Gaming Mouse', 'Ergonomic gaming mouse with 7 programmable buttons and RGB lighting', 1199.00, '/gaming-mouse.jpg', 60),
('Monitor Light Bar', 'LED monitor light bar with auto-dimming and USB powered', 799.00, '/monitor-light-bar.jpg', 45),
('Laptop Backpack', '15.6 inch waterproof laptop backpack with USB charging port', 1599.00, '/laptop-backpack.jpg', 80),
('Desk Organizer', 'Wooden desktop organizer with phone stand and pen holder', 649.00, '/desk-organizer.jpg', 120);

USE ecommerce_db;