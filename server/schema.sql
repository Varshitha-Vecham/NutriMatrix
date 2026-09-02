CREATE DATABASE IF NOT EXISTS nutrimatrix;
USE nutrimatrix;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_profiles (
  user_id INT UNSIGNED PRIMARY KEY,
  phone VARCHAR(30) NULL,
  photo_url VARCHAR(500) NULL,
  age TINYINT UNSIGNED NULL,
  gender VARCHAR(30) NOT NULL DEFAULT 'prefer not to say',
  height_cm DECIMAL(5, 1) NULL,
  weight_kg DECIMAL(5, 1) NULL,
  dietary_goal VARCHAR(50) NOT NULL DEFAULT 'balanced eating',
  diet_type VARCHAR(50) NOT NULL DEFAULT 'no preference',
  allergies TEXT NULL,
  food_dislikes TEXT NULL,
  cuisines TEXT NULL,
  grocery_categories TEXT NULL,
  brands TEXT NULL,
  monthly_budget DECIMAL(10, 2) NULL,
  price_conscious BOOLEAN NOT NULL DEFAULT TRUE,
  notifications BOOLEAN NOT NULL DEFAULT TRUE,
  expiry_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  ai_recommendations BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS receipt_products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  receipt_file_name VARCHAR(255) NOT NULL,
  product_name VARCHAR(150) NOT NULL,
  brand VARCHAR(150) NULL,
  barcode VARCHAR(50) NULL,
  expiry_date DATE NULL,
  purchased_at DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_receipt_product_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_receipt_products_user_expiry (user_id, expiry_date)
);

SET @schema_name = DATABASE();

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT ''user''', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'phone');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN phone VARCHAR(30) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'photo_url');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN photo_url VARCHAR(500) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'gender');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN gender VARCHAR(30) NOT NULL DEFAULT ''prefer not to say''', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'height_cm');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN height_cm DECIMAL(5, 1) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'weight_kg');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN weight_kg DECIMAL(5, 1) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'dietary_goal');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN dietary_goal VARCHAR(50) NOT NULL DEFAULT ''healthy eating''', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'food_dislikes');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN food_dislikes TEXT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'cuisines');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN cuisines TEXT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'grocery_categories');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN grocery_categories TEXT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'brands');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN brands TEXT NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'monthly_budget');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN monthly_budget DECIMAL(10, 2) NULL', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'price_conscious');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN price_conscious BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'notifications');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN notifications BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'expiry_reminders');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN expiry_reminders BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @schema_name AND TABLE_NAME = 'nutrition_profiles' AND COLUMN_NAME = 'ai_recommendations');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE nutrition_profiles ADD COLUMN ai_recommendations BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1'); PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;