-- ====================================================================
-- NIVESHA VENTURES - COMPLETE SUPABASE POSTGRESQL SCHEMA & INITIAL DATA
-- Execute this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New query -> Paste & Run
-- ====================================================================

-- 1. Create Enums / Types
DO $$ BEGIN
    CREATE TYPE userrole AS ENUM ('INVESTOR', 'FOUNDER', 'REVIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE connectionstatus AS ENUM ('REQUESTED', 'APPROVED', 'CONNECTED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE verificationstatus AS ENUM ('VERIFIED', 'PARTIALLY_VERIFIED', 'UNDER_REVIEW', 'DRAFT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE matchoutcome AS ENUM ('POTENTIALLY_SUITABLE', 'UNSUITABLE', 'NEEDS_MORE_INFORMATION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reviewstage AS ENUM ('DRAFT', 'AWAITING_REVIEW', 'APPROVED_FOR_FACILITATION', 'APPOINTMENT_REQUESTED', 'APPOINTMENT_SCHEDULED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointmentstatus AS ENUM ('REQUESTED', 'CONFIRMED_SIMULATED', 'DECLINED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Tables

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(256) NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    role userrole NOT NULL DEFAULT 'FOUNDER',
    firm_or_company VARCHAR(128),
    title VARCHAR(128),
    bio TEXT,
    avatar_url VARCHAR(256),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

CREATE TABLE IF NOT EXISTS ventures (
    id VARCHAR(36) PRIMARY KEY,
    founder_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    company_name VARCHAR(128) NOT NULL,
    tag_line VARCHAR(256) NOT NULL DEFAULT '',
    business_context TEXT NOT NULL DEFAULT '',
    sector VARCHAR(64) NOT NULL,
    location VARCHAR(64) NOT NULL,
    stage VARCHAR(64) NOT NULL,
    capital_target FLOAT NOT NULL DEFAULT 1000000.0,
    ticket_min FLOAT,
    ticket_max FLOAT,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    capital_structures JSONB NOT NULL DEFAULT '[]'::jsonb,
    pitch_deck_url VARCHAR(256),
    video_url VARCHAR(256),
    hero_image_url VARCHAR(512),
    gallery_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_status verificationstatus NOT NULL DEFAULT 'UNDER_REVIEW',
    traction_metrics JSONB NOT NULL DEFAULT '[]'::jsonb,
    diligence_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    custom_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    proposed_arrangement VARCHAR(64) NOT NULL DEFAULT 'LOAN',
    arrangement_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    operating_track_record JSONB NOT NULL DEFAULT '{}'::jsonb,
    growth_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    continuity_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
    due_diligence_findings JSONB NOT NULL DEFAULT '{}'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    venture_story JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_ventures_founder ON ventures (founder_id);
CREATE INDEX IF NOT EXISTS ix_ventures_sector ON ventures (sector);
CREATE INDEX IF NOT EXISTS ix_ventures_status ON ventures (verification_status);

CREATE TABLE IF NOT EXISTS investor_mandates (
    id VARCHAR(36) PRIMARY KEY,
    investor_id VARCHAR(36) NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    firm_name VARCHAR(128) NOT NULL,
    target_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_stages JSONB NOT NULL DEFAULT '[]'::jsonb,
    locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    ticket_min FLOAT,
    ticket_max FLOAT,
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    acceptable_structures JSONB NOT NULL DEFAULT '[]'::jsonb,
    thesis_summary TEXT,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    accepted_arrangements JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_horizon VARCHAR(64) NOT NULL DEFAULT '3_TO_5_YEARS',
    desired_involvement VARCHAR(64) NOT NULL DEFAULT 'PASSIVE',
    willing_to_follow_up VARCHAR(64) NOT NULL DEFAULT 'PERIODIC_CHECK_IN',
    mandatory_sectors JSONB NOT NULL DEFAULT '[]'::jsonb,
    mandatory_arrangements JSONB NOT NULL DEFAULT '[]'::jsonb,
    flexible_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_investor_mandates_investor ON investor_mandates (investor_id);

CREATE TABLE IF NOT EXISTS match_cases (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL REFERENCES ventures (id) ON DELETE CASCADE,
    mandate_id VARCHAR(36) NOT NULL REFERENCES investor_mandates (id) ON DELETE CASCADE,
    venture_version INTEGER NOT NULL DEFAULT 1,
    mandate_version INTEGER NOT NULL DEFAULT 1,
    outcome matchoutcome NOT NULL DEFAULT 'NEEDS_MORE_INFORMATION',
    compatibility_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    mandatory_mismatches JSONB NOT NULL DEFAULT '[]'::jsonb,
    trade_offs JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_information JSONB NOT NULL DEFAULT '[]'::jsonb,
    rule_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    review_stage reviewstage NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_match_cases_venture ON match_cases (venture_id);
CREATE INDEX IF NOT EXISTS ix_match_cases_mandate ON match_cases (mandate_id);

CREATE TABLE IF NOT EXISTS appointment_requests (
    id VARCHAR(36) PRIMARY KEY,
    match_case_id VARCHAR(36) REFERENCES match_cases (id) ON DELETE CASCADE,
    venture_id VARCHAR(36) NOT NULL REFERENCES ventures (id) ON DELETE CASCADE,
    investor_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    founder_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    requested_by userrole NOT NULL DEFAULT 'INVESTOR',
    meeting_purpose VARCHAR(256) NOT NULL,
    sharing_scope VARCHAR(256) NOT NULL,
    preferred_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    status appointmentstatus NOT NULL DEFAULT 'REQUESTED',
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_appts_venture ON appointment_requests (venture_id);
CREATE INDEX IF NOT EXISTS ix_appts_investor ON appointment_requests (investor_id);
CREATE INDEX IF NOT EXISTS ix_appts_founder ON appointment_requests (founder_id);

CREATE TABLE IF NOT EXISTS connections (
    id VARCHAR(36) PRIMARY KEY,
    venture_id VARCHAR(36) NOT NULL REFERENCES ventures (id) ON DELETE CASCADE,
    investor_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status connectionstatus NOT NULL DEFAULT 'REQUESTED',
    requested_by userrole NOT NULL DEFAULT 'INVESTOR',
    investor_consent BOOLEAN NOT NULL DEFAULT FALSE,
    founder_consent BOOLEAN NOT NULL DEFAULT FALSE,
    reviewer_approved BOOLEAN NOT NULL DEFAULT TRUE,
    request_note TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    connected_at TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS ix_connections_venture ON connections (venture_id);
CREATE INDEX IF NOT EXISTS ix_connections_investor ON connections (investor_id);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(36) PRIMARY KEY,
    connection_id VARCHAR(36) NOT NULL REFERENCES connections (id) ON DELETE CASCADE,
    sender_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    recipient_id VARCHAR(36) NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_messages_connection ON messages (connection_id);
CREATE INDEX IF NOT EXISTS ix_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS ix_messages_recipient ON messages (recipient_id);

CREATE TABLE IF NOT EXISTS onboarding_questions (
    id VARCHAR(36) PRIMARY KEY,
    section VARCHAR(64) NOT NULL,
    question_key VARCHAR(64) NOT NULL UNIQUE,
    label VARCHAR(256) NOT NULL,
    description TEXT,
    question_type VARCHAR(32) NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    placeholder VARCHAR(128),
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    "order" INTEGER NOT NULL DEFAULT 1
);

-- ====================================================================
-- SEED INITIAL DATA (Platform Desk, Coherent Restaurant, Mandates)
-- ====================================================================

-- 1. Reviewer Desk User (password: password123, bcrypt hash)
INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-reviewer-01',
    'reviewer@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Platform Review Desk',
    'REVIEWER',
    'Nivesha Ventures',
    'Head of Due Diligence & Matching',
    'Independent reviewer facilitating venture evaluation, evidence audits, and introduction appointments.'
) ON CONFLICT (id) DO NOTHING;

-- 2. Founder User
INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-restaurant',
    'founder@malabarcoast.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Arvind Nair',
    'FOUNDER',
    'The Malabar Coast Kitchen',
    'Founder & Managing Operator',
    'Culinary entrepreneur with 10 years experience operating high-repeat coastal Indian kitchens in Bengaluru.'
) ON CONFLICT (id) DO NOTHING;

-- 3. Investors
INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-investor-01',
    'investor@peakindia.vc',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Rohan Varma',
    'INVESTOR',
    'Varma Capital Partners',
    'Managing Partner',
    'Private credit and growth capital investor focusing on cash-flow generative consumer and hospitality businesses.'
) ON CONFLICT (id) DO NOTHING;

-- 4. Additional Venture Founders (One Account per Venture)
INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-film',
    'film.producer@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Raghavendra Rao',
    'FOUNDER',
    'Vayuputra Productions',
    'Managing Producer & Director',
    'Producer of mythological fantasy action film Garuda.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-shoe',
    'footwear.founder@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Vikramaditya Sahni',
    'FOUNDER',
    'StrideCraft Footwear (Aethel Brand)',
    'Chief Executive & Founder',
    'Footwear manufacturer scaling celebrity D2C line.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-debt',
    'debt.founder@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Suresh Chandra Patra',
    'FOUNDER',
    'Apex Precision Engineering',
    'Managing Director',
    'Industrial CNC manufacturer seeking 18% debt backed by 3 BHK flat.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-logistics',
    'logistics.founder@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Sravani Reddy',
    'FOUNDER',
    'GramaBlink Hyperlocal Logistics',
    'Founder & CEO',
    'Rural logistics quick-commerce network via DWACRA women SHGs.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-healthcare',
    'healthcare.founder@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Dr. Hariprasad Varma',
    'FOUNDER',
    'Varma Multispeciality Care',
    'Medical Director & Senior Surgeon',
    '120-bed tertiary hospital seeking 50% equity buyout & Cath Lab capex.'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, email, password_hash, full_name, role, firm_or_company, title, bio)
VALUES (
    'usr-founder-realestate',
    'realestate.founder@nivesha.in',
    '$2b$10$v0k49Z2mN6Pz.C7yUe3a7OUJ0X9R7qH2f61E6aK8tqQ7dJ1rN4cCe',
    'Karthik Narayana',
    'FOUNDER',
    'Greenfield Land Developers',
    'Managing Partner',
    '18-acre plotted township layout developer near Hyderabad corridor.'
) ON CONFLICT (id) DO NOTHING;
