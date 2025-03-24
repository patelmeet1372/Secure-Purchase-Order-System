-- Users table to store user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('purchaser', 'supervisor', 'purchasing_dept')),
    public_key TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Purchase orders table
CREATE TABLE purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    purchaser_id INTEGER REFERENCES users(id),
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    vendor VARCHAR(100) NOT NULL,
    encrypted_details TEXT NOT NULL, -- AES encrypted order details
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signatures table to store digital signatures
CREATE TABLE signatures (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id),
    signer_id INTEGER REFERENCES users(id),
    signature TEXT NOT NULL, -- Base64 encoded signature
    hash TEXT NOT NULL, -- Hash of the purchase order that was signed
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking all actions
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 