-- ============================================
-- Resource Management Database Schema
-- ============================================

-- Tabelle für Ressourcen-Einträge von Dienstleistern
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    service_provider_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    
    -- Zeitraum
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Ressourcen-Details
    person_count INTEGER NOT NULL CHECK (person_count > 0),
    daily_hours DECIMAL(4,2) DEFAULT 8.00,
    total_hours DECIMAL(10,2) GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (end_date - start_date)) / 86400 * person_count * daily_hours
    ) STORED,
    
    -- Kategorie (gleich wie Ausschreibungskategorien)
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Adresse
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_postal_code VARCHAR(20),
    address_country VARCHAR(100) DEFAULT 'Deutschland',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Status
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'allocated', 'completed', 'cancelled')),
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'restricted')),
    
    -- Preise (optional)
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Zusätzliche Informationen
    description TEXT,
    skills JSON, -- Array von Fähigkeiten/Zertifikaten
    equipment JSON, -- Array von verfügbaren Geräten/Werkzeugen
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabelle für Ressourcen-Allokationen (Zuordnungen zu Ausschreibungen)
CREATE TABLE IF NOT EXISTS resource_allocations (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    quote_id INTEGER REFERENCES quotes(id) ON DELETE SET NULL,
    
    -- Allokations-Details
    allocated_person_count INTEGER NOT NULL CHECK (allocated_person_count > 0),
    allocated_start_date DATE NOT NULL,
    allocated_end_date DATE NOT NULL,
    allocated_hours DECIMAL(10,2),
    
    -- Status
    allocation_status VARCHAR(50) DEFAULT 'pre_selected' 
        CHECK (allocation_status IN ('pre_selected', 'invited', 'offer_requested', 'offer_submitted', 'accepted', 'rejected', 'completed')),
    
    -- Preise bei Allokation
    agreed_hourly_rate DECIMAL(10,2),
    agreed_daily_rate DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    
    -- Benachrichtigungen
    invitation_sent_at TIMESTAMP,
    invitation_viewed_at TIMESTAMP,
    offer_requested_at TIMESTAMP,
    offer_submitted_at TIMESTAMP,
    decision_made_at TIMESTAMP,
    
    -- Zusätzliche Infos
    notes TEXT,
    rejection_reason TEXT,
    priority INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

-- Tabelle für Ressourcen-Anfragen (von Bauträgern)
CREATE TABLE IF NOT EXISTS resource_requests (
    id SERIAL PRIMARY KEY,
    trade_id INTEGER NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    requested_by INTEGER NOT NULL REFERENCES users(id),
    
    -- Anfrage-Details
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    required_person_count INTEGER NOT NULL,
    required_start_date DATE NOT NULL,
    required_end_date DATE NOT NULL,
    
    -- Standort-Anforderungen
    location_address VARCHAR(255),
    location_city VARCHAR(100),
    location_postal_code VARCHAR(20),
    max_distance_km DECIMAL(6,2), -- Maximaler Radius für Ressourcensuche
    
    -- Budget
    max_hourly_rate DECIMAL(10,2),
    max_total_budget DECIMAL(12,2),
    
    -- Anforderungen
    required_skills JSON,
    required_equipment JSON,
    requirements_description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open' 
        CHECK (status IN ('open', 'searching', 'partially_filled', 'filled', 'cancelled')),
    
    -- Statistiken
    total_resources_found INTEGER DEFAULT 0,
    total_resources_selected INTEGER DEFAULT 0,
    total_offers_received INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline_at TIMESTAMP
);

-- Tabelle für Ressourcen-Kalender (für visuelle Darstellung)
CREATE TABLE IF NOT EXISTS resource_calendar_entries (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER REFERENCES resources(id) ON DELETE CASCADE,
    allocation_id INTEGER REFERENCES resource_allocations(id) ON DELETE CASCADE,
    service_provider_id INTEGER NOT NULL REFERENCES users(id),
    
    -- Kalender-Eintrag
    entry_date DATE NOT NULL,
    person_count INTEGER NOT NULL,
    hours_allocated DECIMAL(4,2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'available' 
        CHECK (status IN ('available', 'tentative', 'confirmed', 'in_progress', 'completed')),
    
    -- Visueller Stil
    color VARCHAR(7), -- HEX Color code
    label VARCHAR(100),
    
    -- Index für schnelle Abfragen
    UNIQUE(resource_id, entry_date)
);

-- Tabelle für Ressourcen-KPIs
CREATE TABLE IF NOT EXISTS resource_kpis (
    id SERIAL PRIMARY KEY,
    service_provider_id INTEGER NOT NULL REFERENCES users(id),
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- KPI-Metriken
    total_resources_available INTEGER DEFAULT 0,
    total_resources_allocated INTEGER DEFAULT 0,
    total_resources_completed INTEGER DEFAULT 0,
    
    total_person_days_available DECIMAL(10,2) DEFAULT 0,
    total_person_days_allocated DECIMAL(10,2) DEFAULT 0,
    total_person_days_completed DECIMAL(10,2) DEFAULT 0,
    
    utilization_rate DECIMAL(5,2), -- Prozent
    average_hourly_rate DECIMAL(10,2),
    total_revenue DECIMAL(12,2),
    
    -- Zeiträume
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint für Provider und Datum
    UNIQUE(service_provider_id, calculation_date)
);

-- Indices für Performance
CREATE INDEX idx_resources_provider ON resources(service_provider_id);
CREATE INDEX idx_resources_dates ON resources(start_date, end_date);
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_status ON resources(status);
CREATE INDEX idx_resources_location ON resources(latitude, longitude);

CREATE INDEX idx_allocations_resource ON resource_allocations(resource_id);
CREATE INDEX idx_allocations_trade ON resource_allocations(trade_id);
CREATE INDEX idx_allocations_status ON resource_allocations(allocation_status);

CREATE INDEX idx_requests_trade ON resource_requests(trade_id);
CREATE INDEX idx_requests_status ON resource_requests(status);
CREATE INDEX idx_requests_dates ON resource_requests(required_start_date, required_end_date);

CREATE INDEX idx_calendar_provider ON resource_calendar_entries(service_provider_id);
CREATE INDEX idx_calendar_date ON resource_calendar_entries(entry_date);
CREATE INDEX idx_calendar_resource_date ON resource_calendar_entries(resource_id, entry_date);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON resources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_allocations_updated_at BEFORE UPDATE ON resource_allocations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_resource_requests_updated_at BEFORE UPDATE ON resource_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views für häufige Abfragen
CREATE OR REPLACE VIEW available_resources_view AS
SELECT 
    r.*,
    u.company_name as provider_name,
    u.email as provider_email,
    COUNT(DISTINCT ra.id) as active_allocations,
    COALESCE(SUM(ra.allocated_person_count), 0) as total_allocated_persons
FROM resources r
LEFT JOIN users u ON r.service_provider_id = u.id
LEFT JOIN resource_allocations ra ON r.id = ra.resource_id 
    AND ra.allocation_status IN ('accepted', 'offer_submitted')
WHERE r.status = 'available'
    AND r.end_date >= CURRENT_DATE
GROUP BY r.id, u.id;

-- View für Ressourcen-Dashboard
CREATE OR REPLACE VIEW resource_dashboard_view AS
SELECT 
    sp.id as service_provider_id,
    sp.company_name,
    COUNT(DISTINCT r.id) as total_resources,
    COUNT(DISTINCT CASE WHEN r.status = 'available' THEN r.id END) as available_resources,
    COUNT(DISTINCT CASE WHEN r.status = 'allocated' THEN r.id END) as allocated_resources,
    SUM(r.person_count) as total_persons,
    SUM(CASE WHEN r.status = 'available' THEN r.person_count ELSE 0 END) as available_persons,
    SUM(CASE WHEN r.status = 'allocated' THEN r.person_count ELSE 0 END) as allocated_persons,
    AVG(r.hourly_rate) as avg_hourly_rate,
    MIN(r.start_date) as earliest_availability,
    MAX(r.end_date) as latest_availability
FROM users sp
LEFT JOIN resources r ON sp.id = r.service_provider_id
WHERE sp.role = 'service_provider'
GROUP BY sp.id, sp.company_name;