-- MySQL 8.0+
-- ระบบจัดเส้นทางและแบ่งงานไรเดอร์ "ส่งด่วนมื้อเที่ยง"

CREATE DATABASE IF NOT EXISTS lunch_delivery
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lunch_delivery;

-- ใช้เวลา UTC ในฐานข้อมูล แล้วแปลงเป็นเวลาไทยที่หน้าจอ/API
SET time_zone = '+00:00';

CREATE TABLE shops (
  id TINYINT UNSIGNED NOT NULL DEFAULT 1,
  name VARCHAR(120) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  price_per_box DECIMAL(10, 2) NOT NULL DEFAULT 65.00,
  cost_per_box DECIMAL(10, 2) NOT NULL DEFAULT 40.00,
  rider_base_fee DECIMAL(10, 2) NOT NULL DEFAULT 15.00,
  rider_per_box_km DECIMAL(10, 2) NOT NULL DEFAULT 2.00,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT chk_single_shop CHECK (id = 1),
  CONSTRAINT chk_shop_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_shop_longitude CHECK (longitude BETWEEN -180 AND 180),
  CONSTRAINT chk_shop_prices CHECK (
    price_per_box >= 0 AND cost_per_box >= 0
    AND rider_base_fee >= 0 AND rider_per_box_km >= 0
  )
) ENGINE = InnoDB;

CREATE TABLE customers (
  id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  address VARCHAR(500) NOT NULL DEFAULT '',
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_customers_name (name),
  INDEX idx_customers_phone (phone),
  CONSTRAINT chk_customer_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_customer_longitude CHECK (longitude BETWEEN -180 AND 180)
) ENGINE = InnoDB;

CREATE TABLE orders (
  id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  customer_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  order_date DATE NOT NULL,
  status ENUM('pending', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_orders_date_status (order_date, status),
  INDEX idx_orders_customer (customer_id),
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_order_quantity CHECK (quantity BETWEEN 1 AND 3)
) ENGINE = InnoDB;

CREATE TABLE delivery_plans (
  id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  delivery_date DATE NOT NULL,
  input_signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  routing_mode ENUM('road') NOT NULL DEFAULT 'road',
  departure_time TIME NOT NULL DEFAULT '11:30:00',
  deadline_time TIME NOT NULL DEFAULT '12:30:00',
  speed_kmh DECIMAL(6, 2) NOT NULL DEFAULT 30.00,
  service_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 2,
  alternative_index SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  alternatives_count SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  shop_snapshot JSON NOT NULL,
  rider_count SMALLINT UNSIGNED NOT NULL,
  total_orders SMALLINT UNSIGNED NOT NULL,
  total_boxes SMALLINT UNSIGNED NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  delivery_cost DECIMAL(12, 2) NOT NULL,
  revenue DECIMAL(12, 2) NOT NULL,
  food_cost DECIMAL(12, 2) NOT NULL,
  profit DECIMAL(12, 2) NOT NULL,
  max_duration_minutes SMALLINT UNSIGNED NOT NULL,
  last_arrival_time TIME NOT NULL,
  all_on_time BOOLEAN NOT NULL,
  issued_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX idx_plans_date_created (delivery_date, created_at),
  INDEX idx_plans_signature (delivery_date, input_signature)
) ENGINE = InnoDB;

CREATE TABLE rider_routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  rider_number SMALLINT UNSIGNED NOT NULL,
  color CHAR(7) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  color_name VARCHAR(30) NOT NULL,
  total_boxes SMALLINT UNSIGNED NOT NULL,
  distance_km DECIMAL(10, 2) NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL,
  delivery_cost DECIMAL(12, 2) NOT NULL,
  geometry JSON NOT NULL,
  navigation_url TEXT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_route_plan_rider (plan_id, rider_number),
  CONSTRAINT fk_routes_plan
    FOREIGN KEY (plan_id) REFERENCES delivery_plans (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE route_stops (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  route_id BIGINT UNSIGNED NOT NULL,
  order_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  customer_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  stop_sequence TINYINT UNSIGNED NOT NULL,
  -- snapshot ทำให้ใบงานเดิมยังแสดงรายละเอียด ณ เวลาที่คำนวณได้
  customer_name VARCHAR(120) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  address VARCHAR(500) NOT NULL DEFAULT '',
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  quantity TINYINT UNSIGNED NOT NULL,
  arrival_time TIME NOT NULL,
  distance_from_previous_km DECIMAL(10, 2) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stop_sequence (route_id, stop_sequence),
  INDEX idx_stops_order (order_id),
  INDEX idx_stops_customer (customer_id),
  CONSTRAINT fk_stops_route
    FOREIGN KEY (route_id) REFERENCES rider_routes (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_stops_order
    FOREIGN KEY (order_id) REFERENCES orders (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_stops_customer
    FOREIGN KEY (customer_id) REFERENCES customers (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_stop_sequence CHECK (stop_sequence BETWEEN 1 AND 3),
  CONSTRAINT chk_stop_quantity CHECK (quantity BETWEEN 1 AND 3),
  CONSTRAINT chk_stop_latitude CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT chk_stop_longitude CHECK (longitude BETWEEN -180 AND 180)
) ENGINE = InnoDB;

CREATE TABLE rider_jobs (
  code VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  plan_id VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  route_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active', 'superseded') NOT NULL DEFAULT 'active',
  input_signature CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (code),
  UNIQUE KEY uq_job_route (route_id),
  INDEX idx_jobs_plan_status (plan_id, status),
  CONSTRAINT fk_jobs_plan
    FOREIGN KEY (plan_id) REFERENCES delivery_plans (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_jobs_route
    FOREIGN KEY (route_id) REFERENCES rider_routes (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

-- ร้านเริ่มต้นจาก data/db.json ปัจจุบัน
INSERT INTO shops (
  id, name, latitude, longitude,
  price_per_box, cost_per_box, rider_base_fee, rider_per_box_km
) VALUES (
  1, 'ส่งด่วนมื้อเที่ยง', 16.2460000, 103.2520000,
  65.00, 40.00, 15.00, 2.00
) ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  latitude = VALUES(latitude),
  longitude = VALUES(longitude),
  price_per_box = VALUES(price_per_box),
  cost_per_box = VALUES(cost_per_box),
  rider_base_fee = VALUES(rider_base_fee),
  rider_per_box_km = VALUES(rider_per_box_km);

-- ตัวอย่าง query ที่ API ใช้โหลดออเดอร์พร้อมลูกค้า
-- SELECT o.*, c.name, c.phone, c.address, c.latitude, c.longitude
-- FROM orders o
-- JOIN customers c ON c.id = o.customer_id
-- WHERE o.order_date = '2026-09-19'
-- ORDER BY o.created_at;
