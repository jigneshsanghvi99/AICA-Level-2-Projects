-- Database Schema for Indian Income-Tax Comparative Analysis & Calculation System
-- Offline-first SQLite normalized database

CREATE TABLE IF NOT EXISTS db_version (
    version_number INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    pin_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS comparison_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    chapter TEXT,
    provision_1961 TEXT NOT NULL,
    provision_2025 TEXT NOT NULL,
    section_1961 TEXT NOT NULL,
    section_2025 TEXT NOT NULL,
    key_change TEXT NOT NULL,
    practical_impact TEXT NOT NULL,
    applicability_date TEXT NOT NULL,
    taxpayer_categories TEXT NOT NULL, -- comma separated: Individual,HUF,Company,etc.
    source_reference TEXT NOT NULL,
    notes TEXT,
    change_type TEXT NOT NULL CHECK(change_type IN ('changed', 'new', 'deleted', 'unchanged', 'requires_review')),
    is_active INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_slabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    act_name TEXT NOT NULL, -- 'Income-tax Act, 1961' or 'Income-tax Act, 2025'
    regime TEXT NOT NULL, -- 'Old Regime' or 'New Regime'
    financial_year TEXT NOT NULL, -- '2024-25', '2025-26', etc.
    assessment_year TEXT NOT NULL, -- '2025-26', '2026-27', etc.
    taxpayer_category TEXT NOT NULL, -- 'Individual (Below 60)', 'Senior Citizen', 'Super Senior Citizen', 'Company', 'Firm'
    slab_min REAL NOT NULL,
    slab_max REAL, -- NULL means infinity / above
    tax_rate_percent REAL NOT NULL,
    source_reference TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tax_rebates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    act_name TEXT NOT NULL,
    regime TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    max_income_limit REAL NOT NULL,
    max_rebate_amount REAL NOT NULL,
    section_ref TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS surcharge_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    act_name TEXT NOT NULL,
    regime TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    taxpayer_category TEXT NOT NULL,
    min_income REAL NOT NULL,
    max_income REAL,
    surcharge_rate_percent REAL NOT NULL,
    marginal_relief_applicable INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cess_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    financial_year TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    cess_name TEXT NOT NULL,
    cess_rate_percent REAL NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS deduction_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    act_name TEXT NOT NULL,
    regime TEXT NOT NULL,
    section_ref TEXT NOT NULL,
    name TEXT NOT NULL,
    max_limit REAL,
    eligible_categories TEXT NOT NULL,
    source_reference TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1,
    last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tds_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    nature_of_payment TEXT NOT NULL,
    applicable_payer TEXT NOT NULL,
    applicable_deductee TEXT NOT NULL,
    resident_rate REAL NOT NULL,
    non_resident_rate REAL NOT NULL,
    rate_without_pan REAL NOT NULL,
    threshold_limit REAL NOT NULL,
    threshold_type TEXT NOT NULL, -- 'annual' or 'single_transaction'
    effective_date TEXT NOT NULL,
    applicable_surcharge REAL NOT NULL DEFAULT 0.0,
    applicable_cess REAL NOT NULL DEFAULT 0.0,
    lower_ded_cert_allowed INTEGER NOT NULL DEFAULT 1,
    exemptions TEXT,
    remarks TEXT,
    source_reference TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS advance_tax_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    financial_year TEXT NOT NULL,
    instalment_number INTEGER NOT NULL,
    due_date TEXT NOT NULL,
    cumulative_percent REAL NOT NULL,
    description TEXT,
    is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calculation_type TEXT NOT NULL, -- 'advance_tax', 'tds', 'comparison'
    taxpayer_name TEXT,
    pan_masked TEXT,
    financial_year TEXT NOT NULL,
    assessment_year TEXT NOT NULL,
    regime TEXT,
    inputs_json TEXT NOT NULL,
    results_json TEXT NOT NULL,
    rules_applied_json TEXT,
    audit_trail_json TEXT,
    created_at TEXT NOT NULL,
    tags TEXT,
    is_favourite INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comparison_bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER NOT NULL,
    user_note TEXT,
    bookmarked_at TEXT NOT NULL,
    FOREIGN KEY(rule_id) REFERENCES comparison_rules(id)
);

CREATE TABLE IF NOT EXISTS export_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    calculation_id INTEGER,
    export_type TEXT NOT NULL, -- 'excel', 'word', 'pdf'
    file_path TEXT NOT NULL,
    generated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT
);
