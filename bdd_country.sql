USE FutureKawa_Brasil;

-- Suppression des tables (ordre dépendances)
DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS statements;
DROP TABLE IF EXISTS status;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS warehouse;
DROP TABLE IF EXISTS farms;
DROP TABLE IF EXISTS countries;

-- ======================
-- TABLE countries
-- ======================
CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    temperature_ideal DECIMAL(5,2),
    temperature_tolerance_degrees DECIMAL(5,2),
    humidity_ideal DECIMAL(5,2),
    humidity_tolerance_percents DECIMAL(5,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);

-- ======================
-- TABLE farms
-- ======================
CREATE TABLE farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    id_country INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_country) REFERENCES countries(id)
);

-- ======================
-- TABLE warehouse
-- ======================
CREATE TABLE warehouse (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    id_farm INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_farm) REFERENCES farms(id)
);

-- ======================
-- TABLE batches
-- ======================
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_warehouse INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- entrée entrepôt
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_warehouse) REFERENCES warehouse(id)
);

-- ======================
-- TABLE status
-- ======================
CREATE TABLE status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value ENUM('OK', 'ALERT', 'EXPIRED', 'SENT', 'DESTROYED') NOT NULL,
    id_batch INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_batch) REFERENCES batches(id)
);

-- ======================
-- TABLE statements
-- ======================
CREATE TABLE statements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    id_country INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_country) REFERENCES countries(id)
);

-- ======================
-- TABLE alerts
-- ======================
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    value VARCHAR(255),
    id_status INT,
    id_statement INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_status) REFERENCES status(id),
    FOREIGN KEY (id_statement) REFERENCES statements(id)
);