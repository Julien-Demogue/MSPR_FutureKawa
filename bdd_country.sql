DROP TABLE IF EXISTS alerts;

DROP TABLE IF EXISTS statements;

DROP TABLE IF EXISTS statuses;

DROP TABLE IF EXISTS batches;

DROP TABLE IF EXISTS warehouses;

DROP TABLE IF EXISTS farms;

DROP TABLE IF EXISTS countries;

CREATE USER if not EXISTS 'exporter' @'%' IDENTIFIED BY 'exporterpassword'
WITH
    MAX_USER_CONNECTIONS 3;

-- ======================
-- TABLE countries
-- ======================
CREATE TABLE countries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    temperature_ideal DECIMAL(5, 2),
    temperature_tolerance_degrees DECIMAL(5, 2),
    humidity_ideal DECIMAL(5, 2),
    humidity_tolerance_percents DECIMAL(5, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);

-- ======================
-- TABLE farms
-- ======================
CREATE TABLE farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    id_country INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_country) REFERENCES countries (id)
);

-- ======================
-- TABLE warehouses
-- ======================
CREATE TABLE warehouses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    id_farm INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_farm) REFERENCES farms (id)
);

-- ======================
-- TABLE batches
-- ======================
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    id_warehouse INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- entrée entrepôt
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_warehouse) REFERENCES warehouses (id)
);

-- ======================
-- TABLE status
-- ======================
CREATE TABLE statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    value ENUM(
        'OK',
        'ALERT',
        'EXPIRED',
        'SENT'
    ) NOT NULL,
    id_batch INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_batch) REFERENCES batches (id)
);

-- ======================
-- TABLE statements
-- ======================
CREATE TABLE statements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    value DECIMAL(5, 2),
    type ENUM(
        'TEMPERATURE',
        'HUMIDITY'
    ) NOT NULL,
    id_warehouse INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_warehouse) REFERENCES warehouses (id)
);

-- ======================
-- TABLE alerts
-- ======================
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    value VARCHAR(255),
    id_status INT,
    id_statement INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,
    FOREIGN KEY (id_status) REFERENCES statuses (id),
    FOREIGN KEY (id_statement) REFERENCES statements (id)
);