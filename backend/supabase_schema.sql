-- ============================================================
-- QCMS — Supabase PostgreSQL Database Schema
-- ============================================================

-- 1. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) PRIMARY KEY,
    complaint_number VARCHAR(64) NOT NULL UNIQUE,
    lifecycle_status VARCHAR(32) NOT NULL DEFAULT 'pending_triage',
    form_state VARCHAR(32) NOT NULL DEFAULT 'empty',
    complaint_source VARCHAR(64),
    customer_name VARCHAR(255),
    product_name VARCHAR(255),
    product_strength VARCHAR(128),
    batch_lot_number VARCHAR(128),
    manufacturing_date VARCHAR(64),
    expiry_date VARCHAR(64),
    quantity_affected VARCHAR(128),
    complaint_type VARCHAR(64),
    complaint_date VARCHAR(64),
    description TEXT,
    initial_severity VARCHAR(32),
    priority VARCHAR(32),
    risk_assessment JSONB,
    completeness JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    complaint_id VARCHAR(64) REFERENCES complaints(id) ON DELETE CASCADE,
    timestamp VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL,
    actor VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Chat History Table
CREATE TABLE IF NOT EXISTS chat_history (
    id VARCHAR(64) PRIMARY KEY,
    complaint_id VARCHAR(64) REFERENCES complaints(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL,
    content TEXT NOT NULL,
    timestamp VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Uploaded Documents Table
CREATE TABLE IF NOT EXISTS uploaded_documents (
    id VARCHAR(64) PRIMARY KEY,
    complaint_id VARCHAR(64) REFERENCES complaints(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    page_count INT DEFAULT 1,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid lookup
CREATE INDEX IF NOT EXISTS idx_complaints_number ON complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_activity_complaint ON activity_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_chat_complaint ON chat_history(complaint_id);
