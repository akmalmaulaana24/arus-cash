
CREATE DATABASE IF NOT EXISTS laporan_keuangan;
USE laporan_keuangan;
CREATE TABLE categories (id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(100) NOT NULL,type ENUM('income','expense') NOT NULL,icon VARCHAR(12) DEFAULT '🏷️');
CREATE TABLE transactions (id INT AUTO_INCREMENT PRIMARY KEY,title VARCHAR(160) NOT NULL,amount DECIMAL(15,2) NOT NULL,type ENUM('income','expense') NOT NULL,category_id INT,date DATE NOT NULL,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL);
INSERT INTO categories(name,type,icon) VALUES ('Gaji','income','💼'),('Freelance','income','💻'),('Makanan','expense','🍜'),('Transportasi','expense','🚗'),('Belanja','expense','🛍️'),('Tagihan','expense','📄');
